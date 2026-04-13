import Phaser from "phaser";
import {
  SCALE,
  CLUSTER_DESCENT_RATE, CLUSTER_OPEN_FRAC,
  CLUSTER_BOMBLET_COUNT, CLUSTER_BOMBLET_SPREAD_FACTOR,
  CLUSTER_FIRE_RATE,
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

// Returns the predicted ground landing point for a bomb dropped right now.
// The bomb has no horizontal velocity — it falls from the drop point while the
// drone moves forward, so the impact lands behind by speed * fallTime.
export function getClusterDropPoint(ds) {
  const fallTime = ds.altitude / CLUSTER_DESCENT_RATE;
  const rad = Phaser.Math.DegToRad(ds.angle - 90);
  return {
    x: ds.x - Math.cos(rad) * ds.speed * fallTime,
    y: ds.y - Math.sin(rad) * ds.speed * fallTime,
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

  // Bomb is released at the drone's current world position
  const sprite = scene.add
    .image(ds.x, ds.y, "cluster-bomb")
    .setScale(SCALE)
    .setDepth(9);
  scene.hudCam.ignore(sprite);

  // Ground shadow beneath the bomb's landing point
  const landPt = getClusterDropPoint(ds);
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

    // Bomb sprite shrinks as it falls (visual descent cue)
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

  // Remaining fall time determines how long bomblets take to reach the ground
  const remainFallMs = (bomb.altitude / CLUSTER_DESCENT_RATE) * 1000;

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

    const delay = i * 25; // stagger for cascade effect
    const duration = remainFallMs + delay * 0.5;

    scene.tweens.add({
      targets: bl,
      x: targetX,
      y: targetY,
      scale: SCALE * 0.35,
      duration,
      delay,
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
