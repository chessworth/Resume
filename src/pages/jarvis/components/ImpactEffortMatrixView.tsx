/**
 * @fileoverview 2x2 Impact vs Effort (Action Priority) Matrix layout.
 * Visualizes tasks across Quick Wins (P1), Major Projects (P2),
 * Fill-Ins (P3), and Time Sinks (P4) with discrete quadrant and continuous Cartesian modes.
 * @packageDocumentation
 */

import React, { useState } from 'react';
import { TaskCard } from './TaskCard';
import { CartesianScatterCanvas } from './CartesianScatterCanvas';
import { TaskItem, ImpactEffortQuadrant } from '../types/task';
import { partitionIntoImpactEffortQuadrants, getImpactEffortMetadata } from '../services/priorityEngine';
import { Sparkles, Trophy, Shuffle, AlertOctagon, LayoutGrid, Move } from 'lucide-react';

interface ImpactEffortMatrixViewProps {
  tasks: TaskItem[];
  onToggleComplete: (id: string, isCompleted: boolean) => void;
  onEdit: (task: TaskItem) => void;
  onDelete: (id: string) => void;
  onFocusTask?: (task: TaskItem) => void;
  onAiGuide?: (task: TaskItem) => void;
  onTriggerBurst?: (x: number, y: number) => void;
  onUpdateTaskCoords?: (taskId: string, coords: { x: number; y: number }) => void;
}

export const ImpactEffortMatrixView: React.FC<ImpactEffortMatrixViewProps> = ({
  tasks,
  onToggleComplete,
  onEdit,
  onDelete,
  onFocusTask,
  onAiGuide,
  onTriggerBurst,
  onUpdateTaskCoords
}) => {
  const [subView, setSubView] = useState<'QUADRANTS' | 'CARTESIAN'>('QUADRANTS');
  const quadrants = partitionIntoImpactEffortQuadrants(tasks);

  const getVisuals = (quadrant: ImpactEffortQuadrant) => {
    switch (quadrant) {
      case 'QUICK_WINS':
        return {
          icon: <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
          containerBg: 'bg-gradient-to-br from-emerald-50/70 via-white to-white dark:from-emerald-950/20 dark:via-slate-900/60 dark:to-slate-900/40',
          borderColor: 'border-emerald-200/90 dark:border-emerald-900/40 hover:border-emerald-300 dark:hover:border-emerald-700/60',
          iconBox: 'bg-emerald-100 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800'
        };
      case 'MAJOR_PROJECTS':
        return {
          icon: <Trophy className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />,
          containerBg: 'bg-gradient-to-br from-indigo-50/70 via-white to-white dark:from-indigo-950/20 dark:via-slate-900/60 dark:to-slate-900/40',
          borderColor: 'border-indigo-200/90 dark:border-indigo-900/40 hover:border-indigo-300 dark:hover:border-indigo-700/60',
          iconBox: 'bg-indigo-100 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800'
        };
      case 'FILL_INS':
        return {
          icon: <Shuffle className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
          containerBg: 'bg-gradient-to-br from-amber-50/70 via-white to-white dark:from-amber-950/20 dark:via-slate-900/60 dark:to-slate-900/40',
          borderColor: 'border-amber-200/90 dark:border-amber-900/40 hover:border-amber-300 dark:hover:border-amber-700/60',
          iconBox: 'bg-amber-100 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800'
        };
      case 'TIME_SINKS':
      default:
        return {
          icon: <AlertOctagon className="w-4 h-4 text-rose-600 dark:text-rose-400" />,
          containerBg: 'bg-gradient-to-br from-rose-50/70 via-white to-white dark:from-rose-950/20 dark:via-slate-900/60 dark:to-slate-900/40',
          borderColor: 'border-rose-200/90 dark:border-rose-900/40 hover:border-rose-300 dark:hover:border-rose-700/60',
          iconBox: 'bg-rose-100 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800'
        };
    }
  };

  const quadrantOrder: ImpactEffortQuadrant[] = [
    'QUICK_WINS',
    'MAJOR_PROJECTS',
    'FILL_INS',
    'TIME_SINKS'
  ];

  return (
    <div className="space-y-4">
      {/* Sub-View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-2xl bg-white/90 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-xs backdrop-blur-md">
        <span className="text-xs font-mono font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-300 pl-1">
          ACTION PRIORITY PERSPECTIVE:
        </span>
        <div className="grid grid-cols-2 sm:flex items-center gap-1.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setSubView('QUADRANTS')}
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
              subView === 'QUADRANTS'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Grid</span>
          </button>

          <button
            type="button"
            onClick={() => setSubView('CARTESIAN')}
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
              subView === 'CARTESIAN'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Move className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Cartesian</span>
          </button>
        </div>
      </div>

      {subView === 'CARTESIAN' ? (
        <CartesianScatterCanvas
          tasks={tasks}
          mode="IMPACT_EFFORT"
          onUpdateTaskCoords={(taskId, coords) => {
            if (onUpdateTaskCoords) {
              onUpdateTaskCoords(taskId, coords);
            }
          }}
          onSelectTask={onEdit}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {quadrantOrder.map((quadrantKey) => {
            const quadrantTasks = quadrants[quadrantKey];
            const meta = getImpactEffortMetadata(quadrantKey);
            const visuals = getVisuals(quadrantKey);

            return (
              <div
                key={quadrantKey}
                className={`rounded-3xl border ${visuals.borderColor} ${visuals.containerBg} shadow-sm backdrop-blur-xl p-5 flex flex-col space-y-4 transition-all duration-300`}
              >
                {/* Quadrant Header */}
                <div className="flex items-start justify-between gap-3 border-b border-slate-200/90 dark:border-slate-800/80 pb-3.5">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`p-2 rounded-xl border ${visuals.iconBox} shadow-xs shrink-0`}
                    >
                      {visuals.icon}
                    </div>
                    <div>
                      <h2 className="text-xs font-bold font-mono text-slate-950 dark:text-white uppercase tracking-wider flex items-center gap-2">
                        <span>{meta.code}</span>
                        <span className="text-slate-600 dark:text-slate-400 font-semibold lowercase">
                          — {meta.title}
                        </span>
                      </h2>
                      <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5 font-medium leading-relaxed">
                        {meta.subtitle}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`font-mono text-xs font-extrabold px-2.5 py-1 rounded-full border shadow-2xs shrink-0 ${meta.badgeColor}`}
                  >
                    {quadrantTasks.length} items
                  </span>
                </div>

                {/* Task Stack */}
                <div className="flex-1 space-y-3">
                  {quadrantTasks.length === 0 ? (
                    <div className="py-10 text-center border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl bg-white/50 dark:bg-slate-900/30 p-4">
                      <p className="font-mono text-xs text-slate-600 dark:text-slate-400 font-medium">
                        NO ACTIVE TASKS IN THIS QUADRANT
                      </p>
                    </div>
                  ) : (
                    quadrantTasks.map((task) => (
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
