// RC cars set piece.
//
// Factory: createRcCar(scene, rng, { tileX, tileY }) → standard instance.
//
// A rectangular arena with RC_CAR_DRIVER_COUNT drivers ringed around the
// outside — each holding an `rc-controller` prop — and one tiny car
// scooting around the arena per driver. Each car is tinted a random color,
// picks random targets inside the arena, turns gradually toward them, and
// physically arrives before picking the next. If its driver panics or dies
// (`state !== "idle"`), the car sits still until the driver returns.
import Phaser from "phaser";
import {
  TILE, SCALE,
  RC_CAR_DRIVER_COUNT,
  RC_CAR_ARENA_WIDTH_PX, RC_CAR_ARENA_HEIGHT_PX,
  RC_CAR_DRIVER_MARGIN_PX,
  RC_CAR_SPEED, RC_CAR_TURN_RATE,
  RC_CAR_TARGET_ARRIVE_PX,
  RC_CAR_SCALE,
  RC_CAR_WHEEL_WOBBLE_HZ, RC_CAR_WHEEL_WOBBLE_AMP,
  RC_CAR_DRIVER_JUMP_INTERVAL_MIN, RC_CAR_DRIVER_JUMP_INTERVAL_RANGE,
  RC_CAR_DRIVER_JUMP_HEIGHT, RC_CAR_DRIVER_JUMP_DURATION,
  RC_CAR_DUST_INTERVAL, RC_CAR_DUST_DURATION,
  RC_CAR_DUST_OPACITY, RC_CAR_DUST_OPACITY_JITTER,
  RC_CAR_DUST_SCALE, RC_CAR_DUST_SCALE_GROW,
  RC_CAR_DUST_DRIFT, RC_CAR_DUST_REAR_OFFSET,
} from "../constants.js";
import { createManagedPerson } from "./managedPersonUtils.js";

const DRIVER_GREETINGS = [
  "Watch me\nrace!", "FLOOR IT!", "Turn\ntighter!",
  "Battery's\ngetting low.", "Pit stop!", "Don't crash!",
  "Drift!", "Reverse!", "HAHA!",
];

const CAR_TINTS = [
  0xff3333, // red
  0x3388ff, // blue
  0xffcc33, // yellow
  0x44cc55, // green
  0xcc55cc, // magenta
  0xff8833, // orange
  0x66eedd, // cyan
  0xaa7755, // tan
];

export function createRcCar(scene, rng, opts) {
  const { tileX, tileY } = opts;
  const cx = tileX * TILE * SCALE;
  const cy = tileY * TILE * SCALE;

  const halfW = RC_CAR_ARENA_WIDTH_PX / 2;
  const halfH = RC_CAR_ARENA_HEIGHT_PX / 2;
  const arena = {
    cx, cy,
    left:   cx - halfW,
    right:  cx + halfW,
    top:    cy - halfH,
    bottom: cy + halfH,
  };

  const drivers = [];
  const sprites = []; // scenery we explicitly own (props)

  // Flat desert-colored ground so the RC cars aren't driving over
  // scattered desert props (rocks, brush, etc). Slightly larger than the
  // arena itself to cover the driver-margin area and over-extend any
  // sub-pixel rounding at the edges.
  const groundPad = RC_CAR_DRIVER_MARGIN_PX + 10;
  const ground = scene.add.graphics();
  ground.fillStyle(0xd2b48c, 1);
  ground.fillRect(
    arena.left - groundPad,
    arena.top - groundPad,
    (arena.right - arena.left) + groundPad * 2,
    (arena.bottom - arena.top) + groundPad * 2,
  );
  ground.setDepth(1.1);
  sprites.push(ground);

  for (let i = 0; i < RC_CAR_DRIVER_COUNT; i++) {
    // Distribute drivers evenly around the arena perimeter
    const angle = (i / RC_CAR_DRIVER_COUNT) * Math.PI * 2 + 0.1;
    const px = cx + Math.cos(angle) * (halfW + RC_CAR_DRIVER_MARGIN_PX);
    const py = cy + Math.sin(angle) * (halfH + RC_CAR_DRIVER_MARGIN_PX);
    const skinId = rng.between(0, 199);

    const { sprite: personSprite, personEntry } = createManagedPerson(scene, {
      x: px, y: py, skinId,
      texture: `person-wave1-${skinId}`, // arm up holding controller
      greeting: rng.pick(DRIVER_GREETINGS),
      depth: 2,
      event: "rcCar",
      flagKey: "isRcCarDriver",
      flip: px > cx, // face the arena
    });

    // Controller in hand — offset toward the arena side of the driver
    const ctrlOffsetX = px < cx ? 7 : -7;
    // Depth 4: above the y-sorted people band (2.0–2.99) and the drone
    // shadow (3) so the controller is always readable in a driver's hands.
    const controller = scene.add
      .image(px + ctrlOffsetX, py - 1, "rc-controller")
      .setScale(SCALE)
      .setDepth(4);
    personEntry.carriedGoods = controller;
    sprites.push(controller);

    // RC car starts near the driver's edge of the arena
    const carX = cx + Math.cos(angle) * (halfW * 0.5);
    const carY = cy + Math.sin(angle) * (halfH * 0.5);
    const car = scene.add
      .image(carX, carY, "rc-car")
      .setScale(SCALE * RC_CAR_SCALE)
      .setDepth(2.7)
      .setTint(CAR_TINTS[i % CAR_TINTS.length]);
    sprites.push(car);

    drivers.push({
      personEntry,
      personSprite,
      skinId,
      controller,
      car,
      carX, carY,
      heading: angle + Math.PI, // initial facing: into the arena
      // Pick the first real target immediately
      targetX: pickArenaX(arena),
      targetY: pickArenaY(arena),
      wobblePhase: Math.random() * Math.PI * 2,
      // Excited-jump state — start each driver with a random offset
      // so the group isn't synchronized.
      jumping: false,
      jumpElapsed: 0,
      jumpTimer:
        Math.random() *
        (RC_CAR_DRIVER_JUMP_INTERVAL_MIN + RC_CAR_DRIVER_JUMP_INTERVAL_RANGE),
      dustTimer: Math.random() * RC_CAR_DUST_INTERVAL,
    });
  }

  return {
    type: "rcCar",
    bounds: {
      cx, cy,
      hw: halfW + RC_CAR_DRIVER_MARGIN_PX + 20,
      hh: halfH + RC_CAR_DRIVER_MARGIN_PX + 20,
    },
    update(dt) {
      for (const d of drivers) updateDriver(scene, arena, d, dt);
    },
    destroy() {
      for (const s of sprites) s.destroy();
    },
  };
}

// ----------------------------------------------------------------------

function updateDriver(scene, arena, d, dt) {
  // Hide the controller if the driver isn't idle (panicking / hiding / gone)
  const idle = d.personEntry.state === "idle";
  d.controller.setVisible(idle);

  // Car only moves while the driver is actively controlling it. When the
  // driver isn't idle the car just sits still, and we do NOT touch the
  // driver's sprite position — peopleSystem is driving them during panic.
  if (!idle) return;

  // Excited-jump state machine — only advances while idle. Applied via a
  // Y offset that wraps the controller too so it stays in the driver's hand.
  let jumpBob = 0;
  if (d.jumping) {
    d.jumpElapsed += dt * 1000;
    const t = Math.min(1, d.jumpElapsed / RC_CAR_DRIVER_JUMP_DURATION);
    jumpBob = Math.sin(Math.PI * t) * RC_CAR_DRIVER_JUMP_HEIGHT;
    if (t >= 1) {
      d.jumping = false;
      d.jumpElapsed = 0;
      d.jumpTimer =
        RC_CAR_DRIVER_JUMP_INTERVAL_MIN +
        Math.random() * RC_CAR_DRIVER_JUMP_INTERVAL_RANGE;
    }
  } else {
    d.jumpTimer -= dt * 1000;
    if (d.jumpTimer <= 0) {
      d.jumping = true;
      d.jumpElapsed = 0;
    }
  }
  // Apply jump bob to the person's Y around their home, and keep the
  // controller anchored to the hand (so it rides the jump with them).
  const baseY = d.personEntry.homeY;
  d.personSprite.y = baseY - jumpBob;
  const ctrlOffsetX = d.personSprite.x < arena.cx ? 7 : -7;
  d.controller.setPosition(d.personSprite.x + ctrlOffsetX, d.personSprite.y - 1);

  // Steer toward the current target, clamped by turn rate
  const dx = d.targetX - d.carX;
  const dy = d.targetY - d.carY;
  const targetAngle = Math.atan2(dy, dx);
  const turn = Phaser.Math.Angle.Wrap(targetAngle - d.heading);
  const maxTurn = RC_CAR_TURN_RATE * dt;
  if (Math.abs(turn) <= maxTurn) d.heading = targetAngle;
  else d.heading += Math.sign(turn) * maxTurn;

  // Move forward
  const step = RC_CAR_SPEED * dt;
  d.carX += Math.cos(d.heading) * step;
  d.carY += Math.sin(d.heading) * step;

  // Arrive? Pick a new target
  const distSq = dx * dx + dy * dy;
  if (distSq < RC_CAR_TARGET_ARRIVE_PX * RC_CAR_TARGET_ARRIVE_PX) {
    d.targetX = pickArenaX(arena);
    d.targetY = pickArenaY(arena);
  }

  // Clamp to arena with a reflective turn if we overshoot
  if (d.carX < arena.left)   { d.carX = arena.left;   d.heading = Math.PI - d.heading; }
  if (d.carX > arena.right)  { d.carX = arena.right;  d.heading = Math.PI - d.heading; }
  if (d.carY < arena.top)    { d.carY = arena.top;    d.heading = -d.heading; }
  if (d.carY > arena.bottom) { d.carY = arena.bottom; d.heading = -d.heading; }

  // Little vertical wobble to suggest wheels-on-dirt motion
  d.wobblePhase += dt * RC_CAR_WHEEL_WOBBLE_HZ;
  const wobble = Math.sin(d.wobblePhase) * RC_CAR_WHEEL_WOBBLE_AMP;

  d.car.setPosition(d.carX, d.carY + wobble);
  d.car.setRotation(d.heading);

  // Dust puff trail behind the car
  d.dustTimer -= dt * 1000;
  if (d.dustTimer <= 0) {
    d.dustTimer = RC_CAR_DUST_INTERVAL * (0.7 + Math.random() * 0.6);
    spawnCarDust(scene, d);
  }
}

function spawnCarDust(scene, d) {
  // Spawn behind the car (opposite of heading)
  const rx = d.carX - Math.cos(d.heading) * RC_CAR_DUST_REAR_OFFSET;
  const ry = d.carY - Math.sin(d.heading) * RC_CAR_DUST_REAR_OFFSET;
  const puff = scene.add.image(rx, ry, "smoke")
    .setScale(SCALE * RC_CAR_DUST_SCALE)
    .setDepth(2.6)
    .setAlpha(RC_CAR_DUST_OPACITY + Math.random() * RC_CAR_DUST_OPACITY_JITTER)
    .setTint(0xc9a872);
  scene.hudCam.ignore(puff);
  const driftAngle = d.heading + Math.PI + (Math.random() - 0.5) * 0.6;
  scene.tweens.add({
    targets: puff,
    x: rx + Math.cos(driftAngle) * RC_CAR_DUST_DRIFT,
    y: ry + Math.sin(driftAngle) * RC_CAR_DUST_DRIFT,
    scale: SCALE * (RC_CAR_DUST_SCALE + RC_CAR_DUST_SCALE_GROW),
    alpha: 0,
    duration: RC_CAR_DUST_DURATION * (0.8 + Math.random() * 0.4),
    onComplete: () => puff.destroy(),
  });
}

function pickArenaX(a) {
  return a.left + Math.random() * (a.right - a.left);
}
function pickArenaY(a) {
  return a.top + Math.random() * (a.bottom - a.top);
}
