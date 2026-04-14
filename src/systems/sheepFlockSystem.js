// Sheep flock (goats + shepherds) set piece.
//
// Factory: createSheepFlock(scene, rng, { tileX, tileY }) returns
// { type, bounds, update, destroy }. No per-frame update is needed —
// animalSystem.updateAnimals and peopleSystem.updatePeople already drive
// the goats and shepherds via the shared scene.animals / scene.people
// arrays.
import {
  TILE, SCALE,
  FLOCK_GOAT_COUNT, FLOCK_SHEPHERD_COUNT,
  ANIMAL_FLOCK_RADIUS,
} from "../constants.js";
import { shepherdGreetings } from "../dialog.js";

export function createSheepFlock(scene, rng, opts) {
  const { tileX, tileY } = opts;
  const cx = tileX * TILE * SCALE;
  const cy = tileY * TILE * SCALE;
  const radius = ANIMAL_FLOCK_RADIUS;

  // Large goat flock inside the corral
  for (let g = 0; g < FLOCK_GOAT_COUNT; g++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * radius * 0.8;
    const gx = cx + Math.cos(angle) * dist;
    const gy = cy + Math.sin(angle) * dist;
    const sprite = scene.add.image(gx, gy, "goat").setScale(SCALE).setDepth(2);
    scene.animals.push({
      sprite,
      type: "goat",
      state: "idle",
      corral: { x: cx, y: cy, hw: radius, hh: radius },
      wanderAngle: Math.random() * Math.PI * 2,
      wanderTimer: 0,
      wanderDuration: 1 + Math.random() * 3,
      moving: Math.random() > 0.5,
      runAngle: 0,
      runTimer: 0,
      runFrame: 0,
      panicTimer: 0,
    });
  }

  // Shepherds spread around the flock edges
  const shepherdOffsets = [
    { dx: -160, dy: -80  },
    { dx:  170, dy:  60  },
    { dx:  -40, dy:  170 },
    { dx:  100, dy: -150 },
    { dx: -180, dy:  80  },
    { dx:  200, dy: -30  },
    { dx: -100, dy: -160 },
    { dx:   50, dy:  190 },
    { dx: -200, dy: -20  },
  ].slice(0, FLOCK_SHEPHERD_COUNT);
  for (const o of shepherdOffsets) {
    const sx = cx + o.dx;
    const sy = cy + o.dy;
    const skinId = rng.between(0, 199);
    const sprite = scene.add
      .image(sx, sy, `person-stand-${skinId}`)
      .setScale(SCALE)
      .setDepth(2);
    scene.people.push({
      sprite,
      skinId,
      state: "idle",
      greeting: rng.pick(shepherdGreetings),
      noGreet: false,
      scatterPanic: true,
      bubble: null,
      waveTimer: 0, waveFrame: 0,
      runAngle: 0, runTimer: 0, runFrame: 0,
      wanderTimer: 0,
      wanderDuration: 3 + Math.random() * 4,
      wanderAngle: Math.random() < 0.5 ? null : Math.random() * Math.PI * 2,
      hideTarget: null,
      homeX: sx, homeY: sy,
    });
  }

  return {
    type: "sheepFlock",
    bounds: { cx, cy, hw: radius + 40, hh: radius + 40 },
    update: () => {},
    destroy: () => {},
  };
}
