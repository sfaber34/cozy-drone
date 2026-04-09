import Phaser from "phaser";

const WORLD_W = 3200;
const WORLD_H = 3200;
const TILE = 16;
const SCALE = 3;

export class GameScene extends Phaser.Scene {
  constructor() {
    super("Game");
  }

  create() {
    // --- Desert ground layer ---
    this.groundLayer = this.add.group();
    const rng = new Phaser.Math.RandomDataGenerator(["desert"]);
    for (let y = 0; y < WORLD_H; y += TILE) {
      for (let x = 0; x < WORLD_W; x += TILE) {
        const frame = rng.between(0, 3);
        const tile = this.add
          .image(x, y, "desert-tiles", frame)
          .setOrigin(0, 0)
          .setScale(SCALE);
        this.groundLayer.add(tile);
      }
    }

    // --- Scatter rocks and brush ---
    for (let i = 0; i < 200; i++) {
      const x = rng.between(0, WORLD_W * SCALE);
      const y = rng.between(0, WORLD_H * SCALE);
      const tex = rng.pick(["rock", "brush"]);
      this.add.image(x, y, tex).setScale(SCALE).setDepth(1);
    }

    // --- Runway (6 tiles long) ---
    const rwX = (WORLD_W * SCALE) / 2;
    const rwTiles = 6;
    const rwTileH = 128 * SCALE;
    const rwTotalH = rwTiles * rwTileH;
    // Runway bottom edge
    const rwBottom = (WORLD_H * SCALE) / 2 + rwTotalH / 2;
    const rwTop = rwBottom - rwTotalH;
    const rwCenterY = (rwTop + rwBottom) / 2;
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
    const hangarOffset = 48 * SCALE / 2 + 32 * SCALE / 2 + 16 * SCALE * 3; // hangar half + runway half + taxiway gap
    this.hangarX = rwX + hangarOffset;
    this.hangarY = rwBottom - 48 * SCALE / 2;
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

    // --- Tanks ---
    this.tanks = this.physics.add.group();
    this.tankData = [];
    for (let i = 0; i < 12; i++) {
      const tx = rng.between(200, WORLD_W * SCALE - 200);
      const ty = rng.between(200, WORLD_H * SCALE - 200);
      const tank = this.physics.add
        .sprite(tx, ty, "tank")
        .setScale(SCALE)
        .setDepth(2)
        .setAngle(rng.between(0, 3) * 90);
      tank.alive = true;
      this.tanks.add(tank);
      this.tankData.push(tank);
    }

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
      .setDepth(10);

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
      maxAlt: 15000,
      minSpeed: 0,
      maxSpeed: 300,
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
    this.cameras.main.setBounds(0, 0, WORLD_W * SCALE, WORLD_H * SCALE);
    this.cameras.main.startFollow(this.drone, true, 0.08, 0.08);
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
    });

    // Also allow arrow keys
    this.arrows = this.input.keyboard.createCursorKeys();

    // Click to set target
    this.input.on("pointerdown", (pointer) => {
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
      .text(10, 0, "WASD:turn/speed  E/Q:alt  Click:target  Space:fire", {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#0f0",
        backgroundColor: "#000000aa",
        padding: { x: 6, y: 4 },
      })
      .setDepth(100);

    // Main camera ignores HUD, HUD camera only sees HUD
    this.cameras.main.ignore([this.hudText, this.controlsText]);
    this.hudCam.ignore(this.children.list.filter(
      (child) => child !== this.hudText && child !== this.controlsText,
    ));

    // Reposition on resize
    this.scale.on("resize", (gameSize) => {
      this.controlsText.setY(gameSize.height - 30);
      this.hudCam.setSize(gameSize.width, gameSize.height);
    });
    this.controlsText.setY(this.scale.height - 30);

    // Kill counter
    this.kills = 0;

    // --- Intro cutscene ---
    this.introPlaying = true;
    this.playIntroCutscene();
  }

  playIntroCutscene() {
    const ds = this.droneState;
    // Little guy starts at the hangar door (left side of hangar)
    const guyStartX = this.hangarX - (48 * SCALE) / 2;
    const guyStartY = this.hangarY;
    const guyTargetX = ds.x + 30; // stop near the nose
    const guyTargetY = ds.y - 30; // nose is at the top of the drone

    const guy = this.add.image(guyStartX, guyStartY, "guy1").setScale(SCALE).setDepth(10);
    this.hudCam.ignore(guy);

    // Walk animation
    let walkFrame = 0;
    const walkAnim = this.time.addEvent({
      delay: 150,
      loop: true,
      callback: () => {
        walkFrame = 1 - walkFrame;
        guy.setTexture(walkFrame === 0 ? "guy1" : "guy2");
      },
    });

    // Walk to the drone nose
    this.tweens.add({
      targets: guy,
      x: guyTargetX,
      y: guyTargetY,
      duration: 2000,
      ease: "Quad.easeOut",
      onComplete: () => {
        // Stop walking
        walkAnim.remove();
        guy.setTexture("guy1");

        // Spawn kiss hearts
        for (let i = 0; i < 5; i++) {
          const heart = this.add
            .image(guyTargetX, guyTargetY - 10, "heart")
            .setScale(SCALE)
            .setDepth(12);
          this.hudCam.ignore(heart);
          const angle = -Math.PI * 0.2 + (i / 4) * -Math.PI * 0.6 + (Math.random() - 0.5) * 0.5;
          const dist = 80 + Math.random() * 60;
          this.tweens.add({
            targets: heart,
            x: guyTargetX + Math.cos(angle) * dist,
            y: guyTargetY + Math.sin(angle) * dist - 40,
            scale: SCALE * (0.6 + Math.random() * 0.6),
            alpha: 0,
            duration: 1000 + Math.random() * 500,
            delay: i * 200,
            ease: "Quad.easeOut",
            onComplete: () => heart.destroy(),
          });
        }

        // Speech bubble
        const bubble = this.add
          .text(guyTargetX + 40, guyTargetY - 40, "I love you drone!\n    Have Fun!", {
            fontFamily: "monospace",
            fontSize: "10px",
            color: "#000",
            backgroundColor: "#fff",
            padding: { x: 8, y: 6 },
          })
          .setDepth(13)
          .setScale(SCALE * 0.6);
        this.hudCam.ignore(bubble);

        // After a pause, guy walks away and scene starts
        this.time.delayedCall(2500, () => {
          bubble.destroy();

          // Walk away
          const walkAnim2 = this.time.addEvent({
            delay: 150,
            loop: true,
            callback: () => {
              walkFrame = 1 - walkFrame;
              guy.setTexture(walkFrame === 0 ? "guy1" : "guy2");
            },
          });

          this.tweens.add({
            targets: guy,
            x: this.hangarX - (48 * SCALE) / 2,
            y: this.hangarY,
            duration: 2000,
            ease: "Quad.easeIn",
            onComplete: () => {
              walkAnim2.remove();
              guy.destroy();
              this.introPlaying = false;
            },
          });
        });
      },
    });
  }

  isOnRunway(x, y) {
    const rw = this.runway;
    return (
      Math.abs(x - rw.x) < rw.halfW &&
      Math.abs(y - rw.y) < rw.halfH
    );
  }

  crashDrone() {
    this.flightState = "crashed";
    this.droneState.speed = 0;
    this.droneState.altitude = 0;
    this.drone.setVisible(false);
    this.droneShadow.setVisible(false);

    // Explosion at crash site
    this.missileImpact(this.droneState.x, this.droneState.y);
    this.cameras.main.shake(500, 0.015);

    // Show crash message
    this.crashText = this.add
      .text(this.scale.width / 2, this.scale.height / 2, "DRONE DESTROYED\n\nPress R to restart", {
        fontFamily: "monospace",
        fontSize: "24px",
        color: "#f00",
        backgroundColor: "#000000cc",
        padding: { x: 20, y: 16 },
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(200);
    this.cameras.main.ignore(this.crashText);

    this.restartKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
  }

  update(time, delta) {
    const dt = delta / 1000;
    const ds = this.droneState;

    // --- Intro cutscene playing ---
    if (this.introPlaying) return;

    // --- Crashed state ---
    if (this.flightState === "crashed") {
      if (this.restartKey && Phaser.Input.Keyboard.JustDown(this.restartKey)) {
        this.scene.restart();
      }
      this.updateMissiles(dt);
      return;
    }

    const isGrounded = this.flightState === "grounded";
    const isAirborne = this.flightState === "airborne";
    const speedKnots = ds.speed * 0.5;

    // --- Input: turn ---
    const turnRate = 120; // degrees/sec
    if (this.cursors.left.isDown || this.arrows.left.isDown) {
      ds.angle -= turnRate * dt;
    }
    if (this.cursors.right.isDown || this.arrows.right.isDown) {
      ds.angle += turnRate * dt;
    }

    // --- Input: speed ---
    const accel = 100; // px/s^2
    if (this.cursors.up.isDown || this.arrows.up.isDown) {
      ds.speed = Math.min(ds.maxSpeed, ds.speed + accel * dt);
    }
    if (this.cursors.down.isDown || this.arrows.down.isDown) {
      const minSpd = isAirborne ? 80 : 0; // 40 kts min when flying
      ds.speed = Math.max(minSpd, ds.speed - accel * dt);
    }

    // --- Input: altitude ---
    const altRate = 300; // feet/sec
    if (this.cursors.altUp.isDown) {
      // Can only gain altitude if speed >= 40 kts
      if (speedKnots >= 40) {
        ds.altitude = Math.min(ds.maxAlt, ds.altitude + altRate * dt);
        if (isGrounded) {
          this.flightState = "airborne";
        }
      }
    }
    if (this.cursors.altDown.isDown && isAirborne) {
      ds.altitude = Math.max(0, ds.altitude - altRate * dt);
    }

    // --- Check if drone touched down ---
    if (isAirborne && ds.altitude <= 0) {
      ds.altitude = 0;
      if (this.isOnRunway(ds.x, ds.y)) {
        // Safe landing
        this.flightState = "grounded";
      } else {
        // Crash!
        this.crashDrone();
        return;
      }
    }

    // --- Move drone ---
    const rad = Phaser.Math.DegToRad(ds.angle - 90);
    ds.x += Math.cos(rad) * ds.speed * dt;
    ds.y += Math.sin(rad) * ds.speed * dt;

    // Clamp to world bounds
    ds.x = Phaser.Math.Clamp(ds.x, 0, WORLD_W * SCALE);
    ds.y = Phaser.Math.Clamp(ds.y, 0, WORLD_H * SCALE);

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

    // --- Camera zoom (zoom out above 2000 ft, drone compensates to stay same size) ---
    if (ds.altitude <= 2000) {
      this.cameras.main.setZoom(1);
      this.drone.setScale(SCALE);
    } else {
      const t = (ds.altitude - 2000) / (ds.maxAlt - 2000);
      const zoom = Phaser.Math.Linear(1.0, 0.35, t);
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

    // --- Laser line from drone to target ---
    this.laserLine.clear();
    if (this.targetPos && isAirborne) {
      this.laserLine.lineStyle(1, 0xff0000, 0.5);
      this.laserLine.beginPath();
      this.laserLine.moveTo(ds.x, ds.y);
      this.laserLine.lineTo(this.targetPos.x, this.targetPos.y);
      this.laserLine.strokePath();

      const pulse = 0.8 + Math.sin(time * 0.005) * 0.2;
      this.reticle.setAlpha(pulse);
    }

    // --- Fire missile (only when airborne) ---
    if (Phaser.Input.Keyboard.JustDown(this.cursors.fire) && this.targetPos && isAirborne) {
      this.fireMissile();
    }

    // --- Update missiles ---
    this.updateMissiles(dt);

    // --- HUD ---
    const spdDisplay = Math.round(speedKnots);
    let stateLabel = "";
    if (isGrounded) {
      stateLabel = ds.speed === 0 ? "PARKED" : "TAXIING";
      if (speedKnots >= 40) stateLabel = "READY (E to take off)";
    } else {
      stateLabel = this.targetPos ? "TGT LOCK" : "NO TGT";
    }
    this.hudText.setText(
      `ALT: ${Math.round(ds.altitude)} ft  SPD: ${spdDisplay} kts  HDG: ${(((ds.angle % 360) + 360) % 360) | 0}°\n` +
        `KILLS: ${this.kills}/${this.tankData.length}  ${stateLabel}`,
    );
  }

  fireMissile() {
    if (!this.targetPos) return;

    // Launch from drone's nose in the direction it's facing
    const ds = this.droneState;
    const launchRad = Phaser.Math.DegToRad(ds.angle - 90);
    const launchOffset = 30;
    const startX = ds.x + Math.cos(launchRad) * launchOffset;
    const startY = ds.y + Math.sin(launchRad) * launchOffset;

    const missile = this.add
      .image(startX, startY, "missile")
      .setScale(SCALE)
      .setDepth(9);
    this.hudCam.ignore(missile);

    // Missile starts heading in the drone's direction
    const heading = launchRad;
    missile.setRotation(heading + Math.PI / 2);

    this.missiles.push({
      sprite: missile,
      target: { x: this.targetPos.x, y: this.targetPos.y },
      speed: 280,
      heading,               // current direction of travel (radians)
      turnRate: 3.0,         // radians/sec max turn
      boostTime: 0.3,        // seconds of straight flight before turning
      elapsed: 0,
      altitude: ds.altitude,
      launchAlt: ds.altitude, // remember starting altitude for scale calc
    });
  }

  updateMissiles(dt) {
    for (let i = this.missiles.length - 1; i >= 0; i--) {
      const m = this.missiles[i];
      m.elapsed += dt;

      // Always track the current target point
      if (this.targetPos) {
        m.target.x = this.targetPos.x;
        m.target.y = this.targetPos.y;
      }

      const targetAngle = Phaser.Math.Angle.Between(
        m.sprite.x,
        m.sprite.y,
        m.target.x,
        m.target.y,
      );
      const dist = Phaser.Math.Distance.Between(
        m.sprite.x,
        m.sprite.y,
        m.target.x,
        m.target.y,
      );

      // After initial boost, steer toward target
      if (m.elapsed > m.boostTime) {
        let diff = targetAngle - m.heading;
        // Normalize to [-PI, PI]
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        const maxTurn = m.turnRate * dt;
        m.heading += Phaser.Math.Clamp(diff, -maxTurn, maxTurn);
      }

      // Accelerate after boost phase
      if (m.elapsed > m.boostTime) {
        m.speed = Math.min(400, m.speed + 240 * dt);
      }

      m.sprite.x += Math.cos(m.heading) * m.speed * dt;
      m.sprite.y += Math.sin(m.heading) * m.speed * dt;
      m.sprite.setRotation(m.heading + Math.PI / 2);

      // Missile descends
      m.altitude = Math.max(0, m.altitude - 600 * dt);

      // Scale missile: full size at launch altitude, shrinks as it descends to ground
      const altFrac = m.launchAlt > 0 ? m.altitude / m.launchAlt : 0;
      const mScale = SCALE * (0.3 + altFrac * 0.7);
      m.sprite.setScale(mScale);

      if (dist < 15) {
        // Direct hit on target
        this.missileImpact(m.target.x, m.target.y);
        m.sprite.destroy();
        this.missiles.splice(i, 1);
      } else if (m.altitude <= 0) {
        // Ran out of altitude — impact where the missile actually is
        this.missileImpact(m.sprite.x, m.sprite.y);
        m.sprite.destroy();
        this.missiles.splice(i, 1);
      }
    }
  }

  missileImpact(x, y) {
    // Explosion
    const exp = this.add
      .sprite(x, y, "explosion-sheet", 0)
      .setScale(SCALE * 2)
      .setDepth(11);
    this.hudCam.ignore(exp);
    exp.play("explode");
    exp.once("animationcomplete", () => exp.destroy());

    // Spawn cute symbols
    const symbols = ["heart", "flower", "smiley", "star", "rainbow"];
    for (let i = 0; i < 8; i++) {
      const tex = Phaser.Utils.Array.GetRandom(symbols);
      const sym = this.add.image(x, y, tex).setScale(SCALE).setDepth(12);
      this.hudCam.ignore(sym);
      const angle = Math.random() * Math.PI * 2;
      const dist = 60 + Math.random() * 80;
      const duration = 600 + Math.random() * 600;
      this.tweens.add({
        targets: sym,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist - 30,
        scale: SCALE * (0.5 + Math.random() * 0.8),
        alpha: 0,
        angle: Phaser.Math.Between(-180, 180),
        duration,
        ease: "Quad.easeOut",
        onComplete: () => sym.destroy(),
      });
    }

    // Screen shake
    this.cameras.main.shake(200, 0.005);

    // Check tank hits
    const hitRadius = 40;
    for (const tank of this.tankData) {
      if (!tank.alive) continue;
      const dist = Phaser.Math.Distance.Between(x, y, tank.x, tank.y);
      if (dist < hitRadius) {
        tank.alive = false;
        tank.setTexture("tank-dead");
        this.kills++;

        // Secondary explosion on tank
        this.time.delayedCall(150, () => {
          const exp2 = this.add
            .sprite(tank.x, tank.y, "explosion-sheet", 0)
            .setScale(SCALE * 1.5)
            .setDepth(11);
          this.hudCam.ignore(exp2);
          exp2.play("explode");
          exp2.once("animationcomplete", () => exp2.destroy());
        });
      }
    }
  }
}
