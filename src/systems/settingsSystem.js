// Persistent user preferences: audio levels + HUD-element visibility.
//
// Stored under their OWN localStorage key, completely separate from the
// game save (SAVE_KEY in saveSystem.js). That separation is the whole
// point: restarting, winning, or clearing a save must never touch these —
// they persist across every game and every session until the player
// changes them. clearSave()/restartMission() only ever touch the save.

const SETTINGS_KEY = "cozy-drone-settings";

// Every persisted preference and its out-of-the-box value. Volumes are
// 0–1.5 multipliers (1 = 100%). Merged OVER whatever is stored on load, so
// a preference added in a future version picks up its default for existing
// players instead of coming back undefined.
export const DEFAULT_SETTINGS = {
  sfxVolume: 1,
  musicVolume: 1,
  showMinimap: true,
  showTooltips: true,
};

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch (e) {
    return { ...DEFAULT_SETTINGS };
  }
}

// Snapshot the scene's live preference values back to localStorage. Called
// after every pause-menu change (slider drag, toggle flip) so a setting is
// persisted the moment it's adjusted. Reads the same scene fields the game
// applies at runtime, so there's a single source of truth.
export function persistSettings(scene) {
  try {
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({
        sfxVolume: scene.sfxVolumeMult,
        musicVolume: scene.musicVolumeMult,
        showMinimap: scene.showMinimap,
        showTooltips: scene.showTooltips,
      }),
    );
  } catch (e) {
    /* storage unavailable — settings just won't persist this session */
  }
}
