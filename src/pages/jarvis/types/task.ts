/**
 * @fileoverview Type definitions and domain models for the Jarvis Task Optimization Engine.
 * Follows strict domain modeling and TSDoc documentation standards.
 * @packageDocumentation
 */

/**
 * Valid discrete importance levels ranging from 1 (Trivial) to 5 (Vital).
 */
export type ImportanceLevel = 1 | 2 | 3 | 4 | 5;

/**
 * Valid discrete urgency levels ranging from 1 (Deferred) to 5 (Critical/Immediate).
 */
export type UrgencyLevel = 1 | 2 | 3 | 4 | 5;

/**
 * Valid discrete impact rating on a 1-5 scale (Output / Leverage).
 */
export type ImpactLevel = 1 | 2 | 3 | 4 | 5;

/**
 * Valid discrete effort rating on a 1-5 scale (Friction / Resource Consumption).
 */
export type EffortLevel = 1 | 2 | 3 | 4 | 5;

/**
 * Cognitive strain classification evaluating mental bandwidth requirements.
 */
export type CognitiveStrainLevel = "LOW" | "MODERATE" | "HIGH" | "EXTREME";

/**
 * Organizational priority categories according to the Eisenhower distribution.
 */
export type PriorityQuadrant =
  | "DO_FIRST" // Urgent & Important (Q1)
  | "SCHEDULE" // Not Urgent, but Important (Q2)
  | "DELEGATE_RUSH" // Urgent, but Low Importance (Q3)
  | "DE_PRIORITIZE"; // Neither Urgent nor Important (Q4)

/**
 * Action Priority quadrants according to the Impact-Effort matrix.
 */
export type ImpactEffortQuadrant =
  | "QUICK_WINS" // High Impact, Low Effort (Priority 1)
  | "MAJOR_PROJECTS" // High Impact, High Effort (Priority 2)
  | "FILL_INS" // Low Impact, Low Effort (Priority 3)
  | "TIME_SINKS"; // Low Impact, High Effort (Priority 4 - Avoid)

/**
 * View perspective for list sorting and matrix calculation.
 */
export type SortingViewMode =
  | "STRATEGIC"
  | "DEADLINE"
  | "MATRIX"
  | "IMPACT_EFFORT"
  | "HABITS";

/**
 * Predefined task categories with associated metadata.
 */
export type TaskCategory =
  | "Work"
  | "Personal"
  | "Strategic Life"
  | "Health"
  | "Finance"
  | "Operations"
  | "Education";

/**
 * User authentication and profile state representation.
 */
export interface UserSession {
  /** Unique identifier for the user session */
  id: string;
  /** Display name or username */
  name: string;
  /** User email if authenticated, null if guest */
  email: string | null;
  /** Guest flag denoting offline/local-only storage status */
  isGuest: boolean;
  /** ISO timestamp when the session initialized */
  createdAt: string;
}

/**
 * Canonical task entity stored in the persistence layer.
 */
export interface TaskItem {
  /** Unique RFC 4122 UUID v4 identifier */
  id: string;
  /** Core descriptive title of the task */
  title: string;
  /** Supplementary context, steps, or notes */
  notes?: string;
  /** Category taxonomy tag */
  category: TaskCategory | string;
  /** Optional Mega Task Bin / Mission Cluster tag for fast grouping */
  megaBucket?: string | null;
  /** Assessed importance rating on 1-5 scale */
  importance: ImportanceLevel;
  /** Manually selected urgency rating on 1-5 scale */
  urgency: UrgencyLevel;
  /** System-recommended urgency rating calculated from deadline proximity */
  recommendedUrgency: UrgencyLevel;
  /** Assessed impact rating on 1-5 scale */
  impact: ImpactLevel;
  /** Assessed effort rating on 1-5 scale */
  effort: EffortLevel;
  /** Target completion timestamp in ISO 8601 string format, or null */
  dueDate: string | null;
  /** Estimated duration in minutes (e.g., 15, 30, 45, 60, 90, 120, 240) */
  estimatedDurationMinutes?: number;
  /** Accumulated logged focus time in seconds */
  actualDurationSeconds?: number;
  /** Cognitive strain level assessment */
  cognitiveStrain?: CognitiveStrainLevel;
  /** Flag denoting urgency escalation daemon detection (stale Q2 task) */
  isEscalated?: boolean;
  /** Timestamp of most recent focus work session */
  lastWorkedAt?: string | null;
  /** Completion flag */
  isCompleted: boolean;
  /** Timestamp when completed */
  completedAt: string | null;
  /** Creation timestamp in ISO 8601 */
  createdAt: string;
  /** Last updated timestamp in ISO 8601 */
  updatedAt: string;
  /** Soft delete tombstone flag ensuring permanent deletion persistence */
  isDeleted?: boolean;
  /** Flag denoting whether this task originates from an active recurring habit */
  isHabit?: boolean;
  /** Originating habit UUID if this is a recurring habit */
  habitId?: string;
  /** Current active recurrence period key (e.g. "2026-09-29") */
  habitPeriodKey?: string;
  /** Habit recurrence frequency definition */
  habitFrequency?: "DAILY" | "WEEKDAYS" | "WEEKLY" | "MONTHLY" | "CUSTOM_DAYS";
  /** Current streak count inherited from the parent habit */
  habitStreak?: number;
  /** Total lifetime completions of the parent habit */
  habitTotalCompletions?: number;
}

/**
 * Definition structure for the 1-5 Importance rating scale.
 */
export interface ImportanceDefinition {
  level: ImportanceLevel;
  title: string;
  description: string;
  badgeColor: string;
  accentColor: string;
}

/**
 * Definition structure for the 1-5 Urgency rating scale.
 */
export interface UrgencyDefinition {
  level: UrgencyLevel;
  title: string;
  timeWindowDescription: string;
  badgeColor: string;
  accentColor: string;
}

/**
 * Definition structure for the 1-5 Impact rating scale.
 */
export interface ImpactDefinition {
  level: ImpactLevel;
  title: string;
  description: string;
  badgeColor: string;
}

/**
 * Definition structure for the 1-5 Effort rating scale.
 */
export interface EffortDefinition {
  level: EffortLevel;
  title: string;
  description: string;
  badgeColor: string;
}

/**
 * Alert priority classification tier.
 */
export type AlertTier = "CRITICAL" | "TRANSIENT" | "INLINE";

/**
 * System guidance tooltip message definition.
 */
export interface GuidanceBubble {
  id: string;
  title: string;
  message: string;
  variant: "info" | "warning" | "tip" | "offline";
  tier?: AlertTier;
  /** Auto-dismiss duration in milliseconds (if applicable) */
  autoDismissMs?: number;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * Workload distribution calculation result for cognitive telemetry.
 */
export interface WorkloadDistribution {
  totalActive: number;
  q1Count: number;
  q2Count: number;
  q3Count: number;
  q4Count: number;
  highEffortCount: number;
  estimatedHoursRemaining: number;
  cognitiveCapacityRatio: number; // 0 to 1
  overloadState: "OPTIMAL" | "FOCUSED" | "ELEVATED" | "HIGH_CAPACITY";
  advisoryMessage: string;
}
