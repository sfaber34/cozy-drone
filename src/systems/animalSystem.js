import Phaser from "phaser";
import {
  WORLD_W, WORLD_H, TILE, SCALE, FARM_X, FARM_Y, FLOCK_X, FLOCK_Y,
  ANIMAL_KILL_RADIUS, ANIMAL_PANIC_RADIUS, ANIMAL_PANIC_TIMEOUT,
  ANIMAL_FLOCK_RADIUS, ANIMAL_FREE_ROAM_RADIUS,
  FLOCK_GOAT_COUNT, FLOCK_SHEPHERD_COUNT,
} from "../constants.js";
import { shepherdGreetings } from "../dialog.js";
import { steerAroundBuildings } from "./buildingSystem.js";

export function createAnimals(scene, rng) {
  scene.animals = [];

  const farmX = FARM_X * TILE * SCALE;
  const farmY = FARM_Y * TILE * SCALE;

  const corralDefs = [
    { cx: farmX - 400, cy: farmY - 100, animal: "pig", count: 6 },
    { cx: farmX - 400, cy: farmY + 120, animal: "chicken", count: 10 },
    { cx: farmX + 550, cy: farmY - 100, animal: "camel", count: 4 },
    { cx: farmX + 550, cy: farmY + 120, animal: "goat", count: 6 },
  ];

  const corralW = 32 * SCALE;
  const corralH = 24 * SCALE;

  for (const cd of corralDefs) {
    // Draw the corral fence
    scene.add.image(cd.cx, cd.cy, "corral").setScale(SCALE).setDepth(1.5);

    // Spawn animals inside
    for (let a = 0; a < cd.count; a++) {
      const ax =
        cd.cx + Phaser.Math.Between(-corralW / 2 + 15, corralW / 2 - 15);
      const ay =
        cd.cy + Phaser.Math.Between(-corralH / 2 + 10, corralH / 2 - 10);
      const sprite = scene.add
        .image(ax, ay, cd.animal)
        .setScale(SCALE)
        .setDepth(2);
      scene.animals.push({
        sprite,
        type: cd.animal,
        state: "idle", // idle | panicking | dead
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

  // ==========================================
  // GOAT FLOCK WITH SHEPHERDS (right of farm)
  // ==========================================
  const flockX = FLOCK_X * TILE * SCALE;
  const flockY = FLOCK_Y * TILE * SCALE;
  const flockRadius = ANIMAL_FLOCK_RADIUS;

  // Large goat flock
  for (let g = 0; g < FLOCK_GOAT_COUNT; g++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * flockRadius * 0.8;
    const gx = flockX + Math.cos(angle) * dist;
    const gy = flockY + Math.sin(angle) * dist;
    const sprite = scene.add.image(gx, gy, "goat").setScale(SCALE).setDepth(2);
    scene.animals.push({
      sprite,
      type: "goat",
      state: "idle",
      corral: { x: flockX, y: flockY, hw: flockRadius, hh: flockRadius },
      wanderAngle: Math.random() * Math.PI * 2,
      wanderTimer: 0,
      wanderDuration: 1 + Math.random() * 3,
      moving: Math.random() > 0.5,
      runAngle: 0,
      runTimer: 0,
      runFrame: 0,
      panicTimer: 0,
    });
  }

  // Shepherds (spread around the flock edges)
  const shepherdPositions = [
    { x: flockX - 160, y: flockY - 80 },
    { x: flockX + 170, y: flockY + 60 },
    { x: flockX - 40, y: flockY + 170 },
    { x: flockX + 100, y: flockY - 150 },
    { x: flockX - 180, y: flockY + 80 },
    { x: flockX + 200, y: flockY - 30 },
    { x: flockX - 100, y: flockY - 160 },
    { x: flockX + 50, y: flockY + 190 },
    { x: flockX - 200, y: flockY - 20 },
  ].slice(0, FLOCK_SHEPHERD_COUNT);
  for (const sp of shepherdPositions) {
    const skinId = rng.between(0, 199); // any skin for shepherds
    const sprite = scene.add
      .image(sp.x, sp.y, `person-stand-${skinId}`)
      .setScale(SCALE)
      .setDepth(2);
    scene.people.push({
      sprite,
      skinId,
      state: "idle",
      greeting: rng.pick(shepherdGreetings),
      noGreet: false,
      scatterPanic: true,
      bubble: null,
      waveTimer: 0,
      waveFrame: 0,
      runAngle: 0,
      runTimer: 0,
      runFrame: 0,
      wanderTimer: 0,
      wanderDuration: 3 + Math.random() * 4,
      wanderAngle: Math.random() < 0.5 ? null : Math.random() * Math.PI * 2,
      hideTarget: null,
      homeX: sp.x,
      homeY: sp.y,
    });
  }
}

export function updateAnimals(scene, dt) {
  const worldW = WORLD_W * TILE * SCALE;
  const worldH = WORLD_H * TILE * SCALE;

  for (const a of scene.animals) {
    if (a.state === "dead") continue;
    // Chicken fighters in idle state are controlled by chickenFightSystem
    if ((a.isChickenFighter || a.isRaceCamel) && a.state === "idle") continue;

    // Determine if animal is inside its corral
    const insideCorral =
      Math.abs(a.sprite.x - a.corral.x) < a.corral.hw &&
      Math.abs(a.sprite.y - a.corral.y) < a.corral.hh;

    if (a.state === "idle") {
      // Wander
      a.wanderTimer += dt;
      if (a.wanderTimer > a.wanderDuration) {
        a.wanderTimer = 0;
        a.wanderDuration = 1 + Math.random() * 3;
        a.moving = Math.random() > 0.3;
        a.wanderAngle = Math.random() * Math.PI * 2;
      }

      if (a.moving) {
        const speed = a.type === "chicken" ? 15 : 10;
        // Steer around buildings
        const steered = steerAroundBuildings(
          scene,
          a.sprite.x,
          a.sprite.y,
          a.wanderAngle,
          dt,
        );
        if (steered !== a.wanderAngle) a.wanderAngle = steered;

        const nx = a.sprite.x + Math.cos(a.wanderAngle) * speed * dt;
        const ny = a.sprite.y + Math.sin(a.wanderAngle) * speed * dt;

        if (insideCorral) {
          if (
            Math.abs(nx - a.corral.x) < a.corral.hw - 10 &&
            Math.abs(ny - a.corral.y) < a.corral.hh - 10
          ) {
            a.sprite.x = nx;
            a.sprite.y = ny;
          } else {
            a.wanderAngle =
              Phaser.Math.Angle.Between(
                a.sprite.x,
                a.sprite.y,
                a.corral.x,
                a.corral.y,
              ) +
              (Math.random() - 0.5) * 1.0;
          }
        } else {
          const wanderRadius = ANIMAL_FREE_ROAM_RADIUS;
          if (!a.freeRoamOrigin) {
            a.freeRoamOrigin = { x: a.sprite.x, y: a.sprite.y };
          }
          if (
            Math.abs(nx - a.freeRoamOrigin.x) < wanderRadius &&
            Math.abs(ny - a.freeRoamOrigin.y) < wanderRadius &&
            nx > 10 &&
            nx < worldW - 10 &&
            ny > 10 &&
            ny < worldH - 10
          ) {
            a.sprite.x = nx;
            a.sprite.y = ny;
          } else {
            a.wanderAngle =
              Phaser.Math.Angle.Between(
                a.sprite.x,
                a.sprite.y,
                a.freeRoamOrigin.x,
                a.freeRoamOrigin.y,
              ) +
              (Math.random() - 0.5) * 1.0;
          }
        }
        a.sprite.setFlipX(Math.cos(a.wanderAngle) < 0);

        // Run animation frame cycling
        a.runTimer += dt;
        if (a.runTimer > 0.15) {
          a.runTimer = 0;
          a.runFrame = 1 - a.runFrame;
          a.sprite.setTexture(a.runFrame === 0 ? a.type : a.type + "2");
        }
      } else {
        // Standing still: reset to base frame
        a.sprite.setTexture(a.type);
        a.runTimer = 0;
        a.runFrame = 0;
      }
    }

    if (a.state === "panicking") {
      const speed = a.type === "chicken" ? 80 : a.type === "camel" ? 50 : 60;
      // Steer around buildings
      a.runAngle = steerAroundBuildings(
        scene,
        a.sprite.x,
        a.sprite.y,
        a.runAngle,
        dt,
      );
      a.sprite.x += Math.cos(a.runAngle) * speed * dt;
      a.sprite.y += Math.sin(a.runAngle) * speed * dt;
      a.sprite.setFlipX(Math.cos(a.runAngle) < 0);

      // Run animation frame cycling
      a.runTimer += dt;
      if (a.runTimer > 0.15) {
        a.runTimer = 0;
        a.runFrame = 1 - a.runFrame;
        a.sprite.setTexture(a.runFrame === 0 ? a.type : a.type + "2");
      }

      // Bounce off world edges
      const margin = 50;
      if (a.sprite.x < margin) {
        a.sprite.x = margin;
        a.runAngle = Math.PI - a.runAngle;
      }
      if (a.sprite.x > worldW - margin) {
        a.sprite.x = worldW - margin;
        a.runAngle = Math.PI - a.runAngle;
      }
      if (a.sprite.y < margin) {
        a.sprite.y = margin;
        a.runAngle = -a.runAngle;
      }
      if (a.sprite.y > worldH - margin) {
        a.sprite.y = worldH - margin;
        a.runAngle = -a.runAngle;
      }

      // Calm down after a while
      a.panicTimer += dt;
      if (a.panicTimer > ANIMAL_PANIC_TIMEOUT) {
        a.state = "idle";
        a.panicTimer = 0;
        a.freeRoamOrigin = null; // Reset so it picks up current position if outside corral
      }
    }
  }
}

export function affectNearbyAnimals(scene, x, y) {
  const killRadius = ANIMAL_KILL_RADIUS;
  const panicRadius = ANIMAL_PANIC_RADIUS;

  for (const a of scene.animals) {
    if (a.state === "dead") continue;
    const dist = Phaser.Math.Distance.Between(x, y, a.sprite.x, a.sprite.y);

    if (dist < killRadius) {
      // Explode into meat!
      a.state = "dead";
      a.sprite.setVisible(false);
      const meatCount = Phaser.Math.Between(3, 6);
      for (let m = 0; m < meatCount; m++) {
        const meat = scene.add
          .image(a.sprite.x, a.sprite.y, "meat")
          .setScale(SCALE * 0.7)
          .setDepth(12);
        scene.hudCam.ignore(meat);
        const angle = Math.random() * Math.PI * 2;
        const flingDist = 30 + Math.random() * 60;
        scene.tweens.add({
          targets: meat,
          x: a.sprite.x + Math.cos(angle) * flingDist,
          y: a.sprite.y + Math.sin(angle) * flingDist,
          angle: Phaser.Math.Between(-360, 360),
          alpha: 0,
          duration: 800 + Math.random() * 400,
          delay: Math.random() * 100,
          ease: "Quad.easeOut",
          onComplete: () => meat.destroy(),
        });
      }
    } else if (dist < panicRadius && a.state !== "panicking") {
      a.state = "panicking";
      const awayAngle = Phaser.Math.Angle.Between(
        x,
        y,
        a.sprite.x,
        a.sprite.y,
      );
      a.runAngle = awayAngle + (Math.random() - 0.5) * 1.0;
      a.panicTimer = 0;
    }
  }
}
