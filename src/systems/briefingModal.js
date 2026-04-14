// Briefing modal shown before gameplay starts.
// Its primary job is to provide a user-gesture hook that reliably unlocks
// the Web Audio context on iOS Safari (auto-unlock is unreliable there).
//
// CRITICAL: iOS requires ctx.resume() to run synchronously in the native
// event handler. Phaser's pointerdown callbacks are dispatched async from
// its input plugin, so we attach a raw DOM listener to the canvas that
// runs BEFORE Phaser touches the event.

export function showBriefingModal(scene, onStart) {
  const w = scene.scale.width;
  const h = scene.scale.height;
  const items = [];

  const overlay = scene.add
    .rectangle(w / 2, h / 2, w, h, 0x000000, 0.85)
    .setDepth(500);
  items.push(overlay);

  const title = scene.add
    .text(w / 2, h * 0.22, "MISSION BRIEFING", {
      fontFamily: "monospace",
      fontSize: "28px",
      color: "#ff4444",
    })
    .setOrigin(0.5)
    .setDepth(501);
  items.push(title);

  const body = scene.add
    .text(
      w / 2,
      h * 0.42,
      "ISR has identified a strong enemy presence within this AO. Enemy combatants will use civilian population as concealment. Prosecute targets of opportunity with extreme prejudice. Weapons hot!\n\n\nAvailable armament:\n- Infinity laser-guided Hellfire missiles\n- Infinity 30 mm anti material cannon\n\n\nRemember: We fight them there so we don't have to fight them at home!",
      {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#cccccc",
        align: "center",
        lineSpacing: 6,
      },
    )
    .setOrigin(0.5)
    .setDepth(501);
  items.push(body);

  const btnW = Math.min(w * 0.7, 360);
  const btnH = 70;
  const btnY = h * 0.72;
  const btn = scene.add
    .rectangle(w / 2, btnY, btnW, btnH, 0xff3300, 0.9)
    .setStrokeStyle(3, 0xffffff, 0.9)
    .setDepth(501);
  items.push(btn);

  const btnLabel = scene.add
    .text(w / 2, btnY, "START MISSION", {
      fontFamily: "monospace",
      fontSize: "22px",
      color: "#ffffff",
    })
    .setOrigin(0.5)
    .setDepth(502);
  items.push(btnLabel);

  scene.cameras.main.ignore(items);

  scene.tweens.add({
    targets: [btn, btnLabel],
    alpha: { from: 1.0, to: 0.75 },
    duration: 600,
    yoyo: true,
    repeat: -1,
  });

  scene.briefingActive = true;

  // --- Audio unlock: raw DOM listener on the canvas ---
  const canvas = scene.game.canvas;
  let dismissed = false;

  const unlockAndDismiss = () => {
    if (dismissed) return;
    dismissed = true;

    // --- Unlock audio SYNCHRONOUSLY in this native handler ---
    const mgr = scene.sound;
    const ctx = mgr.context;
    if (ctx) {
      if (ctx.state === "suspended") ctx.resume();
      // Prime Web Audio: play a silent 1-sample buffer
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
    }

    // iOS silent-switch bypass: a silent looping HTML5 <audio> element
    // promotes the page to the "media" audio category, which ignores the
    // hardware mute switch. Subsequent Web Audio output rides along.
    if (!scene.game._silentAudioEl) {
      const el = document.createElement("audio");
      el.src = "/silent.mp3";
      el.loop = true;
      el.volume = 0.01; // nonzero so iOS treats the page as actively playing media
      el.playsInline = true;
      el.setAttribute("playsinline", "");
      el.setAttribute("webkit-playsinline", "");
      const p = el.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
      scene.game._silentAudioEl = el;
    }

    // Forcibly flip Phaser's internal unlock state. No try/catch — we want
    // to know if this fails.
    mgr.unlocked = true;
    mgr.locked = false;
    if (mgr.emit) mgr.emit("unlocked", mgr);

    canvas.removeEventListener("touchend", onTouchEnd);
    canvas.removeEventListener("mousedown", onMouseDown);
    scene.tweens.killTweensOf([btn, btnLabel]);
    for (const it of items) it.destroy();
    scene.briefingActive = false;

    if (onStart) onStart();
  };

  const onTouchEnd = (e) => {
    e.preventDefault();
    unlockAndDismiss();
  };
  const onMouseDown = () => {
    unlockAndDismiss();
  };

  canvas.addEventListener("touchend", onTouchEnd, { passive: false });
  canvas.addEventListener("mousedown", onMouseDown);
}
