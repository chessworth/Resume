/**
 * @fileoverview Algorithmic sorting and classification engine for prioritized task queues.
 * Implements deterministic multi-criteria sorting for Strategic View, Deadline View,
 * Eisenhower Matrix, and Action Priority (Impact-Effort) Matrix.
 * @packageDocumentation
 */

import {
  PriorityQuadrant,
  ImpactEffortQuadrant,
  SortingViewMode,
  TaskItem,
} from "../types/task";

/**
 * Evaluates whether an importance score is designated as "High" (>= 3).
 */
export function isHighImportance(importance: number): boolean {
  return importance >= 3;
}

/**
 * Evaluates whether an urgency score is designated as "High" (>= 3).
 */
export function isHighUrgency(urgency: number): boolean {
  return urgency >= 3;
}

/**
 * Evaluates whether an impact score is designated as "High" (>= 3).
 */
export function isHighImpact(impact: number): boolean {
  return impact >= 3;
}

/**
 * Evaluates whether an effort score is designated as "Low" (<= 2).
 */
export function isLowEffort(effort: number): boolean {
  return effort <= 2;
}

/**
 * Classifies a task into one of the four canonical Eisenhower matrix quadrants.
 *
 * @param task - Target TaskItem to evaluate
 * @returns PriorityQuadrant Designation
 */
export function classifyQuadrant(task: TaskItem): PriorityQuadrant {
  const highImp = isHighImportance(task.importance);
  const highUrg = isHighUrgency(task.urgency);

  if (highImp && highUrg) return "DO_FIRST";
  if (highImp && !highUrg) return "SCHEDULE";
  if (!highImp && highUrg) return "DELEGATE_RUSH";
  return "DE_PRIORITIZE";
}

/**
 * Classifies a task into one of the four Impact-Effort quadrants.
 * - QUICK_WINS: High Impact (>= 3) & Low Effort (<= 2) -> Priority 1
 * - MAJOR_PROJECTS: High Impact (>= 3) & High Effort (>= 3) -> Priority 2
 * - FILL_INS: Low Impact (< 3) & Low Effort (<= 2) -> Priority 3
 * - TIME_SINKS: Low Impact (< 3) & High Effort (>= 3) -> Priority 4
 */
export function classifyImpactEffortQuadrant(
  task: TaskItem,
): ImpactEffortQuadrant {
  const highImp = isHighImpact(task.impact ?? 3);
  const lowEff = isLowEffort(task.effort ?? 3);

  if (highImp && lowEff) return "QUICK_WINS";
  if (highImp && !lowEff) return "MAJOR_PROJECTS";
  if (!highImp && lowEff) return "FILL_INS";
  return "TIME_SINKS";
}

/**
 * Formatted title and descriptor for a priority quadrant.
 */
export function getQuadrantMetadata(quadrant: PriorityQuadrant) {
  switch (quadrant) {
    case "DO_FIRST":
      return {
        code: "Q1",
        title: "Urgent & Important",
        subtitle: "Execute Immediately",
        badgeColor:
          "border-rose-500/40 bg-rose-500/10 text-rose-500 dark:text-rose-400",
        dotColor: "bg-rose-500",
      };
    case "SCHEDULE":
      return {
        code: "Q2",
        title: "Important, Low Urgency",
        subtitle: "Strategic Focus & Scheduling",
        badgeColor:
          "border-cyan-500/40 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
        dotColor: "bg-cyan-500",
      };
    case "DELEGATE_RUSH":
      return {
        code: "Q3",
        title: "Urgent, Low Importance",
        subtitle: "Expedite or Delegate",
        badgeColor:
          "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400",
        dotColor: "bg-amber-500",
      };
    case "DE_PRIORITIZE":
      return {
        code: "Q4",
        title: "Low Urgency & Low Importance",
        subtitle: "Reconsider or Eliminate",
        badgeColor:
          "border-zinc-500/40 bg-zinc-500/10 text-zinc-600 dark:text-zinc-400",
        dotColor: "bg-zinc-400",
      };
  }
}

/**
 * Formatted title and descriptor for an Impact-Effort quadrant.
 */
export function getImpactEffortMetadata(quadrant: ImpactEffortQuadrant) {
  switch (quadrant) {
    case "QUICK_WINS":
      return {
        code: "P1",
        title: "Quick Wins",
        subtitle: "High Impact • Low Effort (Highest ROI)",
        badgeColor:
          "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        dotColor: "bg-emerald-500",
        accentBg: "from-emerald-500/10 to-teal-500/5",
      };
    case "MAJOR_PROJECTS":
      return {
        code: "P2",
        title: "Major Projects",
        subtitle: "High Impact • High Effort (Strategic Bets)",
        badgeColor:
          "border-indigo-500/40 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
        dotColor: "bg-indigo-500",
        accentBg: "from-indigo-500/10 to-purple-500/5",
      };
    case "FILL_INS":
      return {
        code: "P3",
        title: "Fill-Ins / Maintenance",
        subtitle: "Low Impact • Low Effort (Execute In Gaps)",
        badgeColor:
          "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400",
        dotColor: "bg-amber-500",
        accentBg: "from-amber-500/10 to-orange-500/5",
      };
    case "TIME_SINKS":
      return {
        code: "P4",
        title: "Thankless / Time Sinks",
        subtitle: "Low Impact • High Effort (Avoid or Delegate)",
        badgeColor:
          "border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400",
        dotColor: "bg-rose-500",
        accentBg: "from-rose-500/10 to-pink-500/5",
      };
  }
}

/**
 * Sorts an array of tasks deterministically based on active view mode.
 */
export function sortTasks(
  tasks: TaskItem[],
  mode: SortingViewMode,
): TaskItem[] {
  return [...tasks].sort((a, b) => {
    // Uncompleted tasks take precedence over completed tasks
    if (a.isCompleted !== b.isCompleted) {
      return a.isCompleted ? 1 : -1;
    }

    if (mode === "IMPACT_EFFORT") {
      // 0: QUICK_WINS, 1: MAJOR_PROJECTS, 2: FILL_INS, 3: TIME_SINKS
      const rankMap: Record<ImpactEffortQuadrant, number> = {
        QUICK_WINS: 0,
        MAJOR_PROJECTS: 1,
        FILL_INS: 2,
        TIME_SINKS: 3,
      };
      const rankA = rankMap[classifyImpactEffortQuadrant(a)];
      const rankB = rankMap[classifyImpactEffortQuadrant(b)];

      if (rankA !== rankB) {
        return rankA - rankB;
      }

      // Tie-breaker within quadrant: Net leverage = impact * 2 - effort
      const leverageA = (a.impact ?? 3) * 2 - (a.effort ?? 3);
      const leverageB = (b.impact ?? 3) * 2 - (b.effort ?? 3);
      if (leverageA !== leverageB) {
        return leverageB - leverageA;
      }
    } else {
      // Determine primary bucket rank based on mode
      const rankA = getBucketRank(a, mode);
      const rankB = getBucketRank(b, mode);

      if (rankA !== rankB) {
        return rankA - rankB;
      }

      // Tie-breaker within bucket: Fine-grained score
      const scoreA =
        mode === "STRATEGIC"
          ? a.importance * 10 + a.urgency
          : a.urgency * 10 + a.importance;

      const scoreB =
        mode === "STRATEGIC"
          ? b.importance * 10 + b.urgency
          : b.urgency * 10 + b.importance;

      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }
    }

    // Secondary tie-breaker: Due date ASC (earliest deadline first, undated last)
    if (a.dueDate && b.dueDate) {
      const timeDiff =
        new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      if (timeDiff !== 0) return timeDiff;
    } else if (a.dueDate && !b.dueDate) {
      return -1;
    } else if (!a.dueDate && b.dueDate) {
      return 1;
    }

    // Tertiary tie-breaker: CreatedAt ASC (older tasks before newer tasks)
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

/**
 * Computes discrete bucket rank index (0 = Highest Priority, 3 = Lowest Priority).
 */
function getBucketRank(task: TaskItem, mode: SortingViewMode): number {
  if (mode === "HABITS") {
    return task.isCompleted ? 1 : 0;
  }

  const highImp = isHighImportance(task.importance);
  const highUrg = isHighUrgency(task.urgency);

  if (mode === "DEADLINE") {
    if (highUrg && highImp) return 0;
    if (highUrg && !highImp) return 1;
    if (!highUrg && highImp) return 2;
    return 3;
  }

  // Default 'STRATEGIC' (and 'MATRIX'):
  if (highImp && highUrg) return 0;
  if (highImp && !highUrg) return 1;
  if (!highImp && highUrg) return 2;
  return 3;
}

/**
 * Partitions tasks into four distinct quadrant buckets for Eisenhower 2x2 Matrix view.
 */
export function partitionIntoQuadrants(
  tasks: TaskItem[],
): Record<PriorityQuadrant, TaskItem[]> {
  const result: Record<PriorityQuadrant, TaskItem[]> = {
    DO_FIRST: [],
    SCHEDULE: [],
    DELEGATE_RUSH: [],
    DE_PRIORITIZE: [],
  };

  tasks.forEach((task) => {
    const quadrant = classifyQuadrant(task);
    result[quadrant].push(task);
  });

  return result;
}

/**
 * Partitions tasks into four distinct quadrant buckets for Impact-Effort Matrix view.
 */
export function partitionIntoImpactEffortQuadrants(
  tasks: TaskItem[],
): Record<ImpactEffortQuadrant, TaskItem[]> {
  const result: Record<ImpactEffortQuadrant, TaskItem[]> = {
    QUICK_WINS: [],
    MAJOR_PROJECTS: [],
    FILL_INS: [],
    TIME_SINKS: [],
  };

  tasks.forEach((task) => {
    const quadrant = classifyImpactEffortQuadrant(task);
    result[quadrant].push(task);
  });

  return result;
}
