import { SCALE } from "../constants.js";
import { introLines } from "../dialog.js";

export function playIntroCutscene(scene) {
  const ds = scene.droneState;
  // Little guy starts at the hangar door (left side of hangar)
  const guyStartX = scene.hangarX - (48 * SCALE) / 2;
  const guyStartY = scene.hangarY;
  const guyTargetX = ds.x + 30; // stop near the nose
  const guyTargetY = ds.y - 30; // nose is at the top of the drone

  const guy = scene.add
    .image(guyStartX, guyStartY, "guy1")
    .setScale(SCALE)
    .setDepth(10);
  scene.hudCam.ignore(guy);

  // Walk animation
  let walkFrame = 0;
  const walkAnim = scene.time.addEvent({
    delay: 150,
    loop: true,
    callback: () => {
      walkFrame = 1 - walkFrame;
      guy.setTexture(walkFrame === 0 ? "guy1" : "guy2");
    },
  });

  // Walk to the drone nose
  scene.tweens.add({
    targets: guy,
    x: guyTargetX,
    y: guyTargetY,
    duration: 2000,
    ease: "Quad.easeOut",
    onComplete: () => {
      // Stop walking
      walkAnim.remove();
      guy.setTexture("guy1");

      // Spawn kiss hearts
      for (let i = 0; i < 5; i++) {
        const heart = scene.add
          .image(guyTargetX, guyTargetY - 10, "heart")
          .setScale(SCALE)
          .setDepth(12);
        scene.hudCam.ignore(heart);
        const angle =
          -Math.PI * 0.2 +
          (i / 4) * -Math.PI * 0.6 +
          (Math.random() - 0.5) * 0.5;
        const dist = 80 + Math.random() * 60;
        scene.tweens.add({
          targets: heart,
          x: guyTargetX + Math.cos(angle) * dist,
          y: guyTargetY + Math.sin(angle) * dist - 40,
          scale: SCALE * (0.6 + Math.random() * 0.6),
          alpha: 0,
          duration: 1000 + Math.random() * 500,
          delay: i * 200,
          ease: "Quad.easeOut",
          onComplete: () => heart.destroy(),
        });
      }

      // Speech bubble — cycles through lines. Positioned above the guy's
      // head with origin (0.5, 1) so its bottom edge anchors above him.
      const introLine =
        introLines[Math.floor(Math.random() * introLines.length)];
      const bubble = scene.add
        .text(guyTargetX, guyTargetY - 20, introLine, {
          fontFamily: "monospace",
          fontSize: "10px",
          color: "#000",
          backgroundColor: "#fff",
          padding: { x: 8, y: 6 },
          align: "center",
        })
        .setOrigin(0.5, 1.4)
        .setDepth(13)
        .setScale(SCALE * 0.6);
      scene.hudCam.ignore(bubble);

      // After a pause, guy walks away
      scene.time.delayedCall(2500, () => {
        bubble.destroy();

        // Walk away
        const walkAnim2 = scene.time.addEvent({
          delay: 150,
          loop: true,
          callback: () => {
            walkFrame = 1 - walkFrame;
            guy.setTexture(walkFrame === 0 ? "guy1" : "guy2");
          },
        });

        scene.tweens.add({
          targets: guy,
          x: scene.hangarX - (48 * SCALE) / 2,
          y: scene.hangarY,
          duration: 2000,
          ease: "Quad.easeIn",
          onComplete: () => {
            walkAnim2.remove();
            guy.destroy();
            scene.introPlaying = false;
          },
        });
      });
    },
  });
}
