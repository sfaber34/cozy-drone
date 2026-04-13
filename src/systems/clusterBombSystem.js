import Phaser from "phaser";
import {
  SCALE,
  CLUSTER_DESCENT_RATE, CLUSTER_OPEN_FRAC,
  CLUSTER_BOMBLET_COUNT, CLUSTER_BOMBLET_SPREAD_FACTOR,
  CLUSTER_FIRE_RATE, CLUSTER_DROP_FACTOR, CLUSTER_BOMBLET_FALL_TIME,
  CLUSTER_OPEN_SHAKE_DURATION, CLUSTER_OPEN_SHAKE_INTENSITY,
  EXPLOSION_VOLUME,
} from "../constants.js";
import { playSfxAt } from "./audioSystem.js";
import { cannonImpact } from "./cannonSystem.js";

export function initClusterBomb(scene) {
  scene.clusterBombs = [];
  scene.clusterFireTimer = 0;
  // Reticle scale is set dynamically in updateClusterReticle based on altitude
  scene.clusterReticle = scene.add
    .image(0, 0, "cluster-reticle")
    .setScale(1)
    .setDepth(8)
    .setVisible(false);
}

// Returns the impact point: straight behind the drone, with a small lateral
// offset when turning. The lateral component uses circular-arc physics:
// r*(1 - cos(θ)) perpendicular to the heading, where r = speed/ω and θ = ω*fallTime.
export function getClusterDropPoint(ds) {
  const fallTime = ds.altitude / CLUSTER_DESCENT_RATE;
  const rad  = Phaser.Math.DegToRad(ds.angle - 90);
  const dist = ds.speed * fallTime * CLUSTER_DROP_FACTOR;

  // Base: straight behind
  const baseX = ds.x - Math.cos(rad) * dist;
  const baseY = ds.y - Math.sin(rad) * dist;

  const turnRate = ds.currentTurnRate || 0;
  if (Math.abs(turnRate) < 0.01 || ds.speed < 1) {
    return { x: baseX, y: baseY };
  }

  // Lateral drift: turning right → bomb shifts left, turning left → bomb shifts right
  const omega       = Phaser.Math.DegToRad(Math.abs(turnRate)); // rad/s
  const theta       = omega * fallTime;                          // angle swept during fall
  const r           = ds.speed / omega;                          // turn radius (px)
  const lateralDist = r * (1 - Math.cos(theta));

  // Left direction = (sin(rad), -cos(rad)) in Phaser's y-down coords
  // Right turn (sign +1) → drift left; left turn (sign -1) → drift right
  const sign = Math.sign(turnRate);
  return {
    x: baseX + sign * Math.sin(rad) * lateralDist,
    y: baseY - sign * Math.cos(rad) * lateralDist,
  };
}

export function updateClusterReticle(scene, ds) {
  if (ds.altitude <= 0) {
    scene.clusterReticle.setVisible(false);
    return;
  }
  const drop = getClusterDropPoint(ds);
  scene.clusterReticle.setPosition(drop.x, drop.y);
  // Spread = FACTOR * altitude at opening (30% of current altitude)
  const openAlt = ds.altitude * (1 - CLUSTER_OPEN_FRAC);
  const spread = CLUSTER_BOMBLET_SPREAD_FACTOR * openAlt;
  scene.clusterReticle.setScale(spread / 13); // 13px = circle radius in texture
  scene.clusterReticle.setVisible(true);
  const pulse = 0.5 + Math.sin(scene.time.now * 0.006) * 0.4;
  scene.clusterReticle.setAlpha(pulse);
}

export function fireClusterBomb(scene) {
  const ds = scene.droneState;
  if (ds.altitude <= 0) return;

  const landPt = getClusterDropPoint(ds);

  // Bomb originates at the drone, drifts to the impact point as it falls
  const sprite = scene.add
    .image(ds.x, ds.y, "cluster-bomb")
    .setScale(SCALE)
    .setAngle(ds.angle)  // face same direction as the drone
    .setDepth(9);
  scene.hudCam.ignore(sprite);

  // Shadow sits at the impact point from the start (shows where it will open)
  const shadow = scene.add
    .image(landPt.x, landPt.y, "cluster-bomb")
    .setScale(SCALE * 0.6)
    .setDepth(1.5)
    .setAlpha(0.15)
    .setTint(0x000000);
  scene.hudCam.ignore(shadow);

  scene.clusterBombs.push({
    sprite,
    shadow,
    launchX: ds.x,
    launchY: ds.y,
    landX: landPt.x,
    landY: landPt.y,
    altitude: ds.altitude,
    launchAlt: ds.altitude,
    opened: false,
  });

  playSfxAt(scene, "explosion", ds.x, ds.y, EXPLOSION_VOLUME * 0.12);
}

export function updateClusterBombs(scene, dt) {
  for (let i = scene.clusterBombs.length - 1; i >= 0; i--) {
    const b = scene.clusterBombs[i];

    b.altitude = Math.max(0, b.altitude - CLUSTER_DESCENT_RATE * dt);
    // altFrac: 1.0 at launch, 0.0 at ground
    const altFrac = b.launchAlt > 0 ? b.altitude / b.launchAlt : 0;

    // Slide bomb from launch point to land point; reaches land point exactly at opening
    // progress: 0 at drop, 1 when altFrac hits (1 - CLUSTER_OPEN_FRAC)
    const progress = Math.min(1, (1 - altFrac) / CLUSTER_OPEN_FRAC);
    b.sprite.x = b.launchX + (b.landX - b.launchX) * progress;
    b.sprite.y = b.launchY + (b.landY - b.launchY) * progress;

    // Bomb shrinks as it falls — starts large (close to drone/camera), small near ground
    b.sprite.setScale(SCALE * (0.25 + altFrac * 0.75));

    // Shadow grows and darkens as bomb approaches ground
    b.shadow.setScale(SCALE * (0.4 + (1 - altFrac) * 0.6));
    b.shadow.setAlpha(0.1 + (1 - altFrac) * 0.35);

    // Open at 70% of descent (altFrac <= 0.30)
    if (!b.opened && altFrac <= (1 - CLUSTER_OPEN_FRAC)) {
      b.opened = true;
      openClusterBomb(scene, b, altFrac);
    }

    if (b.altitude <= 0) {
      b.sprite.destroy();
      b.shadow.destroy();
      scene.clusterBombs.splice(i, 1);
    }
  }
}

function openClusterBomb(scene, bomb, altFrac) {
  const x = bomb.sprite.x;
  const y = bomb.sprite.y;
  const openScale = SCALE * (0.25 + altFrac * 0.75);

  bomb.sprite.setVisible(false);

  // Split casing into two halves flying apart
  for (let side = -1; side <= 1; side += 2) {
    const half = scene.add
      .image(x, y, "cluster-casing")
      .setScale(openScale)
      .setDepth(10);
    scene.hudCam.ignore(half);
    scene.tweens.add({
      targets: half,
      x: x + side * 30,
      y: y - 12,
      angle: side * 100,
      alpha: 0,
      scale: openScale * 0.4,
      duration: 550,
      ease: "Quad.easeOut",
      onComplete: () => half.destroy(),
    });
  }

  // All bomblets released simultaneously, travel time controlled by knob
  const remainFallMs = CLUSTER_BOMBLET_FALL_TIME * 1000;

  const count = CLUSTER_BOMBLET_COUNT;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    // Spread radius = factor * altitude at opening time
    const spread = CLUSTER_BOMBLET_SPREAD_FACTOR * bomb.altitude;
    const dist = Math.sqrt(Math.random()) * spread; // sqrt for even area distribution
    const targetX = bomb.landX + Math.cos(angle) * dist;
    const targetY = bomb.landY + Math.sin(angle) * dist;

    const bl = scene.add
      .image(x, y, "bomblet")
      .setScale(openScale)
      .setDepth(10);
    scene.hudCam.ignore(bl);

    scene.tweens.add({
      targets: bl,
      x: targetX,
      y: targetY,
      scale: SCALE * 0.35,
      duration: remainFallMs,
      ease: "Quad.easeIn",
      onComplete: () => {
        bl.destroy();
        bombletImpact(scene, targetX, targetY);
      },
    });
  }

  playSfxAt(scene, "explosion", x, y, EXPLOSION_VOLUME * 0.45);
  scene.cameras.main.shake(CLUSTER_OPEN_SHAKE_DURATION, CLUSTER_OPEN_SHAKE_INTENSITY);
}

// Each bomblet deals cannon-equivalent damage (2 hits to kill people/animals).
function bombletImpact(scene, x, y) {
  cannonImpact(scene, x, y);
}
