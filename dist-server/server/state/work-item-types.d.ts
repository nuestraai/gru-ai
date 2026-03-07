/**
 * Structured work item types for the conductor state system.
 *
 * These types replace free-form markdown as the queryable source of truth.
 * The indexer (scripts/index-state.ts) reads .context/ and produces JSON
 * arrays of these records. The dashboard watches and serves them.
 */
import { z } from 'zod';
export declare const WorkItemType: z.ZodEnum<{
    feature: "feature";
    task: "task";
    "backlog-item": "backlog-item";
    directive: "directive";
    report: "report";
    discussion: "discussion";
    research: "research";
}>;
export type WorkItemType = z.infer<typeof WorkItemType>;
export declare const LifecycleState: z.ZodEnum<{
    pending: "pending";
    in_progress: "in_progress";
    completed: "completed";
    blocked: "blocked";
    deferred: "deferred";
    abandoned: "abandoned";
}>;
export type LifecycleState = z.infer<typeof LifecycleState>;
export declare const Priority: z.ZodEnum<{
    P0: "P0";
    P1: "P1";
    P2: "P2";
}>;
export type Priority = z.infer<typeof Priority>;
export declare const BaseWorkItem: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodEnum<{
        feature: "feature";
        task: "task";
        "backlog-item": "backlog-item";
        directive: "directive";
        report: "report";
        discussion: "discussion";
        research: "research";
    }>;
    title: z.ZodString;
    status: z.ZodEnum<{
        pending: "pending";
        in_progress: "in_progress";
        completed: "completed";
        blocked: "blocked";
        deferred: "deferred";
        abandoned: "abandoned";
    }>;
    parentId: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export type BaseWorkItem = z.infer<typeof BaseWorkItem>;
export declare const FeatureRecord: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    status: z.ZodEnum<{
        pending: "pending";
        in_progress: "in_progress";
        completed: "completed";
        blocked: "blocked";
        deferred: "deferred";
        abandoned: "abandoned";
    }>;
    parentId: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    type: z.ZodLiteral<"feature">;
    category: z.ZodOptional<z.ZodString>;
    taskCount: z.ZodNumber;
    completedTaskCount: z.ZodNumber;
    hasSpec: z.ZodBoolean;
    hasDesign: z.ZodBoolean;
    specSummary: z.ZodOptional<z.ZodString>;
    repoId: z.ZodOptional<z.ZodString>;
    repoName: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type FeatureRecord = z.infer<typeof FeatureRecord>;
export declare const TaskRecord: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    status: z.ZodEnum<{
        pending: "pending";
        in_progress: "in_progress";
        completed: "completed";
        blocked: "blocked";
        deferred: "deferred";
        abandoned: "abandoned";
    }>;
    parentId: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    type: z.ZodLiteral<"task">;
    featureId: z.ZodString;
    deps: z.ZodArray<z.ZodString>;
    files: z.ZodArray<z.ZodString>;
    role: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type TaskRecord = z.infer<typeof TaskRecord>;
export declare const BacklogRecord: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    status: z.ZodEnum<{
        pending: "pending";
        in_progress: "in_progress";
        completed: "completed";
        blocked: "blocked";
        deferred: "deferred";
        abandoned: "abandoned";
    }>;
    parentId: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    type: z.ZodLiteral<"backlog-item">;
    category: z.ZodOptional<z.ZodString>;
    priority: z.ZodOptional<z.ZodEnum<{
        P0: "P0";
        P1: "P1";
        P2: "P2";
    }>>;
    description: z.ZodOptional<z.ZodString>;
    trigger: z.ZodOptional<z.ZodString>;
    sourceContext: z.ZodOptional<z.ZodString>;
    sourceDirective: z.ZodOptional<z.ZodString>;
    repoId: z.ZodOptional<z.ZodString>;
    repoName: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type BacklogRecord = z.infer<typeof BacklogRecord>;
export declare const DirectiveRecord: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    status: z.ZodEnum<{
        pending: "pending";
        in_progress: "in_progress";
        completed: "completed";
        blocked: "blocked";
        deferred: "deferred";
        abandoned: "abandoned";
    }>;
    parentId: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    type: z.ZodLiteral<"directive">;
    projects: z.ZodArray<z.ZodString>;
    checkpoint: z.ZodOptional<z.ZodString>;
    reportPath: z.ZodOptional<z.ZodString>;
    weight: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    producedFeatures: z.ZodOptional<z.ZodArray<z.ZodString>>;
    report: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    backlogSources: z.ZodOptional<z.ZodArray<z.ZodString>>;
    artifacts: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export type DirectiveRecord = z.infer<typeof DirectiveRecord>;
export declare const LessonRecord: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    filePath: z.ZodString;
    contentSummary: z.ZodOptional<z.ZodString>;
    topics: z.ZodOptional<z.ZodArray<z.ZodString>>;
    updatedAt: z.ZodString;
}, z.core.$strip>;
export type LessonRecord = z.infer<typeof LessonRecord>;
export declare const ArtifactRecord: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    status: z.ZodEnum<{
        pending: "pending";
        in_progress: "in_progress";
        completed: "completed";
        blocked: "blocked";
        deferred: "deferred";
        abandoned: "abandoned";
    }>;
    parentId: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    type: z.ZodUnion<[z.ZodUnion<[z.ZodLiteral<"report">, z.ZodLiteral<"discussion">]>, z.ZodLiteral<"research">]>;
    participants: z.ZodOptional<z.ZodArray<z.ZodString>>;
    sourceDirective: z.ZodOptional<z.ZodString>;
    filePath: z.ZodString;
    contentSummary: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type ArtifactRecord = z.infer<typeof ArtifactRecord>;
export declare const WorkItem: z.ZodDiscriminatedUnion<[z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    status: z.ZodEnum<{
        pending: "pending";
        in_progress: "in_progress";
        completed: "completed";
        blocked: "blocked";
        deferred: "deferred";
        abandoned: "abandoned";
    }>;
    parentId: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    type: z.ZodLiteral<"feature">;
    category: z.ZodOptional<z.ZodString>;
    taskCount: z.ZodNumber;
    completedTaskCount: z.ZodNumber;
    hasSpec: z.ZodBoolean;
    hasDesign: z.ZodBoolean;
    specSummary: z.ZodOptional<z.ZodString>;
    repoId: z.ZodOptional<z.ZodString>;
    repoName: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    status: z.ZodEnum<{
        pending: "pending";
        in_progress: "in_progress";
        completed: "completed";
        blocked: "blocked";
        deferred: "deferred";
        abandoned: "abandoned";
    }>;
    parentId: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    type: z.ZodLiteral<"task">;
    featureId: z.ZodString;
    deps: z.ZodArray<z.ZodString>;
    files: z.ZodArray<z.ZodString>;
    role: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    status: z.ZodEnum<{
        pending: "pending";
        in_progress: "in_progress";
        completed: "completed";
        blocked: "blocked";
        deferred: "deferred";
        abandoned: "abandoned";
    }>;
    parentId: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    type: z.ZodLiteral<"backlog-item">;
    category: z.ZodOptional<z.ZodString>;
    priority: z.ZodOptional<z.ZodEnum<{
        P0: "P0";
        P1: "P1";
        P2: "P2";
    }>>;
    description: z.ZodOptional<z.ZodString>;
    trigger: z.ZodOptional<z.ZodString>;
    sourceContext: z.ZodOptional<z.ZodString>;
    sourceDirective: z.ZodOptional<z.ZodString>;
    repoId: z.ZodOptional<z.ZodString>;
    repoName: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    status: z.ZodEnum<{
        pending: "pending";
        in_progress: "in_progress";
        completed: "completed";
        blocked: "blocked";
        deferred: "deferred";
        abandoned: "abandoned";
    }>;
    parentId: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    type: z.ZodLiteral<"directive">;
    projects: z.ZodArray<z.ZodString>;
    checkpoint: z.ZodOptional<z.ZodString>;
    reportPath: z.ZodOptional<z.ZodString>;
    weight: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    producedFeatures: z.ZodOptional<z.ZodArray<z.ZodString>>;
    report: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    backlogSources: z.ZodOptional<z.ZodArray<z.ZodString>>;
    artifacts: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>, z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    status: z.ZodEnum<{
        pending: "pending";
        in_progress: "in_progress";
        completed: "completed";
        blocked: "blocked";
        deferred: "deferred";
        abandoned: "abandoned";
    }>;
    parentId: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    type: z.ZodLiteral<"report">;
    participants: z.ZodOptional<z.ZodArray<z.ZodString>>;
    sourceDirective: z.ZodOptional<z.ZodString>;
    filePath: z.ZodString;
    contentSummary: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    status: z.ZodEnum<{
        pending: "pending";
        in_progress: "in_progress";
        completed: "completed";
        blocked: "blocked";
        deferred: "deferred";
        abandoned: "abandoned";
    }>;
    parentId: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    type: z.ZodLiteral<"discussion">;
    participants: z.ZodOptional<z.ZodArray<z.ZodString>>;
    sourceDirective: z.ZodOptional<z.ZodString>;
    filePath: z.ZodString;
    contentSummary: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    status: z.ZodEnum<{
        pending: "pending";
        in_progress: "in_progress";
        completed: "completed";
        blocked: "blocked";
        deferred: "deferred";
        abandoned: "abandoned";
    }>;
    parentId: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    type: z.ZodLiteral<"research">;
    participants: z.ZodOptional<z.ZodArray<z.ZodString>>;
    sourceDirective: z.ZodOptional<z.ZodString>;
    filePath: z.ZodString;
    contentSummary: z.ZodOptional<z.ZodString>;
}, z.core.$strip>], "type">;
export type WorkItem = z.infer<typeof WorkItem>;
export declare const FeaturesState: z.ZodObject<{
    generated: z.ZodString;
    features: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        status: z.ZodEnum<{
            pending: "pending";
            in_progress: "in_progress";
            completed: "completed";
            blocked: "blocked";
            deferred: "deferred";
            abandoned: "abandoned";
        }>;
        parentId: z.ZodOptional<z.ZodString>;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
        type: z.ZodLiteral<"feature">;
        category: z.ZodOptional<z.ZodString>;
        taskCount: z.ZodNumber;
        completedTaskCount: z.ZodNumber;
        hasSpec: z.ZodBoolean;
        hasDesign: z.ZodBoolean;
        specSummary: z.ZodOptional<z.ZodString>;
        repoId: z.ZodOptional<z.ZodString>;
        repoName: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type FeaturesState = z.infer<typeof FeaturesState>;
export declare const BacklogsState: z.ZodObject<{
    generated: z.ZodString;
    items: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        status: z.ZodEnum<{
            pending: "pending";
            in_progress: "in_progress";
            completed: "completed";
            blocked: "blocked";
            deferred: "deferred";
            abandoned: "abandoned";
        }>;
        parentId: z.ZodOptional<z.ZodString>;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
        type: z.ZodLiteral<"backlog-item">;
        category: z.ZodOptional<z.ZodString>;
        priority: z.ZodOptional<z.ZodEnum<{
            P0: "P0";
            P1: "P1";
            P2: "P2";
        }>>;
        description: z.ZodOptional<z.ZodString>;
        trigger: z.ZodOptional<z.ZodString>;
        sourceContext: z.ZodOptional<z.ZodString>;
        sourceDirective: z.ZodOptional<z.ZodString>;
        repoId: z.ZodOptional<z.ZodString>;
        repoName: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type BacklogsState = z.infer<typeof BacklogsState>;
export declare const ConductorState: z.ZodObject<{
    generated: z.ZodString;
    directives: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        status: z.ZodEnum<{
            pending: "pending";
            in_progress: "in_progress";
            completed: "completed";
            blocked: "blocked";
            deferred: "deferred";
            abandoned: "abandoned";
        }>;
        parentId: z.ZodOptional<z.ZodString>;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
        type: z.ZodLiteral<"directive">;
        projects: z.ZodArray<z.ZodString>;
        checkpoint: z.ZodOptional<z.ZodString>;
        reportPath: z.ZodOptional<z.ZodString>;
        weight: z.ZodOptional<z.ZodString>;
        category: z.ZodOptional<z.ZodString>;
        producedFeatures: z.ZodOptional<z.ZodArray<z.ZodString>>;
        report: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        backlogSources: z.ZodOptional<z.ZodArray<z.ZodString>>;
        artifacts: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>>;
    reports: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        status: z.ZodEnum<{
            pending: "pending";
            in_progress: "in_progress";
            completed: "completed";
            blocked: "blocked";
            deferred: "deferred";
            abandoned: "abandoned";
        }>;
        parentId: z.ZodOptional<z.ZodString>;
        category: z.ZodOptional<z.ZodString>;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
        type: z.ZodUnion<[z.ZodUnion<[z.ZodLiteral<"report">, z.ZodLiteral<"discussion">]>, z.ZodLiteral<"research">]>;
        participants: z.ZodOptional<z.ZodArray<z.ZodString>>;
        sourceDirective: z.ZodOptional<z.ZodString>;
        filePath: z.ZodString;
        contentSummary: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    discussions: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        status: z.ZodEnum<{
            pending: "pending";
            in_progress: "in_progress";
            completed: "completed";
            blocked: "blocked";
            deferred: "deferred";
            abandoned: "abandoned";
        }>;
        parentId: z.ZodOptional<z.ZodString>;
        category: z.ZodOptional<z.ZodString>;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
        type: z.ZodUnion<[z.ZodUnion<[z.ZodLiteral<"report">, z.ZodLiteral<"discussion">]>, z.ZodLiteral<"research">]>;
        participants: z.ZodOptional<z.ZodArray<z.ZodString>>;
        sourceDirective: z.ZodOptional<z.ZodString>;
        filePath: z.ZodString;
        contentSummary: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    research: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        status: z.ZodEnum<{
            pending: "pending";
            in_progress: "in_progress";
            completed: "completed";
            blocked: "blocked";
            deferred: "deferred";
            abandoned: "abandoned";
        }>;
        parentId: z.ZodOptional<z.ZodString>;
        category: z.ZodOptional<z.ZodString>;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
        type: z.ZodUnion<[z.ZodUnion<[z.ZodLiteral<"report">, z.ZodLiteral<"discussion">]>, z.ZodLiteral<"research">]>;
        participants: z.ZodOptional<z.ZodArray<z.ZodString>>;
        sourceDirective: z.ZodOptional<z.ZodString>;
        filePath: z.ZodString;
        contentSummary: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    lessons: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        filePath: z.ZodString;
        contentSummary: z.ZodOptional<z.ZodString>;
        topics: z.ZodOptional<z.ZodArray<z.ZodString>>;
        updatedAt: z.ZodString;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export type ConductorState = z.infer<typeof ConductorState>;
export declare const IndexState: z.ZodObject<{
    generated: z.ZodString;
    counts: z.ZodObject<{
        activeFeatures: z.ZodNumber;
        doneFeatures: z.ZodNumber;
        pendingTasks: z.ZodNumber;
        completedTasks: z.ZodNumber;
        backlogItems: z.ZodNumber;
        directives: z.ZodNumber;
        reports: z.ZodNumber;
        discussions: z.ZodNumber;
        lessons: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type IndexState = z.infer<typeof IndexState>;
export interface WorkItemFilter {
    type?: WorkItemType;
    status?: LifecycleState;
    category?: string;
    q?: string;
}
/** All state loaded from .context/state/ */
export interface FullWorkState {
    features: FeaturesState | null;
    backlogs: BacklogsState | null;
    conductor: ConductorState | null;
    index: IndexState | null;
}
