import Phaser from "phaser";
import {
  SCALE,
  CANNON_FIRE_RATE, CANNON_BULLET_SPEED, CANNON_RANGE_FACTOR,
  CANNON_SPREAD, CANNON_KILL_RADIUS,
  CANNON_SHAKE_DURATION, CANNON_SHAKE_INTENSITY,
  EXPLOSION_VOLUME,
} from "../constants.js";
import { playSfxAt, playDeathSfxAt } from "./audioSystem.js";
import { killPeopleInBuilding, findNearestBuilding } from "./buildingSystem.js";
import { ghostLines } from "../dialog.js";
import { damageBusAt } from "./busSystem.js";
import { isInWater, splashAt } from "./waterSystem.js";

export function initCannon(scene) {
  scene.cannonBullets = [];
  scene.cannonFireTimer = 0;
  scene.cannonReticle = scene.add.image(0, 0, "cannon-reticle")
    .setScale(SCALE).setDepth(8).setVisible(false);
}

export function getCannonImpactPoint(ds) {
  const range = ds.altitude * CANNON_RANGE_FACTOR;
  const rad = Phaser.Math.DegToRad(ds.angle - 90);
  return {
    x: ds.x + Math.cos(rad) * range,
    y: ds.y + Math.sin(rad) * range,
  };
}

export function updateCannonReticle(scene, ds) {
  if (ds.altitude <= 0) {
    scene.cannonReticle.setVisible(false);
    return;
  }
  const impact = getCannonImpactPoint(ds);
  scene.cannonReticle.setPosition(impact.x, impact.y);
  scene.cannonReticle.setVisible(true);
  const pulse = 0.7 + Math.sin(scene.time.now * 0.008) * 0.3;
  scene.cannonReticle.setAlpha(pulse);
}

export function fireCannon(scene) {
  const ds = scene.droneState;
  if (ds.altitude <= 0) return;

  const angleSpread = (Math.random() - 0.5) * CANNON_SPREAD * 2;
  const rangeSpread = (Math.random() - 0.5) * CANNON_SPREAD * 2;
  const rad   = Phaser.Math.DegToRad(ds.angle - 90) + angleSpread;
  const range = ds.altitude * CANNON_RANGE_FACTOR * (1 + rangeSpread);
  const targetX = ds.x + Math.cos(rad) * range;
  const targetY = ds.y + Math.sin(rad) * range;

  const launchRad = Phaser.Math.DegToRad(ds.angle - 90);
  const startX = ds.x + Math.cos(launchRad) * 30;
  const startY = ds.y + Math.sin(launchRad) * 30;

  const bullet = scene.add.image(startX, startY, "cannon-bullet")
    .setScale(SCALE).setDepth(9);
  scene.hudCam.ignore(bullet);

  const angle = Phaser.Math.Angle.Between(startX, startY, targetX, targetY);
  bullet.setRotation(angle);

  // Calculate travel time and pre-offset target for drone motion
  const travelDist = Phaser.Math.Distance.Between(startX, startY, targetX, targetY);
  const travelTime = travelDist / CANNON_BULLET_SPEED;
  const moveRad = Phaser.Math.DegToRad(ds.angle - 90);
  const leadX = targetX + Math.cos(moveRad) * ds.speed * travelTime;
  const leadY = targetY + Math.sin(moveRad) * ds.speed * travelTime;

  scene.cannonBullets.push({
    sprite: bullet,
    targetX: leadX, targetY: leadY,
    speed: CANNON_BULLET_SPEED,
  });

  scene.cameras.main.shake(CANNON_SHAKE_DURATION, CANNON_SHAKE_INTENSITY);
}

export function updateCannonBullets(scene, dt) {
  for (let i = scene.cannonBullets.length - 1; i >= 0; i--) {
    const b = scene.cannonBullets[i];
    const angle = Phaser.Math.Angle.Between(
      b.sprite.x, b.sprite.y, b.targetX, b.targetY,
    );
    const dist = Phaser.Math.Distance.Between(
      b.sprite.x, b.sprite.y, b.targetX, b.targetY,
    );

    b.sprite.x += Math.cos(angle) * b.speed * dt;
    b.sprite.y += Math.sin(angle) * b.speed * dt;

    if (dist < 15) {
      cannonImpact(scene, b.targetX, b.targetY);
      b.sprite.destroy();
      scene.cannonBullets.splice(i, 1);
    }
  }
}

export function cannonImpact(scene, x, y) {
  // Water impact — splash only, no damage
  if (isInWater(x, y)) {
    splashAt(scene, x, y);
    return;
  }

  const r = CANNON_KILL_RADIUS;
  // Proportional explosion scale (relative to kill radius)
  const explosionScale = SCALE * (r / 25); // normalized so radius 25 = SCALE*1

  // Impact flash — sized to kill radius
  const flash = scene.add.image(x, y, "cannon-impact")
    .setScale(explosionScale * 1.5).setDepth(11).setAlpha(0.9);
  scene.hudCam.ignore(flash);
  scene.tweens.add({
    targets: flash,
    alpha: 0,
    scale: explosionScale * 3,
    duration: 200,
    onComplete: () => flash.destroy(),
  });

  // Dust puff — sized to kill radius
  const dust = scene.add.image(x, y, "smoke")
    .setScale(explosionScale * 0.5).setDepth(10).setAlpha(0.4).setTint(0xccaa88);
  scene.hudCam.ignore(dust);
  scene.tweens.add({
    targets: dust,
    alpha: 0,
    scale: explosionScale * 1.5,
    y: y - 10,
    duration: 300,
    onComplete: () => dust.destroy(),
  });

  // SFX — quieter than missile
  playSfxAt(scene, "explosion", x, y, EXPLOSION_VOLUME * 0.3);

  // --- Damage people (apply 1 hit, 2 hits to kill) ---
  for (const p of scene.people) {
    if (p.state === "ghost" || p.state === "gone" || p.state === "hiding") continue;
    const dist = Phaser.Math.Distance.Between(x, y, p.sprite.x, p.sprite.y);
    if (dist < r) {
      p.cannonHits = (p.cannonHits || 0) + 1;
      if (p.cannonHits >= 2) {
        // Kill — become ghost
        p.state = "ghost";
        scene.kills++;
        playDeathSfxAt(scene, p.sprite.x, p.sprite.y);
        if (p.bubble) { p.bubble.destroy(); p.bubble = null; }
        p.sprite.setTexture("ghost");
        p.sprite.setAlpha(0.8);
        p.sprite.setDepth(13);
        const awayAngle = Phaser.Math.Angle.Between(x, y, p.sprite.x, p.sprite.y);
        p.ghostDriftX = Math.cos(awayAngle) * (15 + Math.random() * 25);
        p.ghostDriftY = -(20 + Math.random() * 20);
        p.ghostWobbleOffset = Math.random() * Math.PI * 2;
        const line = Phaser.Utils.Array.GetRandom(ghostLines);
        p.bubble = scene.add
          .text(p.sprite.x + 20, p.sprite.y - 20, line, {
            fontFamily: "monospace", fontSize: "8px",
            color: "#aaccff", backgroundColor: "#000000aa",
            padding: { x: 4, y: 3 },
          })
          .setScale(SCALE * 0.5).setDepth(14);
        scene.hudCam.ignore(p.bubble);
      }
    }
  }

  // --- Damage buildings (0.5 hp per hit — takes 2x as many hits as a missile) ---
  for (const b of scene.buildings) {
    if (b.destroyed) continue;
    const dist = Phaser.Math.Distance.Between(x, y, b.x, b.y);
    if (dist < b.radius) {
      b.hp -= 0.5;
      if (b.hp <= 0) {
        b.destroyed = true;
        if (b.isOilWell) {
          b.sprite.setTexture("oil-well-burn");
          b.sprite.clearTint();
          if (b.wellRef) b.wellRef.alive = false;
        } else if (b.isOilInfra) {
          b.sprite.setTint(0x333333);
        } else {
          b.sprite.setTexture("rubble");
          b.sprite.setTint(0x888888);
        }
        if (b.cracksSprite) b.cracksSprite.destroy();
        for (const f of b.fireSprites) f.destroy();
        b.fireSprites = [];
        // Small explosion
        const exp = scene.add.sprite(b.x, b.y, "explosion-sheet", 0)
          .setScale(SCALE * 1.5).setDepth(11);
        scene.hudCam.ignore(exp);
        exp.play("explode");
        exp.once("animationcomplete", () => exp.destroy());
        if (b.isOilInfra) {
          // Oil burns forever
          const permFire = scene.add.image(b.x, b.y - 5, "fire")
            .setScale(SCALE * 1.5).setDepth(3);
          scene.hudCam.ignore(permFire);
          scene.tweens.add({
            targets: permFire,
            scaleX: { from: SCALE * 1.2, to: SCALE * 1.8 },
            scaleY: { from: SCALE * 1.5, to: SCALE * 2.0 },
            alpha: { from: 1, to: 0.7 },
            duration: 400, yoyo: true, repeat: -1,
          });
          scene.time.addEvent({
            delay: 300, loop: true,
            callback: () => {
              const smoke = scene.add.image(
                b.x + Phaser.Math.Between(-10, 10), b.y - 10, "smoke",
              ).setScale(SCALE * 0.6).setDepth(12).setAlpha(0.7).setTint(0x222222);
              scene.hudCam.ignore(smoke);
              scene.tweens.add({
                targets: smoke,
                y: b.y - 80 - Math.random() * 40,
                x: smoke.x + Phaser.Math.Between(-20, 20),
                scale: SCALE * (1.5 + Math.random()),
                alpha: 0, duration: 1500 + Math.random() * 500,
                onComplete: () => smoke.destroy(),
              });
            },
          });
        }
        killPeopleInBuilding(scene, b);
      } else {
        // Damage tint
        const dmgFrac = b.hp / b.maxHp;
        const tintVal = Math.floor(0x88 + 0x77 * dmgFrac);
        b.sprite.setTint((tintVal << 16) | (tintVal << 8) | tintVal);
        if (!b.cracksSprite) {
          b.cracksSprite = scene.add.image(b.x, b.y, "cracks")
            .setScale(SCALE).setDepth(3).setAlpha(0.6);
          scene.hudCam.ignore(b.cracksSprite);
        }
      }
      break;
    }
  }

  // --- Damage animals ---
  for (const a of scene.animals) {
    if (a.state === "dead") continue;
    const dist = Phaser.Math.Distance.Between(x, y, a.sprite.x, a.sprite.y);
    if (dist < r) {
      a.cannonHits = (a.cannonHits || 0) + 1;
      if (a.cannonHits >= 2) {
        a.state = "dead";
        a.sprite.setVisible(false);
        const meatCount = Phaser.Math.Between(3, 6);
        for (let m = 0; m < meatCount; m++) {
          const meat = scene.add.image(a.sprite.x, a.sprite.y, "meat")
            .setScale(SCALE * 0.7).setDepth(12);
          scene.hudCam.ignore(meat);
          const mAngle = Math.random() * Math.PI * 2;
          const fDist = 20 + Math.random() * 40;
          scene.tweens.add({
            targets: meat,
            x: a.sprite.x + Math.cos(mAngle) * fDist,
            y: a.sprite.y + Math.sin(mAngle) * fDist,
            angle: Phaser.Math.Between(-360, 360),
            alpha: 0, duration: 600 + Math.random() * 300,
            ease: "Quad.easeOut",
            onComplete: () => meat.destroy(),
          });
        }
      }
    }
  }

  // Damage buses (0.5 HP per cannon hit — 6 hits to destroy)
  damageBusAt(scene, x, y, 0.5);

  // --- Panic nearby (smaller radius than missile) ---
  const panicR = r * 3;
  for (const p of scene.people) {
    if (p.state === "ghost" || p.state === "gone" || p.state === "hiding" || p.state === "panicking") continue;
    const dist = Phaser.Math.Distance.Between(x, y, p.sprite.x, p.sprite.y);
    if (dist < panicR) {
      p.state = "panicking";
      if (p.bubble) { p.bubble.destroy(); p.bubble = null; }
      if (p.scatterPanic) {
        const awayAngle = Phaser.Math.Angle.Between(x, y, p.sprite.x, p.sprite.y);
        p.runAngle = awayAngle + (Math.random() - 0.5) * Math.PI;
        p.hideTarget = null;
      } else {
        p.hideTarget = findNearestBuilding(scene, p.sprite.x, p.sprite.y);
        if (p.hideTarget) {
          p.runAngle = Phaser.Math.Angle.Between(
            p.sprite.x, p.sprite.y, p.hideTarget.x, p.hideTarget.y,
          );
        } else {
          p.runAngle = Phaser.Math.Angle.Between(x, y, p.sprite.x, p.sprite.y);
        }
      }
    }
  }
  for (const a of scene.animals) {
    if (a.state === "dead" || a.state === "panicking") continue;
    const dist = Phaser.Math.Distance.Between(x, y, a.sprite.x, a.sprite.y);
    if (dist < panicR) {
      a.state = "panicking";
      a.runAngle = Phaser.Math.Angle.Between(x, y, a.sprite.x, a.sprite.y) + (Math.random() - 0.5) * 1.0;
      a.panicTimer = 0;
    }
  }
}
