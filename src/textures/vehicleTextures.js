import Phaser from 'phaser';
import { skinTones } from './personTextures.js';

export function generateVehicleTextures(scene) {
  // --- Dirt bikes (procedural color variants) ---
  const bikeFrameColors = ['#cc3333', '#3366cc', '#33aa33', '#cc8833', '#333', '#8833aa', '#cc3388', '#44aaaa', '#cccc33', '#888'];
  const bikeShirtColors = ['#3366cc', '#cc3333', '#33aa44', '#ccaa33', '#aa33cc', '#333', '#cc6633', '#3388aa', '#cc3388', '#888'];
  const bikePantsColors = ['#335588', '#333', '#555', '#443322', '#2a3a5a', '#224422', '#4a4a4a', '#553344'];
  const bikeRng = new Phaser.Math.RandomDataGenerator(['bikes']);
  const NUM_BIKES = 10;

  const drawBike = (ctx, bColor, fColor, shirt, pants, frameIdx) => {
    const wy = frameIdx === 0 ? 11 : 12;
    const fy = frameIdx === 0 ? 9 : 8;
    const ry = frameIdx === 0 ? 2 : 1;
    const ty = frameIdx === 0 ? 5 : 4;
    const ly = frameIdx === 0 ? 8 : 7;
    const hby = frameIdx === 0 ? 7 : 6;
    const exY = frameIdx === 0 ? 10 : 9;
    // Wheels
    ctx.fillStyle = '#333';
    ctx.fillRect(1, wy, 4, 4);
    ctx.fillRect(13, wy, 4, 4);
    ctx.fillStyle = '#555';
    ctx.fillRect(2, wy + 1, 2, 2);
    ctx.fillRect(14, wy + 1, 2, 2);
    ctx.fillStyle = '#777';
    ctx.fillRect(3, wy + 2, 1, 1);
    ctx.fillRect(15, wy + 2, 1, 1);
    // Frame
    ctx.fillStyle = bColor;
    ctx.fillRect(4, fy, 10, 3);
    ctx.fillRect(6, fy - 1, 6, 1);
    // Engine
    ctx.fillStyle = '#888';
    ctx.fillRect(6, fy + 2, 4, 2);
    ctx.fillStyle = '#666';
    ctx.fillRect(7, fy + 3, 2, 1);
    // Handlebars
    ctx.fillStyle = '#666';
    ctx.fillRect(13, hby, 3, 2);
    // Exhaust
    ctx.fillStyle = '#777';
    ctx.fillRect(2, exY, 3, 1);
    ctx.fillStyle = '#888';
    ctx.fillRect(1, exY, 1, 1);
    // Fender
    ctx.fillStyle = fColor;
    ctx.fillRect(14, exY, 3, 1);
    ctx.fillRect(1, exY, 3, 1);
    // Rider head
    ctx.fillStyle = bikeRng.pick(skinTones);
    ctx.fillRect(9, ry, 3, 3);
    // Helmet
    ctx.fillStyle = '#222';
    ctx.fillRect(9, ry - 1, 3, 2);
    ctx.fillStyle = '#444';
    ctx.fillRect(9, ry - 1, 3, 1);
    ctx.fillStyle = '#4488cc';
    ctx.fillRect(11, ry, 1, 1);
    // Torso
    ctx.fillStyle = shirt;
    ctx.fillRect(9, ty, 3, 4);
    // Arms
    ctx.fillStyle = bikeRng.pick(skinTones);
    ctx.fillRect(12, ty + 1, 2, 1);
    ctx.fillRect(11, ty, 1, 1);
    // Legs
    ctx.fillStyle = pants;
    ctx.fillRect(8, ly, 2, 3);
    ctx.fillRect(11, ly, 2, 3);
    // Boots
    ctx.fillStyle = '#333';
    ctx.fillRect(8, ly + 2, 2, 1);
    ctx.fillRect(11, ly + 2, 2, 1);
  };

  for (let bi = 0; bi < NUM_BIKES; bi++) {
    const bColor = bikeRng.pick(bikeFrameColors);
    const fColor = bColor;
    const shirt = bikeRng.pick(bikeShirtColors);
    const pants = bikeRng.pick(bikePantsColors);
    // Frame 1
    const c1 = scene.textures.createCanvas(`dirtbike-${bi}`, 18, 16);
    drawBike(c1.context, bColor, fColor, shirt, pants, 0);
    c1.refresh();
    // Frame 2 (bounce)
    const c2 = scene.textures.createCanvas(`dirtbike2-${bi}`, 18, 16);
    drawBike(c2.context, bColor, fColor, shirt, pants, 1);
    c2.refresh();
  }
  // Default aliases for backward compat
  scene.textures.get('dirtbike-0').key;  // just ensure it exists

  // --- Cars (top-down, 12x18, multiple colors) ---
  const carColors = [
    { name: 'car-white', body: '#eee', roof: '#ddd', shade: '#ccc' },
    { name: 'car-black', body: '#333', roof: '#222', shade: '#111' },
    { name: 'car-grey', body: '#888', roof: '#777', shade: '#666' },
    { name: 'car-red', body: '#cc2222', roof: '#aa1111', shade: '#881111' },
    { name: 'car-blue', body: '#2244aa', roof: '#1a3388', shade: '#112266' },
    { name: 'car-green', body: '#338833', roof: '#226622', shade: '#115511' },
    { name: 'car-tan', body: '#ccaa77', roof: '#bbaa66', shade: '#aa8855' },
  ];
  for (const cc of carColors) {
    const carCanvas = scene.textures.createCanvas(cc.name, 12, 18);
    const ctx = carCanvas.context;
    ctx.fillStyle = cc.body;
    ctx.fillRect(1, 1, 10, 16);
    ctx.fillRect(0, 4, 12, 10);
    ctx.fillStyle = cc.body;
    ctx.fillRect(2, 1, 8, 4);
    ctx.fillStyle = cc.roof;
    ctx.fillRect(2, 5, 8, 7);
    ctx.fillStyle = '#88bbdd';
    ctx.fillRect(2, 4, 8, 2);
    ctx.fillStyle = '#7aaacc';
    ctx.fillRect(1, 6, 1, 4);
    ctx.fillRect(10, 6, 1, 4);
    ctx.fillStyle = '#6699aa';
    ctx.fillRect(3, 12, 6, 1);
    ctx.fillStyle = '#ffee88';
    ctx.fillRect(1, 1, 3, 1);
    ctx.fillRect(8, 1, 3, 1);
    ctx.fillStyle = '#999';
    ctx.fillRect(1, 0, 10, 1);
    ctx.fillRect(1, 17, 10, 1);
    ctx.fillStyle = '#ff3333';
    ctx.fillRect(1, 16, 3, 1);
    ctx.fillRect(8, 16, 3, 1);
    ctx.fillStyle = cc.shade;
    ctx.fillRect(0, 5, 1, 8);
    ctx.fillRect(11, 5, 1, 8);
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 2, 1, 3);
    ctx.fillRect(11, 2, 1, 3);
    ctx.fillRect(0, 13, 1, 3);
    ctx.fillRect(11, 13, 1, 3);
    ctx.fillStyle = '#444';
    ctx.fillRect(0, 3, 1, 1);
    ctx.fillRect(11, 3, 1, 1);
    ctx.fillRect(0, 14, 1, 1);
    ctx.fillRect(11, 14, 1, 1);
    ctx.fillStyle = cc.shade;
    ctx.fillRect(2, 5, 8, 1);
    ctx.fillRect(5, 6, 1, 6);
    carCanvas.refresh();
  }

  // --- Car destroyed (12x18) ---
  const carDeadCanvas = scene.textures.createCanvas('car-dead', 12, 18);
  const cdc = carDeadCanvas.context;
  cdc.fillStyle = '#333';
  cdc.fillRect(1, 1, 10, 16);
  cdc.fillRect(0, 4, 12, 10);
  cdc.fillStyle = '#222';
  cdc.fillRect(2, 5, 8, 7);
  cdc.fillStyle = '#f80';
  cdc.fillRect(3, 6, 3, 3);
  cdc.fillStyle = '#f00';
  cdc.fillRect(6, 8, 3, 3);
  cdc.fillStyle = '#ff0';
  cdc.fillRect(5, 7, 2, 2);
  cdc.fillStyle = '#444';
  cdc.fillRect(0, 2, 1, 3);
  cdc.fillRect(11, 2, 1, 3);
  cdc.fillRect(0, 13, 1, 3);
  cdc.fillRect(11, 13, 1, 3);
  cdc.fillStyle = '#556';
  cdc.fillRect(2, 4, 8, 2);
  cdc.fillRect(3, 12, 6, 1);
  cdc.fillRect(1, 17, 10, 1);
  carDeadCanvas.refresh();
}
