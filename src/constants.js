// --- World ---
export const WORLD_W = 160; // world width in tiles
export const WORLD_H = 160; // world height in tiles
export const TILE = 16; // tile size in pixels
export const SCALE = 3; // pixel art scale multiplier
export const MOAT_TILES = 30; // water tiles surrounding the map on every side

// Set-piece positions are passed at call-time now:
//   scene.setPieces.push(createX(scene, rng, { tileX, tileY }))
// Per-setpiece BALANCE knobs live below; the positions live in GameScene.

// Farm field — size/counts only (position via tileX/tileY)
export const FARM_FIELD_WIDTH_PX = 1600; // field width (px)
export const FARM_FIELD_HEIGHT_PX = 1200; // field height (px)
export const FARM_FIELD_TRACTOR_COUNT = 6;
export const FARM_FIELD_TRACTOR_SPEED = 20; // px/s along the row length (slow, real-world tractor feel)
export const FARM_FIELD_TRACTOR_ROWS_PER_STRIP = 4; // discrete plow rows per strip; tractor U-turns to next row at each end
export const FARM_FIELD_TRACTOR_TURN_DURATION = 1.6; // seconds to complete each U-turn at the strip edge
export const FARM_FIELD_TRACTOR_TURN_ARC = 18; // px of arc "bulge" during U-turn (overshoots the strip edge)
export const FARM_FIELD_TRACTOR_DUST_INTERVAL = 260; // ms between dust-puff spawns behind a driving tractor
export const FARM_FIELD_TRACTOR_DUST_DURATION = 5000; // ms each dust puff lives
export const FARM_FIELD_TRACTOR_DUST_OPACITY = 0.75; // starting alpha of each dust puff (+random jitter on top)
export const FARM_FIELD_TRACTOR_DUST_OPACITY_JITTER = 0.2; // random alpha added per puff
export const FARM_FIELD_REMOUNT_DIST = 18; // px proximity for driver to climb back on
export const FARM_FIELD_PICKER_COUNT = 32; // people picking crops in the field
export const FARM_FIELD_PICKER_WALK_SPEED = 22; // px/s when walking between pick spots
export const FARM_FIELD_PICKER_PICK_DURATION_MIN = 1.6; // seconds of pick animation before moving on
export const FARM_FIELD_PICKER_PICK_DURATION_RANGE = 1.4; // random added
export const FARM_FIELD_PICKER_HOP_DIST_MIN = 30; // px min distance to next pick spot
export const FARM_FIELD_PICKER_HOP_DIST_RANGE = 80; // px random added
export const FARM_FIELD_ANIMAL_PIGS = 10;
export const FARM_FIELD_ANIMAL_CHICKENS = 10;
export const FARM_FIELD_ANIMAL_CAMELS = 8;
// export const FARM_FIELD_ANIMAL_SHEEP = 10; // uses goat texture as a sheep stand-in
export const FARM_FIELD_ANIMAL_SHEEP = 40;
export const FARM_FIELD_TRACTOR_HP = 2; // HP per tractor. Missiles deal 1, cannon deals 0.5 → 2 missile hits / 4 cannon hits
export const FARM_FIELD_TRACTOR_HIT_RADIUS = 40; // px explosion radius that counts as a hit on a tractor

// Concert — stage with a 4-piece band and a dancing/cheering/wandering crowd
// NOTE: no X/Y constants — concert is placed via createConcert(scene, rng, { tileX, tileY })
export const CONCERT_STAGE_WIDTH_PX = 320;
export const CONCERT_STAGE_HEIGHT_PX = 80;
export const CONCERT_MUSICIAN_COUNT = 4; // singer, guitarist, keyboardist, drummer
export const CONCERT_CROWD_COUNT = 30;
export const CONCERT_CROWD_WIDTH_PX = 420;
export const CONCERT_CROWD_HEIGHT_PX = 260;
export const CONCERT_CROWD_TOP_GAP_PX = 24; // gap between stage and crowd
export const CONCERT_CROWD_MIN_SPACING = 14; // anti-stack min px between crowd members
export const CONCERT_CROWD_SPAWN_MAX_TRIES = 30;
// Music note emojis rising from each musician
export const CONCERT_NOTE_INTERVAL_MIN = 700; // ms between spawns per musician
export const CONCERT_NOTE_INTERVAL_RANGE = 600;
export const CONCERT_NOTE_RISE_HEIGHT = 48; // px the note floats upward
export const CONCERT_NOTE_RISE_DURATION = 1800; // ms
// Dance / cheer / wander state
export const CONCERT_STATE_SWITCH_MIN = 5; // seconds between crowd-member state flips
export const CONCERT_STATE_SWITCH_RANGE = 8;
export const CONCERT_DANCE_FRAME_INTERVAL = 260; // ms between dance frames
export const CONCERT_DANCE_BOB_HZ = 2.0; // bob-up-down frequency (Hz)
export const CONCERT_DANCE_BOB_AMP = 2; // px bob amplitude
export const CONCERT_CHEER_FRAME_INTERVAL = 360; // ms
export const CONCERT_WANDER_SPEED = 16; // px/s while wandering
export const CONCERT_WANDER_HOP_DIST_MIN = 25;
export const CONCERT_WANDER_HOP_DIST_RANGE = 60;

// Chicken fight — cockfighting ring with spectators (position via tileX/tileY)
export const CHICKEN_FIGHT_SPECTATORS = 30; // number of spectators around the ring
export const CHICKEN_FIGHT_SPEED = 60; // how fast the fighting chickens move (px/s)
export const CHICKEN_FIGHT_DIRECTION_CHANGE = 0.3; // seconds between direction changes

// Camel race — oval track with racing camels + spectators (position via tileX/tileY)
export const CAMEL_RACE_CAMELS = 6; // number of racing camels
export const CAMEL_RACE_SPECTATORS = 30; // spectators around the track
export const CAMEL_RACE_SPEED_MIN = 50; // slowest camel (px/s)
export const CAMEL_RACE_SPEED_RANGE = 40; // speed variance (total max = MIN + RANGE)

// Rock fight — two opposing groups of people throwing pixel rocks (position via tileX/tileY)
export const ROCK_FIGHT_GROUP_SIZE = 20; // people per group (two groups face each other)
export const ROCK_FIGHT_GROUP_SPACING = 220; // gap between the two groups (px)
export const ROCK_FIGHT_GROUP_WIDTH = 200; // horizontal spread of each group (px)
export const ROCK_FIGHT_GROUP_DEPTH = 340; // vertical spread of each group (px)
export const ROCK_FIGHT_THROW_INTERVAL_MIN = 12.0; // min seconds between throws per person
export const ROCK_FIGHT_THROW_INTERVAL_RANGE = 34.0; // random range added (total max = MIN + RANGE)
export const ROCK_FIGHT_ROCK_SPEED = 230; // rock horizontal travel speed (px/s)
export const ROCK_FIGHT_ROCK_ARC_HEIGHT = 40; // parabolic arc peak height (px)
export const ROCK_FIGHT_WINDUP_DURATION = 0.35; // seconds of arm-cocked-back windup before release
export const ROCK_FIGHT_THROW_POSE_DURATION = 0.58; // seconds the thrower holds the release pose after the rock flies
export const ROCK_FIGHT_HIT_FLASH_DURATION = 0.3; // seconds the hit target flashes red
export const ROCK_FIGHT_HIT_KNOCKBACK = 3; // px the target sprite jolts on hit
export const ROCK_FIGHT_IDLE_WAVE_INTERVAL_MIN = 220; // ms between idle angry-wave frames (per person)
export const ROCK_FIGHT_IDLE_WAVE_INTERVAL_RANGE = 180; // random ms added (total max = MIN + RANGE)
export const ROCK_FIGHT_MIN_SPACING = 14; // min world px between any two rock-fight people (anti-stack)
export const ROCK_FIGHT_SPAWN_MAX_TRIES = 30; // attempts to find a non-overlapping spot before giving up

// Rock target practice — a group throwing rocks at breakable vases/bottles
// (position via tileX/tileY). Targets respawn after a cooldown so there's
// always something to hit.
export const ROCK_TARGET_THROWER_COUNT = 15;
export const ROCK_TARGET_OBJECT_COUNT = 18; // total breakable targets
export const ROCK_TARGET_OBJECT_ROWS = 3; // rows of targets stacked back-to-front
export const ROCK_TARGET_THROWER_SPREAD_PX = 320; // horizontal spread of throwers
export const ROCK_TARGET_OBJECT_SPREAD_PX = 350; // horizontal spread of targets
export const ROCK_TARGET_FIELD_DEPTH_PX = 220; // distance from throwers to nearest target row
export const ROCK_TARGET_THROW_INTERVAL_MIN = 2.5; // seconds between throws per person
export const ROCK_TARGET_THROW_INTERVAL_RANGE = 3.0;
export const ROCK_TARGET_WINDUP_DURATION = 0.35; // seconds of arm-cocked-back
export const ROCK_TARGET_RELEASE_POSE_DURATION = 0.45; // seconds holding the release pose
export const ROCK_TARGET_ROCK_SPEED = 180; // rock travel speed (px/s)
export const ROCK_TARGET_ROCK_ARC_HEIGHT = 45; // parabolic arc peak (px)
export const ROCK_TARGET_MISS_CHANCE = 0.45; // fraction of throws that miss
export const ROCK_TARGET_MISS_SPREAD_PX = 40; // how wide the miss can land
export const ROCK_TARGET_RESPAWN_MIN = 3500; // ms before a broken target returns
export const ROCK_TARGET_RESPAWN_RANGE = 4500; // random ms added
export const ROCK_TARGET_CHEER_DURATION = 1400; // ms the thrower cheers after a hit
export const ROCK_TARGET_SHARD_COUNT = 7; // debris particles per break
export const ROCK_TARGET_SHARD_DURATION = 700; // ms each shard flies before vanishing
export const ROCK_TARGET_SHARD_SPREAD = 34; // px fling distance on break
export const ROCK_TARGET_MIN_SPACING_PX = 28; // min spacing between throwers (anti-stack)
export const ROCK_TARGET_OBJECT_SCALE = 0.75; // scale multiplier for target sprites (× SCALE)

// --- Hookah lounge set piece ---
// Row of hookahs with smokers seated around each one, cycling inhale →
// hold → exhale. Continuous smoke rises from the hookah tops; exhaled
// puffs drift away from each smoker's mouth.
export const HOOKAH_COUNT = 3;
export const HOOKAH_SPACING_PX = 170; // horizontal distance between hookahs
export const HOOKAH_SMOKERS_PER = 6; // smokers around each hookah
export const HOOKAH_SMOKER_RADIUS_PX = 46; // distance from hookah center to smoker
export const HOOKAH_AMBIENT_SMOKE_INTERVAL_MIN = 240; // ms between ambient hookah-top puffs
export const HOOKAH_AMBIENT_SMOKE_INTERVAL_RANGE = 260;
export const HOOKAH_AMBIENT_SMOKE_RISE_HEIGHT = 90; // px each ambient puff rises
export const HOOKAH_AMBIENT_SMOKE_DURATION_MIN = 1400;
export const HOOKAH_AMBIENT_SMOKE_DURATION_RANGE = 700;
export const HOOKAH_AMBIENT_SMOKE_OPACITY = 0.55;
export const HOOKAH_INHALE_DURATION_MS = 1200; // arm-to-mouth pose
export const HOOKAH_HOLD_DURATION_MS = 700; // pause before exhale
export const HOOKAH_EXHALE_DURATION_MS = 900; // exhale + puff drift
export const HOOKAH_CYCLE_GAP_MIN_MS = 1400; // idle ms between puff cycles
export const HOOKAH_CYCLE_GAP_RANGE_MS = 2600;
export const HOOKAH_EXHALE_PUFF_COUNT = 10; // puffs per exhale
export const HOOKAH_EXHALE_PUFF_DRIFT = 24; // px each exhale puff drifts
export const HOOKAH_EXHALE_PUFF_DURATION = 900; // ms

// --- RC cars set piece ---
// A ring of people holding controllers, each driving a tiny RC car around
// a flat arena in the middle. Panicked/dead drivers pause their car; cars
// resume when the driver returns to idle.
export const RC_CAR_DRIVER_COUNT = 10;
export const RC_CAR_ARENA_WIDTH_PX = 360;
export const RC_CAR_ARENA_HEIGHT_PX = 260;
export const RC_CAR_DRIVER_MARGIN_PX = 55; // distance drivers stand OUTSIDE the arena edge
export const RC_CAR_SPEED = 75; // px/s
export const RC_CAR_TURN_RATE = 4.5; // rad/s — how fast a car can rotate
export const RC_CAR_TARGET_ARRIVE_PX = 14; // how close to target before picking a new one
export const RC_CAR_SCALE = 0.8; // sprite scale multiplier (× SCALE)
export const RC_CAR_WHEEL_WOBBLE_HZ = 14; // wheel-bounce rate while driving
export const RC_CAR_WHEEL_WOBBLE_AMP = 0.6; // px vertical wobble while driving
// Driver excitement jumps (spaced out so 10 drivers aren't all jumping together)
export const RC_CAR_DRIVER_JUMP_INTERVAL_MIN = 4000; // ms between jumps per driver
export const RC_CAR_DRIVER_JUMP_INTERVAL_RANGE = 6000; // random extra ms
export const RC_CAR_DRIVER_JUMP_HEIGHT = 6; // px peak jump height
export const RC_CAR_DRIVER_JUMP_DURATION = 450; // ms full up-down jump
// Dust clouds behind moving RC cars
export const RC_CAR_DUST_INTERVAL = 120; // avg ms between dust-puff spawns behind each car
export const RC_CAR_DUST_DURATION = 900; // ms each dust puff lives
export const RC_CAR_DUST_OPACITY = 0.55; // starting alpha of each dust puff
export const RC_CAR_DUST_OPACITY_JITTER = 0.2; // random alpha added per puff
export const RC_CAR_DUST_SCALE = 0.25; // starting sprite scale (× SCALE)
export const RC_CAR_DUST_SCALE_GROW = 0.25; // extra scale the puff grows into while fading
export const RC_CAR_DUST_DRIFT = 4; // px drift away from the car over lifetime
export const RC_CAR_DUST_REAR_OFFSET = 5; // px behind car center where the puff spawns

// --- Paper planes set piece ---
// A group of people each throwing their own paper airplane, cheering
// while it flies, running to fetch it, then throwing again.
export const PAPER_PLANE_THROWER_COUNT = 10;
export const PAPER_PLANE_AREA_WIDTH_PX = 1400;
export const PAPER_PLANE_AREA_HEIGHT_PX = 1400;
export const PAPER_PLANE_MIN_SPACING = 40; // min spacing between throwers
export const PAPER_PLANE_FLY_DIST_MIN = 300; // px — plane travel distance before landing
export const PAPER_PLANE_FLY_DIST_RANGE = 800;
export const PAPER_PLANE_FLY_SPEED = 80; // px/s forward speed
export const PAPER_PLANE_ARC_HEIGHT = 28; // px parabolic arc peak
export const PAPER_PLANE_SIDE_DRIFT_MAX = 45; // random lateral offset at landing
export const PAPER_PLANE_WINDUP_DURATION = 0.35; // s arm-cocked-back
export const PAPER_PLANE_RELEASE_DURATION = 0.18; // s release pose before plane launches
export const PAPER_PLANE_PICKUP_DURATION = 0.35; // s bent-over pick pose
export const PAPER_PLANE_CHASE_SPEED = 55; // px/s running to fetch
export const PAPER_PLANE_CHEER_BOB_HZ = 2.6; // Hz vertical bob while plane flies
export const PAPER_PLANE_CHEER_BOB_AMP = 4; // px jump amplitude
export const PAPER_PLANE_CHEER_FRAME_INTERVAL = 220; // ms between wave1/wave2 toggles
export const PAPER_PLANE_CHASE_FRAME_INTERVAL = 180; // ms between run1/run2 toggles

// --- Farm compound extras (laundry / mice / chores) ---
// Fence vertical scaling — stretched so there's room for the extra activity.
export const FARM_COMPOUND_HEIGHT_FACTOR = 1.6; // multiplies the original fence Y offsets
// Laundry line: a person cycles between line and basket hanging/removing clothes
export const FARM_COMPOUND_LAUNDRY_ITEMS = 4; // clothes on the line
export const FARM_COMPOUND_LAUNDRY_WALK_SPEED = 28; // px/s
export const FARM_COMPOUND_LAUNDRY_GRAB_MS = 450; // pick pose duration
export const FARM_COMPOUND_LAUNDRY_PLACE_MS = 400; // place pose duration
// Mice — invulnerable critters that wander around the compound
export const FARM_COMPOUND_MICE_COUNT = 4;
export const FARM_COMPOUND_MOUSE_SPEED = 60; // px/s
export const FARM_COMPOUND_MOUSE_TURN_MIN_MS = 400; // ms between direction changes
export const FARM_COMPOUND_MOUSE_TURN_RANGE_MS = 700;
// Mouse chasers — people hunting the mice with sticks
export const FARM_COMPOUND_CHASER_COUNT = 3;
export const FARM_COMPOUND_CHASER_SPEED = 55; // px/s
export const FARM_COMPOUND_CHASER_SWING_RANGE = 22; // px — mouse must be inside this to get hit
export const FARM_COMPOUND_CHASER_SWING_INTERVAL = 650; // ms between swings when in range
export const FARM_COMPOUND_CHASER_SWING_POSE_MS = 180; // stick-swing frame duration
// Chores (hole digger + corral feeder)
export const FARM_COMPOUND_DIG_CYCLE_MS = 1400; // ms between dig poses
export const FARM_COMPOUND_DIG_POSE_MS = 500; // ms the dig pose is held
export const FARM_COMPOUND_FEED_INTERVAL_MS = 1600; // ms between food-toss actions
export const FARM_COMPOUND_FEED_POSE_MS = 300; // throw-pose duration
export const FARM_COMPOUND_FEED_PELLET_COUNT = 5; // pellets per toss
export const FARM_COMPOUND_FEED_PELLET_DURATION = 500; // ms

// --- Dirt biker no-go zones (in tiles — center x, center y, half-width, half-height) ---
// Set-piece instances publish their own bounds via `scene.setPieces[i].bounds`,
// which vehicleSystem merges at runtime. Anything added here is for no-go zones
// that are NOT set pieces (e.g. map-wide hazards).
export const BIKER_NO_GO_ZONES = [];

// --- Set-piece random placement (see setPieceRegistry.js) ---
// Minimum pixel distance every set piece's footprint stays from the map edge.
export const SET_PIECE_PLACE_MARGIN_PX = 150;
// Minimum pixel gap between any two set-piece footprints.
export const SET_PIECE_PLACE_GAP_PX = 80;
// Best-of-K random candidate sampling — larger values give a more uniform
// spread (feels over-regulated if too high); smaller values feel clumpier.
export const SET_PIECE_PLACE_BEST_OF_K = 5;
// Max random candidates tried per set piece before the placer gives up on
// the "respect the gap" pass and tries a tighter no-gap fallback.
export const SET_PIECE_PLACE_MAX_TRIES = 2000;

// --- Mini-map (top-right HUD heatmap) ---
// Live overview of target density. Renders a semi-transparent panel in the
// upper-right corner showing heat-blobs for people concentration, an
// airfield marker, and a rotating drone icon. Heatmap instead of per-person
// dots because the map contains ~400 people — individual dots at minimap
// scale would be an unreadable pixel soup.
//
// Sizes below are CSS pixels; minimapSystem.js multiplies by 1/MOBILE_ZOOM_FACTOR
// on mobile so the panel renders at the same physical size on every device.
export const MINIMAP_SIZE_PX = 180; // square panel edge length
export const MINIMAP_MARGIN_PX = 16; // distance from top + right edges
export const MINIMAP_BG_COLOR = 0x000000;
export const MINIMAP_BG_ALPHA = 0.55;
export const MINIMAP_BORDER_COLOR = 0xffffff;
export const MINIMAP_BORDER_ALPHA = 0.4;
export const MINIMAP_BORDER_THICKNESS_PX = 1;
// Heatmap grid resolution across the WHOLE world (per-axis cell count).
// Higher = finer detail but more rects to draw. 24×24 = 576 cells is fine.
export const MINIMAP_GRID_CELLS = 24;
export const MINIMAP_HEAT_COLOR = 0xff3344; // red for targets
export const MINIMAP_HEAT_MIN_ALPHA = 0.18; // alpha for a 1-person cell
export const MINIMAP_HEAT_MAX_ALPHA = 0.85; // alpha for the peak-density cell
// How often to recount people + redraw the heatmap. Lower = more responsive
// but more CPU each tick. 250ms is ~4 Hz which feels plenty snappy.
export const MINIMAP_UPDATE_INTERVAL_MS = 250;
// Airfield (static) marker — drawn as a plus sign.
export const MINIMAP_AIRFIELD_COLOR = 0x88ccff;
export const MINIMAP_AIRFIELD_SIZE_PX = 7;
// Drone (rotating) marker — drawn as a filled triangle pointing in the
// current heading.
export const MINIMAP_DRONE_COLOR = 0xffffff;
export const MINIMAP_DRONE_SIZE_PX = 7;

// --- Audio ---
// Master multiplier applied to every sound (music + sfx + engine + gun loop).
// Set 0 to mute the entire game.
export const MASTER_VOLUME = 0.7;

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
export const DEATH_SFX_STAGGER_MS = 100; // ms delay between staggered death sounds in a mass kill
export const DEATH_SFX_COOLDOWN = 3; // how many other death sounds must play before one can repeat

// --- Engine SFX (looping, pitch/volume shift with drone speed) ---
export const ENGINE_VOLUME_MIN = 0.04; // volume at minimum speed
export const ENGINE_VOLUME_RANGE = 0.07; // additional volume added at max speed (total max = MIN + RANGE)
export const ENGINE_RATE_MIN = 0.6; // playback rate (pitch) at minimum speed
export const ENGINE_RATE_RANGE = 0.8; // additional rate at max speed (total max = MIN + RANGE)
export const ENGINE_CROSSFADE_SEC = 0.5; // seconds of overlap when crossfading the engine loop

// --- Spatial audio (shared by explosion + death SFX) ---
export const SFX_MAX_DISTANCE = 2000; // distance in px at which spatial SFX reaches minimum volume
// export const SFX_MIN_VOLUME_FRAC = 0.40; // volume fraction at SFX_MAX_DISTANCE (0.05 = 5% of max)
export const SFX_MIN_VOLUME_FRAC = 1.0; // volume fraction at SFX_MAX_DISTANCE (0.05 = 5% of max)
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
export const DRONE_MIN_ALT_OFF_RUNWAY = 500; // floor altitude when not over runway (prevents crash)
export const DRONE_SHADOW_OPACITY = 0.75; // max shadow alpha at ground level (ramps down with altitude)

// --- Tire fire set piece ---
// A pile of burning tires with thick black smoke and a crowd gathered round
// warming hands / roasting marshmallows / drinking.
export const TIRE_FIRE_TIRE_COUNT = 4; // tire sprites stacked in the pile
export const TIRE_FIRE_PILE_SPREAD = 40; // px random offset per tire in the pile
export const TIRE_FIRE_CROWD_COUNT = 22; // people gathered round the fire
export const TIRE_FIRE_CROWD_RADIUS_MIN = 80; // min distance from fire center
export const TIRE_FIRE_CROWD_RADIUS_RANGE = 25; // random extra distance
export const TIRE_FIRE_SMOKE_INTERVAL_MIN = 90; // ms between smoke puffs
export const TIRE_FIRE_SMOKE_INTERVAL_RANGE = 90;
export const TIRE_FIRE_SMOKE_RISE_HEIGHT = 140; // px each puff rises before fading
export const TIRE_FIRE_SMOKE_DURATION_MIN = 1800; // ms
export const TIRE_FIRE_SMOKE_DURATION_RANGE = 900;
export const TIRE_FIRE_SMOKE_OPACITY = 0.85; // starting alpha of each smoke puff
export const TIRE_FIRE_DRINK_INTERVAL_MIN = 2.5; // seconds between drink-sip animations
export const TIRE_FIRE_DRINK_INTERVAL_RANGE = 3.0;
export const TIRE_FIRE_SWAY_HZ = 0.8; // Hz — warming-hands sway oscillation

// --- Victory cutscene ---
// Kills needed before landing at the runway triggers the win cutscene.
// Set to 1 during development; bump to `scene.totalPeople` for real play.
export const VICTORY_KILL_THRESHOLD = 1;
export const VICTORY_CROWD_COUNT = 10;
export const VICTORY_SURROUND_RADIUS = 80; // px — where guys stop around the drone
export const VICTORY_WALK_SPEED = 80; // px/s running out of the hangar
export const VICTORY_JUMP_HZ = 2.2; // cheer jump frequency per guy
export const VICTORY_JUMP_AMP = 7; // px vertical jump amplitude
export const VICTORY_FRAME_INTERVAL = 140; // ms between guy1/guy2 (or cheer1/cheer2) pose toggles
export const VICTORY_CELEBRATION_DURATION = 6000; // ms of cheering before modal
export const VICTORY_EMOJI_INTERVAL_MIN = 120; // ms between emoji spawns
export const VICTORY_EMOJI_INTERVAL_RANGE = 180;
export const VICTORY_EMOJI_RISE_DURATION = 1600; // ms
export const VICTORY_EMOJI_RISE_HEIGHT = 80; // px
export const VICTORY_EXIT_STAGGER_MS = 280; // ms delay between each guy leaving the hangar
export const VICTORY_EXIT_JITTER_MS = 120; // extra random ms per guy
export const VICTORY_DRONE_AVOID_RADIUS = 120; // guys steer around this radius instead of cutting through the drone

// --- Missile ---
export const MISSILE_SPEED = 280;
export const MISSILE_TURN_RATE = 5.0;
export const MISSILE_BOOST_TIME = 0.3;
export const MISSILE_MAX_SPEED = 400;
export const MISSILE_ACCEL = 240;
export const MISSILE_DESCENT_RATE = 600;
export const MISSILE_HIT_RADIUS = 15;
export const MISSILE_SMOKE_INTERVAL = 40;
export const MISSILE_SMOKE_OPACITY = 0.8; // starting alpha of each smoke puff
export const MISSILE_FIRE_RATE = 0.3; // seconds between missile launches

// --- Cannon firing SFX ---
export const CANNON_GUN_VOLUME = 0.35; // volume of the looping gun sound
export const CANNON_GUN_CROSSFADE_SEC = 0.05; // crossfade overlap between chained gun loops

// --- Cannon ---
export const CANNON_FIRE_RATE = 0.075; // seconds between shots (hold to auto-fire)
export const CANNON_BULLET_SPEED = 1000; // bullet travel speed (px/s)
export const CANNON_RANGE_FACTOR = 0.05; // impact distance = altitude * this factor
export const CANNON_SPREAD = 0.1; // random spread in radians
export const CANNON_KILL_RADIUS = 36; // explosion radius per bullet
export const CANNON_PANIC_RADIUS = 250; // radius within which people/animals panic from a cannon impact
export const CANNON_SHAKE_DURATION = 50; // screen shake per shot (ms)
export const CANNON_SHAKE_INTENSITY = 0.001; // screen shake intensity
export const CANNON_RETICLE_MIN_DISTANCE = 50; // min px the gun reticle is displayed ahead of the drone (prevents overlap at low altitude)
export const CANNON_IMPACT_VOLUME_FRAC = 0.15; // fraction of EXPLOSION_VOLUME for cannon impacts
// Muzzle smoke
export const CANNON_MUZZLE_NOSE_OFFSET = 40; // px ahead of drone center where puffs spawn
export const CANNON_MUZZLE_PUFFS = 2; // puffs emitted per shot
export const CANNON_MUZZLE_SPREAD = 8; // perpendicular spread of puffs (px)
export const CANNON_MUZZLE_DURATION_MIN = 350; // puff lifetime min (ms)
export const CANNON_MUZZLE_DURATION_RANGE = 150; // puff lifetime random range (ms)
export const CANNON_MUZZLE_SCALE_MIN = 0.45; // initial scale factor (× SCALE)
export const CANNON_MUZZLE_SCALE_RANGE = 0.2; // initial scale random range
export const CANNON_MUZZLE_SCALE_END_MIN = 1.0; // end scale factor (× SCALE)
export const CANNON_MUZZLE_SCALE_END_RANGE = 0.4; // end scale random range
export const CANNON_MUZZLE_ALPHA = 0.45; // initial alpha
export const CANNON_MUZZLE_ALPHA_RANGE = 0.2; // initial alpha random range
export const CANNON_MUZZLE_DRIFT_SPREAD = 10; // extra end-position scatter (px)

// --- Ghost dialog clustering ---
// When many people die in a small area their death-dialog bubbles overlap
// and become unreadable. These knobs cap how many ghost bubbles can appear
// within a rolling time window, per radius cluster. Additional deaths still
// happen and still spawn ghosts — they just skip the speech bubble.
export const GHOST_BUBBLE_CLUSTER_RADIUS = 140; // px — radius of a "cluster"
export const GHOST_BUBBLE_CLUSTER_MAX = 2; // max visible bubbles per cluster
export const GHOST_BUBBLE_CLUSTER_WINDOW_MS = 3000; // rolling time window

// --- People AI ---
export const PEOPLE_DETECT_RADIUS = 600;
export const PEOPLE_WANDER_SPEED = 30;
export const PEOPLE_PANIC_SPEED = 60;
export const PEOPLE_KILL_RADIUS = 65;
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
// Y-sorting: living people occupy a narrow depth band so they layer by screen Y
// without disturbing drone/explosion/HUD depths. Ghosts (depth 13) are skipped.
export const PEOPLE_DEPTH_BASE = 2.0;
export const PEOPLE_DEPTH_BAND = 0.99;

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
export const SOCCER_GOAL_SPECTATORS_PER_SIDE = 9; // spectators packed behind each goal (was 4)
export const SOCCER_SPECTATOR_JUMP_INTERVAL_MIN = 2200; // ms between jumps per spectator
export const SOCCER_SPECTATOR_JUMP_INTERVAL_RANGE = 4000; // random ms added on top
export const SOCCER_SPECTATOR_JUMP_HEIGHT = 6; // px peak jump height
export const SOCCER_SPECTATOR_JUMP_DURATION = 420; // ms for a full up-down jump

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
export const CLUSTER_DESCENT_RATE = 2500; // altitude feet/sec
export const CLUSTER_OPEN_FRAC = 0.5; // opens at 70% of descent (30% altitude remaining)
export const CLUSTER_BOMBLET_COUNT = 50; // bomblets released on opening (fixed)
export const CLUSTER_BOMBLET_SPREAD_FACTOR = 0.05; // scatter radius (px) per foot of altitude at opening
export const CLUSTER_FIRE_RATE = 2.5; // seconds between drops
export const CLUSTER_OPEN_SHAKE_DURATION = 120; // screen shake when casing opens (ms)
export const CLUSTER_OPEN_SHAKE_INTENSITY = 0.003; // screen shake intensity on open
export const CLUSTER_DROP_FACTOR = 0.25; // multiplier on physics drop distance (speed × fallTime); >1 = farther behind
export const CLUSTER_BOMBLET_FALL_TIME = 0.3; // seconds for bomblets to travel from opening point to ground

// --- Mobile Controls ---
// Mobile "zoom out" ratio. Applied as an internal-canvas-size multiplier in
// main.js (the canvas renders at viewport / MOBILE_ZOOM_FACTOR internal
// pixels, then CSS is scaled down to the real viewport). This gives a
// wider FOV on phones WITHOUT the nearest-neighbor texel flicker that a
// fractional camera.setZoom() produces in pixelArt mode. 1.0 = no zoom-out.
export const MOBILE_ZOOM_FACTOR = 0.7;
// Intro zoom: camera starts zoomed-in during the cutscene so off-screen
// texture pop-in is hidden and the hangar is framed next to the drone.
// Zoom is computed from viewport width so wide desktop screens get a
// bigger zoom-in than narrow phone portraits.
//   zoom = clamp(screenWidth/2 / INTRO_TARGET_RIGHT_PX, min, max)
// Where min is the normal gameplay zoom (no zoom-out during intro), and
// max prevents extreme zoom-in on huge monitors.
export const INTRO_TARGET_RIGHT_PX = 360; // world-px the camera should see to the right of the drone
export const INTRO_ZOOM_MAX = 2.6; // upper cap on the intro zoom
export const INTRO_ZOOM_OUT_DURATION_MS = 1500; // ms tween from intro zoom back to normal gameplay zoom
export const MOBILE_JOYSTICK_RADIUS = 65; // virtual joystick radius (px)
export const MOBILE_BUTTON_RADIUS = 42; // fire/alt button radius (px)
export const MOBILE_BUTTON_MARGIN = 18; // gap from screen edge and between buttons (px)
export const MOBILE_DIALOG_SCALE = 1.6; // speech bubble / dialog scale multiplier on mobile
