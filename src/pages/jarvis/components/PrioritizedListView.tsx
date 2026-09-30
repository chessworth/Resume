/**
 * @fileoverview Sequential Prioritized Task Queue Renderer.
 * High-contrast subheaders and clear readable typography in light and dark modes.
 * @packageDocumentation
 */

import React from 'react';
import { TaskCard } from './TaskCard';
import { TaskItem } from '../types/task';
import { isHighImportance, isHighUrgency } from '../services/priorityEngine';
import { AlertCircle, Calendar, Zap, Trash2, Repeat, CheckCircle2 } from 'lucide-react';

interface PrioritizedListViewProps {
  tasks: TaskItem[];
  viewMode: 'STRATEGIC' | 'DEADLINE' | 'HABITS';
  onToggleComplete: (id: string, isCompleted: boolean) => void;
  onEdit: (task: TaskItem) => void;
  onDelete: (id: string) => void;
  onFocusTask?: (task: TaskItem) => void;
  onAiGuide?: (task: TaskItem) => void;
  onTriggerBurst?: (x: number, y: number) => void;
}

interface SectionDescriptor {
  key: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  headerBorder: string;
  badgeStyle: string;
  containerBg: string;
  filter: (t: TaskItem) => boolean;
}

export const PrioritizedListView: React.FC<PrioritizedListViewProps> = ({
  tasks,
  viewMode,
  onToggleComplete,
  onEdit,
  onDelete,
  onFocusTask,
  onAiGuide,
  onTriggerBurst
}) => {
  const getSections = (): SectionDescriptor[] => {
    if (viewMode === 'HABITS') {
      return [
        {
          key: 'pending-habits',
          title: 'PENDING HABIT CADENCES (INCOMPLETE THIS PERIOD)',
          subtitle: 'Active Recurring Disciplines Requiring Verification for Current Window',
          icon: <Repeat className="w-4 h-4 text-violet-500" />,
          headerBorder: 'border-violet-200 dark:border-violet-500/40 bg-violet-50/80 dark:bg-violet-950/20',
          badgeStyle: 'bg-violet-100 dark:bg-violet-500/20 text-violet-800 dark:text-violet-200 border-violet-300 dark:border-violet-500/40',
          containerBg: 'bg-gradient-to-b from-violet-50/30 via-white to-white dark:from-violet-950/10 dark:via-slate-900/40 dark:to-slate-900/30',
          filter: (t) => Boolean(t.isHabit && !t.isCompleted)
        },
        {
          key: 'completed-habits',
          title: 'RESOLVED HABIT CADENCES (VERIFIED COMPLETED)',
          subtitle: 'Habit Disciplines Successfully Executed in Current Recurrence Cycle',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
          headerBorder: 'border-emerald-200 dark:border-emerald-500/40 bg-emerald-50/80 dark:bg-emerald-950/20',
          badgeStyle: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-500/40',
          containerBg: 'bg-gradient-to-b from-emerald-50/30 via-white to-white dark:from-emerald-950/10 dark:via-slate-900/40 dark:to-slate-900/30',
          filter: (t) => Boolean(t.isHabit && t.isCompleted)
        }
      ];
    }

    if (viewMode === 'DEADLINE') {
      return [
        {
          key: 'urgent-important',
          title: 'IMPORTANT & URGENT',
          subtitle: 'Execute First — Direct Impact with Imminent Deadline',
          icon: <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />,
          headerBorder: 'border-rose-200 dark:border-rose-500/40 bg-rose-50/80 dark:bg-rose-950/20',
          badgeStyle: 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-500/40',
          containerBg: 'bg-gradient-to-b from-rose-50/30 via-white to-white dark:from-rose-950/10 dark:via-slate-900/40 dark:to-slate-900/30',
          filter: (t) => isHighImportance(t.importance) && isHighUrgency(t.urgency)
        },
        {
          key: 'urgent-low-imp',
          title: 'URGENT (LOW IMPORTANCE)',
          subtitle: 'Expedite / Clear Immediately — Pressing Deadline Ahead of Strategy',
          icon: <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
          headerBorder: 'border-amber-200 dark:border-amber-500/40 bg-amber-50/80 dark:bg-amber-950/20',
          badgeStyle: 'bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-500/40',
          containerBg: 'bg-gradient-to-b from-amber-50/30 via-white to-white dark:from-amber-950/10 dark:via-slate-900/40 dark:to-slate-900/30',
          filter: (t) => !isHighImportance(t.importance) && isHighUrgency(t.urgency)
        },
        {
          key: 'important-low-urg',
          title: 'IMPORTANT (LOW URGENCY)',
          subtitle: 'Schedule Strategic Execution — High Impact with Runway',
          icon: <Calendar className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />,
          headerBorder: 'border-cyan-200 dark:border-cyan-500/40 bg-cyan-50/80 dark:bg-cyan-950/20',
          badgeStyle: 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-900 dark:text-cyan-200 border-cyan-300 dark:border-cyan-500/40',
          containerBg: 'bg-gradient-to-b from-cyan-50/30 via-white to-white dark:from-cyan-950/10 dark:via-slate-900/40 dark:to-slate-900/30',
          filter: (t) => isHighImportance(t.importance) && !isHighUrgency(t.urgency)
        },
        {
          key: 'low-both',
          title: 'LOW ON BOTH',
          subtitle: 'De-prioritize — Discretionary or Incidental Actions',
          icon: <Trash2 className="w-4 h-4 text-slate-600 dark:text-slate-400" />,
          headerBorder: 'border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/40',
          badgeStyle: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700',
          containerBg: 'bg-white dark:bg-slate-900/30',
          filter: (t) => !isHighImportance(t.importance) && !isHighUrgency(t.urgency)
        }
      ];
    }

    return [
      {
        key: 'strategic-q1',
        title: 'IMPORTANT & URGENT (QUADRANT 1)',
        subtitle: 'Critical Immediate Priorities — Blocker Execution',
        icon: <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />,
        headerBorder: 'border-rose-200 dark:border-rose-500/40 bg-rose-50/80 dark:bg-rose-950/20',
        badgeStyle: 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-500/40',
        containerBg: 'bg-gradient-to-b from-rose-50/30 via-white to-white dark:from-rose-950/10 dark:via-slate-900/40 dark:to-slate-900/30',
        filter: (t) => isHighImportance(t.importance) && isHighUrgency(t.urgency)
      },
      {
        key: 'strategic-q2',
        title: 'IMPORTANT, LOW URGENCY (QUADRANT 2)',
        subtitle: 'Strategic Life & High Leverage — Protect Focus Time',
        icon: <Calendar className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />,
        headerBorder: 'border-cyan-200 dark:border-cyan-500/40 bg-cyan-50/80 dark:bg-cyan-950/20',
        badgeStyle: 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-900 dark:text-cyan-200 border-cyan-300 dark:border-cyan-500/40',
        containerBg: 'bg-gradient-to-b from-cyan-50/30 via-white to-white dark:from-cyan-950/10 dark:via-slate-900/40 dark:to-slate-900/30',
        filter: (t) => isHighImportance(t.importance) && !isHighUrgency(t.urgency)
      },
      {
        key: 'strategic-q3',
        title: 'URGENT, LOW IMPORTANCE (QUADRANT 3)',
        subtitle: 'Operational Runway / Delegate — Prevent Urgency Hijacking',
        icon: <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
        headerBorder: 'border-amber-200 dark:border-amber-500/40 bg-amber-50/80 dark:bg-amber-950/20',
        badgeStyle: 'bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-500/40',
        containerBg: 'bg-gradient-to-b from-amber-50/30 via-white to-white dark:from-amber-950/10 dark:via-slate-900/40 dark:to-slate-900/30',
        filter: (t) => !isHighImportance(t.importance) && isHighUrgency(t.urgency)
      },
      {
        key: 'strategic-q4',
        title: 'LOW IMPORTANCE & LOW URGENCY (QUADRANT 4)',
        subtitle: 'Discretionary / Incidental — Eliminate or Delay',
        icon: <Trash2 className="w-4 h-4 text-slate-600 dark:text-slate-400" />,
        headerBorder: 'border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/40',
        badgeStyle: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700',
        containerBg: 'bg-white dark:bg-slate-900/30',
        filter: (t) => !isHighImportance(t.importance) && !isHighUrgency(t.urgency)
      }
    ];
  };

  const sections = getSections();

  return (
    <div className="space-y-6">
      {sections.map((section) => {
        const matchingTasks = tasks.filter(section.filter);

        return (
          <section
            key={section.key}
            className={`rounded-3xl ${section.containerBg} backdrop-blur-md border border-slate-200/90 dark:border-slate-800/80 overflow-hidden shadow-xs`}
          >
            {/* Section Header */}
            <div className={`px-5 sm:px-6 py-4 border-b ${section.headerBorder} flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
                  {section.icon}
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-mono font-bold tracking-wider text-slate-900 dark:text-white">
                    {section.title}
                  </h3>
                  {/* High Contrast Subheader */}
                  <p className="text-xs text-slate-800 dark:text-slate-200 font-sans font-medium mt-0.5 leading-snug">
                    {section.subtitle}
                  </p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border shadow-xs ${section.badgeStyle}`}>
                {matchingTasks.length} {matchingTasks.length === 1 ? 'TASK' : 'TASKS'}
              </span>
            </div>

            {/* Task Card Container */}
            <div className="p-4 sm:p-5 space-y-3">
              {matchingTasks.length === 0 ? (
                <div className="py-8 text-center border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl">
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                    [QUEUE CLEAR FOR THIS SECTION]
                  </span>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    No active tasks currently require action here.
                  </p>
                </div>
              ) : (
                matchingTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggleComplete={onToggleComplete}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onFocusTask={onFocusTask}
                    onAiGuide={onAiGuide}
                    onTriggerBurst={onTriggerBurst}
                  />
                ))
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
};
