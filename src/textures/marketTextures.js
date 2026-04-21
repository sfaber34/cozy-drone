export function generateMarketTextures(scene) {
  // Helper: draw a stall with an awning color, support posts, counter +
  // goods. Makes each stall clearly read as "table under a canopy" in the
  // top-down view: striped awning at the top, shadow line, wooden counter
  // with colorful goods, and dark corner posts for structure.
  // Stall: wooden counter table with colored trim and goods displayed.
  // No awning — just the table so shopkeepers standing behind it are
  // clearly visible and not obscured.
  function drawStall(name, trim, goods) {
    const c = scene.textures.createCanvas(name, 16, 8);
    const x = c.context;
    // Counter body
    x.fillStyle = '#a08050';
    x.fillRect(0, 0, 16, 8);
    // Top + bottom edge
    x.fillStyle = '#8a6a3a';
    x.fillRect(0, 0, 16, 1);
    x.fillRect(0, 7, 16, 1);
    // Colored trim strip along front
    x.fillStyle = trim;
    x.fillRect(0, 6, 16, 1);
    // Highlight
    x.fillStyle = '#b8976a';
    x.fillRect(1, 1, 14, 1);
    // Corner posts
    x.fillStyle = '#5a3a1a';
    x.fillRect(0, 0, 1, 8);
    x.fillRect(15, 0, 1, 8);
    // Goods on counter
    for (let i = 0; i < goods.length; i++) {
      x.fillStyle = goods[i].color;
      x.fillRect(goods[i].x, goods[i].y, goods[i].w, goods[i].h);
    }
    c.refresh();
  }

  drawStall('stall', '#cc4444', [
    { x: 2, y: 3, w: 3, h: 2, color: '#ffcc44' },
    { x: 7, y: 2, w: 2, h: 3, color: '#88cc44' },
    { x: 11, y: 3, w: 3, h: 2, color: '#ff8844' },
  ]);
  drawStall('stall2', '#3366aa', [
    { x: 2, y: 2, w: 3, h: 3, color: '#cc8855' },
    { x: 7, y: 3, w: 3, h: 2, color: '#cc44aa' },
    { x: 12, y: 2, w: 2, h: 3, color: '#ddaa77' },
  ]);
  drawStall('stall3', '#338844', [
    { x: 3, y: 3, w: 2, h: 2, color: '#ff6644' },
    { x: 7, y: 2, w: 3, h: 3, color: '#ffaa33' },
    { x: 12, y: 3, w: 2, h: 2, color: '#44cc88' },
  ]);

  // --- Animal cage (top-down, 12x10) — just the frame outline + sparse
  // bars so the animals inside are clearly visible. The overlay copy at
  // depth 2.95 renders the bars ON TOP of the animals.
  const cageCanvas = scene.textures.createCanvas('market-cage', 16, 14);
  const cg = cageCanvas.context;
  // Wooden frame (border only, interior transparent so animals show)
  cg.fillStyle = '#7a5a2a';
  cg.fillRect(0, 0, 16, 1);  // top
  cg.fillRect(0, 13, 16, 1); // bottom
  cg.fillRect(0, 0, 1, 14);  // left
  cg.fillRect(15, 0, 1, 14); // right
  // Sparse bars (widely spaced so chicken is clearly visible)
  cg.fillStyle = '#aaa';
  cg.fillRect(5, 1, 1, 12);   // vertical bar
  cg.fillRect(10, 1, 1, 12);  // vertical bar
  cg.fillRect(1, 4, 14, 1);   // horizontal bar
  cg.fillRect(1, 9, 14, 1);   // horizontal bar
  cageCanvas.refresh();

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
