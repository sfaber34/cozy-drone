import Phaser from "phaser";
import {
  TILE, SCALE,
  ROCK_FIGHT_X, ROCK_FIGHT_Y,
  ROCK_FIGHT_GROUP_SIZE, ROCK_FIGHT_GROUP_SPACING,
  ROCK_FIGHT_GROUP_WIDTH, ROCK_FIGHT_GROUP_DEPTH,
  ROCK_FIGHT_THROW_INTERVAL_MIN, ROCK_FIGHT_THROW_INTERVAL_RANGE,
  ROCK_FIGHT_ROCK_SPEED, ROCK_FIGHT_ROCK_ARC_HEIGHT,
  ROCK_FIGHT_WINDUP_DURATION, ROCK_FIGHT_THROW_POSE_DURATION,
  ROCK_FIGHT_HIT_FLASH_DURATION, ROCK_FIGHT_HIT_KNOCKBACK,
  ROCK_FIGHT_IDLE_WAVE_INTERVAL_MIN, ROCK_FIGHT_IDLE_WAVE_INTERVAL_RANGE,
  ROCK_FIGHT_MIN_SPACING, ROCK_FIGHT_SPAWN_MAX_TRIES,
} from "../constants.js";

const GREETINGS = [
  "Get 'em!", "Cowards!", "Yalla!", "For honor!",
  "Take THAT!", "Our tribe!", "Rocks up!", "Aim high!",
  "Stone the\nothers!", "Scum!", "Enemies!", "BANG!",
];

export function createRockFight(scene, rng) {
  const cx = ROCK_FIGHT_X * TILE * SCALE;
  const cy = ROCK_FIGHT_Y * TILE * SCALE;

  scene.rockFightThrowers = [];
  scene.rockFightRocks = [];
  // Shared placement list across both groups so nobody stacks on anybody
  const placed = [];
  scene.rockFightLeftGroup  = spawnGroup(scene, rng, cx, cy, -1, placed);
  scene.rockFightRightGroup = spawnGroup(scene, rng, cx, cy,  1, placed);
}

function spawnGroup(scene, rng, cx, cy, side, placed) {
  const groupCx = cx + side * (ROCK_FIGHT_GROUP_SPACING / 2 + ROCK_FIGHT_GROUP_WIDTH / 2);
  const facingFlip = side === 1; // right group faces left
  const minDistSq = ROCK_FIGHT_MIN_SPACING * ROCK_FIGHT_MIN_SPACING;
  const group = [];
  for (let i = 0; i < ROCK_FIGHT_GROUP_SIZE; i++) {
    // Retry random positions until we find one far enough from every already-placed person
    let sx = 0, sy = 0;
    for (let tries = 0; tries < ROCK_FIGHT_SPAWN_MAX_TRIES; tries++) {
      sx = groupCx + rng.between(-ROCK_FIGHT_GROUP_WIDTH / 2, ROCK_FIGHT_GROUP_WIDTH / 2);
      sy = cy     + rng.between(-ROCK_FIGHT_GROUP_DEPTH / 2, ROCK_FIGHT_GROUP_DEPTH / 2);
      let ok = true;
      for (const p of placed) {
        const dx = sx - p.x, dy = sy - p.y;
        if (dx * dx + dy * dy < minDistSq) { ok = false; break; }
      }
      if (ok) break;
    }
    placed.push({ x: sx, y: sy });
    const skinId = rng.between(0, 199);
    const sprite = scene.add.image(sx, sy, `person-angry-${skinId}`)
      .setScale(SCALE).setDepth(2);
    sprite.setFlipX(facingFlip);

    const personEntry = {
      sprite,
      skinId,
      state: "idle",
      greeting: rng.pick(GREETINGS),
      noGreet: true,
      scatterPanic: true,
      returnHome: { x: sx, y: sy, event: "rockFight" },
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
      homeX: sx,
      homeY: sy,
      carriedGoods: null,
      isRockFightThrower: true,
      managedBySetPiece: true,
    };
    scene.people.push(personEntry);

    const thrower = {
      personEntry,
      sprite,
      skinId,
      side,
      facingFlip,
      // Throw cycle: idle → windup (cock) → release → idle
      phase: "idle",
      phaseTimer: 0,
      throwTimer: Math.random() * (ROCK_FIGHT_THROW_INTERVAL_MIN + ROCK_FIGHT_THROW_INTERVAL_RANGE),
      hitFlashTimer: 0,
      hitOrigX: 0,
      pendingTarget: null,
      // Idle angry-fist-shake
      idleFrame: Math.random() < 0.5 ? 0 : 1,
      idleWaveTimer:
        ROCK_FIGHT_IDLE_WAVE_INTERVAL_MIN +
        Math.random() * ROCK_FIGHT_IDLE_WAVE_INTERVAL_RANGE,
    };
    group.push(thrower);
    scene.rockFightThrowers.push(thrower);
  }
  return group;
}

export function updateRockFight(scene, dt) {
  if (!scene.rockFightThrowers) return;

  // Throwers — phase machine
  for (const t of scene.rockFightThrowers) {
    const pe = t.personEntry;

    // Hit flash recovery (runs regardless of state so victims always recover)
    if (t.hitFlashTimer > 0) {
      t.hitFlashTimer -= dt;
      if (t.hitFlashTimer <= 0) {
        t.sprite.clearTint();
        t.sprite.x = t.hitOrigX;
      }
    }

    // Don't run throw machine if person is panicking, returning, etc.
    if (pe.state !== "idle") continue;

    if (t.phase === "windup") {
      t.phaseTimer -= dt;
      if (t.phaseTimer <= 0) {
        // Release the rock
        t.sprite.setTexture(`person-throw2-${t.skinId}`);
        t.sprite.setFlipX(t.facingFlip);
        spawnRock(scene, t, t.pendingTarget);
        t.pendingTarget = null;
        t.phase = "release";
        t.phaseTimer = ROCK_FIGHT_THROW_POSE_DURATION;
      }
    } else if (t.phase === "release") {
      t.phaseTimer -= dt;
      if (t.phaseTimer <= 0) {
        t.sprite.setTexture(`person-angry-${t.skinId}`);
        t.sprite.setFlipX(t.facingFlip);
        t.phase = "idle";
      }
    } else {
      // Idle — angry fist-shake animation + countdown to next throw
      t.idleWaveTimer -= dt * 1000;
      if (t.idleWaveTimer <= 0) {
        t.idleWaveTimer =
          ROCK_FIGHT_IDLE_WAVE_INTERVAL_MIN +
          Math.random() * ROCK_FIGHT_IDLE_WAVE_INTERVAL_RANGE;
        t.idleFrame = 1 - t.idleFrame;
        t.sprite.setTexture(
          t.idleFrame === 0 ? `person-angry-${t.skinId}` : `person-shake-${t.skinId}`,
        );
        t.sprite.setFlipX(t.facingFlip);
      }

      t.throwTimer -= dt;
      if (t.throwTimer <= 0) {
        t.throwTimer =
          ROCK_FIGHT_THROW_INTERVAL_MIN + Math.random() * ROCK_FIGHT_THROW_INTERVAL_RANGE;
        const target = pickTarget(scene, t);
        if (target) {
          t.pendingTarget = target;
          t.sprite.setTexture(`person-throw1-${t.skinId}`);
          t.sprite.setFlipX(t.facingFlip);
          t.phase = "windup";
          t.phaseTimer = ROCK_FIGHT_WINDUP_DURATION;
        }
      }
    }
  }

  // Rocks in flight — parabolic arc
  for (let i = scene.rockFightRocks.length - 1; i >= 0; i--) {
    const r = scene.rockFightRocks[i];
    r.t += dt / r.duration;
    if (r.t >= 1) {
      r.sprite.destroy();
      scene.rockFightRocks.splice(i, 1);
      if (r.target) hitPerson(scene, r.target);
      continue;
    }
    const x = r.startX + (r.targetX - r.startX) * r.t;
    const baseY = r.startY + (r.targetY - r.startY) * r.t;
    const arc = ROCK_FIGHT_ROCK_ARC_HEIGHT * Math.sin(Math.PI * r.t);
    r.sprite.setPosition(x, baseY - arc);
    r.sprite.angle += 540 * dt;
  }
}

function pickTarget(scene, thrower) {
  const targets = thrower.side === -1 ? scene.rockFightRightGroup : scene.rockFightLeftGroup;
  if (!targets || targets.length === 0) return null;
  for (let tries = 0; tries < 5; tries++) {
    const cand = targets[Math.floor(Math.random() * targets.length)];
    if (cand && cand.personEntry.state === "idle") return cand;
  }
  return null;
}

function spawnRock(scene, thrower, target) {
  if (!target || target.personEntry.state !== "idle") return;
  // Hand position: above the thrower's head (matches throw2 hand at top corner)
  const handOffsetX = thrower.facingFlip ? -8 : 8;
  const startX = thrower.sprite.x + handOffsetX;
  const startY = thrower.sprite.y - 14;
  const targetX = target.sprite.x;
  const targetY = target.sprite.y - 4;
  const dist = Phaser.Math.Distance.Between(startX, startY, targetX, targetY);
  const duration = Math.max(0.2, dist / ROCK_FIGHT_ROCK_SPEED);

  const rock = scene.add.image(startX, startY, "thrown-rock")
    .setScale(SCALE).setDepth(6);
  scene.hudCam.ignore(rock);

  scene.rockFightRocks.push({
    sprite: rock,
    startX, startY,
    targetX, targetY,
    target,
    t: 0,
    duration,
  });
}

function hitPerson(scene, target) {
  const pe = target.personEntry;
  if (pe.state !== "idle") return; // already panicking/etc.

  target.sprite.setTint(0xff5555);
  target.hitOrigX = target.sprite.x;
  // Knockback away from the impact (push opposite of facing direction = away from attacker)
  target.sprite.x += target.facingFlip ? ROCK_FIGHT_HIT_KNOCKBACK : -ROCK_FIGHT_HIT_KNOCKBACK;
  target.hitFlashTimer = ROCK_FIGHT_HIT_FLASH_DURATION;

  // Brief "OW!" bubble
  const bubble = scene.add.text(target.sprite.x, target.sprite.y - 18, "OW!", {
    fontFamily: "monospace", fontSize: "10px",
    color: "#ff4444", backgroundColor: "#000000aa",
    padding: { x: 3, y: 2 },
  }).setOrigin(0.5, 1).setScale(SCALE * 0.5).setDepth(14);
  scene.hudCam.ignore(bubble);
  scene.tweens.add({
    targets: bubble,
    y: bubble.y - 8,
    alpha: 0,
    duration: ROCK_FIGHT_HIT_FLASH_DURATION * 1000,
    onComplete: () => bubble.destroy(),
  });
}
