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
    // Can't hide in oil wells, oil tanks, silos, or market furniture
    if (b.isOilInfra || b.isOilWell || b.tex === "silo" || b.noHide) continue;
    const d = Phaser.Math.Distance.Between(px, py, b.x, b.y);
    if (d < bestDist) {
      bestDist = d;
      best = b;
    }
  }
  return best;
}

export function killPeopleInBuilding(scene, building) {
  // Collect all people hiding in this building, then kill them all at once
  // (same as any other multi-kill). No staggered reveals — ghosts spawn
  // simultaneously and only DEATH_SFX_MAX_CONCURRENT sounds play via the
  // normal playDeathSfxAt throttle.
  const victims = [];
  for (const p of scene.people) {
    if (p.state !== "hiding") continue;
    if (p.hideTarget !== building) continue;
    victims.push(p);
  }
  for (let i = 0; i < victims.length; i++) {
    const p = victims[i];
    p.state = "ghost";
    scene.kills++;
    playDeathSfxAt(scene, building.x, building.y);
    const spawnAngle =
      (i / Math.max(victims.length, 1)) * Math.PI * 2 + Math.random() * 0.5;
    p.sprite.setPosition(
      building.x + Math.cos(spawnAngle) * 25,
      building.y + Math.sin(spawnAngle) * 25,
    );
    p.sprite.setVisible(true);
    p.sprite.setTexture("ghost");
    p.sprite.setAlpha(0.8);
    p.sprite.setDepth(13);
    p.ghostDriftX = Math.cos(spawnAngle) * (15 + Math.random() * 25);
    p.ghostDriftY = -(20 + Math.random() * 20);
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

export function steerAroundBuildings(scene, px, py, angle, dt, excludeBuilding) {
  // Aggregate repulsion from ALL nearby buildings into a single combined
  // vector. The old approach picked the FIRST building and steered directly
  // away from it — between two buildings this caused ping-pong oscillation
  // because each frame pushed toward the opposite building. Summing
  // repulsion vectors from both sides cancels the lateral component and
  // leaves a perpendicular escape direction (sideways slip).
  //
  // The optional `excludeBuilding` is the hide target the person is
  // heading toward — they're ALLOWED to enter that one.
  let repelX = 0;
  let repelY = 0;

  // Pass 1: repulsion from buildings the person is INSIDE (strong push out)
  for (const b of scene.buildings) {
    if (b.destroyed || b === excludeBuilding) continue;
    const d = Phaser.Math.Distance.Between(px, py, b.x, b.y) || 0.001;
    if (d < b.radius) {
      const strength = (b.radius - d) / b.radius + 1; // 1..2
      repelX += ((px - b.x) / d) * strength;
      repelY += ((py - b.y) / d) * strength;
    }
  }

  // Pass 2: repulsion from buildings the LOOKAHEAD would enter
  const checkDist = 60;
  const nx = px + Math.cos(angle) * checkDist;
  const ny = py + Math.sin(angle) * checkDist;
  for (const b of scene.buildings) {
    if (b.destroyed || b === excludeBuilding) continue;
    const d = Phaser.Math.Distance.Between(nx, ny, b.x, b.y) || 0.001;
    const zone = b.radius + 25;
    if (d < zone) {
      const strength = (zone - d) / zone; // 0..1
      repelX += ((px - b.x) / d) * strength;
      repelY += ((py - b.y) / d) * strength;
    }
  }

  if (repelX === 0 && repelY === 0) return angle;

  // Blend: rotate the original angle toward the repulsion direction rather
  // than snapping to it, which prevents jittery frame-to-frame flips.
  const repelAngle = Math.atan2(repelY, repelX);
  let diff = repelAngle - angle;
  // Normalize to [-π, π]
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  // Blend up to 80% toward repulsion; mild enough to avoid hard snapping
  // but strong enough to actually escape.
  return angle + diff * 0.8;
}
