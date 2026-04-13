import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { GameScene } from './scenes/GameScene.js';
import { MobileControlsScene } from './scenes/MobileControlsScene.js';

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
  scene: [BootScene, GameScene, MobileControlsScene],
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    },
  },
  audio: {
    noAudio: false,
  },
};

const game = new Phaser.Game(config);

// Try to unlock audio context as early as possible
if (game.sound && game.sound.context) {
  game.sound.context.resume();
}
