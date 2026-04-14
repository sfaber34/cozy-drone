// Camel race set piece.
//
// Factory pattern — multiple races can coexist. Call:
//   const race = createCamelRace(scene, rng, { tileX, tileY });
//   scene.setPieces.push(race);
//   // ... per frame:
//   race.update(dt);
//
// NOTE: spectator utility uses a global `spectatorKey` — multiple instances
// of the same set-piece type will share/collide on that key. Single-instance
// usage works fine; multi-instance would need a per-instance key.
import Phaser from "phaser";
import {
  TILE, SCALE,
  CAMEL_RACE_CAMELS, CAMEL_RACE_SPECTATORS,
  CAMEL_RACE_SPEED_MIN, CAMEL_RACE_SPEED_RANGE,
} from "../constants.js";
import { createBettingSpectators, updateBettingSpectators } from "./spectatorUtils.js";

export function createCamelRace(scene, rng, opts) {
  const { tileX, tileY } = opts;
  const cx = tileX * TILE * SCALE;
  const cy = tileY * TILE * SCALE;

  // Desert-colored ground to cover props (sized from track tile grid)
  const t0 = TILE * SCALE;
  const groundHw = 8 * t0 / 2 + 120;
  const groundHh = 6 * t0 / 2 + 120;
  const ground = scene.add.graphics();
  ground.fillStyle(0xd2b48c, 1);
  ground.fillRect(cx - groundHw, cy - groundHh, groundHw * 2, groundHh * 2);
  ground.setDepth(1.1);

  // Build track from tiles on a simple grid
  // Track is a rounded rectangle: corners + straights
  const t = TILE * SCALE; // 48px per tile
  const tilesW = 8; // total tiles wide (including corners)
  const tilesH = 6; // total tiles tall (including corners)
  const halfW = (tilesW * t) / 2;
  const halfH = (tilesH * t) / 2;
  const startX = cx - halfW;
  const startY = cy - halfH;

  const sprites = [ground];

  // Top row: TL corner + straights + TR corner
  sprites.push(scene.add.image(startX, startY, "track-tl").setOrigin(0, 0).setScale(SCALE).setDepth(1.5));
  for (let i = 1; i < tilesW - 1; i++) {
    sprites.push(scene.add.image(startX + i * t, startY, "track-h").setOrigin(0, 0).setScale(SCALE).setDepth(1.5));
  }
  sprites.push(scene.add.image(startX + (tilesW - 1) * t, startY, "track-tr").setOrigin(0, 0).setScale(SCALE).setDepth(1.5));

  // Middle rows: left + right verticals
  for (let j = 1; j < tilesH - 1; j++) {
    sprites.push(scene.add.image(startX, startY + j * t, "track-v").setOrigin(0, 0).setScale(SCALE).setDepth(1.5));
    sprites.push(scene.add.image(startX + (tilesW - 1) * t, startY + j * t, "track-v").setOrigin(0, 0).setScale(SCALE).setDepth(1.5));
  }

  // Bottom row: BL corner + straights + BR corner
  sprites.push(scene.add.image(startX, startY + (tilesH - 1) * t, "track-bl").setOrigin(0, 0).setScale(SCALE).setDepth(1.5));
  for (let i = 1; i < tilesW - 1; i++) {
    sprites.push(scene.add.image(startX + i * t, startY + (tilesH - 1) * t, "track-h").setOrigin(0, 0).setScale(SCALE).setDepth(1.5));
  }
  sprites.push(scene.add.image(startX + (tilesW - 1) * t, startY + (tilesH - 1) * t, "track-br").setOrigin(0, 0).setScale(SCALE).setDepth(1.5));

  // Build waypoints along the track centerline (rounded rectangle)
  const trackLeft = startX + t / 2;
  const trackRight = startX + (tilesW - 1) * t + t / 2;
  const trackTop = startY + t / 2;
  const trackBot = startY + (tilesH - 1) * t + t / 2;
  const cornerR = t / 2;

  const trackWaypoints = [];
  const cornerSteps = 8;

  const cTL = { x: trackLeft + cornerR, y: trackTop + cornerR };
  const cTR = { x: trackRight - cornerR, y: trackTop + cornerR };
  const cBR = { x: trackRight - cornerR, y: trackBot - cornerR };
  const cBL = { x: trackLeft + cornerR, y: trackBot - cornerR };

  const topStraightSteps = Math.max(1, Math.round((cTR.x - cTL.x) / (t / 2)));
  for (let i = 0; i <= topStraightSteps; i++) {
    const frac = i / topStraightSteps;
    trackWaypoints.push({ x: cTL.x + frac * (cTR.x - cTL.x), y: trackTop });
  }
  for (let s = 1; s <= cornerSteps; s++) {
    const a = -Math.PI / 2 + (s / cornerSteps) * (Math.PI / 2);
    trackWaypoints.push({ x: cTR.x + Math.cos(a) * cornerR, y: cTR.y + Math.sin(a) * cornerR });
  }
  const rightStraightSteps = Math.max(1, Math.round((cBR.y - cTR.y) / (t / 2)));
  for (let i = 1; i <= rightStraightSteps; i++) {
    const frac = i / rightStraightSteps;
    trackWaypoints.push({ x: trackRight, y: cTR.y + frac * (cBR.y - cTR.y) });
  }
  for (let s = 1; s <= cornerSteps; s++) {
    const a = (s / cornerSteps) * (Math.PI / 2);
    trackWaypoints.push({ x: cBR.x + Math.cos(a) * cornerR, y: cBR.y + Math.sin(a) * cornerR });
  }
  const botStraightSteps = Math.max(1, Math.round((cBR.x - cBL.x) / (t / 2)));
  for (let i = 1; i <= botStraightSteps; i++) {
    const frac = i / botStraightSteps;
    trackWaypoints.push({ x: cBR.x - frac * (cBR.x - cBL.x), y: trackBot });
  }
  for (let s = 1; s <= cornerSteps; s++) {
    const a = Math.PI / 2 + (s / cornerSteps) * (Math.PI / 2);
    trackWaypoints.push({ x: cBL.x + Math.cos(a) * cornerR, y: cBL.y + Math.sin(a) * cornerR });
  }
  const leftStraightSteps = Math.max(1, Math.round((cBL.y - cTL.y) / (t / 2)));
  for (let i = 1; i <= leftStraightSteps; i++) {
    const frac = i / leftStraightSteps;
    trackWaypoints.push({ x: trackLeft, y: cBL.y - frac * (cBL.y - cTL.y) });
  }
  for (let s = 1; s <= cornerSteps; s++) {
    const a = Math.PI + (s / cornerSteps) * (Math.PI / 2);
    trackWaypoints.push({ x: cTL.x + Math.cos(a) * cornerR, y: cTL.y + Math.sin(a) * cornerR });
  }

  const totalWP = trackWaypoints.length;

  // For corral/return bounds
  const rx = (tilesW * t) / 2;
  const ry = (tilesH * t) / 2;

  // Racing camels
  const raceCamels = [];
  for (let i = 0; i < CAMEL_RACE_CAMELS; i++) {
    const wpIdx = Math.floor((i / CAMEL_RACE_CAMELS) * totalWP);
    const wp = trackWaypoints[wpIdx];
    const sprite = scene.add.image(wp.x, wp.y, "camel")
      .setScale(SCALE).setDepth(2);

    const speed = CAMEL_RACE_SPEED_MIN + Math.random() * CAMEL_RACE_SPEED_RANGE;

    const animalEntry = {
      sprite,
      type: "camel",
      state: "idle",
      corral: { x: cx, y: cy, hw: rx + 30, hh: ry + 30 },
      wanderAngle: 0,
      wanderTimer: 0,
      wanderDuration: 999,
      moving: false,
      runAngle: 0,
      runTimer: 0,
      runFrame: 0,
      panicTimer: 0,
      isRaceCamel: true,
    };
    scene.animals.push(animalEntry);

    raceCamels.push({
      sprite,
      animalEntry,
      wpIndex: wpIdx,
      wpProgress: 0,
      speed,
      alive: true,
      returning: false,
      trackCx: cx,
      trackCy: cy,
      trackBoundsRx: rx,
      trackBoundsRy: ry,
    });
  }

  // Spectators — reuse shared betting crowd utility.
  // NOTE: spectatorKey is global — multiple camel-race instances would clash.
  createBettingSpectators(scene, rng, cx, cy, {
    count: CAMEL_RACE_SPECTATORS,
    rings: [
      { distX: rx + 50, distY: ry + 50, fraction: 0.5 },
      { distX: rx + 90, distY: ry + 90, fraction: 0.5, angleOffset: Math.PI / Math.round(CAMEL_RACE_SPECTATORS * 0.5) },
    ],
    greetings: [
      "Yalla! Yalla!", "FASTER!", "Go camel go!",
      "My camel\nwill win!", "500 dinars!", "Run!",
      "Bet! Bet!", "He's gaining!", "COME ON!",
      "Double or\nnothing!", "The brown\none! THE\nBROWN ONE!",
    ],
    event: "camelRace",
    spectatorKey: "camelRaceSpectators",
    flagKey: "isCamelRaceSpectator",
  });

  return {
    type: "camelRace",
    bounds: {
      cx, cy,
      hw: groundHw,
      hh: groundHh,
    },
    update(dt) {
      for (const rc of raceCamels) {
        if (!rc.sprite.active) continue;
        const ae = rc.animalEntry;

        if (ae.state === "dead") {
          rc.alive = false;
          continue;
        }

        if (ae.state === "panicking") {
          rc.returning = true;
          continue;
        }

        if (rc.returning && ae.state === "idle") {
          let bestIdx = 0;
          let bestDist = Infinity;
          for (let wi = 0; wi < trackWaypoints.length; wi++) {
            const d = Phaser.Math.Distance.Between(rc.sprite.x, rc.sprite.y, trackWaypoints[wi].x, trackWaypoints[wi].y);
            if (d < bestDist) { bestDist = d; bestIdx = wi; }
          }

          if (bestDist < 20) {
            rc.returning = false;
            rc.wpIndex = bestIdx;
            rc.wpProgress = 0;
            ae.wanderDuration = 999;
            ae.moving = false;
          } else {
            const walkAngle = Phaser.Math.Angle.Between(
              rc.sprite.x, rc.sprite.y, trackWaypoints[bestIdx].x, trackWaypoints[bestIdx].y,
            );
            rc.sprite.x += Math.cos(walkAngle) * 40 * dt;
            rc.sprite.y += Math.sin(walkAngle) * 40 * dt;
            rc.sprite.setFlipX(Math.cos(walkAngle) < 0);
            rc.runTimer = (rc.runTimer || 0) + dt;
            if (rc.runTimer > 0.15) {
              rc.runTimer = 0;
              rc.runFrame = (rc.runFrame || 0) === 0 ? 1 : 0;
              rc.sprite.setTexture(rc.runFrame === 0 ? "camel" : "camel2");
            }
            continue;
          }
        }

        if (!rc.alive) continue;

        // --- Racing: follow waypoints along the track ---
        rc.wpProgress += rc.speed * dt;
        let safety = 0;
        while (safety++ < 20) {
          const ci = rc.wpIndex;
          const ni = (ci + 1) % totalWP;
          const sd = Phaser.Math.Distance.Between(trackWaypoints[ci].x, trackWaypoints[ci].y, trackWaypoints[ni].x, trackWaypoints[ni].y) || 1;
          if (rc.wpProgress < sd) break;
          rc.wpProgress -= sd;
          rc.wpIndex = ni;
        }

        const ci = rc.wpIndex;
        const ni = (ci + 1) % totalWP;
        const cw = trackWaypoints[ci];
        const nw = trackWaypoints[ni];
        const sd = Phaser.Math.Distance.Between(cw.x, cw.y, nw.x, nw.y) || 1;
        const frac = Phaser.Math.Clamp(rc.wpProgress / sd, 0, 1);
        rc.sprite.x = cw.x + (nw.x - cw.x) * frac;
        rc.sprite.y = cw.y + (nw.y - cw.y) * frac;

        const dx = nw.x - cw.x;
        const dy = nw.y - cw.y;
        rc.sprite.setFlipX(dx < 0);

        rc.runTimer = (rc.runTimer || 0) + dt;
        if (rc.runTimer > 0.12) {
          rc.runTimer = 0;
          rc.runFrame = (rc.runFrame || 0) === 0 ? 1 : 0;
          rc.sprite.setTexture(rc.runFrame === 0 ? "camel" : "camel2");
        }
      }

      updateBettingSpectators(scene, dt, "camelRaceSpectators");
    },
    destroy() {
      for (const s of sprites) s.destroy();
    },
  };
}
