import type { FloorColor, InteractionPoint } from './pixel-types'

// Direction and FurnitureActivityType defined here (not in pixel-types) to avoid circular imports.
// pixel-types re-exports them from this file.
export const Direction = {
  DOWN: 0,
  LEFT: 1,
  RIGHT: 2,
  UP: 3,
} as const
export type Direction = (typeof Direction)[keyof typeof Direction]

export const FurnitureActivityType = {
  WATCHING_TV: 'watching_tv',
  READING: 'reading',
  LOUNGING: 'lounging',
  VENDING: 'vending',
  ARCADE: 'arcade',
  EXERCISING: 'exercising',
  PLAYING_POOL: 'playing_pool',
  PLAYING_PINGPONG: 'playing_pingpong',
} as const
export type FurnitureActivityType = (typeof FurnitureActivityType)[keyof typeof FurnitureActivityType]

// ── Grid & Layout ────────────────────────────────────────────
export const TILE_SIZE = 48
/** Character sprites are 32x32px pixel art. Scale 3× so each art pixel = 3×3 screen pixels. */
export const CHARACTER_SPRITE_SCALE = 3
export const DEFAULT_COLS = 30
export const DEFAULT_ROWS = 20
export const MAX_COLS = 64
export const MAX_ROWS = 64

// ── Character Animation ─────────────────────────────────────
export const WALK_SPEED_PX_PER_SEC = 144
export const WALK_FRAME_DURATION_SEC = 0.15
export const TYPE_FRAME_DURATION_SEC = 0.3

// ── Furniture Animation ─────────────────────────────────────
/** Default animation speed for furniture (seconds per frame).
 *  Furniture animations are slow and ambient — not distracting. */
export const FURNITURE_ANIM_FRAME_SEC = 0.8

// ── Wander / Rest Timing ────────────────────────────────────
export const WANDER_PAUSE_MIN_SEC = 2.0
export const WANDER_PAUSE_MAX_SEC = 20.0
export const WANDER_MOVES_BEFORE_REST_MIN = 3
export const WANDER_MOVES_BEFORE_REST_MAX = 6
export const SEAT_REST_MIN_SEC = 120.0
export const SEAT_REST_MAX_SEC = 240.0

// ── Personality Idle Animation ────────────────────────────────
export const PERSONALITY_IDLE_MIN_SEC = 8.0
export const PERSONALITY_IDLE_MAX_SEC = 15.0
export const PERSONALITY_FRAME_DURATION_SEC = 0.3
export const PERSONALITY_FRAME_COUNT = 4

// ── Matrix Effect ────────────────────────────────────────────
export const MATRIX_EFFECT_DURATION_SEC = 0.3
export const MATRIX_TRAIL_LENGTH = 6
export const MATRIX_SPRITE_COLS = 32
export const MATRIX_SPRITE_ROWS = 32
export const MATRIX_FLICKER_FPS = 30
export const MATRIX_FLICKER_VISIBILITY_THRESHOLD = 180
export const MATRIX_COLUMN_STAGGER_RANGE = 0.3
export const MATRIX_HEAD_COLOR = '#ccffcc'
export const MATRIX_TRAIL_OVERLAY_ALPHA = 0.6
export const MATRIX_TRAIL_EMPTY_ALPHA = 0.5
export const MATRIX_TRAIL_MID_THRESHOLD = 0.33
export const MATRIX_TRAIL_DIM_THRESHOLD = 0.66

// ── Rendering ────────────────────────────────────────────────
export const CHARACTER_SITTING_OFFSET_PX = 18
export const CHARACTER_Z_SORT_OFFSET = 0.5
export const OUTLINE_Z_SORT_OFFSET = 0.001
export const SELECTED_OUTLINE_ALPHA = 1.0
export const HOVERED_OUTLINE_ALPHA = 0.5
export const GHOST_PREVIEW_SPRITE_ALPHA = 0.5
export const GHOST_PREVIEW_TINT_ALPHA = 0.25
export const SELECTION_DASH_PATTERN: [number, number] = [4, 3]
export const BUTTON_MIN_RADIUS = 6
export const BUTTON_RADIUS_ZOOM_FACTOR = 3
export const BUTTON_ICON_SIZE_FACTOR = 0.45
export const BUTTON_LINE_WIDTH_MIN = 1.5
export const BUTTON_LINE_WIDTH_ZOOM_FACTOR = 0.5
export const BUBBLE_FADE_DURATION_SEC = 0.5
export const BUBBLE_SITTING_OFFSET_PX = 10
export const BUBBLE_VERTICAL_OFFSET_PX = 40
export const FALLBACK_FLOOR_COLOR = '#808080'

// ── Rendering - Overlay Colors (canvas, not CSS) ─────────────
export const SEAT_OWN_COLOR = 'rgba(0, 127, 212, 0.35)'
export const SEAT_AVAILABLE_COLOR = 'rgba(0, 200, 80, 0.35)'
export const SEAT_BUSY_COLOR = 'rgba(220, 50, 50, 0.35)'
export const GRID_LINE_COLOR = 'rgba(255,255,255,0.12)'
export const VOID_TILE_OUTLINE_COLOR = 'rgba(255,255,255,0.08)'
export const VOID_TILE_DASH_PATTERN: [number, number] = [2, 2]
export const GHOST_BORDER_HOVER_FILL = 'rgba(60, 130, 220, 0.25)'
export const GHOST_BORDER_HOVER_STROKE = 'rgba(60, 130, 220, 0.5)'
export const GHOST_BORDER_STROKE = 'rgba(255, 255, 255, 0.06)'
export const GHOST_VALID_TINT = '#00ff00'
export const GHOST_INVALID_TINT = '#ff0000'
export const SELECTION_HIGHLIGHT_COLOR = '#007fd4'
export const DELETE_BUTTON_BG = 'rgba(200, 50, 50, 0.85)'
export const ROTATE_BUTTON_BG = 'rgba(50, 120, 200, 0.85)'

// ── Camera ───────────────────────────────────────────────────
export const CAMERA_FOLLOW_LERP = 0.1
export const CAMERA_FOLLOW_SNAP_THRESHOLD = 0.5
/** Fraction of viewport each side that forms the deadzone border (center 40% is deadzone when 0.3) */
export const CAMERA_DEADZONE_FRACTION = 0.3

// ── Editor ───────────────────────────────────────────────────
export const UNDO_STACK_MAX_SIZE = 50
export const LAYOUT_SAVE_DEBOUNCE_MS = 500
export const DEFAULT_FLOOR_COLOR: FloorColor = { h: 35, s: 30, b: 15, c: 0 }
export const DEFAULT_WALL_COLOR: FloorColor = { h: 240, s: 25, b: 0, c: 0 }
export const DEFAULT_NEUTRAL_COLOR: FloorColor = { h: 0, s: 0, b: 0, c: 0 }

// ── Notification Sound ──────────────────────────────────────
export const NOTIFICATION_NOTE_1_HZ = 659.25   // E5
export const NOTIFICATION_NOTE_2_HZ = 1318.51  // E6 (octave up)
export const NOTIFICATION_NOTE_1_START_SEC = 0
export const NOTIFICATION_NOTE_2_START_SEC = 0.1
export const NOTIFICATION_NOTE_DURATION_SEC = 0.18
export const NOTIFICATION_VOLUME = 0.14

// ── Identity Plates & Status Indicators ─────────────────────
export const NAME_LABEL_VERTICAL_OFFSET_PX = 96
/** Extra offset when character is sitting (typing state) */
export const NAME_LABEL_SITTING_OFFSET_PX = 10
/** Identity plate horizontal padding in pre-zoom pixels */
export const IDENTITY_PLATE_PAD_X = 8
/** Identity plate vertical padding in pre-zoom pixels */
export const IDENTITY_PLATE_PAD_Y = 5
/** Identity plate background alpha */
export const IDENTITY_PLATE_BG_ALPHA = 0.75
/** Total plate height in pre-zoom px (font + padding) */
export const IDENTITY_PLATE_HEIGHT = 22
/** Corner radius for rounded-pill name plates (pre-zoom px) */
export const IDENTITY_PLATE_CORNER_RADIUS = 11
/** Radius of inline status dot in pre-zoom pixels */
export const STATUS_DOT_RADIUS = 4
/** Gap between name text and status dot in pre-zoom pixels */
export const STATUS_DOT_GAP = 5

/** Gap between identity plate top and status icon bottom (pre-zoom px) */
export const STATUS_ICON_GAP_PX = 2

// ── Agent Color Name → Hex ──────────────────────────────────
/** Maps color name strings from agent-registry.json to hex values */
export const COLOR_NAME_TO_HEX: Record<string, string> = {
  gold: '#FFD700',
  purple: '#8B5CF6',
  green: '#10B981',
  orange: '#F97316',
  pink: '#EC4899',
  teal: '#14B8A6',
  cyan: '#06B6D4',
  lime: '#84CC16',
  indigo: '#6366F1',
  rose: '#F43F5E',
}

// ── Game Logic ───────────────────────────────────────────────
export const MAX_DELTA_TIME_SEC = 0.1
export const WAITING_BUBBLE_DURATION_SEC = 2.0
export const DISMISS_BUBBLE_FAST_FADE_SEC = 0.3
export const INACTIVE_SEAT_TIMER_MIN_SEC = 30.0
export const INACTIVE_SEAT_TIMER_RANGE_SEC = 60.0
export const HUE_SHIFT_MIN_DEG = 45
export const HUE_SHIFT_RANGE_DEG = 271
export const AUTO_ON_FACING_DEPTH = 3
export const AUTO_ON_SIDE_DEPTH = 2
export const CHARACTER_HIT_HALF_WIDTH = 8
export const CHARACTER_HIT_HEIGHT = 24
/** Debounce delay (seconds) before applying a status change to prevent jitter from rapid updates */
export const STATUS_CHANGE_DEBOUNCE_SEC = 0.5
/** Minimum linger time (seconds) after task completion before routing to break room */
export const LINGER_MIN_SEC = 2.0
/** Maximum linger time (seconds) after task completion before routing to break room */
export const LINGER_MAX_SEC = 5.0

// ── Brainstorm Meeting ──────────────────────────────────────
/** Minimum active (non-despawning) subagents before parent triggers meeting room routing */
export const MEETING_SUBAGENT_THRESHOLD = 2

// ── CEO Visual Distinction ──────────────────────────────────
export const CEO_CROWN_COLOR = '#FFD700'
export const CEO_GLOW_ALPHA = 0.6

// ── Collision Feedback ──────────────────────────────────────
export const COLLISION_FLASH_DURATION_SEC = 0.3
export const COLLISION_FLASH_COLOR = 'rgba(255, 50, 50, 0.4)'

// ── Proximity Highlight ─────────────────────────────────────
export const PROXIMITY_RADIUS_TILES = 2
export const PROXIMITY_HIGHLIGHT_BASE_ALPHA = 0.15
export const PROXIMITY_HIGHLIGHT_PULSE_AMPLITUDE = 0.1
export const PROXIMITY_HIGHLIGHT_PULSE_SPEED = 3

// ── Activity Duration Ranges (seconds) ─────────────────────
export const ACTIVITY_DURATION_SHORT: [number, number] = [5, 15]
export const ACTIVITY_DURATION_MEDIUM: [number, number] = [20, 60]
export const ACTIVITY_DURATION_LONG: [number, number] = [30, 90]

// ── Interaction Points Registry ─────────────────────────────
// Hand-mapped use-tiles adjacent to furniture in the 30x20 office grid.
// Each entry is a walkable tile where an agent stands to interact with
// a nearby piece of furniture. Coordinates are 0-indexed (col, row).

export const INTERACTION_POINTS: InteractionPoint[] = [
  // --- CEO Office (ceo-office zone) ---
  {
    id: 'bookshelf-ceo-office',
    furnitureType: FurnitureActivityType.READING,
    tileX: 2,
    tileY: 4,
    facing: Direction.UP,
    capacity: 1,
    zoneId: 'ceo-office',
    activityDurationMin: ACTIVITY_DURATION_MEDIUM[0],
    activityDurationMax: ACTIVITY_DURATION_MEDIUM[1],
  },
  {
    id: 'lounge-ceo-office',
    furnitureType: FurnitureActivityType.LOUNGING,
    tileX: 4,
    tileY: 8,
    facing: Direction.DOWN,
    capacity: 1,
    zoneId: 'ceo-office',
    activityDurationMin: ACTIVITY_DURATION_LONG[0],
    activityDurationMax: ACTIVITY_DURATION_LONG[1],
  },

  // --- Conference Room (meeting zone, cols 23-29, rows 0-11) ---
  {
    id: 'whiteboard-meeting',
    furnitureType: FurnitureActivityType.READING,
    tileX: 26,
    tileY: 3,
    facing: Direction.UP,
    capacity: 1,
    zoneId: 'meeting',
    activityDurationMin: ACTIVITY_DURATION_MEDIUM[0],
    activityDurationMax: ACTIVITY_DURATION_MEDIUM[1],
  },

  // --- Workspace (workspace zone) ---
  {
    id: 'desk-lounge-workspace',
    furnitureType: FurnitureActivityType.LOUNGING,
    tileX: 18,
    tileY: 11,
    facing: Direction.RIGHT,
    capacity: 1,
    zoneId: 'workspace',
    activityDurationMin: ACTIVITY_DURATION_LONG[0],
    activityDurationMax: ACTIVITY_DURATION_LONG[1],
  },

  // --- Kitchen (bottom-left area) ---
  {
    id: 'kitchen-counter',
    furnitureType: FurnitureActivityType.VENDING,
    tileX: 3,
    tileY: 14,
    facing: Direction.UP,
    capacity: 1,
    zoneId: 'kitchen',
    activityDurationMin: ACTIVITY_DURATION_SHORT[0],
    activityDurationMax: ACTIVITY_DURATION_SHORT[1],
  },
  {
    id: 'kitchen-stove',
    furnitureType: FurnitureActivityType.VENDING,
    tileX: 3,
    tileY: 17,
    facing: Direction.UP,
    capacity: 1,
    zoneId: 'kitchen',
    activityDurationMin: ACTIVITY_DURATION_MEDIUM[0],
    activityDurationMax: ACTIVITY_DURATION_MEDIUM[1],
  },

  // --- Break Room (bottom open area) ---
  {
    id: 'break-room-lounge-1',
    furnitureType: FurnitureActivityType.LOUNGING,
    tileX: 14,
    tileY: 16,
    facing: Direction.DOWN,
    capacity: 1,
    zoneId: 'break-room',
    activityDurationMin: ACTIVITY_DURATION_LONG[0],
    activityDurationMax: ACTIVITY_DURATION_LONG[1],
  },
  {
    id: 'break-room-lounge-2',
    furnitureType: FurnitureActivityType.LOUNGING,
    tileX: 22,
    tileY: 17,
    facing: Direction.RIGHT,
    capacity: 1,
    zoneId: 'break-room',
    activityDurationMin: ACTIVITY_DURATION_LONG[0],
    activityDurationMax: ACTIVITY_DURATION_LONG[1],
  },
]

// ── Interaction Point Helpers ───────────────────────────────

/**
 * Filter interaction points that belong to a specific room zone.
 */
export function getInteractionPointsForZone(zoneId: string): InteractionPoint[] {
  return INTERACTION_POINTS.filter((p) => p.zoneId === zoneId)
}

/** Occupancy info for a single interaction point */
export interface OccupancyInfo {
  count: number
  agentIds: number[]
}

/**
 * Find an available (unoccupied or partially occupied) interaction point.
 * A capacity-1 point is available only when unoccupied.
 * A capacity-2 point is available when count < 2.
 * Returns the point and whether the agent would be the secondary (joining) user.
 *
 * @param occupiedPoints - Map of interaction point ID to occupancy info
 * @param zoneId - Optional zone filter; when provided, only points in that zone are considered
 */
export function getAvailableInteractionPoint(
  occupiedPoints: Map<string, OccupancyInfo>,
  zoneId?: string,
): { point: InteractionPoint; isSecondary: boolean } | null {
  const candidates: Array<{ point: InteractionPoint; isSecondary: boolean }> = []

  for (const p of INTERACTION_POINTS) {
    if (zoneId && p.zoneId !== zoneId) continue
    const occ = occupiedPoints.get(p.id)
    if (!occ) {
      // Unoccupied — available as primary
      candidates.push({ point: p, isSecondary: false })
    } else if (p.capacity === 2 && occ.count < 2) {
      // Partially occupied capacity-2 — available as secondary
      candidates.push({ point: p, isSecondary: true })
    }
  }

  if (candidates.length === 0) return null
  return candidates[Math.floor(Math.random() * candidates.length)]
}
