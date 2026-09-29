/**
 * @fileoverview 2x2 Eisenhower Priority Matrix spatial representation.
 * Supports both discrete 4-quadrant layout and continuous 2D Cartesian scatter canvas
 * with interactive drag-and-drop coordinate calibration.
 * @packageDocumentation
 */

import React, { useState } from 'react';
import { TaskCard } from './TaskCard';
import { CartesianScatterCanvas } from './CartesianScatterCanvas';
import { TaskItem, PriorityQuadrant, ImportanceLevel, UrgencyLevel } from '../types/task';
import { partitionIntoQuadrants, getQuadrantMetadata } from '../services/priorityEngine';
import { Zap, Calendar, FastForward, Trash2, LayoutGrid, Move } from 'lucide-react';

interface EisenhowerMatrixViewProps {
  tasks: TaskItem[];
  onToggleComplete: (id: string, isCompleted: boolean) => void;
  onEdit: (task: TaskItem) => void;
  onDelete: (id: string) => void;
  onFocusTask?: (task: TaskItem) => void;
  onAiGuide?: (task: TaskItem) => void;
  onTriggerBurst?: (x: number, y: number) => void;
  onUpdateTaskCoords?: (taskId: string, coords: { x: number; y: number }) => void;
}

export const EisenhowerMatrixView: React.FC<EisenhowerMatrixViewProps> = ({
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
  const quadrants = partitionIntoQuadrants(tasks);

  const getQuadrantVisuals = (quadrant: PriorityQuadrant) => {
    switch (quadrant) {
      case 'DO_FIRST':
        return {
          icon: <Zap className="w-4 h-4 text-rose-600 dark:text-rose-400" />,
          containerBg: 'bg-gradient-to-br from-rose-50/70 via-white to-white dark:from-rose-950/20 dark:via-slate-900/60 dark:to-slate-900/40',
          borderColor: 'border-rose-200/90 dark:border-rose-900/40 hover:border-rose-300 dark:hover:border-rose-700/60',
          iconBox: 'bg-rose-100 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800'
        };
      case 'SCHEDULE':
        return {
          icon: <Calendar className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />,
          containerBg: 'bg-gradient-to-br from-cyan-50/70 via-white to-white dark:from-cyan-950/20 dark:via-slate-900/60 dark:to-slate-900/40',
          borderColor: 'border-cyan-200/90 dark:border-cyan-900/40 hover:border-cyan-300 dark:hover:border-cyan-700/60',
          iconBox: 'bg-cyan-100 dark:bg-cyan-950/60 border-cyan-200 dark:border-cyan-800'
        };
      case 'DELEGATE_RUSH':
        return {
          icon: <FastForward className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
          containerBg: 'bg-gradient-to-br from-amber-50/70 via-white to-white dark:from-amber-950/20 dark:via-slate-900/60 dark:to-slate-900/40',
          borderColor: 'border-amber-200/90 dark:border-amber-900/40 hover:border-amber-300 dark:hover:border-amber-700/60',
          iconBox: 'bg-amber-100 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800'
        };
      case 'DE_PRIORITIZE':
      default:
        return {
          icon: <Trash2 className="w-4 h-4 text-slate-600 dark:text-slate-400" />,
          containerBg: 'bg-gradient-to-br from-slate-50 via-white to-white dark:from-slate-950/40 dark:via-slate-900/60 dark:to-slate-900/40',
          borderColor: 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700',
          iconBox: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
        };
    }
  };

  const quadrantOrder: PriorityQuadrant[] = [
    'DO_FIRST',
    'SCHEDULE',
    'DELEGATE_RUSH',
    'DE_PRIORITIZE'
  ];

  return (
    <div className="space-y-4">
      {/* Sub-View Switcher: Quadrant Grid vs Continuous Cartesian Plane */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-2xl bg-white/90 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-xs backdrop-blur-md">
        <span className="text-xs font-mono font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-300 pl-1">
          EISENHOWER PERSPECTIVE:
        </span>
        <div className="grid grid-cols-2 sm:flex items-center gap-1.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setSubView('QUADRANTS')}
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
              subView === 'QUADRANTS'
                ? 'bg-cyan-600 text-white shadow-xs'
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
                ? 'bg-cyan-600 text-white shadow-xs'
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
          mode="EISENHOWER"
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
            const meta = getQuadrantMetadata(quadrantKey);
            const visuals = getQuadrantVisuals(quadrantKey);

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
