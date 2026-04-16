export function generateDroneTextures(scene) {
  // --- Drone (top-down fixed-wing Predator/Global Hawk style, 32x32) ---
  const droneCanvas = scene.textures.createCanvas("drone", 32, 32);
  const dc = droneCanvas.context;

  // Fuselage (long, slender) — nose at top
  dc.fillStyle = "#b0b0b0";
  dc.fillRect(14, 2, 4, 24); // main fuselage
  dc.fillStyle = "#a0a0a0";
  dc.fillRect(15, 1, 2, 1); // nose tip
  dc.fillStyle = "#c0c0c0";
  dc.fillRect(15, 3, 2, 4); // cockpit/sensor bulge highlight

  // Sensor dome (nose)
  dc.fillStyle = "#2a2a2a";
  dc.fillRect(15, 1, 2, 2); // dark sensor ball

  // Main wings (long, thin, swept — positioned mid-body)
  dc.fillStyle = "#989898";
  dc.fillRect(4, 11, 10, 2); // left wing
  dc.fillRect(18, 11, 10, 2); // right wing
  // Wing taper
  dc.fillStyle = "#909090";
  dc.fillRect(2, 12, 2, 1); // left wingtip
  dc.fillRect(28, 12, 2, 1); // right wingtip
  // Wing root blend
  dc.fillStyle = "#a8a8a8";
  dc.fillRect(12, 11, 2, 2);
  dc.fillRect(18, 11, 2, 2);

  // Engine intake bumps on fuselage
  dc.fillStyle = "#808080";
  dc.fillRect(13, 16, 1, 3);
  dc.fillRect(18, 16, 1, 3);

  // V-tail (rear stabilizers)
  dc.fillStyle = "#888";
  dc.fillRect(10, 24, 4, 2); // left tail
  dc.fillRect(18, 24, 4, 2); // right tail
  dc.fillStyle = "#808080";
  dc.fillRect(9, 25, 1, 1); // left tail tip
  dc.fillRect(22, 25, 1, 1); // right tail tip

  // Rear prop hub
  dc.fillStyle = "#555";
  dc.fillRect(15, 26, 2, 2);

  // Hardpoints (weapon pylons under wings)
  dc.fillStyle = "#666";
  dc.fillRect(8, 12, 1, 1);
  dc.fillRect(23, 12, 1, 1);

  // Subtle panel lines
  dc.fillStyle = "#999";
  dc.fillRect(15, 8, 2, 1);
  dc.fillRect(15, 20, 2, 1);

  // Propeller frame 1 (horizontal blade)
  dc.fillStyle = "#aaa";
  dc.fillRect(12, 28, 8, 1);
  dc.fillStyle = "#ccc";
  dc.fillRect(13, 28, 6, 1);

  droneCanvas.refresh();

  // --- Drone frame 2 (propeller vertical) ---
  const drone2Canvas = scene.textures.createCanvas("drone2", 32, 32);
  const dc2 = drone2Canvas.context;
  // Copy the same airframe
  dc2.drawImage(droneCanvas.canvas, 0, 0);
  // Erase the horizontal prop from frame 1
  dc2.clearRect(12, 28, 8, 1);
  // Draw vertical blade instead
  dc2.fillStyle = "#aaa";
  dc2.fillRect(15, 26, 2, 5);
  dc2.fillStyle = "#ccc";
  dc2.fillRect(15, 27, 2, 3);
  drone2Canvas.refresh();

  // --- Drone shadow (same silhouette, fully opaque — transparency is
  //     applied uniformly at the sprite level via setAlpha in GameScene.
  //     Baking alpha into the pixels here caused overlapping fills
  //     (fuselage × wings) to stack darker than the rest.) ---
  const shadowCanvas = scene.textures.createCanvas("drone-shadow", 32, 32);
  const sc = shadowCanvas.context;
  sc.fillStyle = "#000";
  // Fuselage
  sc.fillRect(14, 2, 4, 24);
  sc.fillRect(15, 1, 2, 1);
  // Wings
  sc.fillRect(4, 11, 24, 2);
  sc.fillRect(2, 12, 2, 1);
  sc.fillRect(28, 12, 2, 1);
  // Tail
  sc.fillRect(10, 24, 4, 2);
  sc.fillRect(18, 24, 4, 2);
  // Rear prop hub / shaft — connects the fuselage to the prop shadow
  // so the propeller doesn't appear to float behind the drone.
  sc.fillRect(15, 26, 2, 2);
  shadowCanvas.refresh();

  // --- Propeller shadows (horizontal + vertical blade silhouettes) ---
  const propShadow1 = scene.textures.createCanvas("drone-prop-shadow1", 32, 32);
  const ps1 = propShadow1.context;
  ps1.fillStyle = "#000";
  ps1.fillRect(12, 28, 8, 1);
  propShadow1.refresh();

  const propShadow2 = scene.textures.createCanvas("drone-prop-shadow2", 32, 32);
  const ps2 = propShadow2.context;
  ps2.fillStyle = "#000";
  ps2.fillRect(15, 26, 2, 5);
  propShadow2.refresh();

  // --- Tank (top-down, 12x16) ---
  const tankCanvas = scene.textures.createCanvas("tank", 12, 16);
  const tc = tankCanvas.context;
  // Treads
  tc.fillStyle = "#2a2a1a";
  tc.fillRect(0, 1, 3, 14);
  tc.fillRect(9, 1, 3, 14);
  // Body
  tc.fillStyle = "#5a6e3a";
  tc.fillRect(2, 2, 8, 12);
  // Turret
  tc.fillStyle = "#4a5e2a";
  tc.fillRect(3, 5, 6, 6);
  // Barrel
  tc.fillStyle = "#3a3a2a";
  tc.fillRect(5, 0, 2, 6);
  tankCanvas.refresh();

  // --- Tank destroyed ---
  const tankDeadCanvas = scene.textures.createCanvas("tank-dead", 12, 16);
  const td = tankDeadCanvas.context;
  // Burned treads
  td.fillStyle = "#1a1a0a";
  td.fillRect(0, 1, 3, 14);
  td.fillRect(9, 1, 3, 14);
  // Burned body
  td.fillStyle = "#2a2a1a";
  td.fillRect(2, 2, 8, 12);
  // Destroyed turret
  td.fillStyle = "#1a1a0a";
  td.fillRect(3, 5, 6, 6);
  // Fire pixels
  td.fillStyle = "#f80";
  td.fillRect(4, 6, 2, 2);
  td.fillStyle = "#f00";
  td.fillRect(6, 8, 2, 2);
  td.fillStyle = "#ff0";
  td.fillRect(5, 7, 1, 1);
  tankDeadCanvas.refresh();
}
