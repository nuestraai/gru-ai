export interface Team {
  name: string;
  description: string;
  members: TeamMember[];
  createdAt: string;
  leadAgentId: string;
  leadSessionId: string;
  stale: boolean;
}

export interface TeamMember {
  name: string;
  agentId: string;
  agentType: string;
  model: string;
  tmuxPaneId: string;
  cwd: string;
  color: string;
  isActive: boolean;
  backendType: string;
  joinedAt: string;
}

export interface TeamTask {
  id: string;
  subject: string;
  description: string;
  activeForm: string;
  status: 'pending' | 'in_progress' | 'completed';
  owner: string;
  blocks: string[];
  blockedBy: string[];
}

export interface Session {
  id: string;
  project: string;
  projectDir: string;
  status: 'working' | 'waiting-approval' | 'waiting-input' | 'done' | 'paused' | 'idle' | 'error';
  lastActivity: string;
  feature?: string;
  model?: string;
  cwd?: string;
  gitBranch?: string;
  version?: string;
  slug?: string;
  initialPrompt?: string;
  latestPrompt?: string;
  tasksId?: string;
  paneId?: string;
  terminalApp?: 'iterm2' | 'warp' | 'terminal' | 'tmux' | 'unknown';
  isSubagent: boolean;
  parentSessionId?: string;
  agentId?: string;
  agentName?: string;
  agentRole?: string;
  subagentIds: string[];
  fileSize: number;
  /** True when a subagent has error/waiting status that needs parent attention */
  subagentAttention?: boolean;
  /** Names of active subagents (propagated from working parent) */
  activeSubagentNames?: string[];
}

export interface ProjectGroup {
  name: string;
  dirName: string;
  sessions: Session[];
}

export interface HookEvent {
  id: string;
  type: string;
  sessionId: string;
  timestamp: string;
  message: string;
  project?: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationConfig {
  macOS: boolean;
  browser: boolean;
}

export interface SendInputRequest {
  paneId: string;
  input: string;
  type: 'approve' | 'reject' | 'abort' | 'text';
}

export interface SessionActivity {
  sessionId: string;
  tool?: string;
  detail?: string;
  thinking?: boolean;
  model?: string;
  lastSeen: string;
  active: boolean;
}

export interface DirectiveProjectTask {
  title: string;
  status: string;
  agent?: string;
  dod?: Array<{ criterion: string; met: boolean }>;
}

export interface DirectiveProject {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'failed';
  phase: 'audit' | 'design' | 'build' | 'review' | null;
  totalTasks?: number;
  completedTasks?: number;
  tasks?: DirectiveProjectTask[];
}

export type PipelineStepStatus = 'pending' | 'active' | 'completed' | 'skipped' | 'failed';

export interface PipelineStep {
  id: string;
  label: string;
  status: PipelineStepStatus;
  artifacts?: Record<string, string>;
  /** Whether this step needs CEO action (e.g. approval) */
  needsAction?: boolean;
  /** ISO timestamp when this step started (for elapsed time) */
  startedAt?: string;
}

export interface DirectiveState {
  directiveName: string;
  title?: string;
  status: 'in_progress' | 'awaiting_completion' | 'completed' | 'failed';
  totalProjects: number;
  currentProject: number;
  currentPhase: string;
  projects: DirectiveProject[];
  startedAt: string;
  lastUpdated: string;
  pipelineSteps?: PipelineStep[];
  currentStepId?: string;
  weight?: string;
  category?: string;
  triageRationale?: string;
  approvalStatus?: string;
  brainstormSummary?: string;
  planSummary?: string;
  brainstormContent?: string;
  directiveBrief?: string;
}

export interface DashboardState {
  teams: Team[];
  sessions: Session[];
  projects: ProjectGroup[];
  tasksByTeam: Record<string, TeamTask[]>;
  tasksBySession: Record<string, TeamTask[]>;
  events: HookEvent[];
  sessionActivities: Record<string, SessionActivity>;
  directiveState: DirectiveState | null;
  directiveHistory: DirectiveState[];
  activeDirectives: DirectiveState[];
  lastUpdated: string;
}

// --- Insights types ---

export interface StatsCache {
  version: number;
  lastComputedDate: string;
  dailyActivity: DailyActivity[];
  dailyModelTokens: { date: string; tokensByModel: Record<string, number> }[];
  modelUsage: Record<string, ModelUsageEntry>;
  totalSessions: number;
  totalMessages: number;
  longestSession: { sessionId: string; duration: number; messageCount: number; timestamp: string };
  firstSessionDate: string;
  hourCounts: Record<string, number>;
  totalSpeculationTimeSavedMs: number;
}

export interface DailyActivity {
  date: string;
  messageCount: number;
  sessionCount: number;
  toolCallCount: number;
}

export interface ModelUsageEntry {
  inputTokens: number;
  outputTokens: number;
  cacheReadInputTokens: number;
  cacheCreationInputTokens: number;
  webSearchRequests: number;
  costUSD: number;
  contextWindow: number;
  maxOutputTokens: number;
}

export interface PromptEntry {
  display: string;
  timestamp: number;
  project: string;
  sessionId: string;
}

export interface PlanEntry {
  slug: string;
  title: string;
  content: string;
  modifiedAt: string;
}

export type WsMessageType =
  | 'full_state'
  | 'sessions_updated'
  | 'projects_updated'
  | 'teams_updated'
  | 'tasks_updated'
  | 'event_added'
  | 'events_updated'
  | 'session_activities_updated'
  | 'config_updated'
  | 'notification_fired'
  | 'directive_updated'
  | 'state_updated';

export interface WsMessage {
  version: 1;
  type: WsMessageType;
  payload: unknown;
}

// ---------------------------------------------------------------------------
// Work State types (mirrors server/state/work-item-types.ts for frontend)
// ---------------------------------------------------------------------------

export type WorkItemType = 'feature' | 'task' | 'backlog-item' | 'directive' | 'report' | 'discussion' | 'research';
export type LifecycleState = 'pending' | 'in_progress' | 'blocked' | 'deferred' | 'completed' | 'abandoned';
export type Priority = 'P0' | 'P1' | 'P2';

export interface BaseWorkItem {
  id: string;
  type: WorkItemType;
  title: string;
  status: LifecycleState;
  parentId?: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
}

export interface FeatureRecord extends BaseWorkItem {
  type: 'feature';
  category?: string;
  taskCount: number;
  completedTaskCount: number;
  hasSpec: boolean;
  hasDesign: boolean;
  specSummary?: string;
  repoId?: string;
  repoName?: string;
}

export interface BacklogRecord extends BaseWorkItem {
  type: 'backlog-item';
  category?: string;
  priority?: Priority;
  description?: string;
  trigger?: string;
  sourceContext?: string;
  sourceDirective?: string;
  repoId?: string;
  repoName?: string;
}

export interface ArtifactRecord extends BaseWorkItem {
  type: 'report' | 'discussion' | 'research';
  participants?: string[];
  sourceDirective?: string;
  filePath: string;
  contentSummary?: string;
}

export interface DirectiveRecord extends BaseWorkItem {
  type: 'directive';
  projects: string[];
  checkpoint?: string;
  reportPath?: string;
  // Structured fields from directive.json
  weight?: string;
  category?: string;
  producedFeatures?: string[];
  report?: string | null;
  backlogSources?: string[];
  artifacts?: string[];
}

export interface LessonRecord {
  id: string;
  title: string;
  filePath: string;
  contentSummary?: string;
  topics?: string[];
  updatedAt: string;
}

export type WorkItem = FeatureRecord | BacklogRecord | ArtifactRecord | DirectiveRecord;

export interface FeaturesState {
  generated: string;
  features: FeatureRecord[];
}

export interface BacklogsState {
  generated: string;
  items: BacklogRecord[];
}

export interface ConductorState {
  generated: string;
  directives: DirectiveRecord[];
  reports: ArtifactRecord[];
  discussions: ArtifactRecord[];
  research: ArtifactRecord[];
  lessons?: LessonRecord[];
}

export interface IndexState {
  generated: string;
  counts: {
    activeFeatures: number;
    doneFeatures: number;
    pendingTasks: number;
    completedTasks: number;
    backlogItems: number;
    directives: number;
    reports: number;
    discussions: number;
    lessons?: number;
  };
}

export interface FullWorkState {
  features: FeaturesState | null;
  backlogs: BacklogsState | null;
  conductor: ConductorState | null;
  index: IndexState | null;
}

export interface SearchResult {
  q: string;
  count: number;
  results: WorkItem[];
}

// --- Intelligence Trends types ---

export interface IntelligenceAgentStats {
  agent: string;
  domain: string;
  totalFindings: number;
  findingsByUrgency: Record<string, number>;
  findingsByType: Record<string, number>;
  proposalsSubmitted: number;
  proposalsAccepted: number;
  acceptanceRate: number;
  topProducts: string[];
}

export interface IntelligenceTopicCluster {
  topic: string;
  keywords: string[];
  mentionCount: number;
  agents: string[];
  urgencyMax: string;
  items: Array<{ id: string; title: string; agent: string; urgency: string }>;
}

export interface IntelligenceCrossScoutSignal {
  topic: string;
  agentCount: number;
  agents: string[];
  totalMentions: number;
  highestUrgency: string;
  items: Array<{ id: string; title: string; agent: string; urgency: string }>;
  strength: 'strong' | 'moderate' | 'weak';
  shouldPromote: boolean;
}

export interface IntelligenceTrendsResult {
  generated: string;
  scoutDate: string | null;
  totalFindings: number;
  totalProposals: number;
  totalAccepted: number;
  overallAcceptanceRate: number;
  agentStats: IntelligenceAgentStats[];
  topTopics: IntelligenceTopicCluster[];
  crossScoutSignals: IntelligenceCrossScoutSignal[];
  urgencyBreakdown: Record<string, number>;
  typeBreakdown: Record<string, number>;
  productHeatmap: Record<string, number>;
}
