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
    this.joy          = null;
    this.rocker       = null;
    this.fireButtons  = [];
    this.weaponRocker = null;

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
    const isLandscape = w > h;

    // Cap sizes to the short dimension so nothing overflows in landscape
    const ref = Math.min(w, h);
    const jr  = Math.min(MOBILE_JOYSTICK_RADIUS, ref * 0.17);
    const br  = Math.min(MOBILE_BUTTON_RADIUS,   ref * 0.115);
    const m   = Math.min(MOBILE_BUTTON_MARGIN,   ref * 0.05);

    const rw = br * 2;    // rocker width
    const rh = br * 2.8;  // rocker height

    // In landscape, browser chrome (address bar + home indicator) eats into the
    // bottom of the viewport. Add extra padding so controls stay on screen.
    const extraBottomPad = isLandscape ? Math.max(Math.round(h * 0.10), 30) : 0;
    const safeH = h - extraBottomPad;

    // Bottom row: joystick left, rocker right (relative to safeH)
    const joyX     = m + jr;
    const joyY     = safeH - m - jr;
    const rockerCX = w - m - rw / 2;
    const rockerCY = safeH - m - rh / 2;

    // Fire buttons: directly above each control
    const fireLX = joyX;
    const fireLY = joyY - jr - m - br;
    const fireRX = rockerCX;
    const fireRY = rockerCY - rh / 2 - m - br;

    this.joy = {
      baseX: joyX, baseY: joyY, radius: jr,
      thumbX: joyX, thumbY: joyY,
      active: false, pointerId: -1,
      axisLock: null,  // 'x' | 'y' | null — locked once deflection clears threshold
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

    // Weapon selector rocker — horizontal pill at bottom center
    const wrW = br * 2.4;
    const wrH = br * 0.8;
    const wrCX = w / 2;
    const wrCY = safeH - m - wrH / 2;
    this.weaponRocker = { cx: wrCX, cy: wrCY, w: wrW, h: wrH };

    // Publish hit zones so GameScene can skip target-setting when tapping a control
    this.gameScene.mobileControlZones = {
      joystick:     { x: joyX,     y: joyY,     r: jr * 1.6 },
      fireL:        { x: fireLX,   y: fireLY,   r: br * 1.2 },
      fireR:        { x: fireRX,   y: fireRY,   r: br * 1.2 },
      rocker:       { x: rockerCX, y: rockerCY, w: rw, h: rh },
      weaponRocker: { x: wrCX,     y: wrCY,     w: wrW, h: wrH },
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
    addLabel(wrCX - wrW * 0.25, wrCY, "MSL");
    addLabel(wrCX + wrW * 0.25, wrCY, "GUN");
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

    // Weapon selector rocker — tap left = MSL (1), tap right = GUN (2)
    const wr = this.weaponRocker;
    if (wr &&
        pointer.x >= wr.cx - wr.w / 2 && pointer.x <= wr.cx + wr.w / 2 &&
        pointer.y >= wr.cy - wr.h / 2 && pointer.y <= wr.cy + wr.h / 2) {
      this.gameScene.selectedWeapon = pointer.x < wr.cx ? 1 : 2;
      return;
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
      j.axisLock = null;
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
    const j  = this.joy;
    const dx = px - j.baseX;
    const dy = py - j.baseY;

    const dist = Math.sqrt(dx * dx + dy * dy);
    const lockThresh = j.radius * 0.40;

    // Release the axis lock when thumb returns near center
    if (dist < lockThresh) j.axisLock = null;

    // Latch the dominant axis once deflection clears the threshold
    if (!j.axisLock && dist > lockThresh) {
      j.axisLock = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y';
    }

    // Constrain thumb to the locked arm; before lock, stay at center
    if (j.axisLock === 'x') {
      j.thumbX = j.baseX + Phaser.Math.Clamp(dx, -j.radius, j.radius);
      j.thumbY = j.baseY;
    } else if (j.axisLock === 'y') {
      j.thumbX = j.baseX;
      j.thumbY = j.baseY + Phaser.Math.Clamp(dy, -j.radius, j.radius);
    } else {
      j.thumbX = j.baseX;
      j.thumbY = j.baseY;
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

    // Joystick → turn + ALTITUDE (analog: proportional to deflection)
    const j = this.joy;
    mi.turnAmount = 0;
    mi.altAmount  = 0;
    if (j && j.active) {
      // Normalize to −1…+1 relative to full radius
      const normX = Phaser.Math.Clamp((j.thumbX - j.baseX) / j.radius, -1, 1);
      const normY = Phaser.Math.Clamp((j.thumbY - j.baseY) / j.radius, -1, 1);
      // Thumb is physically constrained to one arm by moveJoy — one of normX/normY is always 0
      const dead = 0.12;
      mi.turnAmount = Math.abs(normX) > dead ? normX : 0;
      mi.altAmount  = Math.abs(normY) > dead ? normY : 0;
      mi.left    = normX < -dead;
      mi.right   = normX >  dead;
      mi.altUp   = normY >  dead;
      mi.altDown = normY < -dead;
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

    // Joystick — cross/plus shape to show the two allowed axes
    const j = this.joy;
    if (j) {
      const hl = j.radius;            // arm length from center
      const hw = j.radius * 0.38;     // arm half-width
      const cx = j.baseX, cy = j.baseY;

      // Build the 12-point cross polygon
      const pts = [
        cx - hw, cy - hl,
        cx + hw, cy - hl,
        cx + hw, cy - hw,
        cx + hl, cy - hw,
        cx + hl, cy + hw,
        cx + hw, cy + hw,
        cx + hw, cy + hl,
        cx - hw, cy + hl,
        cx - hw, cy + hw,
        cx - hl, cy + hw,
        cx - hl, cy - hw,
        cx - hw, cy - hw,
      ];

      // Fill
      g.fillStyle(0xffffff, 0.07);
      g.beginPath();
      g.moveTo(pts[0], pts[1]);
      for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]);
      g.closePath();
      g.fillPath();

      // Outline
      g.lineStyle(1.5, 0xffffff, 0.28);
      g.beginPath();
      g.moveTo(pts[0], pts[1]);
      for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]);
      g.closePath();
      g.strokePath();

      // Center dot
      g.fillStyle(0xffffff, 0.18);
      g.fillCircle(cx, cy, hw * 0.55);

      // Thumb — circle on the active arm
      g.fillStyle(0xffffff, j.active ? 0.6 : 0.3);
      g.fillCircle(j.thumbX, j.thumbY, hw * 0.85);
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

    // Weapon selector rocker
    const wr = this.weaponRocker;
    if (wr) {
      const sel = this.gameScene.selectedWeapon;
      const cr  = wr.h * 0.45;
      const lx  = wr.cx - wr.w / 2;
      const ty  = wr.cy - wr.h / 2;

      // Left half — MSL (orange), weapon 1
      g.fillStyle(0xff6600, sel === 1 ? 0.65 : 0.18);
      g.fillRoundedRect(lx, ty, wr.w / 2 + 2, wr.h, { tl: cr, tr: 0, bl: cr, br: 0 });

      // Right half — GUN (blue), weapon 2
      g.fillStyle(0x44aaff, sel === 2 ? 0.65 : 0.18);
      g.fillRoundedRect(wr.cx - 2, ty, wr.w / 2 + 2, wr.h, { tl: 0, tr: cr, bl: 0, br: cr });

      // Border
      g.lineStyle(2, 0xffffff, 0.5);
      g.strokeRoundedRect(lx, ty, wr.w, wr.h, cr);

      // Divider
      g.lineStyle(1, 0xffffff, 0.25);
      g.beginPath();
      g.moveTo(wr.cx, ty + 4);
      g.lineTo(wr.cx, ty + wr.h - 4);
      g.strokePath();
    }
  }
}
