export function generateChickenFightTextures(scene) {
  // --- Money/bill (4x3, held by spectators) ---
  const moneyCanvas = scene.textures.createCanvas('money', 4, 3);
  const mc = moneyCanvas.context;
  mc.fillStyle = '#44aa44';
  mc.fillRect(0, 0, 4, 3);
  mc.fillStyle = '#66cc66';
  mc.fillRect(1, 1, 2, 1);
  mc.fillStyle = '#338833';
  mc.fillRect(0, 0, 4, 1);
  moneyCanvas.refresh();

  // --- Small fighting ring fence (top-down, 24x24) ---
  const ringCanvas = scene.textures.createCanvas('fight-ring', 24, 24);
  const rc = ringCanvas.context;
  // Dirt floor
  rc.fillStyle = '#b09060';
  rc.fillRect(2, 2, 20, 20);
  // Fence rails
  rc.fillStyle = '#8a6a3a';
  rc.fillRect(0, 0, 24, 2);
  rc.fillRect(0, 22, 24, 2);
  rc.fillRect(0, 0, 2, 24);
  rc.fillRect(22, 0, 2, 24);
  // Posts at corners
  rc.fillStyle = '#6a4a2a';
  rc.fillRect(0, 0, 3, 3);
  rc.fillRect(21, 0, 3, 3);
  rc.fillRect(0, 21, 3, 3);
  rc.fillRect(21, 21, 3, 3);
  // Scuff marks in the dirt
  rc.fillStyle = '#a08050';
  rc.fillRect(8, 10, 3, 2);
  rc.fillRect(14, 12, 2, 3);
  rc.fillRect(10, 7, 2, 2);
  ringCanvas.refresh();
}
