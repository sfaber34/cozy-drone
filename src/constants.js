// --- World ---
export const WORLD_W = 200; // world width in tiles
export const WORLD_H = 200; // world height in tiles
export const TILE = 16; // tile size in pixels
export const SCALE = 3; // pixel art scale multiplier

// --- Map element positions (in tiles — multiply by TILE * SCALE for px) ---
// Change x/y to move an entire group (all props + people) together

// Town — NW quadrant, grid of roads + buildings + bazaar
export const TOWN_X = 2;
export const TOWN_Y = 2;

// Farm compound — NE area, single farm with buildings + corrals
export const FARM_X = 112;
export const FARM_Y = 40;

// Goat flock + shepherds — open desert east of farm
export const FLOCK_X = 152;
export const FLOCK_Y = 40;

// Oilfield — large grid of wells + tanks + pipes, below farm
export const OIL_X = 117;
export const OIL_Y = 57;

// Wedding — ceremony in the desert with bride/groom/guests
export const WEDDING_X = 150;
export const WEDDING_Y = 120;

// Soccer game — field with teams + spectators
export const SOCCER_X = 160;
export const SOCCER_Y = 80;

// Airfield — runway + hangar + taxiway, center of map
export const AIRFIELD_X = 100;
export const AIRFIELD_Y = 100;

// --- Music ---
export const MUSIC_VOLUME = 0.4; // background music volume (0-1)

// --- Missile launch SFX ---
export const MISSILE_LAUNCH_VOLUME = 0.25; // non-spatial, plays at fixed volume

// --- Explosion SFX (spatial: pans + fades with distance) ---
export const EXPLOSION_VOLUME = 0.7; // max volume at point blank

// --- Death SFX (spatial: pans + fades with distance) ---
export const DEATH_SFX_VOLUME = 0.45; // max volume at point blank
export const DEATH_SFX_MIN_VOLUME_FRAC = 0.14; // floor volume fraction at max distance (prevents silent deaths)
export const DEATH_SFX_MAX_CONCURRENT = 5; // max death sounds playing at once (extras dropped)
export const DEATH_SFX_STAGGER_MS = 120; // ms delay between staggered death sounds in a mass kill
export const DEATH_SFX_COOLDOWN = 3; // how many other death sounds must play before one can repeat

// --- Engine SFX (looping, pitch/volume shift with drone speed) ---
export const ENGINE_VOLUME_MIN = 0.04; // volume at minimum speed
export const ENGINE_VOLUME_RANGE = 0.07; // additional volume added at max speed (total max = MIN + RANGE)
export const ENGINE_RATE_MIN = 0.6; // playback rate (pitch) at minimum speed
export const ENGINE_RATE_RANGE = 0.8; // additional rate at max speed (total max = MIN + RANGE)
export const ENGINE_CROSSFADE_SEC = 0.5; // seconds of overlap when crossfading the engine loop

// --- Spatial audio (shared by explosion + death SFX) ---
export const SFX_MAX_DISTANCE = 2000; // distance in px at which spatial SFX reaches minimum volume
export const SFX_MIN_VOLUME_FRAC = 0.05; // volume fraction at SFX_MAX_DISTANCE (0.05 = 5% of max)
export const SFX_PAN_AMOUNT = 0.25; // max stereo pan amount (0 = center, 1 = hard left/right)
