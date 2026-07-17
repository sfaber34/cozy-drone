import { SCALE } from "../constants.js";
import { countTotalPeople } from "./peopleSystem.js";

// Save / load system — freeze-and-resume snapshots in localStorage.
//
// Design: the world is regenerated from the SAVED SEED (same set pieces,
// buildings, and vehicle/people counts in the same array order — see the
// rng-determinism notes in vehicleSystem.createVehicles), then a compact
// per-entity overlay is applied on top: positions for movable entities,
// alive/dead flags, building hp, drone state, kill count and mission
// clock. Entity identity is the array index, which is stable because
// world generation consumes the seeded rng a deterministic number of
// times before each entity is pushed.
//
// Set-piece internal choreography (camel race progress, soccer ball,
// concert notes, …) intentionally restarts fresh — it's ambient and holds
// no mission progress. Everything that counts toward FREEDOMS (people,
// car passengers, bikers, people hiding in buildings) lives in the
// overlaid arrays.
//
// Foolproofing: versioned payload + array-length integrity checks. Any
// parse error or mismatch abandons the save and the game starts a fresh
// mission instead of applying a half-valid state.

const SAVE_KEY = "cozy-drone-save";
const SAVE_VERSION = 1;
const AUTOSAVE_INTERVAL_MS = 5000;

export function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const save = JSON.parse(raw);
    if (!save || save.v !== SAVE_VERSION || !save.seed || !save.drone)
      return null;
    return save;
  } catch (e) {
    return null;
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch (e) {
    /* storage unavailable — nothing to clear */
  }
}

function isPersonDead(p) {
  return p.state === "ghost" || p.state === "gone";
}

function captureSave(scene) {
  const ds = scene.droneState;
  return {
    v: SAVE_VERSION,
    seed: scene._worldSeed,
    savedAt: Date.now(),
    elapsedMs: scene.missionStartTime
      ? Date.now() - scene.missionStartTime
      : 0,
    kills: scene.kills,
    selectedWeapon: scene.selectedWeapon,
    drone: {
      x: Math.round(ds.x),
      y: Math.round(ds.y),
      angle: Math.round(ds.angle),
      speed: Math.round(ds.speed),
      altitude: Math.round(ds.altitude),
      flightState: scene.flightState,
      touchedRunway: !!scene._touchedRunway,
    },
    // Dead entries collapse to 0 — their ghost anim has played; all that
    // matters is that they stay gone. Hiding people are saved at their
    // home spot so they restore visible on open ground, not inside a
    // building.
    people: scene.people.map((p) => {
      if (isPersonDead(p)) return 0;
      const x = p.state === "hiding" ? p.homeX : p.sprite.x;
      const y = p.state === "hiding" ? p.homeY : p.sprite.y;
      return [Math.round(x), Math.round(y), p.skinId];
    }),
    animals: scene.animals.map((a) => (a.state === "dead" ? 0 : 1)),
    cars: scene.townCars.map((car) => [
      car.alive ? 1 : 0,
      Math.round(car.sprite.x),
      Math.round(car.sprite.y),
    ]),
    bikers: scene.dirtBikers.map((bk) =>
      bk.alive ? [Math.round(bk.sprite.x), Math.round(bk.sprite.y)] : 0,
    ),
    buildings: scene.buildings.map((b) => b.hp),
  };
}

// Save only when the world is in a coherent, resumable moment.
function canSave(scene) {
  return (
    scene._worldInitDone &&
    !scene.introPlaying &&
    !scene.briefingActive &&
    !scene.victoryActive &&
    scene.flightState !== "crashed" &&
    // Never clobber a good save with a not-yet-restored world
    !(scene._restoreRequested && !scene._restoreDone)
  );
}

export function saveNow(scene) {
  if (!canSave(scene)) return;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(captureSave(scene)));
  } catch (e) {
    /* storage full/unavailable — skip this autosave */
  }
}

export function initAutosave(scene) {
  scene.time.addEvent({
    delay: AUTOSAVE_INTERVAL_MS,
    loop: true,
    callback: () => saveNow(scene),
  });
  // Tab switch / minimize / close — grab a final snapshot while we can.
  const onVisibility = () => {
    if (document.visibilityState === "hidden") saveNow(scene);
  };
  const onPageHide = () => saveNow(scene);
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("pagehide", onPageHide);
  window.addEventListener("beforeunload", onPageHide);
  scene.events.once("shutdown", () => {
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("pagehide", onPageHide);
    window.removeEventListener("beforeunload", onPageHide);
  });
}

// Apply a save on top of a freshly generated world. Returns false if the
// save doesn't line up with the regenerated world (caller falls back to a
// fresh mission).
export function applySave(scene, save) {
  if (!save) return false;
  const mismatches = [];
  if (save.people.length !== scene.people.length)
    mismatches.push(`people ${save.people.length}->${scene.people.length}`);
  if (save.animals.length !== scene.animals.length)
    mismatches.push(`animals ${save.animals.length}->${scene.animals.length}`);
  if (save.cars.length !== scene.townCars.length)
    mismatches.push(`cars ${save.cars.length}->${scene.townCars.length}`);
  if (save.bikers.length !== scene.dirtBikers.length)
    mismatches.push(`bikers ${save.bikers.length}->${scene.dirtBikers.length}`);
  if (save.buildings.length !== scene.buildings.length)
    mismatches.push(
      `buildings ${save.buildings.length}->${scene.buildings.length}`,
    );
  if (mismatches.length > 0) {
    console.warn(
      `[saveSystem] Save/world mismatch, discarding save: ${mismatches.join(", ")} (seed=${save.seed})`,
    );
    return false;
  }

  // --- People ---
  for (let i = 0; i < scene.people.length; i++) {
    const rec = save.people[i];
    const p = scene.people[i];
    if (rec === 0) {
      // Dead — same end state the ghost anim leaves behind
      if (p.bubble) {
        p.bubble.destroy();
        p.bubble = null;
      }
      if (p.carriedGoods) {
        p.carriedGoods.destroy();
        p.carriedGoods = null;
      }
      p.sprite.destroy();
      p.state = "gone";
    } else if (!p.managedBySetPiece) {
      // Alive free-roamer — restore where they were. Managed people keep
      // their regenerated set-piece spot (their choreography owns them).
      const [x, y, skinId] = rec;
      p.sprite.setPosition(x, y);
      p.homeX = x;
      p.homeY = y;
      // Wanderer spawn placement retries depend on live drone position,
      // so wanderer skins can diverge from the saved run — restore them.
      if (!p.teamSkin && skinId !== p.skinId) {
        p.skinId = skinId;
        p.sprite.setTexture(`person-stand-${skinId}`);
      }
    }
  }

  // --- Animals (position is ambient — only dead-ness persists) ---
  for (let i = 0; i < scene.animals.length; i++) {
    if (save.animals[i] === 0) {
      const a = scene.animals[i];
      a.state = "dead";
      a.sprite.setVisible(false);
    }
  }

  // --- Town cars ---
  for (let i = 0; i < scene.townCars.length; i++) {
    const [alive, x, y] = save.cars[i];
    const car = scene.townCars[i];
    car.sprite.setPosition(x, y);
    if (!alive) {
      car.alive = false;
      car.sprite.setTexture("car-dead");
    } else {
      // Re-anchor to the road grid: nearest intersection becomes the
      // current node; targetNode null makes updateTownCars pick a fresh
      // destination next frame.
      let best = null;
      let bestD = Infinity;
      for (const n of scene.townRoadNodes || []) {
        const d = (n.x - x) * (n.x - x) + (n.y - y) * (n.y - y);
        if (d < bestD) {
          bestD = d;
          best = n;
        }
      }
      if (best) car.currentNode = { ...best };
      car.targetNode = null;
    }
  }

  // --- Dirt bikers ---
  for (let i = 0; i < scene.dirtBikers.length; i++) {
    const rec = save.bikers[i];
    const bk = scene.dirtBikers[i];
    if (rec === 0) {
      bk.alive = false;
      bk.sprite.setVisible(false);
    } else {
      const [x, y] = rec;
      bk.sprite.setPosition(x, y);
      bk.targetX = x;
      bk.targetY = y;
    }
  }

  // --- Buildings ---
  for (let i = 0; i < scene.buildings.length; i++) {
    applyBuildingState(scene, scene.buildings[i], save.buildings[i]);
  }

  // --- Drone ---
  const ds = scene.droneState;
  const d = save.drone;
  ds.x = d.x;
  ds.y = d.y;
  ds.angle = d.angle;
  ds.speed = d.speed;
  ds.altitude = d.altitude;
  scene.flightState = d.flightState;
  scene._touchedRunway = d.touchedRunway;
  scene.drone.setPosition(ds.x, ds.y);
  scene.drone.setAngle(ds.angle);
  scene.cameras.main.centerOn(ds.x, ds.y);

  // --- Mission progress ---
  scene.kills = save.kills;
  scene.selectedWeapon = save.selectedWeapon || 1;
  scene.missionStartTime = Date.now() - (save.elapsedMs || 0);
  scene.totalPeople = countTotalPeople(scene);

  return true;
}

// Reproduce the visual/logical state a building reaches at the given hp —
// mirrors the damage/destruction handling in missileSystem.missileImpact.
function applyBuildingState(scene, b, hp) {
  if (hp >= b.maxHp) return;
  b.hp = hp;

  if (hp > 0) {
    // Damaged: darken, cracks, fire below half hp
    const dmgFrac = hp / b.maxHp;
    const tintVal = Math.floor(0x88 + 0x77 * dmgFrac);
    b.sprite?.setTint((tintVal << 16) | (tintVal << 8) | tintVal);
    if (!b.cracksSprite) {
      b.cracksSprite = scene.add
        .image(b.x, b.y, "cracks")
        .setScale(SCALE)
        .setDepth(3)
        .setAlpha(0.6);
      scene.hudCam.ignore(b.cracksSprite);
    }
    if (hp <= b.maxHp / 2) {
      const fire = scene.add
        .image(b.x, b.y, "fire")
        .setScale(SCALE)
        .setDepth(3);
      scene.hudCam.ignore(fire);
      b.fireSprites.push(fire);
      scene.tweens.add({
        targets: fire,
        alpha: { from: 1, to: 0.5 },
        scaleX: { from: SCALE, to: SCALE * 0.8 },
        scaleY: { from: SCALE, to: SCALE * 1.2 },
        duration: 300,
        yoyo: true,
        repeat: -1,
      });
    }
    return;
  }

  // Destroyed
  b.destroyed = true;
  if (b.sprite) {
    if (b.isOilWell) {
      b.sprite.setTexture("oil-well-burn");
      b.sprite.clearTint();
      if (b.wellRef) b.wellRef.alive = false;
    } else if (b.isOilInfra) {
      b.sprite.setTint(0x333333);
    } else {
      b.sprite.setTexture("rubble");
      b.sprite.setTint(0x888888);
    }
  }
  if (b.isOilInfra) {
    // Oil infrastructure burns forever with black smoke
    const permFire = scene.add
      .image(b.x, b.y - 5, "fire")
      .setScale(SCALE * 1.5)
      .setDepth(3);
    scene.hudCam.ignore(permFire);
    scene.tweens.add({
      targets: permFire,
      scaleX: { from: SCALE * 1.2, to: SCALE * 1.8 },
      scaleY: { from: SCALE * 1.5, to: SCALE * 2.0 },
      alpha: { from: 1, to: 0.7 },
      duration: 400,
      yoyo: true,
      repeat: -1,
    });
    scene.time.addEvent({
      delay: 300,
      loop: true,
      callback: () => {
        const smoke = scene.add
          .image(b.x + (Math.random() * 20 - 10), b.y - 10, "smoke")
          .setScale(SCALE * 0.6)
          .setDepth(12)
          .setAlpha(0.7)
          .setTint(0x222222);
        scene.hudCam.ignore(smoke);
        scene.tweens.add({
          targets: smoke,
          y: b.y - 80 - Math.random() * 40,
          x: smoke.x + (Math.random() * 40 - 20),
          scale: SCALE * (1.5 + Math.random()),
          alpha: 0,
          duration: 1500 + Math.random() * 500,
          onComplete: () => smoke.destroy(),
        });
      },
    });
  }
}
