// Briefing modal shown before gameplay starts.
// Its primary job is to provide a user-gesture hook that reliably unlocks
// the Web Audio context on iOS Safari (auto-unlock is unreliable there).
//
// CRITICAL: iOS requires ctx.resume() to run synchronously in the native
// event handler. Phaser's pointerdown callbacks are dispatched async from
// its input plugin, so we attach a raw DOM listener to the canvas that
// runs BEFORE Phaser touches the event. We also hit-test the tap against
// the button rect so only the START button dismisses the modal.

const BRIEFING_BODY =
  "ISR has identified a strong enemy presence within this AO. " +
  "Enemy combatants will use civilian population as concealment. " +
  "Prosecute targets of opportunity with extreme prejudice. Weapons hot!\n\n" +
  "Available armament:\n" +
  "- Infinity laser-guided Hellfire missiles\n" +
  "- Infinity 30 mm anti material cannon\n\n" +
  "Return to base after eliminating all hostiles for a special surpise.\n\n" +
  "Remember: We fight them here so we don't have to fight them at home!";

export function showBriefingModal(scene, onStart) {
  let items = [];
  let btnRect = { x: 0, y: 0, w: 0, h: 0 };
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
    const bottomSafe = isLandscape ? Math.max(Math.round(h * 0.14), 50) : 28;

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

    // Button — sized to viewport, anchored near bottom with landscape safe area
    const btnW = Math.min(w * 0.75, 360);
    const btnH = Math.max(50, Math.min(74, Math.round(narrow * 0.11)));
    const btnY = h - bottomSafe - btnH / 2 - 20;

    // Body — wrap to fit viewport width, centered between title and button
    const bodySize = Math.max(11, Math.min(16, Math.round(narrow * 0.028)));
    const bodyMaxW = Math.min(w - 40, 560);
    const titleBottom = titleY + titleSize;
    const bodyCenter = (titleBottom + (btnY - btnH / 2)) / 2;
    const body = scene.add
      .text(w / 2, bodyCenter, BRIEFING_BODY, {
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
      .setDepth(501);
    items.push(btn);

    const labelSize = Math.max(14, Math.min(22, Math.round(narrow * 0.04)));
    const btnLabel = scene.add
      .text(w / 2, btnY, "START MISSION", {
        fontFamily: "monospace",
        fontSize: `${labelSize}px`,
        color: "#ffffff",
      })
      .setOrigin(0.5)
      .setDepth(502);
    items.push(btnLabel);

    scene.cameras.main.ignore(items);

    pulseTween = scene.tweens.add({
      targets: [btn, btnLabel],
      alpha: { from: 1.0, to: 0.75 },
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    // Record button hit-test rect (Phaser scale coords)
    btnRect = { x: w / 2, y: btnY, w: btnW, h: btnH };
  };

  build();
  scene.scale.on("resize", build);
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

  // Convert raw client coords to Phaser scale coords, then hit-test the button
  const hitButton = (clientX, clientY) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = scene.scale.width / rect.width;
    const scaleY = scene.scale.height / rect.height;
    const px = (clientX - rect.left) * scaleX;
    const py = (clientY - rect.top) * scaleY;
    return (
      Math.abs(px - btnRect.x) <= btnRect.w / 2 &&
      Math.abs(py - btnRect.y) <= btnRect.h / 2
    );
  };

  const unlockAndDismiss = () => {
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
    if (pulseTween) pulseTween.stop();
    for (const it of items) it.destroy();
    scene.briefingActive = false;

    if (onStart) onStart();
  };

  const onTouchEnd = (e) => {
    // Only dismiss if the tap landed on the button
    const t = e.changedTouches && e.changedTouches[0];
    if (!t) return;
    if (!hitButton(t.clientX, t.clientY)) return;
    e.preventDefault();
    unlockAndDismiss();
  };
  const onMouseDown = (e) => {
    if (!hitButton(e.clientX, e.clientY)) return;
    unlockAndDismiss();
  };

  canvas.addEventListener("touchend", onTouchEnd, { passive: false });
  canvas.addEventListener("mousedown", onMouseDown);
}
