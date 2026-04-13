import Phaser from "phaser";
import {
  WORLD_W, WORLD_H, TILE, SCALE, AIRFIELD_X, AIRFIELD_Y,
  DRONE_TURN_RATE, DRONE_ACCEL, DRONE_MIN_SPEED_AIRBORNE,
  DRONE_ALT_RATE, DRONE_TAKEOFF_SPEED, DRONE_ZOOM_ALT_THRESHOLD,
  DRONE_ZOOM_MIN, DRONE_ZOOM_MAX, DRONE_MAX_SPEED, DRONE_MAX_ALT,
  CAMERA_FOLLOW_LERP,
} from "../constants.js";

import { initAudio, updateEngineSound } from "../systems/audioSystem.js";
import { playIntroCutscene } from "../systems/introSystem.js";
import { createWedding } from "../systems/weddingSetup.js";
import { createSoccer, updateSoccer } from "../systems/soccerSystem.js";
import { createBuildings } from "../systems/buildingSystem.js";
import {
  createAnimals,
  updateAnimals,
} from "../systems/animalSystem.js";
import { createOilfield, updateOilWells } from "../systems/oilfieldSystem.js";
import {
  fireMissile,
  updateMissiles,
} from "../systems/missileSystem.js";
import { createPeople, updatePeople, countTotalPeople } from "../systems/peopleSystem.js";
import {
  createVehicles,
  updateTownCars,
  updateDirtBikers,
} from "../systems/vehicleSystem.js";
import { isOnRunway, crashDrone } from "../systems/droneSystem.js";
import { createChickenFight, updateChickenFight } from "../systems/chickenFightSystem.js";
import { createCamelRace, updateCamelRace } from "../systems/camelRaceSystem.js";
import { CANNON_FIRE_RATE } from "../constants.js";
import { initCannon, updateCannonReticle, fireCannon, updateCannonBullets } from "../systems/cannonSystem.js";

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
    const rng = new Phaser.Math.RandomDataGenerator(["desert"]);

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

    // Initialize people array early (wedding + regular people both push to it)
    this.people = [];

    // --- Systems: create ---
    createBuildings(this, rng);
    createWedding(this, rng);
    createSoccer(this, rng);
    createAnimals(this, rng);
    createOilfield(this, rng);
    createChickenFight(this, rng);
    createCamelRace(this, rng);

    // --- Runway (6 tiles long) ---
    const rwX = AIRFIELD_X * TILE * SCALE;
    const rwTiles = 6;
    const rwTileH = 128 * SCALE;
    const rwTotalH = rwTiles * rwTileH;
    // Runway positioned centered on AIRFIELD_Y
    const rwCenterY = AIRFIELD_Y * TILE * SCALE;
    const rwTop = rwCenterY - rwTotalH / 2;
    const rwBottom = rwCenterY + rwTotalH / 2;
    for (let i = 0; i < rwTiles; i++) {
      this.add
        .image(rwX, rwTop + i * rwTileH + rwTileH / 2, "runway")
        .setScale(SCALE)
        .setDepth(1.5);
    }
    // Store runway bounds for collision
    this.runway = {
      x: rwX,
      y: rwCenterY,
      halfW: (32 * SCALE) / 2,
      halfH: rwTotalH / 2,
    };

    // --- Hangar (to the right of the runway bottom) ---
    const hangarOffset = (48 * SCALE) / 2 + (32 * SCALE) / 2 + 16 * SCALE * 3; // hangar half + runway half + taxiway gap
    this.hangarX = rwX + hangarOffset;
    this.hangarY = rwBottom - (48 * SCALE) / 2;
    this.add
      .image(this.hangarX, this.hangarY, "hangar")
      .setScale(SCALE)
      .setDepth(1.5);

    // --- Taxiway connecting hangar door to runway ---
    const taxiStartX = rwX + (32 * SCALE) / 2; // right edge of runway
    const taxiEndX = this.hangarX - (48 * SCALE) / 2; // left edge of hangar (door side)
    const taxiY = this.hangarY;
    for (let tx = taxiStartX; tx < taxiEndX; tx += 16 * SCALE) {
      this.add
        .image(tx + 8 * SCALE, taxiY, "taxiway")
        .setScale(SCALE)
        .setAngle(90) // rotate so center line runs horizontally
        .setDepth(1.5);
    }

    // --- Create people & vehicles (need town layout info from buildings) ---
    createPeople(this, rng);
    createVehicles(this, rng);

    // --- Drone shadow ---
    this.droneShadow = this.add
      .image(0, 0, "drone-shadow")
      .setScale(SCALE)
      .setDepth(3)
      .setAlpha(0.3);

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
    this.cameras.main.setBounds(0, 0, WORLD_W * TILE * SCALE, WORLD_H * TILE * SCALE);
    this.cameras.main.startFollow(this.drone, true, CAMERA_FOLLOW_LERP, CAMERA_FOLLOW_LERP);
    this.cameras.main.setZoom(1);

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
    });

    // Weapon system: 1 = missile, 2 = cannon
    this.selectedWeapon = 1;
    initCannon(this);

    // Click to set target (missile only)
    this.input.on("pointerdown", (pointer) => {
      if (this.introPlaying) return;
      if (this.flightState === "crashed") return;
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
      .setDepth(100);

    this.controlsText = this.add
      .text(10, 0, "WASD:turn/speed  E/Q:alt  1:MSL 2:GUN  Click:target  Space:fire", {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#0f0",
        backgroundColor: "#000000aa",
        padding: { x: 6, y: 4 },
      })
      .setDepth(100);

    // Main camera ignores HUD, HUD camera only sees HUD
    this.cameras.main.ignore([this.hudText, this.controlsText]);
    this.hudCam.ignore(
      this.children.list.filter(
        (child) => child !== this.hudText && child !== this.controlsText,
      ),
    );

    // Reposition on resize
    this.scale.on("resize", (gameSize) => {
      this.controlsText.setY(gameSize.height - 30);
      this.hudCam.setSize(gameSize.width, gameSize.height);
    });
    this.controlsText.setY(this.scale.height - 30);

    // Kill counter
    this.kills = 0;
    this.totalPeople = countTotalPeople(this);

    // --- Audio (music + SFX + engine, loaded in one batch) ---
    initAudio(this);

    // --- Intro cutscene ---
    this.introPlaying = true;
    playIntroCutscene(this);
  }

  update(time, delta) {
    const dt = delta / 1000;
    const ds = this.droneState;

    // --- Intro cutscene playing ---
    if (this.introPlaying) return;

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

    // --- Input: turn ---
    if (this.cursors.left.isDown) {
      ds.angle -= DRONE_TURN_RATE * dt;
    }
    if (this.cursors.right.isDown) {
      ds.angle += DRONE_TURN_RATE * dt;
    }

    // --- Input: speed ---
    if (this.cursors.up.isDown) {
      ds.speed = Math.min(ds.maxSpeed, ds.speed + DRONE_ACCEL * dt);
    }
    if (this.cursors.down.isDown) {
      const minSpd = isAirborne ? DRONE_MIN_SPEED_AIRBORNE : 0;
      ds.speed = Math.max(minSpd, ds.speed - DRONE_ACCEL * dt);
    }

    // --- Input: altitude ---
    if (this.cursors.altUp.isDown) {
      // Can only gain altitude if speed >= takeoff speed
      if (speedKnots >= DRONE_TAKEOFF_SPEED) {
        ds.altitude = Math.min(ds.maxAlt, ds.altitude + DRONE_ALT_RATE * dt);
        if (isGrounded) {
          this.flightState = "airborne";
        }
      }
    }
    if (this.cursors.altDown.isDown && isAirborne) {
      ds.altitude = Math.max(0, ds.altitude - DRONE_ALT_RATE * dt);
    }

    // --- Check if drone touched down ---
    if (isAirborne && ds.altitude <= 0) {
      ds.altitude = 0;
      if (isOnRunway(this, ds.x, ds.y)) {
        // Safe landing
        this.flightState = "grounded";
      } else {
        // Crash!
        crashDrone(this);
        return;
      }
    }

    // --- Move drone ---
    const rad = Phaser.Math.DegToRad(ds.angle - 90);
    ds.x += Math.cos(rad) * ds.speed * dt;
    ds.y += Math.sin(rad) * ds.speed * dt;

    // Clamp to world bounds
    ds.x = Phaser.Math.Clamp(ds.x, 0, WORLD_W * TILE * SCALE);
    ds.y = Phaser.Math.Clamp(ds.y, 0, WORLD_H * TILE * SCALE);

    this.drone.setPosition(ds.x, ds.y);
    this.drone.setAngle(ds.angle);

    // --- Shadow (offset increases with altitude) ---
    if (ds.altitude > 0) {
      this.droneShadow.setVisible(true);
      const shadowOffset = ds.altitude * 0.04;
      this.droneShadow.setPosition(ds.x + shadowOffset, ds.y + shadowOffset);
      this.droneShadow.setAngle(ds.angle);
      this.droneShadow.setAlpha(
        Phaser.Math.Clamp(0.4 - ds.altitude * 0.0001, 0.05, 0.4),
      );
      const shadowScale =
        SCALE * Phaser.Math.Clamp(1.2 - ds.altitude * 0.0003, 0.6, 1.2);
      this.droneShadow.setScale(shadowScale);
    } else {
      this.droneShadow.setVisible(false);
    }

    // --- Camera zoom (zoom out above threshold, drone compensates to stay same size) ---
    if (ds.altitude <= DRONE_ZOOM_ALT_THRESHOLD) {
      this.cameras.main.setZoom(DRONE_ZOOM_MAX);
      this.drone.setScale(SCALE);
    } else {
      const t = (ds.altitude - DRONE_ZOOM_ALT_THRESHOLD) / (ds.maxAlt - DRONE_ZOOM_ALT_THRESHOLD);
      const zoom = Phaser.Math.Linear(DRONE_ZOOM_MAX, DRONE_ZOOM_MIN, t);
      this.cameras.main.setZoom(zoom);
      this.drone.setScale(SCALE / zoom);
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
    if (Phaser.Input.Keyboard.JustDown(this.cursors.weapon1)) this.selectedWeapon = 1;
    if (Phaser.Input.Keyboard.JustDown(this.cursors.weapon2)) this.selectedWeapon = 2;

    // --- Weapon display ---
    this.laserLine.clear();
    if (this.selectedWeapon === 1) {
      // Missile mode: laser line + click-to-target reticle
      this.cannonReticle.setVisible(false);
      if (this.targetPos && isAirborne) {
        this.laserLine.lineStyle(1, 0xff0000, 0.5);
        this.laserLine.beginPath();
        this.laserLine.moveTo(ds.x, ds.y);
        this.laserLine.lineTo(this.targetPos.x, this.targetPos.y);
        this.laserLine.strokePath();
        const pulse = 0.8 + Math.sin(time * 0.005) * 0.2;
        this.reticle.setAlpha(pulse);
      }
      this.reticle.setVisible(!!this.targetPos && isAirborne);
    } else {
      // Cannon mode: fixed reticle ahead of drone, no laser
      this.reticle.setVisible(false);
      if (isAirborne) {
        updateCannonReticle(this, ds);
      } else {
        this.cannonReticle.setVisible(false);
      }
    }

    // --- Fire weapons (only when airborne) ---
    if (this.selectedWeapon === 1) {
      // Missile: single fire on press
      if (Phaser.Input.Keyboard.JustDown(this.cursors.fire) && this.targetPos && isAirborne) {
        fireMissile(this);
      }
    } else {
      // Cannon: hold to auto-fire
      if (this.cursors.fire.isDown && isAirborne) {
        this.cannonFireTimer += dt;
        if (this.cannonFireTimer >= CANNON_FIRE_RATE) {
          this.cannonFireTimer = 0;
          fireCannon(this);
        }
      } else {
        this.cannonFireTimer = 0;
      }
    }

    // --- Update systems ---
    updateMissiles(this, dt);
    updateCannonBullets(this, dt);
    updatePeople(this, dt, delta);
    updateSoccer(this, dt, delta);
    updateAnimals(this, dt);
    updateOilWells(this, delta);
    updateDirtBikers(this, dt, delta);
    updateTownCars(this, dt);
    updateChickenFight(this, dt);
    updateCamelRace(this, dt);

    // --- HUD ---
    const spdDisplay = Math.round(speedKnots);
    let stateLabel = "";
    if (isGrounded) {
      stateLabel = ds.speed === 0 ? "PARKED" : "TAXIING";
      if (speedKnots >= DRONE_TAKEOFF_SPEED) stateLabel = "READY (E to take off)";
    } else {
      stateLabel = "";
    }
    const weaponName = this.selectedWeapon === 1 ? "MSL" : "GUN";
    this.hudText.setText(
      `ALT: ${Math.round(ds.altitude)} ft  SPD: ${spdDisplay} kts  [${weaponName}]\n` +
        `FREEDOMS: ${this.kills}/${this.totalPeople}  ${stateLabel}`,
    );
  }
}
