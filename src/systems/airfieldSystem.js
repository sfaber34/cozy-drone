// Airfield set piece — runway, hangar, and taxiway.
//
// Factory pattern. Call:
//   const airfield = createAirfield(scene, rng, { tileX, tileY });
//   scene.setPieces.push(airfield);
//
// The returned instance exposes:
//   { type, bounds, update(dt), destroy() }
// where `bounds` is a rectangle in world-space px covering the full
// airfield footprint (runway + taxiway + hangar), used for dynamic no-go
// zones / spawn-avoidance.
//
// NOTE: For backward compatibility with droneSystem (reads `scene.runway`)
// and introSystem (reads `scene.hangarX`/`scene.hangarY`), this factory
// still writes those scene-level properties. `scene.runway.bottom` is
// also exposed so GameScene can place the drone at the end of the runway.
import { TILE, SCALE } from "../constants.js";

/**
 * Spawn an airfield at the given tile coordinates.
 * @param {Phaser.Scene} scene
 * @param {Phaser.Math.RandomDataGenerator} rng
 * @param {{tileX: number, tileY: number}} opts
 * @returns {{type: string, bounds: {cx, cy, hw, hh}, update: (dt: number) => void, destroy: () => void, runwayBottomY: number}}
 */
export function createAirfield(scene, rng, opts) {
  const { tileX, tileY } = opts;

  const sprites = [];

  // --- Runway ---
  const rwX = tileX * TILE * SCALE;
  const rwTiles = 2; // 1/4 the original length (was 6)
  const rwWidthMult = 1.5; // 50% wider than original
  const rwTileH = 128 * SCALE;
  const rwTotalH = rwTiles * rwTileH;
  // Runway positioned centered on tileY
  const rwCenterY = tileY * TILE * SCALE;
  const rwTop = rwCenterY - rwTotalH / 2;
  const rwBottom = rwCenterY + rwTotalH / 2;
  const rwHalfW = (32 * SCALE * rwWidthMult) / 2;

  // --- Flat desert ground beneath everything ---
  // Mirrors rcCar / chickenFight / camelRace: paints a plain sand-colored
  // rectangle at depth 1.1 so random desert props (rocks, brush, grass)
  // don't poke through the runway and hangar textures.
  const hangarOffsetPre = (48 * SCALE) / 2 + rwHalfW + 16 * SCALE * 3;
  const hangarXPre = rwX + hangarOffsetPre;
  const hangarHalfPre = (48 * SCALE) / 2;
  const groundPad = 20;
  const groundLeft   = rwX - rwHalfW - groundPad;
  const groundRight  = hangarXPre + hangarHalfPre + groundPad;
  const groundTop    = rwTop - groundPad;
  const groundBottom = rwBottom + groundPad;
  const ground = scene.add.graphics();
  ground.fillStyle(0xd2b48c, 1);
  ground.fillRect(groundLeft, groundTop, groundRight - groundLeft, groundBottom - groundTop);
  ground.setDepth(1.1);
  sprites.push(ground);

  for (let i = 0; i < rwTiles; i++) {
    sprites.push(
      scene.add
        .image(rwX, rwTop + i * rwTileH + rwTileH / 2, "runway")
        .setScale(SCALE * rwWidthMult, SCALE)
        .setDepth(1.5),
    );
  }
  // Store runway bounds for collision (kept on scene for droneSystem).
  scene.runway = {
    x: rwX,
    y: rwCenterY,
    halfW: rwHalfW,
    halfH: rwTotalH / 2,
    bottom: rwBottom,
    top: rwTop,
  };

  // --- Hangar (to the right of the runway bottom) ---
  const hangarOffset = (48 * SCALE) / 2 + rwHalfW + 16 * SCALE * 3; // hangar half + runway half + taxiway gap
  const hangarX = rwX + hangarOffset;
  const hangarY = rwBottom - (48 * SCALE) / 2;
  scene.hangarX = hangarX;
  scene.hangarY = hangarY;
  sprites.push(
    scene.add.image(hangarX, hangarY, "hangar").setScale(SCALE).setDepth(1.5),
  );

  // --- Taxiway connecting hangar door to runway ---
  const taxiStartX = rwX + rwHalfW; // right edge of runway
  const taxiEndX = hangarX - (48 * SCALE) / 2; // left edge of hangar (door side)
  const taxiY = hangarY;
  for (let tx = taxiStartX; tx < taxiEndX; tx += 16 * SCALE) {
    sprites.push(
      scene.add
        .image(tx + 8 * SCALE, taxiY, "taxiway")
        .setScale(SCALE)
        .setAngle(90) // rotate so center line runs horizontally
        .setDepth(1.5),
    );
  }

  // --- Bounds (covers runway + taxiway + hangar footprint) ---
  const hangarHalf = (48 * SCALE) / 2;
  const left = rwX - rwHalfW;
  const right = hangarX + hangarHalf;
  const top = rwTop;
  const bottom = rwBottom;
  const cx = (left + right) / 2;
  const cy = (top + bottom) / 2;
  const hw = (right - left) / 2;
  const hh = (bottom - top) / 2;

  return {
    type: "airfield",
    bounds: { cx, cy, hw, hh },
    runwayBottomY: rwBottom,
    update: () => {},
    destroy() {
      for (const s of sprites) s.destroy();
    },
  };
}
