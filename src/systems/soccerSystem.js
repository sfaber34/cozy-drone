import Phaser from "phaser";
import {
  TILE, SCALE, SOCCER_X, SOCCER_Y,
  SOCCER_FIELD_W, SOCCER_FIELD_H, SOCCER_PLAYERS_PER_TEAM, SOCCER_TACKLE_COOLDOWN,
} from "../constants.js";
import { cheerPhrases } from "../dialog.js";

export function createSoccer(scene, rng) {
  const soccerX = SOCCER_X * TILE * SCALE;
  const soccerY = SOCCER_Y * TILE * SCALE;
  const fieldW = SOCCER_FIELD_W;
  const fieldH = SOCCER_FIELD_H;

  // Green pitch
  for (let fy = -fieldH / 2; fy < fieldH / 2; fy += TILE * SCALE) {
    for (let fx = -fieldW / 2; fx < fieldW / 2; fx += TILE * SCALE) {
      scene.add
        .image(soccerX + fx, soccerY + fy, "grass")
        .setOrigin(0, 0)
        .setScale(SCALE)
        .setDepth(1);
    }
  }

  // Field boundary lines
  // Top & bottom
  for (let fx = -fieldW / 2; fx < fieldW / 2; fx += TILE * SCALE) {
    scene.add
      .image(soccerX + fx, soccerY - fieldH / 2, "field-line-h")
      .setOrigin(0, 0)
      .setScale(SCALE)
      .setDepth(1.5);
    scene.add
      .image(soccerX + fx, soccerY + fieldH / 2, "field-line-h")
      .setOrigin(0, 0)
      .setScale(SCALE)
      .setDepth(1.5);
  }
  // Left & right
  for (let fy = -fieldH / 2; fy < fieldH / 2; fy += TILE * SCALE) {
    scene.add
      .image(soccerX - fieldW / 2, soccerY + fy, "field-line-v")
      .setOrigin(0, 0)
      .setScale(SCALE)
      .setDepth(1.5);
    scene.add
      .image(soccerX + fieldW / 2, soccerY + fy, "field-line-v")
      .setOrigin(0, 0)
      .setScale(SCALE)
      .setDepth(1.5);
  }
  // Center line
  for (let fy = -fieldH / 2; fy < fieldH / 2; fy += TILE * SCALE) {
    scene.add
      .image(soccerX, soccerY + fy, "field-line-v")
      .setOrigin(0, 0)
      .setScale(SCALE)
      .setDepth(1.5);
  }

  // Goals
  scene.add
    .image(soccerX - fieldW / 2 - 10, soccerY, "soccer-goal")
    .setScale(SCALE)
    .setDepth(2)
    .setAngle(90);
  scene.add
    .image(soccerX + fieldW / 2 + 10, soccerY, "soccer-goal")
    .setScale(SCALE)
    .setDepth(2)
    .setAngle(90);

  // Soccer ball
  const soccerBall = scene.add
    .image(soccerX, soccerY, "soccer-ball")
    .setScale(SCALE)
    .setDepth(4);
  scene.soccerBall = soccerBall;
  scene.soccerActive = true;

  // Soccer players (5 per team)
  scene.soccerPlayers = [];
  const teams = ["team-a", "team-b"];
  for (let t = 0; t < 2; t++) {
    const side = t === 0 ? -1 : 1;
    for (let p = 0; p < SOCCER_PLAYERS_PER_TEAM; p++) {
      const px = soccerX + side * (50 + rng.between(0, 80));
      const py = soccerY + rng.between(-80, 80);
      const sprite = scene.add
        .image(px, py, `${teams[t]}-stand`)
        .setScale(SCALE)
        .setDepth(3);
      const player = {
        sprite,
        team: teams[t],
        targetX: px,
        targetY: py,
        runFrame: 0,
        runTimer: 0,
        chasing: false,
      };
      scene.soccerPlayers.push(player);
      // Also add to people array so they react to explosions
      const personEntry = {
        sprite,
        skinId: 0,
        state: "idle",
        greeting: "",
        noGreet: true,
        scatterPanic: true,
        returnHome: { x: px, y: py, event: "soccer" },
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
        homeX: px,
        homeY: py,
        isSoccerPlayer: true,
        managedBySetPiece: true,
        teamSkin: teams[t],
      };
      scene.people.push(personEntry);
      player.personEntry = personEntry;
    }
  }

  // Soccer ball movement — pick a random player to "have" the ball, then pass
  scene.soccerBallHolder = null;
  scene.soccerPassTimer = 0;
  scene.soccerFieldCenter = { x: soccerX, y: soccerY };
  scene.soccerFieldW = fieldW;
  scene.soccerFieldH = fieldH;

  // Spectators around the field (cheering/clapping)
  scene.soccerSpectators = [];
  // Rows of spectators on both long sides
  for (let side = -1; side <= 1; side += 2) {
    for (let s = 0; s < 12; s++) {
      const sx = soccerX - fieldW / 2 + 20 + s * (fieldW / 12);
      const sy = soccerY + side * (fieldH / 2 + 35 + rng.between(0, 20));
      const skinId = rng.between(0, 199);
      const sprite = scene.add
        .image(sx, sy, `person-wave1-${skinId}`)
        .setScale(SCALE)
        .setDepth(2);
      const personEntry = {
        sprite,
        skinId,
        state: "idle",
        greeting: rng.pick(cheerPhrases),
        noGreet: true,
        scatterPanic: true,
        returnHome: { x: sx, y: sy, event: "soccer" },
        isSoccerSpectator: true,
        managedBySetPiece: true,
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
      };
      scene.people.push(personEntry);
      scene.soccerSpectators.push({
        sprite,
        skinId,
        personEntry,
        clapTimer: rng.between(0, 500),
        clapInterval: 400 + rng.between(0, 300),
        clapFrame: 0,
      });
    }
  }
  // A few at the ends too
  for (let side = -1; side <= 1; side += 2) {
    for (let s = 0; s < 4; s++) {
      const sx = soccerX + side * (fieldW / 2 + 35 + rng.between(0, 15));
      const sy = soccerY - 60 + s * 40;
      const skinId = rng.between(0, 199);
      const sprite = scene.add
        .image(sx, sy, `person-wave1-${skinId}`)
        .setScale(SCALE)
        .setDepth(2);
      const personEntry2 = {
        sprite,
        skinId,
        state: "idle",
        greeting: rng.pick(cheerPhrases),
        noGreet: true,
        scatterPanic: true,
        returnHome: { x: sx, y: sy, event: "soccer" },
        isSoccerSpectator: true,
        managedBySetPiece: true,
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
      };
      scene.people.push(personEntry2);
      scene.soccerSpectators.push({
        sprite,
        skinId,
        personEntry: personEntry2,
        clapTimer: rng.between(0, 500),
        clapInterval: 400 + rng.between(0, 300),
        clapFrame: 0,
      });
    }
  }
}

export function updateSoccer(scene, dt, delta) {
  if (!scene.soccerActive) return;

  const fc = scene.soccerFieldCenter;
  const ball = scene.soccerBall;
  const players = scene.soccerPlayers;
  const hw = scene.soccerFieldW / 2;
  const hh = scene.soccerFieldH / 2;

  if (!ball.active) return;

  // --- Determine closest active (idle) player per team to ball ---
  let chaserA = null,
    chaserB = null;
  let bestDistA = Infinity,
    bestDistB = Infinity;
  for (const p of players) {
    if (!p.sprite.active || p.personEntry.state !== "idle") continue;
    const d = Phaser.Math.Distance.Between(
      p.sprite.x,
      p.sprite.y,
      ball.x,
      ball.y,
    );
    if (p.team === "team-a" && d < bestDistA) {
      bestDistA = d;
      chaserA = p;
    }
    if (p.team === "team-b" && d < bestDistB) {
      bestDistB = d;
      chaserB = p;
    }
  }

  // --- Ball holder & tackling ---
  scene.soccerPassTimer += dt;
  scene.soccerTackleCooldown = (scene.soccerTackleCooldown || 0) - dt;

  // Any player who reaches the ball can pick it up (with cooldown)
  for (const p of players) {
    if (!p.sprite.active || p.personEntry.state !== "idle") continue;
    if (p === scene.soccerLastHolder && scene.soccerTackleCooldown > 0) continue;
    const d = Phaser.Math.Distance.Between(p.sprite.x, p.sprite.y, ball.x, ball.y);
    if (d < 15 && scene.soccerBallHolder !== p && scene.soccerTackleCooldown <= 0) {
      scene.soccerLastHolder = scene.soccerBallHolder;
      scene.soccerBallHolder = p;
      scene.soccerPassTimer = 0;
      scene.soccerTackleCooldown = SOCCER_TACKLE_COOLDOWN;
      break;
    }
  }

  // Ball follows holder
  if (scene.soccerBallHolder && scene.soccerBallHolder.sprite.active) {
    const h = scene.soccerBallHolder;
    ball.x = h.sprite.x + 8;
    ball.y = h.sprite.y + 5;

    // Dribble timer — pass or shoot after a delay
    const holdTime = 0.8 + Math.random() * 0.8;
    if (scene.soccerPassTimer > holdTime) {
      scene.soccerPassTimer = 0;
      const teammates = players.filter(
        (p) => p.team === h.team && p !== h && p.sprite.active && p.personEntry.state === "idle",
      );

      // Check if near opponent goal — higher shoot chance
      const goalX = h.team === "team-a" ? fc.x + hw : fc.x - hw;
      const distToGoal = Math.abs(h.sprite.x - goalX);
      const shootChance = distToGoal < hw * 0.4 ? 0.6 : 0.2;

      if (Math.random() < shootChance || teammates.length === 0) {
        // Shoot at goal with some randomness
        scene.soccerBallVel = {
          x: (goalX + 10 * (h.team === "team-a" ? 1 : -1) - ball.x) * 0.9,
          y: (fc.y + Phaser.Math.Between(-40, 40) - ball.y) * 0.9,
        };
      } else {
        // Pass to a teammate — prefer forward passes
        const forwardTeammates = teammates.filter((t) => {
          const fwd = h.team === "team-a"
            ? t.sprite.x > h.sprite.x
            : t.sprite.x < h.sprite.x;
          return fwd;
        });
        const target = forwardTeammates.length > 0
          ? Phaser.Utils.Array.GetRandom(forwardTeammates)
          : Phaser.Utils.Array.GetRandom(teammates);
        scene.soccerBallVel = {
          x: (target.sprite.x - ball.x) * 0.7,
          y: (target.sprite.y - ball.y) * 0.7,
        };
      }
      scene.soccerBallHolder = null;
    }
  } else {
    // Ball is free — move with velocity and slow down
    if (scene.soccerBallVel) {
      ball.x += scene.soccerBallVel.x * dt;
      ball.y += scene.soccerBallVel.y * dt;
      scene.soccerBallVel.x *= 0.95;
      scene.soccerBallVel.y *= 0.95;
      if (
        Math.abs(scene.soccerBallVel.x) < 1 &&
        Math.abs(scene.soccerBallVel.y) < 1
      ) {
        scene.soccerBallVel = null;
      }
    }
    // Keep ball on field
    ball.x = Phaser.Math.Clamp(ball.x, fc.x - hw, fc.x + hw);
    ball.y = Phaser.Math.Clamp(ball.y, fc.y - hh, fc.y + hh);

    // Goal scored — reset to center
    if (ball.x <= fc.x - hw + 5 || ball.x >= fc.x + hw - 5) {
      ball.x = fc.x;
      ball.y = fc.y;
      scene.soccerBallVel = null;
      scene.soccerBallHolder = null;
      // Reset all formations
      for (const p of players) { p.formX = null; }
    }
  }

  // --- Move players ---
  for (const p of players) {
    if (!p.sprite.active) continue;
    if (p.personEntry.state !== "idle") {
      if (scene.soccerBallHolder === p) scene.soccerBallHolder = null;
      continue;
    }

    const isChaser = p === chaserA || p === chaserB;
    const isHolder = p === scene.soccerBallHolder;
    const teamSide = p.team === "team-a" ? -1 : 1;
    const opponentHasBall = scene.soccerBallHolder && scene.soccerBallHolder.team !== p.team;
    let tx, ty, spd;

    if (isHolder) {
      // Dribble toward goal but with some lateral movement
      const goalX = fc.x + teamSide * hw;
      tx = goalX;
      ty = fc.y + Math.sin(scene.time ? scene.time.now * 0.002 + p.sprite.y : 0) * 40;
      spd = 50;
    } else if (isChaser && !scene.soccerBallHolder) {
      // Chase loose ball
      tx = ball.x;
      ty = ball.y;
      spd = 70;
    } else if (isChaser && opponentHasBall) {
      // Chase the ball holder to tackle
      tx = scene.soccerBallHolder.sprite.x;
      ty = scene.soccerBallHolder.sprite.y;
      spd = 68;
    } else if (opponentHasBall) {
      // Non-chaser defenders — move toward ball side of field
      tx = ball.x + teamSide * Phaser.Math.Between(-30, 60);
      ty = ball.y + Phaser.Math.Between(-40, 40);
      tx = Phaser.Math.Clamp(tx, fc.x - hw + 10, fc.x + hw - 10);
      ty = Phaser.Math.Clamp(ty, fc.y - hh + 10, fc.y + hh - 10);
      spd = 45;
    } else if (scene.soccerBallHolder && scene.soccerBallHolder.team === p.team) {
      // Teammate has ball — spread out ahead for a pass
      const holderX = scene.soccerBallHolder.sprite.x;
      if (!p.formX || Math.random() < 0.02) {
        p.formX = holderX + teamSide * Phaser.Math.Between(30, hw - 20);
        p.formY = fc.y + Phaser.Math.Between(-hh + 20, hh - 20);
        p.formX = Phaser.Math.Clamp(p.formX, fc.x - hw + 10, fc.x + hw - 10);
      }
      tx = p.formX;
      ty = p.formY;
      spd = 45;
    } else {
      // Default formation
      if (!p.formX || Math.random() < 0.005) {
        const posIdx = players.filter((pp) => pp.team === p.team).indexOf(p);
        const spread = hh * 0.7;
        const ySlots = [-spread, -spread / 2, 0, spread / 2, spread];
        const yPos = ySlots[posIdx % 5] || 0;
        p.formX = fc.x + teamSide * Phaser.Math.Between(20, hw - 30);
        p.formY = fc.y + yPos + Phaser.Math.Between(-15, 15);
      }
      tx = p.formX;
      ty = p.formY;
      spd = 40;
    }

    const angle = Phaser.Math.Angle.Between(p.sprite.x, p.sprite.y, tx, ty);
    const dist = Phaser.Math.Distance.Between(p.sprite.x, p.sprite.y, tx, ty);

    if (dist > 8) {
      p.sprite.x += Math.cos(angle) * spd * dt;
      p.sprite.y += Math.sin(angle) * spd * dt;
      p.sprite.setFlipX(Math.cos(angle) < 0);
      p.runTimer += delta;
      if (p.runTimer > 150) {
        p.runTimer = 0;
        p.runFrame = 1 - p.runFrame;
        p.sprite.setTexture(
          p.runFrame === 0 ? `${p.team}-run1` : `${p.team}-run2`,
        );
      }
    } else {
      p.sprite.setTexture(`${p.team}-stand`);
    }

    // Keep on field (only while playing)
    p.sprite.x = Phaser.Math.Clamp(
      p.sprite.x,
      fc.x - hw + 10,
      fc.x + hw - 10,
    );
    p.sprite.y = Phaser.Math.Clamp(
      p.sprite.y,
      fc.y - hh + 10,
      fc.y + hh - 10,
    );
  }

  // --- Spectator clapping (only while idle) ---
  for (const spec of scene.soccerSpectators) {
    if (!spec.sprite.active) continue;
    if (spec.personEntry && spec.personEntry.state !== "idle") continue;
    spec.clapTimer += delta;
    if (spec.clapTimer > spec.clapInterval) {
      spec.clapTimer = 0;
      spec.clapFrame = 1 - spec.clapFrame;
      spec.sprite.setTexture(
        spec.clapFrame === 0
          ? `person-wave1-${spec.skinId}`
          : `person-wave2-${spec.skinId}`,
      );
    }
  }
}
