/**
 * @fileoverview Mega Task Bin Bar (Mission Stream & Cluster Manager).
 * Enables frictionless atomic task grouping without subtask nesting friction.
 * Supports 1-click filtering, drag-and-drop assignment targets, and aggregate mission stats.
 * @packageDocumentation
 */

import React, { useState } from 'react';
import { TaskItem } from '../types/task';
import { Layers, Plus, Folder, Sparkles, CheckCircle2, Clock } from 'lucide-react';

interface MegaTaskBinBarProps {
  tasks: TaskItem[];
  availableBuckets: string[];
  selectedBucket: string | 'ALL';
  onSelectBucket: (bucket: string | 'ALL') => void;
  onCreateBucket: (bucketName: string) => void;
  onAssignTaskToBucket: (taskId: string, bucketName: string | null) => void;
  onOpenBinSorting?: () => void;
}

export const MegaTaskBinBar: React.FC<MegaTaskBinBarProps> = ({
  tasks,
  availableBuckets,
  selectedBucket,
  onSelectBucket,
  onCreateBucket,
  onAssignTaskToBucket,
  onOpenBinSorting
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newBucketName, setNewBucketName] = useState('');

  // Compute stats per bucket
  const bucketStats = React.useMemo(() => {
    const stats: Record<string, { total: number; completed: number; focusMinutes: number }> = {};

    availableBuckets.forEach((b) => {
      stats[b] = { total: 0, completed: 0, focusMinutes: 0 };
    });

    tasks.forEach((t) => {
      if (t.megaBucket && stats[t.megaBucket]) {
        stats[t.megaBucket].total += 1;
        if (t.isCompleted) stats[t.megaBucket].completed += 1;
        stats[t.megaBucket].focusMinutes += Math.round((t.actualDurationSeconds || 0) / 60);
      }
    });

    return stats;
  }, [tasks, availableBuckets]);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newBucketName.trim()) {
      onCreateBucket(newBucketName.trim());
      setNewBucketName('');
      setIsCreating(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropOnBucket = (bucketName: string | null, e: React.DragEvent) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      onAssignTaskToBucket(taskId, bucketName);
    }
  };

  return (
    <div className="p-3 sm:p-4 rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-sm backdrop-blur-xl transition-all w-full max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-200 dark:border-slate-800 text-xs font-mono">
        <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-extrabold uppercase tracking-wider min-w-0">
          <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span className="truncate">MEGA TASK BINS // MISSIONS</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium hidden md:inline">
            Drag atomic tasks into bins to group without subtask friction • Click to filter
          </span>
          {onOpenBinSorting && (
            <button
              type="button"
              onClick={onOpenBinSorting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold shadow-xs cursor-pointer transition-all active:scale-95"
              title="Open full-screen Bin Sorting Workstation"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Sort Tasks into Bins</span>
            </button>
          )}
        </div>
      </div>

      {/* Horizontal Scrollable Bin Tabs */}
      <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1 scrollbar-thin w-full max-w-full">
        {/* ALL MISSIONS TAB */}
        <button
          type="button"
          onClick={() => onSelectBucket('ALL')}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDropOnBucket(null, e)}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-mono font-bold transition-all shrink-0 cursor-pointer ${
            selectedBucket === 'ALL'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 ring-2 ring-indigo-500/20'
              : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <Folder className="w-3.5 h-3.5" />
          <span>ALL MISSIONS</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/15 dark:bg-white/15">
            {tasks.length}
          </span>
        </button>

        {/* INDIVIDUAL BINS */}
        {availableBuckets.map((bucket) => {
          const stat = bucketStats[bucket] || { total: 0, completed: 0, focusMinutes: 0 };
          const isSelected = selectedBucket === bucket;

          return (
            <button
              key={bucket}
              type="button"
              onClick={() => onSelectBucket(bucket)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDropOnBucket(bucket, e)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-mono font-bold transition-all shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 ring-2 ring-indigo-500/20'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <Folder className="w-3.5 h-3.5 text-indigo-400" />
              <span>{bucket}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/15 dark:bg-white/15">
                {stat.total}
              </span>
              {stat.focusMinutes > 0 && (
                <span className="text-[9px] opacity-75 hidden sm:inline">
                  • {stat.focusMinutes}m focus
                </span>
              )}
            </button>
          );
        })}

        {/* CREATE NEW MEGA BIN INLINE BUTTON */}
        {isCreating ? (
          <form onSubmit={handleCreateSubmit} className="flex items-center gap-1 shrink-0">
            <input
              type="text"
              value={newBucketName}
              onChange={(e) => setNewBucketName(e.target.value)}
              placeholder="Mission Bin Name..."
              autoFocus
              className="px-3 py-1.5 rounded-xl text-xs font-mono bg-white dark:bg-slate-800 border border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white w-40"
            />
            <button
              type="submit"
              className="px-2.5 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-mono font-bold hover:bg-indigo-500 transition-colors cursor-pointer"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-2 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-mono hover:bg-slate-300 transition-colors cursor-pointer"
            >
              ✕
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-mono font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800/60 transition-colors shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>NEW MISSION BIN</span>
          </button>
        )}
      </div>
    </div>
  );
};
