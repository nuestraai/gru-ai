<!-- Reference: failure-handling.md | Source: SKILL.md restructure -->

# Failure Handling

| Situation | Action |
|-----------|--------|
| Brainstorm agent's challenge field raises directive-level concerns | Highlight prominently in brainstorm synthesis. Surface as a CEO clarification question in the clarification step. CEO decides whether to proceed or modify scope. |
| All brainstorm agents endorse the directive in challenge fields | Note in brainstorm synthesis, proceed normally to clarification/planning. |
| The COO's plan doesn't parse as JSON | Stop, show the raw output, ask CEO to intervene |
| Worktree creation fails | Warn CEO, work in the main repo instead. All changes are uncommitted, CEO can review with `git diff`. |
| Audit finds nothing for ALL tasks | Skip to stale doc detection, generate digest noting "no issues found", recommend CEO review the directive scope. |
| CEO rejects the plan | Stop. CEO can re-run with adjusted directive or manually edit the plan |
| Agent fails mid-task | Skip remaining tasks in that task, continue to next. Log in digest. |
| Reviewer finds issues | Non-fatal. Include in digest. CEO decides whether to address. |
| Task is blocked | Skip, note in digest, continue to next task |
| All tasks fail | Generate digest showing failures, recommend CEO review |
| Audit finds nothing to fix | Remove task from plan, note in digest |
| Context exhaustion mid-directive | directive.json preserves state. Re-run `/directive {name}` to resume. |
| Brainstorm agents disagree on approach | Present all approaches with trade-offs in clarifying questions. Let CEO pick direction. Don't synthesize conflicting approaches into a compromise. |
| Amend builder fails to fix the issue | Log the failure in the digest. Present the original CEO feedback plus the builder's error to the CEO at the next completion gate. CEO can retry the amend with more detail, extend scope to a full project, or approve as-is. |
| Extend scope is too large for delta planning | The COO should flag during planning that the extension is equivalent to a new directive. Present the COO's assessment to the CEO. CEO can redirect (full re-plan), split into a new directive, or narrow the extension. |
| Redirect produces a plan identical to the original | The COO flags no material change. Present to CEO with explanation. CEO can provide sharper differentiation, extend instead (add scope without replacing), or approve the original result as-is. |
| Multiple amends on the same items | After 2 amend iterations on the same deliverable, escalate to the CEO: "This item has been amended twice without resolution. Consider extending scope (dedicated project) or redirecting (re-plan with clearer requirements)." Do not start a third amend cycle automatically. |
| Iteration type unclear from CEO feedback | Default to amend for single-item fixes, extend for "also add X" requests, redirect for "this isn't what I wanted." If still ambiguous, ask the CEO to pick: amend, extend, or redirect. Never guess. |
