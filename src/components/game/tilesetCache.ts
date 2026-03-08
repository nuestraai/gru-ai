// ---------------------------------------------------------------------------
// Tileset Cache — lazy tile extraction from tileset PNGs
// Only extracts tiles that are actually used in the layout (not all 17k+)
// ---------------------------------------------------------------------------

import { TILE_SIZE } from './pixel-types'
import { OFFICE_LAYOUT } from './office-layout'
import { collectAnimationFrameGids } from './furnitureAnimations'

/** Pre-rendered tile canvases indexed by GID (1-based, matching TMX convention) */
const tileCanvases: Map<number, HTMLCanvasElement> = new Map()
let loaded = false

/** Source tileset data for lazy extraction */
interface TilesetSource {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  firstGid: number
  cols: number
  rows: number
  tileCount: number
}
const tilesetSources: TilesetSource[] = []

/** Check if tileset is loaded */
export function hasTilesetCache(): boolean {
  return loaded
}

/** Get a pre-rendered tile canvas by TMX GID (1-based) */
export function getTileCanvas(gid: number): HTMLCanvasElement | null {
  return tileCanvases.get(gid) ?? null
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/** Register a tileset source for lazy extraction */
function registerTileset(img: HTMLImageElement, firstGid: number): TilesetSource {
  const cols = Math.floor(img.width / TILE_SIZE)
  const rows = Math.floor(img.height / TILE_SIZE)

  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  const src: TilesetSource = { canvas, ctx, firstGid, cols, rows, tileCount: cols * rows }
  tilesetSources.push(src)
  return src
}

/** Extract a single tile from its source tileset */
function extractTile(gid: number): HTMLCanvasElement | null {
  for (const src of tilesetSources) {
    const localId = gid - src.firstGid
    if (localId < 0 || localId >= src.tileCount) continue

    const r = Math.floor(localId / src.cols)
    const c = localId % src.cols

    const tile = document.createElement('canvas')
    tile.width = TILE_SIZE
    tile.height = TILE_SIZE
    const ctx = tile.getContext('2d')!
    ctx.drawImage(src.canvas, c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE, 0, 0, TILE_SIZE, TILE_SIZE)
    tileCanvases.set(gid, tile)
    return tile
  }
  return null
}

/** Collect all unique GIDs used in the layout, including animation frame GIDs */
function collectUsedGids(): Set<number> {
  const used = new Set<number>()
  const layers = OFFICE_LAYOUT.gidLayers
  if (!layers) return used
  for (const layer of layers) {
    for (const gid of layer) {
      if (gid !== 0) used.add(gid)
    }
  }
  // Include all animation frame GIDs so they are pre-extracted at load time.
  // Without this, animated frames that aren't in the layout would be lazily
  // extracted on first render, causing a visible hitch.
  for (const gid of collectAnimationFrameGids()) {
    used.add(gid)
  }
  return used
}

/**
 * Load all tileset PNGs and pre-extract only the tiles used in the layout.
 *
 * Tileset GID ranges:
 *   room-builder.png  : firstgid=1,    GIDs 1-224      (16x14 = 224 tiles)
 *   furniture.png     : firstgid=225,  GIDs 225-1072   (16x53 = 848 tiles)
 *   Interiors.png     : firstgid=1073, GIDs 1073-18096 (16x1064 = 17024 tiles)
 */
export async function loadTilesetCache(): Promise<void> {
  if (loaded) return
  try {
    const [rbImg, furnImg, intImg] = await Promise.all([
      loadImage('/assets/office/room-builder.png'),
      loadImage('/assets/office/furniture.png'),
      loadImage('/assets/office/Interiors.png'),
    ])

    registerTileset(rbImg, 1)       // room-builder: GIDs 1-224
    registerTileset(furnImg, 225)    // furniture: GIDs 225-1072
    registerTileset(intImg, 1073)    // Interiors: GIDs 1073-18096

    // Pre-extract only tiles used in the layout
    const usedGids = collectUsedGids()
    for (const gid of usedGids) {
      extractTile(gid)
    }

    loaded = true
    console.log(`✓ Tileset cache: ${tileCanvases.size} tiles extracted (${usedGids.size} unique GIDs from layout)`)
  } catch (e) {
    console.warn('Tileset cache not available. Using fallback rendering.', e)
  }
}

/** Scaled tile cache: zoom level → (gid → scaled canvas) */
const scaledCache = new Map<number, Map<number, HTMLCanvasElement>>()

/** Get a tile canvas scaled to the current zoom level */
export function getScaledTileCanvas(gid: number, zoom: number): HTMLCanvasElement | null {
  let base = tileCanvases.get(gid)
  if (!base) {
    // Lazy extract if not pre-cached
    base = extractTile(gid) ?? undefined
    if (!base) return null
  }

  if (zoom === 1) return base

  const zoomKey = Math.round(zoom * 100)

  let zoomMap = scaledCache.get(zoomKey)
  if (!zoomMap) {
    zoomMap = new Map()
    scaledCache.set(zoomKey, zoomMap)
  }

  let scaled = zoomMap.get(gid)
  if (scaled) return scaled

  const size = Math.round(TILE_SIZE * zoom)
  scaled = document.createElement('canvas')
  scaled.width = size
  scaled.height = size
  const ctx = scaled.getContext('2d')!
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(base, 0, 0, size, size)
  zoomMap.set(gid, scaled)

  return scaled
}
