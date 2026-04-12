import Phaser from "phaser";

export function initAudio(scene) {
  // State
  scene.musicTracks = [];
  scene.audioLoaded = false;
  scene.musicStarted = false;
  scene.currentTrack = null;
  scene.lastTrackKey = null;
  scene.sfx = { missileLaunch: [], explosion: [], death: [] };
  scene.deathSfxActive = 0;
  scene.engineKey = null;
  scene.engineA = null;
  scene.engineB = null;
  scene.engineActive = null;
  scene.engineCrossfade = 0.5;

  if (scene.sound.context) scene.sound.context.resume();

  // Fetch all manifests in parallel
  const sfxManifests = [
    { category: "missileLaunch", path: "/sfx/missileLaunch" },
    { category: "explosion", path: "/sfx/explosion" },
    { category: "death", path: "/sfx/death" },
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

  Promise.all([musicFetch, ...sfxFetches, engineFetch]).then((results) => {
    const musicFiles = results[0] || [];
    const sfxResults = results.slice(1, 1 + sfxManifests.length);
    const engineFiles = results[results.length - 1] || [];

    // Queue music
    for (const filename of musicFiles) {
      scene.load.audio(`music-${filename}`, `/music/${filename}`);
    }
    scene.musicTracks = musicFiles;

    // Queue SFX
    for (const r of sfxResults) {
      for (const filename of r.files) {
        scene.load.audio(
          `sfx-${r.category}-${filename}`,
          `${r.path}/${filename}`,
        );
      }
    }

    // Queue engine
    let engineKey = null;
    if (engineFiles.length > 0) {
      engineKey = `sfx-engine-${engineFiles[0]}`;
      scene.load.audio(engineKey, `/sfx/engine/${engineFiles[0]}`);
    }

    // Nothing to load
    if (
      musicFiles.length === 0 &&
      engineKey === null &&
      sfxResults.every((r) => r.files.length === 0)
    )
      return;

    // Single load + single complete
    scene.load.once("complete", () => {
      scene.audioLoaded = true;
      if (scene.sound.context) scene.sound.context.resume();

      // Register SFX keys
      for (const r of sfxResults) {
        for (const filename of r.files) {
          scene.sfx[r.category].push(`sfx-${r.category}-${filename}`);
        }
      }

      // Set up engine
      if (engineKey) {
        scene.engineKey = engineKey;
        scene.engineA = scene.sound.add(engineKey, {
          volume: 0,
          loop: false,
          rate: 0.6,
        });
        scene.engineB = scene.sound.add(engineKey, {
          volume: 0,
          loop: false,
          rate: 0.6,
        });
        scene.engineActive = null;
      }

      // Start music
      if (scene.musicTracks.length > 0) {
        playRandomTrack(scene);
      }
    });
    scene.load.start();
  });

  // Browser audio unlock fallback
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
  // Don't try to play if audio hasn't finished loading
  if (!scene.audioLoaded) return;
  scene.musicStarted = true;

  let candidates = scene.musicTracks.filter(
    (t) => `music-${t}` !== scene.lastTrackKey,
  );
  if (candidates.length === 0) candidates = scene.musicTracks;
  const filename = Phaser.Utils.Array.GetRandom(candidates);
  const key = `music-${filename}`;

  if (scene.currentTrack) scene.currentTrack.stop();

  scene.currentTrack = scene.sound.add(key, { volume: 0.4 });
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

export function playSfxAt(scene, category, x, y, maxVolume = 0.7) {
  const keys = scene.sfx[category];
  if (!keys || keys.length === 0) return;
  const key = Phaser.Utils.Array.GetRandom(keys);

  const ds = scene.droneState;
  const dist = Phaser.Math.Distance.Between(ds.x, ds.y, x, y);

  // Volume falls off with distance (full at 0, silent at ~2000px)
  const maxDist = 2000;
  const volume = maxVolume * Phaser.Math.Clamp(1 - dist / maxDist, 0.05, 1);

  // Pan based on horizontal angle from drone (-1 left, +1 right)
  // Account for drone's heading so it's relative to the drone's facing direction
  const angleToExplosion = Phaser.Math.Angle.Between(ds.x, ds.y, x, y);
  const droneRad = Phaser.Math.DegToRad(ds.angle - 90);
  const relAngle = angleToExplosion - droneRad;
  const pan = Phaser.Math.Clamp(Math.sin(relAngle) * 0.25, -0.25, 0.25);

  const sfx = scene.sound.add(key, { volume });
  sfx.play({ pan });
  sfx.once("complete", () => sfx.destroy());
}

export function playDeathSfxAt(scene, x, y) {
  if (scene.deathSfxActive >= 5) return;
  const keys = scene.sfx.death;
  if (!keys || keys.length === 0) return;

  // Track recent plays — don't repeat until 3 others have played
  if (!scene.deathSfxRecent) scene.deathSfxRecent = [];

  scene.deathSfxActive++;
  const delay = (scene.deathSfxActive - 1) * 120;

  scene.time.delayedCall(delay, () => {
    // Filter out recently played
    let candidates = keys.filter((k) => !scene.deathSfxRecent.includes(k));
    if (candidates.length === 0) candidates = keys;
    const key = candidates[Math.floor(Math.random() * candidates.length)];
    // Track it — keep last 3
    scene.deathSfxRecent.push(key);
    if (scene.deathSfxRecent.length > 3) scene.deathSfxRecent.shift();
    const ds = scene.droneState;
    const dist = Phaser.Math.Distance.Between(ds.x, ds.y, x, y);
    const maxDist = 2000;
    const volume = 0.45 * Phaser.Math.Clamp(1 - dist / maxDist, 0.14, 1);
    const angleToSound = Phaser.Math.Angle.Between(ds.x, ds.y, x, y);
    const droneRad = Phaser.Math.DegToRad(ds.angle - 90);
    const relAngle = angleToSound - droneRad;
    const pan = Phaser.Math.Clamp(Math.sin(relAngle) * 0.25, -0.25, 0.25);

    const sfx = scene.sound.add(key, { volume });
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
    const targetRate = 0.6 + speedFrac * 0.8;
    const targetVol = ds.speed > 0 ? 0.04 + speedFrac * 0.07 : 0;
    const fade = scene.engineCrossfade;

    // Start the first instance if nothing is playing and speed > 0
    if (ds.speed > 0 && !scene.engineA.isPlaying && !scene.engineB.isPlaying) {
      scene.engineA.setRate(targetRate);
      scene.engineA.setVolume(targetVol);
      scene.engineA.play();
      scene.engineActive = scene.engineA;
    }

    // Update rate on both instances
    if (scene.engineA.isPlaying) scene.engineA.setRate(targetRate);
    if (scene.engineB.isPlaying) scene.engineB.setRate(targetRate);

    // Crossfade: when active instance nears its end, start the other and fade
    const active = scene.engineActive;
    const other = active === scene.engineA ? scene.engineB : scene.engineA;
    if (active && active.isPlaying && active.duration > 0) {
      const remaining = active.duration - active.seek;
      const fadeSec = fade / active.rate; // adjust for playback rate
      if (remaining < fadeSec && !other.isPlaying) {
        // Start the other instance and crossfade
        other.setRate(targetRate);
        other.setVolume(0);
        other.play();
        scene.engineActive = other;
      }
      // Fade out active if near end
      if (remaining < fadeSec) {
        const t = remaining / fadeSec;
        active.setVolume(targetVol * t);
      } else {
        active.setVolume(targetVol);
      }
      // Fade in other if just started
      if (other.isPlaying && other.seek < fadeSec) {
        const t = other.seek / fadeSec;
        other.setVolume(targetVol * t);
      } else if (other.isPlaying && other === scene.engineActive) {
        other.setVolume(targetVol);
      }
    }

    // Stop both if speed is 0
    if (ds.speed === 0) {
      if (scene.engineA.isPlaying) scene.engineA.stop();
      if (scene.engineB.isPlaying) scene.engineB.stop();
      scene.engineActive = null;
    }
  }
}
