import Phaser from "phaser";
import {
  TILE, SCALE,
  CHICKEN_FIGHT_X, CHICKEN_FIGHT_Y,
  CHICKEN_FIGHT_SPECTATORS, CHICKEN_FIGHT_SPEED,
  CHICKEN_FIGHT_DIRECTION_CHANGE,
} from "../constants.js";

export function createChickenFight(scene, rng) {
  const cx = CHICKEN_FIGHT_X * TILE * SCALE;
  const cy = CHICKEN_FIGHT_Y * TILE * SCALE;

  // Desert-colored ground to cover desert props
  const ground = scene.add.graphics();
  ground.fillStyle(0xd2b48c, 1);
  ground.fillRect(cx - 200, cy - 200, 400, 400);
  ground.setDepth(1.1);

  // Fighting ring
  scene.add.image(cx, cy, "fight-ring").setScale(SCALE).setDepth(1.5);

  // Two fighting chickens inside the ring
  const ringHalf = (24 * SCALE) / 2 - 10;
  scene.chickenFighters = [];
  for (let i = 0; i < 2; i++) {
    const startX = cx + (i === 0 ? -15 : 15);
    const sprite = scene.add.image(startX, cy, "chicken")
      .setScale(SCALE).setDepth(2);
    sprite.setFlipX(i === 1);
    const animalEntry = {
      sprite,
      type: "chicken",
      state: "idle",
      corral: { x: cx, y: cy, hw: ringHalf, hh: ringHalf },
      wanderAngle: Math.random() * Math.PI * 2,
      wanderTimer: 0,
      wanderDuration: 999,
      moving: false,
      runAngle: 0,
      runTimer: 0,
      runFrame: 0,
      panicTimer: 0,
      isChickenFighter: true,
    };
    scene.animals.push(animalEntry);

    scene.chickenFighters.push({
      sprite,
      animalEntry,
      dirTimer: 0,
      angle: Math.random() * Math.PI * 2,
      alive: true,
      ringCx: cx,
      ringCy: cy,
      ringRadius: ringHalf,
      returning: false,
    });
  }

  // Spectators around the ring — mix of money wavers and cheerers
  const spectatorGreetings = [
    "Bet! Bet!", "GO GO GO!", "Get him!", "Fight!",
    "My money's\non the red!", "Finish him!", "Yalla!",
    "100 dinars!", "Double or\nnothing!", "COME ON!",
    "Kill! Kill!", "Peck his\neyes out!", "500 on\nthe big one!",
  ];

  // Track spectators for animation
  if (!scene.chickenFightSpectators) scene.chickenFightSpectators = [];

  // Place in 2 rings for spacing
  const rings = [
    { dist: 80, count: Math.floor(CHICKEN_FIGHT_SPECTATORS * 0.4) },
    { dist: 120, count: Math.ceil(CHICKEN_FIGHT_SPECTATORS * 0.6) },
  ];

  for (const ring of rings) {
    for (let i = 0; i < ring.count; i++) {
      const angle = (i / ring.count) * Math.PI * 2 + (ring.dist > 100 ? 0.1 : 0);
      const jitter = rng.between(-10, 10);
      const sx = cx + Math.cos(angle) * (ring.dist + jitter);
      const sy = cy + Math.sin(angle) * (ring.dist + jitter);
      const skinId = rng.between(0, 199);

      // ~50% hold money, ~50% are cheerers (wave animation)
      const holdsMoney = Math.random() > 0.5;

      const startTex = holdsMoney
        ? `person-stand-${skinId}`
        : `person-wave1-${skinId}`;
      const sprite = scene.add.image(sx, sy, startTex)
        .setScale(SCALE).setDepth(2);

      let moneySprite = null;
      if (holdsMoney) {
        moneySprite = scene.add.image(sx + 8, sy - 5, "money")
          .setScale(SCALE * 0.8).setDepth(3);
      }

      const personEntry = {
        sprite,
        skinId,
        state: "idle",
        greeting: rng.pick(spectatorGreetings),
        noGreet: true,
        scatterPanic: true,
        returnHome: { x: sx, y: sy, event: "chickenFight" },
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
        carriedGoods: moneySprite,
        isChickenFightSpectator: true,
      };
      scene.people.push(personEntry);

      scene.chickenFightSpectators.push({
        personEntry,
        sprite,
        skinId,
        holdsMoney,
        moneySprite,
        animTimer: rng.between(0, 500),
        animInterval: 300 + rng.between(0, 200),
        animFrame: 0,
      });
    }
  }
}

export function updateChickenFight(scene, dt) {
  if (!scene.chickenFighters) return;

  for (const cf of scene.chickenFighters) {
    if (!cf.sprite.active) continue;
    const ae = cf.animalEntry;

    // Dead — mark fighter as dead
    if (ae.state === "dead") {
      cf.alive = false;
      continue;
    }

    // Panicking — let animal system handle movement, skip fight logic
    if (ae.state === "panicking") {
      cf.returning = true;
      continue;
    }

    // Just calmed down from panic — walk back to ring
    if (cf.returning && ae.state === "idle") {
      const distToRing = Phaser.Math.Distance.Between(
        cf.sprite.x, cf.sprite.y, cf.ringCx, cf.ringCy,
      );
      if (distToRing < 15) {
        // Arrived back at ring — resume fighting
        cf.returning = false;
        ae.wanderDuration = 999;
        ae.moving = false;
      } else {
        // Walk toward ring
        const angle = Phaser.Math.Angle.Between(
          cf.sprite.x, cf.sprite.y, cf.ringCx, cf.ringCy,
        );
        cf.sprite.x += Math.cos(angle) * 40 * dt;
        cf.sprite.y += Math.sin(angle) * 40 * dt;
        cf.sprite.setFlipX(Math.cos(angle) < 0);
        // Walk animation
        cf.runTimer = (cf.runTimer || 0) + dt;
        if (cf.runTimer > 0.15) {
          cf.runTimer = 0;
          cf.runFrame = (cf.runFrame || 0) === 0 ? 1 : 0;
          cf.sprite.setTexture(cf.runFrame === 0 ? "chicken" : "chicken2");
        }
        continue;
      }
    }

    if (!cf.alive) continue;

    // --- Fighting behavior ---
    cf.dirTimer += dt;
    if (cf.dirTimer > CHICKEN_FIGHT_DIRECTION_CHANGE) {
      cf.dirTimer = 0;
      cf.angle = Math.random() * Math.PI * 2;
    }

    const nx = cf.sprite.x + Math.cos(cf.angle) * CHICKEN_FIGHT_SPEED * dt;
    const ny = cf.sprite.y + Math.sin(cf.angle) * CHICKEN_FIGHT_SPEED * dt;

    if (Math.abs(nx - cf.ringCx) < cf.ringRadius &&
        Math.abs(ny - cf.ringCy) < cf.ringRadius) {
      cf.sprite.x = nx;
      cf.sprite.y = ny;
    } else {
      cf.angle = Phaser.Math.Angle.Between(
        cf.sprite.x, cf.sprite.y, cf.ringCx, cf.ringCy,
      ) + (Math.random() - 0.5) * 1.5;
    }

    cf.sprite.setFlipX(Math.cos(cf.angle) < 0);

    // Animate legs rapidly
    cf.runTimer = (cf.runTimer || 0) + dt;
    if (cf.runTimer > 0.08) {
      cf.runTimer = 0;
      cf.runFrame = (cf.runFrame || 0) === 0 ? 1 : 0;
      cf.sprite.setTexture(cf.runFrame === 0 ? "chicken" : "chicken2");
    }
  }

  // Animate spectators (only when idle at the ring)
  if (!scene.chickenFightSpectators) return;
  for (const spec of scene.chickenFightSpectators) {
    if (!spec.sprite.active) continue;
    if (spec.personEntry.state !== "idle") continue;

    spec.animTimer += dt * 1000;
    if (spec.animTimer > spec.animInterval) {
      spec.animTimer = 0;
      spec.animFrame = 1 - spec.animFrame;

      if (spec.holdsMoney) {
        // Wave money up and down
        spec.sprite.setTexture(
          spec.animFrame === 0
            ? `person-wave1-${spec.skinId}`
            : `person-wave2-${spec.skinId}`,
        );
        if (spec.moneySprite) {
          // Money follows the raised hand
          const yOff = spec.animFrame === 0 ? -8 : -14;
          spec.moneySprite.setPosition(spec.sprite.x + 10, spec.sprite.y + yOff);
        }
      } else {
        // Cheerers — wave/clap animation
        spec.sprite.setTexture(
          spec.animFrame === 0
            ? `person-wave1-${spec.skinId}`
            : `person-wave2-${spec.skinId}`,
        );
      }
    }
  }
}
