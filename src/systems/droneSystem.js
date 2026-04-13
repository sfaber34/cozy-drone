import Phaser from "phaser";
import { SCALE, CRASH_SHAKE_DURATION, CRASH_SHAKE_INTENSITY } from "../constants.js";
import { missileImpact } from "./missileSystem.js";

export function isOnRunway(scene, x, y) {
  const rw = scene.runway;
  return Math.abs(x - rw.x) < rw.halfW && Math.abs(y - rw.y) < rw.halfH;
}

export function crashDrone(scene) {
  scene.flightState = "crashed";
  scene.droneState.speed = 0;
  scene.droneState.altitude = 0;
  scene.drone.setVisible(false);
  scene.droneShadow.setVisible(false);

  // Stop engine sound
  if (scene.engineA && scene.engineA.isPlaying) scene.engineA.stop();
  if (scene.engineB && scene.engineB.isPlaying) scene.engineB.stop();
  scene.engineActive = null;

  // Explosion at crash site
  missileImpact(scene, scene.droneState.x, scene.droneState.y);
  scene.cameras.main.shake(CRASH_SHAKE_DURATION, CRASH_SHAKE_INTENSITY);

  // Show crash message
  const hint = scene.isMobile ? "Tap to restart" : "Press R  or  tap to restart";
  scene.crashText = scene.add
    .text(
      scene.scale.width / 2,
      scene.scale.height / 2,
      `DRONE DESTROYED\n\n${hint}`,
      {
        fontFamily: "monospace",
        fontSize: "24px",
        color: "#f00",
        backgroundColor: "#000000cc",
        padding: { x: 20, y: 16 },
        align: "center",
      },
    )
    .setOrigin(0.5)
    .setDepth(200);
  scene.cameras.main.ignore(scene.crashText);

  // Enable tap-to-restart after a short delay (avoids accidental restart on crash)
  scene.time.delayedCall(700, () => {
    scene.crashRestartReady = true;
  });

  scene.restartKey = scene.input.keyboard.addKey(
    Phaser.Input.Keyboard.KeyCodes.R,
  );
}
