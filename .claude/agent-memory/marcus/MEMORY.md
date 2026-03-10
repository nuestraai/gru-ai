# Marcus Rivera (CPO) Memory

## Key Insight: Intent Degradation Chain
- CEO brief -> COO plan -> CTO audit -> project-brainstorm -> builder prompt = 4 translation layers
- Each layer abstracts away CEO intent. By the time a builder reads their task scope, they have NO access to the original CEO brief or the "why"
- DOD criteria are testable but often describe CODE behavior, not CEO expectations
- The builder has never seen the CEO's words — only a thrice-abstracted scope_summary

## Pipeline Quality Gaps (Phase 2 analysis, 2026-03-09)
- Builders cannot self-test UI (Chrome MCP only works in main session)
- Builders mark "done" based on "it compiles" not "it works as the CEO expects"
- Review prompts ask "would CEO workflow improve?" but reviewer answers from code, not from testing
- No acceptance test definition that agents can simulate (e.g., "open this page, click X, see Y")
- The "9 bugs in 10 seconds" pattern: CEO tests as a USER, agents test as ENGINEERS

## Brainstorm Participation
- pipeline-iteration-model: Phase 1 (Tiered CEO Engagement), Phase 2 (First-Pass Quality)
