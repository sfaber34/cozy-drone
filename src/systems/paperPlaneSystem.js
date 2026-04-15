// Paper planes set piece.
//
// Factory: createPaperPlane(scene, rng, { tileX, tileY }) → standard
// { type, bounds, update, destroy } instance.
//
// A loose group of throwers, each with their own paper plane. Per-thrower
// state machine:
//   windup → release → watching (plane flies, they cheer + bob) → chasing
//   (walk to landed plane) → picking (brief bent-over) → windup (repeat)
//
// Panicked/dead throwers freeze (state gate via personEntry.state); once
// they calm down and return home the cycle resumes from the start.
import Phaser from "phaser";
import {
  TILE, SCALE,
  PAPER_PLANE_THROWER_COUNT, PAPER_PLANE_AREA_WIDTH_PX, PAPER_PLANE_AREA_HEIGHT_PX,
  PAPER_PLANE_MIN_SPACING,
  PAPER_PLANE_FLY_DIST_MIN, PAPER_PLANE_FLY_DIST_RANGE,
  PAPER_PLANE_FLY_SPEED, PAPER_PLANE_ARC_HEIGHT, PAPER_PLANE_SIDE_DRIFT_MAX,
  PAPER_PLANE_WINDUP_DURATION, PAPER_PLANE_RELEASE_DURATION,
  PAPER_PLANE_PICKUP_DURATION, PAPER_PLANE_CHASE_SPEED,
  PAPER_PLANE_CHEER_BOB_HZ, PAPER_PLANE_CHEER_BOB_AMP,
  PAPER_PLANE_CHEER_FRAME_INTERVAL, PAPER_PLANE_CHASE_FRAME_INTERVAL,
} from "../constants.js";
import { createManagedPerson } from "./managedPersonUtils.js";

// Plane depths: ground-sitting planes render BELOW the y-sorted people
// band (2.0–2.99) so folks can walk over them; in-flight planes render
// above the band so they're always visible.
const PLANE_DEPTH_GROUND = 1.9;
const PLANE_DEPTH_AIR = 4;

const GREETINGS = [
  "Watch the\ndistance!", "Weeee!", "Plane\nlaunched!",
  "Got this\none!", "Flight\ntime!", "Fold it\nbetter!",
  "Again!", "Go plane\ngo!", "Nice\nform!",
];

export function createPaperPlane(scene, rng, opts) {
  const { tileX, tileY } = opts;
  const cx = tileX * TILE * SCALE;
  const cy = tileY * TILE * SCALE;
  const halfW = PAPER_PLANE_AREA_WIDTH_PX / 2;
  const halfH = PAPER_PLANE_AREA_HEIGHT_PX / 2;
  const area = {
    cx, cy,
    left:   cx - halfW,
    right:  cx + halfW,
    top:    cy - halfH,
    bottom: cy + halfH,
  };

  const throwers = [];
  const sprites = []; // owned scenery for destroy()

  // Anti-stack placement for initial thrower positions
  const placed = [];
  const minSq = PAPER_PLANE_MIN_SPACING * PAPER_PLANE_MIN_SPACING;

  for (let i = 0; i < PAPER_PLANE_THROWER_COUNT; i++) {
    let sx = 0, sy = 0;
    for (let tries = 0; tries < 30; tries++) {
      sx = rng.between(area.left + 20, area.right - 20);
      sy = rng.between(area.top + 20, area.bottom - 20);
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
      texture: `person-stand-${skinId}`,
      greeting: rng.pick(GREETINGS),
      depth: 2,
      event: "paperPlane",
      flagKey: "isPaperPlaneThrower",
    });

    // Paper plane prop. Depth switches between PLANE_DEPTH_GROUND (below
    // people so they can walk over it) and PLANE_DEPTH_AIR (above all
    // people so it's always visible mid-flight). Starts on the ground.
    const plane = scene.add
      .image(sx, sy - 6, "paper-plane")
      .setScale(SCALE)
      .setDepth(PLANE_DEPTH_GROUND);
    sprites.push(plane);

    throwers.push({
      personEntry,
      sprite,
      skinId,
      plane,
      // Throw direction + a live plane trajectory
      throwAngle: Math.random() * Math.PI * 2,
      planeX: sx,
      planeY: sy - 6,
      planeStartX: 0, planeStartY: 0,
      planeTargetX: 0, planeTargetY: 0,
      planeT: 0,
      planeDuration: 1,
      // State machine
      phase: "windup",
      phaseTimer:
        PAPER_PLANE_WINDUP_DURATION *
        (0.5 + Math.random() * 1.5), // stagger per-thrower start
      cheerPhase: Math.random() * Math.PI * 2,
      frameTimer: 0,
      frameIdx: 0,
    });
  }

  return {
    type: "paperPlane",
    bounds: { cx, cy, hw: halfW + 20, hh: halfH + 20 },
    update(dt) {
      for (const t of throwers) updateThrower(scene, area, t, dt);
    },
    destroy() {
      for (const s of sprites) s.destroy();
    },
  };
}

// ----------------------------------------------------------------------

function updateThrower(scene, area, t, dt) {
  if (t.personEntry.state !== "idle") return;
  t.phaseTimer -= dt;

  const pe = t.personEntry;
  const px = pe.sprite.x;
  const py = pe.sprite.y;

  switch (t.phase) {
    case "windup": {
      t.sprite.setTexture(`person-throw1-${t.skinId}`);
      if (t.phaseTimer <= 0) {
        // Commit to a throw direction + random distance
        t.throwAngle =
          Math.atan2(area.cy - py, area.cx - px) + (Math.random() - 0.5) * 1.2;
        const dist =
          PAPER_PLANE_FLY_DIST_MIN + Math.random() * PAPER_PLANE_FLY_DIST_RANGE;
        const drift = (Math.random() - 0.5) * 2 * PAPER_PLANE_SIDE_DRIFT_MAX;
        const perp = t.throwAngle + Math.PI / 2;
        t.planeStartX = px;
        t.planeStartY = py - 10;
        t.planeTargetX =
          px + Math.cos(t.throwAngle) * dist + Math.cos(perp) * drift;
        t.planeTargetY =
          py + Math.sin(t.throwAngle) * dist + Math.sin(perp) * drift;
        // Clamp landing inside the area so they don't run off forever
        t.planeTargetX = Phaser.Math.Clamp(
          t.planeTargetX, area.left + 10, area.right - 10,
        );
        t.planeTargetY = Phaser.Math.Clamp(
          t.planeTargetY, area.top + 10, area.bottom - 10,
        );
        const flyDist = Phaser.Math.Distance.Between(
          t.planeStartX, t.planeStartY,
          t.planeTargetX, t.planeTargetY,
        );
        t.planeDuration = Math.max(0.4, flyDist / PAPER_PLANE_FLY_SPEED);
        t.planeT = 0;
        t.phase = "release";
        t.phaseTimer = PAPER_PLANE_RELEASE_DURATION;
        t.sprite.setTexture(`person-throw2-${t.skinId}`);
        // Plane is now airborne — render above people.
        t.plane.setDepth(PLANE_DEPTH_AIR);
      }
      break;
    }

    case "release": {
      // Advance plane during the brief pose
      advancePlane(t, dt);
      if (t.phaseTimer <= 0) {
        t.phase = "watching";
        t.frameTimer = 0;
        t.frameIdx = 0;
        t.sprite.setTexture(`person-wave1-${t.skinId}`);
      }
      break;
    }

    case "watching": {
      // Plane keeps flying; thrower cheers + jumps
      const landed = advancePlane(t, dt);
      t.cheerPhase += dt * PAPER_PLANE_CHEER_BOB_HZ * Math.PI * 2;
      const bob = Math.abs(Math.sin(t.cheerPhase)) * PAPER_PLANE_CHEER_BOB_AMP;
      t.sprite.y = pe.homeY - bob;
      // Update homeX/Y to current position so panic/return uses fresh spot
      pe.homeX = pe.sprite.x;
      pe.homeY = pe.sprite.y + bob; // reset bob for home tracking
      t.frameTimer += dt * 1000;
      if (t.frameTimer >= PAPER_PLANE_CHEER_FRAME_INTERVAL) {
        t.frameTimer = 0;
        t.frameIdx = 1 - t.frameIdx;
        t.sprite.setTexture(
          t.frameIdx === 0
            ? `person-wave1-${t.skinId}`
            : `person-wave2-${t.skinId}`,
        );
      }
      if (landed) {
        // Snap sprite back to home y (no more bob) and start chasing
        t.sprite.y = pe.homeY;
        t.phase = "chasing";
        t.frameTimer = 0;
        t.frameIdx = 0;
      }
      break;
    }

    case "chasing": {
      // Walk toward the landed plane using run textures
      const dx = t.planeX - pe.sprite.x;
      const dy = t.planeY - pe.sprite.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 4) {
        t.phase = "picking";
        t.phaseTimer = PAPER_PLANE_PICKUP_DURATION;
        t.sprite.setTexture(`person-stand-${t.skinId}`);
        // Plane is now in hand — render above people for the rest of the
        // pick/windup/release arc. It stays at AIR depth until it lands.
        t.plane.setDepth(PLANE_DEPTH_AIR);
        // Reset home anchor to where the pick happens — next panic
        // recovery will return them here rather than the original spot.
        pe.homeX = pe.sprite.x;
        pe.homeY = pe.sprite.y;
        if (pe.returnHome) {
          pe.returnHome.x = pe.sprite.x;
          pe.returnHome.y = pe.sprite.y;
        }
        break;
      }
      const step = PAPER_PLANE_CHASE_SPEED * dt;
      pe.sprite.x += (dx / dist) * step;
      pe.sprite.y += (dy / dist) * step;
      pe.sprite.setFlipX(dx < 0);
      t.frameTimer += dt * 1000;
      if (t.frameTimer >= PAPER_PLANE_CHASE_FRAME_INTERVAL) {
        t.frameTimer = 0;
        t.frameIdx = 1 - t.frameIdx;
        t.sprite.setTexture(
          t.frameIdx === 0
            ? `person-run1-${t.skinId}`
            : `person-run2-${t.skinId}`,
        );
      }
      break;
    }

    case "picking": {
      // Brief "pick up" pose (using the wave1 pose as a bent-reach)
      t.sprite.setTexture(`person-wave1-${t.skinId}`);
      // Hide the plane under the person while they pick it up
      t.plane.setPosition(pe.sprite.x, pe.sprite.y - 6);
      if (t.phaseTimer <= 0) {
        t.phase = "windup";
        t.phaseTimer = PAPER_PLANE_WINDUP_DURATION;
      }
      break;
    }
  }
}

// Advance the plane along its parabolic arc. Returns true once it has
// landed (t.planeT reached 1), and positions t.plane at its resting spot.
function advancePlane(t, dt) {
  if (t.planeT >= 1) return true;
  t.planeT += dt / t.planeDuration;
  const tt = Math.min(1, t.planeT);
  const x = t.planeStartX + (t.planeTargetX - t.planeStartX) * tt;
  const baseY = t.planeStartY + (t.planeTargetY - t.planeStartY) * tt;
  const arc = PAPER_PLANE_ARC_HEIGHT * Math.sin(Math.PI * tt);
  const py = baseY - arc;
  t.planeX = x;
  t.planeY = tt >= 1 ? baseY : py;
  t.plane.setPosition(x, py);
  // Rotate the plane to face its flight direction
  t.plane.setRotation(t.throwAngle + Math.PI / 2); // texture points "up" by default
  if (tt >= 1) {
    // Landed — drop the plane behind the y-sorted people so they can walk over it.
    t.plane.setDepth(PLANE_DEPTH_GROUND);
    return true;
  }
  return false;
}
