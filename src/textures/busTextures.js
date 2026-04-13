export function generateBusTextures(scene) {
  // Bus body (14x22, oriented facing north/up — rotated at runtime)
  const busCanvas = scene.textures.createCanvas('bus', 14, 22);
  const b = busCanvas.context;
  // Body
  b.fillStyle = '#dd8800';
  b.fillRect(1, 1, 12, 20);
  // Side windows (3 rows per side)
  b.fillStyle = '#88ccff';
  b.fillRect(2, 4, 3, 3);  b.fillRect(9, 4, 3, 3);
  b.fillRect(2, 9, 3, 3);  b.fillRect(9, 9, 3, 3);
  b.fillRect(2, 14, 3, 3); b.fillRect(9, 14, 3, 3);
  // Front windshield (top of north-facing texture)
  b.fillStyle = '#aaddff';
  b.fillRect(3, 1, 8, 2);
  // Roof center stripe
  b.fillStyle = '#bb7700';
  b.fillRect(5, 1, 4, 20);
  // Outline
  b.fillStyle = '#994400';
  b.fillRect(0, 0, 1, 22);
  b.fillRect(13, 0, 1, 22);
  b.fillRect(0, 0, 14, 1);
  b.fillRect(0, 21, 14, 1);
  busCanvas.refresh();

  // Destroyed bus (same shape, all dark)
  const deadCanvas = scene.textures.createCanvas('bus-dead', 14, 22);
  const d = deadCanvas.context;
  d.fillStyle = '#2a2a2a';
  d.fillRect(1, 1, 12, 20);
  d.fillStyle = '#1a1a1a';
  d.fillRect(2, 4, 3, 3);  d.fillRect(9, 4, 3, 3);
  d.fillRect(2, 9, 3, 3);  d.fillRect(9, 9, 3, 3);
  d.fillStyle = '#111111';
  d.fillRect(0, 0, 1, 22);
  d.fillRect(13, 0, 1, 22);
  d.fillRect(0, 0, 14, 1);
  d.fillRect(0, 21, 14, 1);
  deadCanvas.refresh();

  // Bus shelter canopy (20x10)
  const shelterCanvas = scene.textures.createCanvas('bus-shelter', 20, 10);
  const sh = shelterCanvas.context;
  sh.fillStyle = '#2255aa';
  sh.fillRect(0, 0, 20, 4);
  sh.fillStyle = '#4477cc';
  sh.fillRect(1, 0, 18, 3);
  // Support posts
  sh.fillStyle = '#888888';
  sh.fillRect(1, 4, 2, 6);
  sh.fillRect(17, 4, 2, 6);
  // Bench below canopy
  sh.fillStyle = '#aa8855';
  sh.fillRect(3, 6, 14, 3);
  shelterCanvas.refresh();

  // Bus stop sign post (2x12)
  const signCanvas = scene.textures.createCanvas('bus-sign', 6, 14);
  const sg = signCanvas.context;
  // Post
  sg.fillStyle = '#888888';
  sg.fillRect(2, 4, 2, 10);
  // Sign plate
  sg.fillStyle = '#eecc00';
  sg.fillRect(0, 0, 6, 5);
  sg.fillStyle = '#000000';
  sg.fillRect(1, 1, 4, 1);
  sg.fillRect(1, 3, 4, 1);
  signCanvas.refresh();
}
