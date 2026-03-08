/**
 * Compose MetroCity character sprites into per-agent PNGs.
 *
 * Reads the MetroCity asset pack (Character Model, Hairs, Outfits)
 * and composites them into final character sprites for each agent.
 *
 * Source assets (in public/assets/metrocity/):
 *   Character Model.png — 768x192 = 24 cols x 6 rows @ 32x32
 *     6 rows = 2 skin tones (rows 0-2 = tone A, rows 3-5 = tone B) x 3 body variants
 *   Hairs.png — 768x256 = 24 cols x 8 rows @ 32x32, 8 hair styles
 *   Outfit1-6.png — 768x32 each = 24 cols x 1 row @ 32x32, 6 outfits
 *
 * Output: char_0..12.png at 112x96 (7 frames x 16px wide, 3 rows x 32px tall)
 *   Row 0 = down, Row 1 = up, Row 2 = right
 *   Frame order: walk1, walk2, walk3, type1, type2, read1, read2
 *
 * Usage:
 *   npx tsx scripts/compose-metrocity.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import { PNG } from 'pngjs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ── Paths ──

const ASSET_DIR = path.join(__dirname, '..', 'public', 'assets', 'metrocity')
const OUT_DIR = path.join(__dirname, '..', 'public', 'assets', 'characters')

// ── Output dimensions ──
// 7 frames x 16px = 112px wide, 3 direction rows x 32px = 96px tall
const FRAME_COUNT = 7
const FRAME_W = 16
const FRAME_H = 32
const OUT_W = FRAME_COUNT * FRAME_W  // 112
const OUT_H = 3 * FRAME_H            // 96

// ── Source tile dimensions ──
const SRC_TILE = 32  // each MetroCity tile is 32x32

// ── Agent combination table ──
// Each agent gets a unique combo of body row, hair style, and outfit.
// bodyRow: 0-5 (rows 0-2 = skin tone A, rows 3-5 = skin tone B)
// hairRow: 0-7 (8 hair styles in Hairs.png)
// outfitIndex: 1-6 (Outfit1.png through Outfit6.png)

interface AgentCombo {
  name: string
  bodyRow: number     // 0-5
  hairRow: number     // 0-7
  outfitIndex: number // 1-6
}

const AGENT_COMBOS: AgentCombo[] = [
  { name: 'CEO',    bodyRow: 0, hairRow: 0, outfitIndex: 5 },  //  0: tone A, short hair, formal suit
  { name: 'Sarah',  bodyRow: 3, hairRow: 3, outfitIndex: 2 },  //  1: tone B, long wavy, casual top
  { name: 'Morgan', bodyRow: 4, hairRow: 1, outfitIndex: 4 },  //  2: tone B, cropped, business
  { name: 'Marcus', bodyRow: 1, hairRow: 5, outfitIndex: 1 },  //  3: tone A, mohawk, tee
  { name: 'Priya',  bodyRow: 5, hairRow: 7, outfitIndex: 3 },  //  4: tone B, bun, blouse
  { name: 'Riley',  bodyRow: 2, hairRow: 4, outfitIndex: 6 },  //  5: tone A, side part, hoodie
  { name: 'Jordan', bodyRow: 3, hairRow: 6, outfitIndex: 1 },  //  6: tone B, curly, tee
  { name: 'Casey',  bodyRow: 0, hairRow: 2, outfitIndex: 3 },  //  7: tone A, bob, blouse
  { name: 'Taylor', bodyRow: 4, hairRow: 0, outfitIndex: 6 },  //  8: tone B, short, hoodie
  { name: 'Sam',    bodyRow: 1, hairRow: 7, outfitIndex: 4 },  //  9: tone A, bun, business
  { name: 'Quinn',  bodyRow: 5, hairRow: 2, outfitIndex: 5 },  // 10: tone B, bob, formal
  { name: 'Devon',  bodyRow: 2, hairRow: 5, outfitIndex: 2 },  // 11: tone A, mohawk, casual
  { name: 'Spare',  bodyRow: 3, hairRow: 4, outfitIndex: 4 },  // 12: tone B, side part, business
]

// ── MetroCity layout ──
// Verified by pixel analysis of Character Model.png:
//   24 columns = 4 direction groups x 6 frames per direction
//   Column mapping: Down(0-5), Left(6-11), Up(12-17), Right(18-23)
//
// Each 6-frame direction cycle:
//   Frame 0: idle standing
//   Frame 1: step A (left foot forward)
//   Frame 2: stride A (left foot extended)
//   Frame 3: idle standing (identical to frame 0)
//   Frame 4: step B (right foot forward)
//   Frame 5: stride B (right foot extended)

/** Column offset for the first frame of each MetroCity direction group. */
const DIR_COL_OFFSET = {
  down:  0,   // cols 0-5
  left:  6,   // cols 6-11
  up:    12,  // cols 12-17
  right: 18,  // cols 18-23
} as const

/**
 * Mapping from our 7-frame output format to MetroCity source frame indices.
 * Output: walk1(0), walk2(1), walk3(2), type1(3), type2(4), read1(5), read2(6)
 *
 * Walk uses frames 1, 0, 4 — step-A, idle, step-B — so the ping-pong cycle
 * (0,1,2,1) becomes step-A → idle → step-B → idle, a natural walk.
 * Type and read reuse idle variants (no dedicated poses in MetroCity).
 */
const FRAME_MAP: number[] = [
  1,  // walk1: step A
  0,  // walk2: idle (neutral)
  4,  // walk3: step B
  0,  // type1: idle
  0,  // type2: idle (same — task 3 may add arm overlay)
  0,  // read1: idle
  0,  // read2: idle (same — task 3 may add arm overlay)
]

/**
 * Output row order: which MetroCity direction maps to each output row.
 * Row 0 = down, Row 1 = up, Row 2 = right (matches asset-loader.ts expectations).
 */
const OUTPUT_ROW_DIRS: Array<keyof typeof DIR_COL_OFFSET> = ['down', 'up', 'right']

// ── Helpers ──

function loadPng(filename: string): PNG {
  const filePath = path.join(ASSET_DIR, filename)
  if (!fs.existsSync(filePath)) {
    console.error(`Missing asset: ${filePath}`)
    process.exit(1)
  }
  return PNG.sync.read(fs.readFileSync(filePath))
}

/**
 * Extract a single 32x32 tile from a source PNG sheet.
 * Returns a flat RGBA buffer (32*32*4 bytes).
 */
function extractTile(sheet: PNG, col: number, row: number): Buffer {
  const buf = Buffer.alloc(SRC_TILE * SRC_TILE * 4)
  const sx = col * SRC_TILE
  const sy = row * SRC_TILE
  for (let y = 0; y < SRC_TILE; y++) {
    for (let x = 0; x < SRC_TILE; x++) {
      const srcIdx = ((sy + y) * sheet.width + (sx + x)) * 4
      const dstIdx = (y * SRC_TILE + x) * 4
      buf[dstIdx]     = sheet.data[srcIdx]
      buf[dstIdx + 1] = sheet.data[srcIdx + 1]
      buf[dstIdx + 2] = sheet.data[srcIdx + 2]
      buf[dstIdx + 3] = sheet.data[srcIdx + 3]
    }
  }
  return buf
}

/**
 * Downscale a 32x32 tile to 16x32 by averaging every 2 horizontal pixels.
 * Vertical resolution is preserved. Returns a flat RGBA buffer (16*32*4 bytes).
 */
function downscaleHorizontal(tile: Buffer): Buffer {
  const outW = SRC_TILE / 2  // 16
  const outH = SRC_TILE       // 32
  const buf = Buffer.alloc(outW * outH * 4)

  for (let y = 0; y < outH; y++) {
    for (let x = 0; x < outW; x++) {
      // Average two source pixels: (2*x, y) and (2*x+1, y)
      const srcIdxA = (y * SRC_TILE + 2 * x) * 4
      const srcIdxB = (y * SRC_TILE + 2 * x + 1) * 4
      const dstIdx = (y * outW + x) * 4

      const aA = tile[srcIdxA + 3]
      const aB = tile[srcIdxB + 3]

      if (aA === 0 && aB === 0) {
        // Both transparent
        buf[dstIdx] = 0
        buf[dstIdx + 1] = 0
        buf[dstIdx + 2] = 0
        buf[dstIdx + 3] = 0
      } else if (aA === 0) {
        // Only B is opaque — use B directly
        buf[dstIdx]     = tile[srcIdxB]
        buf[dstIdx + 1] = tile[srcIdxB + 1]
        buf[dstIdx + 2] = tile[srcIdxB + 2]
        buf[dstIdx + 3] = tile[srcIdxB + 3]
      } else if (aB === 0) {
        // Only A is opaque — use A directly
        buf[dstIdx]     = tile[srcIdxA]
        buf[dstIdx + 1] = tile[srcIdxA + 1]
        buf[dstIdx + 2] = tile[srcIdxA + 2]
        buf[dstIdx + 3] = tile[srcIdxA + 3]
      } else {
        // Both opaque — average RGB, max alpha
        buf[dstIdx]     = (tile[srcIdxA]     + tile[srcIdxB])     >> 1
        buf[dstIdx + 1] = (tile[srcIdxA + 1] + tile[srcIdxB + 1]) >> 1
        buf[dstIdx + 2] = (tile[srcIdxA + 2] + tile[srcIdxB + 2]) >> 1
        buf[dstIdx + 3] = Math.max(aA, aB)
      }
    }
  }
  return buf
}

/**
 * Blit a 16x32 downscaled frame into the output PNG at the given frame/row position.
 */
function blitFrame(out: PNG, frame: Buffer, frameIdx: number, rowIdx: number): void {
  const dstX = frameIdx * FRAME_W
  const dstY = rowIdx * FRAME_H
  for (let y = 0; y < FRAME_H; y++) {
    for (let x = 0; x < FRAME_W; x++) {
      const srcIdx = (y * FRAME_W + x) * 4
      const dstIdx = ((dstY + y) * OUT_W + (dstX + x)) * 4
      out.data[dstIdx]     = frame[srcIdx]
      out.data[dstIdx + 1] = frame[srcIdx + 1]
      out.data[dstIdx + 2] = frame[srcIdx + 2]
      out.data[dstIdx + 3] = frame[srcIdx + 3]
    }
  }
}

/**
 * Alpha-composite overlay tile onto base tile in place.
 * Both tiles are 32x32 RGBA buffers (32*32*4 = 4096 bytes).
 * Standard alpha blending: result = overlay * overlayAlpha + base * (1 - overlayAlpha)
 */
function alphaBlit(base: Buffer, overlay: Buffer): void {
  const pixelCount = SRC_TILE * SRC_TILE
  for (let i = 0; i < pixelCount; i++) {
    const idx = i * 4
    const oA = overlay[idx + 3] / 255  // overlay alpha normalized to 0-1
    if (oA === 0) continue              // fully transparent overlay — skip

    const bA = base[idx + 3] / 255      // base alpha normalized to 0-1

    if (oA >= 1) {
      // Fully opaque overlay — just copy
      base[idx]     = overlay[idx]
      base[idx + 1] = overlay[idx + 1]
      base[idx + 2] = overlay[idx + 2]
      base[idx + 3] = 255
    } else {
      // Partial alpha — blend
      const outA = oA + bA * (1 - oA)
      if (outA > 0) {
        base[idx]     = Math.round((overlay[idx]     * oA + base[idx]     * bA * (1 - oA)) / outA)
        base[idx + 1] = Math.round((overlay[idx + 1] * oA + base[idx + 1] * bA * (1 - oA)) / outA)
        base[idx + 2] = Math.round((overlay[idx + 2] * oA + base[idx + 2] * bA * (1 - oA)) / outA)
        base[idx + 3] = Math.round(outA * 255)
      }
    }
  }
}

// ── Main ──

fs.mkdirSync(OUT_DIR, { recursive: true })

// Load source assets
console.log('Loading MetroCity assets...')
const bodySheet = loadPng('Character Model.png')
const hairSheet = loadPng('Hairs.png')
const outfitSheets: PNG[] = []
for (let i = 1; i <= 6; i++) {
  outfitSheets.push(loadPng(`Outfit${i}.png`))
}
console.log(`  Body:    ${bodySheet.width}x${bodySheet.height}`)
console.log(`  Hair:    ${hairSheet.width}x${hairSheet.height}`)
console.log(`  Outfits: ${outfitSheets.length} loaded (${outfitSheets[0].width}x${outfitSheets[0].height} each)`)

// Validate combo uniqueness
const comboKeys = AGENT_COMBOS.map(c => `${c.bodyRow}-${c.hairRow}-${c.outfitIndex}`)
const uniqueKeys = new Set(comboKeys)
if (uniqueKeys.size !== AGENT_COMBOS.length) {
  console.error('ERROR: Duplicate agent combos detected!')
  process.exit(1)
}

// Generate character PNGs — full body + outfit + hair compositing
console.log(`\nGenerating ${AGENT_COMBOS.length} character PNGs (${OUT_W}x${OUT_H}) with body+outfit+hair compositing...`)

for (let i = 0; i < AGENT_COMBOS.length; i++) {
  const combo = AGENT_COMBOS[i]
  const png = new PNG({ width: OUT_W, height: OUT_H, filterType: -1 })
  const outfitSheet = outfitSheets[combo.outfitIndex - 1]  // outfitIndex is 1-based

  // For each output row (down, up, right)
  for (let rowIdx = 0; rowIdx < OUTPUT_ROW_DIRS.length; rowIdx++) {
    const dir = OUTPUT_ROW_DIRS[rowIdx]
    const dirColBase = DIR_COL_OFFSET[dir]

    // For each of the 7 output frames
    for (let frameIdx = 0; frameIdx < FRAME_COUNT; frameIdx++) {
      const srcFrame = FRAME_MAP[frameIdx]
      const srcCol = dirColBase + srcFrame

      // 1. Extract 32x32 body tile (base layer)
      const tile = extractTile(bodySheet, srcCol, combo.bodyRow)

      // 2. Alpha-composite outfit on top of body (outfit PNGs have 1 row only)
      const outfitTile = extractTile(outfitSheet, srcCol, 0)
      alphaBlit(tile, outfitTile)

      // 3. Alpha-composite hair on top of everything
      const hairTile = extractTile(hairSheet, srcCol, combo.hairRow)
      alphaBlit(tile, hairTile)

      // 4. Downscale composited 32x32 to 16x32 and blit to output
      const scaled = downscaleHorizontal(tile)
      blitFrame(png, scaled, frameIdx, rowIdx)
    }
  }

  const buffer = PNG.sync.write(png)
  const outPath = path.join(OUT_DIR, `char_${i}.png`)
  fs.writeFileSync(outPath, buffer)
  console.log(
    `  char_${i}.png  ${combo.name.padEnd(7)} ` +
    `body=${combo.bodyRow} hair=${combo.hairRow} outfit=${combo.outfitIndex}  ` +
    `${OUT_W}x${OUT_H}  (${buffer.length} bytes)`
  )
}

console.log(`\nDone. ${AGENT_COMBOS.length} character PNGs written to ${OUT_DIR}`)
console.log('Full body+outfit+hair compositing complete.')
