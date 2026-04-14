// Farm compound set piece.
//
// Factory pattern — call:
//   const farm = createFarmCompound(scene, rng, { tileX, tileY });
//   scene.setPieces.push(farm);
//
// Builds farmhouse + barn + silos + huts + corral + hay piles + perimeter
// fencing at (tileX, tileY).
import Phaser from "phaser";
import { TILE, SCALE } from "../constants.js";

/**
 * @param {Phaser.Scene} scene
 * @param {Phaser.Math.RandomDataGenerator} rng
 * @param {{tileX: number, tileY: number}} opts
 */
export function createFarmCompound(scene, rng, opts) {
  const { tileX, tileY } = opts;
  const farmX = tileX * TILE * SCALE;
  const farmY = tileY * TILE * SCALE;

  // Farmhouse (main house)
  scene._addBuilding(farmX, farmY, "house", "small", 0xddccaa);

  // Barn (large, to the right)
  scene._addBuilding(farmX + 250, farmY - 20, "barn", "medium");

  // Silos near the barn
  scene._addBuilding(farmX + 380, farmY - 60, "silo", "small");
  scene._addBuilding(farmX + 420, farmY - 30, "silo", "small");
  scene._addBuilding(farmX + 400, farmY + 20, "silo", "small");

  // Small huts scattered around
  scene._addBuilding(farmX - 150, farmY + 100, "hut", "small");
  scene._addBuilding(farmX + 80, farmY + 140, "hut", "small");
  scene._addBuilding(farmX - 80, farmY - 120, "hut", "small");

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

  // --- Livestock corrals (pig / chicken / camel / goat) ---
  const corralDefs = [
    { cx: farmX - 400, cy: farmY - 100, animal: "pig", count: 6 },
    { cx: farmX - 400, cy: farmY + 120, animal: "chicken", count: 10 },
    { cx: farmX + 550, cy: farmY - 100, animal: "camel", count: 4 },
    { cx: farmX + 550, cy: farmY + 120, animal: "goat", count: 6 },
  ];
  const corralW = 32 * SCALE;
  const corralH = 24 * SCALE;
  for (const cd of corralDefs) {
    scene.add.image(cd.cx, cd.cy, "corral").setScale(SCALE).setDepth(1.5);
    for (let a = 0; a < cd.count; a++) {
      const ax = cd.cx + Phaser.Math.Between(-corralW / 2 + 15, corralW / 2 - 15);
      const ay = cd.cy + Phaser.Math.Between(-corralH / 2 + 10, corralH / 2 - 10);
      const sprite = scene.add.image(ax, ay, cd.animal).setScale(SCALE).setDepth(2);
      scene.animals.push({
        sprite,
        type: cd.animal,
        state: "idle",
        corral: { x: cd.cx, y: cd.cy, hw: corralW / 2, hh: corralH / 2 },
        wanderAngle: Math.random() * Math.PI * 2,
        wanderTimer: 0,
        wanderDuration: 1 + Math.random() * 3,
        moving: Math.random() > 0.5,
        runAngle: 0,
        panicTimer: 0,
      });
    }
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

  // Bounds: cover the fenced perimeter (~14 tiles wide, ~9 tiles tall)
  const halfW = 7 * fenceLen + 10;
  const halfH = 190;
  return {
    type: "farmCompound",
    bounds: {
      cx: farmX + fenceLen,
      cy: farmY + 10,
      hw: halfW,
      hh: halfH,
    },
    update: () => {},
    destroy() {},
  };
}
