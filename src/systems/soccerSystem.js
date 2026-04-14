import Phaser from "phaser";
import {
  TILE, SCALE,
  SOCCER_FIELD_W, SOCCER_FIELD_H, SOCCER_PLAYERS_PER_TEAM, SOCCER_TACKLE_COOLDOWN,
} from "../constants.js";
import { cheerPhrases } from "../dialog.js";

/**
 * Spawn a soccer match at the given tile coordinates.
 * @param {Phaser.Scene} scene
 * @param {Phaser.Math.RandomDataGenerator} rng
 * @param {{tileX: number, tileY: number}} opts
 * @returns {{type: string, bounds: {cx, cy, hw, hh}, update: (dt: number, delta?: number) => void, destroy: () => void}}
 */
export function createSoccer(scene, rng, opts) {
  const { tileX, tileY } = opts;
  const cx = tileX * TILE * SCALE;
  const cy = tileY * TILE * SCALE;
  const fieldW = SOCCER_FIELD_W;
  const fieldH = SOCCER_FIELD_H;

  // --- Per-instance state (closure) ---
  const fieldCenter = { x: cx, y: cy };
  const players = [];
  const spectators = [];
  let ball = null;
  let active = true;
  let ballHolder = null;
  let lastHolder = null;
  let passTimer = 0;
  let tackleCooldown = 0;
  let ballVel = null;

  // Green pitch
  for (let fy = -fieldH / 2; fy < fieldH / 2; fy += TILE * SCALE) {
    for (let fx = -fieldW / 2; fx < fieldW / 2; fx += TILE * SCALE) {
      scene.add
        .image(cx + fx, cy + fy, "grass")
        .setOrigin(0, 0)
        .setScale(SCALE)
        .setDepth(1);
    }
  }

  // Field boundary lines — top & bottom
  for (let fx = -fieldW / 2; fx < fieldW / 2; fx += TILE * SCALE) {
    scene.add
      .image(cx + fx, cy - fieldH / 2, "field-line-h")
      .setOrigin(0, 0)
      .setScale(SCALE)
      .setDepth(1.5);
    scene.add
      .image(cx + fx, cy + fieldH / 2, "field-line-h")
      .setOrigin(0, 0)
      .setScale(SCALE)
      .setDepth(1.5);
  }
  // Left & right
  for (let fy = -fieldH / 2; fy < fieldH / 2; fy += TILE * SCALE) {
    scene.add
      .image(cx - fieldW / 2, cy + fy, "field-line-v")
      .setOrigin(0, 0)
      .setScale(SCALE)
      .setDepth(1.5);
    scene.add
      .image(cx + fieldW / 2, cy + fy, "field-line-v")
      .setOrigin(0, 0)
      .setScale(SCALE)
      .setDepth(1.5);
  }
  // Center line
  for (let fy = -fieldH / 2; fy < fieldH / 2; fy += TILE * SCALE) {
    scene.add
      .image(cx, cy + fy, "field-line-v")
      .setOrigin(0, 0)
      .setScale(SCALE)
      .setDepth(1.5);
  }

  // Goals
  scene.add
    .image(cx - fieldW / 2 - 10, cy, "soccer-goal")
    .setScale(SCALE)
    .setDepth(2)
    .setAngle(90);
  scene.add
    .image(cx + fieldW / 2 + 10, cy, "soccer-goal")
    .setScale(SCALE)
    .setDepth(2)
    .setAngle(90);

  // Soccer ball
  ball = scene.add
    .image(cx, cy, "soccer-ball")
    .setScale(SCALE)
    .setDepth(4);

  // Soccer players (5 per team)
  const teams = ["team-a", "team-b"];
  for (let t = 0; t < 2; t++) {
    const side = t === 0 ? -1 : 1;
    for (let p = 0; p < SOCCER_PLAYERS_PER_TEAM; p++) {
      const px = cx + side * (50 + rng.between(0, 80));
      const py = cy + rng.between(-80, 80);
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
      players.push(player);
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

  // Spectators around the field (cheering/clapping)
  // Rows of spectators on both long sides
  for (let side = -1; side <= 1; side += 2) {
    for (let s = 0; s < 12; s++) {
      const sx = cx - fieldW / 2 + 20 + s * (fieldW / 12);
      const sy = cy + side * (fieldH / 2 + 35 + rng.between(0, 20));
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
      spectators.push({
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
      const sx = cx + side * (fieldW / 2 + 35 + rng.between(0, 15));
      const sy = cy - 60 + s * 40;
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
      spectators.push({
        sprite,
        skinId,
        personEntry: personEntry2,
        clapTimer: rng.between(0, 500),
        clapInterval: 400 + rng.between(0, 300),
        clapFrame: 0,
      });
    }
  }

  // --- Instance API ---
  const instance = {
    type: "soccer",
    bounds: {
      cx,
      cy,
      // Include the spectator rings in the footprint
      hw: fieldW / 2 + 55,
      hh: fieldH / 2 + 55,
    },
    update(dt, delta) {
      if (!active) return;
      if (!ball || !ball.active) return;
      if (delta == null) delta = dt * 1000;

      const fc = fieldCenter;
      const hw = fieldW / 2;
      const hh = fieldH / 2;

      // --- Determine closest active (idle) player per team to ball ---
      let chaserA = null, chaserB = null;
      let bestDistA = Infinity, bestDistB = Infinity;
      for (const p of players) {
        if (!p.sprite.active || p.personEntry.state !== "idle") continue;
        const d = Phaser.Math.Distance.Between(
          p.sprite.x, p.sprite.y, ball.x, ball.y,
        );
        if (p.team === "team-a" && d < bestDistA) { bestDistA = d; chaserA = p; }
        if (p.team === "team-b" && d < bestDistB) { bestDistB = d; chaserB = p; }
      }

      // --- Ball holder & tackling ---
      passTimer += dt;
      tackleCooldown -= dt;

      // Any player who reaches the ball can pick it up (with cooldown)
      for (const p of players) {
        if (!p.sprite.active || p.personEntry.state !== "idle") continue;
        if (p === lastHolder && tackleCooldown > 0) continue;
        const d = Phaser.Math.Distance.Between(p.sprite.x, p.sprite.y, ball.x, ball.y);
        if (d < 15 && ballHolder !== p && tackleCooldown <= 0) {
          lastHolder = ballHolder;
          ballHolder = p;
          passTimer = 0;
          tackleCooldown = SOCCER_TACKLE_COOLDOWN;
          break;
        }
      }

      // Ball follows holder
      if (ballHolder && ballHolder.sprite.active) {
        const h = ballHolder;
        ball.x = h.sprite.x + 8;
        ball.y = h.sprite.y + 5;

        const holdTime = 0.8 + Math.random() * 0.8;
        if (passTimer > holdTime) {
          passTimer = 0;
          const teammates = players.filter(
            (p) => p.team === h.team && p !== h && p.sprite.active && p.personEntry.state === "idle",
          );

          const goalX = h.team === "team-a" ? fc.x + hw : fc.x - hw;
          const distToGoal = Math.abs(h.sprite.x - goalX);
          const shootChance = distToGoal < hw * 0.4 ? 0.6 : 0.2;

          if (Math.random() < shootChance || teammates.length === 0) {
            ballVel = {
              x: (goalX + 10 * (h.team === "team-a" ? 1 : -1) - ball.x) * 0.9,
              y: (fc.y + Phaser.Math.Between(-40, 40) - ball.y) * 0.9,
            };
          } else {
            const forwardTeammates = teammates.filter((t) => {
              const fwd = h.team === "team-a"
                ? t.sprite.x > h.sprite.x
                : t.sprite.x < h.sprite.x;
              return fwd;
            });
            const target = forwardTeammates.length > 0
              ? Phaser.Utils.Array.GetRandom(forwardTeammates)
              : Phaser.Utils.Array.GetRandom(teammates);
            ballVel = {
              x: (target.sprite.x - ball.x) * 0.7,
              y: (target.sprite.y - ball.y) * 0.7,
            };
          }
          ballHolder = null;
        }
      } else {
        // Ball is free — move with velocity and slow down
        if (ballVel) {
          ball.x += ballVel.x * dt;
          ball.y += ballVel.y * dt;
          ballVel.x *= 0.95;
          ballVel.y *= 0.95;
          if (Math.abs(ballVel.x) < 1 && Math.abs(ballVel.y) < 1) {
            ballVel = null;
          }
        }
        ball.x = Phaser.Math.Clamp(ball.x, fc.x - hw, fc.x + hw);
        ball.y = Phaser.Math.Clamp(ball.y, fc.y - hh, fc.y + hh);

        // Goal scored — reset to center
        if (ball.x <= fc.x - hw + 5 || ball.x >= fc.x + hw - 5) {
          ball.x = fc.x;
          ball.y = fc.y;
          ballVel = null;
          ballHolder = null;
          for (const p of players) { p.formX = null; }
        }
      }

      // --- Move players ---
      for (const p of players) {
        if (!p.sprite.active) continue;
        if (p.personEntry.state !== "idle") {
          if (ballHolder === p) ballHolder = null;
          continue;
        }

        const isChaser = p === chaserA || p === chaserB;
        const isHolder = p === ballHolder;
        const teamSide = p.team === "team-a" ? -1 : 1;
        const opponentHasBall = ballHolder && ballHolder.team !== p.team;
        let tx, ty, spd;

        if (isHolder) {
          const goalX = fc.x + teamSide * hw;
          tx = goalX;
          ty = fc.y + Math.sin(scene.time ? scene.time.now * 0.002 + p.sprite.y : 0) * 40;
          spd = 50;
        } else if (isChaser && !ballHolder) {
          tx = ball.x;
          ty = ball.y;
          spd = 70;
        } else if (isChaser && opponentHasBall) {
          tx = ballHolder.sprite.x;
          ty = ballHolder.sprite.y;
          spd = 68;
        } else if (opponentHasBall) {
          tx = ball.x + teamSide * Phaser.Math.Between(-30, 60);
          ty = ball.y + Phaser.Math.Between(-40, 40);
          tx = Phaser.Math.Clamp(tx, fc.x - hw + 10, fc.x + hw - 10);
          ty = Phaser.Math.Clamp(ty, fc.y - hh + 10, fc.y + hh - 10);
          spd = 45;
        } else if (ballHolder && ballHolder.team === p.team) {
          const holderX = ballHolder.sprite.x;
          if (!p.formX || Math.random() < 0.02) {
            p.formX = holderX + teamSide * Phaser.Math.Between(30, hw - 20);
            p.formY = fc.y + Phaser.Math.Between(-hh + 20, hh - 20);
            p.formX = Phaser.Math.Clamp(p.formX, fc.x - hw + 10, fc.x + hw - 10);
          }
          tx = p.formX;
          ty = p.formY;
          spd = 45;
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

        p.sprite.x = Phaser.Math.Clamp(p.sprite.x, fc.x - hw + 10, fc.x + hw - 10);
        p.sprite.y = Phaser.Math.Clamp(p.sprite.y, fc.y - hh + 10, fc.y + hh - 10);
      }

      // --- Spectator clapping (only while idle) ---
      for (const spec of spectators) {
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
    },
    destroy() {},
  };
  return instance;
}
