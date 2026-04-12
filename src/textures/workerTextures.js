import Phaser from 'phaser';
import { NUM_SKINS, skinTones } from './personTextures.js';

export function generateWorkerTextures(scene) {
  const workerHats = ['#ffcc00', '#fff', '#ff8800', '#ff4444', '#44aaff', '#44cc44'];
  const workerVests = ['#ff6600', '#ff8800', '#ffcc00'];
  const workerPants = ['#335588', '#445588', '#333', '#555', '#443322', '#2a3a5a', '#4a4a4a', '#224422', '#3a3a3a', '#665544'];
  const workerRng = new Phaser.Math.RandomDataGenerator(['workers']);
  const NUM_WORKER_SKINS = 20;
  for (let hi = 0; hi < NUM_WORKER_SKINS; hi++) {
    const h = {
      skin: workerRng.pick(skinTones),
      hat: workerRng.pick(workerHats),
      vest: workerRng.pick(workerVests),
      pants: workerRng.pick(workerPants),
    };
    const idx = NUM_SKINS + hi;

    // Standing
    const hsCanvas = scene.textures.createCanvas(`person-stand-${idx}`, 10, 14);
    const hs = hsCanvas.context;
    hs.fillStyle = h.skin;
    hs.fillRect(3, 1, 4, 3);
    hs.fillStyle = h.hat;
    hs.fillRect(2, 0, 6, 2);
    hs.fillStyle = '#222';
    hs.fillRect(4, 2, 1, 1);
    hs.fillRect(6, 2, 1, 1);
    hs.fillStyle = h.vest;
    hs.fillRect(3, 4, 4, 5);
    hs.fillStyle = '#ff8800';
    hs.fillRect(5, 4, 1, 5); // vest stripe
    hs.fillStyle = h.skin;
    hs.fillRect(2, 5, 1, 3);
    hs.fillRect(7, 5, 1, 3);
    hs.fillStyle = h.pants;
    hs.fillRect(3, 9, 2, 3);
    hs.fillRect(5, 9, 2, 3);
    hs.fillStyle = '#333';
    hs.fillRect(3, 12, 2, 2);
    hs.fillRect(5, 12, 2, 2);
    hsCanvas.refresh();

    // Wave 1
    const hw1Canvas = scene.textures.createCanvas(`person-wave1-${idx}`, 10, 14);
    const hw1 = hw1Canvas.context;
    hw1.fillStyle = h.skin;
    hw1.fillRect(3, 1, 4, 3);
    hw1.fillStyle = h.hat;
    hw1.fillRect(2, 0, 6, 2);
    hw1.fillStyle = '#222';
    hw1.fillRect(4, 2, 1, 1);
    hw1.fillRect(6, 2, 1, 1);
    hw1.fillStyle = '#c44';
    hw1.fillRect(4, 3, 3, 1);
    hw1.fillStyle = h.vest;
    hw1.fillRect(3, 4, 4, 5);
    hw1.fillStyle = '#ff8800';
    hw1.fillRect(5, 4, 1, 5);
    hw1.fillStyle = h.skin;
    hw1.fillRect(2, 5, 1, 3);
    hw1.fillRect(7, 4, 1, 1);
    hw1.fillRect(8, 3, 1, 1);
    hw1.fillRect(9, 2, 1, 1);
    hw1.fillStyle = h.pants;
    hw1.fillRect(3, 9, 2, 3);
    hw1.fillRect(5, 9, 2, 3);
    hw1.fillStyle = '#333';
    hw1.fillRect(3, 12, 2, 2);
    hw1.fillRect(5, 12, 2, 2);
    hw1Canvas.refresh();

    // Wave 2
    const hw2Canvas = scene.textures.createCanvas(`person-wave2-${idx}`, 10, 14);
    const hw2 = hw2Canvas.context;
    hw2.fillStyle = h.skin;
    hw2.fillRect(3, 1, 4, 3);
    hw2.fillStyle = h.hat;
    hw2.fillRect(2, 0, 6, 2);
    hw2.fillStyle = '#222';
    hw2.fillRect(4, 2, 1, 1);
    hw2.fillRect(6, 2, 1, 1);
    hw2.fillStyle = '#c44';
    hw2.fillRect(4, 3, 3, 1);
    hw2.fillStyle = h.vest;
    hw2.fillRect(3, 4, 4, 5);
    hw2.fillStyle = '#ff8800';
    hw2.fillRect(5, 4, 1, 5);
    hw2.fillStyle = h.skin;
    hw2.fillRect(2, 5, 1, 3);
    hw2.fillRect(7, 4, 1, 1);
    hw2.fillRect(8, 2, 1, 1);
    hw2.fillRect(9, 1, 1, 1);
    hw2.fillStyle = h.pants;
    hw2.fillRect(3, 9, 2, 3);
    hw2.fillRect(5, 9, 2, 3);
    hw2.fillStyle = '#333';
    hw2.fillRect(3, 12, 2, 2);
    hw2.fillRect(5, 12, 2, 2);
    hw2Canvas.refresh();

    // Run 1
    const hr1Canvas = scene.textures.createCanvas(`person-run1-${idx}`, 10, 14);
    const hr1 = hr1Canvas.context;
    hr1.fillStyle = h.skin;
    hr1.fillRect(3, 1, 4, 3);
    hr1.fillStyle = h.hat;
    hr1.fillRect(2, 0, 6, 2);
    hr1.fillStyle = '#222';
    hr1.fillRect(4, 2, 1, 1);
    hr1.fillRect(6, 2, 1, 1);
    hr1.fillStyle = h.vest;
    hr1.fillRect(3, 4, 4, 5);
    hr1.fillStyle = '#ff8800';
    hr1.fillRect(5, 4, 1, 5);
    hr1.fillStyle = h.skin;
    hr1.fillRect(1, 4, 2, 1);
    hr1.fillRect(7, 5, 2, 1);
    hr1.fillStyle = h.pants;
    hr1.fillRect(3, 9, 2, 3);
    hr1.fillRect(6, 9, 2, 2);
    hr1.fillStyle = '#333';
    hr1.fillRect(3, 12, 2, 2);
    hr1.fillRect(6, 11, 2, 2);
    hr1Canvas.refresh();

    // Run 2
    const hr2Canvas = scene.textures.createCanvas(`person-run2-${idx}`, 10, 14);
    const hr2 = hr2Canvas.context;
    hr2.fillStyle = h.skin;
    hr2.fillRect(3, 1, 4, 3);
    hr2.fillStyle = h.hat;
    hr2.fillRect(2, 0, 6, 2);
    hr2.fillStyle = '#222';
    hr2.fillRect(4, 2, 1, 1);
    hr2.fillRect(6, 2, 1, 1);
    hr2.fillStyle = h.vest;
    hr2.fillRect(3, 4, 4, 5);
    hr2.fillStyle = '#ff8800';
    hr2.fillRect(5, 4, 1, 5);
    hr2.fillStyle = h.skin;
    hr2.fillRect(1, 5, 2, 1);
    hr2.fillRect(7, 4, 2, 1);
    hr2.fillStyle = h.pants;
    hr2.fillRect(3, 9, 2, 2);
    hr2.fillRect(6, 9, 2, 3);
    hr2.fillStyle = '#333';
    hr2.fillRect(3, 11, 2, 2);
    hr2.fillRect(6, 12, 2, 2);
    hr2Canvas.refresh();
  }
}
