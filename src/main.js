import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { GameScene } from './scenes/GameScene.js';

const config = {
  type: Phaser.WEBGL,
  pixelArt: true,
  backgroundColor: '#d2b48c',
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: '100%',
    height: '100%',
    parent: document.body,
  },
  scene: [BootScene, GameScene],
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    },
  },
};

new Phaser.Game(config);
