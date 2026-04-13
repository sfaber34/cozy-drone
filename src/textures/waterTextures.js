export function generateWaterTextures(scene) {
  // wave (12×5): double crest — two wave humps side by side
  const wc = scene.textures.createCanvas('wave', 12, 5);
  const w = wc.context;
  // Shadow trough
  w.fillStyle = '#155f9a';
  w.fillRect(0, 3, 12, 2);
  // Wave body
  w.fillStyle = '#2080b8';
  w.fillRect(1, 2, 4, 2);
  w.fillRect(7, 2, 4, 2);
  // Upper highlight
  w.fillStyle = '#50b0de';
  w.fillRect(1, 1, 4, 1);
  w.fillRect(7, 1, 4, 1);
  // Foam crest
  w.fillStyle = '#b8e0f8';
  w.fillRect(2, 0, 2, 1);
  w.fillRect(8, 0, 2, 1);
  wc.refresh();

  // wave-sm (8×4): single smaller crest
  const sc = scene.textures.createCanvas('wave-sm', 8, 4);
  const s = sc.context;
  s.fillStyle = '#155f9a';
  s.fillRect(1, 3, 6, 1);
  s.fillStyle = '#2080b8';
  s.fillRect(1, 2, 6, 1);
  s.fillStyle = '#50b0de';
  s.fillRect(1, 1, 6, 1);
  s.fillStyle = '#b8e0f8';
  s.fillRect(2, 0, 4, 1);
  sc.refresh();

  // wave-dot (4×3): tiny foam fleck for high-density fill
  const dc = scene.textures.createCanvas('wave-dot', 4, 3);
  const d = dc.context;
  d.fillStyle = '#2d8fc4';
  d.fillRect(1, 1, 2, 1);
  d.fillStyle = '#90ccee';
  d.fillRect(1, 0, 2, 1);
  d.fillStyle = '#155f9a';
  d.fillRect(1, 2, 2, 1);
  dc.refresh();
}
