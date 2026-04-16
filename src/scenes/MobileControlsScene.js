import Phaser from "phaser";
import { getBrowserBottomInset, getMobileControlsYOffset } from "../systems/viewportUtils.js";
import {
  MOBILE_JOYSTICK_RADIUS,
  MOBILE_BUTTON_RADIUS,
  MOBILE_BUTTON_MARGIN,
  MOBILE_ZOOM_FACTOR,
} from "../constants.js";

// Layout:
//   [ALT_ROCKER]                  [FIRE]
//   [TURN_SLIDER]             [SPEED_ROCKER]
//                 [WEAPON]
//
// Turn slider: analog left/right
// Alt rocker:  top = altitude up,  bottom = altitude down
// Speed rocker: top = speed up,    bottom = speed down

export class MobileControlsScene extends Phaser.Scene {
  constructor() {
    super({ key: "MobileControls" });
  }

  init(data) {
    this.gameScene = data.gameScene;
  }

  create() {
    this.gfx = this.add.graphics();
    this.allTextObjs = [];
    this.turnSlider = null;
    this.altRocker = null;
    this.speedRocker = null;
    this.fireButtons = [];
    this.weaponRocker = null;

    this.buildControls();

    this.input.on("pointerdown", this.onDown, this);
    this.input.on("pointermove", this.onMove, this);
    this.input.on("pointerup", this.onUp, this);
    this.input.on("pointerupoutside", this.onUp, this);

    this.scale.on("resize", () => this.buildControls());
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", () => this.buildControls());
    }
  }

  buildControls() {
    for (const t of this.allTextObjs) t.destroy();
    this.allTextObjs = [];

    const w = this.scale.width;
    const h = this.scale.height;
    const isLandscape = w > h;

    // main.js renders the game at internal size = viewport / MOBILE_ZOOM_FACTOR
    // and CSS-scales the whole canvas down to the real viewport. Control pixel
    // constants (MOBILE_JOYSTICK_RADIUS etc.) were tuned for CSS pixels, so
    // when placed in internal-canvas space they'd appear MOBILE_ZOOM_FACTOR×
    // smaller on screen. Boost them by 1/MOBILE_ZOOM_FACTOR so the CSS
    // downscale lands them back at their intended physical size.
    const boost = MOBILE_ZOOM_FACTOR > 0 ? 1 / MOBILE_ZOOM_FACTOR : 1;

    const ref = Math.min(w, h);
    const jr = Math.min(MOBILE_JOYSTICK_RADIUS * boost, ref * 0.17);
    const br = Math.min(MOBILE_BUTTON_RADIUS * boost, ref * 0.115);
    const m = Math.min(MOBILE_BUTTON_MARGIN * boost, ref * 0.05);

    // Speed rocker dims (bottom right)
    const srW = br * 2;
    const srH = br * 2.8;

    // Alt rocker dims (left column, matches speed rocker)
    const arW = br * 2;
    const arH = br * 2.8;

    // Turn slider dims (horizontal pill at bottom left)
    const tsW = jr * 2.4;
    const tsH = jr * 0.9;

    // Chrome on iOS keeps a persistent bottom nav bar that covers the canvas;
    // reserve that height so controls aren't hidden underneath it.
    // getBrowserBottomInset() reports CSS pixels; everything here lives in
    // internal-canvas pixels, so boost to match. The "30" and "15" literals
    // are CSS-tuned too and get the same treatment.
    const browserInset = getBrowserBottomInset() * boost;
    const extraBottomPad = Math.max(
      isLandscape ? Math.max(Math.round(h * 0.1), 30 * boost) : 0,
      browserInset,
    );
    // Per-browser Y offset — positive values push controls DOWN (closer to
    // the screen bottom). Used to compensate for browser chrome that
    // `getBrowserBottomInset()` can't detect on certain iOS combinations.
    const yOffset = getMobileControlsYOffset() * boost;
    // Lift everything up a bit for visual breathing room from the bottom
    // edge, then re-apply the per-browser downward offset.
    const safeH = h - extraBottomPad - 15 * boost + yOffset;

    // Bottom-right: speed rocker + right fire button above
    const speedCX = w - m - srW / 2;
    const speedCY = safeH - m - srH / 2;
    const fireX = speedCX;
    const fireY = speedCY - srH / 2 - m - br;

    // Bottom-left column: alt rocker at bottom, turn slider above it
    const altCX = m + arW / 2;
    const altCY = safeH - m - arH / 2;
    const turnCX = m + tsW / 2;
    const turnCY = altCY - arH / 2 - m - tsH / 2;

    this.turnSlider = {
      cx: turnCX,
      cy: turnCY,
      w: tsW,
      h: tsH,
      thumbX: turnCX,
      active: false,
      pointerId: -1,
    };

    this.altRocker = {
      cx: altCX,
      cy: altCY,
      w: arW,
      h: arH,
      active: false,
      pointerId: -1,
      pressedUp: false,
      pressedDown: false,
      color: 0x88dd66,
    };

    this.speedRocker = {
      cx: speedCX,
      cy: speedCY,
      w: srW,
      h: srH,
      active: false,
      pointerId: -1,
      pressedUp: false,
      pressedDown: false,
      color: 0x44aaff,
    };

    this.fireButtons = [
      {
        x: fireX,
        y: fireY,
        r: br,
        color: 0xff4400,
        pressed: false,
        pointerId: -1,
      },
    ];

    // Weapon selector rocker — horizontal pill at bottom center
    const wrW = br * 3.0; // 25% larger than the old br * 2.4
    const wrH = br * 1.0; // 25% larger than the old br * 0.8
    const wrCX = w / 2;
    const wrCY = safeH - m - wrH / 2;
    this.weaponRocker = { cx: wrCX, cy: wrCY, w: wrW, h: wrH };

    // Publish hit zones so GameScene can skip target-setting when tapping a control
    this.gameScene.mobileControlZones = {
      turnSlider: { x: turnCX, y: turnCY, w: tsW, h: tsH },
      altRocker: { x: altCX, y: altCY, w: arW, h: arH },
      rocker: { x: speedCX, y: speedCY, w: srW, h: srH },
      fireR: { x: fireX, y: fireY, r: br * 1.2 },
      weaponRocker: { x: wrCX, y: wrCY, w: wrW, h: wrH },
    };

    const labelSize = Math.round(br * 0.44) + "px";
    const addLabel = (x, y, str) => {
      const t = this.add
        .text(x, y, str, {
          fontFamily: "monospace",
          fontSize: labelSize,
          color: "#ffffff",
        })
        .setOrigin(0.5)
        .setAlpha(0.75)
        .setDepth(1);
      this.allTextObjs.push(t);
    };

    addLabel(fireX, fireY, "FIRE");
    addLabel(speedCX, speedCY - srH * 0.26, "▲ SPD");
    addLabel(speedCX, speedCY + srH * 0.26, "▼ SPD");
    addLabel(altCX, altCY - arH * 0.26, "▲ ALT");
    addLabel(altCX, altCY + arH * 0.26, "▼ ALT");
    addLabel(turnCX, turnCY, "◄  TURN  ►");
    addLabel(wrCX - wrW * 0.25, wrCY, "MSL");
    addLabel(wrCX + wrW * 0.25, wrCY, "GUN");
  }

  onDown(pointer) {
    const ts = this.turnSlider;
    const ar = this.altRocker;
    const sr = this.speedRocker;

    if (!ts.active && this.inRect(pointer.x, pointer.y, ts)) {
      ts.active = true;
      ts.pointerId = pointer.id;
      this.moveTurn(pointer.x);
      return;
    }

    if (!ar.active && this.inRect(pointer.x, pointer.y, ar)) {
      ar.active = true;
      ar.pointerId = pointer.id;
      this.updateRocker(ar, pointer.y);
      return;
    }

    if (!sr.active && this.inRect(pointer.x, pointer.y, sr)) {
      sr.active = true;
      sr.pointerId = pointer.id;
      this.updateRocker(sr, pointer.y);
      return;
    }

    for (const fb of this.fireButtons) {
      if (
        !fb.pressed &&
        Phaser.Math.Distance.Between(pointer.x, pointer.y, fb.x, fb.y) <
          fb.r * 1.2
      ) {
        fb.pressed = true;
        fb.pointerId = pointer.id;
        this.gameScene.mobileInput.fireJustDown = true;
      }
    }

    // Weapon selector rocker — tap left = MSL (1), tap right = GUN (2)
    const wr = this.weaponRocker;
    if (wr && this.inRect(pointer.x, pointer.y, wr)) {
      this.gameScene.selectedWeapon = pointer.x < wr.cx ? 1 : 2;
      return;
    }
  }

  onMove(pointer) {
    if (this.turnSlider.active && pointer.id === this.turnSlider.pointerId)
      this.moveTurn(pointer.x);
    if (this.altRocker.active && pointer.id === this.altRocker.pointerId)
      this.updateRocker(this.altRocker, pointer.y);
    if (this.speedRocker.active && pointer.id === this.speedRocker.pointerId)
      this.updateRocker(this.speedRocker, pointer.y);
  }

  onUp(pointer) {
    const ts = this.turnSlider;
    const ar = this.altRocker;
    const sr = this.speedRocker;

    if (ts.active && pointer.id === ts.pointerId) {
      ts.active = false;
      ts.pointerId = -1;
      ts.thumbX = ts.cx;
    }
    if (ar.active && pointer.id === ar.pointerId) {
      ar.active = false;
      ar.pointerId = -1;
      ar.pressedUp = false;
      ar.pressedDown = false;
    }
    if (sr.active && pointer.id === sr.pointerId) {
      sr.active = false;
      sr.pointerId = -1;
      sr.pressedUp = false;
      sr.pressedDown = false;
    }
    for (const fb of this.fireButtons) {
      if (fb.pressed && fb.pointerId === pointer.id) {
        fb.pressed = false;
        fb.pointerId = -1;
      }
    }
  }

  moveTurn(px) {
    const ts = this.turnSlider;
    const halfW = ts.w / 2;
    ts.thumbX = Phaser.Math.Clamp(px, ts.cx - halfW, ts.cx + halfW);
  }

  inRect(px, py, r) {
    return (
      px >= r.cx - r.w / 2 &&
      px <= r.cx + r.w / 2 &&
      py >= r.cy - r.h / 2 &&
      py <= r.cy + r.h / 2
    );
  }

  updateRocker(rk, py) {
    rk.pressedUp = py < rk.cy;
    rk.pressedDown = py >= rk.cy;
  }

  update() {
    const mi = this.gameScene.mobileInput;
    if (!mi) return;

    // Turn slider → analog left/right
    const ts = this.turnSlider;
    mi.turnAmount = 0;
    if (ts && ts.active) {
      const normX = Phaser.Math.Clamp((ts.thumbX - ts.cx) / (ts.w / 2), -1, 1);
      const dead = 0.12;
      mi.turnAmount = Math.abs(normX) > dead ? normX : 0;
      mi.left = normX < -dead;
      mi.right = normX > dead;
    } else {
      mi.left = mi.right = false;
    }

    // Alt rocker → up/down (binary, analog form ±1 for consistency)
    const ar = this.altRocker;
    mi.altUp = ar.active && ar.pressedUp;
    mi.altDown = ar.active && ar.pressedDown;
    mi.altAmount = mi.altUp ? 1 : mi.altDown ? -1 : 0;

    const sr = this.speedRocker;
    mi.up = sr.active && sr.pressedUp;
    mi.down = sr.active && sr.pressedDown;

    mi.fire = this.fireButtons.some((fb) => fb.pressed);

    this.renderControls();
  }

  renderControls() {
    const g = this.gfx;
    g.clear();

    // Turn slider — horizontal pill with thumb
    const ts = this.turnSlider;
    if (ts) {
      const cr = ts.h * 0.45;
      const lx = ts.cx - ts.w / 2;
      const ty = ts.cy - ts.h / 2;

      g.fillStyle(0xffffff, 0.09);
      g.fillRoundedRect(lx, ty, ts.w, ts.h, cr);

      g.lineStyle(1.5, 0xffffff, 0.3);
      g.strokeRoundedRect(lx, ty, ts.w, ts.h, cr);

      // Center tick
      g.lineStyle(1, 0xffffff, 0.25);
      g.beginPath();
      g.moveTo(ts.cx, ty + 4);
      g.lineTo(ts.cx, ty + ts.h - 4);
      g.strokePath();

      // Thumb
      g.fillStyle(0xffffff, ts.active ? 0.6 : 0.3);
      g.fillCircle(ts.thumbX, ts.cy, ts.h * 0.38);
    }

    // Shared rocker renderer
    const drawRocker = (rk) => {
      if (!rk) return;
      const rx = rk.cx - rk.w / 2;
      const ry = rk.cy - rk.h / 2;
      const cr = rk.w * 0.35;

      g.fillStyle(rk.color, rk.pressedUp ? 0.6 : 0.18);
      g.fillRoundedRect(rx, ry, rk.w, rk.h / 2 + 2, {
        tl: cr,
        tr: cr,
        bl: 0,
        br: 0,
      });

      g.fillStyle(rk.color, rk.pressedDown ? 0.6 : 0.18);
      g.fillRoundedRect(rx, rk.cy - 2, rk.w, rk.h / 2 + 2, {
        tl: 0,
        tr: 0,
        bl: cr,
        br: cr,
      });

      g.lineStyle(2, rk.color, rk.active ? 0.9 : 0.6);
      g.strokeRoundedRect(rx, ry, rk.w, rk.h, cr);

      g.lineStyle(1, rk.color, 0.3);
      g.beginPath();
      g.moveTo(rx + 5, rk.cy);
      g.lineTo(rx + rk.w - 5, rk.cy);
      g.strokePath();
    };

    drawRocker(this.altRocker);
    drawRocker(this.speedRocker);

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
      const cr = wr.h * 0.45;
      const lx = wr.cx - wr.w / 2;
      const ty = wr.cy - wr.h / 2;

      g.fillStyle(0xff6600, sel === 1 ? 0.65 : 0.18);
      g.fillRoundedRect(lx, ty, wr.w / 2 + 2, wr.h, {
        tl: cr,
        tr: 0,
        bl: cr,
        br: 0,
      });

      g.fillStyle(0x44aaff, sel === 2 ? 0.65 : 0.18);
      g.fillRoundedRect(wr.cx - 2, ty, wr.w / 2 + 2, wr.h, {
        tl: 0,
        tr: cr,
        bl: 0,
        br: cr,
      });

      g.lineStyle(2, 0xffffff, 0.5);
      g.strokeRoundedRect(lx, ty, wr.w, wr.h, cr);

      g.lineStyle(1, 0xffffff, 0.25);
      g.beginPath();
      g.moveTo(wr.cx, ty + 4);
      g.lineTo(wr.cx, ty + wr.h - 4);
      g.strokePath();
    }
  }
}
