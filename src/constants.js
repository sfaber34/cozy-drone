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

// Chicken fight — cockfighting ring with spectators
export const CHICKEN_FIGHT_X = 115;
export const CHICKEN_FIGHT_Y = 108;
export const CHICKEN_FIGHT_SPECTATORS = 30; // number of spectators around the ring
export const CHICKEN_FIGHT_SPEED = 60; // how fast the fighting chickens move (px/s)
export const CHICKEN_FIGHT_DIRECTION_CHANGE = 0.3; // seconds between direction changes

// Camel race — oval track with racing camels + spectators
export const CAMEL_RACE_X = 115;
export const CAMEL_RACE_Y = 98;
export const CAMEL_RACE_CAMELS = 6; // number of racing camels
export const CAMEL_RACE_SPECTATORS = 30; // spectators around the track
export const CAMEL_RACE_SPEED_MIN = 50; // slowest camel (px/s)
export const CAMEL_RACE_SPEED_RANGE = 40; // speed variance (total max = MIN + RANGE)

// --- Dirt biker no-go zones (in tiles — center x, center y, half-width, half-height) ---
// Bikers steer around these areas to stay in open desert
export const BIKER_NO_GO_ZONES = [
  { x: TOWN_X + 30, y: TOWN_Y + 30, hw: 35, hh: 35 }, // Town
  { x: FARM_X, y: FARM_Y, hw: 15, hh: 10 }, // Farm compound
  { x: FLOCK_X, y: FLOCK_Y, hw: 15, hh: 15 }, // Goat flock
  { x: OIL_X, y: OIL_Y, hw: 20, hh: 15 }, // Oilfield
  { x: WEDDING_X, y: WEDDING_Y, hw: 8, hh: 8 }, // Wedding
  { x: SOCCER_X, y: SOCCER_Y, hw: 10, hh: 8 }, // Soccer
  { x: AIRFIELD_X, y: AIRFIELD_Y, hw: 12, hh: 20 }, // Airfield
  { x: CHICKEN_FIGHT_X, y: CHICKEN_FIGHT_Y, hw: 5, hh: 5 }, // Chicken fight
  { x: CAMEL_RACE_X, y: CAMEL_RACE_Y, hw: 8, hh: 6 }, // Camel race
];

// --- Music ---
export const MUSIC_VOLUME = 0.4; // background music volume (0-1)

// --- Missile launch SFX ---
export const MISSILE_LAUNCH_VOLUME = 0.25; // non-spatial, plays at fixed volume

// --- Explosion SFX (spatial: pans + fades with distance) ---
export const EXPLOSION_VOLUME = 0.7; // max volume at point blank

// --- Death SFX (spatial: pans + fades with distance) ---
export const DEATH_SFX_VOLUME = 0.45; // max volume at point blank
export const DEATH_SFX_MIN_VOLUME_FRAC = 0.45; // floor volume fraction at max distance (prevents silent deaths)
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

// --- Drone physics ---
export const DRONE_TURN_RATE = 90; // degrees/sec
export const DRONE_ACCEL = 50; // px/s^2
export const DRONE_MIN_SPEED_AIRBORNE = 80; // px/s (40 knots)
export const DRONE_ALT_RATE = 800; // feet/sec
export const DRONE_TAKEOFF_SPEED = 40; // knots
export const DRONE_ZOOM_ALT_THRESHOLD = 2000; // feet, zoom starts above this
export const DRONE_ZOOM_MIN = 0.65; // max zoom out
export const DRONE_ZOOM_MAX = 1.0; // no zoom
export const DRONE_MAX_SPEED = 300; // px/s
export const DRONE_MAX_ALT = 15000; // feet

// --- Missile ---
export const MISSILE_SPEED = 280;
export const MISSILE_TURN_RATE = 3.0;
export const MISSILE_BOOST_TIME = 0.3;
export const MISSILE_MAX_SPEED = 400;
export const MISSILE_ACCEL = 240;
export const MISSILE_DESCENT_RATE = 600;
export const MISSILE_HIT_RADIUS = 15;
export const MISSILE_SMOKE_INTERVAL = 40;
export const MISSILE_SMOKE_OPACITY = 0.8; // starting alpha of each smoke puff
export const MISSILE_FIRE_RATE = 0.4; // seconds between missile launches

// --- Cannon ---
export const CANNON_FIRE_RATE = 0.05; // seconds between shots (hold to auto-fire)
export const CANNON_BULLET_SPEED = 1000; // bullet travel speed (px/s)
export const CANNON_RANGE_FACTOR = 0.4; // impact distance = altitude * this factor
export const CANNON_SPREAD = 0.02; // random spread in radians
export const CANNON_KILL_RADIUS = 20; // explosion radius per bullet
export const CANNON_SHAKE_DURATION = 50; // screen shake per shot (ms)
export const CANNON_SHAKE_INTENSITY = 0.001; // screen shake intensity

// --- People AI ---
export const PEOPLE_DETECT_RADIUS = 600;
export const PEOPLE_WANDER_SPEED = 30;
export const PEOPLE_PANIC_SPEED = 60;
export const PEOPLE_KILL_RADIUS = 50;
export const PEOPLE_PANIC_RADIUS = 400;
export const PEOPLE_CALM_DISTANCE = 800;
export const PEOPLE_CALM_TIME = 5;
export const PANIC_DIR_INTERVAL_MIN = 3; // seconds between scatter-direction changes
export const PANIC_DIR_INTERVAL_MAX = 7; // seconds between scatter-direction changes
export const PANIC_DIR_CHANGE_ARC = Math.PI * 1.5; // max angle shift per change (±135°)
export const PEOPLE_HIDE_TIMEOUT = 10;
export const PEOPLE_RETURN_WAIT_MIN = 3; // min seconds event people stand idle before walking back
export const PEOPLE_RETURN_WAIT_RANGE = 12; // random range added to min (total max = MIN + RANGE)
export const PEOPLE_GREETING_MIN_DIST = 150;
export const PEOPLE_SPAWN_COUNT = 60;
export const PEOPLE_TOWN_SPAWN_COUNT = 80;
export const PEOPLE_SPAWN_AVOID_DIST = 2000;

// --- Animal AI ---
export const ANIMAL_KILL_RADIUS = 50;
export const ANIMAL_PANIC_RADIUS = 300;
export const ANIMAL_PANIC_TIMEOUT = 8;
export const ANIMAL_FLOCK_RADIUS = 500;
export const ANIMAL_FREE_ROAM_RADIUS = 60;

// --- Vehicles ---
export const CAR_COUNT = 15;
export const CAR_SPEED_MIN = 40;
export const CAR_SPEED_RANGE = 30;
export const CAR_PASSENGERS_MIN = 1;
export const CAR_PASSENGERS_MAX = 4;
export const BIKER_COUNT = 8;
export const BIKER_SPEED_MIN = 100;
export const BIKER_SPEED_RANGE = 60;
export const BIKER_TURN_RATE = 2.0;

// --- Soccer ---
export const SOCCER_FIELD_W = 300;
export const SOCCER_FIELD_H = 200;
export const SOCCER_PLAYERS_PER_TEAM = 5;
export const SOCCER_TACKLE_COOLDOWN = 2.0; // seconds before ball can be stolen after a possession change

// --- Buildings ---
export const BUILDING_HP_SMALL = 2;
export const BUILDING_HP_MEDIUM = 3;
export const BUILDING_HP_LARGE = 4;
export const BUILDING_RADIUS_SMALL = 30;
export const BUILDING_RADIUS_MEDIUM = 50;
export const BUILDING_RADIUS_LARGE = 60;
export const TOWN_GRID_COLS = 8;
export const TOWN_GRID_ROWS = 8;
export const TOWN_BLOCK_SIZE = 6;

// --- Oil field ---
export const OIL_WORKERS_COUNT = 25;
export const OIL_PUMP_SPEED_MIN = 600;
export const OIL_PUMP_SPEED_RANGE = 400;

// --- Wedding ---
export const WEDDING_HEART_INTERVAL = 800;

// --- Effects ---
export const SCREEN_SHAKE_DURATION = 200;
export const SCREEN_SHAKE_INTENSITY = 0.005;
export const CRASH_SHAKE_DURATION = 500;
export const CRASH_SHAKE_INTENSITY = 0.015;

// --- Flock ---
export const FLOCK_GOAT_COUNT = 40;
export const FLOCK_SHEPHERD_COUNT = 9;

// --- Camera ---
export const CAMERA_FOLLOW_LERP = 0.08;

// --- Cluster Bomb ---
export const CLUSTER_DESCENT_RATE = 500; // altitude feet/sec
export const CLUSTER_OPEN_FRAC = 0.7; // opens at 70% of descent (30% altitude remaining)
export const CLUSTER_BOMBLET_COUNT = 30; // bomblets released on opening (fixed)
export const CLUSTER_BOMBLET_SPREAD_FACTOR = 0.15; // scatter radius (px) per foot of altitude at opening
export const CLUSTER_FIRE_RATE = 2.5; // seconds between drops
export const CLUSTER_OPEN_SHAKE_DURATION = 120; // screen shake when casing opens (ms)
export const CLUSTER_OPEN_SHAKE_INTENSITY = 0.003; // screen shake intensity on open

// --- Bus Route ---
export const BUS_ROUTE_BLOCK_COL = 4; // town grid column (0-7) for bus road centerline
export const BUS_ROUTE_ROAD_TILES = 25; // tile length of route between the two terminals
export const BUS_TERMINAL_OFFSET_TILES = 4; // gap tiles between town edge and terminal A
export const BUS_LOOP_EXTENSION_TILES = 3; // tiles beyond each terminal for the corner/connecting road
export const BUS_ROAD_GAP_TILES = 3; // tiles each road is offset from center
export const BUS_COUNT = 2; // buses circulating (one per direction)
export const BUS_SPEED = 80; // px/s
export const BUS_CAPACITY = 8; // max riders per bus
export const BUS_RIDER_COUNT = 10; // riders pooled at each terminal
export const BUS_HP = 3; // missile hits to destroy
export const BUS_HIT_RADIUS = 40; // weapon collision radius (px)
export const BUS_LOAD_TIME = 4.0; // seconds to board/alight at terminal
export const BUS_RECOVER_TIME = 15.0; // max seconds waiting for scattered riders to return
