import Phaser from "phaser";
import {
  SCALE, MOBILE_DIALOG_SCALE,
  BUILDING_HP_SMALL, BUILDING_HP_MEDIUM, BUILDING_HP_LARGE,
  BUILDING_RADIUS_SMALL, BUILDING_RADIUS_MEDIUM, BUILDING_RADIUS_LARGE,
} from "../constants.js";
import { buildingGhostLines } from "../dialog.js";
import { playDeathSfxAt } from "./audioSystem.js";
import { tryRegisterGhostBubble } from "./ghostBubbleUtils.js";

// Initializes scene.buildings and registers the scene._addBuilding helper.
// The actual set pieces (town, farm compound, oilfield, ...) are built by
// their own factory modules and call scene._addBuilding directly.
export function createBuildings(scene, rng) {
  scene.buildings = [];
  const bldgHp = { small: BUILDING_HP_SMALL, medium: BUILDING_HP_MEDIUM, large: BUILDING_HP_LARGE };
  const bldgRadius = { small: BUILDING_RADIUS_SMALL, medium: BUILDING_RADIUS_MEDIUM, large: BUILDING_RADIUS_LARGE };

  const addBuilding = (x, y, tex, size, tint) => {
    const sprite = scene.add.image(x, y, tex).setScale(SCALE).setDepth(2);
    if (tint) sprite.setTint(tint);
    const b = {
      sprite,
      tex,
      size,
      hp: bldgHp[size],
      maxHp: bldgHp[size],
      radius: bldgRadius[size],
      x,
      y,
      destroyed: false,
      cracksSprite: null,
      fireSprites: [],
    };
    scene.buildings.push(b);
    return b;
  };

  // Store addBuilding for set-piece factories (oilfield, town, farm, ...) to use
  scene._addBuilding = addBuilding;
}

export function findNearestBuilding(scene, px, py) {
  let best = null;
  let bestDist = Infinity;
  for (const b of scene.buildings) {
    if (b.destroyed) continue;
    // Can't hide in oil wells, oil tanks, or silos
    if (b.isOilInfra || b.isOilWell || b.tex === "silo") continue;
    const d = Phaser.Math.Distance.Between(px, py, b.x, b.y);
    if (d < bestDist) {
      bestDist = d;
      best = b;
    }
  }
  return best;
}

export function killPeopleInBuilding(scene, building) {
  let ghostIdx = 0;
  for (const p of scene.people) {
    if (p.state !== "hiding") continue;
    if (p.hideTarget !== building) continue;
    const idx = ghostIdx++;
    // Stagger each ghost's appearance
    scene.time.delayedCall(idx * 300, () => {
      p.state = "ghost";
      scene.kills++;
      playDeathSfxAt(scene, building.x, building.y);
      // Spread starting positions around the building
      const spawnAngle =
        (idx / Math.max(ghostIdx, 1)) * Math.PI * 2 + Math.random() * 0.5;
      p.sprite.setPosition(
        building.x + Math.cos(spawnAngle) * 25,
        building.y + Math.sin(spawnAngle) * 25,
      );
      p.sprite.setVisible(true);
      p.sprite.setTexture("ghost");
      p.sprite.setAlpha(0.8);
      p.sprite.setDepth(13);
      // Each ghost drifts in a unique direction
      p.ghostDriftX = Math.cos(spawnAngle) * (15 + Math.random() * 25);
      p.ghostDriftY = -(20 + Math.random() * 20); // always float up, but at different speeds
      p.ghostWobbleOffset = Math.random() * Math.PI * 2;

      if (tryRegisterGhostBubble(scene, p.sprite.x, p.sprite.y)) {
        const line = Phaser.Utils.Array.GetRandom(buildingGhostLines);
        p.bubble = scene.add
          .text(p.sprite.x + 20, p.sprite.y - 20, line, {
            fontFamily: "monospace",
            fontSize: "8px",
            color: "#aaccff",
            backgroundColor: "#000000aa",
            padding: { x: 4, y: 3 },
          })
          .setScale(SCALE * 0.5 * (scene.isMobile ? MOBILE_DIALOG_SCALE : 1))
          .setDepth(14);
        scene.hudCam.ignore(p.bubble);
      }
    });
  }
}

export function isInsideBuilding(scene, px, py) {
  for (const b of scene.buildings) {
    if (b.destroyed) continue;
    if (Phaser.Math.Distance.Between(px, py, b.x, b.y) < b.radius) {
      return true;
    }
  }
  return false;
}

export function steerAroundBuildings(scene, px, py, angle, dt) {
  // Check if next position would be inside a building
  const checkDist = 40;
  const nx = px + Math.cos(angle) * checkDist;
  const ny = py + Math.sin(angle) * checkDist;
  for (const b of scene.buildings) {
    if (b.destroyed) continue;
    const d = Phaser.Math.Distance.Between(nx, ny, b.x, b.y);
    if (d < b.radius + 20) {
      // Steer perpendicular to the building
      const awayAngle = Phaser.Math.Angle.Between(b.x, b.y, px, py);
      return awayAngle;
    }
  }
  return angle;
}
