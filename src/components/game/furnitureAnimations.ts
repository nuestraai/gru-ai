// ---------------------------------------------------------------------------
// Furniture Animation Registry
// Maps base GIDs from the Tiled layout to animation frame sequences.
// Limezu animated objects use adjacent tiles in the same tileset row.
// ---------------------------------------------------------------------------

import { FURNITURE_ANIM_FRAME_SEC } from './constants'

/**
 * Definition for a single animated tile group.
 * An animated piece of furniture may span multiple tiles (e.g. 2x2).
 * Each individual tile that is part of the animation has an entry mapping
 * its base GID to the sequence of GIDs it cycles through.
 */
interface AnimatedTileEntry {
  /** Ordered GIDs to cycle through (includes the base GID as frame 0) */
  frames: number[]
  /** Seconds per frame (overrides FURNITURE_ANIM_FRAME_SEC when set) */
  frameDuration: number
}

// ---------------------------------------------------------------------------
// Animation Registry
// ---------------------------------------------------------------------------
// Each key is a base GID that appears in office-layout.ts.
// The value lists every frame GID for that tile position.
//
// How frames were identified:
//   Interiors.png is 16 columns wide, firstgid=1073.
//   localId = gid - 1073; col = localId % 16; row = floor(localId / 16).
//   Adjacent tiles in the same row that depict the same object with
//   subtle differences (LED position, item arrangement) are frames.
// ---------------------------------------------------------------------------

export const ANIMATED_TILES: ReadonlyMap<number, AnimatedTileEntry> = new Map([

  // ── Wall-mounted TV Monitor (2 wide x 2 tall) ──────────────────────────
  // Interiors.png rows 606-607. Standby LED shifts position between frames.
  // Frame 1: cols 11-12, Frame 2: cols 13-14
  // Used in FURNITURE layer at grid position (27,10)-(28,11).
  //
  // Top-left tile
  [10780, { frames: [10780, 10782], frameDuration: FURNITURE_ANIM_FRAME_SEC }],
  // Top-right tile
  [10781, { frames: [10781, 10783], frameDuration: FURNITURE_ANIM_FRAME_SEC }],
  // Bottom-left tile
  [10796, { frames: [10796, 10798], frameDuration: FURNITURE_ANIM_FRAME_SEC }],
  // Bottom-right tile
  [10797, { frames: [10797, 10799], frameDuration: FURNITURE_ANIM_FRAME_SEC }],

  // NOTE: GIDs 6499-6500/6515-6516 (Interiors row 339-340, cols 2-3) were previously
  // registered as "Office Equipment / Printer" with adjacent tiles as animation frames.
  // Visual inspection revealed these are a classroom chalkboard; the adjacent tiles
  // (cols 4-5, 6-7) are an alphabet rug and bulletin board — different objects,
  // not animation frames. Registration removed.

  // ── Lab Equipment Desk (2 wide x 2 tall) ───────────────────────────────
  // Interiors.png rows 1032-1033. Equipment on desk cycles through 3 states.
  // Frame 1: cols 3-4 (test tube stands), Frame 2: cols 5-6 (blue flasks),
  // Frame 3: cols 7-8 (empty desk — cleared off)
  // Used in FURNITURE layer at grid position (11,29)-(12,30).
  //
  // Top-left tile
  [17588, { frames: [17588, 17590, 17592], frameDuration: FURNITURE_ANIM_FRAME_SEC }],
  // Top-right tile
  [17589, { frames: [17589, 17591, 17593], frameDuration: FURNITURE_ANIM_FRAME_SEC }],
  // Bottom-left tile
  [17604, { frames: [17604, 17606, 17608], frameDuration: FURNITURE_ANIM_FRAME_SEC }],
  // Bottom-right tile
  [17605, { frames: [17605, 17607, 17609], frameDuration: FURNITURE_ANIM_FRAME_SEC }],
])

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Collect all GIDs that appear as animation frames (for tileset pre-extraction).
 * This includes every GID in every frame sequence, not just the base GIDs.
 */
export function collectAnimationFrameGids(): Set<number> {
  const gids = new Set<number>()
  for (const entry of ANIMATED_TILES.values()) {
    for (const gid of entry.frames) {
      gids.add(gid)
    }
  }
  return gids
}

/**
 * Given a base GID and the current time in seconds, return the GID
 * that should be rendered for this frame.
 *
 * - If the GID is not in the animation registry, returns it unchanged
 *   (passthrough for static tiles).
 * - If the GID is animated, computes the current frame index from time
 *   using the same `Math.floor(time / duration) % frameCount` pattern
 *   used by character and status-icon animations.
 */
export function getAnimatedGid(baseGid: number, timeSec: number): number {
  const entry = ANIMATED_TILES.get(baseGid)
  if (!entry) return baseGid

  const frameCount = entry.frames.length
  if (frameCount <= 1) return baseGid

  const frameIndex = Math.floor(timeSec / entry.frameDuration) % frameCount
  return entry.frames[frameIndex]
}
