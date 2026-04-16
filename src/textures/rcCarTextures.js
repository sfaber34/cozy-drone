// RC-car set-piece textures: tiny top-down cars (multiple colors) and a
// handheld controller sprite that drivers hold.
export function generateRcCarTextures(scene) {
  // --- Controller (held by drivers, 6x5) ---
  // Light-grey box (contrasts against robes + desert) with antenna + joysticks
  const ctrlC = scene.textures.createCanvas("rc-controller", 6, 5);
  const c = ctrlC.context;
  c.fillStyle = "#c8c8c8";        // body
  c.fillRect(0, 1, 6, 3);
  c.fillStyle = "#e8e8e8";        // top highlight
  c.fillRect(0, 1, 6, 1);
  c.fillStyle = "#2a2a2a";        // joystick stems
  c.fillRect(1, 2, 1, 1);
  c.fillRect(4, 2, 1, 1);
  c.fillStyle = "#8a8a8a";        // antenna tip (silver — matches body)
  c.fillRect(2, 0, 1, 1);
  c.fillStyle = "#888";            // seam under the grip
  c.fillRect(0, 4, 6, 1);
  ctrlC.refresh();

  // --- RC car body (top-down, 10x6) — shared base, tinted per car ---
  const carC = scene.textures.createCanvas("rc-car", 10, 6);
  const r = carC.context;
  // Chassis (white, will be tinted per car)
  r.fillStyle = "#ffffff";
  r.fillRect(1, 1, 8, 4);
  r.fillRect(0, 2, 10, 2);
  // Wheels (always dark)
  r.fillStyle = "#1a1a1a";
  r.fillRect(0, 1, 2, 1);
  r.fillRect(8, 1, 2, 1);
  r.fillRect(0, 4, 2, 1);
  r.fillRect(8, 4, 2, 1);
  // Windshield (dark tint at the front)
  r.fillStyle = "#444466";
  r.fillRect(2, 2, 2, 2);
  // Front bumper stripe
  r.fillStyle = "#cccccc";
  r.fillRect(0, 2, 1, 2);
  // Rear spoiler hint
  r.fillStyle = "#aaaaaa";
  r.fillRect(8, 2, 1, 2);
  carC.refresh();
}
