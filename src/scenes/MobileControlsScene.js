import Phaser from "phaser";
import {
  MOBILE_JOYSTICK_RADIUS,
  MOBILE_BUTTON_RADIUS,
  MOBILE_BUTTON_MARGIN,
} from "../constants.js";

// Layout:
//   [FIRE_L]              [FIRE_R]
//   [JOYSTICK]        [SPEED_ROCKER]
//
// Joystick: left/right = turn,  up/down = altitude
// Rocker:   top = speed up,     bottom = speed down

export class MobileControlsScene extends Phaser.Scene {
  constructor() {
    super({ key: "MobileControls" });
  }

  init(data) {
    this.gameScene = data.gameScene;
  }

  create() {
    this.gfx         = this.add.graphics();
    this.allTextObjs = [];
    this.joy         = null;
    this.rocker      = null;
    this.fireButtons = [];

    this.buildControls();

    this.input.on("pointerdown",      this.onDown, this);
    this.input.on("pointermove",      this.onMove, this);
    this.input.on("pointerup",        this.onUp,   this);
    this.input.on("pointerupoutside", this.onUp,   this);

    this.scale.on("resize", () => this.buildControls());
  }

  buildControls() {
    for (const t of this.allTextObjs) t.destroy();
    this.allTextObjs = [];

    const w = this.scale.width;
    const h = this.scale.height;

    // Cap sizes to the short dimension so nothing overflows in landscape
    const ref = Math.min(w, h);
    const jr  = Math.min(MOBILE_JOYSTICK_RADIUS, ref * 0.17);
    const br  = Math.min(MOBILE_BUTTON_RADIUS,   ref * 0.115);
    const m   = Math.min(MOBILE_BUTTON_MARGIN,   ref * 0.05);

    const rw = br * 2;    // rocker width
    const rh = br * 2.8;  // rocker height

    // Bottom row: joystick left, rocker right
    const joyX     = m + jr;
    const joyY     = h - m - jr;
    const rockerCX = w - m - rw / 2;
    const rockerCY = h - m - rh / 2;

    // Fire buttons: directly above each control
    const fireLX = joyX;
    const fireLY = joyY - jr - m - br;
    const fireRX = rockerCX;
    const fireRY = rockerCY - rh / 2 - m - br;

    this.joy = {
      baseX: joyX, baseY: joyY, radius: jr,
      thumbX: joyX, thumbY: joyY,
      active: false, pointerId: -1,
    };

    this.rocker = {
      cx: rockerCX, cy: rockerCY, w: rw, h: rh,
      active: false, pointerId: -1,
      pressedUp: false, pressedDown: false,
      color: 0x44aaff,
    };

    this.fireButtons = [
      { x: fireLX, y: fireLY, r: br, color: 0xff4400, pressed: false, pointerId: -1 },
      { x: fireRX, y: fireRY, r: br, color: 0xff4400, pressed: false, pointerId: -1 },
    ];

    // Publish hit zones so GameScene can skip target-setting when tapping a control
    this.gameScene.mobileControlZones = {
      joystick: { x: joyX,     y: joyY,     r: jr * 1.6 },
      fireL:    { x: fireLX,   y: fireLY,   r: br * 1.2 },
      fireR:    { x: fireRX,   y: fireRY,   r: br * 1.2 },
      rocker:   { x: rockerCX, y: rockerCY, w: rw, h: rh },
    };

    const labelSize = Math.round(br * 0.44) + "px";
    const addLabel = (x, y, str) => {
      const t = this.add.text(x, y, str, {
        fontFamily: "monospace", fontSize: labelSize, color: "#ffffff",
      }).setOrigin(0.5).setAlpha(0.75).setDepth(1);
      this.allTextObjs.push(t);
    };

    addLabel(fireLX, fireLY, "FIRE");
    addLabel(fireRX, fireRY, "FIRE");
    addLabel(rockerCX, rockerCY - rh * 0.26, "▲ SPD");
    addLabel(rockerCX, rockerCY + rh * 0.26, "▼ SPD");
  }

  onDown(pointer) {
    const j  = this.joy;
    const rk = this.rocker;

    if (!j.active &&
        Phaser.Math.Distance.Between(pointer.x, pointer.y, j.baseX, j.baseY) < j.radius * 1.5) {
      j.active = true; j.pointerId = pointer.id;
      this.moveJoy(pointer.x, pointer.y);
      return;
    }

    if (!rk.active && this.inRocker(pointer.x, pointer.y)) {
      rk.active = true; rk.pointerId = pointer.id;
      this.updateRocker(pointer.y);
      return;
    }

    for (const fb of this.fireButtons) {
      if (!fb.pressed &&
          Phaser.Math.Distance.Between(pointer.x, pointer.y, fb.x, fb.y) < fb.r * 1.2) {
        fb.pressed = true; fb.pointerId = pointer.id;
        this.gameScene.mobileInput.fireJustDown = true;
      }
    }
  }

  onMove(pointer) {
    if (this.joy.active   && pointer.id === this.joy.pointerId)    this.moveJoy(pointer.x, pointer.y);
    if (this.rocker.active && pointer.id === this.rocker.pointerId) this.updateRocker(pointer.y);
  }

  onUp(pointer) {
    const j  = this.joy;
    const rk = this.rocker;

    if (j.active && pointer.id === j.pointerId) {
      j.active = false; j.pointerId = -1;
      j.thumbX = j.baseX; j.thumbY = j.baseY;
    }
    if (rk.active && pointer.id === rk.pointerId) {
      rk.active = false; rk.pointerId = -1;
      rk.pressedUp = false; rk.pressedDown = false;
    }
    for (const fb of this.fireButtons) {
      if (fb.pressed && fb.pointerId === pointer.id) {
        fb.pressed = false; fb.pointerId = -1;
      }
    }
  }

  moveJoy(px, py) {
    const j    = this.joy;
    const dx   = px - j.baseX;
    const dy   = py - j.baseY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 0.01) {
      const c = Math.min(dist, j.radius);
      j.thumbX = j.baseX + (dx / dist) * c;
      j.thumbY = j.baseY + (dy / dist) * c;
    }
  }

  inRocker(px, py) {
    const rk = this.rocker;
    return px >= rk.cx - rk.w / 2 && px <= rk.cx + rk.w / 2 &&
           py >= rk.cy - rk.h / 2 && py <= rk.cy + rk.h / 2;
  }

  updateRocker(py) {
    this.rocker.pressedUp   = py <  this.rocker.cy;
    this.rocker.pressedDown = py >= this.rocker.cy;
  }

  update() {
    const mi = this.gameScene.mobileInput;
    if (!mi) return;

    const j = this.joy;
    if (j && j.active) {
      const dx     = j.thumbX - j.baseX;
      const dy     = j.thumbY - j.baseY;
      const thresh = j.radius * 0.2;
      mi.left    = dx < -thresh;
      mi.right   = dx >  thresh;
      mi.altUp   = dy >  thresh;   // push stick DOWN → nose up → gain altitude (real-plane feel)
      mi.altDown = dy < -thresh;   // push stick UP   → nose down → lose altitude
    } else {
      mi.left = mi.right = mi.altUp = mi.altDown = false;
    }

    const rk = this.rocker;
    mi.up   = rk.active && rk.pressedUp;
    mi.down = rk.active && rk.pressedDown;

    mi.fire = this.fireButtons.some(fb => fb.pressed);

    this.renderControls();
  }

  renderControls() {
    const g = this.gfx;
    g.clear();

    // Joystick
    const j = this.joy;
    if (j) {
      g.lineStyle(2, 0xffffff, 0.22);
      g.strokeCircle(j.baseX, j.baseY, j.radius);
      g.lineStyle(1, 0xffffff, 0.1);
      g.strokeCircle(j.baseX, j.baseY, j.radius * 0.5);
      const d = j.radius * 0.75;
      g.fillStyle(0xffffff, 0.15);
      g.fillCircle(j.baseX,     j.baseY - d, 3);
      g.fillCircle(j.baseX,     j.baseY + d, 3);
      g.fillCircle(j.baseX - d, j.baseY,     3);
      g.fillCircle(j.baseX + d, j.baseY,     3);
      g.fillStyle(0xffffff, j.active ? 0.55 : 0.28);
      g.fillCircle(j.thumbX, j.thumbY, j.radius * 0.38);
    }

    // Speed rocker
    const rk = this.rocker;
    if (rk) {
      const rx = rk.cx - rk.w / 2;
      const ry = rk.cy - rk.h / 2;
      const cr = rk.w * 0.35;

      g.fillStyle(rk.color, rk.pressedUp ? 0.6 : 0.18);
      g.fillRoundedRect(rx, ry, rk.w, rk.h / 2 + 2, { tl: cr, tr: cr, bl: 0, br: 0 });

      g.fillStyle(rk.color, rk.pressedDown ? 0.6 : 0.18);
      g.fillRoundedRect(rx, rk.cy - 2, rk.w, rk.h / 2 + 2, { tl: 0, tr: 0, bl: cr, br: cr });

      g.lineStyle(2, rk.color, rk.active ? 0.9 : 0.6);
      g.strokeRoundedRect(rx, ry, rk.w, rk.h, cr);

      g.lineStyle(1, rk.color, 0.3);
      g.beginPath();
      g.moveTo(rx + 5,         rk.cy);
      g.lineTo(rx + rk.w - 5, rk.cy);
      g.strokePath();
    }

    // Fire buttons
    for (const fb of this.fireButtons) {
      g.fillStyle(fb.color, fb.pressed ? 0.6 : 0.18);
      g.fillCircle(fb.x, fb.y, fb.r);
      g.lineStyle(2, fb.color, fb.pressed ? 0.95 : 0.55);
      g.strokeCircle(fb.x, fb.y, fb.r);
    }
  }
}
