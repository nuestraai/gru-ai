#!/usr/bin/env tsx
/**
 * Intelligence Trends & Cross-Scout Pattern Detection
 *
 * Reads scout intelligence data and computes:
 * 1. Acceptance rates per agent and per topic
 * 2. Trending themes across scout runs
 * 3. Cross-scout patterns (topics mentioned by multiple agents)
 *
 * Can be run standalone or imported by the server.
 */
export interface IntelligenceItem {
    id: string;
    type: string;
    urgency: string;
    title: string;
    source?: string;
    detail?: string;
    relevance?: string;
    products_affected?: string[];
    recommended_action?: string;
    reported_by?: string[];
    cross_references?: string[];
}
export interface ScoutOutput {
    agent: string;
    domain: string;
    scout_date: string;
    intelligence: IntelligenceItem[];
    proposed_initiatives?: Array<{
        title: string;
        priority: string;
        risk: string;
        related_intelligence?: string[];
    }>;
    summary: string;
}
export interface ProposalLogEntry {
    status: 'APPROVED' | 'REJECTED' | 'DEFERRED' | 'PROMOTED';
    title: string;
    proposedBy: string[];
    priority: string;
    risk: string;
    source: string;
    ceoReason?: string;
}
export interface AgentStats {
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
export interface TopicCluster {
    topic: string;
    keywords: string[];
    mentionCount: number;
    agents: string[];
    urgencyMax: string;
    items: Array<{
        id: string;
        title: string;
        agent: string;
        urgency: string;
    }>;
}
export interface CrossScoutSignal {
    topic: string;
    agentCount: number;
    agents: string[];
    totalMentions: number;
    highestUrgency: string;
    items: Array<{
        id: string;
        title: string;
        agent: string;
        urgency: string;
    }>;
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
    agentStats: AgentStats[];
    topTopics: TopicCluster[];
    crossScoutSignals: CrossScoutSignal[];
    urgencyBreakdown: Record<string, number>;
    typeBreakdown: Record<string, number>;
    productHeatmap: Record<string, number>;
}
export declare function analyzeIntelligence(projectPaths: string[]): IntelligenceTrendsResult;
