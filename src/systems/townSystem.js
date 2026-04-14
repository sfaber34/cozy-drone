// Town set piece.
//
// Factory pattern — call:
//   const town = createTown(scene, rng, { tileX, tileY });
//   scene.setPieces.push(town);
//
// Builds the full town grid: roads, residential/commercial/park/parking
// blocks, bazaar stalls, merchants, and shoppers at (tileX, tileY).
import Phaser from "phaser";
import {
  TILE, SCALE,
  TOWN_GRID_COLS, TOWN_GRID_ROWS, TOWN_BLOCK_SIZE,
} from "../constants.js";
import { merchantGreetings, shopperGreetings } from "../dialog.js";

/**
 * @param {Phaser.Scene} scene
 * @param {Phaser.Math.RandomDataGenerator} rng
 * @param {{tileX: number, tileY: number}} opts
 */
export function createTown(scene, rng, opts) {
  const { tileX, tileY } = opts;

  const roadTile = TILE * SCALE;
  const townStartX = tileX * TILE * SCALE;
  const townStartY = tileY * TILE * SCALE;
  const blockSize = TOWN_BLOCK_SIZE;
  const gridCols = TOWN_GRID_COLS;
  const gridRows = TOWN_GRID_ROWS;
  const roadSpacing = blockSize + 1;

  // Lay roads
  const townW = gridCols * roadSpacing + 1;
  const townH = gridRows * roadSpacing + 1;
  for (let gy = 0; gy < townH; gy++) {
    for (let gx = 0; gx < townW; gx++) {
      const px = townStartX + gx * roadTile;
      const py = townStartY + gy * roadTile;
      const isHRoad = gy % roadSpacing === 0;
      const isVRoad = gx % roadSpacing === 0;
      if (isHRoad && isVRoad) {
        scene.add
          .image(px, py, "road-x")
          .setOrigin(0, 0)
          .setScale(SCALE)
          .setDepth(1);
      } else if (isHRoad) {
        scene.add
          .image(px, py, "road-h")
          .setOrigin(0, 0)
          .setScale(SCALE)
          .setDepth(1);
      } else if (isVRoad) {
        scene.add
          .image(px, py, "road-v")
          .setOrigin(0, 0)
          .setScale(SCALE)
          .setDepth(1);
      }
    }
  }

  // Helper: fill a block with a ground texture
  const fillBlockGround = (blkX, blkY, tex, frame) => {
    for (let py2 = 0; py2 < blockSize; py2++) {
      for (let px2 = 0; px2 < blockSize; px2++) {
        const img = frame !== undefined
          ? scene.add.image(blkX + px2 * roadTile, blkY + py2 * roadTile, tex, frame)
          : scene.add.image(blkX + px2 * roadTile, blkY + py2 * roadTile, tex);
        img.setOrigin(0, 0).setScale(SCALE).setDepth(0.5);
      }
    }
  };

  // Fill each block with buildings
  const blockTypes = [
    "residential",
    "residential",
    "residential",
    "residential",
    "commercial",
    "commercial",
    "commercial",
    "park",
    "parking",
  ];
  const houseTints = [0xddccbb, 0xccbbaa, 0xbbccdd, 0xddddcc, 0xeeddcc];

  // Bazaar block coords (skip these during normal building generation)
  const bazaarSet = new Set(["3,3", "4,3", "5,3", "3,4", "4,4"]);

  for (let by = 0; by < gridRows; by++) {
    for (let bx = 0; bx < gridCols; bx++) {
      const blkX = townStartX + (bx * roadSpacing + 1) * roadTile;
      const blkY = townStartY + (by * roadSpacing + 1) * roadTile;
      const blkW = blockSize * roadTile;
      const blkH = blockSize * roadTile;
      const cx = blkX + blkW / 2;
      const cy = blkY + blkH / 2;

      // Skip bazaar blocks — filled separately below
      if (bazaarSet.has(`${bx},${by}`)) {
        fillBlockGround(blkX, blkY, "grass");
        continue;
      }

      if (bx === 3 && by === 2) {
        // Hospital block — parking ground
        fillBlockGround(blkX, blkY, "parking");
        scene._addBuilding(cx, cy, "hospital", "large");
        continue;
      }
      if (bx === 5 && by === 4) {
        // Church block — park ground
        fillBlockGround(blkX, blkY, "park");
        scene._addBuilding(cx, cy, "church", "medium");
        continue;
      }

      const blockType = rng.pick(blockTypes);

      if (blockType === "park") {
        fillBlockGround(blkX, blkY, "park");
      } else if (blockType === "parking") {
        fillBlockGround(blkX, blkY, "parking");
        const tex = rng.pick(["building", "shop", "gas-station"]);
        const sz = tex === "building" ? "medium" : "small";
        scene._addBuilding(blkX + roadTile, blkY + roadTile, tex, sz);
      } else if (blockType === "commercial") {
        fillBlockGround(blkX, blkY, "grass");
        const spots = [];
        for (let sy = 0; sy < 2; sy++) {
          for (let sx = 0; sx < 2; sx++) {
            spots.push({
              x: blkX + (sx * 3 + 1) * roadTile,
              y: blkY + (sy * 3 + 1) * roadTile,
            });
          }
        }
        for (const s of spots) {
          const tex = rng.pick([
            "building",
            "apartment",
            "shop",
            "shop",
            "gas-station",
          ]);
          const sz =
            tex === "building" || tex === "apartment" ? "medium" : "small";
          scene._addBuilding(s.x, s.y, tex, sz);
        }
      } else {
        // Residential
        fillBlockGround(blkX, blkY, "grass");
        for (let hy = 0; hy < 3; hy++) {
          for (let hx = 0; hx < 3; hx++) {
            if (rng.frac() < 0.15) continue;
            const houseX = blkX + (hx * 2 + 0.5) * roadTile;
            const houseY = blkY + (hy * 2 + 0.5) * roadTile;
            scene._addBuilding(
              houseX,
              houseY,
              "house",
              "small",
              rng.pick(houseTints),
            );
          }
        }
      }
    }
  }

  // ==========================================
  // BAZAAR (5 blocks in center of town)
  // ==========================================
  const bazaarBlocks = [
    { bx: 3, by: 3 },
    { bx: 4, by: 3 },
    { bx: 5, by: 3 },
    { bx: 3, by: 4 },
    { bx: 4, by: 4 },
  ];
  const goodsTextures = [
    "goods-basket",
    "goods-jug",
    "goods-cloth",
    "goods-fruit",
    "goods-bread",
  ];
  const stallTextures = ["stall", "stall2", "stall3"];

  for (const bb of bazaarBlocks) {
    const blkX = townStartX + (bb.bx * roadSpacing + 1) * roadTile;
    const blkY = townStartY + (bb.by * roadSpacing + 1) * roadTile;
    const blkW = blockSize * roadTile;
    const blkH = blockSize * roadTile;

    // Place stalls in rows
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 2; col++) {
        const sx = blkX + (col * 3 + 1) * roadTile;
        const sy = blkY + (row * 2 + 0.5) * roadTile;
        const tex = rng.pick(stallTextures);
        scene.add.image(sx, sy, tex).setScale(SCALE).setDepth(2);
      }
    }

    // Place 1-2 tents per block
    const tentX = blkX + blkW * 0.5;
    const tentY = blkY + blkH - roadTile;
    scene.add.image(tentX, tentY, "tent").setScale(SCALE).setDepth(2);

    // Merchants (standing behind stalls, don't wander)
    for (let m = 0; m < 3; m++) {
      const mx = blkX + (m * 2 + 1) * roadTile;
      const my = blkY + roadTile * 0.5;
      const skinId = rng.between(0, 199);
      const sprite = scene.add
        .image(mx, my, `person-stand-${skinId}`)
        .setScale(SCALE)
        .setDepth(3);
      scene.people.push({
        sprite,
        skinId,
        state: "idle",
        greeting: rng.pick(merchantGreetings),
        bubble: null,
        waveTimer: 0,
        waveFrame: 0,
        runAngle: 0,
        runTimer: 0,
        runFrame: 0,
        wanderTimer: 0,
        wanderDuration: 999,
        wanderAngle: null,
        hideTarget: null,
        homeX: mx,
        homeY: my,
      });
    }

    // Shoppers wandering the block (carrying goods)
    for (let s = 0; s < 6; s++) {
      const sx = blkX + Math.random() * blkW;
      const sy = blkY + Math.random() * blkH;
      const skinId = rng.between(0, 199);
      const sprite = scene.add
        .image(sx, sy, `person-stand-${skinId}`)
        .setScale(SCALE)
        .setDepth(2);

      // Carried item follows the person
      const goodsTex = rng.pick(goodsTextures);
      const goodsSprite = scene.add
        .image(sx + 8, sy - 5, goodsTex)
        .setScale(SCALE * 0.8)
        .setDepth(3);

      scene.people.push({
        sprite,
        skinId,
        state: "idle",
        greeting: rng.pick(shopperGreetings),
        bubble: null,
        waveTimer: 0,
        waveFrame: 0,
        runAngle: 0,
        runTimer: 0,
        runFrame: 0,
        wanderTimer: 0,
        wanderDuration: 2 + Math.random() * 3,
        wanderAngle: Math.random() * Math.PI * 2,
        hideTarget: null,
        homeX: sx,
        homeY: sy,
        carriedGoods: goodsSprite,
      });
    }
  }

  // Export town layout info for vehicles (read by busSystem.js)
  scene.townStartX = townStartX;
  scene.townStartY = townStartY;
  scene.townGridCols = gridCols;
  scene.townGridRows = gridRows;
  scene.townRoadSpacing = roadSpacing;
  scene.townRoadTile = roadTile;
  scene.townW = townW;
  scene.townH = townH;
  scene.townEndX = townStartX + townW * roadTile;
  scene.townEndY = townStartY + townH * roadTile;

  // Build road waypoint grid (intersections)
  scene.townRoadNodes = [];
  for (let ry = 0; ry <= gridRows; ry++) {
    for (let rx = 0; rx <= gridCols; rx++) {
      scene.townRoadNodes.push({
        x: townStartX + rx * roadSpacing * roadTile + roadTile / 2,
        y: townStartY + ry * roadSpacing * roadTile + roadTile / 2,
      });
    }
  }

  const widthPx = townW * roadTile;
  const heightPx = townH * roadTile;
  return {
    type: "town",
    bounds: {
      cx: townStartX + widthPx / 2,
      cy: townStartY + heightPx / 2,
      hw: widthPx / 2,
      hh: heightPx / 2,
    },
    update: () => {},
    destroy() {},
  };
}
