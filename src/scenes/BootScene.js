import Phaser from 'phaser';
import { generateDroneTextures } from '../textures/droneTextures.js';
import { generateEffectTextures } from '../textures/effectTextures.js';
import { generatePersonTextures } from '../textures/personTextures.js';
import { generateWorkerTextures } from '../textures/workerTextures.js';
import { generateBuildingTextures } from '../textures/buildingTextures.js';
import { generateVehicleTextures } from '../textures/vehicleTextures.js';
import { generateAnimalTextures } from '../textures/animalTextures.js';
import { generateMarketTextures } from '../textures/marketTextures.js';
import { generateOilfieldTextures } from '../textures/oilfieldTextures.js';
import { generatePropTextures } from '../textures/propTextures.js';
import { generateSoccerTextures } from '../textures/soccerTextures.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    generateDroneTextures(this);
    generateEffectTextures(this);
    generatePersonTextures(this);
    generateWorkerTextures(this);
    generateBuildingTextures(this);
    generateVehicleTextures(this);
    generateAnimalTextures(this);
    generateMarketTextures(this);
    generateOilfieldTextures(this);
    generatePropTextures(this);
    generateSoccerTextures(this);

    this.scene.start('Game');
  }
}
