# Devon Lee -- Agent Memory

## Directive Directory Format (2026-03-06)
- Directives now use directory format: `.context/directives/{id}/directive.json` + `directive.md`
- Old flat format (`{id}.json` + `{id}.md`) was fully migrated and removed
- `checkpoints/` subdirectory was removed
- directive-watcher.ts uses depth:1 chokidar to watch inside directive directories
- state-watcher.ts reads directives via `listDirs()` then `{dirId}/directive.json`

## Terminology: initiatives -> projects (2026-03-06)
- `DirectiveInitiative` renamed to `DirectiveProject` (server/types.ts, src/stores/types.ts)
- `totalInitiatives` -> `totalProjects`, `currentInitiative` -> `currentProject`
- `DirectiveState.initiatives[]` -> `DirectiveState.projects[]`
- `DirectiveRecord.initiatives` -> `DirectiveRecord.projects` (work-item-types.ts Zod + frontend types)
- `DirectiveProject` gained `totalTasks` and `completedTasks` optional fields
- `DirectiveState.status` gained `awaiting_completion` value
- All frontend components updated: DirectiveProgress, OrientationBanner, IntelPanel, ProjectsPanel, FurniturePanels, GamePage, panelUtils

## Pipeline Steps (2026-03-06)
- New steps added: brainstorm, project-brainstorm, completion (report step removed)
- Full order: triage, read, context, brainstorm, plan, audit, project-brainstorm, approve, setup, execute, wrapup, completion
- Lightweight skips: brainstorm, project-brainstorm, audit, approve
- Completion step gets `needsAction=true` when directive status is `awaiting_completion`

## PlatformAdapter / ClaudeCodeAdapter (2026-03-07)
- `server/platform/types.ts` defines PlatformAdapter interface + AggregatorHandle
- `server/platform/claude-code.ts` implements ClaudeCodeAdapter with instance-level fileStates + parentAgentMapCache
- session-state.ts functions accept optional `stateMap` param (falls back to module-level singleton)
- session-scanner.ts `extractSubagentTypesFromParent` + `resolveAgentFromParent` accept optional `cache` param
- Aggregator constructor takes optional `PlatformAdapter`; uses adapter when present, falls back to raw imports
- SessionWatcher + ClaudeWatcher accept `AggregatorHandle` (interface) not concrete `Aggregator` class
- server/index.ts instantiates ClaudeCodeAdapter, passes to Aggregator + creates watchers via adapter factory
- Tests use tsx: `npx tsx --test server/parsers/session-state.test.ts` (not bare node)

## Category concept removed (2026-03-07)
- `category` field fully removed from directive.json, project.json, plan.json across entire framework
- Removed from: server/types.ts, work-item-types.ts (5 Zod schemas), aggregator.ts, index.ts, directive-watcher.ts, state-watcher.ts
- Removed from: src/stores/types.ts (5 interfaces), ActionPanel, StatusPanel, LogPanel
- Removed from: mcp-server tools (status.ts, backlog.ts, index.ts), scripts/foreman.ts
- Removed from: 10+ pipeline docs, CLAUDE.md Categories section, CLI templates, validate-project-json.sh
- addBacklogItem() no longer takes category param; listBacklog() no longer takes category param
- Historical directive artifacts (brainstorm.md, old project.json reports) still contain category references -- these are completed records and not modified
- furnitureCatalog.ts, layoutSerializer.ts, pixel-types.ts category references are UNRELATED (game furniture concepts)

## Type-check commands
- `npx tsc --noEmit` -- checks all project references (server + frontend)
- `npx vite build` -- frontend build (can succeed when tsc fails, always run both)
- NEVER use `npm run lint` -- ESLint OOMs on this project
