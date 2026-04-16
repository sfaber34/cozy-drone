import Phaser from "phaser";
import {
  WORLD_W,
  WORLD_H,
  TILE,
  SCALE,
  DRONE_TURN_RATE,
  DRONE_ACCEL,
  DRONE_MIN_SPEED_AIRBORNE,
  DRONE_ALT_RATE,
  DRONE_TAKEOFF_SPEED,
  DRONE_ZOOM_ALT_THRESHOLD,
  DRONE_ZOOM_MIN,
  DRONE_ZOOM_MAX,
  DRONE_MAX_SPEED,
  DRONE_MAX_ALT,
  DRONE_MIN_ALT_OFF_RUNWAY,
  DRONE_SHADOW_OPACITY,
  VICTORY_KILL_THRESHOLD,
  CAMERA_FOLLOW_LERP,
  INTRO_TARGET_RIGHT_PX,
  INTRO_ZOOM_MAX,
  INTRO_ZOOM_OUT_DURATION_MS,
} from "../constants.js";
import { createWater, WATER_BOUNDS } from "../systems/waterSystem.js";

import {
  initAudio,
  updateEngineSound,
  updateCannonFiringSound,
} from "../systems/audioSystem.js";
import { playIntroCutscene } from "../systems/introSystem.js";
import { showBriefingModal } from "../systems/briefingModal.js";
import { createBuildings } from "../systems/buildingSystem.js";
import { createAnimals, updateAnimals } from "../systems/animalSystem.js";
import { fireMissile, updateMissiles } from "../systems/missileSystem.js";
import {
  createPeople,
  updatePeople,
  countTotalPeople,
} from "../systems/peopleSystem.js";
import {
  createVehicles,
  updateTownCars,
  updateDirtBikers,
} from "../systems/vehicleSystem.js";
import { isOnRunway } from "../systems/droneSystem.js";
import { startVictory } from "../systems/victoryCutscene.js";
// Set-piece factories — each returns { type, bounds, update, destroy }.
// Airfield is special-cased (runs at intro, fixed position). Everything else
// goes through the placer in setPieceRegistry so random spawns don't overlap.
import { createAirfield } from "../systems/airfieldSystem.js";
import { createMinimap, updateMinimap } from "../systems/minimapSystem.js";
import {
  placeSetPieces,
  reservedRectFromBounds,
} from "../systems/setPieceRegistry.js";
import { generatePersonSkinsAsync } from "../textures/personTextures.js";
import {
  CANNON_FIRE_RATE,
  CLUSTER_FIRE_RATE,
  MISSILE_FIRE_RATE,
} from "../constants.js";
import {
  initCannon,
  updateCannonReticle,
  fireCannon,
  updateCannonBullets,
} from "../systems/cannonSystem.js";
import {
  initClusterBomb,
  updateClusterReticle,
  fireClusterBomb,
  updateClusterBombs,
} from "../systems/clusterBombSystem.js";

export class GameScene extends Phaser.Scene {
  constructor() {
    super("Game");
  }

  create() {
    // --- Biome ground layer ---
    // Map zones (in tile coords):
    //   Town:  NW quadrant (0 - WORLD_W/2, 0 - WORLD_H/2)
    //   Farm:  NE quadrant (WORLD_W/2 - WORLD_W, 0 - WORLD_H/2)
    //   Desert: bottom half (0 - WORLD_W, WORLD_H/2 - WORLD_H) — runway area
    // Desert ground is the flat background color (#d2b48c) set in main.js
    // No ground tiles needed — props/buildings sit directly on it
    // Per-run seed so building/set-piece placement varies each refresh.
    // Texture RNGs (personSkins, props, etc.) have their own fixed seeds
    // so sprite appearance stays consistent — only world layout varies.
    const rng = new Phaser.Math.RandomDataGenerator([
      `desert-${Date.now()}-${Math.floor(Math.random() * 1e9)}`,
    ]);

    // --- Water moat (drawn at depth 0, below all map content) ---
    createWater(this);

    // --- Desert props (scattered across the entire map) ---
    const worldPxW = WORLD_W * TILE * SCALE;
    const worldPxH = WORLD_H * TILE * SCALE;
    const desertProps = [
      "rock",
      "rock2",
      "rock3",
      "rock4",
      "brush",
      "bush2",
      "bush3",
      "tumbleweed",
      "skull",
      "bones",
      "pottery",
      "deadtree",
      "palmstump",
    ];
    for (let i = 0; i < 2500; i++) {
      const x = Math.random() * worldPxW;
      const y = Math.random() * worldPxH;
      const tex = desertProps[Math.floor(Math.random() * desertProps.length)];
      this.add.image(x, y, tex).setScale(SCALE).setDepth(1);
    }

    // Initialize shared entity arrays early so damage systems + setpieces
    // can safely push/iterate even while person textures are still loading.
    this.people = [];
    this.animals = [];
    this.setPieces = [];
    this.buildings = [];

    // --- Airfield renders immediately so the drone can spawn on the runway
    //     during the intro cutscene. It doesn't use any person-skin textures. ---
    const airfield = createAirfield(this, rng, { tileX: 80, tileY: 150 });
    this.setPieces.push(airfield);
    const rwBottom = this.runway.bottom;
    const rwX = this.runway.x;

    // Everything else (town, farm compound, flock, oilfield, wedding, soccer,
    // chicken fight, camel race, rock fight, farm field, concert, tire fire,
    // plus createPeople / createVehicles) references the 200 person-skin
    // textures, so we defer it until those finish generating in the background.
    // See tryDeferredWorldInit below.
    this._deferredWorldRng = rng;
    this._personSkinsReady = false;
    this._worldInitDone = false;

    // Kick off async skin generation — yields to the event loop between
    // chunks so the briefing modal renders immediately.
    generatePersonSkinsAsync(this, () => {
      this._personSkinsReady = true;
      tryDeferredWorldInit(this);
    });

    // --- Drone shadow ---
    this.droneShadow = this.add
      .image(0, 0, "drone-shadow")
      .setScale(SCALE)
      .setDepth(3)
      .setAlpha(DRONE_SHADOW_OPACITY);
    this.dronePropShadow = this.add
      .image(0, 0, "drone-prop-shadow1")
      .setScale(SCALE)
      .setDepth(3)
      .setAlpha(DRONE_SHADOW_OPACITY);

    // --- Drone (starts at bottom of runway) ---
    this.drone = this.add
      .image(rwX, rwBottom - 80, "drone")
      .setScale(SCALE)
      .setDepth(20);

    // Propeller animation timer
    this.propFrame = 0;
    this.propTimer = 0;

    // Flight state: "grounded" | "airborne" | "crashed"
    this.flightState = "grounded";

    // Drone state
    this.droneState = {
      x: this.drone.x,
      y: this.drone.y,
      angle: 0, // degrees, 0 = up/north
      speed: 0, // start stationary on runway
      altitude: 0, // on the ground
      minAlt: 0,
      maxAlt: DRONE_MAX_ALT,
      minSpeed: 0,
      maxSpeed: DRONE_MAX_SPEED,
      currentTurnRate: 0, // deg/s this frame — used by cluster bomb drop prediction
    };

    // --- Targeting ---
    this.targetPos = null;
    this.reticle = this.add
      .image(0, 0, "reticle")
      .setScale(SCALE)
      .setDepth(8)
      .setVisible(false);
    this.laserLine = this.add.graphics().setDepth(7);

    // --- Missiles ---
    this.missiles = [];

    // --- Explosions ---
    this.anims.create({
      key: "explode",
      frames: [
        { key: "explosion-sheet", frame: 0 },
        { key: "explosion-sheet", frame: 1 },
        { key: "explosion-sheet", frame: 2 },
        { key: "explosion-sheet", frame: 3 },
        { key: "explosion-sheet", frame: 4 },
      ],
      frameRate: 10,
      repeat: 0,
    });

    // --- Camera ---
    this.cameras.main.setBounds(
      WATER_BOUNDS.left,
      WATER_BOUNDS.top,
      WATER_BOUNDS.right - WATER_BOUNDS.left,
      WATER_BOUNDS.bottom - WATER_BOUNDS.top,
    );
    this.cameras.main.startFollow(
      this.drone,
      true,
      CAMERA_FOLLOW_LERP,
      CAMERA_FOLLOW_LERP,
    );
    // Detect mobile up-front (still used by briefing modal layout, victory
    // cutscene, dialog scaling, etc. — the camera zoom no longer depends on
    // it, but other systems still branch on isMobile).
    this.isMobile = this.sys.game.device.input.touch;

    // Start zoomed in during intro — hides off-screen texture pop-in while
    // person skins are still generating. introZoomActive gates the altitude
    // zoom logic in update() until the tween finishes. Zoom is computed
    // from viewport width so narrow screens aren't over-zoomed and wide
    // screens don't show too much empty desert.
    this.introZoomActive = true;
    this.cameras.main.setZoom(computeIntroZoom(this));

    // --- Input ---
    this.cursors = this.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      altUp: Phaser.Input.Keyboard.KeyCodes.E,
      altDown: Phaser.Input.Keyboard.KeyCodes.Q,
      fire: Phaser.Input.Keyboard.KeyCodes.SPACE,
      weapon1: Phaser.Input.Keyboard.KeyCodes.ONE,
      weapon2: Phaser.Input.Keyboard.KeyCodes.TWO,
      weapon3: Phaser.Input.Keyboard.KeyCodes.THREE,
    });

    // Weapon system: 1 = missile, 2 = cannon, 3 = cluster bomb
    this.selectedWeapon = 1;
    this.missileFireTimer = 0;
    initCannon(this);
    initClusterBomb(this);

    // Pointer down: set missile target, or restart after crash
    this.input.on("pointerdown", (pointer) => {
      if (this.introPlaying) return;
      // Crashed: tap anywhere (off controls) to restart
      if (this.flightState === "crashed") {
        if (this.crashRestartReady) {
          if (this.isMobile && this.isOnMobileControl(pointer.x, pointer.y))
            return;
          this.sound.stopAll();
          this.scene.restart();
        }
        return;
      }
      // Normal: set missile target (skip if tap landed on a mobile control)
      if (this.isMobile && this.isOnMobileControl(pointer.x, pointer.y)) return;
      const worldX = pointer.worldX;
      const worldY = pointer.worldY;
      this.targetPos = { x: worldX, y: worldY };
      this.reticle.setPosition(worldX, worldY).setVisible(true);
    });

    // --- HUD camera (separate, unaffected by zoom) ---
    this.hudCam = this.cameras.add(0, 0, this.scale.width, this.scale.height);
    this.hudCam.setScroll(0, 0);

    // --- HUD elements ---
    this.hudText = this.add
      .text(10, 10, "", {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#0f0",
        backgroundColor: "#000000aa",
        padding: { x: 8, y: 6 },
      })
      .setDepth(100)
      .setVisible(false); // revealed once intro cutscene finishes

    // Mission-complete alert — shows + slow-flashes once the player has
    // met VICTORY_KILL_THRESHOLD and is still in the air
    this.missionCompleteText = this.add
      .text(10, 0, "MISSION COMPLETE! Return to base!", {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#ffee66",
        backgroundColor: "#000000cc",
        padding: { x: 8, y: 6 },
      })
      .setDepth(100)
      .setVisible(false);
    this.missionCompleteTween = this.tweens.add({
      targets: this.missionCompleteText,
      alpha: { from: 1.0, to: 0.35 },
      duration: 900,
      yoyo: true,
      repeat: -1,
    });

    this.controlsText = this.add
      .text(
        10,
        0,
        "WASD:turn/speed  E/Q:alt  1:MSL 2:GUN  Click:target  Space:fire",
        {
          fontFamily: "monospace",
          fontSize: "11px",
          color: "#0f0",
          backgroundColor: "#000000aa",
          padding: { x: 6, y: 4 },
        },
      )
      .setDepth(100);

    // Main camera ignores HUD, HUD camera only sees HUD
    this.cameras.main.ignore([
      this.hudText,
      this.controlsText,
      this.missionCompleteText,
    ]);
    this.hudCam.ignore(
      this.children.list.filter(
        (child) =>
          child !== this.hudText &&
          child !== this.controlsText &&
          child !== this.missionCompleteText,
      ),
    );

    // Reposition on resize
    this.scale.on("resize", (gameSize) => {
      this.controlsText.setY(gameSize.height - 30);
      this.hudCam.setSize(gameSize.width, gameSize.height);
    });
    this.controlsText.setY(this.scale.height - 30);

    // --- Mobile controls ---
    // isMobile was set earlier (near the camera setup) so computeIntroZoom
    // could use the right gameplay-zoom floor.
    this.mobileInput = {
      left: false,
      right: false,
      up: false,
      down: false,
      altUp: false,
      altDown: false,
      fire: false,
      fireJustDown: false,
      turnAmount: 0,
      altAmount: 0,
    }; // analog (-1…+1) from joystick
    this.crashRestartReady = false;
    this.mobileControlZones = null; // populated by MobileControlsScene.buildControls()
    if (this.isMobile) {
      this.controlsText.setVisible(false);
      // MobileControls is launched after the briefing modal is dismissed.
    }

    // Kill counter — totalPeople is re-counted once the deferred world init
    // finishes spawning everyone.
    this.kills = 0;
    this.totalPeople = 0;

    // --- Audio (music + SFX + engine, loaded in one batch) ---
    initAudio(this);

    // --- Intro cutscene (gated by briefing modal for audio unlock) ---
    this.introPlaying = true;
    showBriefingModal(this, () => {
      if (this.isMobile) {
        this.scene.launch("MobileControls", { gameScene: this });
      }
      // Brief pause after tap before the intro cutscene starts
      this.time.delayedCall(1500, () => playIntroCutscene(this));
    });
  }

  // Returns true if screen-space (px, py) falls on a mobile control widget
  isOnMobileControl(px, py) {
    const z = this.mobileControlZones;
    if (!z) return false;
    const inRect = (r) =>
      px >= r.x - r.w / 2 &&
      px <= r.x + r.w / 2 &&
      py >= r.y - r.h / 2 &&
      py <= r.y + r.h / 2;
    if (
      z.fireR &&
      Phaser.Math.Distance.Between(px, py, z.fireR.x, z.fireR.y) < z.fireR.r
    )
      return true;
    if (z.turnSlider && inRect(z.turnSlider)) return true;
    if (z.altRocker && inRect(z.altRocker)) return true;
    if (z.rocker && inRect(z.rocker)) return true;
    if (z.weaponRocker && inRect(z.weaponRocker)) return true;
    if (
      z.mapButton &&
      Phaser.Math.Distance.Between(px, py, z.mapButton.x, z.mapButton.y) <
        z.mapButton.r
    )
      return true;
    return false;
  }

  update(time, delta) {
    const dt = delta / 1000;
    const ds = this.droneState;

    // --- Intro cutscene playing ---
    if (this.introPlaying) return;

    // --- Intro just finished — tween the camera from its zoomed-in intro
    //     framing back to the normal gameplay zoom once, then hand zoom
    //     control back to the altitude-based logic below.
    if (this.introZoomActive && !this._introZoomTweenStarted) {
      this._introZoomTweenStarted = true;
      // Mission clock starts the instant the intro cutscene ends.
      this.missionStartTime = Date.now();
      // Mobile "zoom out" is now handled by main.js via a larger internal
      // canvas + CSS downscale, so camera zoom stays at DRONE_ZOOM_MAX
      // regardless of device.
      const targetZoom = DRONE_ZOOM_MAX;
      this.tweens.add({
        targets: this.cameras.main,
        zoom: targetZoom,
        duration: INTRO_ZOOM_OUT_DURATION_MS,
        ease: "Sine.easeInOut",
        onComplete: () => {
          this.introZoomActive = false;
        },
      });
    }

    // --- Crashed state ---
    if (this.flightState === "crashed") {
      if (this.restartKey && Phaser.Input.Keyboard.JustDown(this.restartKey)) {
        this.sound.stopAll();
        this.scene.restart();
      }
      updateMissiles(this, dt);
      return;
    }

    const isGrounded = this.flightState === "grounded";
    const isAirborne = this.flightState === "airborne";
    const speedKnots = ds.speed * 0.5;
    const mi = this.mobileInput;

    // --- Victory cutscene active: lock input, pin drone in place ---
    if (this.victoryActive) {
      ds.speed = 0;
      ds.altitude = 0;
      this.drone.setPosition(ds.x, ds.y);
      this.droneShadow.setVisible(false);
      this.dronePropShadow.setVisible(false);
      // Keep world + set pieces animating so the celebration runs
      updateMissiles(this, dt);
      updatePeople(this, dt, delta);
      updateAnimals(this, dt);
      for (const sp of this.setPieces) sp.update(dt, delta);
      return;
    }

    // --- Input: turn (requires forward speed — can't yaw while stationary) ---
    const kbTurn = this.cursors.left.isDown
      ? -1
      : this.cursors.right.isDown
        ? 1
        : 0;
    const turnAmt = kbTurn !== 0 ? kbTurn : mi ? mi.turnAmount : 0;
    ds.currentTurnRate = 0;
    if (ds.speed > 0 && Math.abs(turnAmt) > 0.01) {
      ds.angle += DRONE_TURN_RATE * dt * turnAmt;
      ds.currentTurnRate = DRONE_TURN_RATE * turnAmt;
    }

    // --- Input: speed ---
    if (this.cursors.up.isDown || (mi && mi.up)) {
      ds.speed = Math.min(ds.maxSpeed, ds.speed + DRONE_ACCEL * dt);
    }
    if (this.cursors.down.isDown || (mi && mi.down)) {
      const minSpd = isAirborne ? DRONE_MIN_SPEED_AIRBORNE : 0;
      ds.speed = Math.max(minSpd, ds.speed - DRONE_ACCEL * dt);
    }

    // --- Input: altitude (keyboard = binary, joystick = analog via altAmount) ---
    // altAmount: +1 = stick pushed down = nose up = gain altitude (real-plane feel)
    const altUpFactor = this.cursors.altUp.isDown
      ? 1
      : mi && mi.altAmount > 0
        ? mi.altAmount
        : 0;
    const altDnFactor = this.cursors.altDown.isDown
      ? 1
      : mi && mi.altAmount < 0
        ? -mi.altAmount
        : 0;
    if (altUpFactor > 0) {
      if (speedKnots >= DRONE_TAKEOFF_SPEED) {
        ds.altitude = Math.min(
          ds.maxAlt,
          ds.altitude + DRONE_ALT_RATE * dt * altUpFactor,
        );
        if (isGrounded) this.flightState = "airborne";
      }
    }
    if (altDnFactor > 0 && isAirborne) {
      ds.altitude = Math.max(
        0,
        ds.altitude - DRONE_ALT_RATE * dt * altDnFactor,
      );
    }

    // --- Altitude floor / touchdown ---
    // Cozy rule: the drone can only reach ground altitude (0 ft) when it's
    // over the runway. Off-runway, altitude is clamped to a safe floor so
    // the drone can never crash. Grounded drones stay grounded regardless
    // of position, so taxiing off the runway is fine.
    if (isAirborne) {
      if (isOnRunway(this, ds.x, ds.y)) {
        if (ds.altitude <= 0) {
          ds.altitude = 0;
          this.flightState = "grounded";
        }
      } else if (ds.altitude < DRONE_MIN_ALT_OFF_RUNWAY) {
        ds.altitude = DRONE_MIN_ALT_OFF_RUNWAY;
      }
    }

    // --- Victory trigger: enough kills + landed + stopped on runway ---
    if (
      !this.victoryActive &&
      this.kills >= VICTORY_KILL_THRESHOLD &&
      this.flightState === "grounded" &&
      ds.speed === 0 &&
      isOnRunway(this, ds.x, ds.y)
    ) {
      // Stop the mission clock the moment the drone comes to rest on the runway
      this.missionEndTime = Date.now();
      startVictory(this);
    }

    // --- Move drone ---
    const rad = Phaser.Math.DegToRad(ds.angle - 90);
    ds.x += Math.cos(rad) * ds.speed * dt;
    ds.y += Math.sin(rad) * ds.speed * dt;

    // Soft water boundary: steering kicks in 20 tiles past the map edge, scales up to outer wall
    const moatPx = -WATER_BOUNDS.left; // MOAT_PX in world pixels
    const triggerPx = 20 * TILE * SCALE; // free-fly zone: 20 tiles of open water
    const turnZone = moatPx - triggerPx; // remaining moat width where steering acts
    const mapBndW = WORLD_W * TILE * SCALE;
    const mapBndH = WORLD_H * TILE * SCALE;
    const overL =
      ds.x < -triggerPx ? Math.min(-ds.x - triggerPx, turnZone) / turnZone : 0;
    const overR =
      ds.x > mapBndW + triggerPx
        ? Math.min(ds.x - mapBndW - triggerPx, turnZone) / turnZone
        : 0;
    const overT =
      ds.y < -triggerPx ? Math.min(-ds.y - triggerPx, turnZone) / turnZone : 0;
    const overB =
      ds.y > mapBndH + triggerPx
        ? Math.min(ds.y - mapBndH - triggerPx, turnZone) / turnZone
        : 0;
    if (overL > 0 || overR > 0 || overT > 0 || overB > 0) {
      const pushX = overL - overR; // positive = steer east
      const pushY = overT - overB; // positive = steer south
      const mag = Math.sqrt(pushX * pushX + pushY * pushY) || 1;
      const targetRad = Math.atan2(pushY / mag, pushX / mag);
      const currentRad = Phaser.Math.DegToRad(ds.angle - 90);
      const diff = Phaser.Math.Angle.Wrap(targetRad - currentRad);
      const depth = Math.max(overL, overR, overT, overB);
      const turnMult = 1.5 + depth * 3.5; // 1.5× at trigger line → 5× near outer wall
      const maxTurn = Phaser.Math.DegToRad(DRONE_TURN_RATE) * turnMult * dt;
      ds.angle += Phaser.Math.RadToDeg(
        Phaser.Math.Clamp(diff, -maxTurn, maxTurn),
      );
    }
    // Hard clamp at outer wall (safety net — soft steering should prevent reaching it)
    ds.x = Phaser.Math.Clamp(ds.x, WATER_BOUNDS.left, WATER_BOUNDS.right);
    ds.y = Phaser.Math.Clamp(ds.y, WATER_BOUNDS.top, WATER_BOUNDS.bottom);

    this.drone.setPosition(ds.x, ds.y);
    this.drone.setAngle(ds.angle);

    // --- Shadow (offset increases with altitude) ---
    if (ds.altitude > 0) {
      this.droneShadow.setVisible(true);
      const shadowOffset = ds.altitude * 0.04;
      this.droneShadow.setPosition(ds.x + shadowOffset, ds.y + shadowOffset);
      this.droneShadow.setAngle(ds.angle);
      this.droneShadow.setAlpha(
        Phaser.Math.Clamp(
          DRONE_SHADOW_OPACITY - ds.altitude * 0.0001,
          DRONE_SHADOW_OPACITY * 0.125,
          DRONE_SHADOW_OPACITY,
        ),
      );
      const shadowScale =
        SCALE * Phaser.Math.Clamp(1.2 - ds.altitude * 0.0003, 0.6, 1.2);
      this.droneShadow.setScale(shadowScale);
      this.dronePropShadow.setVisible(true);
      this.dronePropShadow.setPosition(
        ds.x + shadowOffset,
        ds.y + shadowOffset,
      );
      this.dronePropShadow.setAngle(ds.angle);
      this.dronePropShadow.setAlpha(this.droneShadow.alpha);
      this.dronePropShadow.setScale(shadowScale);
      this.dronePropShadow.setTexture(
        this.propFrame === 0 ? "drone-prop-shadow1" : "drone-prop-shadow2",
      );
    } else {
      this.droneShadow.setVisible(false);
      this.dronePropShadow.setVisible(false);
    }

    // --- Camera zoom (zoom out above threshold) ---
    // While the intro zoom-out tween is still running, leave the camera alone.
    // Mobile "zoom out" is applied via a larger internal canvas in main.js,
    // NOT via camera.setZoom, so the camera zoom path is the same on every
    // device — avoids the nearest-neighbor flicker that fractional camera
    // zooms cause with pixelArt mode.
    if (!this.introZoomActive) {
      if (ds.altitude <= DRONE_ZOOM_ALT_THRESHOLD) {
        this.cameras.main.setZoom(DRONE_ZOOM_MAX);
        this.drone.setScale(SCALE);
      } else {
        const t =
          (ds.altitude - DRONE_ZOOM_ALT_THRESHOLD) /
          (ds.maxAlt - DRONE_ZOOM_ALT_THRESHOLD);
        const worldZoom = Phaser.Math.Linear(DRONE_ZOOM_MAX, DRONE_ZOOM_MIN, t);
        this.cameras.main.setZoom(worldZoom);
        this.drone.setScale(SCALE / worldZoom);
      }
    }

    // --- Propeller animation (faster spin at higher speed) ---
    if (ds.speed > 0) {
      const propInterval = Math.max(30, 150 - ds.speed * 0.4);
      this.propTimer += delta;
      if (this.propTimer >= propInterval) {
        this.propTimer = 0;
        this.propFrame = 1 - this.propFrame;
        this.drone.setTexture(this.propFrame === 0 ? "drone" : "drone2");
      }
    }

    // --- Engine sound ---
    updateEngineSound(this, ds, delta);

    // --- Weapon switching ---
    if (Phaser.Input.Keyboard.JustDown(this.cursors.weapon1))
      this.selectedWeapon = 1;
    if (Phaser.Input.Keyboard.JustDown(this.cursors.weapon2))
      this.selectedWeapon = 2;
    // CBU (weapon 3) selection disabled — leave fire/update code intact

    // --- Weapon display (hide all reticles, then show the active one) ---
    this.laserLine.clear();
    this.reticle.setVisible(false);
    this.cannonReticle.setVisible(false);
    this.clusterReticle.setVisible(false);

    if (this.selectedWeapon === 1) {
      // Missile mode: laser line + click-to-target reticle
      if (this.targetPos && isAirborne) {
        this.laserLine.lineStyle(1, 0xff0000, 0.5);
        this.laserLine.beginPath();
        this.laserLine.moveTo(ds.x, ds.y);
        this.laserLine.lineTo(this.targetPos.x, this.targetPos.y);
        this.laserLine.strokePath();
        const pulse = 0.8 + Math.sin(time * 0.005) * 0.2;
        this.reticle.setAlpha(pulse);
        this.reticle.setVisible(true);
      }
    } else if (this.selectedWeapon === 2) {
      // Cannon mode: fixed reticle ahead of drone
      if (isAirborne) updateCannonReticle(this, ds);
    } else if (this.selectedWeapon === 3) {
      // Cluster bomb mode: circle reticle behind drone
      if (isAirborne) updateClusterReticle(this, ds);
    }

    // --- Fire weapons (only when airborne) ---
    const fireJustDown =
      Phaser.Input.Keyboard.JustDown(this.cursors.fire) ||
      (mi && mi.fireJustDown);
    const fireHeld = this.cursors.fire.isDown || (mi && mi.fire);
    if (mi) mi.fireJustDown = false; // consumed — MobileControlsScene will re-set on next press

    if (this.selectedWeapon !== 2) updateCannonFiringSound(this, false);

    if (this.selectedWeapon === 1) {
      // Missile: single fire with cooldown
      if (this.missileFireTimer > 0) this.missileFireTimer -= dt;
      if (
        fireJustDown &&
        this.targetPos &&
        isAirborne &&
        this.missileFireTimer <= 0
      ) {
        fireMissile(this);
        this.missileFireTimer = MISSILE_FIRE_RATE;
      }
    } else if (this.selectedWeapon === 2) {
      // Cannon: hold to auto-fire
      const cannonFiring = fireHeld && isAirborne;
      if (cannonFiring) {
        this.cannonFireTimer += dt;
        if (this.cannonFireTimer >= CANNON_FIRE_RATE) {
          this.cannonFireTimer = 0;
          fireCannon(this);
        }
      } else {
        this.cannonFireTimer = 0;
      }
      updateCannonFiringSound(this, cannonFiring);
    } else if (this.selectedWeapon === 3) {
      // Cluster bomb: single drop with cooldown
      if (this.clusterFireTimer > 0) this.clusterFireTimer -= dt;
      if (fireJustDown && isAirborne && this.clusterFireTimer <= 0) {
        fireClusterBomb(this);
        this.clusterFireTimer = CLUSTER_FIRE_RATE;
      }
    }

    // --- Update systems ---
    updateMissiles(this, dt);
    updateCannonBullets(this, dt);
    updateClusterBombs(this, dt);
    updatePeople(this, dt, delta);
    updateAnimals(this, dt);
    updateDirtBikers(this, dt, delta);
    updateTownCars(this, dt);
    // All set-piece instance updates (soccer, oilfield, chicken fight, camel
    // race, rock fight, farm field, concert, etc.)
    for (const sp of this.setPieces) sp.update(dt, delta);

    // --- HUD ---
    if (!this.hudText.visible) this.hudText.setVisible(true);
    const spdDisplay = Math.round(speedKnots);
    const lastSfx = this.lastDeathSfxName ?? "--";
    const lastAnimalSfx = this.lastAnimalDeathSfxName ?? "--";
    // Mobile hides the weapon readout — the on-screen weapon toggle already
    // shows which is selected, so repeating it in the HUD is redundant.
    const weaponNames = { 1: "MSL", 2: "GUN", 3: "CBU" };
    const weaponTag = this.isMobile ? "" : `  [${weaponNames[this.selectedWeapon]}]`;
    this.hudText.setText(
      `ALT: ${Math.round(ds.altitude)} ft  SPD: ${spdDisplay} kts${weaponTag}\n` +
        `FREEDOMS: ${this.kills}/${this.totalPeople}\n` +
        `p: ${lastSfx}\n` +
        `a: ${lastAnimalSfx}`,
    );

    // --- Mini-map (heatmap + drone marker, top-right) ---
    updateMinimap(this, delta);

    // Mission-complete HUD alert (shown once threshold met, hidden during cutscene)
    const missionReady =
      this.kills >= VICTORY_KILL_THRESHOLD && !this.victoryActive;
    if (this.missionCompleteText) {
      this.missionCompleteText.setVisible(missionReady);
      // Anchor directly under the main HUD block
      const hudBottom = this.hudText.y + this.hudText.height;
      this.missionCompleteText.setPosition(10, hudBottom + 4);
    }
  }
}

// Compute a viewport-aware intro zoom. Goal: the camera (centered on the
// drone at the runway) sees at least INTRO_TARGET_RIGHT_PX world-px to the
// right so the hangar frames the right edge of the screen. Clamps to the
// gameplay zoom (1.0) as a minimum (never zoom OUT during intro) and
// INTRO_ZOOM_MAX as a maximum (don't over-zoom on ultrawide monitors).
// No mobile-specific path — the wider mobile FOV comes from the larger
// internal canvas (see main.js), not from camera.zoom.
function computeIntroZoom(scene) {
  const halfScreen = scene.scale.width / 2;
  const desired = halfScreen / INTRO_TARGET_RIGHT_PX;
  return Phaser.Math.Clamp(desired, 1.0, INTRO_ZOOM_MAX);
}

// Deferred world initialization — runs once person-skin textures have
// finished their async generation. Creates every set piece that spawns
// people, plus the wandering-person and vehicle populations. Intro only
// references guy1/guy2 so this can safely wait out the briefing modal +
// intro cutscene.
function tryDeferredWorldInit(scene) {
  if (scene._worldInitDone) return;
  if (!scene._personSkinsReady) return;
  scene._worldInitDone = true;

  const rng = scene._deferredWorldRng;

  // Shell + scene._addBuilding registration (now that it can actually spawn)
  createBuildings(scene, rng);
  createAnimals(scene, rng);

  // Set pieces that contain people. Any entry with both tileX and tileY
  // goes exactly there; any entry that omits them gets a random, non-
  // overlapping, well-spaced placement. The airfield is already in
  // scene.setPieces by this point; we hand its bounds in as a reserved
  // rect so auto-placed pieces steer clear of the runway.
  const airfieldPiece = scene.setPieces[0]; // placed at intro time
  const reserved = airfieldPiece?.bounds
    ? [reservedRectFromBounds(airfieldPiece.bounds)]
    : [];
  const placed = placeSetPieces(
    scene,
    rng,
    [
      { type: "town" },
      { type: "farmCompound" },
      { type: "sheepFlock" },
      { type: "oilfield" },
      { type: "wedding" },
      { type: "soccer" },
      { type: "chickenFight" },
      { type: "camelRace" },
      { type: "rockFight" },
      { type: "farmField" },
      { type: "concert" },
      { type: "tireFire" },
      { type: "rockTarget" },
      { type: "hookah" },
      { type: "rcCar" },
      { type: "paperPlane" },
    ],
    reserved,
  );
  scene.setPieces.push(...placed);

  createPeople(scene, rng);
  createVehicles(scene, rng);

  // These sprites were added after the HUD camera's initial `ignore`
  // snapshot, so they'd be seen by both cameras. Re-apply the HUD
  // camera's ignore to every sprite except the HUD text elements —
  // and specifically SKIP the briefing modal items (if still up), since
  // those are already in cameras.main.ignore and would otherwise end
  // up invisible to both cameras.
  const briefingItems = scene._briefingModalItems || [];
  scene.hudCam.ignore(
    scene.children.list.filter(
      (child) =>
        child !== scene.hudText &&
        child !== scene.controlsText &&
        child !== scene.missionCompleteText &&
        !briefingItems.includes(child),
    ),
  );

  // Kill counter caps on total people (built-out now)
  scene.totalPeople = countTotalPeople(scene);

  // Minimap overlay — created AFTER the bulk hudCam.ignore above so its
  // graphics aren't swept into the ignore list. The module registers its
  // own cameras.main.ignore() so the overlay only appears on the HUD.
  createMinimap(scene);
}
