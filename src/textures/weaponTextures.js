export function generateWeaponTextures(scene) {
  // --- Cannon bullet (3x3, bright tracer round) ---
  const bulletCanvas = scene.textures.createCanvas('cannon-bullet', 3, 3);
  const bc = bulletCanvas.context;
  bc.fillStyle = '#ff0';
  bc.fillRect(0, 1, 3, 1);
  bc.fillRect(1, 0, 1, 3);
  bc.fillStyle = '#fff';
  bc.fillRect(1, 1, 1, 1);
  bulletCanvas.refresh();

  // --- Cannon impact (small flash, 6x6) ---
  const impactCanvas = scene.textures.createCanvas('cannon-impact', 6, 6);
  const ic = impactCanvas.context;
  ic.fillStyle = '#ff8';
  ic.fillRect(1, 0, 4, 1);
  ic.fillRect(0, 1, 6, 4);
  ic.fillRect(1, 5, 4, 1);
  ic.fillStyle = '#fff';
  ic.fillRect(2, 2, 2, 2);
  impactCanvas.refresh();

  // --- Cannon reticle (cross with dot, 10x10) ---
  const retCanvas = scene.textures.createCanvas('cannon-reticle', 10, 10);
  const rc = retCanvas.context;
  // Thin cross
  rc.fillStyle = '#ff4';
  rc.fillRect(4, 0, 2, 3);
  rc.fillRect(4, 7, 2, 3);
  rc.fillRect(0, 4, 3, 2);
  rc.fillRect(7, 4, 3, 2);
  // Center dot
  rc.fillStyle = '#f00';
  rc.fillRect(4, 4, 2, 2);
  retCanvas.refresh();
}
