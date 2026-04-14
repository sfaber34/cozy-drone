// Concert set piece.
//
// Factory pattern — multiple concerts can coexist. Call:
//   const concert = createConcert(scene, rng, { tileX, tileY });
//   scene.setPieces.push(concert);
//   // ... per frame:
//   concert.update(dt);
//
// The returned instance exposes:
//   { type, bounds, update(dt), destroy() }
// where `bounds` is a rectangle in world-space px used for dynamic no-go
// zones / spawn-avoidance. State is kept in closure variables so multiple
// instances don't collide on scene-level properties.
import Phaser from "phaser";
import {
  TILE, SCALE,
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

/**
 * Spawn a concert at the given tile coordinates.
 * @param {Phaser.Scene} scene
 * @param {Phaser.Math.RandomDataGenerator} rng
 * @param {{tileX: number, tileY: number}} opts
 * @returns {{type: string, bounds: {cx, cy, hw, hh}, update: (dt: number) => void, destroy: () => void}}
 */
export function createConcert(scene, rng, opts) {
  const { tileX, tileY } = opts;
  const cx = tileX * TILE * SCALE;
  const cy = tileY * TILE * SCALE;

  // --- Per-instance state (closure) ---
  const stageHalfW = CONCERT_STAGE_WIDTH_PX  / 2;
  const stageHalfH = CONCERT_STAGE_HEIGHT_PX / 2;
  const stage = {
    cx, cy,
    left:   cx - stageHalfW,
    right:  cx + stageHalfW,
    top:    cy - stageHalfH,
    bottom: cy + stageHalfH,
  };
  const crowdHalfW = CONCERT_CROWD_WIDTH_PX  / 2;
  const crowdTop = stage.bottom + CONCERT_CROWD_TOP_GAP_PX;
  const crowdArea = {
    cx,
    top:    crowdTop,
    bottom: crowdTop + CONCERT_CROWD_HEIGHT_PX,
    left:   cx - crowdHalfW,
    right:  cx + crowdHalfW,
  };

  const musicians = [];
  const crowd = [];
  const sprites = []; // static scenery (stage planks, speakers) for destroy()

  // --- Build scenery ---
  drawStage(scene, stage, sprites);

  // --- Musicians ---
  const usableW = CONCERT_STAGE_WIDTH_PX - 60;
  const step = usableW / (CONCERT_MUSICIAN_COUNT - 1);
  for (let i = 0; i < CONCERT_MUSICIAN_COUNT; i++) {
    const role = MUSICIAN_ROLES[i % MUSICIAN_ROLES.length];
    const px = stage.left + 30 + step * i;
    const py = stage.cy - 4;
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
    sprites.push(instrument);
    musicians.push({
      personEntry, sprite, skinId, role, instrument,
      noteTimer: Math.random() * (CONCERT_NOTE_INTERVAL_MIN + CONCERT_NOTE_INTERVAL_RANGE),
      poseTimer: 0, poseFrame: 0,
    });
  }

  // --- Crowd ---
  const placed = [];
  const minSq = CONCERT_CROWD_MIN_SPACING * CONCERT_CROWD_MIN_SPACING;
  for (let i = 0; i < CONCERT_CROWD_COUNT; i++) {
    let sx = 0, sy = 0;
    for (let tries = 0; tries < CONCERT_CROWD_SPAWN_MAX_TRIES; tries++) {
      sx = rng.between(crowdArea.left + 10, crowdArea.right - 10);
      sy = rng.between(crowdArea.top + 10, crowdArea.bottom - 10);
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

    crowd.push({
      personEntry, sprite, skinId,
      homeX: sx, homeY: sy,
      state: rng.pick(CROWD_STATES),
      stateTimer: CONCERT_STATE_SWITCH_MIN + Math.random() * CONCERT_STATE_SWITCH_RANGE,
      frameTimer: Math.random() * 500,
      frameIndex: 0,
      bobPhase: Math.random() * Math.PI * 2,
      walkTargetX: sx, walkTargetY: sy,
      walkFrameTimer: 0, walkFrame: 0,
      goingHome: false,
    });
  }

  // --- Instance API ---
  const instance = {
    type: "concert",
    bounds: {
      // Cover stage + crowd area for no-go / spawn-avoidance purposes
      cx,
      cy: (stage.top + crowdArea.bottom) / 2,
      hw: Math.max(stageHalfW, crowdHalfW),
      hh: (crowdArea.bottom - stage.top) / 2,
    },
    update(dt) {
      updateMusicians(scene, musicians, dt);
      updateCrowd(scene, crowdArea, crowd, dt);
    },
    destroy() {
      // Remove scenery sprites; managed people remain in scene.people (they
      // can still be killed/panicked). Full teardown of people is out of scope
      // here — add it when a set piece actually needs to disappear mid-game.
      for (const s of sprites) s.destroy();
    },
  };
  return instance;
}

// --- Scenery -----------------------------------------------------------------

function drawStage(scene, s, sprites) {
  const tile = 16 * SCALE;
  for (let ty = s.top; ty < s.bottom; ty += tile) {
    for (let tx = s.left; tx < s.right; tx += tile) {
      sprites.push(
        scene.add.image(tx + tile / 2, ty + tile / 2, "stage-plank")
          .setScale(SCALE).setDepth(1.3),
      );
    }
  }
  const lipTile = 16 * SCALE;
  const lipH = 4 * SCALE;
  for (let tx = s.left; tx < s.right; tx += lipTile) {
    sprites.push(
      scene.add.image(tx + lipTile / 2, s.bottom + lipH / 2, "stage-edge")
        .setScale(SCALE).setDepth(1.35),
    );
  }
  for (const corner of [[s.left + 12, s.top + 18], [s.right - 12, s.top + 18]]) {
    sprites.push(
      scene.add.image(corner[0], corner[1], "stage-speaker")
        .setScale(SCALE).setDepth(1.8),
    );
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

// --- Update loops ------------------------------------------------------------

function updateMusicians(scene, musicians, dt) {
  for (const m of musicians) {
    const pe = m.personEntry;
    if (pe.state !== "idle") continue;

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
}

function updateCrowd(scene, crowdArea, crowd, dt) {
  for (const c of crowd) {
    const pe = c.personEntry;
    if (pe.state !== "idle") continue;

    c.stateTimer -= dt;
    if (c.stateTimer <= 0) {
      if (c.state === "wandering" && !c.goingHome) {
        c.goingHome = true;
        c.walkTargetX = c.homeX;
        c.walkTargetY = c.homeY;
      } else if (c.state !== "wandering") {
        switchCrowdState(crowdArea, c);
      }
    }

    if (c.state === "dancing") {
      c.frameTimer -= dt * 1000;
      if (c.frameTimer <= 0) {
        c.frameTimer = CONCERT_DANCE_FRAME_INTERVAL;
        c.frameIndex = 1 - c.frameIndex;
        c.sprite.setTexture(
          c.frameIndex === 0 ? `person-wave1-${c.skinId}` : `person-wave2-${c.skinId}`,
        );
        c.sprite.setFlipX(!c.sprite.flipX);
      }
      c.bobPhase += dt * CONCERT_DANCE_BOB_HZ * Math.PI * 2;
      c.sprite.y = c.homeY + Math.sin(c.bobPhase) * CONCERT_DANCE_BOB_AMP;
      c.sprite.x = c.homeX;
    } else if (c.state === "cheering") {
      c.frameTimer -= dt * 1000;
      if (c.frameTimer <= 0) {
        c.frameTimer = CONCERT_CHEER_FRAME_INTERVAL;
        c.frameIndex = 1 - c.frameIndex;
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
          c.goingHome = false;
          c.sprite.x = c.homeX;
          c.sprite.y = c.homeY;
          switchCrowdState(crowdArea, c);
        } else {
          pickNewWanderTarget(crowdArea, c);
        }
      } else {
        const step = CONCERT_WANDER_SPEED * dt;
        c.sprite.x += (dx / dist) * step;
        c.sprite.y += (dy / dist) * step;
        c.sprite.setFlipX(dx < 0);
        c.walkFrameTimer += dt * 1000;
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

function pickNewWanderTarget(crowdArea, c) {
  const hop =
    CONCERT_WANDER_HOP_DIST_MIN + Math.random() * CONCERT_WANDER_HOP_DIST_RANGE;
  const ang = Math.random() * Math.PI * 2;
  c.walkTargetX = Phaser.Math.Clamp(
    c.sprite.x + Math.cos(ang) * hop,
    crowdArea.left + 10,
    crowdArea.right - 10,
  );
  c.walkTargetY = Phaser.Math.Clamp(
    c.sprite.y + Math.sin(ang) * hop,
    crowdArea.top + 10,
    crowdArea.bottom - 10,
  );
}

function switchCrowdState(crowdArea, c) {
  const choices = CROWD_STATES.filter((s) => s !== c.state);
  c.state = choices[Math.floor(Math.random() * choices.length)];
  c.stateTimer =
    CONCERT_STATE_SWITCH_MIN + Math.random() * CONCERT_STATE_SWITCH_RANGE;
  c.frameTimer = 0;
  c.frameIndex = 0;
  c.sprite.setFlipX(false);
  c.goingHome = false;
  if (c.state === "wandering") pickNewWanderTarget(crowdArea, c);
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
