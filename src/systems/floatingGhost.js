import Phaser from "phaser";
import { SCALE, MOBILE_DIALOG_SCALE } from "../constants.js";
import { ghostLines } from "../dialog.js";
import { tryRegisterGhostBubble } from "./ghostBubbleUtils.js";

// A detached, self-animating ghost for kills that AREN'T individual
// scene.people entries — e.g. car passengers (a count, not people objects).
//
// It drifts up-and-outward and fades to match the "--- GHOST ---" block in
// peopleSystem.updatePeople EXACTLY, so a car kill looks like a building/
// person kill. Two things make that match:
//   1. Same constants: spawn 15px out along `angle`, driftX =
//      cos(angle)·(15–40), driftY = -(20–40), wobble = sin·15·dt, and a
//      linear alpha fade of 0.08/s (0.8 → 0 over 10s).
//   2. Frame-rate INDEPENDENCE: movement uses the real per-frame delta, not a
//      hardcoded 60fps step. The old car-ghost code did `x += driftX*0.016`
//      every onUpdate, so on a 120/144Hz display the ghosts flew ~2× too far.
//
// Keep in sync with that peopleSystem block if its drift/fade ever changes.
export function spawnFloatingGhost(scene, cx, cy, angle) {
  const x = cx + Math.cos(angle) * 15;
  const y = cy + Math.sin(angle) * 15;

  const ghost = scene.add
    .image(x, y, "ghost")
    .setScale(SCALE)
    .setDepth(13)
    .setAlpha(0.8);
  scene.hudCam.ignore(ghost);

  let bubble = null;
  if (tryRegisterGhostBubble(scene, x, y)) {
    const line = Phaser.Utils.Array.GetRandom(ghostLines);
    bubble = scene.add
      .text(x + 20, y - 20, line, {
        fontFamily: "monospace",
        fontSize: "8px",
        color: "#aaccff",
        backgroundColor: "#000000aa",
        padding: { x: 4, y: 3 },
      })
      .setScale(SCALE * 0.5 * (scene.isMobile ? MOBILE_DIALOG_SCALE : 1))
      .setDepth(14);
    scene.hudCam.ignore(bubble);
  }

  const driftX = Math.cos(angle) * (15 + Math.random() * 25);
  const driftY = -(20 + Math.random() * 20);
  const wobble = Math.random() * Math.PI * 2;

  // The tween drives only the fade — wall-clock (10s), so already frame-rate
  // independent. Position is stepped per-frame with the REAL delta in
  // onUpdate, mirroring the people-system ghost block.
  scene.tweens.add({
    targets: ghost,
    alpha: 0,
    duration: 10000,
    ease: "Linear",
    onUpdate: () => {
      const dt = scene.game.loop.delta / 1000;
      ghost.y += driftY * dt;
      ghost.x += driftX * dt + Math.sin(ghost.y * 0.04 + wobble) * 15 * dt;
      if (bubble) {
        bubble.setPosition(ghost.x + 20, ghost.y - 20);
        bubble.setAlpha(ghost.alpha);
      }
    },
    onComplete: () => {
      ghost.destroy();
      if (bubble) bubble.destroy();
    },
  });
}
