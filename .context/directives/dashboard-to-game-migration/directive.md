# Phase Out Dashboard UI — Migrate to Game UI

## CEO Brief

The dashboard UI and the game UI serve overlapping purposes. The game UI is the future — it's the CEO's primary interface for managing the autonomous AI company. The dashboard is legacy at this point.

Phase out the dashboard UI entirely and move all its useful functionality into the game UI. The game should become the single unified interface.

## What the Dashboard Currently Provides

- StatsBar: session counts, active agents, directive progress
- TeamCard: agent/team status cards
- DirectiveProgress: pipeline stepper and directive tracking
- AttentionRequired: items needing CEO attention
- RecentActivity: activity feed
- WorkSummary: high-level work summary
- CeoBrief: CEO briefing panel
- SchedulerCard: work scheduler status
- OrientationBanner: onboarding/orientation

## What the Game Currently Provides

- Canvas 2D office with pixel-art characters representing agents
- HUD panels: AgentPanel, TeamPanel, OpsPanel, BookshelfPanel, FurniturePanels
- Real-time agent status visualization
- Interactive office environment

## Desired Outcome

- Game UI becomes THE interface — all dashboard functionality accessible from within the game
- Dashboard pages/routes removed
- No loss of functionality — everything the dashboard showed should be accessible in the game (through panels, overlays, or HUD elements)
- Clean removal of dead dashboard code
