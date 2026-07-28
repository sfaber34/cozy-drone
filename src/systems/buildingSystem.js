import Phaser from "phaser";
import {
  SCALE, MOBILE_DIALOG_SCALE,
  BUILDING_HP_SMALL, BUILDING_HP_MEDIUM, BUILDING_HP_LARGE,
  BUILDING_RADIUS_SMALL, BUILDING_RADIUS_MEDIUM, BUILDING_RADIUS_LARGE,
  UI_FONT,
  GHOST_TEXT_COLOR,
} from "../constants.js";
import { buildingGhostLines } from "../dialog.js";
import { playDeathSfxAt } from "./audioSystem.js";
import { tryRegisterGhostBubble } from "./ghostBubbleUtils.js";

// Initializes scene.buildings and registers the scene._addBuilding helper.
// The actual set pieces (town, farm compound, oilfield, ...) are built by
// their own factory modules and call scene._addBuilding directly.
export function createBuildings(scene, rng) {
  scene.buildings = [];
  const bldgHp = { small: BUILDING_HP_SMALL, medium: BUILDING_HP_MEDIUM, large: BUILDING_HP_LARGE };

  // Rectangular half-extents per texture (pixels at SCALE, + small pad).
  // Each texture has a known pixel size; multiply by SCALE/2 for the
  // half-extent, then add a few px of padding so people don't graze edges.
  // Padding accounts for the person sprite's half-width (~15 px at SCALE=3)
  // so people's EDGES don't overlap building EDGES. Without this, a person
  // can stand with their center just outside the building rect while their
  // body visually covers the building corner.
  const PAD = 22;
  const texExtents = {
    'house':       { hw: (16 * SCALE) / 2 + PAD, hh: (12 * SCALE) / 2 + PAD },
    'building':    { hw: (32 * SCALE) / 2 + PAD, hh: (24 * SCALE) / 2 + PAD },
    'apartment':   { hw: (24 * SCALE) / 2 + PAD, hh: (32 * SCALE) / 2 + PAD },
    'hospital':    { hw: (32 * SCALE) / 2 + PAD, hh: (32 * SCALE) / 2 + PAD },
    'church':      { hw: (16 * SCALE) / 2 + PAD, hh: (24 * SCALE) / 2 + PAD },
    'shop':        { hw: (16 * SCALE) / 2 + PAD, hh: (10 * SCALE) / 2 + PAD },
    'gas-station': { hw: (20 * SCALE) / 2 + PAD, hh: (16 * SCALE) / 2 + PAD },
    'hut':         { hw: (12 * SCALE) / 2 + PAD, hh: (12 * SCALE) / 2 + PAD },
    'silo':        { hw: (20 * SCALE) / 2 + PAD, hh: (20 * SCALE) / 2 + PAD },
    'barn':        { hw: (24 * SCALE) / 2 + PAD, hh: (32 * SCALE) / 2 + PAD },
  };
  // Fallback for unknown textures
  const defaultExtent = { hw: 30, hh: 30 };

  const addBuilding = (x, y, tex, size, tint) => {
    const sprite = scene.add.image(x, y, tex).setScale(SCALE).setDepth(2);
    if (tint) sprite.setTint(tint);
    const ext = texExtents[tex] || defaultExtent;
    const b = {
      sprite,
      tex,
      size,
      hp: bldgHp[size],
      maxHp: bldgHp[size],
      // Rectangular no-go zone matching the actual texture dimensions.
      hw: ext.hw,
      hh: ext.hh,
      // Keep radius as max(hw,hh) for legacy circular checks (missile/cannon hit detection)
      radius: Math.max(ext.hw, ext.hh),
      x,
      y,
      destroyed: false,
      cracksSprite: null,
      fireSprites: [],
    };
    scene.buildings.push(b);
    return b;
  };

  // Store addBuilding for set-piece factories (oilfield, town, farm, ...) to use
  scene._addBuilding = addBuilding;
}

// --- Spatial grid for per-point building queries -----------------------
// Buildings are static (they get destroyed but never move), so bucket them
// once into a coarse grid. The per-frame, per-person avoidance checks
// (pushOutOfBuildings / isInsideBuilding / steerAroundBuildings) then look at
// only the buildings in the query point's own cell instead of all ~360 —
// collapsing an O(people × buildings) hot loop (the "shoot a building →
// crowd panics → frame stutters" bug) down to O(people). Each building is
// stored in every cell its footprint (expanded by GRID_MARGIN, which covers
// the person half-extent + steer lookahead) overlaps, so a single point→cell
// lookup returns every building that could affect that point — no neighbor
// scan needed.
const GRID_CELL = 128;
const GRID_MARGIN = 80;
const NO_BUILDINGS = [];

// Numeric cell key; offset keeps it positive/collision-free for the world's
// small cell range (world is ~60 cells across; moat pushes a few negative).
function cellKey(cx, cy) {
  return (cx + 1024) * 100000 + (cy + 1024);
}

export function buildBuildingGrid(scene) {
  const grid = new Map();
  for (const b of scene.buildings) {
    const bHW = (b.hw || b.radius) + GRID_MARGIN;
    const bHH = (b.hh || b.radius) + GRID_MARGIN;
    const minCx = Math.floor((b.x - bHW) / GRID_CELL);
    const maxCx = Math.floor((b.x + bHW) / GRID_CELL);
    const minCy = Math.floor((b.y - bHH) / GRID_CELL);
    const maxCy = Math.floor((b.y + bHH) / GRID_CELL);
    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const key = cellKey(cx, cy);
        let arr = grid.get(key);
        if (!arr) {
          arr = [];
          grid.set(key, arr);
        }
        arr.push(b);
      }
    }
  }
  scene._buildingGrid = grid;
}

// Buildings whose footprint could affect the point (px, py). Falls back to
// the full list if the grid hasn't been built yet (early world-init calls).
function buildingsNear(scene, px, py) {
  const grid = scene._buildingGrid;
  if (!grid) return scene.buildings;
  const cx = Math.floor(px / GRID_CELL);
  const cy = Math.floor(py / GRID_CELL);
  return grid.get(cellKey(cx, cy)) || NO_BUILDINGS;
}

export function findNearestBuilding(scene, px, py) {
  let best = null;
  let bestDist = Infinity;
  for (const b of scene.buildings) {
    if (b.destroyed) continue;
    // Can't hide in oil wells, oil tanks, silos, or market furniture
    if (b.isOilInfra || b.isOilWell || b.tex === "silo" || b.noHide) continue;
    const d = Phaser.Math.Distance.Between(px, py, b.x, b.y);
    if (d < bestDist) {
      bestDist = d;
      best = b;
    }
  }
  return best;
}

export function killPeopleInBuilding(scene, building) {
  // Collect all people hiding in this building, then kill them all at once
  // (same as any other multi-kill). No staggered reveals — ghosts spawn
  // simultaneously and only DEATH_SFX_MAX_CONCURRENT sounds play via the
  // normal playDeathSfxAt throttle.
  const victims = [];
  for (const p of scene.people) {
    if (p.state !== "hiding") continue;
    if (p.hideTarget !== building) continue;
    victims.push(p);
  }
  for (let i = 0; i < victims.length; i++) {
    const p = victims[i];
    p.state = "ghost";
    scene.kills++;
    playDeathSfxAt(scene, building.x, building.y);
    const spawnAngle =
      (i / Math.max(victims.length, 1)) * Math.PI * 2 + Math.random() * 0.5;
    p.sprite.setPosition(
      building.x + Math.cos(spawnAngle) * 25,
      building.y + Math.sin(spawnAngle) * 25,
    );
    p.sprite.setVisible(true);
    p.sprite.setTexture("ghost");
    p.sprite.setAlpha(0.8);
    p.sprite.setDepth(13);
    p.ghostDriftX = Math.cos(spawnAngle) * (15 + Math.random() * 25);
    p.ghostDriftY = -(20 + Math.random() * 20);
    p.ghostWobbleOffset = Math.random() * Math.PI * 2;

    if (tryRegisterGhostBubble(scene, p.sprite.x, p.sprite.y)) {
      const line = Phaser.Utils.Array.GetRandom(buildingGhostLines);
      p.bubble = scene.add
        .text(p.sprite.x + 20, p.sprite.y - 20, line, {
          fontFamily: UI_FONT,
          fontSize: "8px",
          color: GHOST_TEXT_COLOR,
          backgroundColor: "#000000aa",
          padding: { x: 4, y: 3 },
        })
        .setScale(SCALE * 0.5 * (scene.isMobile ? MOBILE_DIALOG_SCALE : 1))
        .setDepth(14);
      scene.hudCam.ignore(p.bubble);
    }
  }
}

export function isInsideBuilding(scene, px, py) {
  for (const b of buildingsNear(scene, px, py)) {
    if (b.destroyed) continue;
    const bHW = b.hw || b.radius;
    const bHH = b.hh || b.radius;
    if (Math.abs(px - b.x) < bHW && Math.abs(py - b.y) < bHH) {
      return true;
    }
  }
  return false;
}

export function isNearBuilding(scene, px, py, pad) {
  for (const b of scene.buildings) {
    if (b.destroyed) continue;
    const bHW = (b.hw || b.radius) + pad;
    const bHH = (b.hh || b.radius) + pad;
    if (Math.abs(px - b.x) < bHW && Math.abs(py - b.y) < bHH) {
      return true;
    }
  }
  return false;
}

// Snap a sprite to just outside any building no-go rect it's currently
// inside. Returns true if it moved the sprite.
//
// Why this exists: buildings have a PAD-extended no-go rect, and the
// wander/panic movement code rejects any step whose destination is inside
// that rect. But when a person's CENTER is already inside (e.g. spawned
// there by a set-piece's random-box placement, or pushed there by hide-exit
// jitter into an adjacent building), the per-frame step (~0.5–1 px) is far
// smaller than PAD (22 px), so every direction's destination is also
// inside, every move is rejected, and the person animates in place
// forever. This routine forces them out along the shortest-overlap axis
// so normal movement can resume.
export function pushOutOfBuildings(scene, sprite, excludeBuilding) {
  for (const b of buildingsNear(scene, sprite.x, sprite.y)) {
    if (b.destroyed || b === excludeBuilding) continue;
    const bHW = b.hw || b.radius;
    const bHH = b.hh || b.radius;
    const dx = sprite.x - b.x;
    const dy = sprite.y - b.y;
    if (Math.abs(dx) < bHW && Math.abs(dy) < bHH) {
      const overlapX = bHW - Math.abs(dx);
      const overlapY = bHH - Math.abs(dy);
      if (overlapX < overlapY) {
        sprite.x = b.x + (dx >= 0 ? bHW + 1 : -(bHW + 1));
      } else {
        sprite.y = b.y + (dy >= 0 ? bHH + 1 : -(bHH + 1));
      }
      return true;
    }
  }
  return false;
}

export function steerAroundBuildings(scene, px, py, angle, dt, excludeBuilding) {
  // Rectangular repulsion: aggregate push vectors from all buildings whose
  // AABB the person is inside or whose lookahead would enter. Uses hw/hh
  // (actual texture half-extents) instead of circular radius.
  let repelX = 0;
  let repelY = 0;

  // Both the direct and lookahead (60px) checks below only touch buildings
  // near (px, py) — the grid's 80px margin covers the lookahead — so one
  // point-cell lookup serves both loops.
  const near = buildingsNear(scene, px, py);

  for (const b of near) {
    if (b.destroyed || b === excludeBuilding) continue;
    const bHW = b.hw || b.radius;
    const bHH = b.hh || b.radius;
    const dx = px - b.x;
    const dy = py - b.y;
    // Inside the building rect → strong push out
    if (Math.abs(dx) < bHW && Math.abs(dy) < bHH) {
      const overlapX = bHW - Math.abs(dx);
      const overlapY = bHH - Math.abs(dy);
      if (overlapX < overlapY) {
        repelX += (dx >= 0 ? 1 : -1) * 2;
      } else {
        repelY += (dy >= 0 ? 1 : -1) * 2;
      }
    }
  }

  // Lookahead check
  const checkDist = 60;
  const nx = px + Math.cos(angle) * checkDist;
  const ny = py + Math.sin(angle) * checkDist;
  for (const b of near) {
    if (b.destroyed || b === excludeBuilding) continue;
    const bHW = (b.hw || b.radius) + 15;
    const bHH = (b.hh || b.radius) + 15;
    const ldx = nx - b.x;
    const ldy = ny - b.y;
    if (Math.abs(ldx) < bHW && Math.abs(ldy) < bHH) {
      const d = Math.hypot(px - b.x, py - b.y) || 0.001;
      repelX += ((px - b.x) / d);
      repelY += ((py - b.y) / d);
    }
  }

  if (repelX === 0 && repelY === 0) return angle;

  const repelAngle = Math.atan2(repelY, repelX);
  let diff = repelAngle - angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return angle + diff * 0.8;
}
