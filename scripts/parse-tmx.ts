#!/usr/bin/env npx tsx
// ---------------------------------------------------------------------------
// parse-tmx.ts — Build-time TMX parser for gruai.tmx
// Reads the Tiled TMX file and generates a TypeScript module with:
//   - FLOOR, FURNITURE_BASE, FURNITURE_TOP, DECO arrays (CSV tile layers)
//   - SEAT_POSITIONS array (from objectgroup "seats")
//   - ZONE_BOUNDS record (from objectgroup "zones")
//   - TILESET_REGISTRY array (firstgid + filename from TSX references)
//   - WALL_GIDS set (border/edge GIDs from the floor layer)
//
// Usage: npx tsx scripts/parse-tmx.ts
// ---------------------------------------------------------------------------

import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'

const TMX_PATH = resolve(process.cwd(), 'public/assets/office/gruai.tmx')
const OUT_PATH = resolve(process.cwd(), 'src/components/game/generated/office-tmx-data.ts')

// ---------------------------------------------------------------------------
// Minimal XML helpers (no deps — just regex parsing for TMX subset)
// ---------------------------------------------------------------------------

interface XmlTag {
  name: string
  attrs: Record<string, string>
  children: XmlTag[]
  text: string
}

function parseAttrs(attrStr: string): Record<string, string> {
  const attrs: Record<string, string> = {}
  const re = /(\w+)="([^"]*)"/g
  let m: RegExpExecArray | null
  while ((m = re.exec(attrStr)) !== null) {
    attrs[m[1]] = m[2]
  }
  return attrs
}

/**
 * Dead-simple XML parser sufficient for TMX files.
 * Handles self-closing tags, nested tags, and text content (CSV data).
 */
function parseTmx(xml: string): XmlTag {
  const root: XmlTag = { name: 'root', attrs: {}, children: [], text: '' }
  const stack: XmlTag[] = [root]

  // Match opening tags, self-closing tags, closing tags, and text
  const re = /<(\/?)([\w:-]+)((?:\s+\w+="[^"]*")*)\s*(\/?)>|([^<]+)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(xml)) !== null) {
    const [, closing, tagName, attrStr, selfClose, textContent] = m
    if (textContent !== undefined) {
      // Text node
      const trimmed = textContent.trim()
      if (trimmed && stack.length > 0) {
        stack[stack.length - 1].text += trimmed
      }
      continue
    }
    if (closing === '/') {
      // Closing tag
      stack.pop()
    } else if (selfClose === '/') {
      // Self-closing tag
      const tag: XmlTag = { name: tagName, attrs: parseAttrs(attrStr || ''), children: [], text: '' }
      stack[stack.length - 1].children.push(tag)
    } else {
      // Opening tag
      const tag: XmlTag = { name: tagName, attrs: parseAttrs(attrStr || ''), children: [], text: '' }
      stack[stack.length - 1].children.push(tag)
      stack.push(tag)
    }
  }
  return root
}

function findAll(node: XmlTag, name: string): XmlTag[] {
  const results: XmlTag[] = []
  if (node.name === name) results.push(node)
  for (const child of node.children) {
    results.push(...findAll(child, name))
  }
  return results
}

function findOne(node: XmlTag, name: string): XmlTag | undefined {
  if (node.name === name) return node
  for (const child of node.children) {
    const found = findOne(child, name)
    if (found) return found
  }
  return undefined
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const tmxContent = readFileSync(TMX_PATH, 'utf-8')
const doc = parseTmx(tmxContent)
const map = findOne(doc, 'map')!
const width = parseInt(map.attrs.width, 10)
const height = parseInt(map.attrs.height, 10)
const tileSize = parseInt(map.attrs.tilewidth, 10)

console.log(`Parsing TMX: ${width}x${height} grid, ${tileSize}px tiles`)

// ---------------------------------------------------------------------------
// 1. Tileset registry
// ---------------------------------------------------------------------------

interface TilesetEntry {
  firstgid: number
  filename: string
}

const tilesetRegistry: TilesetEntry[] = []
for (const ts of findAll(doc, 'tileset')) {
  const firstgid = parseInt(ts.attrs.firstgid, 10)
  const source = ts.attrs.source
  if (source) {
    // External TSX reference — extract PNG filename from the .tsx name
    const filename = source.replace('.tsx', '.png')
    tilesetRegistry.push({ firstgid, filename })
  }
  // Skip inline tilesets (animated bathroom etc.) — not needed for static rendering
}

tilesetRegistry.sort((a, b) => a.firstgid - b.firstgid)
console.log(`Found ${tilesetRegistry.length} tilesets`)

// ---------------------------------------------------------------------------
// 2. Tile layers (CSV data)
// ---------------------------------------------------------------------------

const LAYER_NAMES = ['floor', 'furniture_base', 'furniture_top', 'deco'] as const
const layerArrays: Record<string, number[]> = {}

for (const layer of findAll(doc, 'layer')) {
  const name = layer.attrs.name
  if (!(LAYER_NAMES as readonly string[]).includes(name)) continue

  const dataNode = findOne(layer, 'data')
  if (!dataNode) continue

  const csv = dataNode.text
  const gids = csv.split(',').map((s) => parseInt(s.trim(), 10))
  layerArrays[name] = gids
  console.log(`  Layer "${name}": ${gids.length} tiles`)
}

// Verify each layer has exactly width * height elements
const expectedCount = width * height
for (const name of LAYER_NAMES) {
  const arr = layerArrays[name]
  if (!arr) {
    console.error(`Missing layer: ${name}`)
    process.exit(1)
  }
  if (arr.length !== expectedCount) {
    console.error(`Layer "${name}" has ${arr.length} tiles, expected ${expectedCount}`)
    process.exit(1)
  }
}

// ---------------------------------------------------------------------------
// 3. Seat positions (objectgroup "seats")
// ---------------------------------------------------------------------------

interface SeatData {
  name: string
  col: number
  row: number
  dir: string
}

const seats: SeatData[] = []

for (const og of findAll(doc, 'objectgroup')) {
  if (og.attrs.name !== 'seats') continue
  for (const obj of findAll(og, 'object')) {
    const x = parseFloat(obj.attrs.x)
    const y = parseFloat(obj.attrs.y)
    const col = Math.floor(x / tileSize)
    const row = Math.floor(y / tileSize)

    // Properties
    let name = ''
    let dir = 'down'
    for (const prop of findAll(obj, 'property')) {
      if (prop.attrs.name === 'name') name = prop.attrs.value
      if (prop.attrs.name === 'dir') dir = prop.attrs.value
    }
    if (name) {
      seats.push({ name, col, row, dir })
    }
  }
}

// Sort seats by numeric name
seats.sort((a, b) => parseInt(a.name, 10) - parseInt(b.name, 10))
console.log(`Found ${seats.length} seat positions`)

// ---------------------------------------------------------------------------
// 4. Zone bounds (objectgroup "zones")
// ---------------------------------------------------------------------------

interface ZoneData {
  name: string
  minCol: number
  maxCol: number
  minRow: number
  maxRow: number
}

const zones: ZoneData[] = []

for (const og of findAll(doc, 'objectgroup')) {
  if (og.attrs.name !== 'zones') continue
  for (const obj of findAll(og, 'object')) {
    const x = parseFloat(obj.attrs.x)
    const y = parseFloat(obj.attrs.y)
    const w = parseFloat(obj.attrs.width)
    const h = parseFloat(obj.attrs.height)

    const minCol = Math.floor(x / tileSize)
    const minRow = Math.floor(y / tileSize)
    const maxCol = Math.floor((x + w) / tileSize) - 1
    const maxRow = Math.floor((y + h) / tileSize) - 1

    let name = ''
    for (const prop of findAll(obj, 'property')) {
      if (prop.attrs.name === 'name') name = prop.attrs.value
    }
    if (name) {
      zones.push({ name, minCol, maxCol, minRow, maxRow })
    }
  }
}

console.log(`Found ${zones.length} zones`)

// ---------------------------------------------------------------------------
// 5. Wall GIDs — non-repeating edge tiles from the floor layer
// ---------------------------------------------------------------------------
// Strategy: tiles that appear fewer times are likely borders/edges.
// The most common GIDs in a floor layer are the repeating interior tiles.
// We classify GIDs that appear in the floor but are NOT the most common
// interior-repeat GIDs as wall/border GIDs.

const floorGids = layerArrays.floor
const gidCounts = new Map<number, number>()
for (const gid of floorGids) {
  if (gid === 0) continue
  gidCounts.set(gid, (gidCounts.get(gid) ?? 0) + 1)
}

// Interior floor GIDs are those that appear many times (>21 occurrences = repeating pattern)
// Wall/border/divider GIDs appear fewer times — includes room dividers (≤10),
// top walls (≤20), and wall trim (≤20). Verified gap: floor GIDs start at 22+.
const INTERIOR_THRESHOLD = 21
const wallGids = new Set<number>()
for (const [gid, count] of gidCounts) {
  if (count < INTERIOR_THRESHOLD) {
    wallGids.add(gid)
  }
}

// Also add GIDs that are in the Room_Builder tileset range typical of walls
// These are walls/separators known from the TMX structure
// Keep it data-driven: anything appearing fewer times than interior tiles
console.log(`Identified ${wallGids.size} wall/border GIDs`)

// ---------------------------------------------------------------------------
// 6. Inline animated tilesets — extract animation frame data from TMX
// ---------------------------------------------------------------------------

interface InlineTilesetData {
  firstgid: number
  filename: string  // just the basename
  cols: number
  rows: number
}

interface AnimEntry {
  baseGid: number
  frames: number[]
  frameDurationSec: number
}

const inlineTilesets: InlineTilesetData[] = []
const animEntries: AnimEntry[] = []

/** Extract animation entries from a parsed tileset node */
function extractAnimations(tsNode: XmlTag, firstgid: number): void {
  for (const tile of findAll(tsNode, 'tile')) {
    if (tile.name !== 'tile') continue
    const localId = parseInt(tile.attrs.id, 10)
    const animNode = findOne(tile, 'animation')
    if (!animNode) continue

    const frames: number[] = []
    let duration = 200 // default ms
    for (const frame of findAll(animNode, 'frame')) {
      const frameTileId = parseInt(frame.attrs.tileid, 10)
      frames.push(firstgid + frameTileId)
      duration = parseInt(frame.attrs.duration, 10)
    }

    if (frames.length > 1) {
      animEntries.push({
        baseGid: firstgid + localId,
        frames,
        frameDurationSec: duration / 1000,
      })
    }
  }
}

const tmxDir = dirname(TMX_PATH)

for (const ts of findAll(doc, 'tileset')) {
  const firstgid = parseInt(ts.attrs.firstgid, 10)

  if (ts.attrs.source) {
    // External .tsx file — try to read and parse for animations
    const tsxPath = resolve(tmxDir, ts.attrs.source)
    try {
      const tsxContent = readFileSync(tsxPath, 'utf-8')
      const tsxDoc = parseTmx(tsxContent)
      const tsxNode = findOne(tsxDoc, 'tileset')
      if (tsxNode) {
        // Check if it has an image (= it's a tileset with its own tiles)
        const imageNode = findOne(tsxNode, 'image')
        if (imageNode) {
          const filename = imageNode.attrs.source.split('/').pop()!
          const imgCols = parseInt(tsxNode.attrs.columns, 10)
          const tilecount = parseInt(tsxNode.attrs.tilecount, 10)
          const imgRows = Math.ceil(tilecount / imgCols)
          inlineTilesets.push({ firstgid, filename, cols: imgCols, rows: imgRows })
        }
        extractAnimations(tsxNode, firstgid)
      }
    } catch {
      // .tsx not found — skip (static tilesets don't need animation)
    }
    continue
  }

  // Inline tileset
  const imageNode = findOne(ts, 'image')
  if (!imageNode) continue

  const imgSource = imageNode.attrs.source
  const filename = imgSource.split('/').pop()!
  const imgCols = parseInt(ts.attrs.columns, 10)
  const tilecount = parseInt(ts.attrs.tilecount, 10)
  const imgRows = Math.ceil(tilecount / imgCols)

  inlineTilesets.push({ firstgid, filename, cols: imgCols, rows: imgRows })
  extractAnimations(ts, firstgid)
}

console.log(`Found ${inlineTilesets.length} inline tilesets, ${animEntries.length} animated tiles`)

// ---------------------------------------------------------------------------
// 7. Generate TypeScript output
// ---------------------------------------------------------------------------

function formatArray(arr: number[], cols: number): string {
  const rows: string[] = []
  for (let i = 0; i < arr.length; i += cols) {
    rows.push(arr.slice(i, i + cols).join(','))
  }
  return rows.join(',\n')
}

const dirMap: Record<string, string> = {
  down: 'Direction.DOWN',
  up: 'Direction.UP',
  left: 'Direction.LEFT',
  right: 'Direction.RIGHT',
}

const output = `// ---------------------------------------------------------------------------
// AUTO-GENERATED by scripts/parse-tmx.ts — DO NOT EDIT MANUALLY
// Source: public/assets/office/gruai.tmx
// Generated: ${new Date().toISOString()}
// ---------------------------------------------------------------------------

import { Direction } from '../pixel-types'

// -- Map dimensions --
export const MAP_COLS = ${width}
export const MAP_ROWS = ${height}

// -- Layer 1: floor --
// prettier-ignore
export const FLOOR: number[] = [
${formatArray(layerArrays.floor, width)}
]

// -- Layer 2: furniture_base --
// prettier-ignore
export const FURNITURE_BASE: number[] = [
${formatArray(layerArrays.furniture_base, width)}
]

// -- Layer 3: furniture_top --
// prettier-ignore
export const FURNITURE_TOP: number[] = [
${formatArray(layerArrays.furniture_top, width)}
]

// -- Layer 4: deco --
// prettier-ignore
export const DECO: number[] = [
${formatArray(layerArrays.deco, width)}
]

// -- Seat positions (from objectgroup "seats") --
export const SEAT_POSITIONS = [
${seats.map((s) => `  { name: 'seat-${s.name}', col: ${s.col}, row: ${s.row}, dir: ${dirMap[s.dir] ?? 'Direction.DOWN'} },`).join('\n')}
] as const

// -- Zone bounds (from objectgroup "zones") --
export const ZONE_BOUNDS: Record<string, { minCol: number; maxCol: number; minRow: number; maxRow: number }> = {
${zones.map((z) => `  '${z.name}': { minCol: ${z.minCol}, maxCol: ${z.maxCol}, minRow: ${z.minRow}, maxRow: ${z.maxRow} },`).join('\n')}
}

// -- Tileset registry --
export const TILESET_REGISTRY = [
${tilesetRegistry.map((t) => `  { firstgid: ${t.firstgid}, filename: '${t.filename}' },`).join('\n')}
] as const

// -- Wall GIDs (sparse/edge GIDs from floor layer) --
export const WALL_GIDS: Set<number> = new Set([
  ${Array.from(wallGids).sort((a, b) => a - b).join(', ')}
])

// -- Inline animated tilesets (image source + firstgid) --
export const INLINE_TILESETS = [
${inlineTilesets.map((t) => `  { firstgid: ${t.firstgid}, filename: '${t.filename}', cols: ${t.cols}, rows: ${t.rows} },`).join('\n')}
] as const

// -- Animated tile definitions (from TMX <animation> elements) --
export const ANIMATED_TILE_DEFS: Array<{ baseGid: number; frames: number[]; frameDurationSec: number }> = [
${animEntries.map((a) => `  { baseGid: ${a.baseGid}, frames: [${a.frames.join(',')}], frameDurationSec: ${a.frameDurationSec} },`).join('\n')}
]
`

mkdirSync(dirname(OUT_PATH), { recursive: true })
writeFileSync(OUT_PATH, output, 'utf-8')
console.log(`\nGenerated: ${OUT_PATH}`)
console.log(`  FLOOR: ${layerArrays.floor.length} elements`)
console.log(`  FURNITURE_BASE: ${layerArrays.furniture_base.length} elements`)
console.log(`  FURNITURE_TOP: ${layerArrays.furniture_top.length} elements`)
console.log(`  DECO: ${layerArrays.deco.length} elements`)
console.log(`  SEAT_POSITIONS: ${seats.length} entries`)
console.log(`  ZONE_BOUNDS: ${zones.length} entries`)
console.log(`  TILESET_REGISTRY: ${tilesetRegistry.length} entries`)
console.log(`  WALL_GIDS: ${wallGids.size} entries`)
console.log(`  INLINE_TILESETS: ${inlineTilesets.length} entries`)
console.log(`  ANIMATED_TILE_DEFS: ${animEntries.length} entries`)
