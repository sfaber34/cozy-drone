import Phaser from "phaser";
import {
  TILE, SCALE, OIL_X, OIL_Y,
  OIL_WORKERS_COUNT, OIL_PUMP_SPEED_MIN, OIL_PUMP_SPEED_RANGE,
} from "../constants.js";
import { workerGreetings } from "../dialog.js";

export function createOilfield(scene, rng) {
  const oilX = OIL_X * TILE * SCALE;
  const oilY = OIL_Y * TILE * SCALE;

  const addBuilding = scene._addBuilding;

  // Oil tanks (spread across the field)
  scene.oilWells = [];
  const tankPositions = [
    { x: oilX - 500, y: oilY - 200 },
    { x: oilX + 100, y: oilY - 250 },
    { x: oilX + 500, y: oilY - 150 },
    { x: oilX - 300, y: oilY + 300 },
    { x: oilX + 300, y: oilY + 250 },
    { x: oilX + 600, y: oilY + 100 },
    { x: oilX - 100, y: oilY + 450 },
    { x: oilX + 500, y: oilY + 450 },
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
      const wpx = oilX + wx * 200 + Phaser.Math.Between(-40, 40);
      const wpy = oilY + wy * 180 + Phaser.Math.Between(-40, 40);
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
    scene.oilWells.push(well);
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
        .image(oilX + px * pipeFn, oilY + pipeY, "pipe-h")
        .setScale(SCALE)
        .setDepth(1.5);
    }
  }
  // Vertical pipe runs
  for (const vx of [-500, -300, -100, 100, 300, 500]) {
    for (let py = -5; py <= 10; py++) {
      scene.add
        .image(oilX + vx, oilY - 200 + py * pipeFn, "pipe-v")
        .setScale(SCALE)
        .setDepth(1.5);
    }
  }

  // Oil field workers (hard hat skins 10-11)
  for (let w = 0; w < OIL_WORKERS_COUNT; w++) {
    const wx = oilX + Phaser.Math.Between(-600, 600);
    const wy = oilY + Phaser.Math.Between(-250, 500);
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
}

export function updateOilWells(scene, delta) {
  for (const well of scene.oilWells) {
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
}
