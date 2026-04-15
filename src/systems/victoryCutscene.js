// Victory cutscene — triggered when the player has killed the required number
// of people and lands back at the runway. 10 "guy1/guy2" little guys run out
// of the hangar, surround the drone, jump + cheer, and emojis rain down.
// After VICTORY_CELEBRATION_DURATION a modal announces victory.
import {
  SCALE,
  VICTORY_CROWD_COUNT,
  VICTORY_SURROUND_RADIUS,
  VICTORY_WALK_SPEED,
  VICTORY_JUMP_HZ,
  VICTORY_JUMP_AMP,
  VICTORY_FRAME_INTERVAL,
  VICTORY_CELEBRATION_DURATION,
  VICTORY_EMOJI_INTERVAL_MIN,
  VICTORY_EMOJI_INTERVAL_RANGE,
  VICTORY_EMOJI_RISE_DURATION,
  VICTORY_EMOJI_RISE_HEIGHT,
  VICTORY_EXIT_STAGGER_MS,
  VICTORY_EXIT_JITTER_MS,
  VICTORY_DRONE_AVOID_RADIUS,
} from "../constants.js";
const EMOJIS = [
  "😀",
  "😃",
  "😄",
  "🥳",
  "😁",
  "🎆",
  "🎇",
  "🎉",
  "🎊",
  "🏆",
  "🏆",
  "🏆",
  "❤️",
  "⭐",
  "✨",
];

export function startVictory(scene) {
  if (scene.victoryActive) return;
  scene.victoryActive = true;

  const cutscene = createVictoryCutscene(scene);
  if (!scene.setPieces) scene.setPieces = [];
  scene.setPieces.push(cutscene);
}

function createVictoryCutscene(scene) {
  const dx = scene.droneState.x;
  const dy = scene.droneState.y;
  // Hangar door is on the LEFT side of the hangar (facing the runway) —
  // same offset the intro cutscene uses.
  const doorX = scene.hangarX - (48 * SCALE) / 2;
  const doorY = scene.hangarY;

  const guys = [];
  for (let i = 0; i < VICTORY_CROWD_COUNT; i++) {
    // Stagger the spawn along the door plane with a slight y jitter
    const startX = doorX + (Math.random() - 0.5) * 6;
    const startY = doorY + (Math.random() - 0.5) * 12;
    const sprite = scene.add
      .image(startX, startY, "guy1")
      .setScale(SCALE)
      .setDepth(10);
    scene.hudCam.ignore(sprite);

    // Target: evenly spaced around the drone
    const angle = (i / VICTORY_CROWD_COUNT) * Math.PI * 2 + Math.random() * 0.3;
    const targetX = dx + Math.cos(angle) * VICTORY_SURROUND_RADIUS;
    const targetY = dy + Math.sin(angle) * VICTORY_SURROUND_RADIUS;

    guys.push({
      sprite,
      homeX: targetX,
      homeY: targetY,
      state: "waiting", // "waiting" | "walking" | "cheering"
      // Stagger exits so they trickle out of the door instead of as a glob
      exitDelay:
        i * VICTORY_EXIT_STAGGER_MS + Math.random() * VICTORY_EXIT_JITTER_MS,
      walkFrameTimer: Math.random() * VICTORY_FRAME_INTERVAL,
      walkFrame: 0,
      jumpPhase: Math.random() * Math.PI * 2,
    });
    sprite.setVisible(false); // hidden until their exitDelay fires
  }

  let allArrived = false;
  let celebrationElapsed = 0;
  let emojiTimer = 0;
  let modalShown = false;
  const emojis = [];

  return {
    type: "victoryCutscene",
    bounds: {
      cx: dx,
      cy: dy,
      hw: VICTORY_SURROUND_RADIUS + 30,
      hh: VICTORY_SURROUND_RADIUS + 30,
    },
    update(dt) {
      // --- Move guys into position ---
      if (!allArrived) {
        let arrived = 0;
        for (const g of guys) {
          if (g.state === "cheering") {
            arrived++;
            continue;
          }
          // Wait inside the hangar until this guy's stagger delay expires
          if (g.state === "waiting") {
            g.exitDelay -= dt * 1000;
            if (g.exitDelay <= 0) {
              g.state = "walking";
              g.sprite.setVisible(true);
            } else {
              continue;
            }
          }

          const dxm = g.homeX - g.sprite.x;
          const dym = g.homeY - g.sprite.y;
          const dist = Math.hypot(dxm, dym);
          if (dist < 3) {
            g.state = "cheering";
            g.sprite.x = g.homeX;
            g.sprite.y = g.homeY;
            arrived++;
            continue;
          }

          // Base move direction toward target
          let moveX = dxm / dist;
          let moveY = dym / dist;

          // Drone avoidance — if close to the drone, push outward so guys
          // curve around instead of walking through it.
          const dronedx = g.sprite.x - dx;
          const dronedy = g.sprite.y - dy;
          const droneDist = Math.hypot(dronedx, dronedy) || 0.0001;
          if (droneDist < VICTORY_DRONE_AVOID_RADIUS) {
            const pushStrength =
              (VICTORY_DRONE_AVOID_RADIUS - droneDist) /
              VICTORY_DRONE_AVOID_RADIUS;
            moveX += (dronedx / droneDist) * pushStrength * 2;
            moveY += (dronedy / droneDist) * pushStrength * 2;
            const m = Math.hypot(moveX, moveY) || 1;
            moveX /= m;
            moveY /= m;
          }

          const step = VICTORY_WALK_SPEED * dt;
          g.sprite.x += moveX * step;
          g.sprite.y += moveY * step;
          g.sprite.setFlipX(moveX < 0);
          g.walkFrameTimer += dt * 1000;
          if (g.walkFrameTimer >= VICTORY_FRAME_INTERVAL) {
            g.walkFrameTimer = 0;
            g.walkFrame = 1 - g.walkFrame;
            g.sprite.setTexture(g.walkFrame === 0 ? "guy1" : "guy2");
          }
        }
        if (arrived === guys.length) allArrived = true;
      }

      // --- Cheering (jump + arms-raised pose toggle) ---
      for (const g of guys) {
        if (g.state !== "cheering") continue;
        g.sprite.setFlipX(false); // face forward while celebrating
        g.jumpPhase += dt * VICTORY_JUMP_HZ * Math.PI * 2;
        const bob = Math.abs(Math.sin(g.jumpPhase)) * VICTORY_JUMP_AMP;
        g.sprite.y = g.homeY - bob;
        g.walkFrameTimer += dt * 1000;
        if (g.walkFrameTimer >= VICTORY_FRAME_INTERVAL) {
          g.walkFrameTimer = 0;
          g.walkFrame = 1 - g.walkFrame;
          g.sprite.setTexture(g.walkFrame === 0 ? "guy-cheer1" : "guy-cheer2");
        }
      }

      // Once everyone's cheering, start the celebration timer + emoji burst
      if (allArrived) {
        celebrationElapsed += dt * 1000;
        emojiTimer -= dt * 1000;
        if (emojiTimer <= 0) {
          emojiTimer =
            VICTORY_EMOJI_INTERVAL_MIN +
            Math.random() * VICTORY_EMOJI_INTERVAL_RANGE;
          spawnEmoji(scene, dx, dy);
        }
        if (!modalShown && celebrationElapsed >= VICTORY_CELEBRATION_DURATION) {
          modalShown = true;
          showVictoryModal(scene);
        }
      }

      // Clean up finished emojis
      for (let i = emojis.length - 1; i >= 0; i--) {
        if (!emojis[i].active) emojis.splice(i, 1);
      }
    },
    destroy() {
      for (const g of guys) g.sprite.destroy();
      for (const e of emojis) e.destroy();
    },
  };
}

function spawnEmoji(scene, cx, cy) {
  const glyph = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
  const angle = Math.random() * Math.PI * 2;
  const dist = VICTORY_SURROUND_RADIUS * (0.4 + Math.random() * 0.8);
  const x = cx + Math.cos(angle) * dist;
  const y = cy + Math.sin(angle) * dist;
  const size = 20 + Math.floor(Math.random() * 10);
  const e = scene.add
    .text(x, y, glyph, {
      fontFamily: "sans-serif",
      fontSize: `${size}px`,
    })
    .setOrigin(0.5)
    .setDepth(25);
  scene.hudCam.ignore(e);
  scene.tweens.add({
    targets: e,
    y: y - VICTORY_EMOJI_RISE_HEIGHT,
    x: x + (Math.random() - 0.5) * 24,
    alpha: 0,
    scale: 1.3,
    angle: (Math.random() - 0.5) * 120,
    duration: VICTORY_EMOJI_RISE_DURATION,
    ease: "Quad.easeOut",
    onComplete: () => e.destroy(),
  });
}

function showVictoryModal(scene) {
  // Hide mobile controls for the completion modal — they're re-launched by
  // the briefing modal on restart.
  if (scene.scene.isActive("MobileControls")) {
    scene.scene.stop("MobileControls");
  }

  const build = () => {
    if (scene._victoryModalItems) {
      for (const it of scene._victoryModalItems) it.destroy();
    }
    const items = [];
    const w = scene.scale.width;
    const h = scene.scale.height;
    const narrow = Math.min(w, h);

    const overlay = scene.add
      .rectangle(-20, -20, w + 40, h + 40, 0x000000, 0.85)
      .setOrigin(0, 0)
      .setDepth(600);
    items.push(overlay);

    const titleSize = Math.max(24, Math.min(48, Math.round(narrow * 0.08)));
    const title = scene.add
      .text(w / 2, h * 0.32, "MISSION COMPLETE!!", {
        fontFamily: "monospace",
        fontSize: `${titleSize}px`,
        color: "#ffee66",
        stroke: "#000",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(601);
    items.push(title);

    // Elapsed mission time — from the end of the intro cutscene to the
    // moment the drone came to rest on the runway
    const timeSize = Math.max(16, Math.min(26, Math.round(narrow * 0.045)));
    const elapsedStr = formatElapsed(
      scene.missionStartTime,
      scene.missionEndTime,
    );
    const timeText = scene.add
      .text(w / 2, h * 0.42, `MISSION TIME: ${elapsedStr}`, {
        fontFamily: "monospace",
        fontSize: `${timeSize}px`,
        color: "#ffffff",
        stroke: "#000",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(601);
    items.push(timeText);

    const subSize = Math.max(18, Math.min(28, Math.round(narrow * 0.05)));
    const sub = scene.add
      .text(w / 2, h * 0.52, "YOU RULE!", {
        fontFamily: "monospace",
        fontSize: `${subSize}px`,
        color: "#ff88cc",
        stroke: "#000",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(601);
    items.push(sub);

    const bodySize = Math.max(14, Math.min(20, Math.round(narrow * 0.034)));
    const body = scene.add
      .text(
        w / 2,
        h * 0.62,
        "All hostiles eliminated.\nYou are the drone master!",
        {
          fontFamily: "monospace",
          fontSize: `${bodySize}px`,
          color: "#cccccc",
          align: "center",
          lineSpacing: 4,
        },
      )
      .setOrigin(0.5)
      .setDepth(601);
    items.push(body);

    // --- Restart Mission button ---
    const isLandscape = w > h;
    const bottomSafe = isLandscape ? Math.max(Math.round(h * 0.14), 50) : 28;
    const btnW = Math.min(w * 0.75, 360);
    const btnH = Math.max(50, Math.min(74, Math.round(narrow * 0.11)));
    const btnY = h - bottomSafe - btnH / 2 - 5;
    const btn = scene.add
      .rectangle(w / 2, btnY, btnW, btnH, 0x226a2a, 0.9)
      .setStrokeStyle(3, 0xffffff, 0.9)
      .setDepth(601)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        scene.sound.stopAll();
        scene.scale.off("resize", build);
        // Full page reload — guarantees a clean game state (every scene,
        // every RNG, every texture, every audio element). This is critical
        // once set-piece positions become randomized; a scene-only restart
        // wouldn't re-seed / re-launch all sibling scenes cleanly.
        window.location.reload();
      });
    items.push(btn);

    const labelSize = Math.max(14, Math.min(22, Math.round(narrow * 0.04)));
    const btnLabel = scene.add
      .text(w / 2, btnY, "RESTART MISSION", {
        fontFamily: "monospace",
        fontSize: `${labelSize}px`,
        color: "#ffffff",
      })
      .setOrigin(0.5)
      .setDepth(602);
    items.push(btnLabel);

    scene.cameras.main.ignore(items);
    scene._victoryModalItems = items;
  };
  build();
  scene.scale.on("resize", build);
}

function formatElapsed(startMs, endMs) {
  if (!startMs || !endMs) return "--:--";
  const totalSec = Math.max(0, Math.floor((endMs - startMs) / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}
