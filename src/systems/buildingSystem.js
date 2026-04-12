import Phaser from "phaser";
import { WORLD_W, WORLD_H, TILE, SCALE } from "../constants.js";
import { merchantGreetings, shopperGreetings, buildingGhostLines } from "../dialog.js";
import { playDeathSfxAt } from "./audioSystem.js";

export function createBuildings(scene, rng) {
  scene.buildings = [];
  const bldgHp = { small: 2, medium: 3, large: 4 };
  const bldgRadius = { small: 30, medium: 50, large: 60 };

  const addBuilding = (x, y, tex, size, tint) => {
    const sprite = scene.add.image(x, y, tex).setScale(SCALE).setDepth(2);
    if (tint) sprite.setTint(tint);
    const b = {
      sprite,
      tex,
      size,
      hp: bldgHp[size],
      maxHp: bldgHp[size],
      radius: bldgRadius[size],
      x,
      y,
      destroyed: false,
      cracksSprite: null,
      fireSprites: [],
    };
    scene.buildings.push(b);
    return b;
  };

  // Store addBuilding for oilfield system to use
  scene._addBuilding = addBuilding;

  // ==========================================
  // TOWN (NW quadrant) — large grid layout
  // ==========================================
  const roadTile = TILE * SCALE;
  const townStartX = 100;
  const townStartY = 100;
  const blockSize = 6;
  const gridCols = 8;
  const gridRows = 8;
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

      // Skip bazaar blocks — filled separately
      if (bazaarSet.has(`${bx},${by}`)) continue;

      if (bx === 3 && by === 2) {
        addBuilding(cx, cy, "hospital", "large");
        for (let pp = 0; pp < 3; pp++) {
          scene.add
            .image(blkX + pp * roadTile, blkY, "parking")
            .setOrigin(0, 0)
            .setScale(SCALE)
            .setDepth(1);
        }
        continue;
      }
      if (bx === 5 && by === 4) {
        addBuilding(cx, cy, "church", "medium");
        for (let pp = 0; pp < 3; pp++) {
          for (let pq = 0; pq < 3; pq++) {
            scene.add
              .image(blkX + pp * roadTile, blkY + pq * roadTile, "park")
              .setOrigin(0, 0)
              .setScale(SCALE)
              .setDepth(1);
          }
        }
        continue;
      }

      const blockType = rng.pick(blockTypes);

      if (blockType === "park") {
        for (let py2 = 0; py2 < blockSize; py2++) {
          for (let px2 = 0; px2 < blockSize; px2++) {
            scene.add
              .image(blkX + px2 * roadTile, blkY + py2 * roadTile, "park")
              .setOrigin(0, 0)
              .setScale(SCALE)
              .setDepth(1);
          }
        }
      } else if (blockType === "parking") {
        for (let py2 = 0; py2 < blockSize; py2++) {
          for (let px2 = 0; px2 < blockSize; px2++) {
            scene.add
              .image(blkX + px2 * roadTile, blkY + py2 * roadTile, "parking")
              .setOrigin(0, 0)
              .setScale(SCALE)
              .setDepth(1);
          }
        }
        const tex = rng.pick(["building", "shop", "gas-station"]);
        const sz = tex === "building" ? "medium" : "small";
        addBuilding(blkX + roadTile, blkY + roadTile, tex, sz);
      } else if (blockType === "commercial") {
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
          addBuilding(s.x, s.y, tex, sz);
        }
      } else {
        for (let hy = 0; hy < 3; hy++) {
          for (let hx = 0; hx < 3; hx++) {
            if (rng.frac() < 0.15) continue;
            const houseX = blkX + (hx * 2 + 0.5) * roadTile;
            const houseY = blkY + (hy * 2 + 0.5) * roadTile;
            addBuilding(
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

  // ==========================================
  // FARM (NE quadrant) — single farm compound
  // ==========================================
  const halfW = WORLD_W / 2;
  const halfH = WORLD_H / 2;
  const farmX = halfW * SCALE + 600;
  const farmY = halfH * SCALE * 0.4;

  // Farmhouse (main house)
  addBuilding(farmX, farmY, "house", "small", 0xddccaa);

  // Barn (large, to the right)
  addBuilding(farmX + 250, farmY - 20, "barn", "medium");

  // Silos near the barn
  addBuilding(farmX + 380, farmY - 60, "silo", "small");
  addBuilding(farmX + 420, farmY - 30, "silo", "small");
  addBuilding(farmX + 400, farmY + 20, "silo", "small");

  // Small huts scattered around
  addBuilding(farmX - 150, farmY + 100, "hut", "small");
  addBuilding(farmX + 80, farmY + 140, "hut", "small");
  addBuilding(farmX - 80, farmY - 120, "hut", "small");

  // Corral (livestock pen)
  scene.add
    .image(farmX + 150, farmY + 150, "corral")
    .setScale(SCALE)
    .setDepth(1.5);

  // Hay bale piles
  const hayPositions = [
    { x: farmX + 300, y: farmY + 80 },
    { x: farmX + 320, y: farmY + 100 },
    { x: farmX + 290, y: farmY + 110 },
    { x: farmX - 200, y: farmY - 40 },
    { x: farmX - 180, y: farmY - 20 },
    { x: farmX + 50, y: farmY - 80 },
    { x: farmX + 70, y: farmY - 70 },
    { x: farmX + 60, y: farmY - 60 },
  ];
  for (const hp of hayPositions) {
    scene.add.image(hp.x, hp.y, "hay").setScale(SCALE).setDepth(2);
  }

  // Fences around the farm perimeter (with gate gaps)
  const fenceLen = TILE * SCALE;
  // Top fence (gap at f=1 for gate)
  for (let f = -6; f <= 8; f++) {
    if (f === 1) continue;
    scene.add
      .image(farmX + f * fenceLen, farmY - 180, "fence-h")
      .setScale(SCALE)
      .setDepth(1.5);
  }
  // Bottom fence (gap at f=2 for gate)
  for (let f = -6; f <= 8; f++) {
    if (f === 2) continue;
    scene.add
      .image(farmX + f * fenceLen, farmY + 200, "fence-h")
      .setScale(SCALE)
      .setDepth(1.5);
  }
  // Left fence (gap at f=0 for gate)
  for (let f = -4; f <= 4; f++) {
    if (f === 0) continue;
    scene.add
      .image(farmX - 6 * fenceLen, farmY + f * fenceLen, "fence-v")
      .setScale(SCALE)
      .setDepth(1.5);
  }
  // Right fence (gap at f=1 for gate)
  for (let f = -4; f <= 4; f++) {
    if (f === 1) continue;
    scene.add
      .image(farmX + 8 * fenceLen + 10, farmY + f * fenceLen, "fence-v")
      .setScale(SCALE)
      .setDepth(1.5);
  }

  // Export town layout info for vehicles
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
}

export function findNearestBuilding(scene, px, py) {
  let best = null;
  let bestDist = Infinity;
  for (const b of scene.buildings) {
    if (b.destroyed) continue;
    // Can't hide in oil wells, oil tanks, or silos
    if (b.isOilInfra || b.isOilWell || b.tex === "silo") continue;
    const d = Phaser.Math.Distance.Between(px, py, b.x, b.y);
    if (d < bestDist) {
      bestDist = d;
      best = b;
    }
  }
  return best;
}

export function killPeopleInBuilding(scene, building) {
  let ghostIdx = 0;
  for (const p of scene.people) {
    if (p.state !== "hiding") continue;
    if (p.hideTarget !== building) continue;
    const idx = ghostIdx++;
    // Stagger each ghost's appearance
    scene.time.delayedCall(idx * 300, () => {
      p.state = "ghost";
      scene.kills++;
      playDeathSfxAt(scene, building.x, building.y);
      // Spread starting positions around the building
      const spawnAngle =
        (idx / Math.max(ghostIdx, 1)) * Math.PI * 2 + Math.random() * 0.5;
      p.sprite.setPosition(
        building.x + Math.cos(spawnAngle) * 25,
        building.y + Math.sin(spawnAngle) * 25,
      );
      p.sprite.setVisible(true);
      p.sprite.setTexture("ghost");
      p.sprite.setAlpha(0.8);
      p.sprite.setDepth(13);
      // Each ghost drifts in a unique direction
      p.ghostDriftX = Math.cos(spawnAngle) * (15 + Math.random() * 25);
      p.ghostDriftY = -(20 + Math.random() * 20); // always float up, but at different speeds
      p.ghostWobbleOffset = Math.random() * Math.PI * 2;

      const line = Phaser.Utils.Array.GetRandom(buildingGhostLines);
      p.bubble = scene.add
        .text(p.sprite.x + 20, p.sprite.y - 20, line, {
          fontFamily: "monospace",
          fontSize: "8px",
          color: "#aaccff",
          backgroundColor: "#000000aa",
          padding: { x: 4, y: 3 },
        })
        .setScale(SCALE * 0.5)
        .setDepth(14);
      scene.hudCam.ignore(p.bubble);
    });
  }
}

export function isInsideBuilding(scene, px, py) {
  for (const b of scene.buildings) {
    if (b.destroyed) continue;
    if (Phaser.Math.Distance.Between(px, py, b.x, b.y) < b.radius) {
      return true;
    }
  }
  return false;
}

export function steerAroundBuildings(scene, px, py, angle, dt) {
  // Check if next position would be inside a building
  const checkDist = 40;
  const nx = px + Math.cos(angle) * checkDist;
  const ny = py + Math.sin(angle) * checkDist;
  for (const b of scene.buildings) {
    if (b.destroyed) continue;
    const d = Phaser.Math.Distance.Between(nx, ny, b.x, b.y);
    if (d < b.radius + 20) {
      // Steer perpendicular to the building
      const awayAngle = Phaser.Math.Angle.Between(b.x, b.y, px, py);
      return awayAngle;
    }
  }
  return angle;
}
