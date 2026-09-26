/**
 * @fileoverview Individual interactive task card item.
 * Features fluid hover animations, dynamic colorful glow states,
 * velocity completion micro-interaction bursts, focus mode triggers,
 * and clear visual badges for Mega Task Bins and urgency decay escalation.
 * @packageDocumentation
 */

import React, { useState } from 'react';
import {
  Check,
  Calendar,
  Clock,
  Sparkles,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Tag,
  AlertCircle,
  Zap,
  Gauge,
  Star,
  BrainCircuit,
  Target,
  Flame,
  Layers
} from 'lucide-react';
import { TaskItem } from '../types/task';
import {
  IMPORTANCE_DEFINITIONS,
  URGENCY_DEFINITIONS,
  IMPACT_DEFINITIONS,
  EFFORT_DEFINITIONS,
  COGNITIVE_STRAIN_DEFINITIONS
} from '../constants/definitions';
import {
  classifyQuadrant,
  getQuadrantMetadata,
  classifyImpactEffortQuadrant,
  getImpactEffortMetadata
} from '../services/priorityEngine';

interface TaskCardProps {
  task: TaskItem;
  onToggleComplete: (id: string, isCompleted: boolean) => void;
  onEdit: (task: TaskItem) => void;
  onDelete: (id: string) => void;
  onFocusTask?: (task: TaskItem) => void;
  onTriggerBurst?: (x: number, y: number) => void;
}

function formatDeadline(isoString: string | null): { text: string; isOverdue: boolean; isCritical: boolean } {
  if (!isoString) return { text: 'No deadline', isOverdue: false, isCritical: false };

  const target = new Date(isoString).getTime();
  const now = Date.now();
  const diffHours = (target - now) / (1000 * 60 * 60);

  if (diffHours < 0) {
    const overdueHours = Math.abs(Math.round(diffHours));
    if (overdueHours < 24) {
      return { text: `Overdue by ${overdueHours}h`, isOverdue: true, isCritical: true };
    }
    const overdueDays = Math.ceil(overdueHours / 24);
    return { text: `Overdue by ${overdueDays}d`, isOverdue: true, isCritical: true };
  }

  if (diffHours <= 24) {
    return { text: `Due in ${Math.round(diffHours)}h`, isOverdue: false, isCritical: true };
  }

  const diffDays = Math.ceil(diffHours / 24);
  if (diffDays <= 7) {
    return { text: `Due in ${diffDays}d`, isOverdue: false, isCritical: false };
  }

  return {
    text: new Date(isoString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    isOverdue: false,
    isCritical: false
  };
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
  onFocusTask,
  onTriggerBurst
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const quadrant = classifyQuadrant(task);
  const qMeta = getQuadrantMetadata(quadrant);
  const ieQuadrant = classifyImpactEffortQuadrant(task);
  const ieMeta = getImpactEffortMetadata(ieQuadrant);

  const impDef = IMPORTANCE_DEFINITIONS[task.importance];
  const urgDef = URGENCY_DEFINITIONS[task.urgency];
  const impactDef = IMPACT_DEFINITIONS[task.impact ?? 3];
  const effortDef = EFFORT_DEFINITIONS[task.effort ?? 3];
  const deadlineInfo = formatDeadline(task.dueDate);

  const getQuadrantAccent = () => {
    switch (quadrant) {
      case 'DO_FIRST':
        return {
          bar: 'bg-rose-500 shadow-rose-500/40',
          hoverBorder: 'hover:border-rose-400 dark:hover:border-rose-500/80',
          hoverGlow: 'hover:shadow-rose-500/15'
        };
      case 'SCHEDULE':
        return {
          bar: 'bg-cyan-500 shadow-cyan-500/40',
          hoverBorder: 'hover:border-cyan-400 dark:hover:border-cyan-500/80',
          hoverGlow: 'hover:shadow-cyan-500/15'
        };
      case 'DELEGATE_RUSH':
        return {
          bar: 'bg-amber-500 shadow-amber-500/40',
          hoverBorder: 'hover:border-amber-400 dark:hover:border-amber-500/80',
          hoverGlow: 'hover:shadow-amber-500/15'
        };
      case 'DE_PRIORITIZE':
      default:
        return {
          bar: 'bg-slate-400 dark:bg-slate-600',
          hoverBorder: 'hover:border-slate-400 dark:hover:border-slate-600',
          hoverGlow: 'hover:shadow-slate-500/10'
        };
    }
  };

  const accent = getQuadrantAccent();

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!task.isCompleted && onTriggerBurst) {
      onTriggerBurst(e.clientX, e.clientY);
    }
    onToggleComplete(task.id, !task.isCompleted);
  };

  const loggedMinutes = Math.round((task.actualDurationSeconds || 0) / 60);

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', task.id);
      }}
      className={`group relative rounded-3xl transition-all duration-300 ${accent.hoverBorder} ${accent.hoverGlow} ${
        task.isCompleted
          ? 'bg-slate-100/70 dark:bg-slate-900/40 opacity-70 border border-slate-200 dark:border-slate-800/80'
          : task.isEscalated
          ? 'bg-white/95 dark:bg-slate-900/90 shadow-md border-2 border-amber-500/80 ring-2 ring-amber-500/20'
          : 'bg-white/95 dark:bg-slate-900/90 shadow-sm hover:shadow-xl hover:-translate-y-0.5 border border-slate-200/90 dark:border-slate-800'
      }`}
    >
      {/* Dynamic Left Edge Indicator Bar */}
      <div
        className={`absolute left-0 top-3 bottom-3 w-1.5 rounded-r-full shadow-sm transition-all duration-300 ${accent.bar}`}
      />

      <div className="p-4 sm:p-5 pl-5 sm:pl-6 space-y-3">
        {/* Top Badges & Taxonomy Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Category */}
            <span className="font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
              <Tag className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
              {task.category}
            </span>

            {/* Mega Task Bin / Mission Cluster */}
            {task.megaBucket && (
              <span className="font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                <Layers className="w-3 h-3 text-indigo-500" />
                {task.megaBucket}
              </span>
            )}

            {/* Urgency Decay Daemon Escalation Warning */}
            {task.isEscalated && (
              <span className="font-mono text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/40 flex items-center gap-1 animate-pulse">
                <Flame className="w-3 h-3 text-amber-500" />
                STALE Q2 - ESCALATING
              </span>
            )}

            {/* Eisenhower Quadrant Pill */}
            <span
              className={`font-mono text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${qMeta.badgeColor}`}
            >
              {qMeta.code}
            </span>

            {/* Impact-Effort Matrix Pill */}
            <span
              className={`font-mono text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${ieMeta.badgeColor}`}
            >
              {ieMeta.code}
            </span>
          </div>

          {/* Quick Actions (Focus, Edit, Delete) */}
          <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
            {onFocusTask && !task.isCompleted && (
              <button
                type="button"
                onClick={() => onFocusTask(task)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-cyan-50 dark:bg-cyan-950/50 hover:bg-cyan-500 hover:text-white text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 text-[11px] font-mono font-bold transition-all cursor-pointer shadow-xs active:scale-95"
                title="Enter Focus Mode on this task"
              >
                <Target className="w-3 h-3" />
                <span>Focus</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onEdit(task)}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
              aria-label="Edit task"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => onDelete(task.id)}
              className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
              aria-label="Delete task"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Title & Completion Checkbox */}
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={handleCheckboxClick}
            className={`mt-0.5 w-6 h-6 rounded-xl border flex items-center justify-center shrink-0 transition-all cursor-pointer active:scale-90 ${
              task.isCompleted
                ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                : 'border-slate-300 dark:border-slate-700 hover:border-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-950/30'
            }`}
            aria-label={task.isCompleted ? 'Mark uncompleted' : 'Mark completed'}
          >
            {task.isCompleted && <Check className="w-4 h-4 stroke-[3]" />}
          </button>

          <div className="flex-1 min-w-0">
            <h3
              className={`text-sm sm:text-base font-bold leading-snug transition-all ${
                task.isCompleted
                  ? 'line-through text-slate-400 dark:text-slate-500'
                  : 'text-slate-950 dark:text-white'
              }`}
            >
              {task.title}
            </h3>

            {task.notes && (
              <p
                className={`text-xs text-slate-600 dark:text-slate-400 mt-1 font-sans ${
                  isExpanded ? 'whitespace-pre-line' : 'line-clamp-2'
                }`}
              >
                {task.notes}
              </p>
            )}
          </div>
        </div>

        {/* Execution Metrics (Duration, Focus Logged, Strain, Deadline) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200/80 dark:border-slate-800 text-xs font-mono">
          <div className="flex flex-wrap items-center gap-3 text-slate-600 dark:text-slate-400">
            {/* Duration & Logged */}
            <span className="flex items-center gap-1 font-medium">
              <Clock className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              {task.estimatedDurationMinutes || 45}m est
              {loggedMinutes > 0 && (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  • {loggedMinutes}m logged
                </span>
              )}
            </span>

            {/* Cognitive Strain */}
            {task.cognitiveStrain && (
              <span className="flex items-center gap-1 font-medium">
                <BrainCircuit className="w-3.5 h-3.5 text-purple-500" />
                {task.cognitiveStrain} Strain
              </span>
            )}

            {/* Deadline */}
            {task.dueDate && (
              <span
                className={`flex items-center gap-1 font-bold ${
                  deadlineInfo.isOverdue
                    ? 'text-rose-600 dark:text-rose-400 animate-pulse'
                    : deadlineInfo.isCritical
                    ? 'text-orange-600 dark:text-orange-400'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                {deadlineInfo.text}
              </span>
            )}
          </div>

          {/* Ratings Summary (IMP, URG, IMPACT, EFFORT) */}
          <div className="flex items-center gap-2 text-[11px] font-bold">
            <span className="text-rose-600 dark:text-rose-400">IMP:{task.importance}</span>
            <span className="text-orange-600 dark:text-orange-400">URG:{task.urgency}</span>
            <span className="text-indigo-600 dark:text-indigo-400">IMPCT:{task.impact ?? 3}</span>
            <span className="text-teal-600 dark:text-teal-400">EFF:{task.effort ?? 3}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
