import Phaser from "phaser";
import {
  TILE, SCALE,
  CONCERT_X, CONCERT_Y,
  CONCERT_STAGE_WIDTH_PX, CONCERT_STAGE_HEIGHT_PX,
  CONCERT_MUSICIAN_COUNT,
  CONCERT_CROWD_COUNT, CONCERT_CROWD_WIDTH_PX, CONCERT_CROWD_HEIGHT_PX,
  CONCERT_CROWD_TOP_GAP_PX,
  CONCERT_CROWD_MIN_SPACING, CONCERT_CROWD_SPAWN_MAX_TRIES,
  CONCERT_NOTE_INTERVAL_MIN, CONCERT_NOTE_INTERVAL_RANGE,
  CONCERT_NOTE_RISE_HEIGHT, CONCERT_NOTE_RISE_DURATION,
  CONCERT_STATE_SWITCH_MIN, CONCERT_STATE_SWITCH_RANGE,
  CONCERT_DANCE_FRAME_INTERVAL, CONCERT_DANCE_BOB_HZ, CONCERT_DANCE_BOB_AMP,
  CONCERT_CHEER_FRAME_INTERVAL,
  CONCERT_WANDER_SPEED, CONCERT_WANDER_HOP_DIST_MIN, CONCERT_WANDER_HOP_DIST_RANGE,
} from "../constants.js";
import { createManagedPerson } from "./managedPersonUtils.js";

const MUSICIAN_ROLES = ["singer", "guitar", "keyboard", "drums"];
const MUSICIAN_GREETINGS = {
  singer:    ["TESTING ONE\nTWO!", "Thank you\n!", "Hello sand!"],
  guitar:    ["RIFF TIME", "Shreddin'!", "Power chord!"],
  keyboard:  ["♪ feel it", "Moody.", "Solo inbound"],
  drums:     ["ONE-TWO-\nTHREE-FOUR", "BANG BANG", "Cymbal crash!"],
};
const NOTE_GLYPHS = ["♪", "♫", "♬", "♩"];
const NOTE_COLORS = ["#ffeb88", "#ffaacc", "#aaddff", "#ccffaa", "#ffffff"];

const CROWD_GREETINGS = [
  "BEST\nSHOW!!", "WOOO!!", "ENCORE!", "I love\nthis band!",
  "One more\nsong!", "Louder!", "MOSH!", "YEAH!", "Party!",
  "I know\nthis one!", "My favorite!", "Front row!",
];

const CROWD_STATES = ["dancing", "cheering", "wandering"];

export function createConcert(scene, rng) {
  const cx = CONCERT_X * TILE * SCALE;
  const cy = CONCERT_Y * TILE * SCALE;

  const stageHalfW = CONCERT_STAGE_WIDTH_PX  / 2;
  const stageHalfH = CONCERT_STAGE_HEIGHT_PX / 2;
  const stage = {
    cx, cy,
    left:   cx - stageHalfW,
    right:  cx + stageHalfW,
    top:    cy - stageHalfH,
    bottom: cy + stageHalfH,
  };

  drawStage(scene, stage);

  const crowdHalfW = CONCERT_CROWD_WIDTH_PX  / 2;
  const crowdTop = stage.bottom + CONCERT_CROWD_TOP_GAP_PX;
  const crowd = {
    cx,
    top:    crowdTop,
    bottom: crowdTop + CONCERT_CROWD_HEIGHT_PX,
    left:   cx - crowdHalfW,
    right:  cx + crowdHalfW,
  };
  scene.concertStage = stage;
  scene.concertCrowdArea = crowd;

  scene.concertMusicians = [];
  scene.concertCrowd = [];

  spawnMusicians(scene, rng, stage);
  spawnCrowd(scene, rng, crowd);
}

function drawStage(scene, s) {
  const tile = 16 * SCALE;
  // Plank surface — tile across stage footprint
  for (let ty = s.top; ty < s.bottom; ty += tile) {
    for (let tx = s.left; tx < s.right; tx += tile) {
      scene.add.image(tx + tile / 2, ty + tile / 2, "stage-plank")
        .setScale(SCALE).setDepth(1.3);
    }
  }
  // Front lip along the bottom edge of the stage
  const lipTile = 16 * SCALE;
  const lipH = 4 * SCALE;
  for (let tx = s.left; tx < s.right; tx += lipTile) {
    scene.add.image(tx + lipTile / 2, s.bottom + lipH / 2, "stage-edge")
      .setScale(SCALE).setDepth(1.35);
  }
  // Speakers at corners
  for (const corner of [[s.left + 12, s.top + 18], [s.right - 12, s.top + 18]]) {
    scene.add.image(corner[0], corner[1], "stage-speaker")
      .setScale(SCALE).setDepth(1.8);
  }
}

function spawnMusicians(scene, rng, s) {
  const usableW = CONCERT_STAGE_WIDTH_PX - 60; // leave room for speakers
  const step = usableW / (CONCERT_MUSICIAN_COUNT - 1);
  for (let i = 0; i < CONCERT_MUSICIAN_COUNT; i++) {
    const role = MUSICIAN_ROLES[i % MUSICIAN_ROLES.length];
    const px = s.left + 30 + step * i;
    const py = s.cy - 4; // stand slightly upstage
    const skinId = rng.between(0, 199);
    const greeting = rng.pick(MUSICIAN_GREETINGS[role]);

    const { sprite, personEntry } = createManagedPerson(scene, {
      x: px, y: py, skinId,
      texture: `person-wave1-${skinId}`,
      greeting,
      depth: 2.4,
      event: "concert",
      flagKey: "isConcertMusician",
    });

    const instrument = makeInstrument(scene, role, px, py);

    scene.concertMusicians.push({
      personEntry,
      sprite,
      skinId,
      role,
      instrument,
      noteTimer:
        Math.random() * (CONCERT_NOTE_INTERVAL_MIN + CONCERT_NOTE_INTERVAL_RANGE),
      poseTimer: 0,
      poseFrame: 0,
    });
  }
}

function makeInstrument(scene, role, px, py) {
  let tex, offsetX = 0, offsetY = 6, depth = 2.5;
  if (role === "singer")    { tex = "instr-mic";       offsetX = 0;  offsetY = 2; }
  if (role === "guitar")    { tex = "instr-guitar";    offsetX = 4;  offsetY = 5; }
  if (role === "keyboard")  { tex = "instr-keyboard";  offsetX = 0;  offsetY = 10; }
  if (role === "drums")     { tex = "instr-drums";     offsetX = 0;  offsetY = 12; }
  return scene.add.image(px + offsetX, py + offsetY, tex)
    .setScale(SCALE).setDepth(depth);
}

function spawnCrowd(scene, rng, crowd) {
  const placed = [];
  const minSq = CONCERT_CROWD_MIN_SPACING * CONCERT_CROWD_MIN_SPACING;
  for (let i = 0; i < CONCERT_CROWD_COUNT; i++) {
    let sx = 0, sy = 0;
    for (let tries = 0; tries < CONCERT_CROWD_SPAWN_MAX_TRIES; tries++) {
      sx = rng.between(crowd.left + 10, crowd.right - 10);
      sy = rng.between(crowd.top + 10, crowd.bottom - 10);
      let ok = true;
      for (const p of placed) {
        const dx = sx - p.x, dy = sy - p.y;
        if (dx * dx + dy * dy < minSq) { ok = false; break; }
      }
      if (ok) break;
    }
    placed.push({ x: sx, y: sy });

    const skinId = rng.between(0, 199);
    const { sprite, personEntry } = createManagedPerson(scene, {
      x: sx, y: sy, skinId,
      greeting: rng.pick(CROWD_GREETINGS),
      depth: 2,
      event: "concert",
      flagKey: "isConcertAudience",
    });

    scene.concertCrowd.push({
      personEntry,
      sprite,
      skinId,
      homeX: sx,
      homeY: sy,
      state: rng.pick(CROWD_STATES),
      stateTimer:
        CONCERT_STATE_SWITCH_MIN + Math.random() * CONCERT_STATE_SWITCH_RANGE,
      frameTimer: Math.random() * 500,
      frameIndex: 0,
      bobPhase: Math.random() * Math.PI * 2,
      walkTargetX: sx,
      walkTargetY: sy,
      walkFrameTimer: 0,
      walkFrame: 0,
    });
  }
}

export function updateConcert(scene, dt) {
  if (!scene.concertMusicians) return;

  // --- Musicians: gentle arm pump + music notes ---
  for (const m of scene.concertMusicians) {
    const pe = m.personEntry;
    if (pe.state !== "idle") continue;

    // Toggle between wave1 and wave2 for a "playing" bob
    m.poseTimer -= dt * 1000;
    if (m.poseTimer <= 0) {
      m.poseTimer = 240 + Math.random() * 160;
      m.poseFrame = 1 - m.poseFrame;
      m.sprite.setTexture(
        m.poseFrame === 0 ? `person-wave1-${m.skinId}` : `person-wave2-${m.skinId}`,
      );
    }

    m.noteTimer -= dt * 1000;
    if (m.noteTimer <= 0) {
      m.noteTimer =
        CONCERT_NOTE_INTERVAL_MIN + Math.random() * CONCERT_NOTE_INTERVAL_RANGE;
      spawnNote(scene, m.sprite.x, m.sprite.y - 10);
    }
  }

  // --- Crowd: dance / cheer / wander ---
  const worldDt = dt;
  for (const c of scene.concertCrowd) {
    const pe = c.personEntry;
    if (pe.state !== "idle") continue;

    c.stateTimer -= worldDt;
    if (c.stateTimer <= 0) {
      if (c.state === "wandering" && !c.goingHome) {
        // Don't teleport — walk back to home first, then switch state on arrival
        c.goingHome = true;
        c.walkTargetX = c.homeX;
        c.walkTargetY = c.homeY;
      } else if (c.state !== "wandering") {
        switchCrowdState(scene, c);
      }
      // While wandering & already heading home, just let the walk finish
    }

    if (c.state === "dancing") {
      c.frameTimer -= worldDt * 1000;
      if (c.frameTimer <= 0) {
        c.frameTimer = CONCERT_DANCE_FRAME_INTERVAL;
        c.frameIndex = 1 - c.frameIndex;
        c.sprite.setTexture(
          c.frameIndex === 0 ? `person-wave1-${c.skinId}` : `person-wave2-${c.skinId}`,
        );
        c.sprite.setFlipX(!c.sprite.flipX);
      }
      c.bobPhase += worldDt * CONCERT_DANCE_BOB_HZ * Math.PI * 2;
      c.sprite.y = c.homeY + Math.sin(c.bobPhase) * CONCERT_DANCE_BOB_AMP;
      c.sprite.x = c.homeX;
    } else if (c.state === "cheering") {
      c.frameTimer -= worldDt * 1000;
      if (c.frameTimer <= 0) {
        c.frameTimer = CONCERT_CHEER_FRAME_INTERVAL;
        c.frameIndex = 1 - c.frameIndex;
        // Cheer = arms up (wave2) then briefly stand (arms reset) — looks like a pump
        c.sprite.setTexture(
          c.frameIndex === 0 ? `person-wave2-${c.skinId}` : `person-stand-${c.skinId}`,
        );
      }
      c.sprite.x = c.homeX;
      c.sprite.y = c.homeY;
    } else {
      // wandering
      const dx = c.walkTargetX - c.sprite.x;
      const dy = c.walkTargetY - c.sprite.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 3) {
        if (c.goingHome) {
          // Reached home — now safe to switch to dance/cheer (no teleport)
          c.goingHome = false;
          c.sprite.x = c.homeX;
          c.sprite.y = c.homeY;
          switchCrowdState(scene, c);
        } else {
          pickNewWanderTarget(scene, c);
        }
      } else {
        const step = CONCERT_WANDER_SPEED * worldDt;
        c.sprite.x += (dx / dist) * step;
        c.sprite.y += (dy / dist) * step;
        c.sprite.setFlipX(dx < 0);
        c.walkFrameTimer += worldDt * 1000;
        if (c.walkFrameTimer >= 180) {
          c.walkFrameTimer = 0;
          c.walkFrame = 1 - c.walkFrame;
          c.sprite.setTexture(
            c.walkFrame === 0 ? `person-run1-${c.skinId}` : `person-run2-${c.skinId}`,
          );
        }
      }
    }
  }
}

function pickNewWanderTarget(scene, c) {
  const hop =
    CONCERT_WANDER_HOP_DIST_MIN + Math.random() * CONCERT_WANDER_HOP_DIST_RANGE;
  const ang = Math.random() * Math.PI * 2;
  c.walkTargetX = Phaser.Math.Clamp(
    c.sprite.x + Math.cos(ang) * hop,
    scene.concertCrowdArea.left + 10,
    scene.concertCrowdArea.right - 10,
  );
  c.walkTargetY = Phaser.Math.Clamp(
    c.sprite.y + Math.sin(ang) * hop,
    scene.concertCrowdArea.top + 10,
    scene.concertCrowdArea.bottom - 10,
  );
}

function switchCrowdState(scene, c) {
  const choices = CROWD_STATES.filter((s) => s !== c.state);
  c.state = choices[Math.floor(Math.random() * choices.length)];
  c.stateTimer =
    CONCERT_STATE_SWITCH_MIN + Math.random() * CONCERT_STATE_SWITCH_RANGE;
  c.frameTimer = 0;
  c.frameIndex = 0;
  c.sprite.setFlipX(false);
  c.goingHome = false;
  if (c.state === "wandering") pickNewWanderTarget(scene, c);
}

function spawnNote(scene, x, y) {
  const glyph = NOTE_GLYPHS[Math.floor(Math.random() * NOTE_GLYPHS.length)];
  const color = NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)];
  const note = scene.add.text(x, y, glyph, {
    fontFamily: "sans-serif",
    fontSize: "18px",
    color,
    stroke: "#000",
    strokeThickness: 2,
  }).setOrigin(0.5).setDepth(5);
  scene.hudCam.ignore(note);

  // Drift sideways slightly for variety
  const driftX = (Math.random() - 0.5) * 16;
  scene.tweens.add({
    targets: note,
    y: y - CONCERT_NOTE_RISE_HEIGHT,
    x: x + driftX,
    alpha: 0,
    duration: CONCERT_NOTE_RISE_DURATION,
    ease: "Sine.easeOut",
    onComplete: () => note.destroy(),
  });
}
