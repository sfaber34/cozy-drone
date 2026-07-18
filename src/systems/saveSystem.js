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
// overlaid arrays. Farm-field TRACTORS are the one exception: like town
// cars, they're persistently destructible (a wrecked tractor should stay
// wrecked), so their alive/hp/driving-phase state is saved explicitly too
// (see getFarmTractors below) rather than left to reset with the rest of
// the ambient choreography.
//
// Foolproofing: versioned payload + array-length integrity checks. Any
// parse error or mismatch abandons the save and the game starts a fresh
// mission instead of applying a half-valid state.

const SAVE_KEY = "cozy-drone-save";
const SAVE_VERSION = 5; // bumped: cannonHits persisted for people/animals/cars/bikers (animals' dead encoding changed 0->null)
const AUTOSAVE_INTERVAL_MS = 5000;

// Set true by restartMission() so the beforeunload/pagehide autosave that
// fires DURING the restart reload can't resurrect the save we just cleared.
// This was the pause-menu-restart bug: mid-flight, canSave() is true, so
// the unload handler re-wrote the in-flight save right after clearSave(),
// and the reloaded game previewed the drone at that position instead of
// resetting to the runway. (The briefing-modal restart dodged this only
// because it runs during the intro, when canSave() is already false.)
let restarting = false;

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

const SKIP_BRIEFING_KEY = "cozy-drone-skip-briefing";

// Set right before a restart-triggered page reload (pause menu, or the
// briefing/victory screens' own restart buttons) so the next load can
// skip straight past the mission-briefing text — see briefingModal.js's
// `minimal` mode. The player already explicitly confirmed the restart;
// rereading the briefing at that point is just friction.
export function markSkipBriefing() {
  try {
    localStorage.setItem(SKIP_BRIEFING_KEY, "1");
  } catch (e) {
    /* storage unavailable — next load just shows the full briefing */
  }
}

// Read-and-clear so this only ever applies to the one load immediately
// following a restart, never lingering into later fresh sessions.
export function consumeSkipBriefing() {
  try {
    const v = localStorage.getItem(SKIP_BRIEFING_KEY) === "1";
    if (v) localStorage.removeItem(SKIP_BRIEFING_KEY);
    return v;
  } catch (e) {
    return false;
  }
}

// THE one and only "restart mission" action. Every restart entry point
// (mission-briefing modal, victory screen, ESC pause menu) must call this
// — do NOT re-inline these steps, or the paths drift apart and one ends up
// broken (which is exactly what happened before this was centralized).
//
// Wipes the save, flags the next load to skip the briefing modal (so the
// reload drops straight onto the runway + intro cutscene, no interstitial),
// then hard-reloads for a guaranteed-clean slate — every scene, RNG,
// texture, and audio element rebuilt from scratch, exactly like a manual
// browser refresh. The reload itself tears down all audio, so callers do
// NOT need to stop sounds first.
export function restartMission() {
  // Block the unload autosave first — otherwise beforeunload/pagehide
  // fires during the reload below and re-saves the game we just cleared.
  restarting = true;
  clearSave();
  markSkipBriefing();
  window.location.reload();
}

function isPersonDead(p) {
  return p.state === "ghost" || p.state === "gone";
}

// Flattened across every farmField set piece, in scene.setPieces order —
// same pattern as scene.townCars: deterministic world regen means this
// list's order (and length) reproduces exactly given the same seed.
function getFarmTractors(scene) {
  const list = [];
  for (const sp of scene.setPieces || []) {
    if (sp.type === "farmField" && sp.tractors) list.push(...sp.tractors);
  }
  return list;
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
    // building. cannonHits is the cannon's separate multi-hit-to-kill
    // counter (2 hits for people/animals/bikers, 4 for cars) — without
    // saving it, a person hit once by the cannon (not yet dead) forgets
    // that hit on restore and silently needs a fresh 2 hits.
    people: scene.people.map((p) => {
      if (isPersonDead(p)) return 0;
      const x = p.state === "hiding" ? p.homeX : p.sprite.x;
      const y = p.state === "hiding" ? p.homeY : p.sprite.y;
      return [Math.round(x), Math.round(y), p.skinId, p.cannonHits || 0];
    }),
    // Dead -> null (distinct from a live animal with 0 cannon hits).
    animals: scene.animals.map((a) =>
      a.state === "dead" ? null : a.cannonHits || 0,
    ),
    // currentNode/targetNode are saved verbatim (not re-derived from
    // position on restore): town cars are strictly grid-following — every
    // frame's movement assumes the car is travelling in a straight line
    // between exactly these two nodes. Re-guessing "nearest node" from a
    // mid-transit (x,y) instead would pick the wrong node whenever the car
    // is more than halfway to its target, snapping its logical position
    // to the wrong intersection while the sprite stays off that node —
    // the car then drives off the road toward an unrelated neighbor.
    cars: scene.townCars.map((car) => [
      car.alive ? 1 : 0,
      Math.round(car.sprite.x),
      Math.round(car.sprite.y),
      Math.round(car.currentNode.x),
      Math.round(car.currentNode.y),
      car.targetNode
        ? [Math.round(car.targetNode.x), Math.round(car.targetNode.y)]
        : null,
      // Rotation is set only while driving (setRotation(moveAngle + PI/2))
      // and never touched again once destroyed — a wrecked sprite keeps
      // whatever angle it died at forever. A freshly-created restore
      // sprite defaults to rotation 0, so without saving this a wrecked
      // horizontal car would visibly snap to the vertical orientation.
      car.sprite.rotation,
      // Cannon hits (4 to destroy) — a car damaged but not yet destroyed
      // shows a "-damaged" texture; without saving the count, restore
      // would silently heal it back to a pristine, undamaged car.
      car.cannonHits || 0,
    ]),
    bikers: scene.dirtBikers.map((bk) =>
      bk.alive
        ? [Math.round(bk.sprite.x), Math.round(bk.sprite.y), bk.cannonHits || 0]
        : 0,
    ),
    buildings: scene.buildings.map((b) => b.hp),
    farmTractors: getFarmTractors(scene).map((t) => ({
      alive: t.alive,
      x: Math.round(t.sprite.x),
      y: Math.round(t.sprite.y),
      angle: t.sprite.angle,
      hp: t.hp,
      phase: t.phase,
      direction: t.direction,
      rowIndex: t.rowIndex,
      rowDir: t.rowDir,
      turnT: t.turnT,
      turnFromX: t.turnFromX,
      turnToX: t.turnToX,
      turnEdgeY: t.turnEdgeY,
      turnExitDir: t.turnExitDir,
    })),
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
  if (restarting) return; // restart in progress — see `restarting` note above
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
  const tractors = getFarmTractors(scene);
  if (save.farmTractors.length !== tractors.length)
    mismatches.push(
      `farmTractors ${save.farmTractors.length}->${tractors.length}`,
    );
  // Cross-check: at any moment in a correctly-running game, scene.kills is
  // exactly (dead people) + (dead bikers) + (passengers of dead cars) — a
  // person/car/biker kill is the only thing that ever increments it. If the
  // save's own death markers don't add up to its own saved kill count, the
  // save is internally inconsistent — applying it risks an alive person
  // silently ending up permanently unreachable (making 600/600 impossible).
  // This is computed from save data + fresh (not-yet-mutated) car.passenger
  // counts only, so it runs before any restore loop touches the scene.
  let impliedDead = 0;
  for (const rec of save.people) if (rec === 0) impliedDead++;
  for (const rec of save.bikers) if (rec === 0) impliedDead++;
  for (let i = 0; i < save.cars.length; i++) {
    if (save.cars[i][0] === 0) impliedDead += scene.townCars[i].passengers || 0;
  }
  if (impliedDead !== save.kills) {
    mismatches.push(`kills accounting ${save.kills} vs implied ${impliedDead}`);
  }
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
    } else {
      // Alive — cannonHits restores for everyone (managed or not), so
      // cannon damage progress isn't silently forgotten on resume.
      const [x, y, skinId, cannonHits] = rec;
      p.cannonHits = cannonHits;
      if (!p.managedBySetPiece) {
        // Free-roamer — restore where they were. Managed people keep
        // their regenerated set-piece spot (their choreography owns it).
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
  }

  // --- Animals (dead-ness + cannon-hit progress persist; position is ambient) ---
  for (let i = 0; i < scene.animals.length; i++) {
    const rec = save.animals[i];
    const a = scene.animals[i];
    if (rec === null) {
      a.state = "dead";
      a.sprite.setVisible(false);
    } else {
      a.cannonHits = rec;
    }
  }

  // --- Town cars ---
  for (let i = 0; i < scene.townCars.length; i++) {
    const [alive, x, y, curX, curY, target, rotation, cannonHits] =
      save.cars[i];
    const car = scene.townCars[i];
    car.sprite.setPosition(x, y);
    car.sprite.setRotation(rotation || 0);
    car.cannonHits = cannonHits || 0;
    if (!alive) {
      car.alive = false;
      car.sprite.setTexture("car-dead");
    } else {
      // Restore the exact node pair the car was driving between — not a
      // nearest-node guess from (x, y), which picks the wrong node once
      // the car is more than halfway to its target and leaves the sprite
      // off the road relative to that (wrong) node.
      car.currentNode = { x: curX, y: curY };
      car.targetNode = target ? { x: target[0], y: target[1] } : null;
      // A car cannon-hit at least once (but not yet destroyed) shows a
      // "-damaged" texture — without reapplying it, restore would show a
      // pristine car despite cannonHits (and the underlying dent) persisting.
      if (car.cannonHits > 0) {
        car.sprite.setTexture(car.tex + "-damaged");
      }
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
      const [x, y, cannonHits] = rec;
      bk.sprite.setPosition(x, y);
      bk.targetX = x;
      bk.targetY = y;
      bk.cannonHits = cannonHits || 0;
    }
  }

  // --- Buildings ---
  for (let i = 0; i < scene.buildings.length; i++) {
    applyBuildingState(scene, scene.buildings[i], save.buildings[i]);
  }

  // --- Farm tractors ---
  for (let i = 0; i < tractors.length; i++) {
    const s = save.farmTractors[i];
    const t = tractors[i];
    t.sprite.setPosition(s.x, s.y);
    t.sprite.setAngle(s.angle);
    t.hp = s.hp;
    t.alive = s.alive;
    t.phase = s.phase;
    t.direction = s.direction;
    t.rowIndex = s.rowIndex;
    t.rowDir = s.rowDir;
    t.turnT = s.turnT;
    t.turnFromX = s.turnFromX;
    t.turnToX = s.turnToX;
    t.turnEdgeY = s.turnEdgeY;
    t.turnExitDir = s.turnExitDir;
    if (!s.alive) {
      // Matches destroyTractor()'s end state — wreckage, no re-explosion.
      t.sprite.setTint(0x333333);
      t.driving = false;
      continue;
    }

    const driverDead =
      !t.driver || t.driver.state === "ghost" || t.driver.state === "gone";
    if (driverDead) {
      // Matches the game's own rule: a dead driver never returns, so the
      // tractor stays stopped forever.
      t.driving = false;
    } else {
      // Whatever the driver was doing at save time (driving normally, mid-
      // panic after dismounting, hiding in a building) isn't preserved —
      // managedBySetPiece people are intentionally left at their fresh-
      // spawn position by the loop above, and their state resets to
      // "idle". That breaks the NORMAL remount check in updateTractor(),
      // which requires the driver be physically close to the tractor: once
      // the tractor has driven on to a different field row since the
      // driver dismounted, "idle at fresh-spawn position" is nowhere near
      // "idle next to the tractor," so they'd never remount and the
      // tractor would sit stopped forever. Simplest correct resolution:
      // put a live driver straight back on the tractor and resume driving.
      t.driving = true;
      t.driver.state = "idle";
      t.driver.hideTarget = null;
      t.driver.sprite.setPosition(t.sprite.x, t.sprite.y - 2);
      t.driver.homeX = t.sprite.x;
      t.driver.homeY = t.sprite.y;
      t.driver.returnHome.x = t.sprite.x;
      t.driver.returnHome.y = t.sprite.y;
    }
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
