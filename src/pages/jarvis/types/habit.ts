/**
 * @fileoverview Domain types and interface specifications for Jarvis Recurring Habits.
 * Defines cadence intervals, completion tracking logs, streak calculations,
 * and habit-to-task synchronization contracts.
 * @packageDocumentation
 */

import {
  ImportanceLevel,
  UrgencyLevel,
  ImpactLevel,
  EffortLevel,
  TaskCategory,
} from "./task";

/**
 * Supported recurrence cadences for habits.
 */
export type HabitFrequency =
  | "DAILY" // Every calendar day
  | "WEEKDAYS" // Monday through Friday
  | "WEEKLY" // Once per calendar week
  | "MONTHLY" // Once per calendar month
  | "CUSTOM_DAYS"; // Every N days

/**
 * Recommended time-of-day execution preference.
 */
export type HabitTimeOfDay = "ANYTIME" | "MORNING" | "AFTERNOON" | "EVENING";

/**
 * Historical immutable record of a single completed habit recurrence period.
 */
export interface HabitCompletionLog {
  /** RFC 4122 UUID v4 identifier */
  id: string;
  /** Foreign key pointing to parent HabitItem */
  habitId: string;
  /** ISO 8601 timestamp when completion was registered */
  completedAt: string;
  /** Deterministic period identifier, e.g. "2026-09-29" or "2026-W39" */
  periodKey: string;
  /** Optional completion note or reflection */
  notes?: string;
}

/**
 * Definitive Habit entity persisted across user sessions.
 */
export interface HabitItem {
  /** Unique RFC 4122 UUID v4 identifier */
  id: string;
  /** Descriptive name of the habit discipline */
  title: string;
  /** Rationale, behavioral trigger, or routine instructions */
  description?: string;
  /** Categorical taxonomy */
  category: TaskCategory | string;
  /** Recurrence cadence frequency */
  frequency: HabitFrequency;
  /** Interval in days if frequency is CUSTOM_DAYS (e.g., 2 for every other day) */
  customIntervalDays?: number;
  /** Chronobiological execution window */
  preferredTimeOfDay?: HabitTimeOfDay;
  /** Default importance rating applied when materialized into active tasks */
  importance: ImportanceLevel;
  /** Default urgency rating applied when materialized into active tasks */
  urgency: UrgencyLevel;
  /** Default impact rating (1-5 leverage scale) */
  impact: ImpactLevel;
  /** Default effort rating (1-5 friction scale) */
  effort: EffortLevel;
  /** Estimated duration in minutes for each execution */
  estimatedDurationMinutes?: number;
  /** Current unbroken streak of completed recurrence periods */
  streak: number;
  /** Highest lifetime streak achieved */
  longestStreak: number;
  /** Total lifetime completions registered */
  totalCompletions: number;
  /** Audit log of all completed cycles */
  completionHistory: HabitCompletionLog[];
  /** Flag denoting whether the habit is actively monitored */
  archived: boolean;
  /** Creation timestamp in ISO 8601 */
  createdAt: string;
  /** Last update timestamp in ISO 8601 */
  updatedAt: string;
  /** Timestamp of most recent completion */
  lastCompletedAt?: string | null;
}

/**
 * Evaluated runtime state of a habit relative to the current recurrence window.
 */
export interface HabitPeriodStatus {
  habitId: string;
  periodKey: string;
  isCompletedInPeriod: boolean;
  periodDeadlineIso: string;
  periodLabel: string;
  isDueToday: boolean;
  completedAt: string | null;
}

/**
 * Telemetry metrics for habit consistency across the entire portfolio.
 */
export interface HabitTelemetrySummary {
  totalHabits: number;
  activeHabits: number;
  completedTodayCount: number;
  pendingTodayCount: number;
  overallConsistencyPercentage: number;
  bestActiveStreak: number;
  totalHistoricalCompletions: number;
}
