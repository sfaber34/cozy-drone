import Phaser from "phaser";
import {
  TILE, SCALE,
  FARM_FIELD_X, FARM_FIELD_Y,
  FARM_FIELD_WIDTH_PX, FARM_FIELD_HEIGHT_PX,
  FARM_FIELD_TRACTOR_COUNT,
  FARM_FIELD_TRACTOR_SPEED,
  FARM_FIELD_TRACTOR_ROWS_PER_STRIP,
  FARM_FIELD_TRACTOR_TURN_DURATION,
  FARM_FIELD_TRACTOR_TURN_ARC,
  FARM_FIELD_TRACTOR_DUST_INTERVAL,
  FARM_FIELD_TRACTOR_DUST_DURATION,
  FARM_FIELD_TRACTOR_DUST_OPACITY,
  FARM_FIELD_TRACTOR_DUST_OPACITY_JITTER,
  FARM_FIELD_REMOUNT_DIST,
  FARM_FIELD_PICKER_COUNT,
  FARM_FIELD_PICKER_WALK_SPEED,
  FARM_FIELD_PICKER_PICK_DURATION_MIN,
  FARM_FIELD_PICKER_PICK_DURATION_RANGE,
  FARM_FIELD_PICKER_HOP_DIST_MIN,
  FARM_FIELD_PICKER_HOP_DIST_RANGE,
  FARM_FIELD_ANIMAL_PIGS,
  FARM_FIELD_ANIMAL_CHICKENS,
  FARM_FIELD_ANIMAL_CAMELS,
  FARM_FIELD_ANIMAL_SHEEP,
} from "../constants.js";

const TRACTOR_GREETINGS = [
  "Full harvest\ntoday!", "Yield's good.", "Back to work.",
  "Seed's\nexpensive.", "Vroom vroom.", "Dust again...",
];
const PICKER_GREETINGS = [
  "Picking all\nday.", "Back hurts.", "Good crop\nthis year.",
  "Pass the\nwater.", "So hot.", "Almost done.",
  "Basket's\nfull!", "Yalla!",
];

export function createFarmField(scene, rng) {
  const cx = FARM_FIELD_X * TILE * SCALE;
  const cy = FARM_FIELD_Y * TILE * SCALE;
  const halfW = FARM_FIELD_WIDTH_PX / 2;
  const halfH = FARM_FIELD_HEIGHT_PX / 2;

  scene.farmField = {
    cx, cy, halfW, halfH,
    left:   cx - halfW,
    right:  cx + halfW,
    top:    cy - halfH,
    bottom: cy + halfH,
  };

  drawFieldTiles(scene, rng, scene.farmField);

  scene.farmTractors = [];
  scene.farmPickers  = [];

  spawnTractors(scene, rng, scene.farmField);
  spawnPickers(scene, rng, scene.farmField);
  spawnFarmAnimals(scene, rng, scene.farmField);
}

function drawFieldTiles(scene, rng, f) {
  const tileSize = 16 * SCALE;
  for (let ty = f.top; ty < f.bottom; ty += tileSize) {
    for (let tx = f.left; tx < f.right; tx += tileSize) {
      const frame = rng.between(0, 3);
      scene.add
        .image(tx + tileSize / 2, ty + tileSize / 2, "crop-tiles", frame)
        .setScale(SCALE).setDepth(1.2);
    }
  }
}

function spawnTractors(scene, rng, f) {
  const stripW = (f.right - f.left) / FARM_FIELD_TRACTOR_COUNT;
  const rowsPerStrip = FARM_FIELD_TRACTOR_ROWS_PER_STRIP;
  // Rows are evenly spaced inside the strip, with padding so a wheel doesn't
  // clip into the neighbor's strip.
  const rowMargin = stripW * 0.1;
  const rowSpan = stripW - 2 * rowMargin;
  const rowStep = rowsPerStrip > 1 ? rowSpan / (rowsPerStrip - 1) : 0;

  for (let i = 0; i < FARM_FIELD_TRACTOR_COUNT; i++) {
    const stripLeft = f.left + stripW * i;
    const startRow = rng.between(0, rowsPerStrip - 1);
    const rowX = stripLeft + rowMargin + startRow * rowStep;
    const startY = rng.pick([f.top + 30, f.bottom - 30]);
    const direction = startY > f.cy ? -1 : 1; // head toward the far end

    const sprite = scene.add.image(rowX, startY, "tractor")
      .setScale(SCALE).setDepth(2);
    sprite.setAngle(direction === 1 ? 180 : 0);

    const skinId = rng.between(0, 199);
    const driverSprite = scene.add.image(rowX, startY - 2, `person-stand-${skinId}`)
      .setScale(SCALE).setDepth(2.5);

    const driverEntry = {
      sprite: driverSprite,
      skinId,
      state: "idle",
      greeting: rng.pick(TRACTOR_GREETINGS),
      noGreet: true,
      scatterPanic: true,
      returnHome: { x: rowX, y: startY, event: "farmField" },
      bubble: null,
      waveTimer: 0, waveFrame: 0,
      runAngle: 0, runTimer: 0, runFrame: 0,
      wanderTimer: 0, wanderDuration: 999, wanderAngle: null,
      hideTarget: null,
      homeX: rowX, homeY: startY,
      carriedGoods: null,
      isFarmTractorDriver: true,
      managedBySetPiece: true,
    };
    scene.people.push(driverEntry);

    scene.farmTractors.push({
      sprite,
      driver: driverEntry,
      driving: true,
      stripLeft,
      stripRight: stripLeft + stripW,
      rowMargin,
      rowStep,
      rowCount: rowsPerStrip,
      rowIndex: startRow,
      rowDir: Math.random() < 0.5 ? -1 : 1, // next-row step direction
      fieldTop: f.top + 30,
      fieldBottom: f.bottom - 30,
      direction, // +1 moving south, -1 moving north
      phase: "straight", // "straight" | "turning"
      turnT: 0,
      turnFromX: 0, turnToX: 0,
      turnEdgeY: 0,
      turnExitDir: direction,
      dustTimer: Math.random() * FARM_FIELD_TRACTOR_DUST_INTERVAL,
    });
  }
}

function spawnPickers(scene, rng, f) {
  for (let i = 0; i < FARM_FIELD_PICKER_COUNT; i++) {
    const sx = rng.between(f.left + 24, f.right - 24);
    const sy = rng.between(f.top + 24, f.bottom - 24);
    const skinId = rng.between(0, 199);
    const sprite = scene.add.image(sx, sy, `person-stand-${skinId}`)
      .setScale(SCALE).setDepth(2);
    const basket = scene.add.image(sx - 6, sy + 2, "picker-basket")
      .setScale(SCALE).setDepth(2.6);

    const pe = {
      sprite,
      skinId,
      state: "idle",
      greeting: rng.pick(PICKER_GREETINGS),
      noGreet: true,
      scatterPanic: true,
      returnHome: { x: sx, y: sy, event: "farmField" },
      bubble: null,
      waveTimer: 0, waveFrame: 0,
      runAngle: 0, runTimer: 0, runFrame: 0,
      wanderTimer: 0, wanderDuration: 999, wanderAngle: null,
      hideTarget: null,
      homeX: sx, homeY: sy,
      carriedGoods: basket,
      isFarmPicker: true,
      managedBySetPiece: true,
    };
    scene.people.push(pe);

    const stalk = scene.add.image(sx + 6, sy - 4, "wheat-stalk")
      .setScale(SCALE * 0.8).setDepth(2.7).setVisible(false);

    const picker = {
      personEntry: pe,
      sprite,
      skinId,
      basket,
      stalk,
      task: "picking", // start picking on the spot they spawned on
      pickTimer: Math.random() * (FARM_FIELD_PICKER_PICK_DURATION_MIN + FARM_FIELD_PICKER_PICK_DURATION_RANGE),
      pickTotal: FARM_FIELD_PICKER_PICK_DURATION_MIN + Math.random() * FARM_FIELD_PICKER_PICK_DURATION_RANGE,
      walkFrame: 0,
      walkTimer: 0,
      targetX: sx,
      targetY: sy,
    };
    scene.farmPickers.push(picker);
  }
}

function spawnFarmAnimals(scene, rng, f) {
  const corral = { x: f.cx, y: f.cy, hw: f.halfW - 20, hh: f.halfH - 20 };
  const spawn = (type, count) => {
    for (let i = 0; i < count; i++) {
      const ax = rng.between(f.left + 24, f.right - 24);
      const ay = rng.between(f.top + 24, f.bottom - 24);
      const sprite = scene.add.image(ax, ay, type).setScale(SCALE).setDepth(2);
      scene.animals.push({
        sprite, type, state: "idle",
        corral,
        wanderAngle: Math.random() * Math.PI * 2,
        wanderTimer: 0, wanderDuration: 1 + Math.random() * 3,
        moving: Math.random() > 0.5,
        runAngle: 0, panicTimer: 0,
      });
    }
  };
  spawn("pig",     FARM_FIELD_ANIMAL_PIGS);
  spawn("chicken", FARM_FIELD_ANIMAL_CHICKENS);
  spawn("camel",   FARM_FIELD_ANIMAL_CAMELS);
  spawn("goat",    FARM_FIELD_ANIMAL_SHEEP); // goat stands in for sheep
}

export function updateFarmField(scene, dt) {
  if (!scene.farmTractors) return;

  for (const t of scene.farmTractors) updateTractor(scene, t, dt);
  for (const p of scene.farmPickers)  updatePicker (scene, p, dt);
}

// --- Tractor -----------------------------------------------------------------

function updateTractor(scene, t, dt) {
  const d = t.driver;

  if (!t.driving) {
    // Parked; driver may be panicking or walking back
    if (d.state === "idle") {
      const dx = d.sprite.x - t.sprite.x;
      const dy = d.sprite.y - t.sprite.y;
      if (dx * dx + dy * dy < FARM_FIELD_REMOUNT_DIST * FARM_FIELD_REMOUNT_DIST) {
        t.driving = true;
        d.sprite.x = t.sprite.x;
        d.sprite.y = t.sprite.y - 2;
      }
    }
    return;
  }

  if (t.phase === "straight") {
    // Drive straight along the current row
    t.sprite.y += t.direction * FARM_FIELD_TRACTOR_SPEED * dt;
    t.sprite.setAngle(t.direction === 1 ? 180 : 0);

    // Reached the end of the strip — begin U-turn to next row
    if (t.direction === 1 && t.sprite.y >= t.fieldBottom) {
      beginTurn(t, t.fieldBottom);
    } else if (t.direction === -1 && t.sprite.y <= t.fieldTop) {
      beginTurn(t, t.fieldTop);
    }
    spawnDust(scene, t, dt);
  } else {
    // "turning" — lerp X across to the next row, arc out from the edge
    t.turnT += dt / FARM_FIELD_TRACTOR_TURN_DURATION;
    const tt = Math.min(1, t.turnT);
    // Smooth the X lerp with an ease-in-out
    const ex = tt < 0.5 ? 2 * tt * tt : 1 - Math.pow(-2 * tt + 2, 2) / 2;
    t.sprite.x = t.turnFromX + (t.turnToX - t.turnFromX) * ex;
    // Arc bulge outward (past the edge, then back in)
    const arc = Math.sin(Math.PI * tt) * FARM_FIELD_TRACTOR_TURN_ARC;
    const outward = t.turnEdgeY === t.fieldBottom ? 1 : -1;
    t.sprite.y = t.turnEdgeY + outward * arc;
    // Rotate smoothly from entry angle to exit angle
    const fromAngle = t.turnExitDir === 1 ? 0   : 180; // angle we had coming in = opposite of exit
    const toAngle   = t.turnExitDir === 1 ? 180 : 0;
    // Sweep the short way (+180)
    const sweep = t.turnExitDir === 1 ? 180 : -180;
    t.sprite.setAngle(fromAngle + sweep * tt);

    if (tt >= 1) {
      // Finish turn; drop to straight phase in the new direction
      t.phase = "straight";
      t.sprite.x = t.turnToX;
      t.sprite.y = t.turnEdgeY;
      t.direction = t.turnExitDir;
      t.sprite.setAngle(t.direction === 1 ? 180 : 0);
    }
  }

  // Driver rides along
  d.sprite.x = t.sprite.x;
  d.sprite.y = t.sprite.y - 2;
  d.sprite.setDepth(2.5);
  d.returnHome.x = t.sprite.x;
  d.returnHome.y = t.sprite.y;
  d.homeX = t.sprite.x;
  d.homeY = t.sprite.y;

  if (d.state === "panicking") {
    t.driving = false;
  }
}

function beginTurn(t, edgeY) {
  // Advance to the next row; bounce rowDir at strip edges
  let nextIndex = t.rowIndex + t.rowDir;
  if (nextIndex < 0 || nextIndex >= t.rowCount) {
    t.rowDir = -t.rowDir;
    nextIndex = t.rowIndex + t.rowDir;
  }
  t.rowIndex = nextIndex;

  t.phase = "turning";
  t.turnT = 0;
  t.turnFromX = t.sprite.x;
  t.turnToX = t.stripLeft + t.rowMargin + t.rowIndex * t.rowStep;
  t.turnEdgeY = edgeY;
  t.turnExitDir = -t.direction;
}

function spawnDust(scene, t, dt) {
  t.dustTimer -= dt * 1000;
  if (t.dustTimer > 0) return;
  t.dustTimer = FARM_FIELD_TRACTOR_DUST_INTERVAL * (0.75 + Math.random() * 0.5);

  // Rear of tractor = opposite of travel direction. At angle 0 (facing up),
  // rear is below (+y). At angle 180, rear is above (-y).
  const rearOffset = t.direction === 1 ? -10 : 10; // tractor's tail in world y
  const px = t.sprite.x + Phaser.Math.Between(-5, 5);
  const py = t.sprite.y + rearOffset + Phaser.Math.Between(-3, 3);

  const puff = scene.add.image(px, py, "smoke")
    .setScale(SCALE * (0.4 + Math.random() * 0.2))
    .setDepth(1.9)
    .setAlpha(FARM_FIELD_TRACTOR_DUST_OPACITY + Math.random() * FARM_FIELD_TRACTOR_DUST_OPACITY_JITTER)
    .setTint(0xc9a872);
  scene.hudCam.ignore(puff);

  scene.tweens.add({
    targets: puff,
    alpha: 0,
    scale: SCALE * (0.8 + Math.random() * 0.4),
    x: px + Phaser.Math.Between(-8, 8),
    y: py + (t.direction === 1 ? -6 : 6) + Phaser.Math.Between(-4, 4),
    duration: FARM_FIELD_TRACTOR_DUST_DURATION + Math.random() * 200,
    onComplete: () => puff.destroy(),
  });
}

// --- Pickers -----------------------------------------------------------------

function updatePicker(scene, p, dt) {
  const pe = p.personEntry;

  // Hide stalk / pause tasks during panic & returning
  if (pe.state !== "idle") {
    if (p.stalk.visible) p.stalk.setVisible(false);
    // Still park the basket at the picker
    if (p.basket) p.basket.setPosition(pe.sprite.x - 6, pe.sprite.y + 2);
    return;
  }

  if (p.task === "walking") {
    walkPicker(p, dt);
  } else {
    pickPicker(p, dt);
  }

  // Basket always follows on the picker's left hip
  if (p.basket) p.basket.setPosition(pe.sprite.x - 6, pe.sprite.y + 2);
}

function walkPicker(p, dt) {
  const pe = p.personEntry;
  const dx = p.targetX - pe.sprite.x;
  const dy = p.targetY - pe.sprite.y;
  const dist = Math.hypot(dx, dy);

  if (dist < 3) {
    // Arrived — begin picking
    p.task = "picking";
    p.pickTotal =
      FARM_FIELD_PICKER_PICK_DURATION_MIN +
      Math.random() * FARM_FIELD_PICKER_PICK_DURATION_RANGE;
    p.pickTimer = p.pickTotal;
    p.stalk.setVisible(false);
    pe.sprite.setTexture(`person-stand-${p.skinId}`);
    return;
  }

  const step = FARM_FIELD_PICKER_WALK_SPEED * dt;
  pe.sprite.x += (dx / dist) * step;
  pe.sprite.y += (dy / dist) * step;

  // Face the direction of travel
  pe.sprite.setFlipX(dx < 0);

  // Run-frame anim
  p.walkTimer += dt * 1000;
  if (p.walkTimer >= 180) {
    p.walkTimer = 0;
    p.walkFrame = 1 - p.walkFrame;
    pe.sprite.setTexture(
      p.walkFrame === 0 ? `person-run1-${p.skinId}` : `person-run2-${p.skinId}`,
    );
  }

  // Stalk is not held while walking — it's been deposited in the basket
  p.stalk.setVisible(false);
}

function pickPicker(p, dt) {
  const pe = p.personEntry;
  p.pickTimer -= dt;

  // Pick-animation cycle: 3 phases across p.pickTotal
  // 0 → 1/3: reach down (wave1 with stalk low)
  // 1/3 → 2/3: lift up (wave2 with stalk high)
  // 2/3 → end: deposit (stand, stalk gone)
  const elapsed = p.pickTotal - p.pickTimer;
  const phase = elapsed / p.pickTotal;

  if (phase < 1 / 3) {
    pe.sprite.setTexture(`person-wave1-${p.skinId}`);
    p.stalk.setVisible(true);
    p.stalk.setPosition(pe.sprite.x + 8, pe.sprite.y + 3);
  } else if (phase < 2 / 3) {
    pe.sprite.setTexture(`person-wave2-${p.skinId}`);
    p.stalk.setVisible(true);
    // Lerp stalk upward toward the hand
    const subT = (phase - 1 / 3) / (1 / 3);
    p.stalk.setPosition(pe.sprite.x + 8, pe.sprite.y + 3 - subT * 10);
  } else {
    pe.sprite.setTexture(`person-stand-${p.skinId}`);
    // Drop the stalk "into" the basket (left hip)
    p.stalk.setVisible(true);
    const subT = (phase - 2 / 3) / (1 / 3);
    const dropX = pe.sprite.x + (8 - subT * 14);
    const dropY = pe.sprite.y - 7 + subT * 9;
    p.stalk.setPosition(dropX, dropY);
    if (subT > 0.92) p.stalk.setVisible(false);
  }

  if (p.pickTimer <= 0) {
    // Move on to a new spot within the field
    const f = p.personEntry && p.personEntry.sprite ? null : null; // keep lint calm
    const field = p.basket.scene.farmField;
    const hop =
      FARM_FIELD_PICKER_HOP_DIST_MIN + Math.random() * FARM_FIELD_PICKER_HOP_DIST_RANGE;
    const angle = Math.random() * Math.PI * 2;
    let nx = pe.sprite.x + Math.cos(angle) * hop;
    let ny = pe.sprite.y + Math.sin(angle) * hop;
    // Clamp to field bounds
    nx = Phaser.Math.Clamp(nx, field.left + 24, field.right - 24);
    ny = Phaser.Math.Clamp(ny, field.top + 24, field.bottom - 24);
    p.targetX = nx;
    p.targetY = ny;
    p.task = "walking";
    p.walkFrame = 0;
    p.walkTimer = 0;
    p.stalk.setVisible(false);
  }
}
