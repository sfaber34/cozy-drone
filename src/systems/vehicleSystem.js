import Phaser from "phaser";
import { WORLD_W, WORLD_H, TILE, SCALE } from "../constants.js";
import { steerAroundBuildings } from "./buildingSystem.js";

export function createVehicles(scene, rng) {
  // --- Town cars ---
  scene.townCars = [];
  const carNames = [
    "car-white",
    "car-black",
    "car-grey",
    "car-red",
    "car-blue",
    "car-green",
    "car-tan",
  ];

  const townRoadNodes = scene.townRoadNodes;

  for (let ci = 0; ci < 15; ci++) {
    // Start at a random intersection
    const startNode = Phaser.Utils.Array.GetRandom(townRoadNodes);
    const carTex = Phaser.Utils.Array.GetRandom(carNames);
    const passengers = Phaser.Math.Between(1, 4);
    const sprite = scene.add
      .image(startNode.x, startNode.y, carTex)
      .setScale(SCALE)
      .setDepth(2);
    scene.townCars.push({
      sprite,
      tex: carTex,
      passengers,
      alive: true,
      // Current position on road grid
      currentNode: { ...startNode },
      targetNode: null,
      speed: 40 + Math.random() * 30,
      heading: 0,
    });
  }

  // --- Dirt bikers ---
  scene.dirtBikers = [];
  for (let bi = 0; bi < 8; bi++) {
    const bx = Phaser.Math.Between(500, WORLD_W * TILE * SCALE - 500);
    const by = Phaser.Math.Between(500, WORLD_H * TILE * SCALE - 500);
    const bikeVariant = Phaser.Math.Between(0, 9);
    const sprite = scene.add
      .image(bx, by, `dirtbike-${bikeVariant}`)
      .setScale(SCALE)
      .setDepth(3);
    // Dust trail emitter reference
    scene.dirtBikers.push({
      sprite,
      bikeVariant,
      heading: Math.random() * Math.PI * 2,
      speed: 100 + Math.random() * 60,
      targetX: bx,
      targetY: by,
      retargetTimer: 0,
      bounceFrame: 0,
      bounceTimer: 0,
      dustTimer: 0,
      alive: true,
    });
  }
}

export function getAdjacentRoadNodes(scene, node) {
  // Find road intersection nodes adjacent to the given node (up/down/left/right)
  const step = scene.townRoadSpacing * scene.townRoadTile;
  const neighbors = [];
  for (const n of scene.townRoadNodes) {
    const dx = Math.abs(n.x - node.x);
    const dy = Math.abs(n.y - node.y);
    // Adjacent = exactly one step away on one axis, same on the other
    if (
      (dx < 5 && Math.abs(dy - step) < 5) ||
      (dy < 5 && Math.abs(dx - step) < 5)
    ) {
      neighbors.push(n);
    }
  }
  return neighbors;
}

export function updateTownCars(scene, dt) {
  for (const car of scene.townCars) {
    if (!car.alive) continue;

    // Pick next intersection to drive to
    if (!car.targetNode) {
      const neighbors = getAdjacentRoadNodes(scene, car.currentNode);
      if (neighbors.length === 0) continue;
      // Avoid nodes with other cars nearby
      const best = neighbors.filter((n) => {
        for (const other of scene.townCars) {
          if (other === car || !other.alive) continue;
          if (
            Phaser.Math.Distance.Between(
              n.x,
              n.y,
              other.sprite.x,
              other.sprite.y,
            ) < 30
          ) {
            return false;
          }
        }
        return true;
      });
      car.targetNode =
        best.length > 0
          ? Phaser.Utils.Array.GetRandom(best)
          : Phaser.Utils.Array.GetRandom(neighbors);
    }

    // Drive toward target node
    const tx = car.targetNode.x;
    const ty = car.targetNode.y;
    const angle = Phaser.Math.Angle.Between(
      car.sprite.x,
      car.sprite.y,
      tx,
      ty,
    );
    const dist = Phaser.Math.Distance.Between(
      car.sprite.x,
      car.sprite.y,
      tx,
      ty,
    );

    // Slow down or stop for cars and people ahead
    let speed = car.speed;
    let blocked = false;
    // Check other cars
    for (const other of scene.townCars) {
      if (other === car || !other.alive) continue;
      const d = Phaser.Math.Distance.Between(
        car.sprite.x,
        car.sprite.y,
        other.sprite.x,
        other.sprite.y,
      );
      if (d < 60) {
        const aToOther = Phaser.Math.Angle.Between(
          car.sprite.x,
          car.sprite.y,
          other.sprite.x,
          other.sprite.y,
        );
        const angleDiff = Math.abs(Phaser.Math.Angle.Wrap(aToOther - angle));
        if (angleDiff < 1.0) {
          speed = Math.min(speed, Math.max(0, (d - 30) * 0.8));
          if (d < 35) blocked = true;
        }
      }
    }
    // Check people on the road
    for (const p of scene.people) {
      if (p.state === "gone" || p.state === "hiding" || p.state === "ghost")
        continue;
      const d = Phaser.Math.Distance.Between(
        car.sprite.x,
        car.sprite.y,
        p.sprite.x,
        p.sprite.y,
      );
      if (d < 50) {
        const aToPerson = Phaser.Math.Angle.Between(
          car.sprite.x,
          car.sprite.y,
          p.sprite.x,
          p.sprite.y,
        );
        const angleDiff = Math.abs(Phaser.Math.Angle.Wrap(aToPerson - angle));
        if (angleDiff < 0.8) {
          speed = Math.min(speed, Math.max(0, (d - 25) * 0.6));
          if (d < 30) blocked = true;
        }
      }
    }
    // If blocked, reverse to previous node
    if (blocked) {
      car._blockTimer = (car._blockTimer || 0) + dt;
      if (car._blockTimer > 0.8) {
        // Reverse: swap current and target
        const prev = { ...car.currentNode };
        car.currentNode = { x: car.targetNode.x, y: car.targetNode.y };
        car.targetNode = prev;
        car._blockTimer = 0;
      }
    } else {
      car._blockTimer = 0;
    }

    if (dist > 5) {
      // Constrain movement to axis (horizontal or vertical) to stay on roads
      const dx = tx - car.sprite.x;
      const dy = ty - car.sprite.y;
      let moveAngle;
      if (Math.abs(dx) > Math.abs(dy)) {
        moveAngle = dx > 0 ? 0 : Math.PI;
      } else {
        moveAngle = dy > 0 ? Math.PI / 2 : -Math.PI / 2;
      }
      car.sprite.x += Math.cos(moveAngle) * speed * dt;
      car.sprite.y += Math.sin(moveAngle) * speed * dt;
      car.heading = moveAngle;
      car.sprite.setRotation(moveAngle + Math.PI / 2);
    } else {
      // Arrived at node
      car.currentNode = { x: car.targetNode.x, y: car.targetNode.y };
      car.targetNode = null;
    }
  }
}

export function updateDirtBikers(scene, dt, delta) {
  const worldW = WORLD_W * TILE * SCALE;
  const worldH = WORLD_H * TILE * SCALE;
  const margin = 200;

  for (const bk of scene.dirtBikers) {
    // Ghost float animation
    if (bk.isGhost) {
      if (!bk.sprite.active) continue;
      bk.sprite.y += (bk.ghostDriftY || -30) * dt;
      bk.sprite.x +=
        (bk.ghostDriftX || 0) * dt +
        Math.sin(bk.sprite.y * 0.04 + (bk.ghostWobble || 0)) * 15 * dt;
      bk.sprite.setAlpha(bk.sprite.alpha - 0.08 * dt);
      if (bk.bubble) {
        bk.bubble.setPosition(bk.sprite.x + 20, bk.sprite.y - 20);
        bk.bubble.setAlpha(bk.sprite.alpha);
      }
      if (bk.sprite.alpha <= 0) {
        bk.sprite.destroy();
        if (bk.bubble) {
          bk.bubble.destroy();
          bk.bubble = null;
        }
      }
      continue;
    }
    if (!bk.alive) continue;

    // Pick new random destination periodically
    bk.retargetTimer += dt;
    if (bk.retargetTimer > 3 + Math.random() * 4) {
      bk.retargetTimer = 0;
      bk.targetX = Phaser.Math.Between(margin, worldW - margin);
      bk.targetY = Phaser.Math.Between(margin, worldH - margin);
    }

    // Steer toward target, avoiding buildings
    const targetAngle = Phaser.Math.Angle.Between(
      bk.sprite.x,
      bk.sprite.y,
      bk.targetX,
      bk.targetY,
    );

    // Smooth turn toward target
    let diff = Phaser.Math.Angle.Wrap(targetAngle - bk.heading);
    const maxTurn = 2.0 * dt;
    bk.heading += Phaser.Math.Clamp(diff, -maxTurn, maxTurn);

    // Steer around buildings
    bk.heading = steerAroundBuildings(
      scene,
      bk.sprite.x,
      bk.sprite.y,
      bk.heading,
      dt,
    );

    // Move
    bk.sprite.x += Math.cos(bk.heading) * bk.speed * dt;
    bk.sprite.y += Math.sin(bk.heading) * bk.speed * dt;

    // Face direction of travel
    bk.sprite.setFlipX(Math.cos(bk.heading) < 0);

    // Bounce animation (riding over terrain)
    bk.bounceTimer += delta;
    if (bk.bounceTimer > 120) {
      bk.bounceTimer = 0;
      bk.bounceFrame = 1 - bk.bounceFrame;
      bk.sprite.setTexture(bk.bounceFrame === 0 ? `dirtbike-${bk.bikeVariant}` : `dirtbike2-${bk.bikeVariant}`);
    }

    // Dust trail
    bk.dustTimer += delta;
    if (bk.dustTimer > 80) {
      bk.dustTimer = 0;
      const dust = scene.add
        .image(
          bk.sprite.x - Math.cos(bk.heading) * 15,
          bk.sprite.y - Math.sin(bk.heading) * 15,
          "smoke",
        )
        .setScale(SCALE * 0.3)
        .setDepth(1)
        .setAlpha(0.4)
        .setTint(0xccaa88);
      scene.hudCam.ignore(dust);
      scene.tweens.add({
        targets: dust,
        alpha: 0,
        scale: SCALE * 0.8,
        duration: 400,
        onComplete: () => dust.destroy(),
      });
    }

    // Keep on map
    bk.sprite.x = Phaser.Math.Clamp(bk.sprite.x, margin, worldW - margin);
    bk.sprite.y = Phaser.Math.Clamp(bk.sprite.y, margin, worldH - margin);
    if (
      bk.sprite.x <= margin ||
      bk.sprite.x >= worldW - margin ||
      bk.sprite.y <= margin ||
      bk.sprite.y >= worldH - margin
    ) {
      // Redirect toward center
      bk.targetX = worldW / 2 + Phaser.Math.Between(-1000, 1000);
      bk.targetY = worldH / 2 + Phaser.Math.Between(-1000, 1000);
      bk.retargetTimer = 0;
    }
  }
}
