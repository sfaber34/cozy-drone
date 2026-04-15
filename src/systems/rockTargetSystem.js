// Rock target practice set piece.
//
// Factory pattern:
//   const rt = createRockTarget(scene, rng, { tileX, tileY });
//   scene.setPieces.push(rt);
//
// A row of people roughly lined up on the south side, a larger grid of
// breakable objects (vases, bottles, jugs) to their north. Each thrower
// picks a random target, windupsa rock, and lobs it over an arc. Some
// throws miss (configurable via ROCK_TARGET_MISS_CHANCE). Hits shatter
// the target into shards and the thrower briefly cheers. Broken targets
// respawn after a cooldown so the row never empties out.
import Phaser from "phaser";
import {
  TILE, SCALE,
  ROCK_TARGET_THROWER_COUNT,
  ROCK_TARGET_OBJECT_COUNT, ROCK_TARGET_OBJECT_ROWS,
  ROCK_TARGET_THROWER_SPREAD_PX, ROCK_TARGET_OBJECT_SPREAD_PX,
  ROCK_TARGET_FIELD_DEPTH_PX,
  ROCK_TARGET_THROW_INTERVAL_MIN, ROCK_TARGET_THROW_INTERVAL_RANGE,
  ROCK_TARGET_WINDUP_DURATION, ROCK_TARGET_RELEASE_POSE_DURATION,
  ROCK_TARGET_ROCK_SPEED, ROCK_TARGET_ROCK_ARC_HEIGHT,
  ROCK_TARGET_MISS_CHANCE, ROCK_TARGET_MISS_SPREAD_PX,
  ROCK_TARGET_RESPAWN_MIN, ROCK_TARGET_RESPAWN_RANGE,
  ROCK_TARGET_CHEER_DURATION,
  ROCK_TARGET_SHARD_COUNT, ROCK_TARGET_SHARD_DURATION, ROCK_TARGET_SHARD_SPREAD,
  ROCK_TARGET_MIN_SPACING_PX,
  ROCK_TARGET_OBJECT_SCALE,
} from "../constants.js";
import { createManagedPerson } from "./managedPersonUtils.js";

const THROWER_GREETINGS = [
  "Target\npractice!", "Got it!", "Good eye!",
  "Line up!", "Smash!", "Easy shot!",
  "Bottles!", "Watch this!", "HA!",
];

const TARGET_VARIANTS = [
  { tex: "target-vase",   tint: 0xc8754a },
  { tex: "target-bottle", tint: 0x4a8a5a },
  { tex: "target-jug",    tint: 0xd9a86a },
];

export function createRockTarget(scene, rng, opts) {
  const { tileX, tileY } = opts;
  const cx = tileX * TILE * SCALE;
  const cy = tileY * TILE * SCALE;

  const throwers = [];
  const targets = [];
  const rocks = [];

  spawnThrowers(scene, rng, cx, cy, throwers);
  spawnTargets(scene, rng, cx, cy, targets);

  return {
    type: "rockTarget",
    bounds: {
      cx,
      cy: cy - ROCK_TARGET_FIELD_DEPTH_PX / 2,
      hw: Math.max(ROCK_TARGET_THROWER_SPREAD_PX, ROCK_TARGET_OBJECT_SPREAD_PX) / 2 + 30,
      hh: ROCK_TARGET_FIELD_DEPTH_PX / 2 + 60,
    },
    update(dt) {
      updateThrowers(scene, throwers, targets, rocks, dt);
      updateRocks(scene, rocks, dt);
      updateTargets(targets, dt);
    },
    destroy() {
      for (const t of targets) {
        if (t.sprite && t.sprite.active) t.sprite.destroy();
      }
      for (const r of rocks) r.sprite.destroy();
    },
  };
}

// --- Setup -----------------------------------------------------------------

function spawnThrowers(scene, rng, cx, cy, throwers) {
  const half = ROCK_TARGET_THROWER_SPREAD_PX / 2;
  const placed = [];
  const minSq = ROCK_TARGET_MIN_SPACING_PX * ROCK_TARGET_MIN_SPACING_PX;

  for (let i = 0; i < ROCK_TARGET_THROWER_COUNT; i++) {
    let sx = 0, sy = 0;
    for (let tries = 0; tries < 30; tries++) {
      // Thrower line at the SOUTH of the set piece (larger y)
      sx = cx + rng.between(-half, half);
      sy = cy + rng.between(-12, 12);
      let ok = true;
      for (const p of placed) {
        const dx = sx - p.x, dy = sy - p.y;
        if (dx * dx + dy * dy < minSq) { ok = false; break; }
      }
      if (ok) break;
    }
    placed.push({ x: sx, y: sy });

    const skinId = rng.between(0, 199);
    const { sprite, personEntry } = createManagedPerson(scene, {
      x: sx, y: sy, skinId,
      texture: `person-stand-${skinId}`,
      greeting: rng.pick(THROWER_GREETINGS),
      depth: 2,
      event: "rockTarget",
      flagKey: "isRockTargetThrower",
    });

    throwers.push({
      personEntry,
      sprite,
      skinId,
      homeX: sx,
      homeY: sy,
      phase: "idle", // "idle" | "windup" | "release" | "cheer"
      phaseTimer: 0,
      throwTimer:
        Math.random() *
        (ROCK_TARGET_THROW_INTERVAL_MIN + ROCK_TARGET_THROW_INTERVAL_RANGE),
      pendingTarget: null,
      pendingMiss: false,
    });
  }
}

function spawnTargets(scene, rng, cx, cy, targets) {
  const rows = ROCK_TARGET_OBJECT_ROWS;
  const perRow = Math.ceil(ROCK_TARGET_OBJECT_COUNT / rows);
  const rowStep = 24; // px between rows (front to back)
  const rowSpan = ROCK_TARGET_OBJECT_SPREAD_PX;
  let placed = 0;
  for (let r = 0; r < rows && placed < ROCK_TARGET_OBJECT_COUNT; r++) {
    // Back row is farther away (smaller y since "north" = smaller y in our world)
    const rowY = cy - ROCK_TARGET_FIELD_DEPTH_PX - r * rowStep;
    for (let i = 0; i < perRow && placed < ROCK_TARGET_OBJECT_COUNT; i++) {
      const t = rng.between(-15, 15);
      const x = cx - rowSpan / 2 + (i + 0.5) * (rowSpan / perRow) + t;
      const y = rowY + rng.between(-6, 6);
      const variant = TARGET_VARIANTS[rng.between(0, TARGET_VARIANTS.length - 1)];
      const sprite = scene.add.image(x, y, variant.tex)
        .setScale(SCALE * ROCK_TARGET_OBJECT_SCALE).setDepth(2);
      targets.push({
        sprite,
        variant,
        homeX: x,
        homeY: y,
        alive: true,
        respawnTimer: 0,
      });
      placed++;
    }
  }
}

// --- Update loops ----------------------------------------------------------

function updateThrowers(scene, throwers, targets, rocks, dt) {
  for (const t of throwers) {
    if (t.personEntry.state !== "idle") continue;

    if (t.phase === "windup") {
      t.phaseTimer -= dt;
      if (t.phaseTimer <= 0) {
        // Release the rock
        t.sprite.setTexture(`person-throw2-${t.skinId}`);
        spawnRock(scene, t, t.pendingTarget, t.pendingMiss, rocks);
        t.pendingTarget = null;
        t.pendingMiss = false;
        t.phase = "release";
        t.phaseTimer = ROCK_TARGET_RELEASE_POSE_DURATION;
      }
    } else if (t.phase === "release") {
      t.phaseTimer -= dt;
      if (t.phaseTimer <= 0) {
        t.sprite.setTexture(`person-stand-${t.skinId}`);
        t.phase = "idle";
      }
    } else if (t.phase === "cheer") {
      t.phaseTimer -= dt * 1000;
      // Alternate shake (fist raised) and wave2 (arms up) for the cheer
      const frame = Math.floor(t.phaseTimer / 180) % 2;
      t.sprite.setTexture(
        frame === 0 ? `person-shake-${t.skinId}` : `person-wave2-${t.skinId}`,
      );
      if (t.phaseTimer <= 0) {
        t.sprite.setTexture(`person-stand-${t.skinId}`);
        t.phase = "idle";
      }
    } else {
      // idle — count down to next throw
      t.throwTimer -= dt;
      if (t.throwTimer <= 0) {
        t.throwTimer =
          ROCK_TARGET_THROW_INTERVAL_MIN +
          Math.random() * ROCK_TARGET_THROW_INTERVAL_RANGE;
        const target = pickTarget(targets);
        if (target) {
          t.pendingTarget = target;
          t.pendingMiss = Math.random() < ROCK_TARGET_MISS_CHANCE;
          t.sprite.setTexture(`person-throw1-${t.skinId}`);
          t.phase = "windup";
          t.phaseTimer = ROCK_TARGET_WINDUP_DURATION;
        }
      }
    }
  }
}

function updateRocks(scene, rocks, dt) {
  for (let i = rocks.length - 1; i >= 0; i--) {
    const r = rocks[i];
    r.t += dt / r.duration;
    if (r.t >= 1) {
      r.sprite.destroy();
      rocks.splice(i, 1);
      // Landing: if we aimed at a live target and didn't miss, break it
      if (!r.isMiss && r.target && r.target.alive) {
        breakTarget(scene, r.target);
        if (r.thrower) {
          r.thrower.phase = "cheer";
          r.thrower.phaseTimer = ROCK_TARGET_CHEER_DURATION;
        }
      } else {
        // Miss — small dust puff where it landed
        spawnMissDust(scene, r.targetX, r.targetY);
      }
      continue;
    }
    const x = r.startX + (r.targetX - r.startX) * r.t;
    const baseY = r.startY + (r.targetY - r.startY) * r.t;
    const arc = ROCK_TARGET_ROCK_ARC_HEIGHT * Math.sin(Math.PI * r.t);
    r.sprite.setPosition(x, baseY - arc);
    r.sprite.angle += 600 * dt;
  }
}

function updateTargets(targets, dt) {
  for (const t of targets) {
    if (t.alive) continue;
    t.respawnTimer -= dt * 1000;
    if (t.respawnTimer <= 0) {
      t.sprite.setTexture(t.variant.tex);
      t.sprite.setPosition(t.homeX, t.homeY);
      t.sprite.setScale(SCALE * ROCK_TARGET_OBJECT_SCALE);
      t.sprite.setAngle(0);
      t.sprite.setAlpha(1);
      t.sprite.clearTint();
      t.sprite.setVisible(true);
      t.alive = true;
    }
  }
}

// --- Helpers ---------------------------------------------------------------

function pickTarget(targets) {
  const alive = targets.filter((t) => t.alive);
  if (alive.length === 0) return null;
  return alive[Math.floor(Math.random() * alive.length)];
}

function spawnRock(scene, thrower, target, isMiss, rocks) {
  if (!target) return;
  const startX = thrower.sprite.x;
  const startY = thrower.sprite.y - 14;

  let targetX = target.sprite.x;
  let targetY = target.sprite.y - 4;
  if (isMiss) {
    const spread = ROCK_TARGET_MISS_SPREAD_PX;
    targetX += (Math.random() - 0.5) * 2 * spread;
    targetY += (Math.random() - 0.5) * 2 * spread;
  }

  const dist = Phaser.Math.Distance.Between(startX, startY, targetX, targetY);
  const duration = Math.max(0.25, dist / ROCK_TARGET_ROCK_SPEED);
  const rock = scene.add
    .image(startX, startY, "thrown-rock")
    .setScale(SCALE)
    .setDepth(6);
  scene.hudCam.ignore(rock);

  rocks.push({
    sprite: rock,
    thrower,
    target,
    isMiss,
    startX, startY,
    targetX, targetY,
    t: 0,
    duration,
  });
}

function breakTarget(scene, target) {
  target.alive = false;
  target.sprite.setVisible(false);
  target.respawnTimer =
    ROCK_TARGET_RESPAWN_MIN + Math.random() * ROCK_TARGET_RESPAWN_RANGE;

  for (let i = 0; i < ROCK_TARGET_SHARD_COUNT; i++) {
    const shard = scene.add
      .image(target.homeX, target.homeY, "target-shard")
      .setScale(SCALE * (0.6 + Math.random() * 0.6))
      .setDepth(7)
      .setTint(target.variant.tint);
    scene.hudCam.ignore(shard);

    const angle = Math.random() * Math.PI * 2;
    const dist = ROCK_TARGET_SHARD_SPREAD * (0.5 + Math.random() * 0.9);
    scene.tweens.add({
      targets: shard,
      x: target.homeX + Math.cos(angle) * dist,
      y: target.homeY + Math.sin(angle) * dist,
      angle: Phaser.Math.Between(-540, 540),
      alpha: 0,
      duration: ROCK_TARGET_SHARD_DURATION + Math.random() * 200,
      ease: "Quad.easeOut",
      onComplete: () => shard.destroy(),
    });
  }
}

function spawnMissDust(scene, x, y) {
  const puff = scene.add
    .image(x, y, "smoke")
    .setScale(SCALE * 0.35)
    .setDepth(5)
    .setAlpha(0.55)
    .setTint(0xcaa877);
  scene.hudCam.ignore(puff);
  scene.tweens.add({
    targets: puff,
    alpha: 0,
    scale: SCALE * 0.7,
    y: y - 8,
    duration: 450,
    onComplete: () => puff.destroy(),
  });
}
