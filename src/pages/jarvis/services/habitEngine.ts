/**
 * @fileoverview Habit Engine: Recurrence evaluation, period key generation,
 * streak computation, and automated habit-to-task synchronization.
 * Adheres to modern architectural standards with comprehensive TSDoc documentation.
 * @packageDocumentation
 */

import {
  HabitItem,
  HabitFrequency,
  HabitCompletionLog,
  HabitPeriodStatus,
  HabitTelemetrySummary,
} from "../types/habit";
import { TaskItem } from "../types/task";
import { generateUUID } from "../utils/uuid";
import { getDeletedTaskIds, getDeletedHabitPeriods } from "./storageAdapter";

const STORAGE_KEY_HABITS = "jarvis_habits_v1";
const STORAGE_KEY_DELETED_HABITS = "jarvis_deleted_habit_ids_v1";
const STORAGE_KEY_HABITS_INITIALIZED = "jarvis_habits_initialized_v1";

/**
 * Retrieves set of permanently deleted habit UUIDs.
 */
export function getDeletedHabitIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DELETED_HABITS);
    if (!raw) return new Set<string>();
    const list = JSON.parse(raw);
    return new Set(Array.isArray(list) ? list : []);
  } catch {
    return new Set<string>();
  }
}

/**
 * Persists a habit UUID into the permanent tombstone deletion registry.
 */
export function recordDeletedHabitId(id: string): void {
  try {
    const set = getDeletedHabitIds();
    set.add(id);
    localStorage.setItem(
      STORAGE_KEY_DELETED_HABITS,
      JSON.stringify(Array.from(set)),
    );
  } catch (err) {
    console.warn("[HabitRepository] Failed to record deleted habit ID:", err);
  }
}
/**
 * Seed habits showcasing daily, weekday, and weekly cadences.
 */
export const SEED_HABITS: HabitItem[] = [
  {
    id: "h0100000-0000-4000-8000-000000000001",
    title: "Morning Strategic Deep Work (90m Block)",
    description:
      "Protect high-order executive focus prior to communication incoming.",
    category: "Work",
    frequency: "WEEKDAYS",
    preferredTimeOfDay: "MORNING",
    importance: 5,
    urgency: 4,
    impact: 5,
    effort: 4,
    estimatedDurationMinutes: 90,
    streak: 6,
    longestStreak: 14,
    totalCompletions: 42,
    completionHistory: [],
    archived: false,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    lastCompletedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "h0100000-0000-4000-8000-000000000002",
    title: "Daily Cardiovascular / Resistance Training",
    description:
      "Maintain baseline physical stamina and neuro-cognitive endurance.",
    category: "Health",
    frequency: "DAILY",
    preferredTimeOfDay: "AFTERNOON",
    importance: 4,
    urgency: 3,
    impact: 4,
    effort: 3,
    estimatedDurationMinutes: 45,
    streak: 4,
    longestStreak: 21,
    totalCompletions: 68,
    completionHistory: [],
    archived: false,
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    lastCompletedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "h0100000-0000-4000-8000-000000000003",
    title: "Weekly Retrospective & Task Matrix Audit",
    description:
      "Recalibrate priority quadrants, resolve stale bottlenecks, and plan trajectory.",
    category: "Strategic Life",
    frequency: "WEEKLY",
    preferredTimeOfDay: "EVENING",
    importance: 4,
    urgency: 4,
    impact: 5,
    effort: 2,
    estimatedDurationMinutes: 30,
    streak: 3,
    longestStreak: 8,
    totalCompletions: 12,
    completionHistory: [],
    archived: false,
    createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    lastCompletedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
];

/**
 * Calculates ISO 8601 week number string, e.g. "2026-W39".
 */
export function getIsoWeekString(date: Date): string {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  const weekPad = String(weekNo).padStart(2, "0");
  return `${d.getUTCFullYear()}-W${weekPad}`;
}

/**
 * Generates the deterministic period key for a given habit and date.
 */
export function getHabitPeriodKey(
  habit: HabitItem,
  targetDate: Date = new Date(),
): string {
  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, "0");
  const day = String(targetDate.getDate()).padStart(2, "0");

  switch (habit.frequency) {
    case "DAILY":
    case "WEEKDAYS":
      return `${year}-${month}-${day}`;
    case "WEEKLY":
      return getIsoWeekString(targetDate);
    case "MONTHLY":
      return `${year}-${month}`;
    case "CUSTOM_DAYS": {
      const interval = Math.max(1, habit.customIntervalDays || 2);
      const origin = new Date(habit.createdAt).getTime();
      const current = targetDate.getTime();
      const diffDays = Math.max(0, Math.floor((current - origin) / 86400000));
      const cycleIndex = Math.floor(diffDays / interval);
      return `${habit.id}-cycle-${cycleIndex}`;
    }
    default:
      return `${year}-${month}-${day}`;
  }
}

/**
 * Calculates deadline timestamp and display label for the active recurrence period.
 */
export function getHabitPeriodDeadline(
  habit: HabitItem,
  targetDate: Date = new Date(),
): { deadlineIso: string; label: string; isDueToday: boolean } {
  const d = new Date(targetDate);
  const dayOfWeek = d.getDay(); // 0 is Sunday, 6 is Saturday

  switch (habit.frequency) {
    case "DAILY": {
      const endOfDay = new Date(
        d.getFullYear(),
        d.getMonth(),
        d.getDate(),
        23,
        59,
        59,
        999,
      );
      return {
        deadlineIso: endOfDay.toISOString(),
        label: "Daily • Due Today",
        isDueToday: true,
      };
    }
    case "WEEKDAYS": {
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const endOfDay = new Date(
        d.getFullYear(),
        d.getMonth(),
        d.getDate(),
        23,
        59,
        59,
        999,
      );
      return {
        deadlineIso: endOfDay.toISOString(),
        label: isWeekend
          ? "Weekdays (Paused on Weekend)"
          : "Weekday Discipline • Due Today",
        isDueToday: !isWeekend,
      };
    }
    case "WEEKLY": {
      // Calculate next Sunday end of day
      const daysUntilSunday = (7 - (dayOfWeek === 0 ? 7 : dayOfWeek)) % 7;
      const endOfWeek = new Date(
        d.getFullYear(),
        d.getMonth(),
        d.getDate() + daysUntilSunday,
        23,
        59,
        59,
        999,
      );
      const isDueToday = daysUntilSunday === 0;
      return {
        deadlineIso: endOfWeek.toISOString(),
        label: `Weekly Cadence • Due by Sunday (${endOfWeek.toLocaleDateString(undefined, { month: "short", day: "numeric" })})`,
        isDueToday,
      };
    }
    case "MONTHLY": {
      // Calculate last day of current month
      const endOfMonth = new Date(
        d.getFullYear(),
        d.getMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      );
      return {
        deadlineIso: endOfMonth.toISOString(),
        label: `Monthly Cadence • Due by ${endOfMonth.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`,
        isDueToday: d.getDate() === endOfMonth.getDate(),
      };
    }
    case "CUSTOM_DAYS": {
      const interval = Math.max(1, habit.customIntervalDays || 2);
      const endOfPeriod = new Date(
        d.getFullYear(),
        d.getMonth(),
        d.getDate() + (interval - 1),
        23,
        59,
        59,
        999,
      );
      return {
        deadlineIso: endOfPeriod.toISOString(),
        label: `Every ${interval} Days Cadence`,
        isDueToday: true,
      };
    }
  }
}

/**
 * Checks if a habit was completed within a designated period.
 */
export function isHabitCompletedInPeriod(
  habit: HabitItem,
  periodKey: string,
): boolean {
  if (!habit.completionHistory || habit.completionHistory.length === 0) {
    return false;
  }
  return habit.completionHistory.some((log) => log.periodKey === periodKey);
}

/**
 * Evaluates the runtime period status of a habit.
 */
export function evaluateHabitPeriodStatus(
  habit: HabitItem,
  targetDate: Date = new Date(),
): HabitPeriodStatus {
  const periodKey = getHabitPeriodKey(habit, targetDate);
  const isCompleted = isHabitCompletedInPeriod(habit, periodKey);
  const deadline = getHabitPeriodDeadline(habit, targetDate);

  const matchedLog = habit.completionHistory?.find(
    (log) => log.periodKey === periodKey,
  );

  return {
    habitId: habit.id,
    periodKey,
    isCompletedInPeriod: isCompleted,
    periodDeadlineIso: deadline.deadlineIso,
    periodLabel: deadline.label,
    isDueToday: deadline.isDueToday,
    completedAt: matchedLog ? matchedLog.completedAt : null,
  };
}

/**
 * Toggles habit completion for a specific period key.
 * Updates streak, longest streak, total completions, and historical log.
 */
export function toggleHabitCompletion(
  habit: HabitItem,
  periodKey: string,
  targetDate: Date = new Date(),
): HabitItem {
  const alreadyCompleted = isHabitCompletedInPeriod(habit, periodKey);

  if (alreadyCompleted) {
    // Revert completion
    const updatedHistory = (habit.completionHistory || []).filter(
      (log) => log.periodKey !== periodKey,
    );
    const newStreak = Math.max(0, habit.streak - 1);
    const newTotal = Math.max(0, habit.totalCompletions - 1);

    return {
      ...habit,
      streak: newStreak,
      totalCompletions: newTotal,
      completionHistory: updatedHistory,
      updatedAt: new Date().toISOString(),
    };
  } else {
    // Record completion
    const newLog: HabitCompletionLog = {
      id: generateUUID(),
      habitId: habit.id,
      completedAt: new Date().toISOString(),
      periodKey,
    };

    const updatedHistory = [...(habit.completionHistory || []), newLog];
    const newStreak = habit.streak + 1;
    const newLongest = Math.max(habit.longestStreak, newStreak);
    const newTotal = habit.totalCompletions + 1;

    return {
      ...habit,
      streak: newStreak,
      longestStreak: newLongest,
      totalCompletions: newTotal,
      lastCompletedAt: newLog.completedAt,
      completionHistory: updatedHistory,
      updatedAt: new Date().toISOString(),
    };
  }
}

/**
 * Synchronizes active habit definitions into material TaskItems.
 * Ensures every active habit has exactly one corresponding task for its current recurrence window.
 * Prunes any redundant duplicate instances caused by race conditions or multiple reloads.
 */
export function syncHabitsToTasks(
  habits: HabitItem[],
  existingTasks: TaskItem[],
  targetDate: Date = new Date(),
): { updatedTasks: TaskItem[]; hasChanges: boolean; prunedTaskIds: string[] } {
  const deletedHabitIds = getDeletedHabitIds();
  const deletedTaskIds = getDeletedTaskIds();
  const deletedHabitPeriods = getDeletedHabitPeriods();

  const activeHabits = habits.filter(
    (h) => !h.archived && !h.isDeleted && !deletedHabitIds.has(h.id),
  );
  let hasChanges = false;
  const prunedTaskIds: string[] = [];
  const taskMap = new Map<string, TaskItem>();

  // Map existing tasks, pruning any tombstoned tasks or tasks whose habit was deleted
  existingTasks.forEach((t) => {
    if (
      t.isDeleted ||
      deletedTaskIds.has(t.id) ||
      (t.habitId && deletedHabitIds.has(t.habitId))
    ) {
      prunedTaskIds.push(t.id);
      hasChanges = true;
      return;
    }
    taskMap.set(t.id, { ...t });
  });

  for (const habit of activeHabits) {
    const periodKey = getHabitPeriodKey(habit, targetDate);
    const deadline = getHabitPeriodDeadline(habit, targetDate);
    const isCompleted = isHabitCompletedInPeriod(habit, periodKey);
    const matchedLog = habit.completionHistory?.find(
      (log) => log.periodKey === periodKey,
    );

    // If this recurrence window was explicitly deleted by the operator, do not create or maintain it
    if (deletedHabitPeriods.has(`${habit.id}:${periodKey}`)) {
      const matchingTasks = Array.from(taskMap.values()).filter(
        (t) =>
          Boolean(t.isHabit) &&
          t.habitId === habit.id &&
          t.habitPeriodKey === periodKey,
      );
      for (const m of matchingTasks) {
        taskMap.delete(m.id);
        prunedTaskIds.push(m.id);
        hasChanges = true;
      }
      continue;
    }

    // Find ALL tasks corresponding to this habit and active period
    const matchingTasks = Array.from(taskMap.values()).filter(
      (t) =>
        Boolean(t.isHabit) &&
        t.habitId === habit.id &&
        (t.habitPeriodKey === periodKey ||
          (!t.habitPeriodKey &&
            (!t.dueDate || t.dueDate.startsWith(periodKey.slice(0, 10))))),
    );

    let existingTask: TaskItem | undefined;
    if (matchingTasks.length > 0) {
      // Prioritize completed tasks, then latest updated timestamp
      matchingTasks.sort((a, b) => {
        if (a.isCompleted !== b.isCompleted) return a.isCompleted ? -1 : 1;
        return (
          new Date(b.updatedAt || 0).getTime() -
          new Date(a.updatedAt || 0).getTime()
        );
      });

      existingTask = matchingTasks[0];

      // Prune redundant duplicate instances to guarantee single task per habit cadence
      for (let i = 1; i < matchingTasks.length; i++) {
        const duplicateTask = matchingTasks[i];
        taskMap.delete(duplicateTask.id);
        prunedTaskIds.push(duplicateTask.id);
        hasChanges = true;
      }
    }

    if (existingTask) {
      // Synchronize completion status and streak metadata if drifted
      let taskChanged = false;

      if (
        !existingTask.habitPeriodKey ||
        existingTask.habitPeriodKey !== periodKey
      ) {
        existingTask.habitPeriodKey = periodKey;
        taskChanged = true;
      }
      if (!existingTask.isHabit) {
        existingTask.isHabit = true;
        taskChanged = true;
      }
      if (existingTask.habitId !== habit.id) {
        existingTask.habitId = habit.id;
        taskChanged = true;
      }
      if (existingTask.isCompleted !== isCompleted) {
        existingTask.isCompleted = isCompleted;
        existingTask.completedAt = isCompleted
          ? matchedLog?.completedAt || new Date().toISOString()
          : null;
        taskChanged = true;
      }
      if (existingTask.habitStreak !== habit.streak) {
        existingTask.habitStreak = habit.streak;
        taskChanged = true;
      }
      if (existingTask.habitTotalCompletions !== habit.totalCompletions) {
        existingTask.habitTotalCompletions = habit.totalCompletions;
        taskChanged = true;
      }
      if (existingTask.title !== habit.title) {
        existingTask.title = habit.title;
        taskChanged = true;
      }
      if (existingTask.category !== habit.category) {
        existingTask.category = habit.category;
        taskChanged = true;
      }
      if (existingTask.dueDate !== deadline.deadlineIso) {
        existingTask.dueDate = deadline.deadlineIso;
        taskChanged = true;
      }

      if (taskChanged) {
        existingTask.updatedAt = new Date().toISOString();
        taskMap.set(existingTask.id, existingTask);
        hasChanges = true;
      }
    } else {
      // Materialize single active task for current habit recurrence period
      const newTaskId = generateUUID();
      const newTask: TaskItem = {
        id: newTaskId,
        title: habit.title,
        notes: habit.description || `Recurring cadence: ${habit.frequency}.`,
        category: habit.category,
        megaBucket: null,
        importance: habit.importance,
        urgency: habit.urgency,
        recommendedUrgency: habit.urgency,
        impact: habit.impact,
        effort: habit.effort,
        dueDate: deadline.deadlineIso,
        estimatedDurationMinutes: habit.estimatedDurationMinutes || 30,
        actualDurationSeconds: 0,
        cognitiveStrain: "MODERATE",
        isCompleted,
        completedAt: isCompleted
          ? matchedLog?.completedAt || new Date().toISOString()
          : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isHabit: true,
        habitId: habit.id,
        habitPeriodKey: periodKey,
        habitFrequency: habit.frequency,
        habitStreak: habit.streak,
        habitTotalCompletions: habit.totalCompletions,
      };

      taskMap.set(newTaskId, newTask);
      hasChanges = true;
    }
  }

  return {
    updatedTasks: Array.from(taskMap.values()),
    hasChanges,
    prunedTaskIds,
  };
}

/**
 * Calculates portfolio-wide habit telemetry metrics.
 */
export function calculateHabitTelemetry(
  habits: HabitItem[],
  targetDate: Date = new Date(),
): HabitTelemetrySummary {
  const active = habits.filter((h) => !h.archived);
  let completedTodayCount = 0;
  let pendingTodayCount = 0;
  let bestStreak = 0;
  let totalCompletions = 0;

  active.forEach((habit) => {
    const status = evaluateHabitPeriodStatus(habit, targetDate);
    if (status.isDueToday) {
      if (status.isCompletedInPeriod) {
        completedTodayCount++;
      } else {
        pendingTodayCount++;
      }
    }
    bestStreak = Math.max(bestStreak, habit.streak, habit.longestStreak);
    totalCompletions += habit.totalCompletions;
  });

  const dueTotal = completedTodayCount + pendingTodayCount;
  const consistencyPct =
    dueTotal > 0 ? Math.round((completedTodayCount / dueTotal) * 100) : 100;

  return {
    totalHabits: habits.length,
    activeHabits: active.length,
    completedTodayCount,
    pendingTodayCount,
    overallConsistencyPercentage: consistencyPct,
    bestActiveStreak: bestStreak,
    totalHistoricalCompletions: totalCompletions,
  };
}

/**
 * Local Storage Repository Accessors for Habits.
 */
export const habitRepository = {
  fetchHabits(): HabitItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_HABITS);
      const isInitialized = localStorage.getItem(
        STORAGE_KEY_HABITS_INITIALIZED,
      );
      const deletedIds = getDeletedHabitIds();

      if (raw === null && !isInitialized) {
        localStorage.setItem(STORAGE_KEY_HABITS, JSON.stringify(SEED_HABITS));
        localStorage.setItem(STORAGE_KEY_HABITS_INITIALIZED, "true");
        return SEED_HABITS;
      }
      if (raw === null) {
        return [];
      }

      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((h) => !h.isDeleted && !deletedIds.has(h.id));
      }
    } catch {
      // Fallback to empty on parse error
    }
    return [];
  },

  saveHabits(habits: HabitItem[]): void {
    try {
      const deletedIds = getDeletedHabitIds();
      const activeHabits = habits.filter(
        (h) => !h.isDeleted && !deletedIds.has(h.id),
      );
      localStorage.setItem(STORAGE_KEY_HABITS, JSON.stringify(activeHabits));
    } catch (e) {
      console.error("[HabitRepository] Failed to save habits:", e);
    }
  },

  addHabit(habit: HabitItem): HabitItem[] {
    const current = this.fetchHabits();
    const updated = [habit, ...current];
    this.saveHabits(updated);
    return updated;
  },

  updateHabit(id: string, updates: Partial<HabitItem>): HabitItem[] {
    const current = this.fetchHabits();
    const updated = current.map((h) =>
      h.id === id
        ? { ...h, ...updates, updatedAt: new Date().toISOString() }
        : h,
    );
    this.saveHabits(updated);
    return updated;
  },

  deleteHabit(id: string): HabitItem[] {
    recordDeletedHabitId(id);
    const current = this.fetchHabits();
    const updated = current.filter((h) => h.id !== id);
    this.saveHabits(updated);
    return updated;
  },
};
