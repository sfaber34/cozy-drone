import Phaser from "phaser";
import { WORLD_W, WORLD_H, SCALE } from "../constants.js";
import { greetings, ghostLines } from "../dialog.js";
import { findNearestBuilding, steerAroundBuildings } from "./buildingSystem.js";
import { playDeathSfxAt } from "./audioSystem.js";

export function skinTex(p, type) {
  if (p.teamSkin) return `${p.teamSkin}-${type}`;
  return `person-${type}-${p.skinId}`;
}

export function createPeople(scene, rng) {
  // --- People (random wanderers) ---
  const rwX = (WORLD_W * SCALE) / 2;
  const rwTiles = 6;
  const rwTileH = 128 * SCALE;
  const rwTotalH = rwTiles * rwTileH;
  const rwBottom = (WORLD_H * SCALE) / 2 + rwTotalH / 2;
  const droneStartX = rwX;
  const droneStartY = rwBottom - 80;

  for (let i = 0; i < 60; i++) {
    let px, py;
    do {
      px = rng.between(300, WORLD_W * SCALE - 300);
      py = rng.between(300, WORLD_H * SCALE - 300);
    } while (
      Phaser.Math.Distance.Between(px, py, droneStartX, droneStartY) < 2000
    );
    const skinId = rng.between(0, 199);
    const sprite = scene.add
      .image(px, py, `person-stand-${skinId}`)
      .setScale(SCALE)
      .setDepth(2);
    scene.people.push({
      sprite,
      skinId,
      state: "idle",
      greeting: rng.pick(greetings),
      bubble: null,
      waveTimer: 0,
      waveFrame: 0,
      runAngle: 0,
      runTimer: 0,
      runFrame: 0,
      wanderTimer: 0,
      wanderDuration: 2 + Math.random() * 4,
      wanderAngle: Math.random() < 0.5 ? null : Math.random() * Math.PI * 2,
      hideTarget: null,
      homeX: px,
      homeY: py,
    });
  }

  // --- Town people (extra population in the NW town area) ---
  const townStartX = scene.townStartX;
  const townStartY = scene.townStartY;
  const townEndX = scene.townEndX;
  const townEndY = scene.townEndY;
  for (let i = 0; i < 80; i++) {
    const px =
      townStartX + 50 + Math.random() * (townEndX - townStartX - 100);
    const py =
      townStartY + 50 + Math.random() * (townEndY - townStartY - 100);
    const skinId = rng.between(0, 199);
    const sprite = scene.add
      .image(px, py, `person-stand-${skinId}`)
      .setScale(SCALE)
      .setDepth(2);
    scene.people.push({
      sprite,
      skinId,
      state: "idle",
      greeting: rng.pick(greetings),
      bubble: null,
      waveTimer: 0,
      waveFrame: 0,
      runAngle: 0,
      runTimer: 0,
      runFrame: 0,
      wanderTimer: 0,
      wanderDuration: 2 + Math.random() * 4,
      wanderAngle: Math.random() < 0.5 ? null : Math.random() * Math.PI * 2,
      hideTarget: null,
      homeX: px,
      homeY: py,
    });
  }
}

export function affectNearbyPeople(scene, x, y) {
  const killRadius = 50;
  const panicRadius = 400;

  for (const p of scene.people) {
    if (p.state === "ghost" || p.state === "gone" || p.state === "hiding")
      continue;
    const dist = Phaser.Math.Distance.Between(x, y, p.sprite.x, p.sprite.y);

    if (dist < killRadius) {
      // Killed — become ghost
      p.state = "ghost";
      scene.kills++;
      playDeathSfxAt(scene, p.sprite.x, p.sprite.y);
      if (p.bubble) {
        p.bubble.destroy();
        p.bubble = null;
      }
      p.sprite.setTexture("ghost");
      p.sprite.setAlpha(0.8);
      p.sprite.setDepth(13);
      // Random drift away from explosion
      const awayAngle = Phaser.Math.Angle.Between(
        x,
        y,
        p.sprite.x,
        p.sprite.y,
      );
      p.ghostDriftX = Math.cos(awayAngle) * (15 + Math.random() * 25);
      p.ghostDriftY = -(20 + Math.random() * 20);
      p.ghostWobbleOffset = Math.random() * Math.PI * 2;

      // Ghost speech bubble
      const line = Phaser.Utils.Array.GetRandom(ghostLines);
      p.bubble = scene.add
        .text(p.sprite.x + 20, p.sprite.y - 20, line, {
          fontFamily: "monospace",
          fontSize: "8px",
          color: "#aaccff",
          backgroundColor: "#000000aa",
          padding: { x: 4, y: 3 },
        })
        .setScale(SCALE * 0.5)
        .setDepth(14);
      scene.hudCam.ignore(p.bubble);
    } else if (
      dist < panicRadius &&
      p.state !== "panicking" &&
      p.state !== "hiding"
    ) {
      // Panic
      p.state = "panicking";
      if (p.bubble) {
        p.bubble.destroy();
        p.bubble = null;
      }
      if (p.scatterPanic) {
        // Scatter in a random direction (away-ish from explosion)
        const awayAngle = Phaser.Math.Angle.Between(
          x,
          y,
          p.sprite.x,
          p.sprite.y,
        );
        p.runAngle = awayAngle + (Math.random() - 0.5) * Math.PI;
        p.hideTarget = null;
      } else {
        // Find nearest building to hide in
        p.hideTarget = findNearestBuilding(scene, p.sprite.x, p.sprite.y);
        if (p.hideTarget) {
          p.runAngle = Phaser.Math.Angle.Between(
            p.sprite.x,
            p.sprite.y,
            p.hideTarget.x,
            p.hideTarget.y,
          );
        } else {
          p.runAngle = Phaser.Math.Angle.Between(
            x,
            y,
            p.sprite.x,
            p.sprite.y,
          );
        }
      }
    }
  }
}

export function updatePeople(scene, dt, delta) {
  const ds = scene.droneState;
  const droneDetectRadius = 600;
  const wanderSpeed = 30;
  const panicSpeed = 60;

  for (const p of scene.people) {
    if (p.state === "gone") continue;

    // People hiding in buildings — exit after timeout
    if (p.state === "hiding") {
      p.hideTimer = (p.hideTimer || 0) + dt;
      if (p.hideTimer > 10) {
        p.hideTimer = 0;
        p.state = "idle";
        p.sprite.setVisible(true);
        p.sprite.setTexture(skinTex(p, "stand"));
        // Place them just outside the building they hid in
        if (p.hideTarget && !p.hideTarget.destroyed) {
          p.sprite.setPosition(
            p.hideTarget.x + Phaser.Math.Between(-40, 40),
            p.hideTarget.y + p.hideTarget.radius + 15,
          );
        }
        p.hideTarget = null;
        p.noGreet = false;
        if (!p.greeting) {
          p.greeting = Phaser.Utils.Array.GetRandom(greetings);
        }
      }
      continue;
    }

    // Soccer players/spectators in idle state are controlled by updateSoccer
    if ((p.isSoccerPlayer || p.isSoccerSpectator) && p.state === "idle")
      continue;

    const distToDrone = Phaser.Math.Distance.Between(
      ds.x,
      ds.y,
      p.sprite.x,
      p.sprite.y,
    );

    // --- IDLE: wander slowly ---
    if (p.state === "idle") {
      // Detect drone
      if (!p.noGreet && ds.altitude > 0 && distToDrone < droneDetectRadius) {
        p.state = "waving";
        p.waveTimer = 0;
        // Only show bubble if no other bubble is within 150px
        let tooClose = false;
        for (const other of scene.people) {
          if (other === p || !other.bubble || other.state !== "waving")
            continue;
          if (
            Phaser.Math.Distance.Between(
              p.sprite.x,
              p.sprite.y,
              other.sprite.x,
              other.sprite.y,
            ) < 150
          ) {
            tooClose = true;
            break;
          }
        }
        if (!tooClose) {
          p.bubble = scene.add
            .text(p.sprite.x + 20, p.sprite.y - 30, p.greeting, {
              fontFamily: "monospace",
              fontSize: "8px",
              color: "#000",
              backgroundColor: "#fff",
              padding: { x: 4, y: 3 },
            })
            .setScale(SCALE * 0.5)
            .setDepth(13);
          scene.hudCam.ignore(p.bubble);
        }
      } else {
        // Wander
        p.wanderTimer = (p.wanderTimer || 0) + dt;
        if (p.wanderTimer > p.wanderDuration) {
          // Pick new direction or stop
          p.wanderTimer = 0;
          p.wanderDuration = 2 + Math.random() * 4;
          if (Math.random() < 0.4) {
            p.wanderAngle = null; // stop and stand
          } else {
            p.wanderAngle = Math.random() * Math.PI * 2;
          }
        }
        if (p.wanderAngle !== null && p.wanderAngle !== undefined) {
          const steered = steerAroundBuildings(
            scene,
            p.sprite.x,
            p.sprite.y,
            p.wanderAngle,
            dt,
          );
          p.sprite.x += Math.cos(steered) * wanderSpeed * dt;
          p.sprite.y += Math.sin(steered) * wanderSpeed * dt;
          p.sprite.setFlipX(Math.cos(steered) < 0);
          // Walk anim
          p.runTimer = (p.runTimer || 0) + delta;
          if (p.runTimer > 200) {
            p.runTimer = 0;
            p.runFrame = 1 - p.runFrame;
            p.sprite.setTexture(
              p.runFrame === 0
                ? `person-run1-${p.skinId}`
                : `person-run2-${p.skinId}`,
            );
          }
        } else {
          p.sprite.setTexture(skinTex(p, "stand"));
        }
        // Clamp to world
        p.sprite.x = Phaser.Math.Clamp(p.sprite.x, 50, WORLD_W * SCALE - 50);
        p.sprite.y = Phaser.Math.Clamp(p.sprite.y, 50, WORLD_H * SCALE - 50);
      }
    }

    // --- WAVING ---
    if (p.state === "waving") {
      p.waveTimer += delta;
      if (p.waveTimer > 250) {
        p.waveTimer = 0;
        p.waveFrame = 1 - p.waveFrame;
        p.sprite.setTexture(
          skinTex(p, p.waveFrame === 0 ? "wave1" : "wave2"),
        );
      }
      if (distToDrone > droneDetectRadius * 1.5 || ds.altitude <= 0) {
        p.state = "idle";
        p.sprite.setTexture(skinTex(p, "stand"));
        if (p.bubble) {
          p.bubble.destroy();
          p.bubble = null;
        }
      }
    }

    // --- PANICKING: run toward nearest building ---
    if (p.state === "panicking") {
      p.runTimer = (p.runTimer || 0) + delta;
      if (p.runTimer > 120) {
        p.runTimer = 0;
        p.runFrame = 1 - p.runFrame;
        p.sprite.setTexture(
          skinTex(p, p.runFrame === 0 ? "run1" : "run2"),
        );
      }

      // Update angle toward hide target if it exists
      if (p.hideTarget && !p.hideTarget.destroyed) {
        p.runAngle = Phaser.Math.Angle.Between(
          p.sprite.x,
          p.sprite.y,
          p.hideTarget.x,
          p.hideTarget.y,
        );
        // Check if reached the building
        const distToB = Phaser.Math.Distance.Between(
          p.sprite.x,
          p.sprite.y,
          p.hideTarget.x,
          p.hideTarget.y,
        );
        if (distToB < 20) {
          // Hide inside
          p.state = "hiding";
          p.sprite.setVisible(false);
          continue;
        }
      } else if (p.hideTarget && p.hideTarget.destroyed) {
        // Target destroyed — find another
        p.hideTarget = findNearestBuilding(scene, p.sprite.x, p.sprite.y);
        if (!p.hideTarget) {
          // No buildings left — just run away
          p.runAngle += (Math.random() - 0.5) * 0.5;
        }
      }

      p.sprite.x += Math.cos(p.runAngle) * panicSpeed * dt;
      p.sprite.y += Math.sin(p.runAngle) * panicSpeed * dt;
      p.sprite.setFlipX(Math.cos(p.runAngle) < 0);

      // Bounce off world boundaries
      const margin = 100;
      const worldW = WORLD_W * SCALE;
      const worldH = WORLD_H * SCALE;
      if (p.sprite.x < margin) {
        p.sprite.x = margin;
        p.runAngle = Math.PI - p.runAngle;
      }
      if (p.sprite.x > worldW - margin) {
        p.sprite.x = worldW - margin;
        p.runAngle = Math.PI - p.runAngle;
      }
      if (p.sprite.y < margin) {
        p.sprite.y = margin;
        p.runAngle = -p.runAngle;
      }
      if (p.sprite.y > worldH - margin) {
        p.sprite.y = worldH - margin;
        p.runAngle = -p.runAngle;
      }

      // Calm down if drone is far away for a while
      p.panicTimer = (p.panicTimer || 0) + dt;
      if (distToDrone > 800 && p.panicTimer > 5) {
        p.state = "idle";
        p.panicTimer = 0;
        p.hideTarget = null;
        p.noGreet = false; // allow greeting after surviving a scare
        if (!p.greeting) {
          p.greeting = Phaser.Utils.Array.GetRandom(greetings);
        }
        p.sprite.setTexture(skinTex(p, "stand"));
      }
      // Reset calm-down timer if drone is nearby
      if (distToDrone <= 800) {
        p.panicTimer = 0;
      }
    }

    // --- GHOST ---
    if (p.state === "ghost") {
      const driftX = p.ghostDriftX || 0;
      const driftY = p.ghostDriftY || -30;
      const wobbleOff = p.ghostWobbleOffset || 0;
      p.sprite.y += driftY * dt;
      p.sprite.x +=
        driftX * dt + Math.sin(p.sprite.y * 0.04 + wobbleOff) * 15 * dt;
      p.sprite.setAlpha(p.sprite.alpha - 0.08 * dt);

      if (p.bubble) {
        p.bubble.setPosition(p.sprite.x + 20, p.sprite.y - 20);
        p.bubble.setAlpha(p.sprite.alpha);
      }

      if (p.sprite.alpha <= 0) {
        p.sprite.destroy();
        if (p.bubble) {
          p.bubble.destroy();
          p.bubble = null;
        }
        if (p.carriedGoods) {
          p.carriedGoods.destroy();
          p.carriedGoods = null;
        }
        p.state = "gone";
      }
    }

    // --- Update carried goods position ---
    if (p.carriedGoods && p.carriedGoods.active) {
      if (p.state === "gone" || p.state === "hiding") {
        p.carriedGoods.setVisible(false);
      } else if (p.state === "ghost") {
        p.carriedGoods.setVisible(false);
      } else {
        p.carriedGoods.setVisible(true);
        p.carriedGoods.setPosition(p.sprite.x + 8, p.sprite.y - 5);
      }
    }
  }
}
