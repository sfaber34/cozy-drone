// Oilfield set piece.
//
// Factory pattern — multiple oilfields can coexist. Call:
//   const oilfield = createOilfield(scene, rng, { tileX, tileY });
//   scene.setPieces.push(oilfield);
//   // ... per frame:
//   oilfield.update(dt);
//
// The returned instance exposes:
//   { type, bounds, update(dt), destroy() }
// Oil wells are kept in a closure-local array so multiple instances don't
// collide. Workers are still pushed to scene.people and wells/tanks to
// scene.buildings (scene-global lists).
import Phaser from "phaser";
import {
  TILE, SCALE,
  OIL_WORKERS_COUNT, OIL_PUMP_SPEED_MIN, OIL_PUMP_SPEED_RANGE,
} from "../constants.js";
import { workerGreetings } from "../dialog.js";

/**
 * Spawn an oilfield at the given tile coordinates.
 * @param {Phaser.Scene} scene
 * @param {Phaser.Math.RandomDataGenerator} rng
 * @param {{tileX: number, tileY: number}} opts
 * @returns {{type: string, bounds: {cx, cy, hw, hh}, update: (dt: number) => void, destroy: () => void}}
 */
export function createOilfield(scene, rng, opts) {
  const { tileX, tileY } = opts;
  const cx = tileX * TILE * SCALE;
  const cy = tileY * TILE * SCALE;

  const addBuilding = scene._addBuilding;

  // --- Per-instance state (closure) ---
  const wells = [];

  // Oil tanks (spread across the field)
  const tankPositions = [
    { x: cx - 500, y: cy - 200 },
    { x: cx + 100, y: cy - 250 },
    { x: cx + 500, y: cy - 150 },
    { x: cx - 300, y: cy + 300 },
    { x: cx + 300, y: cy + 250 },
    { x: cx + 600, y: cy + 100 },
    { x: cx - 100, y: cy + 450 },
    { x: cx + 500, y: cy + 450 },
  ];
  for (const tp of tankPositions) {
    const b = addBuilding(tp.x, tp.y, "oil-tank", "large");
    b.isOilInfra = true;
  }

  // Oil wells (many, spread across a large area)
  const wellPositions = [];
  for (let wy = -2; wy <= 3; wy++) {
    for (let wx = -3; wx <= 3; wx++) {
      // Skip positions too close to tanks
      const wpx = cx + wx * 200 + Phaser.Math.Between(-40, 40);
      const wpy = cy + wy * 180 + Phaser.Math.Between(-40, 40);
      let tooClose = false;
      for (const tp of tankPositions) {
        if (Phaser.Math.Distance.Between(wpx, wpy, tp.x, tp.y) < 100) {
          tooClose = true;
          break;
        }
      }
      if (!tooClose) wellPositions.push({ x: wpx, y: wpy });
    }
  }
  for (const wp of wellPositions) {
    const sprite = scene.add
      .image(wp.x, wp.y, "oil-well1")
      .setScale(SCALE)
      .setDepth(2);
    const well = {
      sprite,
      x: wp.x,
      y: wp.y,
      alive: true,
      pumpFrame: 0,
      pumpTimer: 0,
      pumpSpeed: OIL_PUMP_SPEED_MIN + Math.random() * OIL_PUMP_SPEED_RANGE,
    };
    wells.push(well);
    scene.buildings.push({
      sprite,
      tex: "oil-well1",
      size: "small",
      hp: 1,
      maxHp: 1,
      radius: 30,
      x: wp.x,
      y: wp.y,
      destroyed: false,
      cracksSprite: null,
      fireSprites: [],
      isOilWell: true,
      wellRef: well,
      isOilInfra: true,
    });
  }

  // Pipes connecting in a grid
  const pipeFn = TILE * SCALE;
  // Horizontal pipe runs at multiple Y levels
  for (const pipeY of [-200, -30, 120, 280, 440]) {
    for (let px = -16; px <= 16; px++) {
      scene.add
        .image(cx + px * pipeFn, cy + pipeY, "pipe-h")
        .setScale(SCALE)
        .setDepth(1.5);
    }
  }
  // Vertical pipe runs
  for (const vx of [-500, -300, -100, 100, 300, 500]) {
    for (let py = -5; py <= 10; py++) {
      scene.add
        .image(cx + vx, cy - 200 + py * pipeFn, "pipe-v")
        .setScale(SCALE)
        .setDepth(1.5);
    }
  }

  // Oil field workers (hard hat skins 10-11)
  for (let w = 0; w < OIL_WORKERS_COUNT; w++) {
    const wx = cx + Phaser.Math.Between(-600, 600);
    const wy = cy + Phaser.Math.Between(-250, 500);
    const skinId = 200 + (w % 20);
    const sprite = scene.add
      .image(wx, wy, `person-stand-${skinId}`)
      .setScale(SCALE)
      .setDepth(2);
    scene.people.push({
      sprite,
      skinId,
      state: "idle",
      greeting: rng.pick(workerGreetings),
      bubble: null,
      waveTimer: 0,
      waveFrame: 0,
      runAngle: 0,
      runTimer: 0,
      runFrame: 0,
      wanderTimer: 0,
      wanderDuration: 2 + Math.random() * 4,
      wanderAngle: Math.random() < 0.5 ? null : Math.random() * Math.PI * 2,
      hideTarget: null,
      homeX: wx,
      homeY: wy,
      scatterPanic: true,
    });
  }

  // --- Instance API ---
  // Bounds cover the full footprint: tanks span roughly x: [-500, +600],
  // y: [-250, +450]; workers spawn x: [-600, +600], y: [-250, +500].
  const hw = 700;
  const hh = 475;
  const instance = {
    type: "oilfield",
    bounds: {
      cx,
      cy: cy + 125, // center vertically between -250 and +500
      hw,
      hh,
    },
    update(dt) {
      // dt is in seconds; convert to ms to match original `delta` semantics.
      const delta = dt * 1000;
      for (const well of wells) {
        if (!well.alive) continue;
        well.pumpTimer += delta;
        if (well.pumpTimer > well.pumpSpeed) {
          well.pumpTimer = 0;
          well.pumpFrame = 1 - well.pumpFrame;
          well.sprite.setTexture(
            well.pumpFrame === 0 ? "oil-well1" : "oil-well2",
          );
        }
      }
    },
    destroy() {},
  };
  return instance;
}
