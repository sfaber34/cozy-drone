export function generateOilfieldTextures(scene) {
  // --- Oil tank (top-down, 24x24 cylinder) ---
  const oilTankCanvas = scene.textures.createCanvas('oil-tank', 24, 24);
  const otc = oilTankCanvas.context;
  otc.fillStyle = '#888';
  for (let y = 0; y < 24; y++) {
    for (let x = 0; x < 24; x++) {
      if ((x - 11.5) * (x - 11.5) + (y - 11.5) * (y - 11.5) <= 130) {
        otc.fillRect(x, y, 1, 1);
      }
    }
  }
  otc.fillStyle = '#aaa';
  for (let y = 0; y < 24; y++) {
    for (let x = 0; x < 24; x++) {
      if ((x - 10) * (x - 10) + (y - 10) * (y - 10) <= 40) {
        otc.fillRect(x, y, 1, 1);
      }
    }
  }
  otc.fillStyle = '#666';
  for (let y = 0; y < 24; y++) {
    for (let x = 0; x < 24; x++) {
      const d = (x - 11.5) * (x - 11.5) + (y - 11.5) * (y - 11.5);
      if (d <= 130 && d >= 110) {
        otc.fillRect(x, y, 1, 1);
      }
    }
  }
  otc.fillStyle = '#555';
  otc.fillRect(11, 0, 2, 6);
  oilTankCanvas.refresh();

  // --- Oil well pump jack frame 1 (side view, 16x16, beam up) ---
  const well1Canvas = scene.textures.createCanvas('oil-well1', 16, 16);
  const ow1 = well1Canvas.context;
  ow1.fillStyle = '#666';
  ow1.fillRect(2, 14, 12, 2);
  ow1.fillStyle = '#888';
  ow1.fillRect(6, 4, 2, 10);
  ow1.fillRect(9, 4, 2, 10);
  ow1.fillRect(5, 3, 5, 2);
  ow1.fillStyle = '#aa3333';
  ow1.fillRect(1, 3, 14, 2);
  ow1.fillStyle = '#cc4444';
  ow1.fillRect(0, 2, 3, 3);
  ow1.fillStyle = '#555';
  ow1.fillRect(13, 4, 3, 2);
  ow1.fillStyle = '#444';
  ow1.fillRect(1, 5, 1, 9);
  ow1.fillStyle = '#777';
  ow1.fillRect(10, 10, 4, 4);
  ow1.fillStyle = '#999';
  ow1.fillRect(11, 11, 2, 2);
  well1Canvas.refresh();

  // --- Oil well pump jack frame 2 (beam down) ---
  const well2Canvas = scene.textures.createCanvas('oil-well2', 16, 16);
  const ow2 = well2Canvas.context;
  ow2.fillStyle = '#666';
  ow2.fillRect(2, 14, 12, 2);
  ow2.fillStyle = '#888';
  ow2.fillRect(6, 4, 2, 10);
  ow2.fillRect(9, 4, 2, 10);
  ow2.fillRect(5, 3, 5, 2);
  ow2.fillStyle = '#aa3333';
  ow2.fillRect(1, 5, 14, 2);
  ow2.fillStyle = '#cc4444';
  ow2.fillRect(0, 5, 3, 3);
  ow2.fillStyle = '#555';
  ow2.fillRect(13, 2, 3, 2);
  ow2.fillStyle = '#444';
  ow2.fillRect(1, 8, 1, 6);
  ow2.fillStyle = '#777';
  ow2.fillRect(10, 10, 4, 4);
  ow2.fillStyle = '#999';
  ow2.fillRect(11, 11, 2, 2);
  well2Canvas.refresh();

  // --- Pipe horizontal (16x4) ---
  const pipeHCanvas = scene.textures.createCanvas('pipe-h', 16, 4);
  const phc = pipeHCanvas.context;
  phc.fillStyle = '#777';
  phc.fillRect(0, 1, 16, 2);
  phc.fillStyle = '#999';
  phc.fillRect(0, 1, 16, 1);
  phc.fillStyle = '#555';
  phc.fillRect(0, 0, 1, 4);
  phc.fillRect(15, 0, 1, 4);
  pipeHCanvas.refresh();

  // --- Pipe vertical (4x16) ---
  const pipeVCanvas = scene.textures.createCanvas('pipe-v', 4, 16);
  const pvc = pipeVCanvas.context;
  pvc.fillStyle = '#777';
  pvc.fillRect(1, 0, 2, 16);
  pvc.fillStyle = '#999';
  pvc.fillRect(1, 0, 1, 16);
  pvc.fillStyle = '#555';
  pvc.fillRect(0, 0, 4, 1);
  pvc.fillRect(0, 15, 4, 1);
  pipeVCanvas.refresh();

  // --- Burning well (oil-well with fire, for destroyed state) ---
  const wellBurnCanvas = scene.textures.createCanvas('oil-well-burn', 16, 16);
  const owb = wellBurnCanvas.context;
  owb.fillStyle = '#444';
  owb.fillRect(2, 14, 12, 2);
  owb.fillStyle = '#333';
  owb.fillRect(5, 6, 6, 8);
  owb.fillStyle = '#f80';
  owb.fillRect(5, 0, 6, 8);
  owb.fillRect(4, 2, 8, 5);
  owb.fillStyle = '#ff0';
  owb.fillRect(6, 1, 4, 5);
  owb.fillStyle = '#f00';
  owb.fillRect(4, 0, 2, 4);
  owb.fillRect(10, 0, 2, 4);
  owb.fillStyle = '#222';
  owb.fillRect(5, 0, 2, 2);
  owb.fillRect(9, 0, 2, 1);
  wellBurnCanvas.refresh();
}
