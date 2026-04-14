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
import { generateChickenFightTextures } from '../textures/chickenFightTextures.js';
import { generateCamelRaceTextures } from '../textures/camelRaceTextures.js';
import { generateRockFightTextures } from '../textures/rockFightTextures.js';
import { generateFarmFieldTextures } from '../textures/farmFieldTextures.js';
import { generateConcertTextures } from '../textures/concertTextures.js';
import { generateTireFireTextures } from '../textures/tireFireTextures.js';
import { generateWeaponTextures } from '../textures/weaponTextures.js';
import { generateBusTextures } from '../textures/busTextures.js';
import { generateWaterTextures } from '../textures/waterTextures.js';

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
    generateChickenFightTextures(this);
    generateCamelRaceTextures(this);
    generateRockFightTextures(this);
    generateFarmFieldTextures(this);
    generateConcertTextures(this);
    generateTireFireTextures(this);
    generateWeaponTextures(this);
    generateBusTextures(this);
    generateWaterTextures(this);

    this.scene.start('Game');
  }
}
