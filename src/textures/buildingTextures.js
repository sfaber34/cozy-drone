import Phaser from 'phaser';

export function generateBuildingTextures(scene) {
  // --- Hangar (top-down, 48x48) ---
  const hangarCanvas = scene.textures.createCanvas('hangar', 48, 48);
  const hgc = hangarCanvas.context;
  hgc.fillStyle = '#707070';
  hgc.fillRect(0, 0, 48, 48);
  hgc.fillStyle = '#808080';
  for (let ry = 0; ry < 48; ry += 4) {
    hgc.fillRect(0, ry, 48, 2);
  }
  hgc.fillStyle = '#555';
  hgc.fillRect(0, 0, 48, 1);
  hgc.fillRect(0, 47, 48, 1);
  hgc.fillRect(0, 0, 1, 48);
  hgc.fillRect(47, 0, 1, 48);
  hgc.fillStyle = '#1a1a1a';
  hgc.fillRect(0, 14, 4, 20);
  hgc.fillStyle = '#606060';
  hgc.fillRect(0, 12, 4, 2);
  hgc.fillRect(0, 34, 4, 2);
  hgc.fillStyle = '#111';
  hgc.fillRect(1, 16, 2, 16);
  hgc.fillStyle = '#666';
  hgc.fillRect(36, 20, 6, 8);
  hgc.fillStyle = '#555';
  hgc.fillRect(37, 21, 4, 6);
  hangarCanvas.refresh();

  // --- Taxiway tile (16x16) ---
  const taxiCanvas = scene.textures.createCanvas('taxiway', 16, 16);
  const twc = taxiCanvas.context;
  twc.fillStyle = '#555';
  twc.fillRect(0, 0, 16, 16);
  twc.fillStyle = '#cc0';
  twc.fillRect(7, 2, 2, 5);
  twc.fillRect(7, 10, 2, 5);
  twc.fillStyle = '#666';
  twc.fillRect(0, 0, 1, 16);
  twc.fillRect(15, 0, 1, 16);
  taxiCanvas.refresh();

  // --- Runway (32x128 tile, drawn vertically) ---
  const rwCanvas = scene.textures.createCanvas('runway', 32, 128);
  const rwc = rwCanvas.context;
  rwc.fillStyle = '#444';
  rwc.fillRect(0, 0, 32, 128);
  rwc.fillStyle = '#fff';
  rwc.fillRect(1, 0, 1, 128);
  rwc.fillRect(30, 0, 1, 128);
  rwc.fillStyle = '#ff0';
  for (let dy = 4; dy < 128; dy += 16) {
    rwc.fillRect(15, dy, 2, 8);
  }
  rwc.fillStyle = '#fff';
  for (let i = 0; i < 4; i++) {
    rwc.fillRect(5 + i * 6, 2, 3, 10);
    rwc.fillRect(5 + i * 6, 116, 3, 10);
  }
  rwCanvas.refresh();

  // --- Dirt road tile (16x16, straight vertical) ---
  const roadVCanvas = scene.textures.createCanvas('road-v', 16, 16);
  const rvc = roadVCanvas.context;
  rvc.fillStyle = '#9a7a50';
  rvc.fillRect(0, 0, 16, 16);
  rvc.fillStyle = '#8a6a40';
  rvc.fillRect(4, 0, 2, 16);
  rvc.fillRect(10, 0, 2, 16);
  rvc.fillStyle = '#aa8a60';
  rvc.fillRect(0, 0, 1, 16);
  rvc.fillRect(15, 0, 1, 16);
  const drvRng = new Phaser.Math.RandomDataGenerator(['drv']);
  for (let i = 0; i < 8; i++) {
    rvc.fillStyle = drvRng.pick(['#8a6a3a', '#aa8a55', '#b09060']);
    rvc.fillRect(drvRng.between(0, 15), drvRng.between(0, 15), 1, 1);
  }
  roadVCanvas.refresh();

  // --- Dirt road tile (16x16, straight horizontal) ---
  const roadHCanvas = scene.textures.createCanvas('road-h', 16, 16);
  const rhc = roadHCanvas.context;
  rhc.fillStyle = '#9a7a50';
  rhc.fillRect(0, 0, 16, 16);
  rhc.fillStyle = '#8a6a40';
  rhc.fillRect(0, 4, 16, 2);
  rhc.fillRect(0, 10, 16, 2);
  rhc.fillStyle = '#aa8a60';
  rhc.fillRect(0, 0, 16, 1);
  rhc.fillRect(0, 15, 16, 1);
  const drhRng = new Phaser.Math.RandomDataGenerator(['drh']);
  for (let i = 0; i < 8; i++) {
    rhc.fillStyle = drhRng.pick(['#8a6a3a', '#aa8a55', '#b09060']);
    rhc.fillRect(drhRng.between(0, 15), drhRng.between(0, 15), 1, 1);
  }
  roadHCanvas.refresh();

  // --- Dirt road intersection (16x16) ---
  const roadXCanvas = scene.textures.createCanvas('road-x', 16, 16);
  const rxc = roadXCanvas.context;
  rxc.fillStyle = '#9a7a50';
  rxc.fillRect(0, 0, 16, 16);
  rxc.fillStyle = '#8a6a40';
  rxc.fillRect(4, 0, 2, 16);
  rxc.fillRect(10, 0, 2, 16);
  rxc.fillRect(0, 4, 16, 2);
  rxc.fillRect(0, 10, 16, 2);
  const drxRng = new Phaser.Math.RandomDataGenerator(['drx']);
  for (let i = 0; i < 10; i++) {
    rxc.fillStyle = drxRng.pick(['#8a6a3a', '#aa8a55', '#b09060']);
    rxc.fillRect(drxRng.between(0, 15), drxRng.between(0, 15), 1, 1);
  }
  roadXCanvas.refresh();

  // --- Small house (top-down, 16x16) ---
  const houseCanvas = scene.textures.createCanvas('house', 16, 16);
  const hoc = houseCanvas.context;
  hoc.fillStyle = '#8a3a2a';
  hoc.fillRect(1, 1, 14, 14);
  hoc.fillStyle = '#6a2a1a';
  hoc.fillRect(1, 7, 14, 2);
  hoc.fillStyle = '#ddc';
  hoc.fillRect(2, 2, 12, 5);
  hoc.fillRect(2, 9, 12, 5);
  hoc.fillStyle = '#5a3a1a';
  hoc.fillRect(7, 12, 3, 3);
  hoc.fillStyle = '#8af';
  hoc.fillRect(3, 3, 2, 2);
  hoc.fillRect(11, 3, 2, 2);
  houseCanvas.refresh();

  // --- Large building (top-down, 32x24) ---
  const bldgCanvas = scene.textures.createCanvas('building', 32, 24);
  const blc = bldgCanvas.context;
  blc.fillStyle = '#778';
  blc.fillRect(0, 0, 32, 24);
  blc.fillStyle = '#556';
  blc.fillRect(0, 0, 32, 1);
  blc.fillRect(0, 23, 32, 1);
  blc.fillRect(0, 0, 1, 24);
  blc.fillRect(31, 0, 1, 24);
  blc.fillStyle = '#666';
  blc.fillRect(3, 3, 4, 4);
  blc.fillRect(25, 3, 4, 4);
  blc.fillStyle = '#555';
  blc.fillRect(4, 4, 2, 2);
  blc.fillRect(26, 4, 2, 2);
  blc.fillStyle = '#acd';
  for (let wy = 10; wy < 22; wy += 4) {
    for (let wx = 3; wx < 30; wx += 5) {
      blc.fillRect(wx, wy, 3, 2);
    }
  }
  bldgCanvas.refresh();

  // --- Hospital (top-down, 32x32) ---
  const hospCanvas = scene.textures.createCanvas('hospital', 32, 32);
  const hsc = hospCanvas.context;
  hsc.fillStyle = '#eee';
  hsc.fillRect(0, 0, 32, 32);
  hsc.fillStyle = '#ccc';
  hsc.fillRect(0, 0, 32, 1);
  hsc.fillRect(0, 31, 32, 1);
  hsc.fillRect(0, 0, 1, 32);
  hsc.fillRect(31, 0, 1, 32);
  hsc.fillStyle = '#cc0000';
  hsc.fillRect(13, 8, 6, 16);
  hsc.fillRect(8, 13, 16, 6);
  hsc.fillStyle = '#ddd';
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      if ((x - 15.5) * (x - 15.5) + (y - 15.5) * (y - 15.5) > 144 &&
          (x - 15.5) * (x - 15.5) + (y - 15.5) * (y - 15.5) < 169) {
        hsc.fillRect(x, y, 1, 1);
      }
    }
  }
  hsc.fillStyle = '#88aacc';
  hsc.fillRect(12, 28, 8, 4);
  hsc.fillStyle = '#aaccee';
  for (let wx = 3; wx < 30; wx += 5) {
    hsc.fillRect(wx, 2, 3, 2);
    hsc.fillRect(wx, 28, 3, 2);
  }
  for (let wy = 3; wy < 30; wy += 5) {
    hsc.fillRect(1, wy, 2, 3);
    hsc.fillRect(29, wy, 2, 3);
  }
  hospCanvas.refresh();

  // --- Shop (top-down, 16x20) ---
  const shopCanvas = scene.textures.createCanvas('shop', 16, 20);
  const shc = shopCanvas.context;
  shc.fillStyle = '#cc8844';
  shc.fillRect(0, 0, 16, 20);
  shc.fillStyle = '#aa6633';
  shc.fillRect(0, 0, 16, 1);
  shc.fillRect(0, 19, 16, 1);
  shc.fillRect(0, 0, 1, 20);
  shc.fillRect(15, 0, 1, 20);
  shc.fillStyle = '#dd4444';
  shc.fillRect(1, 16, 14, 3);
  shc.fillStyle = '#bb3333';
  shc.fillRect(1, 17, 14, 1);
  shc.fillStyle = '#5a3a1a';
  shc.fillRect(6, 17, 4, 3);
  shc.fillStyle = '#8af';
  shc.fillRect(2, 3, 4, 3);
  shc.fillRect(10, 3, 4, 3);
  shopCanvas.refresh();

  // --- Apartment (top-down, 24x32) ---
  const aptCanvas = scene.textures.createCanvas('apartment', 24, 32);
  const apc = aptCanvas.context;
  apc.fillStyle = '#887766';
  apc.fillRect(0, 0, 24, 32);
  apc.fillStyle = '#665544';
  apc.fillRect(0, 0, 24, 1);
  apc.fillRect(0, 31, 24, 1);
  apc.fillRect(0, 0, 1, 32);
  apc.fillRect(23, 0, 1, 32);
  apc.fillStyle = '#aaccdd';
  for (let wy = 3; wy < 30; wy += 5) {
    for (let wx = 3; wx < 22; wx += 6) {
      apc.fillRect(wx, wy, 3, 3);
    }
  }
  apc.fillStyle = '#555';
  apc.fillRect(10, 2, 4, 3);
  aptCanvas.refresh();

  // --- Church (top-down, 16x24) ---
  const churchCanvas = scene.textures.createCanvas('church', 16, 24);
  const chc = churchCanvas.context;
  chc.fillStyle = '#ddd';
  chc.fillRect(2, 4, 12, 20);
  chc.fillStyle = '#ccc';
  chc.fillRect(5, 0, 6, 6);
  chc.fillStyle = '#999';
  chc.fillRect(7, 0, 2, 2);
  chc.fillStyle = '#aa8833';
  chc.fillRect(7, 0, 2, 1);
  chc.fillRect(6, 1, 4, 1);
  chc.fillStyle = '#5a2a0a';
  chc.fillRect(6, 20, 4, 4);
  chc.fillStyle = '#88aaff';
  chc.fillRect(3, 8, 2, 4);
  chc.fillRect(11, 8, 2, 4);
  chc.fillRect(3, 15, 2, 4);
  chc.fillRect(11, 15, 2, 4);
  chc.fillStyle = '#ff8844';
  chc.fillRect(7, 8, 2, 2);
  churchCanvas.refresh();

  // --- Gas station (top-down, 20x16) ---
  const gasCanvas = scene.textures.createCanvas('gas-station', 20, 16);
  const gsc = gasCanvas.context;
  gsc.fillStyle = '#ddd';
  gsc.fillRect(0, 0, 14, 16);
  gsc.fillStyle = '#bbb';
  gsc.fillRect(0, 0, 14, 1);
  gsc.fillRect(0, 15, 14, 1);
  gsc.fillStyle = '#888';
  gsc.fillRect(1, 1, 1, 14);
  gsc.fillRect(12, 1, 1, 14);
  gsc.fillStyle = '#cc3333';
  gsc.fillRect(4, 4, 2, 3);
  gsc.fillRect(8, 4, 2, 3);
  gsc.fillRect(4, 9, 2, 3);
  gsc.fillRect(8, 9, 2, 3);
  gsc.fillStyle = '#996633';
  gsc.fillRect(14, 2, 6, 12);
  gsc.fillStyle = '#8af';
  gsc.fillRect(15, 4, 4, 3);
  gasCanvas.refresh();

  // --- Park/green area tile (16x16) ---
  const parkCanvas = scene.textures.createCanvas('park', 16, 16);
  const pkc = parkCanvas.context;
  pkc.fillStyle = '#4a9a2a';
  pkc.fillRect(0, 0, 16, 16);
  pkc.fillStyle = '#2a6a0a';
  pkc.fillRect(3, 3, 3, 3);
  pkc.fillRect(10, 10, 3, 3);
  pkc.fillStyle = '#3a7a1a';
  pkc.fillRect(4, 4, 1, 1);
  pkc.fillRect(11, 11, 1, 1);
  pkc.fillStyle = '#bba';
  pkc.fillRect(7, 0, 2, 16);
  parkCanvas.refresh();

  // --- Parking lot tile (16x16) ---
  const parkingCanvas = scene.textures.createCanvas('parking', 16, 16);
  const plc = parkingCanvas.context;
  plc.fillStyle = '#4a4a4a';
  plc.fillRect(0, 0, 16, 16);
  plc.fillStyle = '#fff';
  plc.fillRect(0, 0, 1, 8);
  plc.fillRect(5, 0, 1, 8);
  plc.fillRect(10, 0, 1, 8);
  plc.fillRect(15, 0, 1, 8);
  parkingCanvas.refresh();

  // --- Small hut (top-down, 12x12) ---
  const hutCanvas = scene.textures.createCanvas('hut', 12, 12);
  const htc = hutCanvas.context;
  htc.fillStyle = '#aa8855';
  htc.fillRect(1, 1, 10, 10);
  htc.fillStyle = '#ccaa44';
  htc.fillRect(0, 0, 12, 12);
  htc.fillStyle = '#bbaa33';
  htc.fillRect(2, 2, 8, 8);
  htc.fillStyle = '#ddbb55';
  htc.fillRect(4, 4, 4, 4);
  htc.fillStyle = '#5a3a1a';
  htc.fillRect(5, 9, 2, 3);
  htc.fillStyle = '#998844';
  htc.fillRect(0, 0, 12, 1);
  htc.fillRect(0, 11, 12, 1);
  htc.fillRect(0, 0, 1, 12);
  htc.fillRect(11, 0, 1, 12);
  hutCanvas.refresh();

  // --- Barn (top-down, 24x32) ---
  const barnCanvas = scene.textures.createCanvas('barn', 24, 32);
  const bnc = barnCanvas.context;
  bnc.fillStyle = '#8b2a1a';
  bnc.fillRect(0, 0, 24, 32);
  bnc.fillStyle = '#6a1a0a';
  bnc.fillRect(11, 0, 2, 32);
  bnc.fillStyle = '#3a1a0a';
  bnc.fillRect(8, 0, 8, 4);
  bnc.fillStyle = '#5a1a0a';
  bnc.fillRect(0, 0, 24, 1);
  bnc.fillRect(0, 31, 24, 1);
  bnc.fillRect(0, 0, 1, 32);
  bnc.fillRect(23, 0, 1, 32);
  bnc.fillStyle = '#7a2a1a';
  bnc.fillRect(0, 10, 24, 1);
  bnc.fillRect(0, 21, 24, 1);
  barnCanvas.refresh();

  // --- Silo (top-down, 10x10 circle) ---
  const siloCanvas = scene.textures.createCanvas('silo', 10, 10);
  const slc = siloCanvas.context;
  slc.fillStyle = '#aaa';
  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 10; x++) {
      if ((x - 4.5) * (x - 4.5) + (y - 4.5) * (y - 4.5) <= 20) {
        slc.fillRect(x, y, 1, 1);
      }
    }
  }
  slc.fillStyle = '#ccc';
  slc.fillRect(3, 2, 2, 2);
  slc.fillStyle = '#888';
  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 10; x++) {
      if ((x - 4.5) * (x - 4.5) + (y - 4.5) * (y - 4.5) <= 8) {
        slc.fillRect(x, y, 1, 1);
      }
    }
  }
  siloCanvas.refresh();

  // --- Corral (top-down fence rectangle, 32x24) ---
  const corralCanvas = scene.textures.createCanvas('corral', 32, 24);
  const crlc = corralCanvas.context;
  crlc.fillStyle = '#9a7a50';
  crlc.fillRect(2, 2, 28, 20);
  crlc.fillStyle = '#8a6a3a';
  crlc.fillRect(0, 0, 32, 2);
  crlc.fillRect(0, 22, 32, 2);
  crlc.fillRect(0, 0, 2, 24);
  crlc.fillRect(30, 0, 2, 10);
  crlc.fillRect(30, 18, 2, 6);
  crlc.fillStyle = '#6a4a2a';
  crlc.fillRect(0, 0, 2, 2);
  crlc.fillRect(10, 0, 2, 2);
  crlc.fillRect(20, 0, 2, 2);
  crlc.fillRect(30, 0, 2, 2);
  crlc.fillRect(0, 22, 2, 2);
  crlc.fillRect(10, 22, 2, 2);
  crlc.fillRect(20, 22, 2, 2);
  crlc.fillRect(30, 22, 2, 2);
  crlc.fillRect(0, 11, 2, 2);
  crlc.fillRect(30, 8, 2, 2);
  crlc.fillRect(30, 18, 2, 2);
  corralCanvas.refresh();

  // --- Fence horizontal (16x4) ---
  const fenceHCanvas = scene.textures.createCanvas('fence-h', 16, 4);
  const fhc = fenceHCanvas.context;
  fhc.fillStyle = '#8a6a3a';
  fhc.fillRect(0, 1, 16, 2);
  fhc.fillStyle = '#6a4a2a';
  fhc.fillRect(0, 0, 1, 4);
  fhc.fillRect(5, 0, 1, 4);
  fhc.fillRect(10, 0, 1, 4);
  fhc.fillRect(15, 0, 1, 4);
  fenceHCanvas.refresh();

  // --- Fence vertical (4x16) ---
  const fenceVCanvas = scene.textures.createCanvas('fence-v', 4, 16);
  const fvc = fenceVCanvas.context;
  fvc.fillStyle = '#8a6a3a';
  fvc.fillRect(1, 0, 2, 16);
  fvc.fillStyle = '#6a4a2a';
  fvc.fillRect(0, 0, 4, 1);
  fvc.fillRect(0, 5, 4, 1);
  fvc.fillRect(0, 10, 4, 1);
  fvc.fillRect(0, 15, 4, 1);
  fenceVCanvas.refresh();

  // --- Hay bale (top-down, 8x6) ---
  const hayCanvas = scene.textures.createCanvas('hay', 8, 6);
  const hyc = hayCanvas.context;
  hyc.fillStyle = '#ccaa44';
  hyc.fillRect(1, 0, 6, 6);
  hyc.fillRect(0, 1, 8, 4);
  hyc.fillStyle = '#ddbb55';
  hyc.fillRect(2, 1, 4, 4);
  hyc.fillStyle = '#bbaa33';
  hyc.fillRect(3, 0, 2, 1);
  hyc.fillRect(3, 5, 2, 1);
  hyc.fillStyle = '#aa8822';
  hyc.fillRect(1, 2, 6, 1);
  hyc.fillRect(1, 4, 6, 1);
  hayCanvas.refresh();
}
