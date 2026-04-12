import Phaser from 'phaser';

export function generateCamelRaceTextures(scene) {
  const trackW = 16; // tile size, will be scaled 3x = 48px wide track

  // --- Straight horizontal track (16x16) ---
  const trackHCanvas = scene.textures.createCanvas('track-h', 16, 16);
  const th = trackHCanvas.context;
  // Dirt surface
  th.fillStyle = '#a08050';
  th.fillRect(0, 2, 16, 12);
  // Edge lines (packed dirt borders)
  th.fillStyle = '#8a6a38';
  th.fillRect(0, 1, 16, 2);
  th.fillRect(0, 13, 16, 2);
  // Inner track marking
  th.fillStyle = '#b09060';
  th.fillRect(0, 7, 16, 2);
  // Hoof marks
  const rng = new Phaser.Math.RandomDataGenerator(['trackH']);
  for (let i = 0; i < 6; i++) {
    th.fillStyle = '#907848';
    th.fillRect(rng.between(0, 14), rng.between(3, 12), 2, 1);
  }
  trackHCanvas.refresh();

  // --- Straight vertical track (16x16) ---
  const trackVCanvas = scene.textures.createCanvas('track-v', 16, 16);
  const tv = trackVCanvas.context;
  tv.fillStyle = '#a08050';
  tv.fillRect(2, 0, 12, 16);
  tv.fillStyle = '#8a6a38';
  tv.fillRect(1, 0, 2, 16);
  tv.fillRect(13, 0, 2, 16);
  tv.fillStyle = '#b09060';
  tv.fillRect(7, 0, 2, 16);
  const rng2 = new Phaser.Math.RandomDataGenerator(['trackV']);
  for (let i = 0; i < 6; i++) {
    tv.fillStyle = '#907848';
    tv.fillRect(rng2.between(3, 12), rng2.between(0, 14), 1, 2);
  }
  trackVCanvas.refresh();

  // --- Corner: top-left (connects top edge to left edge) ---
  const tlCanvas = scene.textures.createCanvas('track-tl', 16, 16);
  const tl = tlCanvas.context;
  // Fill dirt in the corner arc area
  tl.fillStyle = '#a08050';
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const dx = x - 15;
      const dy = y - 15;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d >= 2 && d <= 14) {
        tl.fillRect(x, y, 1, 1);
      }
    }
  }
  // Outer edge
  tl.fillStyle = '#8a6a38';
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const d = Math.sqrt((x - 15) ** 2 + (y - 15) ** 2);
      if (d >= 13 && d <= 15) tl.fillRect(x, y, 1, 1);
    }
  }
  // Inner edge
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const d = Math.sqrt((x - 15) ** 2 + (y - 15) ** 2);
      if (d >= 1 && d <= 3) tl.fillRect(x, y, 1, 1);
    }
  }
  tlCanvas.refresh();

  // --- Corner: top-right ---
  const trCanvas = scene.textures.createCanvas('track-tr', 16, 16);
  const tr = trCanvas.context;
  tr.fillStyle = '#a08050';
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const d = Math.sqrt(x ** 2 + (y - 15) ** 2);
      if (d >= 2 && d <= 14) tr.fillRect(x, y, 1, 1);
    }
  }
  tr.fillStyle = '#8a6a38';
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const d = Math.sqrt(x ** 2 + (y - 15) ** 2);
      if (d >= 13 && d <= 15) tr.fillRect(x, y, 1, 1);
      if (d >= 1 && d <= 3) tr.fillRect(x, y, 1, 1);
    }
  }
  trCanvas.refresh();

  // --- Corner: bottom-left ---
  const blCanvas = scene.textures.createCanvas('track-bl', 16, 16);
  const bl = blCanvas.context;
  bl.fillStyle = '#a08050';
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const d = Math.sqrt((x - 15) ** 2 + y ** 2);
      if (d >= 2 && d <= 14) bl.fillRect(x, y, 1, 1);
    }
  }
  bl.fillStyle = '#8a6a38';
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const d = Math.sqrt((x - 15) ** 2 + y ** 2);
      if (d >= 13 && d <= 15) bl.fillRect(x, y, 1, 1);
      if (d >= 1 && d <= 3) bl.fillRect(x, y, 1, 1);
    }
  }
  blCanvas.refresh();

  // --- Corner: bottom-right ---
  const brCanvas = scene.textures.createCanvas('track-br', 16, 16);
  const brc = brCanvas.context;
  brc.fillStyle = '#a08050';
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const d = Math.sqrt(x ** 2 + y ** 2);
      if (d >= 2 && d <= 14) brc.fillRect(x, y, 1, 1);
    }
  }
  brc.fillStyle = '#8a6a38';
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const d = Math.sqrt(x ** 2 + y ** 2);
      if (d >= 13 && d <= 15) brc.fillRect(x, y, 1, 1);
      if (d >= 1 && d <= 3) brc.fillRect(x, y, 1, 1);
    }
  }
  brCanvas.refresh();
}
