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

    // --- Drone ---
    this.drone = this.add
      .image((WORLD_W * SCALE) / 2, (WORLD_H * SCALE) / 2, "drone")
      .setScale(SCALE)
      .setDepth(10);

    // Propeller animation timer
    this.propFrame = 0;
    this.propTimer = 0;

    // Drone state
    this.droneState = {
      x: this.drone.x,
      y: this.drone.y,
      angle: 0, // degrees, 0 = up/north
      speed: 80, // pixels/sec
      altitude: 500, // feet, affects shadow offset & zoom
      minAlt: 200,
      maxAlt: 15000,
      minSpeed: 80,
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
  }

  update(time, delta) {
    const dt = delta / 1000;
    const ds = this.droneState;

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
      ds.speed = Math.max(ds.minSpeed, ds.speed - accel * dt);
    }

    // --- Input: altitude ---
    const altRate = 300; // feet/sec
    if (this.cursors.altUp.isDown) {
      ds.altitude = Math.min(ds.maxAlt, ds.altitude + altRate * dt);
    }
    if (this.cursors.altDown.isDown) {
      ds.altitude = Math.max(ds.minAlt, ds.altitude - altRate * dt);
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
    const shadowOffset = ds.altitude * 0.04;
    this.droneShadow.setPosition(ds.x + shadowOffset, ds.y + shadowOffset);
    this.droneShadow.setAngle(ds.angle);
    // Shadow gets fainter at higher altitude
    this.droneShadow.setAlpha(
      Phaser.Math.Clamp(0.4 - ds.altitude * 0.0001, 0.05, 0.4),
    );
    // Shadow gets smaller at higher altitude
    const shadowScale =
      SCALE * Phaser.Math.Clamp(1.2 - ds.altitude * 0.0003, 0.6, 1.2);
    this.droneShadow.setScale(shadowScale);

    // --- Camera zoom (zoom out above 2000 ft, drone compensates to stay same size) ---
    if (ds.altitude <= 2000) {
      this.cameras.main.setZoom(1);
      this.drone.setScale(SCALE);
    } else {
      // Lerp zoom from 1.0 at 2000ft down to 0.35 at 15000ft
      const t = (ds.altitude - 2000) / (ds.maxAlt - 2000);
      const zoom = Phaser.Math.Linear(1.0, 0.35, t);
      this.cameras.main.setZoom(zoom);
      // Scale drone up to counteract zoom so it stays the same screen size
      this.drone.setScale(SCALE / zoom);
    }

    // --- Propeller animation (faster spin at higher speed) ---
    const propInterval = Math.max(30, 150 - ds.speed * 0.4);
    this.propTimer += delta;
    if (this.propTimer >= propInterval) {
      this.propTimer = 0;
      this.propFrame = 1 - this.propFrame;
      this.drone.setTexture(this.propFrame === 0 ? "drone" : "drone2");
    }

    // --- Laser line from drone to target ---
    this.laserLine.clear();
    if (this.targetPos) {
      this.laserLine.lineStyle(1, 0xff0000, 0.5);
      this.laserLine.beginPath();
      this.laserLine.moveTo(ds.x, ds.y);
      this.laserLine.lineTo(this.targetPos.x, this.targetPos.y);
      this.laserLine.strokePath();

      // Pulse the reticle
      const pulse = 0.8 + Math.sin(time * 0.005) * 0.2;
      this.reticle.setAlpha(pulse);
    }

    // --- Fire missile ---
    if (Phaser.Input.Keyboard.JustDown(this.cursors.fire) && this.targetPos) {
      this.fireMissile();
    }

    // --- Update missiles ---
    this.updateMissiles(dt);

    // --- HUD ---
    const speedKnots = Math.round(ds.speed * 0.5);
    this.hudText.setText(
      `ALT: ${Math.round(ds.altitude)} ft  SPD: ${speedKnots} kts  HDG: ${(((ds.angle % 360) + 360) % 360) | 0}°\n` +
        `KILLS: ${this.kills}/${this.tankData.length}  MSL: ${this.targetPos ? "TGT LOCK" : "NO TGT"}`,
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
