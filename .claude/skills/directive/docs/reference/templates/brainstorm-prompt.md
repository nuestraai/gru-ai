<!-- Reference: brainstorm-prompt.md | Source: SKILL.md restructure -->

# Brainstorm Agent Prompt Template

## Phase 1: Initial Proposal (+ Challenge for Heavyweight/Strategic)

Used for all brainstorm participants (C-suite + auditor) in both heavyweight and strategic directives. The audit step has already run -- audit findings are included as context so proposals are grounded in codebase reality.

```
You are {Name}, {Title}. The CEO issued a directive that needs approach exploration before execution planning.

DIRECTIVE:
{directive text}

AUDIT FINDINGS:
{audit output from 06-technical-audit -- investigation data + architect recommendations}

CONTEXT:
- Vision: {vision.md relevant sections}
- Preferences: {preferences.md}

Your job: Propose a concrete approach for this directive. Not "endorse or challenge" -- actually design HOW to solve this. Ground your proposal in the audit findings above.

{auditor_instruction -- include ONLY for the auditor agent}
As the auditor, ground your proposal in codebase reality. Reference specific files, patterns, and baselines from the audit findings. Flag any approaches that sound good in theory but would conflict with the actual codebase structure.
{/auditor_instruction}

{challenge_instruction -- include ONLY for heavyweight/strategic directives}
CHALLENGE THIS DIRECTIVE: Before proposing your approach, critically evaluate whether this directive should proceed as stated. Consider:
- Is the scope appropriate or over/under-scoped?
- Are there simpler alternatives the CEO may not have considered?
- What are the top 3 risks if we proceed?
- Does this conflict with existing architectural patterns found in the audit?
Include your challenge assessment in the "challenge" field below. If you believe the directive should proceed as-is, state that explicitly with reasoning.
{/challenge_instruction}

{
  "agent": "{name}",
  "challenge": "Your critical assessment of the directive itself -- risks, scope concerns, alternatives. Required for heavyweight/strategic, omit for other weights.",
  "approach": "Your recommended approach in 3-5 sentences -- be specific about what to build/change and in what order",
  "tradeoffs": ["Key trade-off 1", "Key trade-off 2"],
  "avoid": "What approach you'd explicitly NOT take and why",
  "confidence": "high | medium | low -- how certain are you this is the right approach?",
  "feasibility_flags": ["Any codebase constraints or existing patterns that affect this approach -- auditor fills this, others may leave empty"]
}

CRITICAL: First character `{`, last `}`. JSON only.
```

## Phase 2: Deliberation Round (Strategic Directives ONLY)

**This phase fires ONLY for strategic directives. Skip entirely for heavyweight.**

After collecting all initial proposals, share them with each agent and ask for one rebuttal. Each agent sees all proposals and writes one targeted critique.

```
You are {Name}, {Title}. You proposed an approach for this directive. Now review all proposals and write ONE rebuttal.

YOUR PROPOSAL:
{this agent's Phase 1 output}

ALL PROPOSALS:
{all Phase 1 outputs from all agents, including yours}

Write ONE rebuttal targeting the proposal you most disagree with. Be specific: what's wrong with it, what they missed, and what would happen if we followed their approach.

{
  "agent": "{name}",
  "target_agent": "name of the agent whose proposal you're rebutting",
  "critique": "What's wrong with their approach — be specific about what they missed or got wrong",
  "alternative": "What should be done instead, referencing your original proposal or a new variation"
}

CRITICAL: First character `{`, last `}`. JSON only.
```

## Synthesis

After collecting proposals (and rebuttals for strategic), the orchestrator synthesizes:
- **Heavyweight**: Synthesize proposals and challenge assessments. Identify convergence points, key disagreements, and any directive-level concerns raised in the challenge fields. Write synthesis to brainstorm.md. Extract CEO clarification questions if challenge assessments raised unresolved concerns.
- **Strategic**: Synthesize proposals, challenge assessments, AND rebuttals. Identify which critiques landed, which proposals survived challenge, and whether any agent recommended modifying the directive scope. Extract 2-3 CEO clarification questions from unresolved disagreements. Write synthesis to brainstorm.md.
