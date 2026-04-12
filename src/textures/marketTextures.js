export function generateMarketTextures(scene) {
  // --- Market stall (top-down, 16x12) ---
  const stallCanvas = scene.textures.createCanvas('stall', 16, 12);
  const stlc = stallCanvas.context;
  stlc.fillStyle = '#8a6a3a';
  stlc.fillRect(0, 4, 16, 6);
  stlc.fillStyle = '#7a5a2a';
  stlc.fillRect(0, 4, 16, 1);
  stlc.fillStyle = '#cc4444';
  stlc.fillRect(0, 0, 16, 5);
  stlc.fillStyle = '#dd5555';
  stlc.fillRect(0, 0, 4, 5);
  stlc.fillRect(8, 0, 4, 5);
  stlc.fillStyle = '#bb3333';
  stlc.fillRect(0, 4, 16, 1);
  stlc.fillStyle = '#ffcc44';
  stlc.fillRect(2, 6, 3, 2);
  stlc.fillStyle = '#88cc44';
  stlc.fillRect(7, 5, 2, 3);
  stlc.fillStyle = '#ff8844';
  stlc.fillRect(11, 6, 3, 2);
  stallCanvas.refresh();

  // --- Market stall variant (blue) ---
  const stall2Canvas = scene.textures.createCanvas('stall2', 16, 12);
  const stl2c = stall2Canvas.context;
  stl2c.fillStyle = '#8a6a3a';
  stl2c.fillRect(0, 4, 16, 6);
  stl2c.fillStyle = '#7a5a2a';
  stl2c.fillRect(0, 4, 16, 1);
  stl2c.fillStyle = '#3366aa';
  stl2c.fillRect(0, 0, 16, 5);
  stl2c.fillStyle = '#4477bb';
  stl2c.fillRect(0, 0, 4, 5);
  stl2c.fillRect(8, 0, 4, 5);
  stl2c.fillStyle = '#225599';
  stl2c.fillRect(0, 4, 16, 1);
  stl2c.fillStyle = '#cc8855';
  stl2c.fillRect(2, 5, 2, 3);
  stl2c.fillRect(5, 6, 2, 2);
  stl2c.fillStyle = '#cc44aa';
  stl2c.fillRect(9, 5, 4, 3);
  stall2Canvas.refresh();

  // --- Market stall variant (green) ---
  const stall3Canvas = scene.textures.createCanvas('stall3', 16, 12);
  const stl3c = stall3Canvas.context;
  stl3c.fillStyle = '#8a6a3a';
  stl3c.fillRect(0, 4, 16, 6);
  stl3c.fillStyle = '#7a5a2a';
  stl3c.fillRect(0, 4, 16, 1);
  stl3c.fillStyle = '#338844';
  stl3c.fillRect(0, 0, 16, 5);
  stl3c.fillStyle = '#449955';
  stl3c.fillRect(0, 0, 4, 5);
  stl3c.fillRect(8, 0, 4, 5);
  stl3c.fillStyle = '#227733';
  stl3c.fillRect(0, 4, 16, 1);
  stl3c.fillStyle = '#ff6644';
  stl3c.fillRect(3, 6, 2, 2);
  stl3c.fillStyle = '#ffaa33';
  stl3c.fillRect(7, 5, 3, 3);
  stl3c.fillStyle = '#44cc88';
  stl3c.fillRect(12, 6, 2, 2);
  stall3Canvas.refresh();

  // --- Market tent (top-down, 20x16) ---
  const tentCanvas = scene.textures.createCanvas('tent', 20, 16);
  const tnc = tentCanvas.context;
  tnc.fillStyle = '#ddcc88';
  tnc.fillRect(2, 2, 16, 12);
  tnc.fillRect(0, 4, 20, 8);
  tnc.fillStyle = '#ccbb77';
  tnc.fillRect(0, 7, 20, 2);
  tnc.fillStyle = '#8a6a3a';
  tnc.fillRect(1, 3, 1, 1);
  tnc.fillRect(18, 3, 1, 1);
  tnc.fillRect(1, 12, 1, 1);
  tnc.fillRect(18, 12, 1, 1);
  tnc.fillStyle = '#2a2a1a';
  tnc.fillRect(8, 12, 4, 4);
  tnc.fillStyle = '#aa9966';
  tnc.fillRect(0, 2, 20, 1);
  tnc.fillRect(0, 13, 20, 1);
  tentCanvas.refresh();

  // --- Carried goods (small items, 4x4 each) ---
  const bktC = scene.textures.createCanvas('goods-basket', 4, 4);
  const bkt = bktC.context;
  bkt.fillStyle = '#aa8844';
  bkt.fillRect(0, 1, 4, 3);
  bkt.fillStyle = '#88aa33';
  bkt.fillRect(1, 0, 2, 2);
  bkt.fillStyle = '#ccaa55';
  bkt.fillRect(1, 2, 2, 1);
  bktC.refresh();

  const jugC = scene.textures.createCanvas('goods-jug', 4, 4);
  const jg = jugC.context;
  jg.fillStyle = '#cc8855';
  jg.fillRect(1, 1, 2, 3);
  jg.fillRect(0, 2, 4, 1);
  jg.fillStyle = '#ddaa77';
  jg.fillRect(1, 0, 2, 1);
  jugC.refresh();

  const clbC = scene.textures.createCanvas('goods-cloth', 4, 4);
  const clb = clbC.context;
  clb.fillStyle = '#cc44aa';
  clb.fillRect(0, 0, 4, 4);
  clb.fillStyle = '#dd66bb';
  clb.fillRect(1, 1, 2, 2);
  clbC.refresh();

  const frtC = scene.textures.createCanvas('goods-fruit', 4, 4);
  const frt = frtC.context;
  frt.fillStyle = '#ffaa33';
  frt.fillRect(0, 1, 2, 2);
  frt.fillStyle = '#ff4444';
  frt.fillRect(2, 0, 2, 2);
  frt.fillStyle = '#88cc33';
  frt.fillRect(1, 2, 2, 2);
  frtC.refresh();

  const brdC = scene.textures.createCanvas('goods-bread', 4, 4);
  const brd = brdC.context;
  brd.fillStyle = '#cc9944';
  brd.fillRect(0, 1, 4, 2);
  brd.fillStyle = '#ddaa55';
  brd.fillRect(1, 0, 2, 3);
  brdC.refresh();
}
