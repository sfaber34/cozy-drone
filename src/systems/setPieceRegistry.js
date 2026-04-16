// Set-piece registry + placement.
//
// Goal: let GameScene declare set pieces with an optional tileX/tileY. When
// both are specified, the set piece goes exactly there. When either is
// omitted, the placer picks a random non-overlapping spot on the map.
//
// The placer guarantees:
// 1. No two set-piece FOOTPRINTS overlap (including a padding gap).
// 2. Footprints stay inside the world (accounting for a margin).
// 3. Larger set pieces are placed first, so they always have room.
// 4. "Best of K" sampling — picks the random candidate with the largest
//    minimum distance to everything already placed. This spreads pieces
//    out without making them perfectly grid-uniform (looks natural).
//
// Each set-piece factory anchors its own geometry on `{tileX, tileY}`, but
// the bounds *center* it returns is sometimes offset from that anchor (e.g.
// the town is drawn top-left-anchored, the oilfield center shifts down
// 125 px). The registry records that offset per type so placement math can
// center the collision box on the true bounds center, not the factory anchor.
import {
  TILE, SCALE, WORLD_W, WORLD_H,
  SET_PIECE_PLACE_MARGIN_PX, SET_PIECE_PLACE_GAP_PX,
  SET_PIECE_PLACE_BEST_OF_K, SET_PIECE_PLACE_MAX_TRIES,
} from "../constants.js";

import { createTown } from "./townSystem.js";
import { createFarmCompound } from "./farmCompoundSystem.js";
import { createSheepFlock } from "./sheepFlockSystem.js";
import { createOilfield } from "./oilfieldSystem.js";
import { createWedding } from "./weddingSetup.js";
import { createSoccer } from "./soccerSystem.js";
import { createChickenFight } from "./chickenFightSystem.js";
import { createCamelRace } from "./camelRaceSystem.js";
import { createRockFight } from "./rockFightSystem.js";
import { createFarmField } from "./farmFieldSystem.js";
import { createConcert } from "./concertSystem.js";
import { createTireFire } from "./tireFireSystem.js";
import { createRockTarget } from "./rockTargetSystem.js";
import { createHookah } from "./hookahSystem.js";
import { createRcCar } from "./rcCarSystem.js";
import { createPaperPlane } from "./paperPlaneSystem.js";

// Footprint in PIXELS. hw/hh are half-width/half-height of the bounding box
// around the set piece. anchorOffsetX/Y is the pixel offset from the
// factory's (tileX * TILE * SCALE, tileY * TILE * SCALE) anchor to the
// bounding-box center — needed so collision detection centers on the real
// extent, not an asymmetric anchor.
// All values in PIXELS. Each entry was derived by reading the factory and
// expanding its bounds expression against the relevant constants (don't
// eyeball — the formulas in the factories are the source of truth). If a
// factory's bounds expression changes, update the corresponding row here.
export const SET_PIECE_META = {
  // town: townW = TOWN_GRID_COLS*(TOWN_BLOCK_SIZE+1)+1 = 57 tiles × 48px = 2736px.
  //   hw/hh = widthPx/2 = 1368. anchorOffset = widthPx/2 (bounds center is
  //   townStartX+widthPx/2; anchor is townStartX).
  town:         { factory: createTown,         hw: 1368, hh: 1368, anchorOffsetX: 1368, anchorOffsetY: 1368 },
  farmCompound: { factory: createFarmCompound, hw: 346,  hh: 304,  anchorOffsetX: 48,   anchorOffsetY: 10  },
  sheepFlock:   { factory: createSheepFlock,   hw: 540,  hh: 540,  anchorOffsetX: 0,    anchorOffsetY: 0   },
  oilfield:     { factory: createOilfield,     hw: 700,  hh: 475,  anchorOffsetX: 0,    anchorOffsetY: 125 },
  wedding:      { factory: createWedding,      hw: 250,  hh: 175,  anchorOffsetX: 0,    anchorOffsetY: 0   },
  soccer:       { factory: createSoccer,       hw: 205,  hh: 155,  anchorOffsetX: 0,    anchorOffsetY: 0   },
  chickenFight: { factory: createChickenFight, hw: 200,  hh: 200,  anchorOffsetX: 0,    anchorOffsetY: 0   },
  camelRace:    { factory: createCamelRace,    hw: 312,  hh: 264,  anchorOffsetX: 0,    anchorOffsetY: 0   },
  rockFight:    { factory: createRockFight,    hw: 310,  hh: 210,  anchorOffsetX: 0,    anchorOffsetY: 0   },
  farmField:    { factory: createFarmField,    hw: 800,  hh: 600,  anchorOffsetX: 0,    anchorOffsetY: 0   },
  // concert: stage spans cy ± 40, crowd spans cy+64 → cy+324, so bounds
  //   center = (cy-40 + cy+324)/2 = cy+142; hh = (364)/2 = 182.
  concert:      { factory: createConcert,      hw: 210,  hh: 182,  anchorOffsetX: 0,    anchorOffsetY: 142 },
  tireFire:     { factory: createTireFire,     hw: 125,  hh: 125,  anchorOffsetX: 0,    anchorOffsetY: 0   },
  rockTarget:   { factory: createRockTarget,   hw: 205,  hh: 170,  anchorOffsetX: 0,    anchorOffsetY: -110 },
  hookah:       { factory: createHookah,       hw: 236,  hh: 76,   anchorOffsetX: 0,    anchorOffsetY: 0   },
  rcCar:        { factory: createRcCar,        hw: 255,  hh: 205,  anchorOffsetX: 0,    anchorOffsetY: 0   },
  paperPlane:   { factory: createPaperPlane,   hw: 720,  hh: 720,  anchorOffsetX: 0,    anchorOffsetY: 0   },
};

const MAP_W = WORLD_W * TILE * SCALE;
const MAP_H = WORLD_H * TILE * SCALE;
const TILE_PX = TILE * SCALE;

// Rectangle from a bounds center + meta (used for overlap tests).
function rectFromBoundsCenter(cx, cy, meta) {
  return {
    left:   cx - meta.hw,
    right:  cx + meta.hw,
    top:    cy - meta.hh,
    bottom: cy + meta.hh,
    cx, cy,
  };
}

// Rectangle given explicit tileX/tileY (accounting for anchor offset).
function rectFromTile(tileX, tileY, meta) {
  const cx = tileX * TILE_PX + meta.anchorOffsetX;
  const cy = tileY * TILE_PX + meta.anchorOffsetY;
  return rectFromBoundsCenter(cx, cy, meta);
}

// AABB overlap including an extra `gap` padding on every side.
function rectsOverlap(a, b, gap) {
  return !(
    a.right  + gap < b.left ||
    b.right  + gap < a.left ||
    a.bottom + gap < b.top  ||
    b.bottom + gap < a.top
  );
}

// Center-to-center distance used for the "pick the loneliest candidate" score.
function centerDist(a, b) {
  const dx = a.cx - b.cx;
  const dy = a.cy - b.cy;
  return Math.sqrt(dx * dx + dy * dy);
}

// Random bounds-center candidate for a set piece. Keeps the whole footprint
// inside [margin, mapSize - margin] on each axis.
function pickCandidate(rng, meta) {
  const minCx = meta.hw + SET_PIECE_PLACE_MARGIN_PX;
  const maxCx = MAP_W - meta.hw - SET_PIECE_PLACE_MARGIN_PX;
  const minCy = meta.hh + SET_PIECE_PLACE_MARGIN_PX;
  const maxCy = MAP_H - meta.hh - SET_PIECE_PLACE_MARGIN_PX;
  // Guard against impossible fit (set piece too large for the map).
  if (maxCx <= minCx || maxCy <= minCy) return null;
  return rectFromBoundsCenter(
    rng.between(minCx, maxCx),
    rng.between(minCy, maxCy),
    meta,
  );
}

/**
 * Place a batch of set pieces.
 *
 * @param {Phaser.Scene} scene
 * @param {Phaser.Math.RandomDataGenerator} rng
 * @param {Array<{type: string, tileX?: number, tileY?: number}>} spawnList
 * @param {Array<{left, right, top, bottom, cx, cy}>} [reservedRects]
 *        Extra reserved rectangles (e.g. the airfield) so auto-placed set
 *        pieces don't overlap them.
 * @returns {Array} created instances, in the same order as spawnList.
 */
export function placeSetPieces(scene, rng, spawnList, reservedRects = []) {
  const reserved = [...reservedRects];
  const instances = new Array(spawnList.length);

  // --- Pass 1: explicit placements (both tileX and tileY specified) ---
  const autoIndices = [];
  for (let i = 0; i < spawnList.length; i++) {
    const spawn = spawnList[i];
    const meta = SET_PIECE_META[spawn.type];
    if (!meta) throw new Error(`Unknown set piece type: ${spawn.type}`);

    if (spawn.tileX != null && spawn.tileY != null) {
      instances[i] = meta.factory(scene, rng, { tileX: spawn.tileX, tileY: spawn.tileY });
      reserved.push(rectFromTile(spawn.tileX, spawn.tileY, meta));
    } else {
      autoIndices.push(i);
    }
  }

  // --- Pass 2: auto placements, largest footprint first. ---
  // Larger pieces go first so they get first pick of open real estate and
  // can't be boxed in by small pieces placed in dumb spots.
  autoIndices.sort((a, b) => {
    const ma = SET_PIECE_META[spawnList[a].type];
    const mb = SET_PIECE_META[spawnList[b].type];
    return (mb.hw * mb.hh) - (ma.hw * ma.hh);
  });

  for (const i of autoIndices) {
    const spawn = spawnList[i];
    const meta = SET_PIECE_META[spawn.type];

    // Best-of-K sampling: collect up to K valid candidates, pick the one
    // with the largest minimum distance to everything already placed.
    // This yields an informally uniform spread without the grid-regular
    // look of a strict Poisson-disk sampler.
    let best = null;
    let bestScore = -Infinity;
    let validCount = 0;
    for (let t = 0; t < SET_PIECE_PLACE_MAX_TRIES && validCount < SET_PIECE_PLACE_BEST_OF_K; t++) {
      const cand = pickCandidate(rng, meta);
      if (!cand) break;
      let overlaps = false;
      for (const r of reserved) {
        if (rectsOverlap(cand, r, SET_PIECE_PLACE_GAP_PX)) { overlaps = true; break; }
      }
      if (overlaps) continue;

      // Distance-to-nearest-reserved as a spread score. If nothing is
      // reserved yet (first auto spawn), any candidate is equally fine.
      let minD = Infinity;
      for (const r of reserved) minD = Math.min(minD, centerDist(cand, r));
      if (reserved.length === 0) minD = 0;

      if (minD > bestScore) { bestScore = minD; best = cand; }
      validCount++;
    }

    // Fallback: relax the gap to zero and keep trying if nothing fit.
    if (!best) {
      for (let t = 0; t < SET_PIECE_PLACE_MAX_TRIES; t++) {
        const cand = pickCandidate(rng, meta);
        if (!cand) break;
        let overlaps = false;
        for (const r of reserved) {
          if (rectsOverlap(cand, r, 0)) { overlaps = true; break; }
        }
        if (!overlaps) { best = cand; break; }
      }
    }

    if (!best) {
      console.warn(`[setPieceRegistry] No valid placement for "${spawn.type}" — skipping.`);
      continue;
    }

    // Convert bounds-center back to the factory's anchor tile coords.
    const anchorX = best.cx - meta.anchorOffsetX;
    const anchorY = best.cy - meta.anchorOffsetY;
    const tileX = anchorX / TILE_PX;
    const tileY = anchorY / TILE_PX;
    instances[i] = meta.factory(scene, rng, { tileX, tileY });
    reserved.push(best);
  }

  return instances.filter((x) => x != null);
}

/** Build a reserved rect from an already-placed set piece's `bounds`. */
export function reservedRectFromBounds(b) {
  return {
    left:   b.cx - b.hw,
    right:  b.cx + b.hw,
    top:    b.cy - b.hh,
    bottom: b.cy + b.hh,
    cx: b.cx, cy: b.cy,
  };
}
