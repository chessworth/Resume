/**
 * @fileoverview Domain constants, rating scales, and recommendation formulas.
 * Includes precise importance, urgency, impact, effort, and cognitive strain scale definitions,
 * along with automatic effort calculators and urgency escalation heuristics.
 * @packageDocumentation
 */

import {
  ImportanceDefinition,
  ImportanceLevel,
  UrgencyDefinition,
  UrgencyLevel,
  ImpactDefinition,
  ImpactLevel,
  EffortDefinition,
  EffortLevel,
  CognitiveStrainLevel,
  TaskItem,
  WorkloadDistribution
} from '../types/task';

/**
 * Formal importance scale configurations.
 */
export const IMPORTANCE_DEFINITIONS: Record<ImportanceLevel, ImportanceDefinition> = {
  5: {
    level: 5,
    title: 'Vital Life Objective',
    description: 'My life will not be complete if this is not done. Absolute highest priority.',
    badgeColor: 'bg-rose-500/15 text-rose-500 border-rose-500/30',
    accentColor: 'text-rose-500'
  },
  4: {
    level: 4,
    title: 'Critical Enabler',
    description: 'Lifelong regret or necessary for the execution of a Level 5 objective.',
    badgeColor: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
    accentColor: 'text-amber-500'
  },
  3: {
    level: 3,
    title: 'Standard Operational',
    description: 'Work tasks, routine responsibilities, minor social commitments.',
    badgeColor: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
    accentColor: 'text-cyan-500'
  },
  2: {
    level: 2,
    title: 'Low Consideration',
    description: 'Entirely avoidable, but warrants minor consideration or deferred action.',
    badgeColor: 'bg-slate-500/15 text-slate-500 dark:text-slate-400 border-slate-500/30',
    accentColor: 'text-slate-400'
  },
  1: {
    level: 1,
    title: 'Incidental / Optional',
    description: 'Maybe do this, maybe do not. Negligible consequence if omitted.',
    badgeColor: 'bg-zinc-500/15 text-zinc-500 border-zinc-500/30',
    accentColor: 'text-zinc-500'
  }
};

/**
 * Formal urgency scale configurations.
 */
export const URGENCY_DEFINITIONS: Record<UrgencyLevel, UrgencyDefinition> = {
  5: {
    level: 5,
    title: 'Immediate Crisis / Critical',
    timeWindowDescription: 'Due within 24 hours or overdue. Immediate focus required.',
    badgeColor: 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30',
    accentColor: 'text-red-500'
  },
  4: {
    level: 4,
    title: 'High Velocity',
    timeWindowDescription: 'Due within 48 hours. Approaching critical threshold.',
    badgeColor: 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30',
    accentColor: 'text-orange-500'
  },
  3: {
    level: 3,
    title: 'Active Runway',
    timeWindowDescription: 'Due within 4 days. Sustained progression needed.',
    badgeColor: 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30',
    accentColor: 'text-amber-400'
  },
  2: {
    level: 2,
    title: 'Planned Horizon',
    timeWindowDescription: 'Due within 7 days. Scheduled monitoring sufficient.',
    badgeColor: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    accentColor: 'text-emerald-400'
  },
  1: {
    level: 1,
    title: 'Distant / Undated',
    timeWindowDescription: 'Beyond 7 days or no fixed deadline assigned.',
    badgeColor: 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30',
    accentColor: 'text-blue-400'
  }
};

/**
 * Formal Impact scale definitions (1 to 5).
 */
export const IMPACT_DEFINITIONS: Record<ImpactLevel, ImpactDefinition> = {
  5: {
    level: 5,
    title: 'Transformational',
    description: 'Game-changing milestone. Multiplies output across multiple systems or objectives.',
    badgeColor: 'bg-purple-500/20 text-purple-600 dark:text-purple-300 border-purple-500/30'
  },
  4: {
    level: 4,
    title: 'High Leverage',
    description: 'Substantial output. Removes bottlenecks or unlocks key subsequent workflows.',
    badgeColor: 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border-indigo-500/30'
  },
  3: {
    level: 3,
    title: 'Moderate Progress',
    description: 'Expected standard output. Fulfills ongoing operational cadence.',
    badgeColor: 'bg-blue-500/20 text-blue-600 dark:text-blue-300 border-blue-500/30'
  },
  2: {
    level: 2,
    title: 'Incremental Gain',
    description: 'Marginal enhancement. Minor localized benefit with low systemic effect.',
    badgeColor: 'bg-slate-500/20 text-slate-600 dark:text-slate-300 border-slate-500/30'
  },
  1: {
    level: 1,
    title: 'Negligible Difference',
    description: 'Nearly undetectable impact. Outcome produces negligible change.',
    badgeColor: 'bg-zinc-500/20 text-zinc-600 dark:text-zinc-400 border-zinc-500/30'
  }
};

/**
 * Formal Effort scale definitions (1 to 5).
 */
export const EFFORT_DEFINITIONS: Record<EffortLevel, EffortDefinition> = {
  5: {
    level: 5,
    title: 'Exhaustive / Major Lift (> 4h)',
    description: 'Multi-day or deep complexity. High cognitive drain and heavy resource consumption.',
    badgeColor: 'bg-rose-500/20 text-rose-600 dark:text-rose-300 border-rose-500/30'
  },
  4: {
    level: 4,
    title: 'Substantial Drag (2h - 4h)',
    description: 'Multi-step coordination and significant energy required.',
    badgeColor: 'bg-orange-500/20 text-orange-600 dark:text-orange-300 border-orange-500/30'
  },
  3: {
    level: 3,
    title: 'Standard Effort (1h - 2h)',
    description: 'Half-day or routine execution. Familiar procedures with manageable friction.',
    badgeColor: 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500/30'
  },
  2: {
    level: 2,
    title: 'Low Friction (30m - 1h)',
    description: 'Straightforward execution with minimal roadblocks.',
    badgeColor: 'bg-teal-500/20 text-teal-600 dark:text-teal-300 border-teal-500/30'
  },
  1: {
    level: 1,
    title: 'Quick Win (< 30m)',
    description: 'Near-instantaneous completion. Minimal resistance, low barrier to finish.',
    badgeColor: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/30'
  }
};

/**
 * Cognitive strain definitions describing cognitive fatigue and context-switching cost.
 */
export const COGNITIVE_STRAIN_DEFINITIONS: Record<
  CognitiveStrainLevel,
  { label: string; desc: string; color: string; scoreWeight: number }
> = {
  LOW: {
    label: 'Low / Routine',
    desc: 'Familiar, mechanical or administrative task with minimal mental resistance.',
    color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    scoreWeight: 1
  },
  MODERATE: {
    label: 'Moderate / Analytical',
    desc: 'Standard problem solving, requires focused attention and moderate reasoning.',
    color: 'text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    scoreWeight: 2
  },
  HIGH: {
    label: 'Deep / Complex Creative',
    desc: 'High architectural synthesis, new skill acquisition, or strategic creation.',
    color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30',
    scoreWeight: 3
  },
  EXTREME: {
    label: 'Exhaustive / High Stakes',
    desc: 'Novel crisis resolution, intense emotional or critical analytical load.',
    color: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/30',
    scoreWeight: 4
  }
};

/**
 * Recommended Pomodoro and Rest timing matrix based on Ultradian cycles.
 */
export const FOCUS_PRESETS = [
  { workMinutes: 90, restMinutes: 20, label: '90m Ultradian (Optimal Deep Work)' },
  { workMinutes: 60, restMinutes: 15, label: '60m Standard Block' },
  { workMinutes: 45, restMinutes: 10, label: '45m Power Sprint' },
  { workMinutes: 25, restMinutes: 5, label: '25m Classic Pomodoro' }
] as const;

/**
 * Standard categorized tags for task allocation.
 */
export const DEFAULT_TASK_CATEGORIES = [
  'Work',
  'Strategic Life',
  'Health',
  'Finance',
  'Personal',
  'Operations',
  'Education'
] as const;

/**
 * Calculates recommended urgency level dynamically from a target due date string.
 */
export function calculateRecommendedUrgency(dueDateIso: string | null): UrgencyLevel {
  if (!dueDateIso) return 1;

  const targetTime = new Date(dueDateIso).getTime();
  if (isNaN(targetTime)) return 1;

  const now = Date.now();
  const diffHours = (targetTime - now) / (1000 * 60 * 60);

  if (diffHours <= 24) return 5;
  if (diffHours <= 48) return 4;
  if (diffHours <= 96) return 3;
  if (diffHours <= 168) return 2;
  return 1;
}

/**
 * Recommends an Effort Level (1 to 5) automatically based on Estimated Duration and Cognitive Strain.
 */
export function calculateRecommendedEffort(
  durationMinutes: number,
  strain: CognitiveStrainLevel = 'MODERATE'
): EffortLevel {
  const strainScore = COGNITIVE_STRAIN_DEFINITIONS[strain]?.scoreWeight ?? 2;

  // Base score on duration
  let durationScore = 1;
  if (durationMinutes >= 240) {
    durationScore = 5;
  } else if (durationMinutes >= 120) {
    durationScore = 4;
  } else if (durationMinutes >= 60) {
    durationScore = 3;
  } else if (durationMinutes >= 30) {
    durationScore = 2;
  } else {
    durationScore = 1;
  }

  // Blended effort heuristic: 60% duration, 40% cognitive intensity
  const blended = Math.round(durationScore * 0.65 + strainScore * 0.35);
  const clamped = Math.max(1, Math.min(5, blended));
  return clamped as EffortLevel;
}

/**
 * Heuristic detector for Urgency Decay & Escalation Daemon.
 * Flags tasks with high importance that linger unattended and approach silent crisis.
 */
export function checkUrgencyEscalation(task: TaskItem): boolean {
  if (task.isCompleted) return false;
  if (task.importance < 4) return false;

  const createdTime = new Date(task.createdAt).getTime();
  if (isNaN(createdTime)) return false;

  const ageDays = (Date.now() - createdTime) / (1000 * 60 * 60 * 24);

  // If task has been uncompleted for > 3 days and has low urgency (<= 2), it is decaying/escalating
  if (ageDays >= 3 && task.urgency <= 2) {
    return true;
  }

  // If due date is within 3 days and urgency was set to low
  if (task.dueDate) {
    const dueTime = new Date(task.dueDate).getTime();
    const daysUntilDue = (dueTime - Date.now()) / (1000 * 60 * 60 * 24);
    if (daysUntilDue <= 3 && task.urgency <= 2) {
      return true;
    }
  }

  return false;
}

/**
 * Computes workload distribution and cognitive capacity without inducing stress.
 * Calming advisory provides gentle, mindful feedback.
 */
export function calculateWorkloadDistribution(tasks: TaskItem[]): WorkloadDistribution {
  const active = tasks.filter((t) => !t.isCompleted);
  const totalActive = active.length;

  let q1Count = 0;
  let q2Count = 0;
  let q3Count = 0;
  let q4Count = 0;
  let highEffortCount = 0;
  let totalEstimatedMinutes = 0;

  for (const t of active) {
    const isImp = t.importance >= 4;
    const isUrg = t.urgency >= 4;
    if (isImp && isUrg) q1Count++;
    else if (isImp && !isUrg) q2Count++;
    else if (!isImp && isUrg) q3Count++;
    else q4Count++;

    if (t.effort >= 4) highEffortCount++;
    totalEstimatedMinutes += t.estimatedDurationMinutes || 45;
  }

  const estimatedHoursRemaining = Math.round((totalEstimatedMinutes / 60) * 10) / 10;

  // Capacity calculation based on optimal daily focus allowance (~5-6 high focus units)
  const capacityUnits = q1Count * 1.5 + q2Count * 1.0 + q3Count * 0.5 + highEffortCount * 0.8;
  const cognitiveCapacityRatio = Math.min(1.0, capacityUnits / 12);

  let overloadState: WorkloadDistribution['overloadState'] = 'OPTIMAL';
  let advisoryMessage = 'Workload balanced. Sustainable cadence maintained.';

  if (capacityUnits > 10 || q1Count >= 5) {
    overloadState = 'HIGH_CAPACITY';
    advisoryMessage =
      'High Focus Zone: You have significant high-impact items. Consider scheduling or delegating routine items to protect your energy.';
  } else if (capacityUnits > 7 || q1Count >= 3) {
    overloadState = 'ELEVATED';
    advisoryMessage =
      'Active Runway: Prioritize Q1 essentials first, then enter a deep work block for Q2 objectives.';
  } else if (capacityUnits > 4) {
    overloadState = 'FOCUSED';
    advisoryMessage = 'In the Groove: Good distribution between strategic goals and near-term tasks.';
  }

  return {
    totalActive,
    q1Count,
    q2Count,
    q3Count,
    q4Count,
    highEffortCount,
    estimatedHoursRemaining,
    cognitiveCapacityRatio,
    overloadState,
    advisoryMessage
  };
}
