import Phaser from "phaser";
import {
  SCALE, MISSILE_LAUNCH_VOLUME, EXPLOSION_VOLUME,
  MISSILE_SPEED, MISSILE_TURN_RATE, MISSILE_BOOST_TIME,
  MISSILE_MAX_SPEED, MISSILE_ACCEL, MISSILE_DESCENT_RATE,
  MISSILE_HIT_RADIUS, MISSILE_SMOKE_INTERVAL,
  SCREEN_SHAKE_DURATION, SCREEN_SHAKE_INTENSITY,
} from "../constants.js";
import { ghostLines } from "../dialog.js";
import { playSfx, playSfxAt, playDeathSfxAt } from "./audioSystem.js";
import { affectNearbyPeople } from "./peopleSystem.js";
import { affectNearbyAnimals } from "./animalSystem.js";
import { killPeopleInBuilding } from "./buildingSystem.js";

export function fireMissile(scene) {
  if (!scene.targetPos) return;

  // Launch from drone's nose in the direction it's facing
  const ds = scene.droneState;
  const launchRad = Phaser.Math.DegToRad(ds.angle - 90);
  const launchOffset = 30;
  const startX = ds.x + Math.cos(launchRad) * launchOffset;
  const startY = ds.y + Math.sin(launchRad) * launchOffset;

  const missile = scene.add
    .image(startX, startY, "missile")
    .setScale(SCALE)
    .setDepth(9);
  scene.hudCam.ignore(missile);

  // Missile shadow on the ground
  const missileShadow = scene.add
    .image(startX, startY, "missile")
    .setScale(SCALE * 0.6)
    .setDepth(1.5)
    .setAlpha(0.25)
    .setTint(0x000000);
  scene.hudCam.ignore(missileShadow);

  // Missile starts heading in the drone's direction
  const heading = launchRad;
  missile.setRotation(heading + Math.PI / 2);
  missileShadow.setRotation(heading + Math.PI / 2);
  playSfx(scene, "missileLaunch", MISSILE_LAUNCH_VOLUME);

  scene.missiles.push({
    sprite: missile,
    shadow: missileShadow,
    target: { x: scene.targetPos.x, y: scene.targetPos.y },
    speed: MISSILE_SPEED,
    heading, // current direction of travel (radians)
    turnRate: MISSILE_TURN_RATE, // radians/sec max turn
    boostTime: MISSILE_BOOST_TIME, // seconds of straight flight before turning
    elapsed: 0,
    altitude: ds.altitude,
    launchAlt: ds.altitude, // remember starting altitude for scale calc
  });
}

export function updateMissiles(scene, dt) {
  for (let i = scene.missiles.length - 1; i >= 0; i--) {
    const m = scene.missiles[i];
    m.elapsed += dt;

    // Always track the current target point
    if (scene.targetPos) {
      m.target.x = scene.targetPos.x;
      m.target.y = scene.targetPos.y;
    }

    const targetAngle = Phaser.Math.Angle.Between(
      m.sprite.x,
      m.sprite.y,
      m.target.x,
      m.target.y,
    );
    const dist = Phaser.Math.Distance.Between(
      m.sprite.x,
      m.sprite.y,
      m.target.x,
      m.target.y,
    );

    // After initial boost, steer toward target
    if (m.elapsed > m.boostTime && dist > 5) {
      let diff = Phaser.Math.Angle.Wrap(targetAngle - m.heading);
      const maxTurn = m.turnRate * dt;
      m.heading += Phaser.Math.Clamp(diff, -maxTurn, maxTurn);
    }

    // Accelerate after boost phase
    if (m.elapsed > m.boostTime) {
      m.speed = Math.min(MISSILE_MAX_SPEED, m.speed + MISSILE_ACCEL * dt);
    }

    m.sprite.x += Math.cos(m.heading) * m.speed * dt;
    m.sprite.y += Math.sin(m.heading) * m.speed * dt;
    m.sprite.setRotation(m.heading + Math.PI / 2);

    // Update shadow — lerps from under missile toward target as altitude drops
    if (m.shadow) {
      const altFrac = m.launchAlt > 0 ? m.altitude / m.launchAlt : 0;
      // Shadow on ground: starts under missile, converges on target
      const shadowX = Phaser.Math.Linear(m.target.x, m.sprite.x, altFrac);
      const shadowY = Phaser.Math.Linear(m.target.y, m.sprite.y, altFrac);
      m.shadow.setPosition(shadowX, shadowY);
      m.shadow.setRotation(m.heading + Math.PI / 2);
      m.shadow.setScale(SCALE * (0.3 + altFrac * 0.3));
      m.shadow.setAlpha(0.1 + (1 - altFrac) * 0.25);
    }

    // Smoke trail
    m.smokeTimer = (m.smokeTimer || 0) + dt * 1000;
    if (m.smokeTimer > MISSILE_SMOKE_INTERVAL) {
      m.smokeTimer = 0;
      // Offset smoke to the back of the missile (opposite of heading)
      const smokeX = m.sprite.x - Math.cos(m.heading) * 12;
      const smokeY = m.sprite.y - Math.sin(m.heading) * 12;
      const puff = scene.add
        .image(smokeX, smokeY, "smoke")
        .setScale(SCALE * (0.4 + Math.random() * 0.3))
        .setDepth(8)
        .setAlpha(0.6);
      scene.hudCam.ignore(puff);
      scene.tweens.add({
        targets: puff,
        alpha: 0,
        scale: SCALE * (0.8 + Math.random() * 0.4),
        x: puff.x + (Math.random() - 0.5) * 10,
        y: puff.y + (Math.random() - 0.5) * 10,
        duration: 400 + Math.random() * 200,
        onComplete: () => puff.destroy(),
      });
    }

    // Missile descends
    m.altitude = Math.max(0, m.altitude - MISSILE_DESCENT_RATE * dt);

    // Scale missile: full size at launch altitude, shrinks as it descends to ground
    const altFrac = m.launchAlt > 0 ? m.altitude / m.launchAlt : 0;
    const mScale = SCALE * (0.3 + altFrac * 0.7);
    m.sprite.setScale(mScale);

    if (dist < MISSILE_HIT_RADIUS) {
      missileImpact(scene, m.target.x, m.target.y);
      m.sprite.destroy();
      if (m.shadow) m.shadow.destroy();
      scene.missiles.splice(i, 1);
    } else if (m.altitude <= 0) {
      missileImpact(scene, m.sprite.x, m.sprite.y);
      m.sprite.destroy();
      if (m.shadow) m.shadow.destroy();
      scene.missiles.splice(i, 1);
    }
  }
}

export function missileImpact(scene, x, y) {
  // Explosion
  const exp = scene.add
    .sprite(x, y, "explosion-sheet", 0)
    .setScale(SCALE * 2)
    .setDepth(11);
  scene.hudCam.ignore(exp);
  exp.play("explode");
  exp.once("animationcomplete", () => exp.destroy());

  // Spawn cute symbols (randomized count, types, directions)
  const symbols = ["heart", "flower", "smiley", "star", "rainbow"];
  const count = Phaser.Math.Between(3, 12);
  for (let i = 0; i < count; i++) {
    const tex = Phaser.Utils.Array.GetRandom(symbols);
    const s = SCALE * 0.5;
    const sym = scene.add.image(x, y, tex).setScale(s).setDepth(12);
    scene.hudCam.ignore(sym);
    const angle = Math.random() * Math.PI * 2;
    const dist = 30 + Math.random() * 120;
    const duration = 400 + Math.random() * 800;
    scene.tweens.add({
      targets: sym,
      x: x + Math.cos(angle) * dist,
      y: y + Math.sin(angle) * dist - 20 - Math.random() * 30,
      scale: s * (0.3 + Math.random() * 0.7),
      alpha: 0,
      angle: Phaser.Math.Between(-270, 270),
      duration,
      delay: Math.random() * 150,
      ease: "Quad.easeOut",
      onComplete: () => sym.destroy(),
    });
  }

  // Explosion SFX — directional relative to drone
  playSfxAt(scene, "explosion", x, y, EXPLOSION_VOLUME);

  // Screen shake
  scene.cameras.main.shake(SCREEN_SHAKE_DURATION, SCREEN_SHAKE_INTENSITY);

  // Check building hits
  for (const b of scene.buildings) {
    if (b.destroyed) continue;
    const dist = Phaser.Math.Distance.Between(x, y, b.x, b.y);
    if (dist < b.radius) {
      b.hp--;
      if (b.hp <= 0) {
        // Destroyed
        b.destroyed = true;
        if (b.isOilWell) {
          b.sprite.setTexture("oil-well-burn");
          b.sprite.clearTint();
          if (b.wellRef) b.wellRef.alive = false;
        } else if (b.isOilInfra) {
          // Oil tank — show as dark burned tank
          b.sprite.setTint(0x333333);
        } else {
          b.sprite.setTexture("rubble");
          b.sprite.setTint(0x888888);
        }
        if (b.cracksSprite) b.cracksSprite.destroy();
        for (const f of b.fireSprites) f.destroy();
        b.fireSprites = [];
        // Big explosion
        scene.time.delayedCall(100, () => {
          const exp3 = scene.add
            .sprite(b.x, b.y, "explosion-sheet", 0)
            .setScale(SCALE * 2)
            .setDepth(11);
          scene.hudCam.ignore(exp3);
          exp3.play("explode");
          exp3.once("animationcomplete", () => exp3.destroy());
        });
        // Oil infrastructure burns forever with black smoke
        if (b.isOilInfra) {
          // Persistent fire
          const permFire = scene.add
            .image(b.x, b.y - 5, "fire")
            .setScale(SCALE * 1.5)
            .setDepth(3);
          scene.hudCam.ignore(permFire);
          scene.tweens.add({
            targets: permFire,
            scaleX: { from: SCALE * 1.2, to: SCALE * 1.8 },
            scaleY: { from: SCALE * 1.5, to: SCALE * 2.0 },
            alpha: { from: 1, to: 0.7 },
            duration: 400,
            yoyo: true,
            repeat: -1,
          });
          // Perpetual black smoke plume
          scene.time.addEvent({
            delay: 300,
            loop: true,
            callback: () => {
              const smoke = scene.add
                .image(b.x + Phaser.Math.Between(-10, 10), b.y - 10, "smoke")
                .setScale(SCALE * 0.6)
                .setDepth(12)
                .setAlpha(0.7)
                .setTint(0x222222);
              scene.hudCam.ignore(smoke);
              scene.tweens.add({
                targets: smoke,
                y: b.y - 80 - Math.random() * 40,
                x: smoke.x + Phaser.Math.Between(-20, 20),
                scale: SCALE * (1.5 + Math.random()),
                alpha: 0,
                duration: 1500 + Math.random() * 500,
                onComplete: () => smoke.destroy(),
              });
            },
          });
        }
        // Kill people hiding in this building
        killPeopleInBuilding(scene, b);
      } else {
        // Show damage — darken tint based on remaining hp
        const dmgFrac = b.hp / b.maxHp;
        const tintVal = Math.floor(0x88 + 0x77 * dmgFrac);
        const tint = (tintVal << 16) | (tintVal << 8) | tintVal;
        b.sprite.setTint(tint);
        // Add cracks on first hit
        if (!b.cracksSprite) {
          b.cracksSprite = scene.add
            .image(b.x, b.y, "cracks")
            .setScale(SCALE)
            .setDepth(3)
            .setAlpha(0.6);
          scene.hudCam.ignore(b.cracksSprite);
        }
        // Add fire at half hp or below
        if (b.hp <= b.maxHp / 2) {
          const fire = scene.add
            .image(
              b.x + Phaser.Math.Between(-15, 15),
              b.y + Phaser.Math.Between(-15, 15),
              "fire",
            )
            .setScale(SCALE)
            .setDepth(3);
          scene.hudCam.ignore(fire);
          b.fireSprites.push(fire);
          // Animate fire flicker
          scene.tweens.add({
            targets: fire,
            alpha: { from: 1, to: 0.5 },
            scaleX: { from: SCALE, to: SCALE * 0.8 },
            scaleY: { from: SCALE, to: SCALE * 1.2 },
            duration: 300,
            yoyo: true,
            repeat: -1,
          });
        }
        // Smoke puff on hit
        const smoke = scene.add
          .image(b.x, b.y - 10, "smoke")
          .setScale(SCALE)
          .setDepth(12)
          .setAlpha(0.8);
        scene.hudCam.ignore(smoke);
        scene.tweens.add({
          targets: smoke,
          y: b.y - 60,
          alpha: 0,
          scale: SCALE * 2,
          duration: 800,
          ease: "Quad.easeOut",
          onComplete: () => smoke.destroy(),
        });
      }
    }
  }

  // Kill town cars — ghosts float out
  for (const car of scene.townCars) {
    if (!car.alive) continue;
    const dist = Phaser.Math.Distance.Between(
      x,
      y,
      car.sprite.x,
      car.sprite.y,
    );
    if (dist < 40) {
      car.alive = false;
      car.sprite.setTexture("car-dead");
      scene.kills += car.passengers;
      for (let di = 0; di < car.passengers; di++) {
        playDeathSfxAt(scene, car.sprite.x, car.sprite.y);
      }
      // Explosion
      const carExp = scene.add
        .sprite(car.sprite.x, car.sprite.y, "explosion-sheet", 0)
        .setScale(SCALE * 1.5)
        .setDepth(11);
      scene.hudCam.ignore(carExp);
      carExp.play("explode");
      carExp.once("animationcomplete", () => carExp.destroy());
      // Spawn ghosts for each passenger
      for (let gi = 0; gi < car.passengers; gi++) {
        const spawnAngle =
          (gi / car.passengers) * Math.PI * 2 + Math.random() * 0.5;
        scene.time.delayedCall(gi * 250, () => {
          const ghost = scene.add
            .image(
              car.sprite.x + Math.cos(spawnAngle) * 15,
              car.sprite.y + Math.sin(spawnAngle) * 15,
              "ghost",
            )
            .setScale(SCALE)
            .setDepth(13)
            .setAlpha(0.8);
          scene.hudCam.ignore(ghost);
          const line = Phaser.Utils.Array.GetRandom(ghostLines);
          const bubble = scene.add
            .text(ghost.x + 20, ghost.y - 20, line, {
              fontFamily: "monospace",
              fontSize: "8px",
              color: "#aaccff",
              backgroundColor: "#000000aa",
              padding: { x: 4, y: 3 },
            })
            .setScale(SCALE * 0.5)
            .setDepth(14);
          scene.hudCam.ignore(bubble);
          const driftX = Math.cos(spawnAngle) * (15 + Math.random() * 25);
          const driftY = -(20 + Math.random() * 20);
          const wobble = Math.random() * Math.PI * 2;
          // Animate ghost manually via tween
          scene.tweens.add({
            targets: ghost,
            alpha: 0,
            y: ghost.y - 150,
            duration: 5000,
            onUpdate: () => {
              ghost.x += driftX * 0.016;
              ghost.x += Math.sin(ghost.y * 0.04 + wobble) * 0.3;
              bubble.setPosition(ghost.x + 20, ghost.y - 20);
              bubble.setAlpha(ghost.alpha);
            },
            onComplete: () => {
              ghost.destroy();
              bubble.destroy();
            },
          });
        });
      }
    }
  }

  // Kill dirt bikers — turn into ghosts
  for (const bk of scene.dirtBikers) {
    if (!bk.alive) continue;
    const dist = Phaser.Math.Distance.Between(x, y, bk.sprite.x, bk.sprite.y);
    if (dist < 60) {
      bk.alive = false;
      scene.kills++;
      playDeathSfxAt(scene, bk.sprite.x, bk.sprite.y);
      // Explosion at biker position
      const bkExp = scene.add
        .sprite(bk.sprite.x, bk.sprite.y, "explosion-sheet", 0)
        .setScale(SCALE * 1.5)
        .setDepth(11);
      scene.hudCam.ignore(bkExp);
      bkExp.play("explode");
      bkExp.once("animationcomplete", () => bkExp.destroy());
      // Ghost floats away
      bk.sprite.setTexture("ghost");
      bk.sprite.setAlpha(0.8);
      bk.sprite.setDepth(13);
      const awayAngle = Phaser.Math.Angle.Between(
        x,
        y,
        bk.sprite.x,
        bk.sprite.y,
      );
      bk.ghostDriftX = Math.cos(awayAngle) * (15 + Math.random() * 25);
      bk.ghostDriftY = -(20 + Math.random() * 20);
      bk.ghostWobble = Math.random() * Math.PI * 2;
      bk.isGhost = true;
      // Speech bubble
      const line = Phaser.Utils.Array.GetRandom(ghostLines);
      bk.bubble = scene.add
        .text(bk.sprite.x + 20, bk.sprite.y - 20, line, {
          fontFamily: "monospace",
          fontSize: "8px",
          color: "#aaccff",
          backgroundColor: "#000000aa",
          padding: { x: 4, y: 3 },
        })
        .setScale(SCALE * 0.5)
        .setDepth(14);
      scene.hudCam.ignore(bk.bubble);
    }
  }

  // Kill or panic nearby animals
  affectNearbyAnimals(scene, x, y);

  // Kill or panic nearby people
  affectNearbyPeople(scene, x, y);
}
