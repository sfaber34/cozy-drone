// Tire fire set piece. Factory pattern:
//   const fire = createTireFire(scene, rng, { tileX, tileY });
//   scene.setPieces.push(fire);
//
// Spawns a pile of tires with a pulsing fire on top, thick black smoke
// rising forever, and a crowd of people gathered around — some warming
// their hands, some roasting marshmallows, some drinking hot drinks.
import Phaser from "phaser";
import {
  TILE, SCALE,
  TIRE_FIRE_TIRE_COUNT, TIRE_FIRE_PILE_SPREAD,
  TIRE_FIRE_CROWD_COUNT,
  TIRE_FIRE_CROWD_RADIUS_MIN, TIRE_FIRE_CROWD_RADIUS_RANGE,
  TIRE_FIRE_SMOKE_INTERVAL_MIN, TIRE_FIRE_SMOKE_INTERVAL_RANGE,
  TIRE_FIRE_SMOKE_RISE_HEIGHT,
  TIRE_FIRE_SMOKE_DURATION_MIN, TIRE_FIRE_SMOKE_DURATION_RANGE,
  TIRE_FIRE_SMOKE_OPACITY,
  TIRE_FIRE_DRINK_INTERVAL_MIN, TIRE_FIRE_DRINK_INTERVAL_RANGE,
  TIRE_FIRE_SWAY_HZ,
} from "../constants.js";
import { createManagedPerson } from "./managedPersonUtils.js";

const ROLES = ["warming", "roasting", "drinking"];
const GREETINGS = {
  warming:  ["So warm.", "Toasty.", "Feel the\nheat.", "Aaaah."],
  roasting: ["Golden\nbrown!", "Perfect\ntoast.", "Eat up!", "Mm, sugar."],
  drinking: ["Sip.", "Piping\nhot.", "Burnt my\ntongue.", "Refill?"],
};

export function createTireFire(scene, rng, opts) {
  const { tileX, tileY } = opts;
  const cx = tileX * TILE * SCALE;
  const cy = tileY * TILE * SCALE;
  const sprites = [];

  // --- Tire pile (arranged around the center so the fire always sits in the middle) ---
  // 1 tire at the center, the rest spaced around it at TIRE_FIRE_PILE_SPREAD,
  // each with a small random jitter so it still reads as a messy pile.
  for (let i = 0; i < TIRE_FIRE_TIRE_COUNT; i++) {
    let tx, ty;
    if (i === 0) {
      tx = cx;
      ty = cy;
    } else {
      const angle = ((i - 1) / (TIRE_FIRE_TIRE_COUNT - 1)) * Math.PI * 2;
      const jitterAng = angle + (Math.random() - 0.5) * 0.4;
      const radius = TIRE_FIRE_PILE_SPREAD * (0.55 + Math.random() * 0.45);
      // Squash vertically a touch for a flatter top-down pile shape
      tx = cx + Math.cos(jitterAng) * radius;
      ty = cy + Math.sin(jitterAng) * radius * 0.7;
    }
    const t = scene.add
      .image(tx, ty, "tire")
      .setScale(SCALE)
      .setDepth(1.4)
      .setAngle(rng.between(-30, 30));
    sprites.push(t);
  }

  // --- Fire (pulsing sprite) on top of pile ---
  // scene.hudCam doesn't exist yet during create(); the GameScene filter
  // after create() adds all existing children to hudCam.ignore, so no
  // explicit ignore call is needed here.
  const fire = scene.add
    .image(cx, cy, "fire")
    .setScale(SCALE * 2.6)
    .setDepth(3);
  sprites.push(fire);
  scene.tweens.add({
    targets: fire,
    scaleX: { from: SCALE * 2.4, to: SCALE * 3.0 },
    scaleY: { from: SCALE * 2.6, to: SCALE * 3.2 },
    alpha:  { from: 1, to: 0.75 },
    duration: 260,
    yoyo: true,
    repeat: -1,
  });

  // --- Crowd ---
  const crowd = [];
  for (let i = 0; i < TIRE_FIRE_CROWD_COUNT; i++) {
    const angle = (i / TIRE_FIRE_CROWD_COUNT) * Math.PI * 2 + rng.between(-20, 20) * 0.01;
    const dist =
      TIRE_FIRE_CROWD_RADIUS_MIN + Math.random() * TIRE_FIRE_CROWD_RADIUS_RANGE;
    const px = cx + Math.cos(angle) * dist;
    const py = cy + Math.sin(angle) * dist;
    const role = ROLES[i % ROLES.length];
    const skinId = rng.between(0, 199);

    const initialTexture =
      role === "warming" ? `person-wave2-${skinId}` :
      role === "roasting" ? `person-wave1-${skinId}` :
      `person-stand-${skinId}`;

    const { sprite, personEntry } = createManagedPerson(scene, {
      x: px, y: py, skinId,
      texture: initialTexture,
      greeting: rng.pick(GREETINGS[role]),
      depth: 2,
      event: "tireFire",
      flagKey: "isTireFireAttendee",
      flip: px > cx, // face the fire
    });

    let prop = null;
    if (role === "roasting") {
      // Marshmallow stick points toward the fire from the person's hand
      prop = scene.add
        .image(px, py, "marshmallow-stick")
        .setScale(SCALE)
        .setDepth(2.5);
      // Rotate so the stick head points at fire
      const toFire = Phaser.Math.Angle.Between(px, py, cx, cy);
      prop.setRotation(toFire);
      personEntry.carriedGoods = prop;
    } else if (role === "drinking") {
      prop = scene.add
        .image(px + 6, py - 2, "hot-cup")
        .setScale(SCALE)
        .setDepth(2.6);
      personEntry.carriedGoods = prop;
    }

    crowd.push({
      personEntry,
      sprite,
      skinId,
      role,
      prop,
      homeX: px,
      homeY: py,
      toFireAngle: Phaser.Math.Angle.Between(px, py, cx, cy),
      swayPhase: Math.random() * Math.PI * 2,
      drinkTimer:
        TIRE_FIRE_DRINK_INTERVAL_MIN +
        Math.random() * TIRE_FIRE_DRINK_INTERVAL_RANGE,
      drinking: false,
      drinkElapsed: 0,
    });
  }

  let smokeTimer = 0;

  return {
    type: "tireFire",
    bounds: {
      cx,
      cy,
      hw: TIRE_FIRE_CROWD_RADIUS_MIN + TIRE_FIRE_CROWD_RADIUS_RANGE + 20,
      hh: TIRE_FIRE_CROWD_RADIUS_MIN + TIRE_FIRE_CROWD_RADIUS_RANGE + 20,
    },
    update(dt) {
      // --- Smoke puffs ---
      smokeTimer -= dt * 1000;
      if (smokeTimer <= 0) {
        smokeTimer =
          TIRE_FIRE_SMOKE_INTERVAL_MIN + Math.random() * TIRE_FIRE_SMOKE_INTERVAL_RANGE;
        spawnSmoke(scene, cx, cy);
      }

      // --- Crowd role animations ---
      for (const c of crowd) {
        if (c.personEntry.state !== "idle") continue;

        if (c.role === "warming") {
          // Gentle sway toward the fire
          c.swayPhase += dt * TIRE_FIRE_SWAY_HZ * Math.PI * 2;
          const bob = Math.sin(c.swayPhase) * 1.5;
          c.sprite.y = c.homeY + bob;
        } else if (c.role === "roasting") {
          // Keep stick pointed at fire, slight hand-jitter
          if (c.prop) {
            c.prop.setRotation(c.toFireAngle + Math.sin(c.swayPhase) * 0.08);
            const handDx = Math.cos(c.toFireAngle) * 5;
            const handDy = Math.sin(c.toFireAngle) * 5;
            c.prop.setPosition(c.sprite.x + handDx, c.sprite.y + handDy);
          }
          c.swayPhase += dt * TIRE_FIRE_SWAY_HZ * Math.PI * 2;
        } else if (c.role === "drinking") {
          // Periodic sip — lift cup toward mouth for ~450ms, then lower
          if (c.drinking) {
            c.drinkElapsed += dt * 1000;
            const t = Math.min(1, c.drinkElapsed / 450);
            // Lift cup toward face (y goes up, x pulls inward)
            if (c.prop) {
              const restX = c.sprite.x + 6;
              const restY = c.sprite.y - 2;
              const sipX = c.sprite.x + 2;
              const sipY = c.sprite.y - 6;
              // Ease out-and-back via sin
              const e = Math.sin(Math.PI * t);
              c.prop.setPosition(
                restX + (sipX - restX) * e,
                restY + (sipY - restY) * e,
              );
            }
            // Swap to wave1 pose briefly for the sip
            c.sprite.setTexture(
              t < 0.5
                ? `person-wave1-${c.skinId}`
                : `person-stand-${c.skinId}`,
            );
            if (c.drinkElapsed >= 450) {
              c.drinking = false;
              c.drinkElapsed = 0;
              c.drinkTimer =
                TIRE_FIRE_DRINK_INTERVAL_MIN +
                Math.random() * TIRE_FIRE_DRINK_INTERVAL_RANGE;
              c.sprite.setTexture(`person-stand-${c.skinId}`);
              if (c.prop)
                c.prop.setPosition(c.sprite.x + 6, c.sprite.y - 2);
            }
          } else {
            c.drinkTimer -= dt;
            if (c.drinkTimer <= 0) {
              c.drinking = true;
              c.drinkElapsed = 0;
            } else if (c.prop) {
              // Keep cup at rest position
              c.prop.setPosition(c.sprite.x + 6, c.sprite.y - 2);
            }
          }
        }
      }
    },
    destroy() {
      for (const s of sprites) s.destroy();
      for (const c of crowd) {
        if (c.prop) c.prop.destroy();
      }
    },
  };
}

function spawnSmoke(scene, cx, cy) {
  const sx = cx + Phaser.Math.Between(-6, 6);
  const sy = cy - 6;
  const puff = scene.add
    .image(sx, sy, "smoke")
    .setScale(SCALE * (0.6 + Math.random() * 0.4))
    .setDepth(6)
    .setAlpha(TIRE_FIRE_SMOKE_OPACITY)
    .setTint(0x111111);
  scene.hudCam.ignore(puff);
  const duration =
    TIRE_FIRE_SMOKE_DURATION_MIN + Math.random() * TIRE_FIRE_SMOKE_DURATION_RANGE;
  const driftX = (Math.random() - 0.5) * 40;
  scene.tweens.add({
    targets: puff,
    y: sy - TIRE_FIRE_SMOKE_RISE_HEIGHT,
    x: sx + driftX,
    scale: SCALE * (1.6 + Math.random() * 0.8),
    alpha: 0,
    duration,
    ease: "Quad.easeOut",
    onComplete: () => puff.destroy(),
  });
}
