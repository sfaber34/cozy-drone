// Hookah lounge set piece.
//
// Factory: createHookah(scene, rng, { tileX, tileY }) returns the standard
// { type, bounds, update, destroy } instance.
//
// HOOKAH_COUNT hookahs are placed in a horizontal row at (cx, cy). Around
// each hookah, HOOKAH_SMOKERS_PER people sit on a circle. A hose sprite
// connects each smoker to the base. The hookah emits a steady plume of
// smoke from the coal on top.
//
// Each smoker has an inhale → hold → exhale cycle:
//   - inhale:  pose swapped to person-wave1 (arm raised to mouth)
//   - hold:    person-stand (lung hold)
//   - exhale:  person-stand + a few smoke puffs drift away from their mouth
//   - gap:     random idle period before the next cycle
//
// All positions + timings live in constants.js. People use the shared
// managedPersonUtils.createManagedPerson so panic + returnHome work.
import Phaser from "phaser";
import {
  TILE, SCALE,
  HOOKAH_COUNT, HOOKAH_SPACING_PX, HOOKAH_SMOKERS_PER, HOOKAH_SMOKER_RADIUS_PX,
  HOOKAH_AMBIENT_SMOKE_INTERVAL_MIN, HOOKAH_AMBIENT_SMOKE_INTERVAL_RANGE,
  HOOKAH_AMBIENT_SMOKE_RISE_HEIGHT,
  HOOKAH_AMBIENT_SMOKE_DURATION_MIN, HOOKAH_AMBIENT_SMOKE_DURATION_RANGE,
  HOOKAH_AMBIENT_SMOKE_OPACITY,
  HOOKAH_INHALE_DURATION_MS, HOOKAH_HOLD_DURATION_MS, HOOKAH_EXHALE_DURATION_MS,
  HOOKAH_CYCLE_GAP_MIN_MS, HOOKAH_CYCLE_GAP_RANGE_MS,
  HOOKAH_EXHALE_PUFF_COUNT, HOOKAH_EXHALE_PUFF_DRIFT, HOOKAH_EXHALE_PUFF_DURATION,
} from "../constants.js";
import { createManagedPerson } from "./managedPersonUtils.js";

const SMOKER_GREETINGS = [
  "Aaaah.", "Smoooth...", "Apple flavor\nis the best.",
  "Hold it\nlonger.", "My turn?", "This is\nliving.",
  "Pass the\nhose.", "Chill day.", "Ahhh.",
];

export function createHookah(scene, rng, opts) {
  const { tileX, tileY } = opts;
  const cx = tileX * TILE * SCALE;
  const cy = tileY * TILE * SCALE;

  const stations = []; // { hookah sprite, smokers[], ambientSmokeTimer }
  const sprites = [];  // static scenery for destroy()

  // --- Hookah positions: equilateral triangle (2 bottom, 1 top).
  //     HOOKAH_SPACING_PX is the triangle's side length; circumradius = s/√3.
  const radius = HOOKAH_SPACING_PX / Math.sqrt(3);
  const hookahPositions = [
    { x: cx,                          y: cy - radius },                 // top
    { x: cx - HOOKAH_SPACING_PX / 2,  y: cy + radius / 2 },             // bottom-left
    { x: cx + HOOKAH_SPACING_PX / 2,  y: cy + radius / 2 },             // bottom-right
  ].slice(0, HOOKAH_COUNT);

  for (let h = 0; h < hookahPositions.length; h++) {
    const hx = hookahPositions[h].x;
    const hy = hookahPositions[h].y;

    const hookahSprite = scene.add
      .image(hx, hy, "hookah")
      .setScale(SCALE)
      .setDepth(1.8);
    sprites.push(hookahSprite);

    const smokers = [];
    for (let i = 0; i < HOOKAH_SMOKERS_PER; i++) {
      const angle = (i / HOOKAH_SMOKERS_PER) * Math.PI * 2 + rng.between(-10, 10) * 0.005;
      const sx = hx + Math.cos(angle) * HOOKAH_SMOKER_RADIUS_PX;
      const sy = hy + Math.sin(angle) * HOOKAH_SMOKER_RADIUS_PX;
      const skinId = rng.between(0, 199);

      // Hose + mouthpiece — depth 4 so they render ABOVE people (y-sorted
      // in [2.0, 2.99]) and readably reach the smoker's hand/mouth.
      const mouthX = sx;
      const mouthY = sy - 4;
      const hose = scene.add
        .line(0, 0, hx, hy, mouthX, mouthY, 0x4a2a1a)
        .setOrigin(0, 0)
        .setLineWidth(1.2)
        .setDepth(4);
      sprites.push(hose);
      const mouthpiece = scene.add
        .image(mouthX, mouthY, "hookah-mouthpiece")
        .setScale(SCALE)
        .setDepth(4.1)
        // Rotate so the mouthpiece barrel points toward the hookah
        .setRotation(Math.atan2(hy - mouthY, hx - mouthX) - Math.PI / 2);
      sprites.push(mouthpiece);

      const { sprite, personEntry } = createManagedPerson(scene, {
        x: sx, y: sy, skinId,
        texture: `person-stand-${skinId}`,
        greeting: rng.pick(SMOKER_GREETINGS),
        depth: 2,
        event: "hookah",
        flagKey: "isHookahSmoker",
        flip: sx < hx, // face the hookah
      });

      smokers.push({
        personEntry,
        sprite,
        skinId,
        homeX: sx,
        homeY: sy,
        phase: "gap", // "gap" | "inhale" | "hold" | "exhale"
        phaseTimer:
          Math.random() * (HOOKAH_CYCLE_GAP_MIN_MS + HOOKAH_CYCLE_GAP_RANGE_MS),
        exhaleDir: Math.atan2(sy - hy, sx - hx), // away from hookah
      });
    }

    stations.push({
      hookahSprite,
      hx,
      hy,
      smokers,
      ambientSmokeTimer:
        Math.random() *
        (HOOKAH_AMBIENT_SMOKE_INTERVAL_MIN + HOOKAH_AMBIENT_SMOKE_INTERVAL_RANGE),
    });
  }

  // Overall bounds cover the row of hookahs + smoker ring padding
  const halfW = (HOOKAH_SPACING_PX * (HOOKAH_COUNT - 1)) / 2 + HOOKAH_SMOKER_RADIUS_PX + 20;
  const halfH = HOOKAH_SMOKER_RADIUS_PX + 30;

  return {
    type: "hookah",
    bounds: { cx, cy, hw: halfW, hh: halfH },
    update(dt) {
      for (const st of stations) {
        // Ambient smoke from the coal on top
        st.ambientSmokeTimer -= dt * 1000;
        if (st.ambientSmokeTimer <= 0) {
          st.ambientSmokeTimer =
            HOOKAH_AMBIENT_SMOKE_INTERVAL_MIN +
            Math.random() * HOOKAH_AMBIENT_SMOKE_INTERVAL_RANGE;
          spawnAmbientSmoke(scene, st.hx, st.hy - 18);
        }
        // Smoker cycles
        for (const s of st.smokers) updateSmoker(scene, s, dt);
      }
    },
    destroy() {
      for (const sp of sprites) sp.destroy();
    },
  };
}

// --- Smoker state machine ------------------------------------------------

function updateSmoker(scene, s, dt) {
  if (s.personEntry.state !== "idle") return;
  s.phaseTimer -= dt * 1000;
  if (s.phaseTimer > 0) return;

  switch (s.phase) {
    case "gap":
      s.phase = "inhale";
      s.phaseTimer = HOOKAH_INHALE_DURATION_MS;
      s.sprite.setTexture(`person-wave1-${s.skinId}`);
      break;
    case "inhale":
      s.phase = "hold";
      s.phaseTimer = HOOKAH_HOLD_DURATION_MS;
      s.sprite.setTexture(`person-stand-${s.skinId}`);
      break;
    case "hold":
      s.phase = "exhale";
      s.phaseTimer = HOOKAH_EXHALE_DURATION_MS;
      s.sprite.setTexture(`person-stand-${s.skinId}`);
      spawnExhalePuffs(scene, s);
      break;
    case "exhale":
      s.phase = "gap";
      s.phaseTimer =
        HOOKAH_CYCLE_GAP_MIN_MS + Math.random() * HOOKAH_CYCLE_GAP_RANGE_MS;
      break;
  }
}

// --- Smoke spawners ------------------------------------------------------

function spawnAmbientSmoke(scene, x, y) {
  const puff = scene.add
    .image(x + Phaser.Math.Between(-2, 2), y, "smoke")
    .setScale(SCALE * (0.35 + Math.random() * 0.25))
    .setDepth(5)
    .setAlpha(HOOKAH_AMBIENT_SMOKE_OPACITY)
    .setTint(0xcccccc);
  scene.hudCam.ignore(puff);
  const duration =
    HOOKAH_AMBIENT_SMOKE_DURATION_MIN +
    Math.random() * HOOKAH_AMBIENT_SMOKE_DURATION_RANGE;
  scene.tweens.add({
    targets: puff,
    y: y - HOOKAH_AMBIENT_SMOKE_RISE_HEIGHT,
    x: puff.x + Phaser.Math.Between(-12, 12),
    scale: SCALE * (0.8 + Math.random() * 0.5),
    alpha: 0,
    duration,
    ease: "Sine.easeOut",
    onComplete: () => puff.destroy(),
  });
}

function spawnExhalePuffs(scene, s) {
  const pe = s.personEntry;
  // Exhale from the mouth area
  const mouthX = pe.sprite.x;
  const mouthY = pe.sprite.y - 6;
  for (let i = 0; i < HOOKAH_EXHALE_PUFF_COUNT; i++) {
    const puff = scene.add
      .image(mouthX, mouthY, "smoke")
      .setScale(SCALE * (0.25 + Math.random() * 0.2))
      .setDepth(5)
      .setAlpha(0.5)
      .setTint(0xdddddd);
    scene.hudCam.ignore(puff);
    const spread = (Math.random() - 0.5) * 0.6; // small angular variance
    const driftA = s.exhaleDir + spread;
    scene.tweens.add({
      targets: puff,
      x: mouthX + Math.cos(driftA) * HOOKAH_EXHALE_PUFF_DRIFT,
      y: mouthY + Math.sin(driftA) * HOOKAH_EXHALE_PUFF_DRIFT - 6,
      scale: SCALE * (0.5 + Math.random() * 0.3),
      alpha: 0,
      duration: HOOKAH_EXHALE_PUFF_DURATION + Math.random() * 200,
      delay: i * 80,
      ease: "Quad.easeOut",
      onComplete: () => puff.destroy(),
    });
  }
}
