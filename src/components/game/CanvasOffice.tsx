// ---------------------------------------------------------------------------
// CanvasOffice — Canvas 2D office renderer using full pixel-agents engine
// Fit-width layout: canvas sized to full map, native browser scrolling
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from 'react'
import { OFFICE_LAYOUT } from './office-layout'
import { OFFICE_AGENTS } from './types'
import type { AgentStatus, SessionInfo } from './pixel-types'
import { OfficeState } from './engine/officeState'
import { renderFrame, type SelectionRenderState, type IdentityOverlay } from './engine/renderer'
import { TILE_SIZE } from './pixel-types'
import { MAX_DELTA_TIME_SEC } from './constants'
import { loadAllAssets, onTilesetReady } from './asset-loader'
import { CharacterState } from './pixel-types'
import { ROOM_ZONES, getZoneAt } from './engine/roomZones'

// Build id -> agentName lookup (CEO shows as "You")
const AGENT_ID_TO_NAME = new Map(
  OFFICE_AGENTS.map((a) => [a.id, a.isPlayer ? 'You' : a.agentName])
)
// Build agentName -> id reverse lookup
const AGENT_NAME_TO_ID = new Map(OFFICE_AGENTS.map((a) => [a.agentName, a.id]))
// Build id -> real agentName (not "You") for item click resolution
const AGENT_ID_TO_REAL_NAME = new Map(OFFICE_AGENTS.map((a) => [a.id, a.agentName]))

// Find the player-controlled CEO agent
const CEO_AGENT = OFFICE_AGENTS.find((a) => a.isPlayer) ?? null
const CEO_ID = CEO_AGENT?.id ?? null

// Zoom bounds
const MIN_ZOOM_ABSOLUTE = 1
const MAX_ZOOM_ABSOLUTE = 8
const ZOOM_STEP = 0.15 // per wheel tick

/** Tooltip state for room hover */
interface TooltipState {
  x: number
  y: number
  roomName: string
  agents: string[]
}

/** Item click info passed up to GamePage */
export interface ClickedItem {
  type: 'desk' | 'furniture' | 'server' | 'conference' | 'wall'
  col: number
  row: number
  agentName?: string
}

interface CanvasOfficeProps {
  onAgentClick?: (agentName: string) => void
  onItemClick?: (item: ClickedItem | null) => void
  agentStatuses: Record<string, AgentStatus>
  /** Per-agent session context (task name, active tool) for Character.sessionInfo */
  agentSessionInfos?: Record<string, SessionInfo>
  /** Per-agent busy flag (multiple active sessions) */
  agentBusyMap?: Record<string, boolean>
  selectedAgentName?: string | null
}

export default function CanvasOffice({
  onAgentClick,
  onItemClick,
  agentStatuses,
  agentSessionInfos,
  agentBusyMap: _agentBusyMap,
  selectedAgentName,
}: CanvasOfficeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const stateRef = useRef<OfficeState | null>(null)
  const rafRef = useRef(0)
  const lastTimeRef = useRef(0)
  const propsRef = useRef({ onAgentClick, onItemClick, agentStatuses, agentSessionInfos, selectedAgentName })
  propsRef.current = { onAgentClick, onItemClick, agentStatuses, agentSessionInfos, selectedAgentName }

  // Zoom state: fitZoom is the baseline (fit map width to container), zoom is current
  const [fitZoom, setFitZoom] = useState(3)
  const [zoom, setZoom] = useState(3)
  const zoomRef = useRef(zoom)
  zoomRef.current = zoom

  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  // Get map dimensions from state (or fallback)
  const getMapDims = useCallback(() => {
    const state = stateRef.current
    const cols = state ? (state.tileMap[0]?.length ?? 1) : 1
    const rows = state ? state.tileMap.length : 1
    return { cols, rows }
  }, [])

  // Initialize office state + add agents + load assets
  useEffect(() => {
    const state = new OfficeState(OFFICE_LAYOUT)
    for (const agent of OFFICE_AGENTS) {
      state.addAgent(agent.id, agent.palette, agent.hueShift, agent.seatId, true)
    }
    // Mark CEO as player-controlled and start idle (not typing at desk)
    if (CEO_ID !== null) {
      const ceoCh = state.characters.get(CEO_ID)
      if (ceoCh) {
        ceoCh.isPlayerControlled = true
        ceoCh.state = CharacterState.IDLE
        ceoCh.isActive = false
        ceoCh.agentStatus = 'working'
      }
    }
    stateRef.current = state
    loadAllAssets()
    onTilesetReady(() => {
      state.rebuildFurnitureInstances()
    })
  }, [])

  // Sync agent statuses from props (debounced inside OfficeState)
  // Skip player-controlled CEO
  useEffect(() => {
    const state = stateRef.current
    if (!state) return
    for (const agent of OFFICE_AGENTS) {
      if (agent.isPlayer) continue
      const status = agentStatuses[agent.agentName] ?? 'offline'
      state.setAgentStatus(agent.id, status)
    }
  }, [agentStatuses])

  // Sync session context info (task name, tool name)
  useEffect(() => {
    const state = stateRef.current
    if (!state || !agentSessionInfos) return
    for (const agent of OFFICE_AGENTS) {
      const info = agentSessionInfos[agent.agentName]
      if (info) {
        state.setAgentSessionInfo(agent.id, info)
      }
    }
  }, [agentSessionInfos])

  // Sync selected agent
  useEffect(() => {
    const state = stateRef.current
    if (!state) return
    if (selectedAgentName) {
      const agent = OFFICE_AGENTS.find((a) => a.agentName === selectedAgentName)
      state.selectedAgentId = agent ? agent.id : null
    } else {
      state.selectedAgentId = null
    }
  }, [selectedAgentName])

  // WASD keyboard input for CEO movement
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || CEO_ID === null) return

    const onKeyDown = (e: KeyboardEvent) => {
      const state = stateRef.current
      if (!state) return
      const ceo = state.characters.get(CEO_ID!)
      if (!ceo || !ceo.isPlayerControlled) return
      if (ceo.state === CharacterState.WALK && ceo.path.length > 0) return

      let dc = 0
      let dr = 0
      switch (e.key.toLowerCase()) {
        case 'w': case 'arrowup':    dr = -1; break
        case 's': case 'arrowdown':  dr = 1;  break
        case 'a': case 'arrowleft':  dc = -1; break
        case 'd': case 'arrowright': dc = 1;  break
        default: return
      }
      e.preventDefault()
      const targetCol = ceo.tileCol + dc
      const targetRow = ceo.tileRow + dr
      state.walkToTile(CEO_ID!, targetCol, targetRow)
    }

    canvas.addEventListener('keydown', onKeyDown)
    canvas.focus()
    return () => canvas.removeEventListener('keydown', onKeyDown)
  }, [])

  // ResizeObserver — track container width to compute fitZoom
  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return
    const parent = wrapper.parentElement
    if (!parent) return

    const observer = new ResizeObserver(() => {
      const w = parent.clientWidth
      if (w === 0) return

      const state = stateRef.current
      if (state) {
        const cols = state.tileMap[0]?.length ?? 1
        const newFitZoom = w / (cols * TILE_SIZE)
        setFitZoom(newFitZoom)
        // If user hasn't manually zoomed yet, track fitZoom
        // We detect "hasn't zoomed" by checking if current zoom equals old fitZoom
        setZoom((prevZoom) => {
          // On first load or if zoom was tracking fitZoom, update to new fitZoom
          const oldFitZoom = fitZoomRef.current
          if (Math.abs(prevZoom - oldFitZoom) < 0.01) {
            return newFitZoom
          }
          return prevZoom
        })
      }
    })

    observer.observe(parent)
    return () => observer.disconnect()
  }, [])

  // Keep a ref of fitZoom for the resize observer closure
  const fitZoomRef = useRef(fitZoom)
  fitZoomRef.current = fitZoom

  // Wheel zoom handler
  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return
    const parent = wrapper.parentElement
    if (!parent) return

    const onWheel = (e: WheelEvent) => {
      // Only zoom if Ctrl/Meta is held, otherwise let native scroll work
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()

      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
      setZoom((prev) => {
        const minZoom = Math.max(MIN_ZOOM_ABSOLUTE, fitZoomRef.current * 0.5)
        const maxZoom = Math.min(MAX_ZOOM_ABSOLUTE, fitZoomRef.current * 3)
        return Math.max(minZoom, Math.min(maxZoom, prev + delta * prev))
      })
    }

    parent.addEventListener('wheel', onWheel, { passive: false })
    return () => parent.removeEventListener('wheel', onWheel)
  }, [])

  // Compute canvas pixel dimensions from zoom and map size
  const { cols, rows } = getMapDims()
  const canvasLogicalW = cols * TILE_SIZE * zoom
  const canvasLogicalH = rows * TILE_SIZE * zoom

  // Update canvas backing store when zoom/size changes
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = Math.ceil(canvasLogicalW * dpr)
    canvas.height = Math.ceil(canvasLogicalH * dpr)
    canvas.style.width = `${Math.ceil(canvasLogicalW)}px`
    canvas.style.height = `${Math.ceil(canvasLogicalH)}px`
  }, [canvasLogicalW, canvasLogicalH])

  // Animation loop
  useEffect(() => {
    const loop = (time: number) => {
      const canvas = canvasRef.current
      const state = stateRef.current
      if (!canvas || !state) {
        rafRef.current = requestAnimationFrame(loop)
        return
      }

      const dt =
        lastTimeRef.current === 0
          ? 0
          : Math.min((time - lastTimeRef.current) / 1000, MAX_DELTA_TIME_SEC)
      lastTimeRef.current = time

      state.update(dt)

      const dpr = window.devicePixelRatio || 1
      const currentZoom = zoomRef.current
      const mapCols = state.tileMap[0]?.length ?? 1
      const mapRows = state.tileMap.length ?? 1
      const w = mapCols * TILE_SIZE * currentZoom
      const h = mapRows * TILE_SIZE * currentZoom

      const ctx = canvas.getContext('2d')!
      ctx.save()
      ctx.scale(dpr, dpr)
      ctx.imageSmoothingEnabled = false

      const selection: SelectionRenderState = {
        selectedAgentId: state.selectedAgentId,
        hoveredAgentId: state.hoveredAgentId,
        hoveredTile: state.hoveredTile,
        seats: state.seats,
        characters: state.characters,
      }

      const statuses = propsRef.current.agentStatuses
      const statusMap = new Map<number, import('./types').AgentStatus>()
      for (const [name, status] of Object.entries(statuses)) {
        const id = AGENT_NAME_TO_ID.get(name)
        if (id !== undefined) statusMap.set(id, status)
      }
      if (CEO_ID !== null) statusMap.set(CEO_ID, 'working')

      const identity: IdentityOverlay = {
        nameMap: AGENT_ID_TO_NAME,
        statusMap,
        time: time / 1000,
      }

      // Canvas = full map size, so panX/panY = 0, offsets will be 0
      renderFrame(
        ctx,
        w,
        h,
        state.tileMap,
        state.furniture,
        state.getCharacters(),
        currentZoom,
        0,
        0,
        selection,
        undefined,
        state.layout.tileColors,
        state.layout.cols,
        state.layout.rows,
        state.layout.gidLayers,
        identity,
      )

      ctx.restore()
      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])


  // Convert screen coords to world coords (offsets are 0 since canvas = map)
  const screenToWorld = useCallback((screenX: number, screenY: number) => {
    const currentZoom = zoomRef.current
    return {
      worldX: screenX / currentZoom,
      worldY: screenY / currentZoom,
    }
  }, [])

  // Resolve character id -> display name ("You" for CEO)
  const resolveAgentName = useCallback((charId: number): string => {
    return AGENT_ID_TO_NAME.get(charId) ?? ''
  }, [])

  // Resolve character id -> real agent name (for data lookups, never "You")
  const resolveRealAgentName = useCallback((charId: number): string => {
    return AGENT_ID_TO_REAL_NAME.get(charId) ?? ''
  }, [])

  // ---------------------------------------------------------------------------
  // Click handler: process a click at world coordinates.
  // Priority: agent > furniture/desk > click-to-move (CEO)
  // ---------------------------------------------------------------------------
  const processClick = useCallback(
    (worldX: number, worldY: number) => {
      const state = stateRef.current
      if (!state) return

      // 1. Agent hit (highest priority)
      const charId = state.getCharacterAt(worldX, worldY)
      if (charId !== null) {
        state.selectedAgentId = charId === state.selectedAgentId ? null : charId
        const name = resolveAgentName(charId)
        if (name && propsRef.current.onAgentClick) {
          propsRef.current.onAgentClick(name)
        }
        return
      }

      // 2. Furniture/desk hit (second priority)
      const tileInfo = state.getTileInfoAt(worldX, worldY)
      if (tileInfo && tileInfo.type !== 'wall') {
        state.selectedAgentId = null
        let agentName: string | undefined
        if (tileInfo.type === 'desk' && tileInfo.agentId !== undefined) {
          agentName = resolveRealAgentName(tileInfo.agentId)
        }
        const item: ClickedItem = {
          type: tileInfo.type,
          col: tileInfo.col,
          row: tileInfo.row,
          agentName,
        }
        if (propsRef.current.onItemClick) {
          propsRef.current.onItemClick(item)
        }
        return
      }

      // 3. Empty space -- deselect + click-to-move CEO
      state.selectedAgentId = null
      if (propsRef.current.onAgentClick) {
        propsRef.current.onAgentClick('')
      }
      if (propsRef.current.onItemClick) {
        propsRef.current.onItemClick(null)
      }
      if (CEO_ID !== null) {
        const tileCol = Math.floor(worldX / TILE_SIZE)
        const tileRow = Math.floor(worldY / TILE_SIZE)
        state.walkToTile(CEO_ID, tileCol, tileRow)
      }
    },
    [resolveAgentName, resolveRealAgentName],
  )

  // Mouse handlers (no drag/pan -- click and hover only)
  const handleMouseDown = useCallback((_e: React.MouseEvent<HTMLCanvasElement>) => {
    // no-op: click is handled on mouseUp
  }, [])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const state = stateRef.current
      if (!state) return

      const screenX = e.nativeEvent.offsetX
      const screenY = e.nativeEvent.offsetY
      const { worldX, worldY } = screenToWorld(screenX, screenY)
      const charId = state.getCharacterAt(worldX, worldY)
      state.hoveredAgentId = charId

      // Check furniture for pointer cursor
      const tileInfo = charId === null ? state.getTileInfoAt(worldX, worldY) : null
      const isInteractive = charId !== null || (tileInfo !== null && tileInfo.type !== 'wall')

      if (canvasRef.current) {
        canvasRef.current.style.cursor = isInteractive ? 'pointer' : 'default'
      }

      // Room hover tooltip: only show when not hovering agent or interactive furniture
      if (charId === null && !isInteractive) {
        const col = Math.floor(worldX / TILE_SIZE)
        const row = Math.floor(worldY / TILE_SIZE)
        const zoneId = getZoneAt(col, row)
        if (zoneId) {
          const zone = ROOM_ZONES[zoneId]
          const agentsInZone = state.getAgentsInZone(
            zone.bounds.minCol, zone.bounds.minRow,
            zone.bounds.maxCol, zone.bounds.maxRow,
          )
          const agentNames = agentsInZone
            .map((a) => AGENT_ID_TO_NAME.get(a.id) ?? '')
            .filter((n) => n !== '')
          setTooltip({
            x: screenX + 12,
            y: screenY - 8,
            roomName: zone.label,
            agents: agentNames,
          })
        } else {
          setTooltip(null)
        }
      } else {
        setTooltip(null)
      }
    },
    [screenToWorld],
  )

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const { worldX, worldY } = screenToWorld(e.nativeEvent.offsetX, e.nativeEvent.offsetY)
      processClick(worldX, worldY)
    },
    [screenToWorld, processClick],
  )

  const handleMouseLeave = useCallback(() => {
    const state = stateRef.current
    if (state) state.hoveredAgentId = null
    if (canvasRef.current) canvasRef.current.style.cursor = 'default'
    setTooltip(null)
  }, [])

  // Touch handlers (tap-to-click only, no drag/pan or pinch-to-zoom)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    function touchOffset(t: Touch) {
      const rect = canvas!.getBoundingClientRect()
      return { x: t.clientX - rect.left, y: t.clientY - rect.top }
    }

    let touchStart: { x: number; y: number } | null = null

    function onTouchStart(e: TouchEvent) {
      // Don't preventDefault -- allow native scroll on touch
      if (e.touches.length === 1) {
        touchStart = touchOffset(e.touches[0])
      }
    }

    function onTouchMove(e: TouchEvent) {
      // If finger moves too far, cancel the tap (let browser scroll)
      if (touchStart && e.touches.length === 1) {
        const pos = touchOffset(e.touches[0])
        const dx = pos.x - touchStart.x
        const dy = pos.y - touchStart.y
        if (Math.sqrt(dx * dx + dy * dy) >= 10) {
          touchStart = null
        }
      }
    }

    function onTouchEnd(e: TouchEvent) {
      if (e.touches.length === 0 && touchStart) {
        const state = stateRef.current
        if (state) {
          const currentZoom = zoomRef.current
          const worldX = touchStart.x / currentZoom
          const worldY = touchStart.y / currentZoom
          // Touch tap: same priority logic as mouse click
          const charId = state.getCharacterAt(worldX, worldY)
          if (charId !== null) {
            state.selectedAgentId = charId === state.selectedAgentId ? null : charId
            const name = AGENT_ID_TO_NAME.get(charId) ?? ''
            if (name && propsRef.current.onAgentClick) {
              propsRef.current.onAgentClick(name)
            }
          } else {
            const tileInfo = state.getTileInfoAt(worldX, worldY)
            if (tileInfo && tileInfo.type !== 'wall') {
              state.selectedAgentId = null
              let agentName: string | undefined
              if (tileInfo.type === 'desk' && tileInfo.agentId !== undefined) {
                agentName = AGENT_ID_TO_REAL_NAME.get(tileInfo.agentId)
              }
              if (propsRef.current.onItemClick) {
                propsRef.current.onItemClick({
                  type: tileInfo.type,
                  col: tileInfo.col,
                  row: tileInfo.row,
                  agentName,
                })
              }
            } else {
              state.selectedAgentId = null
              if (propsRef.current.onAgentClick) {
                propsRef.current.onAgentClick('')
              }
              if (propsRef.current.onItemClick) {
                propsRef.current.onItemClick(null)
              }
              // Click-to-move CEO
              if (CEO_ID !== null) {
                const tileCol = Math.floor(worldX / TILE_SIZE)
                const tileRow = Math.floor(worldY / TILE_SIZE)
                state.walkToTile(CEO_ID, tileCol, tileRow)
              }
            }
          }
        }
      }
      touchStart = null
    }

    canvas.addEventListener('touchstart', onTouchStart, { passive: true })
    canvas.addEventListener('touchmove', onTouchMove, { passive: true })
    canvas.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchmove', onTouchMove)
      canvas.removeEventListener('touchend', onTouchEnd)
    }
  }, [])

  return (
    <div
      ref={wrapperRef}
      className="relative"
      style={{
        width: Math.ceil(canvasLogicalW),
        height: Math.ceil(canvasLogicalH),
      }}
    >
      <canvas
        ref={canvasRef}
        className="block touch-none outline-none"
        tabIndex={0}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        aria-label="Office simulation"
        role="img"
      />
      {tooltip && (
        <div
          className="absolute pointer-events-none bg-black/80 text-white text-xs px-3 py-2 rounded-lg shadow-lg"
          style={{ left: tooltip.x, top: tooltip.y, maxWidth: 200 }}
          role="tooltip"
        >
          <div className="font-semibold mb-0.5">{tooltip.roomName}</div>
          {tooltip.agents.length > 0 ? (
            <div className="text-white/70">
              {tooltip.agents.join(', ')}
            </div>
          ) : (
            <div className="text-white/50 italic">Empty</div>
          )}
        </div>
      )}
    </div>
  )
}
