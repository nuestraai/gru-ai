// ---------------------------------------------------------------------------
// Tileset Cache — pre-renders tiles from room-builder.png + furniture.png
// for direct TMX GID rendering (bypasses auto-tile + colorize systems)
// ---------------------------------------------------------------------------

import { TILE_SIZE } from './pixel-types'

/** Pre-rendered tile canvases indexed by GID (1-based, matching TMX convention) */
const tileCanvases: Map<number, HTMLCanvasElement> = new Map()
let loaded = false

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

/** Extract all tiles from a tileset image and store with GID offset */
function extractTiles(img: HTMLImageElement, firstGid: number): number {
  const cols = Math.floor(img.width / TILE_SIZE)
  const rows = Math.floor(img.height / TILE_SIZE)

  const srcCanvas = document.createElement('canvas')
  srcCanvas.width = img.width
  srcCanvas.height = img.height
  const srcCtx = srcCanvas.getContext('2d')!
  srcCtx.drawImage(img, 0, 0)

  let count = 0
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const gid = firstGid + r * cols + c
      const tile = document.createElement('canvas')
      tile.width = TILE_SIZE
      tile.height = TILE_SIZE
      const ctx = tile.getContext('2d')!
      ctx.drawImage(srcCanvas, c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE, 0, 0, TILE_SIZE, TILE_SIZE)
      tileCanvases.set(gid, tile)
      count++
    }
  }
  return count
}

/**
 * Load all tileset PNGs. GIDs match the TMX convention used by Tiled.
 *
 * Tileset GID ranges:
 *   room-builder.png  : firstgid=1,    GIDs 1-224      (16x14 = 224 tiles)
 *   furniture.png     : firstgid=225,  GIDs 225-1072   (16x53 = 848 tiles)
 *   generic.png       : firstgid=1073, GIDs 1073-2320  (16x78 = 1248 tiles)
 *   livingroom.png    : firstgid=2321, GIDs 2321-3040  (16x45 = 720 tiles)
 *   kitchen.png       : firstgid=3041, GIDs 3041-3824  (16x49 = 784 tiles)
 *   conference.png    : firstgid=3825, GIDs 3825-4016  (16x12 = 192 tiles)
 *   classroom.png     : firstgid=4017, GIDs 4017-4560  (16x34 = 544 tiles)
 *   music-sport.png   : firstgid=4561, GIDs 4561-5328  (16x48 = 768 tiles)
 */
export async function loadTilesetCache(): Promise<void> {
  if (loaded) return
  try {
    const [rbImg, furnImg, genImg, livImg, kitImg, confImg, classImg, musicImg] = await Promise.all([
      loadImage('/assets/office/room-builder.png'),
      loadImage('/assets/office/furniture.png'),
      loadImage('/assets/office/generic.png'),
      loadImage('/assets/office/livingroom.png'),
      loadImage('/assets/office/kitchen.png'),
      loadImage('/assets/office/conference.png'),
      loadImage('/assets/office/classroom.png'),
      loadImage('/assets/office/music-sport.png'),
    ])

    const rbCount = extractTiles(rbImg, 1)         // room-builder: GIDs 1-224
    const fnCount = extractTiles(furnImg, 225)      // furniture: GIDs 225-1072
    const genCount = extractTiles(genImg, 1073)     // generic: GIDs 1073-2320
    const livCount = extractTiles(livImg, 2321)     // livingroom: GIDs 2321-3040
    const kitCount = extractTiles(kitImg, 3041)     // kitchen: GIDs 3041-3824
    const confCount = extractTiles(confImg, 3825)   // conference: GIDs 3825-4016
    const classCount = extractTiles(classImg, 4017) // classroom: GIDs 4017-4560
    const musicCount = extractTiles(musicImg, 4561) // music-sport: GIDs 4561-5328

    loaded = true
    console.log(
      `✓ Tileset cache: ${rbCount} room-builder + ${fnCount} furniture + ${genCount} generic + ${livCount} livingroom + ${kitCount} kitchen + ${confCount} conference + ${classCount} classroom + ${musicCount} music-sport = ${tileCanvases.size} tiles`
    )
  } catch (e) {
    console.warn('Tileset cache not available. Using fallback rendering. Run scripts/setup-assets.sh to install premium assets.')
  }
}

/** Scaled tile cache: zoom level → (gid → scaled canvas) */
const scaledCache = new Map<number, Map<number, HTMLCanvasElement>>()

/** Get a tile canvas scaled to the current zoom level */
export function getScaledTileCanvas(gid: number, zoom: number): HTMLCanvasElement | null {
  const base = tileCanvases.get(gid)
  if (!base) return null

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
