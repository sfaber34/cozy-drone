export function generateWeaponTextures(scene) {
  // --- Cluster bomb body (8x12, elongated oval from top-down) ---
  const cbCanvas = scene.textures.createCanvas('cluster-bomb', 8, 12);
  const cb = cbCanvas.context;
  cb.fillStyle = '#556677';
  cb.fillRect(2, 1, 4, 10);
  cb.fillStyle = '#7799aa';
  cb.fillRect(3, 2, 2, 7);
  cb.fillStyle = '#445566';
  cb.fillRect(2, 0, 4, 2);   // nose
  cb.fillRect(2, 10, 4, 2);  // tail
  cb.fillRect(0, 9, 2, 3);   // left fin
  cb.fillRect(6, 9, 2, 3);   // right fin
  cbCanvas.refresh();

  // --- Cluster bomb casing half (8x5, post-split half-shell) ---
  const chCanvas = scene.textures.createCanvas('cluster-casing', 8, 5);
  const ch = chCanvas.context;
  ch.fillStyle = '#556677';
  ch.fillRect(0, 1, 8, 3);
  ch.fillStyle = '#7799aa';
  ch.fillRect(1, 1, 6, 2);
  ch.fillStyle = '#334455';
  ch.fillRect(0, 4, 8, 1);
  chCanvas.refresh();

  // --- Bomblet (4x4, small round sub-munition) ---
  const blCanvas = scene.textures.createCanvas('bomblet', 4, 4);
  const bl = blCanvas.context;
  bl.fillStyle = '#445566';
  bl.fillRect(1, 0, 2, 1);
  bl.fillRect(0, 1, 4, 2);
  bl.fillRect(1, 3, 2, 1);
  bl.fillStyle = '#778899';
  bl.fillRect(1, 1, 2, 2);
  bl.fillStyle = '#aabbcc';
  bl.fillRect(1, 1, 1, 1);  // highlight pixel
  blCanvas.refresh();

  // --- Cluster reticle (32x32, orange circle with tick marks) ---
  const crCanvas = scene.textures.createCanvas('cluster-reticle', 32, 32);
  const cr = crCanvas.context;
  cr.strokeStyle = '#ff8800';
  cr.lineWidth = 1.5;
  cr.beginPath();
  cr.arc(16, 16, 13, 0, Math.PI * 2);
  cr.stroke();
  // Cardinal tick marks
  cr.fillStyle = '#ff8800';
  cr.fillRect(15, 1, 2, 4);
  cr.fillRect(15, 27, 2, 4);
  cr.fillRect(1, 15, 4, 2);
  cr.fillRect(27, 15, 4, 2);
  // Center crosshair
  cr.fillStyle = '#ff4400';
  cr.fillRect(15, 14, 2, 4);
  cr.fillRect(14, 15, 4, 2);
  crCanvas.refresh();

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
