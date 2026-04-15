// Farm compound set piece.
//
// Factory pattern — call:
//   const farm = createFarmCompound(scene, rng, { tileX, tileY });
//   scene.setPieces.push(farm);
//
// Builds farmhouse + barn + silos + huts + corrals + hay + perimeter
// fencing, plus three ongoing activities inside the fence:
//   - a laundry person cycling clothes between a line and a basket
//   - a handful of invulnerable mice being chased by people with sticks
//   - chore people (a hole-digger and a corral-feeder)
import Phaser from "phaser";
import {
  TILE, SCALE,
  FARM_COMPOUND_HEIGHT_FACTOR,
  FARM_COMPOUND_LAUNDRY_ITEMS,
  FARM_COMPOUND_LAUNDRY_WALK_SPEED,
  FARM_COMPOUND_LAUNDRY_GRAB_MS,
  FARM_COMPOUND_LAUNDRY_PLACE_MS,
  FARM_COMPOUND_MICE_COUNT,
  FARM_COMPOUND_MOUSE_SPEED,
  FARM_COMPOUND_MOUSE_TURN_MIN_MS,
  FARM_COMPOUND_MOUSE_TURN_RANGE_MS,
  FARM_COMPOUND_CHASER_COUNT,
  FARM_COMPOUND_CHASER_SPEED,
  FARM_COMPOUND_CHASER_SWING_RANGE,
  FARM_COMPOUND_CHASER_SWING_INTERVAL,
  FARM_COMPOUND_CHASER_SWING_POSE_MS,
  FARM_COMPOUND_DIG_CYCLE_MS,
  FARM_COMPOUND_DIG_POSE_MS,
  FARM_COMPOUND_FEED_INTERVAL_MS,
  FARM_COMPOUND_FEED_POSE_MS,
  FARM_COMPOUND_FEED_PELLET_COUNT,
  FARM_COMPOUND_FEED_PELLET_DURATION,
} from "../constants.js";
import { createManagedPerson } from "./managedPersonUtils.js";
import { steerAroundBuildings, isInsideBuilding } from "./buildingSystem.js";

// Shirt tints for variety on the clothesline
const LAUNDRY_TINTS = [0xff6666, 0x66aaff, 0xffcc66, 0x77cc88, 0xcc77cc, 0xffffff];

/**
 * @param {Phaser.Scene} scene
 * @param {Phaser.Math.RandomDataGenerator} rng
 * @param {{tileX: number, tileY: number}} opts
 */
export function createFarmCompound(scene, rng, opts) {
  const { tileX, tileY } = opts;
  const farmX = tileX * TILE * SCALE;
  const farmY = tileY * TILE * SCALE;
  const fenceLen = TILE * SCALE;
  const hf = FARM_COMPOUND_HEIGHT_FACTOR;

  const sprites = []; // owned scenery/props so we can tear down in destroy()

  // --- Buildings (unchanged) ---
  scene._addBuilding(farmX, farmY, "house", "small", 0xddccaa);
  scene._addBuilding(farmX + 250, farmY - 20, "barn", "medium");
  scene._addBuilding(farmX + 380, farmY - 60, "silo", "small");
  scene._addBuilding(farmX + 420, farmY - 30, "silo", "small");
  scene._addBuilding(farmX + 400, farmY + 20, "silo", "small");
  scene._addBuilding(farmX - 150, farmY + 100, "hut", "small");
  scene._addBuilding(farmX + 80, farmY + 140, "hut", "small");
  scene._addBuilding(farmX - 80, farmY - 120, "hut", "small");

  // --- Inner corral (for the fenced yard) ---
  sprites.push(
    scene.add
      .image(farmX + 150, farmY + 150, "corral")
      .setScale(SCALE)
      .setDepth(1.5),
  );

  // --- Hay bale piles ---
  const hayPositions = [
    { x: farmX + 300, y: farmY + 80 },
    { x: farmX + 320, y: farmY + 100 },
    { x: farmX + 290, y: farmY + 110 },
    { x: farmX - 200, y: farmY - 40 },
    { x: farmX - 180, y: farmY - 20 },
    { x: farmX + 50, y: farmY - 80 },
    { x: farmX + 70, y: farmY - 70 },
    { x: farmX + 60, y: farmY - 60 },
  ];
  for (const hp of hayPositions) {
    sprites.push(
      scene.add.image(hp.x, hp.y, "hay").setScale(SCALE).setDepth(2),
    );
  }

  // --- Livestock corrals (pig / chicken / camel / goat) ---
  const corralDefs = [
    { cx: farmX - 400, cy: farmY - 100, animal: "pig",     count: 6 },
    { cx: farmX - 400, cy: farmY + 120, animal: "chicken", count: 10 },
    { cx: farmX + 550, cy: farmY - 100, animal: "camel",   count: 4 },
    { cx: farmX + 550, cy: farmY + 120, animal: "goat",    count: 6 },
  ];
  const corralW = 32 * SCALE;
  const corralH = 24 * SCALE;
  for (const cd of corralDefs) {
    sprites.push(
      scene.add.image(cd.cx, cd.cy, "corral").setScale(SCALE).setDepth(1.5),
    );
    for (let a = 0; a < cd.count; a++) {
      const ax = cd.cx + Phaser.Math.Between(-corralW / 2 + 15, corralW / 2 - 15);
      const ay = cd.cy + Phaser.Math.Between(-corralH / 2 + 10, corralH / 2 - 10);
      const sprite = scene.add.image(ax, ay, cd.animal).setScale(SCALE).setDepth(2);
      scene.animals.push({
        sprite,
        type: cd.animal,
        state: "idle",
        corral: { x: cd.cx, y: cd.cy, hw: corralW / 2, hh: corralH / 2 },
        wanderAngle: Math.random() * Math.PI * 2,
        wanderTimer: 0,
        wanderDuration: 1 + Math.random() * 3,
        moving: Math.random() > 0.5,
        runAngle: 0,
        panicTimer: 0,
      });
    }
  }

  // --- Expanded fence perimeter (FARM_COMPOUND_HEIGHT_FACTOR × taller) ---
  // Original top/bottom Y offsets were ±180/+200; scaled by hf = 1.6.
  const topY = farmY - Math.round(180 * hf);    // ~farmY - 288
  const bottomY = farmY + Math.round(200 * hf); // ~farmY + 320
  // Horizontal fences (unchanged X range — same width)
  for (let f = -6; f <= 8; f++) {
    if (f === 1) continue; // top gate
    sprites.push(
      scene.add.image(farmX + f * fenceLen, topY, "fence-h")
        .setScale(SCALE).setDepth(1.5),
    );
  }
  for (let f = -6; f <= 8; f++) {
    if (f === 2) continue; // bottom gate
    sprites.push(
      scene.add.image(farmX + f * fenceLen, bottomY, "fence-h")
        .setScale(SCALE).setDepth(1.5),
    );
  }
  // Vertical fences — range expanded so they reach from top fence to bottom.
  // Original range -4..+4 spans 384 px; scaling by 1.6 → ~614 px → -6..+6 fits.
  for (let f = -6; f <= 6; f++) {
    if (f === 0) continue; // left gate
    sprites.push(
      scene.add.image(farmX - 6 * fenceLen, farmY + f * fenceLen, "fence-v")
        .setScale(SCALE).setDepth(1.5),
    );
  }
  for (let f = -6; f <= 6; f++) {
    if (f === 1) continue; // right gate
    sprites.push(
      scene.add.image(farmX + 8 * fenceLen + 10, farmY + f * fenceLen, "fence-v")
        .setScale(SCALE).setDepth(1.5),
    );
  }

  // =====================================================================
  //  Activity 1 — Laundry line + person
  // =====================================================================
  const laundry = buildLaundry(scene, rng, farmX, farmY, sprites);

  // =====================================================================
  //  Activity 2 — Mice + chasers
  // =====================================================================
  const mice = buildMice(scene, rng, farmX, farmY, sprites);
  const chasers = buildMiceChasers(scene, rng, farmX, farmY, mice, sprites);

  // =====================================================================
  //  Activity 3 — Chores (hole digger + corral feeder)
  // =====================================================================
  const digger = buildHoleDigger(scene, rng, farmX, farmY, sprites);
  const feeder = buildFeeder(
    scene, rng, farmX, farmY,
    corralDefs[1], // chicken corral
    sprites,
  );

  // Bounds widened vertically for the taller fence
  const halfW = 7 * fenceLen + 10;
  const halfH = Math.round(190 * hf);
  return {
    type: "farmCompound",
    bounds: { cx: farmX + fenceLen, cy: farmY + 10, hw: halfW, hh: halfH },
    update(dt) {
      updateLaundry(scene, laundry, dt);
      updateMice(scene, mice, dt);
      updateChasers(scene, chasers, mice, dt);
      updateDigger(scene, digger, dt);
      updateFeeder(scene, feeder, dt);
    },
    destroy() {
      for (const s of sprites) s.destroy();
    },
  };
}

// =======================================================================
//  Laundry
// =======================================================================

function buildLaundry(scene, rng, farmX, farmY, sprites) {
  // Clothesline centered west-of-center in the compound
  const lineCenterX = farmX - 100;
  const lineY = farmY - 60;
  const lineHalfW = 48;
  const basketX = lineCenterX;
  const basketY = lineY + 90;

  // Clothesline scenery
  sprites.push(
    scene.add.image(lineCenterX, lineY, "clothesline")
      .setScale(SCALE).setDepth(1.5),
  );

  // Laundry basket (reuse the existing picker-basket texture)
  sprites.push(
    scene.add.image(basketX, basketY, "picker-basket")
      .setScale(SCALE).setDepth(2),
  );

  // Clothes items — hang them across the line
  const items = [];
  const spanW = lineHalfW * 2 * 0.85;
  for (let i = 0; i < FARM_COMPOUND_LAUNDRY_ITEMS; i++) {
    const lx = lineCenterX - spanW / 2 + (i + 0.5) * (spanW / FARM_COMPOUND_LAUNDRY_ITEMS);
    const ly = lineY + 2;
    const tint = LAUNDRY_TINTS[i % LAUNDRY_TINTS.length];
    const sprite = scene.add
      .image(lx, ly, "laundry-shirt")
      .setScale(SCALE).setDepth(2).setTint(tint);
    sprites.push(sprite);
    items.push({
      sprite,
      lineX: lx,
      lineY: ly,
      on: true, // true = on the line, false = in the basket
    });
  }

  // Person
  const startX = basketX - 14;
  const startY = basketY - 8;
  const skinId = rng.between(0, 199);
  const { sprite: personSprite, personEntry } = createManagedPerson(scene, {
    x: startX, y: startY, skinId,
    texture: `person-stand-${skinId}`,
    greeting: "Laundry\nday!",
    depth: 2,
    event: "farmCompound",
    flagKey: "isFarmLaundry",
  });

  return {
    personEntry,
    personSprite,
    skinId,
    items,
    lineCenterX, lineY,
    basketX, basketY,
    phase: "toSource", // toSource | grabbing | toDest | placing
    phaseTimer: 0,
    direction: "removing", // removing (line → basket) or hanging (basket → line)
    activeItem: null,
    targetX: 0, targetY: 0,
    frameTimer: 0,
    frameIdx: 0,
  };
}

function updateLaundry(scene, L, dt) {
  const pe = L.personEntry;
  if (pe.state !== "idle") return;

  // Pick the next item in the current direction if we don't have a target yet
  if (!L.activeItem && L.phase === "toSource") {
    const candidate = L.direction === "removing"
      ? L.items.find((it) => it.on)
      : L.items.find((it) => !it.on);
    if (!candidate) {
      // Source empty — flip direction
      L.direction = L.direction === "removing" ? "hanging" : "removing";
      return;
    }
    L.activeItem = candidate;
    if (L.direction === "removing") {
      L.targetX = candidate.lineX;
      L.targetY = candidate.lineY + 4; // stand just below the hanging item
    } else {
      L.targetX = L.basketX;
      L.targetY = L.basketY;
    }
  }

  switch (L.phase) {
    case "toSource":
      if (walkToward(L, L.targetX, L.targetY, dt)) {
        L.phase = "grabbing";
        L.phaseTimer = FARM_COMPOUND_LAUNDRY_GRAB_MS;
        L.personSprite.setTexture(`person-wave1-${L.skinId}`); // bending to grab
      }
      break;
    case "grabbing":
      L.phaseTimer -= dt * 1000;
      if (L.phaseTimer <= 0) {
        // Pick up: carry the item near the person
        const item = L.activeItem;
        if (L.direction === "removing") {
          item.on = false;
        } else {
          item.on = true;
        }
        // Head to the destination
        if (L.direction === "removing") {
          L.targetX = L.basketX;
          L.targetY = L.basketY;
        } else {
          L.targetX = L.activeItem.lineX;
          L.targetY = L.activeItem.lineY + 4;
        }
        L.phase = "toDest";
        L.personSprite.setTexture(`person-stand-${L.skinId}`);
      }
      break;
    case "toDest":
      // Carry the item with the person
      if (L.activeItem) {
        L.activeItem.sprite.setPosition(L.personSprite.x + 4, L.personSprite.y - 6);
      }
      if (walkToward(L, L.targetX, L.targetY, dt)) {
        L.phase = "placing";
        L.phaseTimer = FARM_COMPOUND_LAUNDRY_PLACE_MS;
        L.personSprite.setTexture(`person-wave2-${L.skinId}`); // arms up to place
      }
      break;
    case "placing":
      L.phaseTimer -= dt * 1000;
      if (L.phaseTimer <= 0) {
        const item = L.activeItem;
        if (L.direction === "removing") {
          // Pile item in the basket (slightly offset)
          item.sprite.setPosition(L.basketX + (Math.random() - 0.5) * 6, L.basketY - 4);
        } else {
          // Return to line
          item.sprite.setPosition(item.lineX, item.lineY);
        }
        L.activeItem = null;
        L.phase = "toSource";
        L.personSprite.setTexture(`person-stand-${L.skinId}`);
      }
      break;
  }
}

// =======================================================================
//  Mice (invulnerable — not in scene.animals so weapons ignore them)
// =======================================================================

function buildMice(scene, rng, farmX, farmY, sprites) {
  const hf = FARM_COMPOUND_HEIGHT_FACTOR;
  const region = {
    left: farmX - 250, right: farmX + 370,
    top: farmY - Math.round(160 * hf), bottom: farmY + Math.round(180 * hf),
  };
  const mice = [];
  for (let i = 0; i < FARM_COMPOUND_MICE_COUNT; i++) {
    const x = rng.between(region.left + 20, region.right - 20);
    const y = rng.between(region.top + 20, region.bottom - 20);
    const sprite = scene.add
      .image(x, y, "mouse")
      .setScale(SCALE).setDepth(2.2);
    sprites.push(sprite);
    mice.push({
      sprite,
      x, y,
      heading: Math.random() * Math.PI * 2,
      turnTimer: FARM_COMPOUND_MOUSE_TURN_MIN_MS +
                 Math.random() * FARM_COMPOUND_MOUSE_TURN_RANGE_MS,
      region,
    });
  }
  return mice;
}

function updateMice(scene, mice, dt) {
  for (const m of mice) {
    m.turnTimer -= dt * 1000;
    if (m.turnTimer <= 0) {
      m.turnTimer = FARM_COMPOUND_MOUSE_TURN_MIN_MS +
                    Math.random() * FARM_COMPOUND_MOUSE_TURN_RANGE_MS;
      m.heading += (Math.random() - 0.5) * 1.8;
    }
    // Steer around buildings before moving
    m.heading = steerAroundBuildings(scene, m.x, m.y, m.heading, dt);
    const nx = m.x + Math.cos(m.heading) * FARM_COMPOUND_MOUSE_SPEED * dt;
    const ny = m.y + Math.sin(m.heading) * FARM_COMPOUND_MOUSE_SPEED * dt;
    // If the new position is still inside a building (overshot the steer),
    // bounce the heading + skip the move this frame.
    if (isInsideBuilding(scene, nx, ny)) {
      m.heading += Math.PI;
    } else {
      m.x = nx;
      m.y = ny;
    }
    // Reflect off region bounds
    if (m.x < m.region.left)   { m.x = m.region.left;   m.heading = Math.PI - m.heading; }
    if (m.x > m.region.right)  { m.x = m.region.right;  m.heading = Math.PI - m.heading; }
    if (m.y < m.region.top)    { m.y = m.region.top;    m.heading = -m.heading; }
    if (m.y > m.region.bottom) { m.y = m.region.bottom; m.heading = -m.heading; }
    m.sprite.setPosition(m.x, m.y);
    m.sprite.setFlipX(Math.cos(m.heading) < 0);
  }
}

// =======================================================================
//  Mouse chasers
// =======================================================================

function buildMiceChasers(scene, rng, farmX, farmY, mice, sprites) {
  const chasers = [];
  const hf = FARM_COMPOUND_HEIGHT_FACTOR;
  for (let i = 0; i < FARM_COMPOUND_CHASER_COUNT; i++) {
    const sx = farmX + Phaser.Math.Between(-180, 260);
    const sy = farmY + Phaser.Math.Between(-120, Math.round(160 * hf));
    const skinId = rng.between(0, 199);
    const { sprite, personEntry } = createManagedPerson(scene, {
      x: sx, y: sy, skinId,
      texture: `person-run1-${skinId}`,
      greeting: "Gotta\ncatch 'em!",
      depth: 2,
      event: "farmCompound",
      flagKey: "isFarmChaser",
    });
    // Origin at the bottom-middle so the stick pivots from the hand.
    // We also rotate the sprite 90° via setAngle so the 6×1 texture
    // reads as a VERTICAL stick pointing up out of the fist.
    const stick = scene.add
      .image(sx, sy, "farm-stick")
      .setOrigin(0.5, 1)
      .setScale(SCALE)
      .setDepth(2.9);
    sprites.push(stick);
    chasers.push({
      personEntry, sprite, skinId, stick,
      target: pickRandom(mice),
      frameTimer: 0, frameIdx: 0,
      swingTimer: 0,  // when > 0: stick is in swing-pose briefly
      swingCooldown: 0,
    });
  }
  return chasers;
}

function updateChasers(scene, chasers, mice, dt) {
  for (const c of chasers) {
    if (c.personEntry.state !== "idle") {
      c.stick.setVisible(false);
      continue;
    }
    c.stick.setVisible(true);
    // Pick a new target if ours is gone (shouldn't happen — mice don't die — but safety)
    if (!c.target || !mice.includes(c.target)) c.target = pickRandom(mice);
    if (!c.target) continue;

    const dx = c.target.x - c.sprite.x;
    const dy = c.target.y - c.sprite.y;
    const dist = Math.hypot(dx, dy);

    // Movement — smooth heading with obstacle flanking
    if (dist > FARM_COMPOUND_CHASER_SWING_RANGE) {
      const desired = Math.atan2(dy, dx);

      // If the direct path runs into a building, try flanking offsets
      // (±0.6, ±1.2 rad) and pick the first clear one. Prevents the
      // flip-flop oscillation that happens when steerAroundBuildings
      // keeps pushing back toward the same obstacle each frame.
      const probeDist = 40;
      const isClear = (ang) => {
        const pnx = c.sprite.x + Math.cos(ang) * probeDist;
        const pny = c.sprite.y + Math.sin(ang) * probeDist;
        if (isInsideBuilding(scene, pnx, pny)) return false;
        for (const b of scene.buildings) {
          if (b.destroyed) continue;
          if (Phaser.Math.Distance.Between(pnx, pny, b.x, b.y) < b.radius + 12) {
            return false;
          }
        }
        return true;
      };
      const tryOrder = [0, 0.6, -0.6, 1.2, -1.2, 1.8, -1.8];
      let chosen = desired;
      for (const off of tryOrder) {
        if (isClear(desired + off)) { chosen = desired + off; break; }
      }

      // Smooth heading toward chosen (turn-rate limit prevents flip-flop)
      if (c.heading === undefined) c.heading = chosen;
      const delta = Phaser.Math.Angle.Wrap(chosen - c.heading);
      const maxTurn = 5 * dt; // rad/s
      if (Math.abs(delta) <= maxTurn) c.heading = chosen;
      else c.heading += Math.sign(delta) * maxTurn;

      const step = FARM_COMPOUND_CHASER_SPEED * dt;
      const nx = c.sprite.x + Math.cos(c.heading) * step;
      const ny = c.sprite.y + Math.sin(c.heading) * step;
      if (!isInsideBuilding(scene, nx, ny)) {
        c.sprite.x = nx;
        c.sprite.y = ny;
      }

      // Flip hysteresis — only switch facing when heading is clearly
      // left or right of vertical. Avoids rapid flips near straight up/down.
      const fx = Math.cos(c.heading);
      if (fx < -0.2) c.sprite.setFlipX(true);
      else if (fx > 0.2) c.sprite.setFlipX(false);
      c.frameTimer += dt * 1000;
      if (c.frameTimer >= 160) {
        c.frameTimer = 0;
        c.frameIdx = 1 - c.frameIdx;
        c.sprite.setTexture(
          c.frameIdx === 0 ? `person-run1-${c.skinId}` : `person-run2-${c.skinId}`,
        );
      }
    }

    // Stick held upright in the hand (origin 0.5,1 → rotation 0 = vertical).
    // On a swing, chop DOWN to ~90° below upright in a smooth sin arc
    // (upright → horizontal → back to upright over the pose duration).
    let stickRot = 0;
    if (c.swingTimer > 0) {
      c.swingTimer -= dt * 1000;
      const progress = 1 - c.swingTimer / FARM_COMPOUND_CHASER_SWING_POSE_MS;
      const peak = Math.PI / 2; // 90° peak below upright
      // Direction of swing follows the chaser's facing so the chop is aimed
      // AT the target rather than always to the right
      const dir = c.sprite.flipX ? -1 : 1;
      stickRot = dir * Math.sin(Math.PI * progress) * peak;
      c.sprite.setTexture(`person-wave2-${c.skinId}`);
    }
    // Hand position (shoulder ~ y - 6 is roughly the upper arm region)
    const stickX = c.sprite.x + (c.sprite.flipX ? -6 : 6);
    const stickY = c.sprite.y - 6;
    c.stick.setPosition(stickX, stickY);
    c.stick.setRotation(stickRot);

    // Swing!
    c.swingCooldown -= dt * 1000;
    if (dist <= FARM_COMPOUND_CHASER_SWING_RANGE && c.swingCooldown <= 0) {
      c.swingCooldown = FARM_COMPOUND_CHASER_SWING_INTERVAL;
      c.swingTimer = FARM_COMPOUND_CHASER_SWING_POSE_MS;
      // Miss or hit — randomly; mice "teleport" away on hit
      if (Math.random() < 0.5) {
        // Teleport the mouse to a random spot within its region
        const m = c.target;
        m.x = m.region.left + Math.random() * (m.region.right - m.region.left);
        m.y = m.region.top + Math.random() * (m.region.bottom - m.region.top);
        m.heading = Math.random() * Math.PI * 2;
        m.sprite.setPosition(m.x, m.y);
        c.target = pickRandom(mice); // switch to a new target
      }
    }
  }
}

// =======================================================================
//  Chores — hole digger + corral feeder
// =======================================================================

function buildHoleDigger(scene, rng, farmX, farmY, sprites) {
  // Hole position (on the ground)
  const holeX = farmX + 130;
  const holeY = farmY - 60;
  const hole = scene.add.image(holeX, holeY, "dirt-hole").setScale(SCALE).setDepth(1.4);
  sprites.push(hole);

  // Person stands to the WEST of the hole so the shovel arcs INTO it
  const personX = holeX - 22;
  const personY = holeY - 2;
  const skinId = rng.between(0, 199);
  const { sprite, personEntry } = createManagedPerson(scene, {
    x: personX, y: personY, skinId,
    texture: `person-stand-${skinId}`,
    greeting: "Diggin'\nit!",
    depth: 2,
    event: "farmCompound",
    flagKey: "isFarmDigger",
    flip: false, // face right toward the hole
  });
  const shovel = scene.add
    .image(personX + 6, personY - 2, "farm-shovel")
    .setOrigin(0.5, 1) // pivot from the person's hand (top of shovel handle)
    .setScale(SCALE).setDepth(2.9);
  sprites.push(shovel);
  return {
    personEntry, sprite, skinId, shovel,
    phase: "idle",   // idle | digging
    phaseTimer: FARM_COMPOUND_DIG_CYCLE_MS,
    holeX, holeY,
    personX, personY,
  };
}

function updateDigger(scene, D, dt) {
  if (D.personEntry.state !== "idle") {
    D.shovel.setVisible(false);
    return;
  }
  D.shovel.setVisible(true);
  D.phaseTimer -= dt * 1000;
  // Shovel pivots from the person's hand. Rotation angle rotates the blade
  // toward the hole (east of the digger).
  const handX = D.sprite.x + 4;
  const handY = D.sprite.y - 2;
  D.shovel.setPosition(handX, handY);
  // Upright at rest, tipped TOWARD the hole when digging (+0.9 rad ≈ 52° east)
  D.shovel.setRotation(D.phase === "digging" ? 0.9 : 0.15);

  if (D.phase === "idle" && D.phaseTimer <= 0) {
    D.phase = "digging";
    D.phaseTimer = FARM_COMPOUND_DIG_POSE_MS;
    D.sprite.setTexture(`person-wave1-${D.skinId}`);
  } else if (D.phase === "digging" && D.phaseTimer <= 0) {
    D.phase = "idle";
    D.phaseTimer = FARM_COMPOUND_DIG_CYCLE_MS;
    D.sprite.setTexture(`person-stand-${D.skinId}`);
  }
}

function buildFeeder(scene, rng, farmX, farmY, corralDef, sprites) {
  // Stand just OUTSIDE the corral fence on the farm-center-facing side.
  // Corral is 32 tiles wide → half-width = 16 * SCALE = 48 px; add a small
  // buffer so the feeder isn't leaning against the fence.
  const corralHalfW = 32 * SCALE / 2;
  const side = corralDef.cx > farmX ? -1 : 1;
  const fx = corralDef.cx + side * (corralHalfW + 14);
  const fy = corralDef.cy;
  const skinId = rng.between(0, 199);
  const { sprite, personEntry } = createManagedPerson(scene, {
    x: fx, y: fy, skinId,
    texture: `person-stand-${skinId}`,
    greeting: "Feedin'\ntime!",
    depth: 2,
    event: "farmCompound",
    flagKey: "isFarmFeeder",
    flip: side === -1,
  });
  return {
    personEntry, sprite, skinId,
    corralCx: corralDef.cx,
    corralCy: corralDef.cy,
    phase: "idle", // idle | tossing
    phaseTimer: FARM_COMPOUND_FEED_INTERVAL_MS * Math.random(),
  };
}

function updateFeeder(scene, F, dt) {
  if (F.personEntry.state !== "idle") return;
  F.phaseTimer -= dt * 1000;
  if (F.phase === "idle" && F.phaseTimer <= 0) {
    F.phase = "tossing";
    F.phaseTimer = FARM_COMPOUND_FEED_POSE_MS;
    F.sprite.setTexture(`person-wave2-${F.skinId}`);
    // Spawn food pellets flying toward the corral
    for (let i = 0; i < FARM_COMPOUND_FEED_PELLET_COUNT; i++) {
      const startX = F.sprite.x;
      const startY = F.sprite.y - 4;
      const targetX = F.corralCx + (Math.random() - 0.5) * 30;
      const targetY = F.corralCy + (Math.random() - 0.5) * 20;
      const pellet = scene.add
        .image(startX, startY, "food-pellet")
        .setScale(SCALE).setDepth(6);
      scene.hudCam.ignore(pellet);
      scene.tweens.add({
        targets: pellet,
        x: targetX,
        y: targetY,
        duration: FARM_COMPOUND_FEED_PELLET_DURATION,
        ease: "Quad.easeOut",
        onComplete: () => pellet.destroy(),
      });
    }
  } else if (F.phase === "tossing" && F.phaseTimer <= 0) {
    F.phase = "idle";
    F.phaseTimer = FARM_COMPOUND_FEED_INTERVAL_MS * (0.6 + Math.random() * 0.8);
    F.sprite.setTexture(`person-stand-${F.skinId}`);
  }
}

// =======================================================================
//  Shared helpers
// =======================================================================

// Walks the laundry person toward (tx, ty). Returns true once arrived.
function walkToward(L, tx, ty, dt) {
  const dx = tx - L.personSprite.x;
  const dy = ty - L.personSprite.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 3) return true;
  const step = FARM_COMPOUND_LAUNDRY_WALK_SPEED * dt;
  L.personSprite.x += (dx / dist) * step;
  L.personSprite.y += (dy / dist) * step;
  L.personSprite.setFlipX(dx < 0);
  L.frameTimer += dt * 1000;
  if (L.frameTimer >= 200) {
    L.frameTimer = 0;
    L.frameIdx = 1 - L.frameIdx;
    L.personSprite.setTexture(
      L.frameIdx === 0 ? `person-run1-${L.skinId}` : `person-run2-${L.skinId}`,
    );
  }
  return false;
}

function pickRandom(arr) {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}
