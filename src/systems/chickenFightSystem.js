import Phaser from "phaser";
import {
  TILE, SCALE,
  CHICKEN_FIGHT_X, CHICKEN_FIGHT_Y,
  CHICKEN_FIGHT_SPECTATORS, CHICKEN_FIGHT_SPEED,
  CHICKEN_FIGHT_DIRECTION_CHANGE,
} from "../constants.js";
import { createBettingSpectators, updateBettingSpectators } from "./spectatorUtils.js";

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

  // Spectators — shared utility for betting crowd
  createBettingSpectators(scene, rng, cx, cy, {
    count: CHICKEN_FIGHT_SPECTATORS,
    rings: [
      { dist: 80, fraction: 0.4 },
      { dist: 120, fraction: 0.6 },
    ],
    greetings: [
      "Bet! Bet!", "GO GO GO!", "Get him!", "Fight!",
      "My money's\non the red!", "Finish him!", "Yalla!",
      "100 dinars!", "Double or\nnothing!", "COME ON!",
      "Kill! Kill!", "Peck his\neyes out!", "500 on\nthe big one!",
    ],
    event: "chickenFight",
    spectatorKey: "chickenFightSpectators",
    flagKey: "isChickenFightSpectator",
  });
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

  // Animate spectators — shared utility
  updateBettingSpectators(scene, dt, "chickenFightSpectators");
}
