import Phaser from "phaser";
import {
  TILE, SCALE, SOCCER_X, SOCCER_Y,
  SOCCER_FIELD_W, SOCCER_FIELD_H, SOCCER_PLAYERS_PER_TEAM,
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

  // --- Ball holder & passing ---
  scene.soccerPassTimer += dt;

  // Check if a chaser reached the ball
  if (chaserA && bestDistA < 15 && scene.soccerBallHolder !== chaserA) {
    scene.soccerBallHolder = chaserA;
    scene.soccerPassTimer = 0;
  }
  if (chaserB && bestDistB < 15 && scene.soccerBallHolder !== chaserB) {
    scene.soccerBallHolder = chaserB;
    scene.soccerPassTimer = 0;
  }

  // Ball follows holder
  if (scene.soccerBallHolder && scene.soccerBallHolder.sprite.active) {
    const h = scene.soccerBallHolder;
    ball.x = h.sprite.x + 8;
    ball.y = h.sprite.y + 5;

    // After holding for a bit, kick toward a teammate or the goal
    if (scene.soccerPassTimer > 1.0 + Math.random() * 0.5) {
      scene.soccerPassTimer = 0;
      // Find a teammate to pass to, or shoot at goal
      const teammates = players.filter(
        (p) => p.team === h.team && p !== h && p.sprite.active,
      );
      const shootChance = 0.3;
      if (Math.random() < shootChance || teammates.length === 0) {
        // Shoot at goal
        const goalX = h.team === "team-a" ? fc.x + hw + 10 : fc.x - hw - 10;
        scene.soccerBallVel = {
          x: (goalX - ball.x) * 0.8,
          y: (fc.y + Phaser.Math.Between(-30, 30) - ball.y) * 0.8,
        };
      } else {
        const target = Phaser.Utils.Array.GetRandom(teammates);
        scene.soccerBallVel = {
          x: (target.sprite.x - ball.x) * 0.6,
          y: (target.sprite.y - ball.y) * 0.6,
        };
      }
      scene.soccerBallHolder = null;
    }
  } else {
    // Ball is free — move with velocity and slow down
    if (scene.soccerBallVel) {
      ball.x += scene.soccerBallVel.x * dt;
      ball.y += scene.soccerBallVel.y * dt;
      scene.soccerBallVel.x *= 0.97;
      scene.soccerBallVel.y *= 0.97;
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

    // If ball went past a goal line, reset to center
    if (ball.x <= fc.x - hw + 5 || ball.x >= fc.x + hw - 5) {
      ball.x = fc.x;
      ball.y = fc.y;
      scene.soccerBallVel = null;
      scene.soccerBallHolder = null;
    }
  }

  // --- Move players (only those still playing) ---
  for (const p of players) {
    if (!p.sprite.active) continue;
    // Skip players that are panicking, ghost, gone, etc.
    if (p.personEntry.state !== "idle") {
      // Drop the ball if holder panicked/died
      if (scene.soccerBallHolder === p) {
        scene.soccerBallHolder = null;
      }
      continue;
    }

    const isChaser = p === chaserA || p === chaserB;
    const isHolder = p === scene.soccerBallHolder;
    const teamSide = p.team === "team-a" ? -1 : 1;
    let tx, ty, spd;

    if (isHolder) {
      tx = fc.x + teamSide * hw;
      ty = fc.y + Phaser.Math.Between(-30, 30);
      spd = 55;
    } else if (isChaser && !scene.soccerBallHolder) {
      tx = ball.x;
      ty = ball.y;
      spd = 70;
    } else if (
      isChaser &&
      scene.soccerBallHolder &&
      scene.soccerBallHolder.team !== p.team
    ) {
      tx = scene.soccerBallHolder.sprite.x;
      ty = scene.soccerBallHolder.sprite.y;
      spd = 65;
    } else {
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
