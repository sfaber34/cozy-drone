import Phaser from "phaser";
import { WORLD_W, WORLD_H, TILE, SCALE, MOAT_TILES } from "../constants.js";

const MAP_W  = WORLD_W * TILE * SCALE;
const MAP_H  = WORLD_H * TILE * SCALE;
const MOAT_PX = MOAT_TILES * TILE * SCALE;

// ---------------------------------------------------------------------------
// Geometry helpers (used by other modules)
// ---------------------------------------------------------------------------

/** True if world-space point (x, y) is in the water moat (outside the map). */
export function isInWater(x, y) {
  return x < 0 || x > MAP_W || y < 0 || y > MAP_H;
}

/** Outer water boundary in world-space pixels. */
export const WATER_BOUNDS = {
  left:   -MOAT_PX,
  right:   MAP_W + MOAT_PX,
  top:    -MOAT_PX,
  bottom:  MAP_H + MOAT_PX,
};

// ---------------------------------------------------------------------------
// createWater — draw the moat (called once during scene setup)
// ---------------------------------------------------------------------------

export function createWater(scene) {
  const g = scene.add.graphics().setDepth(0);

  // Base water colour
  g.fillStyle(0x1565a8, 1);
  // Top strip  (full extended width, including corners)
  g.fillRect(-MOAT_PX, -MOAT_PX, MAP_W + MOAT_PX * 2, MOAT_PX);
  // Bottom strip
  g.fillRect(-MOAT_PX, MAP_H,    MAP_W + MOAT_PX * 2, MOAT_PX);
  // Left strip  (map height only — top/bottom strips cover the corners)
  g.fillRect(-MOAT_PX, 0,  MOAT_PX, MAP_H);
  // Right strip
  g.fillRect(MAP_W,    0,  MOAT_PX, MAP_H);

  // Subtle horizontal wave highlights (lighter blue lines every 4 tiles)
  g.fillStyle(0x2e8fd4, 0.35);
  const step = TILE * SCALE * 4;
  for (let y = -MOAT_PX; y < MAP_H + MOAT_PX; y += step) {
    const lineY = y + step * 0.3;
    // Only paint in the moat strips, not over the map interior
    if (lineY < 0 || lineY >= MAP_H) {
      g.fillRect(-MOAT_PX, lineY, MAP_W + MOAT_PX * 2, 2);
    } else {
      g.fillRect(-MOAT_PX, lineY, MOAT_PX, 2);
      g.fillRect(MAP_W,    lineY, MOAT_PX, 2);
    }
  }

  // --- Scatter wave props across the moat strips ---
  const rng = new Phaser.Math.RandomDataGenerator(["water-waves"]);

  // Moat strips: top, bottom, left, right
  const strips = [
    { x1: -MOAT_PX, y1: -MOAT_PX, x2: MAP_W + MOAT_PX, y2: 0 },
    { x1: -MOAT_PX, y1: MAP_H,    x2: MAP_W + MOAT_PX, y2: MAP_H + MOAT_PX },
    { x1: -MOAT_PX, y1: 0,        x2: 0,               y2: MAP_H },
    { x1: MAP_W,    y1: 0,        x2: MAP_W + MOAT_PX, y2: MAP_H },
  ];
  const areas = strips.map(s => (s.x2 - s.x1) * (s.y2 - s.y1));
  const totalArea = areas.reduce((a, b) => a + b, 0);

  // Texture mix: large double-crest, small single crest, tiny fleck
  const textures = ["wave", "wave", "wave", "wave-sm", "wave-sm", "wave-sm", "wave-dot", "wave-dot"];

  const WAVE_COUNT = 3000;
  for (let i = 0; i < WAVE_COUNT; i++) {
    // Pick strip weighted by area
    const roll = rng.frac() * totalArea;
    let cum = 0;
    let strip = strips[0];
    for (let s = 0; s < strips.length; s++) {
      cum += areas[s];
      if (roll <= cum) { strip = strips[s]; break; }
    }

    const x   = strip.x1 + rng.frac() * (strip.x2 - strip.x1);
    const y   = strip.y1 + rng.frac() * (strip.y2 - strip.y1);
    const tex = rng.pick(textures);
    const sc  = SCALE * (0.5 + rng.frac() * 1.0); // vary size 0.5–1.5×
    const baseAlpha = 0.4 + rng.frac() * 0.4;

    const wave = scene.add.image(x, y, tex)
      .setScale(sc)
      .setDepth(0.5)
      .setAlpha(baseAlpha)
      .setFlipX(rng.frac() > 0.5);

    // Slow alpha pulse — each wave has its own random phase/speed
    scene.tweens.add({
      targets: wave,
      alpha:   { from: Math.max(0.15, baseAlpha - 0.3), to: Math.min(1, baseAlpha + 0.25) },
      duration: 1800 + rng.frac() * 2400,
      delay:    rng.frac() * 3000,
      yoyo:     true,
      repeat:   -1,
      ease:     "Sine.easeInOut",
    });
  }
}

// ---------------------------------------------------------------------------
// splashAt — visual splash effect when a projectile hits water
// ---------------------------------------------------------------------------

export function splashAt(scene, x, y) {
  // Expanding ripple ring (reuse smoke texture, tinted blue)
  const ring = scene.add
    .image(x, y, "smoke")
    .setTint(0x66bbff)
    .setScale(SCALE * 0.4)
    .setDepth(10)
    .setAlpha(0.85);
  scene.hudCam.ignore(ring);
  scene.tweens.add({
    targets: ring,
    scale:   SCALE * 2.5,
    alpha:   0,
    duration: 450,
    ease: "Quad.easeOut",
    onComplete: () => ring.destroy(),
  });

  // Second, slower ring for depth
  const ring2 = scene.add
    .image(x, y, "smoke")
    .setTint(0x4499cc)
    .setScale(SCALE * 0.2)
    .setDepth(10)
    .setAlpha(0.5);
  scene.hudCam.ignore(ring2);
  scene.tweens.add({
    targets: ring2,
    scale:   SCALE * 1.5,
    alpha:   0,
    duration: 650,
    ease: "Quad.easeOut",
    onComplete: () => ring2.destroy(),
  });

  // Water droplets flying outward
  for (let i = 0; i < 6; i++) {
    const drop = scene.add
      .image(x, y, "smoke")
      .setTint(0x88ccff)
      .setScale(SCALE * 0.15)
      .setDepth(11)
      .setAlpha(0.8);
    scene.hudCam.ignore(drop);
    const angle = (i / 6) * Math.PI * 2 + (Math.random() - 0.5) * 0.8;
    const dist  = 12 + Math.random() * 20;
    scene.tweens.add({
      targets: drop,
      x: x + Math.cos(angle) * dist,
      y: y + Math.sin(angle) * dist,
      scale: SCALE * (0.1 + Math.random() * 0.15),
      alpha: 0,
      duration: 280 + Math.random() * 180,
      ease: "Quad.easeOut",
      onComplete: () => drop.destroy(),
    });
  }
}
