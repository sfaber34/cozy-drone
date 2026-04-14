import Phaser from "phaser";
import {
  MUSIC_VOLUME,
  DEATH_SFX_VOLUME,
  DEATH_SFX_MIN_VOLUME_FRAC,
  DEATH_SFX_MAX_CONCURRENT,
  DEATH_SFX_STAGGER_MS,
  DEATH_SFX_COOLDOWN,
  ENGINE_VOLUME_MIN,
  ENGINE_VOLUME_RANGE,
  ENGINE_RATE_MIN,
  ENGINE_RATE_RANGE,
  ENGINE_CROSSFADE_SEC,
  CANNON_GUN_VOLUME,
  CANNON_GUN_CROSSFADE_SEC,
  SFX_MAX_DISTANCE,
  SFX_MIN_VOLUME_FRAC,
  SFX_PAN_AMOUNT,
} from "../constants.js";

// Entries in sounds.json can be a plain string or { file, volume }.
// Returns { file, volume } in both cases.
function parseSfxEntry(entry) {
  if (typeof entry === "string") return { file: entry, volume: 1 };
  return { file: entry.file, volume: entry.volume ?? 1 };
}

export function initAudio(scene) {
  scene.musicTracks = [];
  scene.audioLoaded = false;
  scene.musicStarted = false;
  scene.currentTrack = null;
  scene.lastTrackKey = null;
  scene.sfx = {
    missileLaunch: [],
    explosion: [],
    death: [],
    pigDeath: [],
    chickenDeath: [],
    camelDeath: [],
    goatDeath: [],
  };
  scene.sfxVolumes = new Map(); // key → per-sound volume modifier
  scene.lastDeathSfxName = null; // filename stem of the most recently played death SFX
  scene.deathSfxActive = 0;
  scene.engineKey = null;
  scene.engineA = null;
  scene.engineB = null;
  scene.engineActive = null;
  scene.engineCrossfade = ENGINE_CROSSFADE_SEC;
  scene.cannonGunKey = null;
  scene.cannonGunA = null;
  scene.cannonGunB = null;
  scene.cannonGunActive = null;

  if (scene.sound.context) scene.sound.context.resume();

  const sfxManifests = [
    { category: "missileLaunch", path: "/sfx/missileLaunch" },
    { category: "explosion", path: "/sfx/explosion" },
    { category: "death", path: "/sfx/death" },
    { category: "pigDeath", path: "/sfx/pigDeath" },
    { category: "chickenDeath", path: "/sfx/chickenDeath" },
    { category: "camelDeath", path: "/sfx/camelDeath" },
    { category: "goatDeath", path: "/sfx/goatDeath" },
  ];

  const musicFetch = fetch("/music/tracks.json")
    .then((r) => r.json())
    .catch(() => []);
  const sfxFetches = sfxManifests.map((m) =>
    fetch(`${m.path}/sounds.json`)
      .then((r) => r.json())
      .then((files) => ({ ...m, files: files || [] }))
      .catch(() => ({ ...m, files: [] })),
  );
  const engineFetch = fetch("/sfx/engine/sounds.json")
    .then((r) => r.json())
    .catch(() => []);
  const cannonGunFetch = fetch("/sfx/cannonFiring/sounds.json")
    .then((r) => r.json())
    .catch(() => []);

  Promise.all([musicFetch, ...sfxFetches, engineFetch, cannonGunFetch]).then((results) => {
    const musicFiles = results[0] || [];
    const sfxResults = results.slice(1, 1 + sfxManifests.length);
    const engineFiles = results[sfxManifests.length + 1] || [];
    const cannonGunFiles = results[sfxManifests.length + 2] || [];

    for (const filename of musicFiles) {
      scene.load.audio(`music-${filename}`, `/music/${filename}`);
    }
    scene.musicTracks = musicFiles;

    for (const r of sfxResults) {
      for (const entry of r.files) {
        const { file, volume } = parseSfxEntry(entry);
        const key = `sfx-${r.category}-${file}`;
        scene.load.audio(key, `${r.path}/${file}`);
        if (volume !== 1) scene.sfxVolumes.set(key, volume);
      }
    }

    let engineKey = null;
    if (engineFiles.length > 0) {
      engineKey = `sfx-engine-${engineFiles[0]}`;
      scene.load.audio(engineKey, `/sfx/engine/${engineFiles[0]}`);
    }

    let cannonGunKey = null;
    if (cannonGunFiles.length > 0) {
      cannonGunKey = `sfx-cannonFiring-${cannonGunFiles[0]}`;
      scene.load.audio(cannonGunKey, `/sfx/cannonFiring/${cannonGunFiles[0]}`);
    }

    if (
      musicFiles.length === 0 &&
      engineKey === null &&
      cannonGunKey === null &&
      sfxResults.every((r) => r.files.length === 0)
    )
      return;

    scene.load.once("complete", () => {
      scene.audioLoaded = true;
      if (scene.sound.context) scene.sound.context.resume();

      for (const r of sfxResults) {
        for (const entry of r.files) {
          const { file } = parseSfxEntry(entry);
          scene.sfx[r.category].push(`sfx-${r.category}-${file}`);
        }
      }

      if (engineKey) {
        scene.engineKey = engineKey;
        scene.engineA = scene.sound.add(engineKey, {
          volume: 0,
          loop: false,
          rate: ENGINE_RATE_MIN,
        });
        scene.engineB = scene.sound.add(engineKey, {
          volume: 0,
          loop: false,
          rate: ENGINE_RATE_MIN,
        });
        scene.engineActive = null;
      }

      if (cannonGunKey) {
        scene.cannonGunKey = cannonGunKey;
        scene.cannonGunA = scene.sound.add(cannonGunKey, { volume: 0, loop: false });
        scene.cannonGunB = scene.sound.add(cannonGunKey, { volume: 0, loop: false });
        scene.cannonGunActive = null;
      }

      if (scene.musicTracks.length > 0) {
        playRandomTrack(scene);
      }
    });
    scene.load.start();
  });

  if (scene.sound.locked) {
    scene.sound.once("unlocked", () => {
      if (scene.musicTracks.length > 0 && !scene.musicStarted) {
        playRandomTrack(scene);
      }
    });
  }
}

export function playRandomTrack(scene) {
  if (scene.musicTracks.length === 0) return;
  if (!scene.audioLoaded) return;
  scene.musicStarted = true;

  let candidates = scene.musicTracks.filter(
    (t) => `music-${t}` !== scene.lastTrackKey,
  );
  if (candidates.length === 0) candidates = scene.musicTracks;
  const filename = Phaser.Utils.Array.GetRandom(candidates);
  const key = `music-${filename}`;

  if (scene.currentTrack) scene.currentTrack.stop();

  scene.currentTrack = scene.sound.add(key, { volume: MUSIC_VOLUME });
  scene.currentTrack.play();
  scene.lastTrackKey = key;

  scene.currentTrack.once("complete", () => {
    playRandomTrack(scene);
  });
}

export function playSfx(scene, category, volume = 0.5) {
  const keys = scene.sfx[category];
  if (!keys || keys.length === 0) return;
  const key = Phaser.Utils.Array.GetRandom(keys);
  scene.sound.play(key, { volume });
}

function computeSpatialAudio(scene, x, y, maxVolume) {
  const ds = scene.droneState;
  const dist = Phaser.Math.Distance.Between(ds.x, ds.y, x, y);
  const volume = maxVolume * Phaser.Math.Clamp(1 - dist / SFX_MAX_DISTANCE, SFX_MIN_VOLUME_FRAC, 1);
  const angleToSound = Phaser.Math.Angle.Between(ds.x, ds.y, x, y);
  const droneRad = Phaser.Math.DegToRad(ds.angle - 90);
  const relAngle = angleToSound - droneRad;
  const pan = Phaser.Math.Clamp(Math.sin(relAngle) * SFX_PAN_AMOUNT, -SFX_PAN_AMOUNT, SFX_PAN_AMOUNT);
  return { volume, pan };
}

export function playSfxAt(scene, category, x, y, maxVolume = 0.7) {
  const keys = scene.sfx[category];
  if (!keys || keys.length === 0) return;
  const key = Phaser.Utils.Array.GetRandom(keys);
  const { volume, pan } = computeSpatialAudio(scene, x, y, maxVolume);
  const sfx = scene.sound.add(key, { volume });
  sfx.play({ pan });
  sfx.once("complete", () => sfx.destroy());
}

export function playDeathSfxAt(scene, x, y) {
  if (scene.deathSfxActive >= DEATH_SFX_MAX_CONCURRENT) return;
  const keys = scene.sfx.death;
  if (!keys || keys.length === 0) return;

  if (!scene.deathSfxRecent) scene.deathSfxRecent = [];

  scene.deathSfxActive++;
  const delay = (scene.deathSfxActive - 1) * DEATH_SFX_STAGGER_MS;

  scene.time.delayedCall(delay, () => {
    let candidates = keys.filter((k) => !scene.deathSfxRecent.includes(k));
    if (candidates.length === 0) candidates = keys;
    const key = candidates[Math.floor(Math.random() * candidates.length)];
    scene.deathSfxRecent.push(key);
    if (scene.deathSfxRecent.length > DEATH_SFX_COOLDOWN) scene.deathSfxRecent.shift();

    const { volume, pan } = computeSpatialAudio(scene, x, y, DEATH_SFX_VOLUME);
    const volumeModifier = scene.sfxVolumes.get(key) ?? 1;
    const finalVolume = Math.max(volume, DEATH_SFX_VOLUME * DEATH_SFX_MIN_VOLUME_FRAC) * volumeModifier;

    // Track name for HUD display: "sfx-death-death1.mp3" → "death1"
    scene.lastDeathSfxName = key.replace(/^sfx-death-/, "").replace(/\.[^.]+$/, "");

    const sfx = scene.sound.add(key, { volume: finalVolume });
    sfx.play({ pan });
    sfx.once("complete", () => {
      sfx.destroy();
      scene.deathSfxActive--;
    });
  });
}

// Animal death sfx — mirrors playDeathSfxAt but keyed by animal type.
// Shares the same DEATH_SFX_MAX_CONCURRENT / STAGGER budget as people deaths
// so a mass kill (people + animals together) doesn't stack 30 simultaneous
// sounds. Each type maintains its own recent-cooldown list so variants rotate.
export function playAnimalDeathSfxAt(scene, type, x, y) {
  if (scene.deathSfxActive >= DEATH_SFX_MAX_CONCURRENT) return;
  const categoryKey = `${type}Death`;
  const keys = scene.sfx[categoryKey];
  if (!keys || keys.length === 0) return;

  if (!scene.animalDeathSfxRecent) scene.animalDeathSfxRecent = {};
  if (!scene.animalDeathSfxRecent[categoryKey])
    scene.animalDeathSfxRecent[categoryKey] = [];
  const recent = scene.animalDeathSfxRecent[categoryKey];

  scene.deathSfxActive++;
  const delay = (scene.deathSfxActive - 1) * DEATH_SFX_STAGGER_MS;

  scene.time.delayedCall(delay, () => {
    let candidates = keys.filter((k) => !recent.includes(k));
    if (candidates.length === 0) candidates = keys;
    const key = candidates[Math.floor(Math.random() * candidates.length)];
    recent.push(key);
    if (recent.length > DEATH_SFX_COOLDOWN) recent.shift();

    const { volume, pan } = computeSpatialAudio(scene, x, y, DEATH_SFX_VOLUME);
    const volumeModifier = scene.sfxVolumes.get(key) ?? 1;
    const finalVolume =
      Math.max(volume, DEATH_SFX_VOLUME * DEATH_SFX_MIN_VOLUME_FRAC) *
      volumeModifier;

    // Track for HUD display: "sfx-pigDeath-oink1.mp3" → "oink1"
    scene.lastAnimalDeathSfxName = key
      .replace(/^sfx-\w+Death-/, "")
      .replace(/\.[^.]+$/, "");

    const sfx = scene.sound.add(key, { volume: finalVolume });
    sfx.play({ pan });
    sfx.once("complete", () => {
      sfx.destroy();
      scene.deathSfxActive--;
    });
  });
}

export function updateEngineSound(scene, ds, delta) {
  if (scene.engineA && scene.engineB) {
    const speedFrac = ds.speed / ds.maxSpeed;
    const targetRate = ENGINE_RATE_MIN + speedFrac * ENGINE_RATE_RANGE;
    const targetVol = ds.speed > 0 ? ENGINE_VOLUME_MIN + speedFrac * ENGINE_VOLUME_RANGE : 0;
    const fade = scene.engineCrossfade;

    if (ds.speed > 0 && !scene.engineA.isPlaying && !scene.engineB.isPlaying) {
      scene.engineA.setRate(targetRate);
      scene.engineA.setVolume(targetVol);
      scene.engineA.play();
      scene.engineActive = scene.engineA;
    }

    if (scene.engineA.isPlaying) scene.engineA.setRate(targetRate);
    if (scene.engineB.isPlaying) scene.engineB.setRate(targetRate);

    const active = scene.engineActive;
    const other = active === scene.engineA ? scene.engineB : scene.engineA;
    if (active && active.isPlaying && active.duration > 0) {
      const remaining = active.duration - active.seek;
      const fadeSec = fade / active.rate;
      if (remaining < fadeSec && !other.isPlaying) {
        other.setRate(targetRate);
        other.setVolume(0);
        other.play();
        scene.engineActive = other;
      }
      if (remaining < fadeSec) {
        const t = remaining / fadeSec;
        active.setVolume(targetVol * t);
      } else {
        active.setVolume(targetVol);
      }
      if (other.isPlaying && other.seek < fadeSec) {
        const t = other.seek / fadeSec;
        other.setVolume(targetVol * t);
      } else if (other.isPlaying && other === scene.engineActive) {
        other.setVolume(targetVol);
      }
    }

    if (ds.speed === 0) {
      if (scene.engineA.isPlaying) scene.engineA.stop();
      if (scene.engineB.isPlaying) scene.engineB.stop();
      scene.engineActive = null;
    }
  }
}

export function updateCannonFiringSound(scene, isFiring) {
  const a = scene.cannonGunA;
  const b = scene.cannonGunB;
  if (!a || !b) return;

  if (!isFiring) {
    if (a.isPlaying) a.stop();
    if (b.isPlaying) b.stop();
    scene.cannonGunActive = null;
    return;
  }

  const fade = CANNON_GUN_CROSSFADE_SEC;

  // Kick off playback if nothing is running
  if (!a.isPlaying && !b.isPlaying) {
    a.setVolume(CANNON_GUN_VOLUME);
    a.play();
    scene.cannonGunActive = a;
  }

  const active = scene.cannonGunActive;
  if (!active || !active.isPlaying) return;
  const other = active === a ? b : a;

  // Chain next loop before the current one ends
  if (active.duration > 0) {
    const remaining = active.duration - active.seek;
    if (remaining < fade && !other.isPlaying) {
      other.setVolume(0);
      other.play();
      scene.cannonGunActive = other;
    }
    // Crossfade volumes
    if (remaining < fade) {
      const t = remaining / fade;
      active.setVolume(CANNON_GUN_VOLUME * t);
    } else {
      active.setVolume(CANNON_GUN_VOLUME);
    }
    if (other.isPlaying && other.seek < fade) {
      other.setVolume(CANNON_GUN_VOLUME * (other.seek / fade));
    } else if (other.isPlaying && other === scene.cannonGunActive) {
      other.setVolume(CANNON_GUN_VOLUME);
    }
  }
}
