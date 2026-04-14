// Briefing modal shown on mobile before gameplay starts.
// Its primary job is to provide a user-gesture hook that reliably unlocks
// the Web Audio context on iOS Safari (auto-unlock is unreliable there).

export function showBriefingModal(scene, onStart) {
  const w = scene.scale.width;
  const h = scene.scale.height;
  const items = [];

  // Full-screen dark overlay
  const overlay = scene.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.85)
    .setDepth(500).setInteractive();
  items.push(overlay);

  const title = scene.add.text(w / 2, h * 0.22, "MISSION BRIEFING", {
    fontFamily: "monospace", fontSize: "28px", color: "#ff4444",
  }).setOrigin(0.5).setDepth(501);
  items.push(title);

  const body = scene.add.text(w / 2, h * 0.42,
    "Eliminate hostile targets.\nProtect civilians at your discretion.\n\nTAP BELOW TO BEGIN.",
    {
      fontFamily: "monospace", fontSize: "16px", color: "#cccccc",
      align: "center", lineSpacing: 6,
    }).setOrigin(0.5).setDepth(501);
  items.push(body);

  const btnW = Math.min(w * 0.7, 360);
  const btnH = 70;
  const btnY = h * 0.72;
  const btn = scene.add.rectangle(w / 2, btnY, btnW, btnH, 0xff3300, 0.9)
    .setStrokeStyle(3, 0xffffff, 0.9).setDepth(501).setInteractive();
  items.push(btn);

  const btnLabel = scene.add.text(w / 2, btnY, "START MISSION", {
    fontFamily: "monospace", fontSize: "22px", color: "#ffffff",
  }).setOrigin(0.5).setDepth(502);
  items.push(btnLabel);

  // Keep modal pinned to HUD camera (not world camera)
  scene.cameras.main.ignore(items);

  // Pulsing button
  scene.tweens.add({
    targets: [btn, btnLabel],
    alpha: { from: 1.0, to: 0.75 },
    duration: 600, yoyo: true, repeat: -1,
  });

  // Block the GameScene's own pointerdown while modal is up
  scene.briefingActive = true;

  const onPointerDown = (pointer) => {
    // Only act on taps within the button
    const dx = Math.abs(pointer.x - w / 2);
    const dy = Math.abs(pointer.y - btnY);
    if (dx > btnW / 2 || dy > btnH / 2) return;

    // --- Unlock audio synchronously from user gesture ---
    const ctx = scene.sound.context;
    if (ctx) {
      if (ctx.state === "suspended") ctx.resume();
      // Prime iOS: play a 1-sample silent buffer through Web Audio
      try {
        const buffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
      } catch (e) { /* no-op */ }
    }
    if (scene.sound.locked && typeof scene.sound.unlock === "function") {
      scene.sound.unlock();
    }

    // Tear down modal
    scene.input.off("pointerdown", onPointerDown);
    scene.tweens.killTweensOf([btn, btnLabel]);
    for (const it of items) it.destroy();
    scene.briefingActive = false;

    if (onStart) onStart();
  };

  scene.input.on("pointerdown", onPointerDown);
}
