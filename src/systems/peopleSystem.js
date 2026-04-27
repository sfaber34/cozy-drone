import Phaser from "phaser";
import {
  WORLD_W, WORLD_H, TILE, SCALE,
  PEOPLE_DETECT_RADIUS, PEOPLE_WANDER_SPEED, PEOPLE_PANIC_SPEED,
  PEOPLE_KILL_RADIUS, PEOPLE_PANIC_RADIUS, PEOPLE_CALM_DISTANCE,
  PEOPLE_CALM_TIME, PEOPLE_HIDE_TIMEOUT, PEOPLE_RETURN_WAIT_MIN, PEOPLE_RETURN_WAIT_RANGE,
  PANIC_DIR_INTERVAL_MIN, PANIC_DIR_INTERVAL_MAX, PANIC_DIR_CHANGE_ARC,
  PEOPLE_GREETING_MIN_DIST,
  TOTAL_PEOPLE_TARGET,
  PEOPLE_SPAWN_COUNT, PEOPLE_TOWN_SPAWN_COUNT, PEOPLE_SPAWN_AVOID_DIST,
  PEOPLE_DEPTH_BASE, PEOPLE_DEPTH_BAND,
  MOBILE_DIALOG_SCALE,
} from "../constants.js";
import { greetings, ghostLines } from "../dialog.js";
import { findNearestBuilding, steerAroundBuildings, isInsideBuilding, isNearBuilding, pushOutOfBuildings } from "./buildingSystem.js";
import { playDeathSfxAt } from "./audioSystem.js";
import { tryRegisterGhostBubble } from "./ghostBubbleUtils.js";

export function countTotalPeople(scene) {
  let total = scene.people.length;
  for (const bk of scene.dirtBikers) total++;
  for (const car of scene.townCars) total += car.passengers;
  return total;
}

export function skinTex(p, type) {
  if (p.teamSkin) return `${p.teamSkin}-${type}`;
  return `person-${type}-${p.skinId}`;
}

export function createPeople(scene, rng) {
  // --- People (random wanderers) ---
  // Use the real drone position (was hardcoded to map center, which became
  // wrong when WORLD_W shrank from 200→160; the airfield stayed at tile 100).
  const droneStartX = scene.drone ? scene.drone.x : (WORLD_W * TILE * SCALE) / 2;
  const droneStartY = scene.drone ? scene.drone.y : (WORLD_H * TILE * SCALE) / 2;

  // Wanderers must never spawn inside any set-piece's bounds — they'd
  // stand on tracks, in the middle of concerts, on runways, etc. Check
  // every set piece (airfield, camelRace, concert, …) via its .bounds.
  const setPieces = scene.setPieces || [];
  const insideAnySetPiece = (px, py) => {
    for (let s = 0; s < setPieces.length; s++) {
      const b = setPieces[s].bounds;
      if (b && Math.abs(px - b.cx) < b.hw && Math.abs(py - b.cy) < b.hh) return true;
    }
    return false;
  };

  // Compute how many wanderers to spawn so the grand total (scene.people
  // + dirtBikers + car passengers) hits TOTAL_PEOPLE_TARGET exactly. The
  // set-piece people and town people are already in scene.people by this
  // point; bikers and cars are already in scene.dirtBikers / scene.townCars.
  // Town-spawn people below also add PEOPLE_TOWN_SPAWN_COUNT, so subtract
  // that from the budget too.
  let carPassengers = 0;
  for (const c of scene.townCars) carPassengers += c.passengers || 0;
  const alreadyCounted = scene.people.length + scene.dirtBikers.length + carPassengers;
  const wandererBudget = Math.max(0, TOTAL_PEOPLE_TARGET - alreadyCounted - PEOPLE_TOWN_SPAWN_COUNT);

  for (let i = 0; i < wandererBudget; i++) {
    let px, py;
    let tries = 0;
    do {
      px = rng.between(300, WORLD_W * TILE * SCALE - 300);
      py = rng.between(300, WORLD_H * TILE * SCALE - 300);
      tries++;
      if (tries > 200) break;
    } while (
      Phaser.Math.Distance.Between(px, py, droneStartX, droneStartY) < PEOPLE_SPAWN_AVOID_DIST ||
      insideAnySetPiece(px, py) ||
      isInsideBuilding(scene, px, py)
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

  // --- Town people (extra population spawned on ROADS) ---
  // Spawning randomly across the town rectangle fails in dense residential
  // blocks — building no-go zones cover most of the area and the retry
  // loop can't find clear spots. Roads are always clear, so spawn people
  // on road intersections + road segments using the town grid.
  const townStartX = scene.townStartX;
  const townStartY = scene.townStartY;
  const townEndX = scene.townEndX;
  const townEndY = scene.townEndY;
  const townRS = scene.townRoadSpacing;
  const townRT = scene.townRoadTile;
  const townW = scene.townW;
  const townH = scene.townH;
  // Build list of road positions (intersections + mid-road points)
  const roadPositions = [];
  if (townRS && townRT) {
    for (let gy = 0; gy < townH; gy++) {
      for (let gx = 0; gx < townW; gx++) {
        const isHRoad = gy % townRS === 0;
        const isVRoad = gx % townRS === 0;
        if (isHRoad || isVRoad) {
          roadPositions.push({
            x: townStartX + gx * townRT + townRT / 2,
            y: townStartY + gy * townRT + townRT / 2,
          });
        }
      }
    }
  }
  for (let i = 0; i < PEOPLE_TOWN_SPAWN_COUNT; i++) {
    let px, py;
    if (roadPositions.length > 0) {
      // Pick a random road tile and jitter within it
      const rp = roadPositions[Math.floor(Math.random() * roadPositions.length)];
      px = rp.x + (Math.random() - 0.5) * townRT * 0.6;
      py = rp.y + (Math.random() - 0.5) * townRT * 0.6;
    } else {
      px = townStartX + 50 + Math.random() * (townEndX - townStartX - 100);
      py = townStartY + 50 + Math.random() * (townEndY - townStartY - 100);
    }
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
  const killRadius = PEOPLE_KILL_RADIUS;
  const panicRadius = PEOPLE_PANIC_RADIUS;

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

      // Ghost speech bubble — skip if too many already visible in this cluster
      if (tryRegisterGhostBubble(scene, p.sprite.x, p.sprite.y)) {
        const line = Phaser.Utils.Array.GetRandom(ghostLines);
        const ghostBubbleScale = SCALE * 0.5 * (scene.isMobile ? MOBILE_DIALOG_SCALE : 1);
        p.bubble = scene.add
          .text(p.sprite.x + 20, p.sprite.y - 20, line, {
            fontFamily: "monospace",
            fontSize: "8px",
            color: "#aaccff",
            backgroundColor: "#000000aa",
            padding: { x: 4, y: 3 },
          })
          .setScale(ghostBubbleScale)
          .setDepth(14);
        scene.hudCam.ignore(p.bubble);
      }
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
  const droneDetectRadius = PEOPLE_DETECT_RADIUS;
  const wanderSpeed = PEOPLE_WANDER_SPEED;
  const panicSpeed = PEOPLE_PANIC_SPEED;

  for (const p of scene.people) {
    if (p.state === "gone") continue;

    // Recover from being inside a building's no-go rect. Skip ghost
    // (drifts upward through anything) and hiding (intentionally
    // positioned inside its hideTarget). Crucially, exclude p.hideTarget
    // so a panicking person can actually run INTO the building they're
    // trying to hide in — without this, push-out snaps them back the
    // moment their center crosses the PAD edge and distToB never gets
    // below the hide threshold.
    if (p.state !== "ghost" && p.state !== "hiding") {
      pushOutOfBuildings(scene, p.sprite, p.hideTarget);
    }

    // People hiding in buildings — exit after timeout
    if (p.state === "hiding") {
      p.hideTimer = (p.hideTimer || 0) + dt;
      if (p.hideTimer > PEOPLE_HIDE_TIMEOUT) {
        p.hideTimer = 0;
        p.sprite.setVisible(true);
        p.sprite.setTexture(skinTex(p, "stand"));
        // Place them just outside the building they hid in
        if (p.hideTarget && !p.hideTarget.destroyed) {
          p.sprite.setPosition(
            p.hideTarget.x + Phaser.Math.Between(-40, 40),
            p.hideTarget.y + (p.hideTarget.hh || p.hideTarget.radius) + 15,
          );
        }
        p.hideTarget = null;
        if (p.returnHome) {
          // Event people — stand idle for a random delay before returning
          p.state = "waitToReturn";
          p.waitTimer = 0;
          p.waitDuration = PEOPLE_RETURN_WAIT_MIN + Math.random() * PEOPLE_RETURN_WAIT_RANGE;
        } else {
          p.state = "idle";
          p.noGreet = false;
        }
        if (!p.greeting) {
          p.greeting = Phaser.Utils.Array.GetRandom(greetings);
        }
      }
      continue;
    }

    // Soccer players/spectators in idle state are controlled by updateSoccer
    // People managed by a set piece system skip generic AI when idle
    if (p.managedBySetPiece && p.state === "idle")
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
            ) < PEOPLE_GREETING_MIN_DIST
          ) {
            tooClose = true;
            break;
          }
        }
        if (!tooClose) {
          const greetBubbleScale = SCALE * 0.5 * (scene.isMobile ? MOBILE_DIALOG_SCALE : 1);
          p.bubble = scene.add
            .text(p.sprite.x + 20, p.sprite.y - 30, p.greeting, {
              fontFamily: "monospace",
              fontSize: "8px",
              color: "#000",
              backgroundColor: "#fff",
              padding: { x: 4, y: 3 },
            })
            .setScale(greetBubbleScale)
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
          // Blocked-stop: only block if the next step moves CLOSER to a
          // building's radius. If already near one and moving away, allow
          // it (escaping). If blocked, expire wander timer so a new random
          // angle is picked next frame. No oscillation possible.
          const nextX = p.sprite.x + Math.cos(p.wanderAngle) * wanderSpeed * dt;
          const nextY = p.sprite.y + Math.sin(p.wanderAngle) * wanderSpeed * dt;
          let wanderBlocked = false;
          for (const b of scene.buildings) {
            if (b.destroyed) continue;
            const bHW = b.hw || b.radius;
            const bHH = b.hh || b.radius;
            if (Math.abs(nextX - b.x) < bHW && Math.abs(nextY - b.y) < bHH) {
              wanderBlocked = true;
              break;
            }
          }
          if (!wanderBlocked) {
            p.sprite.x = nextX;
            p.sprite.y = nextY;
          } else {
            p.wanderTimer = p.wanderDuration;
          }
          const cx = Math.cos(p.wanderAngle);
          if (Math.abs(cx) > 0.15) p.sprite.setFlipX(cx < 0);
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
        // Clamp to world — use the SAME margin as the panic-mode bounce
        // below so a person transitioning idle → panic isn't snapped a
        // tile inward on the first panic frame.
        const margin = 100;
        p.sprite.x = Phaser.Math.Clamp(p.sprite.x, margin, WORLD_W * TILE * SCALE - margin);
        p.sprite.y = Phaser.Math.Clamp(p.sprite.y, margin, WORLD_H * TILE * SCALE - margin);
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

      // When the 8-direction escape probe fires (person was blocked by a
      // building), it locks runAngle for 30 frames so the hideTarget code
      // below can't reset it back toward the stall that blocked them.
      // Without this lock, the escape direction is overwritten every frame
      // and the person oscillates visibly.
      if (p._panicEscapeLock > 0) {
        p._panicEscapeLock--;
      }

      // Update angle toward hide target if it exists (skip if escape-locked)
      if (p._panicEscapeLock > 0) {
        // locked — don't touch runAngle
      } else if (p.hideTarget && !p.hideTarget.destroyed) {
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

      // Randomly change direction for scatter runners (no building target)
      // Skip if escape-locked (same reason as hideTarget above)
      if (!p.hideTarget && !(p._panicEscapeLock > 0)) {
        if (p.panicDirTimer === undefined) {
          // Stagger each person's first change independently
          p.panicDirTimer    = Math.random() * PANIC_DIR_INTERVAL_MIN;
          p.panicDirInterval = PANIC_DIR_INTERVAL_MIN + Math.random() * (PANIC_DIR_INTERVAL_MAX - PANIC_DIR_INTERVAL_MIN);
        }
        p.panicDirTimer += dt;
        if (p.panicDirTimer >= p.panicDirInterval) {
          p.panicDirInterval = PANIC_DIR_INTERVAL_MIN + Math.random() * (PANIC_DIR_INTERVAL_MAX - PANIC_DIR_INTERVAL_MIN);
          p.panicDirTimer    = 0;
          p.runAngle += (Math.random() - 0.5) * PANIC_DIR_CHANGE_ARC;
        }
      }

      // Blocked-stop for panicking: only block if the next step would move
      // CLOSER to a building. If the person is already near a building and
      // moving AWAY, let them — they're escaping. This prevents the trap
      // where someone near a stall can't move in ANY direction because
      // every angle stays within the buffer zone.
      const panicNextX = p.sprite.x + Math.cos(p.runAngle) * panicSpeed * dt;
      const panicNextY = p.sprite.y + Math.sin(p.runAngle) * panicSpeed * dt;
      let panicBlocked = false;
      for (const b of scene.buildings) {
        if (b.destroyed || b === p.hideTarget) continue;
        const bHW = b.hw || b.radius;
        const bHH = b.hh || b.radius;
        if (Math.abs(panicNextX - b.x) < bHW && Math.abs(panicNextY - b.y) < bHH) {
          panicBlocked = true;
          break;
        }
      }
      if (!panicBlocked) {
        p.sprite.x = panicNextX;
        p.sprite.y = panicNextY;
        p.sprite.setFlipX(Math.cos(p.runAngle) < 0);
      } else {
        // Blocked — try 8 compass directions and pick the first clear one.
        // Random ±90° can't find the escape if it's at 180°; exhaustive
        // probing always finds the gap on the first try.
        const probes = [0, Math.PI/4, Math.PI/2, 3*Math.PI/4,
                        Math.PI, -3*Math.PI/4, -Math.PI/2, -Math.PI/4];
        // Shuffle so tied directions don't all pick the same one
        for (let i = probes.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [probes[i], probes[j]] = [probes[j], probes[i]];
        }
        let found = false;
        for (const a of probes) {
          const tx = p.sprite.x + Math.cos(a) * panicSpeed * dt;
          const ty = p.sprite.y + Math.sin(a) * panicSpeed * dt;
          let clear = true;
          for (const b of scene.buildings) {
            if (b.destroyed || b === p.hideTarget) continue;
            const bHW = b.hw || b.radius;
            const bHH = b.hh || b.radius;
            if (Math.abs(tx - b.x) < bHW && Math.abs(ty - b.y) < bHH) {
              clear = false; break;
            }
          }
          if (clear) {
            p.runAngle = a;
            p.sprite.x = tx;
            p.sprite.y = ty;
            p.sprite.setFlipX(Math.cos(a) < 0);
            p._panicEscapeLock = 30;
            found = true;
            break;
          }
        }
        if (!found) {
          // Truly stuck (all 8 blocked) — nudge away from nearest building
          p._panicEscapeLock = 30;
          let nearB = null, nearD = Infinity;
          for (const b of scene.buildings) {
            if (b.destroyed) continue;
            const d = Phaser.Math.Distance.Between(p.sprite.x, p.sprite.y, b.x, b.y);
            if (d < nearD) { nearD = d; nearB = b; }
          }
          if (nearB) {
            p.runAngle = Phaser.Math.Angle.Between(nearB.x, nearB.y, p.sprite.x, p.sprite.y);
            // Only nudge if the destination is clear
            const nudgeX = p.sprite.x + Math.cos(p.runAngle) * panicSpeed * dt;
            const nudgeY = p.sprite.y + Math.sin(p.runAngle) * panicSpeed * dt;
            if (!isInsideBuilding(scene, nudgeX, nudgeY)) {
              p.sprite.x = nudgeX;
              p.sprite.y = nudgeY;
            }
          }
        }
      }

      // Bounce off world boundaries
      const margin = 100;
      const worldW = WORLD_W * TILE * SCALE;
      const worldH = WORLD_H * TILE * SCALE;
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
      if (distToDrone > PEOPLE_CALM_DISTANCE && p.panicTimer > PEOPLE_CALM_TIME) {
        p.panicTimer = 0;
        p.hideTarget = null;
        if (p.returnHome) {
          // Event people — stand idle for a random delay before returning
          p.state = "waitToReturn";
          p.waitTimer = 0;
          p.waitDuration = PEOPLE_RETURN_WAIT_MIN + Math.random() * PEOPLE_RETURN_WAIT_RANGE; // 3-15 seconds
        } else {
          p.state = "idle";
          p.noGreet = false;
          if (!p.greeting) {
            p.greeting = Phaser.Utils.Array.GetRandom(greetings);
          }
        }
        p.sprite.setTexture(skinTex(p, "stand"));
      }
      // Reset calm-down timer if drone is nearby
      if (distToDrone <= PEOPLE_CALM_DISTANCE) {
        p.panicTimer = 0;
      }
    }

    // --- WAITING TO RETURN (standing idle before walking back) ---
    if (p.state === "waitToReturn") {
      p.waitTimer += dt;
      if (p.waitTimer >= p.waitDuration) {
        p.state = "returning";
      }
    }

    // --- RETURNING HOME (wedding/soccer people walking back) ---
    if (p.state === "returning" && p.returnHome) {
      const homeX = p.returnHome.x;
      const homeY = p.returnHome.y;
      const distHome = Phaser.Math.Distance.Between(
        p.sprite.x, p.sprite.y, homeX, homeY,
      );

      if (distHome < 10) {
        // Arrived home — resume original behavior
        p.state = "idle";
        p.sprite.setPosition(homeX, homeY);
        p.noGreet = true;
        p.wanderDuration = 999;
        p.wanderAngle = null;
        p._returnHeading = undefined; // reset smoothing so next panic starts fresh
        p.sprite.setTexture(skinTex(p, "stand"));
      } else {
        // Path home — try a fan of flanking angles and pick the first one
        // that avoids buildings. Much more stable than raw "steer away"
        // (which causes rapid flipping when the straight path is blocked).
        const desired = Phaser.Math.Angle.Between(
          p.sprite.x, p.sprite.y, homeX, homeY,
        );
        const probeDist = 40;
        const buildings = scene.buildings || [];
        // Rectangular probe — matches the no-go zones used everywhere else
        const isClear = (ang) => {
          const nx = p.sprite.x + Math.cos(ang) * probeDist;
          const ny = p.sprite.y + Math.sin(ang) * probeDist;
          for (const b of buildings) {
            if (b.destroyed) continue;
            const bHW = b.hw || b.radius;
            const bHH = b.hh || b.radius;
            if (Math.abs(nx - b.x) < bHW && Math.abs(ny - b.y) < bHH) return false;
          }
          return true;
        };
        const tryOrder = [0, 0.5, -0.5, 1.0, -1.0, 1.6, -1.6];
        let chosen = null;
        for (const off of tryOrder) {
          if (isClear(desired + off)) { chosen = desired + off; break; }
        }
        // Emergency 360° fallback — the flanking arc above only covers
        // ±1.6 rad. If home sits behind a building, every flanking probe
        // is blocked and the person walks straight into the wall. Probe
        // every 45° at one step distance and snap heading to any clear
        // direction so they actually move.
        if (chosen === null) {
          const stepDist = wanderSpeed * 1.5 * dt;
          const fullProbes = [
            0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4,
            Math.PI, -(3 * Math.PI) / 4, -Math.PI / 2, -Math.PI / 4,
          ];
          for (let i = fullProbes.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [fullProbes[i], fullProbes[j]] = [fullProbes[j], fullProbes[i]];
          }
          for (const a of fullProbes) {
            const tx = p.sprite.x + Math.cos(a) * stepDist;
            const ty = p.sprite.y + Math.sin(a) * stepDist;
            let clear = true;
            for (const b of buildings) {
              if (b.destroyed) continue;
              const bHW = b.hw || b.radius;
              const bHH = b.hh || b.radius;
              if (Math.abs(tx - b.x) < bHW && Math.abs(ty - b.y) < bHH) {
                clear = false; break;
              }
            }
            if (clear) {
              chosen = a;
              p._returnHeading = a; // skip smooth turn — emergency escape
              break;
            }
          }
          if (chosen === null) chosen = desired;
        }

        // Smooth heading with a turn-rate limit so changes ease in.
        // Skipped while an escape lock is active so the person actually
        // gets clear of the corner before the smooth-turn pulls them
        // back into it.
        if (p._returnHeading === undefined) p._returnHeading = chosen;
        if (!(p._returnEscapeLock > 0)) {
          const deltaA = Phaser.Math.Angle.Wrap(chosen - p._returnHeading);
          const maxTurn = 5 * dt;
          if (Math.abs(deltaA) <= maxTurn) p._returnHeading = chosen;
          else p._returnHeading += Math.sign(deltaA) * maxTurn;
        } else {
          p._returnEscapeLock--;
        }

        // Move — but block if the step would enter a building rect
        const step = wanderSpeed * 1.5 * dt;
        const rnx = p.sprite.x + Math.cos(p._returnHeading) * step;
        const rny = p.sprite.y + Math.sin(p._returnHeading) * step;
        let returnBlocked = false;
        for (const b of buildings) {
          if (b.destroyed) continue;
          const bHW = b.hw || b.radius;
          const bHH = b.hh || b.radius;
          if (Math.abs(rnx - b.x) < bHW && Math.abs(rny - b.y) < bHH) {
            returnBlocked = true; break;
          }
        }
        if (!returnBlocked) {
          p.sprite.x = rnx;
          p.sprite.y = rny;
        } else {
          // Move blocked at current heading. The 40-px probe with no
          // buffer can declare an angle "clear" while the path crosses
          // through a rect — small immediate step lands inside. Probe
          // 360° at step distance (matching the move check exactly),
          // snap heading to a clear direction, and lock briefly so
          // smooth-turn doesn't immediately pull back into the wall.
          const fullProbes = [
            0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4,
            Math.PI, -(3 * Math.PI) / 4, -Math.PI / 2, -Math.PI / 4,
          ];
          for (let i = fullProbes.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [fullProbes[i], fullProbes[j]] = [fullProbes[j], fullProbes[i]];
          }
          for (const a of fullProbes) {
            const tx = p.sprite.x + Math.cos(a) * step;
            const ty = p.sprite.y + Math.sin(a) * step;
            let clear = true;
            for (const b of buildings) {
              if (b.destroyed) continue;
              const bHW = b.hw || b.radius;
              const bHH = b.hh || b.radius;
              if (Math.abs(tx - b.x) < bHW && Math.abs(ty - b.y) < bHH) {
                clear = false; break;
              }
            }
            if (clear) {
              p._returnHeading = a;
              p._returnEscapeLock = 30;
              p.sprite.x = tx;
              p.sprite.y = ty;
              break;
            }
          }
        }

        // Flip hysteresis — avoid rapid left/right flicker near vertical headings
        const fx = Math.cos(p._returnHeading);
        if (fx < -0.2) p.sprite.setFlipX(true);
        else if (fx > 0.2) p.sprite.setFlipX(false);

        // Walk animation
        p.runTimer = (p.runTimer || 0) + delta;
        if (p.runTimer > 200) {
          p.runTimer = 0;
          p.runFrame = 1 - p.runFrame;
          p.sprite.setTexture(skinTex(p, p.runFrame === 0 ? "run1" : "run2"));
        }
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

  // --- Y-sort living people into a narrow depth band so front people
  // (larger y) render in front of back people (smaller y). Ghost/gone
  // states and hidden people keep their own depth (e.g. ghost=13). ---
  const worldH = WORLD_H * TILE * SCALE;
  for (const p of scene.people) {
    if (p.state === "ghost" || p.state === "gone" || p.state === "hiding") continue;
    if (!p.sprite) continue;
    const frac = Phaser.Math.Clamp(p.sprite.y / worldH, 0, 1);
    p.sprite.setDepth(PEOPLE_DEPTH_BASE + frac * PEOPLE_DEPTH_BAND);
  }
}

// Probe 8 compass directions from (px, py) and return the angle with the
// most open space. For each direction, ray-march in steps and measure how
// far the person can walk before hitting a building. The direction with
// the longest clear path is the best escape route — this naturally finds
// the actual lane between rows/columns of stalls instead of guessing.
function findClearestDirection(scene, px, py) {
  const probeAngles = [
    0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4,
    Math.PI, -(3 * Math.PI) / 4, -Math.PI / 2, -Math.PI / 4,
  ];
  let bestAngle = 0;
  let bestDist = -1;
  for (const a of probeAngles) {
    let clearDist = 0;
    for (let step = 10; step <= 80; step += 10) {
      const tx = px + Math.cos(a) * step;
      const ty = py + Math.sin(a) * step;
      if (isInsideBuilding(scene, tx, ty)) break;
      clearDist = step;
    }
    if (clearDist > bestDist) {
      bestDist = clearDist;
      bestAngle = a;
    }
  }
  // Add small jitter so people don't all pick the exact same angle
  return bestAngle + (Math.random() - 0.5) * 0.3;
}
