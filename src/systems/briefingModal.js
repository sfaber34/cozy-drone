import { getBrowserBottomInset } from "./viewportUtils.js";

// Briefing modal shown before gameplay starts.
// Its primary job is to provide a user-gesture hook that reliably unlocks
// the Web Audio context on iOS Safari (auto-unlock is unreliable there).
//
// CRITICAL: iOS requires ctx.resume() to run synchronously in the native
// event handler. Phaser's pointerdown callbacks are dispatched async from
// its input plugin, so we attach a raw DOM listener to the canvas that
// runs BEFORE Phaser touches the event. We also hit-test the tap against
// the button rect so only the START button dismisses the modal.

function buildBriefingBody(scene) {
  const tapWord = scene.isMobile ? "tap" : "click";
  return (
    "ISR has identified a strong enemy presence within this AO. " +
    "Enemy combatants are known to use the civilian population as concealment. " +
    "Prosecute targets of opportunity with extreme prejudice. Weapons hot!\n\n" +
    "Available Armament:\n" +
    `• Infinity laser-guided Hellfire missiles [${tapWord} to target]\n` +
    "• Infinity 30mm anti-materiel cannon rounds\n\n" +
    "Return to base after eliminating all hostiles for a special surprise!\n\n" +
    "Remember: We fight them here so we don't have to fight them at home!"
  );
}

// opts:
//   hasSave  — when true, shows CONTINUE MISSION (primary) + RESTART
//              MISSION (secondary) instead of the single START button
//   onChoice — called with "start" | "continue" | "restart" after the
//              audio unlock + modal teardown
export function showBriefingModal(scene, opts) {
  const { hasSave = false, onChoice } = opts;
  let items = [];
  // Hit-test rects for the raw DOM listeners, one per button:
  // { x, y, w, h, choice }
  let btnRects = [];
  let pulseTween = null;

  // Rebuild the modal layout for the current viewport size. Called on
  // orientation / resize so the text + button always fit.
  const build = () => {
    // Tear down previous
    for (const it of items) it.destroy();
    items = [];
    if (pulseTween) pulseTween.stop();

    const w = scene.scale.width;
    const h = scene.scale.height;
    const narrow = Math.min(w, h);
    const isLandscape = w > h;

    // Mobile browser chrome (URL bar, home indicator) eats into the bottom
    // of the canvas in landscape. Reserve extra space so the button stays on
    // screen.
    // Reserve Chrome iOS's persistent bottom nav bar (if present) on top of
    // the landscape/portrait safe margin.
    const browserInset = getBrowserBottomInset();
    const bottomSafe =
      (isLandscape ? Math.max(Math.round(h * 0.14), 50) : 28) + browserInset;

    // Full-bleed overlay — over-extended by 20 px in every direction so no
    // sub-pixel / letterbox gap can show the world through at the edges.
    const overlay = scene.add
      .rectangle(-20, -20, w + 40, h + 40, 0x000000, 0.85)
      .setOrigin(0, 0)
      .setDepth(500);
    items.push(overlay);

    // Title — scale down on narrow viewports, pinned near the top
    const titleSize = Math.max(18, Math.min(32, Math.round(narrow * 0.05)));
    const titleY = Math.max(28, h * 0.08);
    const title = scene.add
      .text(w / 2, titleY, "MISSION BRIEFING", {
        fontFamily: "monospace",
        fontSize: `${titleSize}px`,
        color: "#ff4444",
      })
      .setOrigin(0.5, 0)
      .setDepth(501);
    items.push(title);

    // Buttons — sized to viewport, anchored near bottom with landscape safe
    // area. With a save present the primary (CONTINUE) sits above a smaller
    // secondary (RESTART); without one it's the single START button in the
    // original spot.
    const btnW = Math.min(w * 0.75, 360);
    const btnH = Math.max(50, Math.min(74, Math.round(narrow * 0.11)));
    const secH = hasSave ? Math.max(38, Math.round(btnH * 0.7)) : 0;
    const secGap = hasSave ? 12 : 0;
    const stackBottom = h - bottomSafe - 20;
    const secY = stackBottom - secH / 2;
    const btnY = stackBottom - secH - secGap - btnH / 2;

    // Body — wrap to fit viewport width, centered between title and button
    const bodySize = Math.max(14, Math.min(20, Math.round(narrow * 0.034)));
    // Use most of the viewport width in landscape — 560px cap was making
    // wide screens look empty. Cap at 900 for readability on very wide
    // screens (too-long lines hurt scanability).
    const bodyMaxW = Math.min(w - 40, 900);
    const titleBottom = titleY + titleSize;
    const bodyCenter = (titleBottom + (btnY - btnH / 2)) / 2;
    const body = scene.add
      .text(w / 2, bodyCenter, buildBriefingBody(scene), {
        fontFamily: "monospace",
        fontSize: `${bodySize}px`,
        color: "#cccccc",
        align: "center",
        lineSpacing: 4,
        wordWrap: { width: bodyMaxW, useAdvancedWrap: true },
      })
      .setOrigin(0.5, 0.5)
      .setDepth(501);
    items.push(body);
    const btn = scene.add
      .rectangle(w / 2, btnY, btnW, btnH, 0xff3300, 0.9)
      .setStrokeStyle(3, 0xffffff, 0.9)
      .setDepth(501)
      .setInteractive({ useHandCursor: true });
    items.push(btn);

    const labelSize = Math.max(14, Math.min(22, Math.round(narrow * 0.04)));
    const btnLabel = scene.add
      .text(w / 2, btnY, hasSave ? "CONTINUE MISSION" : "START MISSION", {
        fontFamily: "monospace",
        fontSize: `${labelSize}px`,
        color: "#ffffff",
      })
      .setOrigin(0.5)
      .setDepth(502);
    items.push(btnLabel);

    btnRects = [
      { x: w / 2, y: btnY, w: btnW, h: btnH, choice: hasSave ? "continue" : "start" },
    ];

    if (hasSave) {
      const secBtn = scene.add
        .rectangle(w / 2, secY, btnW, secH, 0x333333, 0.9)
        .setStrokeStyle(2, 0xaaaaaa, 0.9)
        .setDepth(501)
        .setInteractive({ useHandCursor: true });
      items.push(secBtn);
      const secLabel = scene.add
        .text(w / 2, secY, "RESTART MISSION", {
          fontFamily: "monospace",
          fontSize: `${Math.max(12, Math.round(labelSize * 0.85))}px`,
          color: "#cccccc",
        })
        .setOrigin(0.5)
        .setDepth(502);
      items.push(secLabel);
      btnRects.push({ x: w / 2, y: secY, w: btnW, h: secH, choice: "restart" });
    }

    // Quit button — small, tucked into the lower-right corner, away from
    // the centered Start/Continue stack. Desktop only: quitting has no
    // meaning on the mobile web build (the Steam/Electron wrapper is where
    // this gets wired to a real app.quit()). Deep crimson so it reads as a
    // distinct, more "serious" action next to the orange primary button
    // without clashing.
    if (!scene.isMobile) {
      const quitW = Math.min(w * 0.22, 150);
      const quitH = Math.max(32, Math.round(btnH * 0.55));
      const quitMargin = Math.max(16, Math.round(w * 0.02));
      const quitX = w - quitW / 2 - quitMargin;
      const quitY = h - quitH / 2 - Math.max(14, Math.round(h * 0.025));
      const quitBtn = scene.add
        .rectangle(quitX, quitY, quitW, quitH, 0xb02222, 0.9)
        .setStrokeStyle(2, 0xff8866, 0.9)
        .setDepth(501)
        .setInteractive({ useHandCursor: true });
      items.push(quitBtn);
      const quitLabel = scene.add
        .text(quitX, quitY, "QUIT GAME", {
          fontFamily: "monospace",
          fontSize: `${Math.max(11, Math.round(labelSize * 0.7))}px`,
          color: "#ffffff",
        })
        .setOrigin(0.5)
        .setDepth(502);
      items.push(quitLabel);
      btnRects.push({
        x: quitX,
        y: quitY,
        w: quitW,
        h: quitH,
        choice: "quit",
      });
    }

    scene.cameras.main.ignore(items);
    // Published so later world-init code can exclude these from the HUD
    // camera's catch-up ignore filter (otherwise the modal ends up
    // ignored by BOTH cameras and vanishes).
    scene._briefingModalItems = items;

    pulseTween = scene.tweens.add({
      targets: [btn, btnLabel],
      alpha: { from: 1.0, to: 0.75 },
      duration: 600,
      yoyo: true,
      repeat: -1,
    });
  };

  build();
  scene.scale.on("resize", build);
  // Also rebuild when browser UI chrome toggles (e.g. Chrome iOS's bottom
  // nav bar appearing/disappearing changes the visible area)
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", build);
  }
  scene.briefingActive = true;

  // Hide the initial HTML loading spinner — the briefing modal is now
  // the first thing the user interacts with.
  const loader = document.getElementById("loader");
  if (loader) {
    loader.classList.add("hide");
    setTimeout(() => loader.remove(), 400);
  }

  // --- Audio unlock: raw DOM listener on the canvas ---
  const canvas = scene.game.canvas;
  let dismissed = false;

  // Convert raw client coords to Phaser scale coords, then hit-test the
  // buttons. Returns the hit button's choice string, or null.
  const hitButton = (clientX, clientY) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = scene.scale.width / rect.width;
    const scaleY = scene.scale.height / rect.height;
    const px = (clientX - rect.left) * scaleX;
    const py = (clientY - rect.top) * scaleY;
    for (const r of btnRects) {
      if (Math.abs(px - r.x) <= r.w / 2 && Math.abs(py - r.y) <= r.h / 2)
        return r.choice;
    }
    return null;
  };

  const unlockAndDismiss = (choice) => {
    if (dismissed) return;
    dismissed = true;

    // --- Unlock audio SYNCHRONOUSLY in this native handler ---
    const mgr = scene.sound;
    const ctx = mgr.context;
    if (ctx) {
      if (ctx.state === "suspended") ctx.resume();
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
    }

    // iOS silent-switch bypass
    if (!scene.game._silentAudioEl) {
      const el = document.createElement("audio");
      el.src = "/silent.mp3";
      el.loop = true;
      el.volume = 0.01;
      el.playsInline = true;
      el.setAttribute("playsinline", "");
      el.setAttribute("webkit-playsinline", "");
      const p = el.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
      scene.game._silentAudioEl = el;
    }

    mgr.unlocked = true;
    mgr.locked = false;
    if (mgr.emit) mgr.emit("unlocked", mgr);

    canvas.removeEventListener("touchend", onTouchEnd);
    canvas.removeEventListener("mousedown", onMouseDown);
    scene.scale.off("resize", build);
    if (window.visualViewport) {
      window.visualViewport.removeEventListener("resize", build);
    }
    if (pulseTween) pulseTween.stop();
    for (const it of items) it.destroy();
    scene._briefingModalItems = null;
    scene.briefingActive = false;

    if (onChoice) onChoice(choice);
  };

  // Quit is a placeholder for now — a browser tab has no real "quit". The
  // Steam/Electron wrapper will wire this to the app's actual quit
  // (e.g. window.close() / app.quit()). Until then it intentionally does
  // nothing AND must NOT run the audio-unlock/dismiss path, so the briefing
  // stays up. Kept here (not routed through onChoice) so GameScene's choice
  // handling stays start/continue/restart only.
  const handleQuit = () => {
    /* inop placeholder — see comment above */
  };

  const onTouchEnd = (e) => {
    // Only dismiss if the tap landed on a button
    const t = e.changedTouches && e.changedTouches[0];
    if (!t) return;
    const choice = hitButton(t.clientX, t.clientY);
    if (!choice) return;
    e.preventDefault();
    if (choice === "quit") return handleQuit();
    unlockAndDismiss(choice);
  };
  const onMouseDown = (e) => {
    const choice = hitButton(e.clientX, e.clientY);
    if (!choice) return;
    if (choice === "quit") return handleQuit();
    unlockAndDismiss(choice);
  };

  canvas.addEventListener("touchend", onTouchEnd, { passive: false });
  canvas.addEventListener("mousedown", onMouseDown);
}
