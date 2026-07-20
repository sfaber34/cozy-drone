// Pause modal — toggled by ESC during normal flight (see the pause-toggle
// check at the top of GameScene.update()). Shows SFX/music volume sliders
// (0%–150%) plus Resume / Restart / Quit. Restart and Quit both require a
// Yes/No confirmation before doing anything. Quit is a placeholder for now
// (Yes just returns to the main pause view) — real quit behavior belongs
// to the eventual Steam/Electron wrapper, not the web build.
import Phaser from "phaser";
import { getBrowserBottomInset } from "./viewportUtils.js";
import { restartMission } from "./saveSystem.js";
import { setSfxVolume, setMusicVolume } from "./audioSystem.js";
import { persistSettings } from "./settingsSystem.js";

const VOLUME_MIN = 0;
const VOLUME_MAX = 1.5;

export function showPauseModal(scene) {
  if (scene.paused) return;
  scene.paused = true;
  scene._pauseConfirmMode = null;

  // Freeze all tweens + timer events so the world truly stops — GameScene's
  // update() early-returns while paused, but Phaser keeps stepping tweens
  // and timers on its own. Without this, the intro cutscene (all tween/
  // timer driven) would keep playing behind the overlay, and in-game
  // explosions/dust/ghosts would animate on. The pause modal itself uses
  // neither tweens nor timers, so it's unaffected.
  scene.tweens.pauseAll();
  scene.time.paused = true;

  const build = () => buildPauseModal(scene);
  scene._pauseModalBuild = build;
  build();
  scene.scale.on("resize", build);
}

export function hidePauseModal(scene) {
  scene.paused = false;
  scene.tweens.resumeAll();
  scene.time.paused = false;
  destroyPauseModalItems(scene);
  if (scene._pauseModalBuild) {
    scene.scale.off("resize", scene._pauseModalBuild);
    scene._pauseModalBuild = null;
  }
}

function destroyPauseModalItems(scene) {
  const items = scene._pauseModalItems;
  if (!items) return;
  if (items._cleanupFns) {
    for (const fn of items._cleanupFns) fn();
  }
  for (const it of items) it.destroy();
  scene._pauseModalItems = null;
}

function buildPauseModal(scene) {
  destroyPauseModalItems(scene);
  const items = [];
  items._cleanupFns = [];
  scene._pauseModalItems = items;

  const w = scene.scale.width;
  const h = scene.scale.height;
  const narrow = Math.min(w, h);
  const isLandscape = w > h;
  const browserInset = getBrowserBottomInset();
  const bottomSafe =
    (isLandscape ? Math.max(Math.round(h * 0.14), 50) : 28) + browserInset;

  const overlay = scene.add
    .rectangle(-20, -20, w + 40, h + 40, 0x000000, 0.85)
    .setOrigin(0, 0)
    .setDepth(700);
  items.push(overlay);

  if (scene._pauseConfirmMode) {
    buildConfirmView(scene, items, w, h, narrow, bottomSafe);
  } else {
    buildMainView(scene, items, w, h, narrow, bottomSafe);
  }

  scene.cameras.main.ignore(items);
}

function buildMainView(scene, items, w, h, narrow, bottomSafe) {
  const titleSize = Math.max(24, Math.min(44, Math.round(narrow * 0.07)));
  const titleY = Math.max(20, h * 0.05);
  const title = scene.add
    .text(w / 2, titleY, "PAUSED", {
      fontFamily: "monospace",
      fontSize: `${titleSize}px`,
      color: "#66ccff",
      stroke: "#000",
      strokeThickness: 4,
    })
    .setOrigin(0.5, 0)
    .setDepth(701);
  items.push(title);

  // Buttons anchored at the bottom (Resume / Restart / Quit stack up).
  const btnW = Math.min(w * 0.75, 360);
  const btnH = Math.max(44, Math.min(62, Math.round(narrow * 0.09)));
  const btnGap = Math.max(8, Math.round(btnH * 0.18));
  const stackBottom = h - bottomSafe - 10;
  const quitY = stackBottom - btnH / 2;
  const restartY = quitY - btnH - btnGap;
  const resumeY = restartY - btnH - btnGap;

  // Content region: SFX slider, music slider, 2 toggles — laid out
  // top-down between the title and the button stack, evenly gapped.
  const rowW = Math.min(w * 0.7, 340);
  const rowX = w / 2 - rowW / 2;
  const labelSize = Math.max(13, Math.min(18, Math.round(narrow * 0.03)));
  const toggleH = Math.max(30, Math.min(44, Math.round(narrow * 0.055)));
  const sliderH = labelSize + 36; // label above + track + handle below

  const contentTop = titleY + titleSize + Math.round(narrow * 0.03);
  const contentBottom = resumeY - btnH / 2 - Math.round(narrow * 0.03);
  const rowHeights = [sliderH, sliderH, toggleH, toggleH];
  const totalRowH = rowHeights.reduce((a, b) => a + b, 0);
  const gap = Math.max(
    6,
    (contentBottom - contentTop - totalRowH) / (rowHeights.length - 1),
  );

  const persist = () => persistSettings(scene);

  let y = contentTop;
  const advance = (rowH) => {
    const top = y;
    y += rowH + gap;
    return top;
  };

  // SFX slider — the track sits below its label within the row.
  let top = advance(sliderH);
  createLabeledSlider(scene, items, {
    x: rowX,
    y: top + labelSize + 14,
    width: rowW,
    labelText: "SFX VOLUME",
    labelSize,
    value: scene.sfxVolumeMult,
    onChange: (v) => {
      setSfxVolume(scene, v);
      persist();
    },
  });

  top = advance(sliderH);
  createLabeledSlider(scene, items, {
    x: rowX,
    y: top + labelSize + 14,
    width: rowW,
    labelText: "MUSIC VOLUME",
    labelSize,
    value: scene.musicVolumeMult,
    onChange: (v) => {
      setMusicVolume(scene, v);
      persist();
    },
  });

  const makeToggle = (labelText, get, set) => {
    const rowTop = advance(toggleH);
    createToggle(scene, items, {
      x: rowX,
      y: rowTop + toggleH / 2,
      width: rowW,
      labelText,
      labelSize,
      height: toggleH,
      value: get(),
      onChange: (on) => {
        set(on);
        scene.applyHudVisibility();
        persist();
      },
    });
  };

  makeToggle(
    "MINIMAP",
    () => scene.showMinimap,
    (on) => (scene.showMinimap = on),
  );
  makeToggle(
    "TOOLTIPS",
    () => scene.showTooltips,
    (on) => (scene.showTooltips = on),
  );

  const btnLabelSize = Math.max(14, Math.min(22, Math.round(narrow * 0.04)));

  createButton(scene, items, {
    x: w / 2,
    y: resumeY,
    w: btnW,
    h: btnH,
    label: "RESUME",
    labelSize: btnLabelSize,
    color: 0x226a2a,
    onClick: () => hidePauseModal(scene),
  });

  createButton(scene, items, {
    x: w / 2,
    y: restartY,
    w: btnW,
    h: btnH,
    label: "RESTART MISSION",
    labelSize: btnLabelSize,
    color: 0x8a3a10,
    onClick: () => {
      scene._pauseConfirmMode = "restart";
      buildPauseModal(scene);
    },
  });

  createButton(scene, items, {
    x: w / 2,
    y: quitY,
    w: btnW,
    h: btnH,
    label: "QUIT",
    labelSize: btnLabelSize,
    color: 0x444444,
    onClick: () => {
      scene._pauseConfirmMode = "quit";
      buildPauseModal(scene);
    },
  });
}

function buildConfirmView(scene, items, w, h, narrow, bottomSafe) {
  const mode = scene._pauseConfirmMode;
  const question =
    mode === "restart"
      ? "Restart the mission?\nAll progress will be lost."
      : "Quit the game?";

  const titleSize = Math.max(20, Math.min(32, Math.round(narrow * 0.055)));
  const bodySize = Math.max(15, Math.min(22, Math.round(narrow * 0.038)));
  const btnW = Math.min(w * 0.6, 260);
  const btnH = Math.max(46, Math.min(64, Math.round(narrow * 0.1)));
  const btnGap = Math.max(16, Math.round(btnW * 0.08));
  const stackBottom = h - bottomSafe - 10;
  const btnY = stackBottom - btnH / 2;

  const titleY = h * 0.35;
  const title = scene.add
    .text(w / 2, titleY, "ARE YOU SURE?", {
      fontFamily: "monospace",
      fontSize: `${titleSize}px`,
      color: "#ffcc44",
      stroke: "#000",
      strokeThickness: 4,
    })
    .setOrigin(0.5)
    .setDepth(701);
  items.push(title);

  const body = scene.add
    .text(w / 2, titleY + titleSize + 20, question, {
      fontFamily: "monospace",
      fontSize: `${bodySize}px`,
      color: "#dddddd",
      align: "center",
      lineSpacing: 4,
    })
    .setOrigin(0.5, 0)
    .setDepth(701);
  items.push(body);

  const btnLabelSize = Math.max(14, Math.min(20, Math.round(narrow * 0.036)));
  const noX = w / 2 - btnW / 2 - btnGap / 2;
  const yesX = w / 2 + btnW / 2 + btnGap / 2;

  createButton(scene, items, {
    x: noX,
    y: btnY,
    w: btnW,
    h: btnH,
    label: "NO",
    labelSize: btnLabelSize,
    color: 0x444444,
    onClick: () => {
      scene._pauseConfirmMode = null;
      buildPauseModal(scene);
    },
  });

  createButton(scene, items, {
    x: yesX,
    y: btnY,
    w: btnW,
    h: btnH,
    label: "YES",
    labelSize: btnLabelSize,
    color: mode === "restart" ? 0x8a3a10 : 0x444444,
    onClick: () => {
      if (mode === "restart") {
        // Same shared action the mission-briefing modal's restart uses.
        restartMission();
      } else {
        // Quit is a placeholder — there's no "exit" concept in a browser
        // tab. Wire this up to the Steam/Electron wrapper's real quit
        // (e.g. app.quit()) once that wrapper exists; for now just back
        // out of the confirmation.
        scene._pauseConfirmMode = null;
        buildPauseModal(scene);
      }
    },
  });
}

// --- Shared widgets ---------------------------------------------------

function createButton(scene, items, opts) {
  const { x, y, w, h, label, labelSize, color, onClick } = opts;
  const btn = scene.add
    .rectangle(x, y, w, h, color, 0.9)
    .setStrokeStyle(3, 0xffffff, 0.9)
    .setDepth(701)
    .setInteractive({ useHandCursor: true })
    .on("pointerdown", onClick);
  items.push(btn);

  const btnLabel = scene.add
    .text(x, y, label, {
      fontFamily: "monospace",
      fontSize: `${labelSize}px`,
      color: "#ffffff",
    })
    .setOrigin(0.5)
    .setDepth(702);
  items.push(btnLabel);
}

function createLabeledSlider(scene, items, opts) {
  const { x, y, width, labelText, labelSize, value, onChange } = opts;

  const label = scene.add
    .text(x, y - labelSize - 6, labelText, {
      fontFamily: "monospace",
      fontSize: `${labelSize}px`,
      color: "#ffffff",
    })
    .setOrigin(0, 1)
    .setDepth(701);
  items.push(label);

  const pctText = scene.add
    .text(x + width, y - labelSize - 6, `${Math.round(value * 100)}%`, {
      fontFamily: "monospace",
      fontSize: `${labelSize}px`,
      color: "#66ccff",
    })
    .setOrigin(1, 1)
    .setDepth(701);
  items.push(pctText);

  const trackH = 10;
  const track = scene.add
    .rectangle(x, y, width, trackH, 0x333333, 0.9)
    .setOrigin(0, 0.5)
    .setStrokeStyle(2, 0xffffff, 0.5)
    .setDepth(701);
  items.push(track);

  const frac0to1 = (value - VOLUME_MIN) / (VOLUME_MAX - VOLUME_MIN);
  const fill = scene.add
    .rectangle(x, y, Math.max(2, width * frac0to1), trackH, 0x66ccff, 0.9)
    .setOrigin(0, 0.5)
    .setDepth(701);
  items.push(fill);

  // 100% reference tick — a short vertical mark at the default (1.0)
  // position so the player can see where "normal" volume sits on the
  // 0–150% range. Above the fill so it stays visible when the fill
  // overlaps it.
  const oneHundredFrac = (1 - VOLUME_MIN) / (VOLUME_MAX - VOLUME_MIN);
  const tick = scene.add
    .rectangle(x + width * oneHundredFrac, y, 2, trackH + 10, 0xffffff, 0.85)
    .setOrigin(0.5)
    .setDepth(702);
  items.push(tick);

  const handleR = trackH * 1.6;
  const handle = scene.add
    .circle(x + width * frac0to1, y, handleR, 0xffffff, 1)
    .setStrokeStyle(2, 0x000000, 0.6)
    .setDepth(702);
  items.push(handle);

  // Wide invisible hit zone so grabbing near the track (not just the
  // handle) starts a drag — matches how the rest of this UI favors large,
  // forgiving touch/click targets.
  const hitZone = scene.add
    .rectangle(
      x + width / 2,
      y,
      width + handleR * 2,
      Math.max(trackH, handleR * 2) + 16,
      0x000000,
      0.001,
    )
    .setOrigin(0.5)
    .setDepth(701)
    .setInteractive({ useHandCursor: true });
  items.push(hitZone);

  let dragging = false;
  const updateFromPointerX = (px) => {
    const localX = Phaser.Math.Clamp(px - x, 0, width);
    const frac = localX / width;
    const newVal = VOLUME_MIN + frac * (VOLUME_MAX - VOLUME_MIN);
    fill.width = Math.max(2, width * frac);
    handle.x = x + width * frac;
    pctText.setText(`${Math.round(newVal * 100)}%`);
    onChange(newVal);
  };

  hitZone.on("pointerdown", (pointer) => {
    dragging = true;
    updateFromPointerX(pointer.x);
  });
  const onMove = (pointer) => {
    if (!dragging) return;
    updateFromPointerX(pointer.x);
  };
  const onUp = () => {
    dragging = false;
  };
  scene.input.on("pointermove", onMove);
  scene.input.on("pointerup", onUp);
  items._cleanupFns.push(() => {
    scene.input.off("pointermove", onMove);
    scene.input.off("pointerup", onUp);
  });
}

// A labeled ON/OFF row: label on the left, a green(ON)/grey(OFF) pill on
// the right. `value` is the initial boolean; `onChange(bool)` fires on each
// flip. Toggles its own visual state locally so the whole modal doesn't
// need a rebuild just to repaint one pill.
function createToggle(scene, items, opts) {
  const { x, y, width, labelText, labelSize, height, value, onChange } = opts;

  const label = scene.add
    .text(x, y, labelText, {
      fontFamily: "monospace",
      fontSize: `${labelSize}px`,
      color: "#ffffff",
    })
    .setOrigin(0, 0.5)
    .setDepth(701);
  items.push(label);

  const pillW = Math.max(66, Math.round(width * 0.24));
  const pillH = Math.max(26, Math.round(height * 0.82));
  const pillX = x + width - pillW / 2;

  let state = !!value;
  const pill = scene.add
    .rectangle(pillX, y, pillW, pillH, state ? 0x226a2a : 0x555555, 0.95)
    .setStrokeStyle(2, 0xffffff, 0.7)
    .setDepth(701)
    .setInteractive({ useHandCursor: true });
  items.push(pill);

  const pillLabel = scene.add
    .text(pillX, y, state ? "ON" : "OFF", {
      fontFamily: "monospace",
      fontSize: `${Math.max(12, Math.round(labelSize * 0.9))}px`,
      color: "#ffffff",
    })
    .setOrigin(0.5)
    .setDepth(702);
  items.push(pillLabel);

  pill.on("pointerdown", () => {
    state = !state;
    pill.setFillStyle(state ? 0x226a2a : 0x555555, 0.95);
    pillLabel.setText(state ? "ON" : "OFF");
    onChange(state);
  });
}
