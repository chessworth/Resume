/**
 * @fileoverview Dedicated Bin Sorting & Mission Allocation Screen.
 * Provides a side-by-side or partitioned workstation displaying all un-binned atomic tasks
 * alongside all mission bins, with 1-click bucket assignment, quick creation,
 * and drag-and-drop targets so users never have to drag across long viewport heights.
 * @packageDocumentation
 */

import React, { useState } from 'react';
import { TaskItem } from '../types/task';
import {
  Layers,
  Folder,
  FolderPlus,
  ArrowRight,
  CheckCircle2,
  X,
  Sparkles,
  Tag,
  Clock,
  Plus,
  Check,
  Search,
  RotateCcw
} from 'lucide-react';
import { classifyQuadrant, getQuadrantMetadata } from '../services/priorityEngine';

interface BinSortingModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskItem[];
  availableBuckets: string[];
  onCreateBucket: (bucketName: string) => void;
  onAssignTaskToBucket: (taskId: string, bucketName: string | null) => void;
}

export const BinSortingModal: React.FC<BinSortingModalProps> = ({
  isOpen,
  onClose,
  tasks,
  availableBuckets,
  onCreateBucket,
  onAssignTaskToBucket
}) => {
  const [newBucketName, setNewBucketName] = useState('');
  const [isCreatingBucket, setIsCreatingBucket] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dragOverBucket, setDragOverBucket] = useState<string | 'UNBINNED' | null>(null);

  if (!isOpen) return null;

  const rawUnbinned = tasks.filter((t) => !t.megaBucket && !t.isCompleted);
  const rawBinned = tasks.filter((t) => Boolean(t.megaBucket) && !t.isCompleted);

  const query = searchQuery.trim().toLowerCase();

  const unbinnedTasks = rawUnbinned.filter((t) => {
    if (!query) return true;
    return (
      t.title.toLowerCase().includes(query) ||
      t.category.toLowerCase().includes(query) ||
      (t.notes && t.notes.toLowerCase().includes(query))
    );
  });

  const displayedBuckets = availableBuckets.filter((b) => {
    if (!query) return true;
    return (
      b.toLowerCase().includes(query) ||
      rawBinned.some((t) => t.megaBucket === b && t.title.toLowerCase().includes(query))
    );
  });

  const handleCreateBucketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newBucketName.trim()) {
      onCreateBucket(newBucketName.trim());
      setNewBucketName('');
      setIsCreatingBucket(false);
    }
  };

  const handleDragOver = (bucketName: string | 'UNBINNED' | null, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverBucket !== bucketName) {
      setDragOverBucket(bucketName);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverBucket(null);
  };

  const handleDropOnBucket = (bucketName: string | null, e: React.DragEvent) => {
    e.preventDefault();
    setDragOverBucket(null);
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      onAssignTaskToBucket(taskId, bucketName);
      if (selectedTaskId === taskId) {
        setSelectedTaskId(null);
      }
    }
  };

  const handleQuickAssign = (taskId: string, bucketName: string | null) => {
    onAssignTaskToBucket(taskId, bucketName);
    setSelectedTaskId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-xl overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl text-slate-900 dark:text-slate-100 overflow-hidden my-auto">
        {/* Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold font-mono text-slate-950 dark:text-white uppercase tracking-wider">
                MISSION BIN ALLOCATION & SORTING WORKSTATION
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-mono">
                Sort un-binned atomic directives into persistent mission streams
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter tasks or bins..."
                className="pl-8 pr-7 py-1.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 w-44 sm:w-56 focus:outline-hidden focus:border-indigo-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Workstation Workspace Grid */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Unassigned / Un-Binned Directives Drop Zone */}
          <div
            onDragOver={(e) => handleDragOver('UNBINNED', e)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDropOnBucket(null, e)}
            className={`lg:col-span-5 flex flex-col space-y-3 p-3.5 rounded-2xl border transition-colors ${
              dragOverBucket === 'UNBINNED'
                ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-400 ring-2 ring-amber-400/20'
                : 'bg-transparent border-transparent'
            }`}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <span className="text-xs font-mono font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-300 flex items-center gap-2">
                <span>UN-BINNED ATOMIC TASKS</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-[10px]">
                  {rawUnbinned.length}
                </span>
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                Drop here to unassign • Click to assign
              </span>
            </div>

            <div className="flex-1 space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {unbinnedTasks.length === 0 ? (
                <div className="py-16 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                  <p className="font-mono text-xs text-slate-700 dark:text-slate-300 font-bold uppercase">
                    {searchQuery ? 'NO MATCHING UN-BINNED TASKS' : 'ALL TASKS ALLOCATED TO BINS'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {searchQuery
                      ? 'Try clearing the search query.'
                      : 'Zero un-binned atomic tasks remaining in the queue.'}
                  </p>
                </div>
              ) : (
                unbinnedTasks.map((task) => {
                  const isSelected = selectedTaskId === task.id;
                  const qMeta = getQuadrantMetadata(classifyQuadrant(task));

                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', task.id);
                      }}
                      onClick={() => setSelectedTaskId(isSelected ? null : task.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/30 shadow-md'
                          : 'bg-slate-50 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1">
                        <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                          {task.category}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md border font-extrabold ${qMeta.badgeColor}`}>
                          {qMeta.code}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                        {task.title}
                      </h4>
                      {isSelected && (
                        <div className="mt-2 text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 animate-pulse">
                          <span>Target selected. Click any mission bin on the right to assign →</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Mission Bins Display & Direct Assignment */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <span className="text-xs font-mono font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-300 flex items-center gap-2">
                <span>AVAILABLE MISSION BINS</span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border border-indigo-500/30 text-[10px]">
                  {displayedBuckets.length}
                </span>
              </span>

              {/* Inline Bucket Creator */}
              {!isCreatingBucket ? (
                <button
                  type="button"
                  onClick={() => setIsCreatingBucket(true)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono font-bold bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Mission Bin</span>
                </button>
              ) : (
                <form onSubmit={handleCreateBucketSubmit} className="flex items-center gap-1">
                  <input
                    type="text"
                    value={newBucketName}
                    onChange={(e) => setNewBucketName(e.target.value)}
                    placeholder="Bin Name..."
                    autoFocus
                    className="px-2.5 py-1 rounded-xl text-xs font-mono bg-white dark:bg-slate-800 border border-indigo-400 text-slate-900 dark:text-white"
                  />
                  <button
                    type="submit"
                    className="px-2.5 py-1 rounded-xl bg-indigo-600 text-white font-mono text-xs font-bold"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreatingBucket(false)}
                    className="px-2 py-1 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs"
                  >
                    ✕
                  </button>
                </form>
              )}
            </div>

            {/* Bins Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
              {displayedBuckets.map((bucket) => {
                const assigned = rawBinned.filter((t) => t.megaBucket === bucket);
                const isOver = dragOverBucket === bucket;

                return (
                  <div
                    key={bucket}
                    onDragOver={(e) => handleDragOver(bucket, e)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDropOnBucket(bucket, e)}
                    onClick={() => {
                      if (selectedTaskId) {
                        handleQuickAssign(selectedTaskId, bucket);
                      }
                    }}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                      isOver
                        ? 'bg-indigo-100 dark:bg-indigo-950 border-indigo-500 ring-2 ring-indigo-500/40 shadow-lg scale-[1.01]'
                        : selectedTaskId
                        ? 'hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40 cursor-pointer ring-1 hover:ring-indigo-500/30'
                        : ''
                    } bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 shadow-xs`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Folder className="w-4 h-4 text-indigo-500" />
                          <h3 className="text-xs font-bold font-mono text-slate-900 dark:text-white truncate max-w-[160px]">
                            {bucket}
                          </h3>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                          {assigned.length} tasks
                        </span>
                      </div>

                      {/* Mini Preview of tasks inside */}
                      <div className="mt-3 space-y-1.5 max-h-28 overflow-y-auto pr-0.5">
                        {assigned.length === 0 ? (
                          <div className="text-[10px] font-mono text-slate-400 italic py-2 text-center">
                            Empty bin (Drop task here)
                          </div>
                        ) : (
                          assigned.slice(0, 6).map((t) => (
                            <div
                              key={t.id}
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.setData('text/plain', t.id);
                              }}
                              className="flex items-center justify-between text-[11px] font-mono p-1.5 rounded-lg bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 cursor-grab active:cursor-grabbing hover:border-indigo-400"
                            >
                              <span className="truncate max-w-[150px] font-medium">{t.title}</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAssignTaskToBucket(t.id, null);
                                }}
                                className="text-[9px] text-slate-400 hover:text-rose-500 px-1 font-bold cursor-pointer"
                                title="Unassign from this bin"
                              >
                                ✕
                              </button>
                            </div>
                          ))
                        )}
                        {assigned.length > 6 && (
                          <div className="text-[10px] font-mono text-slate-500 text-center font-bold">
                            + {assigned.length - 6} more
                          </div>
                        )}
                      </div>
                    </div>

                    {selectedTaskId && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickAssign(selectedTaskId, bucket);
                        }}
                        className="mt-3 w-full py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-mono font-bold flex items-center justify-center gap-1 shadow-xs cursor-pointer transition-colors"
                      >
                        <ArrowRight className="w-3 h-3" />
                        <span>Assign Selected Task Here</span>
                      </button>
                    )}
                  </div>
                );
              })}

              {/* Instant Create Option if search query does not match any existing bucket */}
              {query && !availableBuckets.some((b) => b.toLowerCase() === query) && (
                <div className="col-span-full p-4 rounded-2xl border-2 border-dashed border-indigo-300 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Folder className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <div>
                      <p className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                        Mission bin "{searchQuery.trim()}" does not exist.
                      </p>
                      <p className="text-[11px] font-mono text-slate-500">
                        Create it now to organize tasks instead of cancelling.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const name = searchQuery.trim();
                      if (name) {
                        onCreateBucket(name);
                        if (selectedTaskId) {
                          onAssignTaskToBucket(selectedTaskId, name);
                        }
                        setSearchQuery('');
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-all shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create "{searchQuery.trim()}" {selectedTaskId ? '& Assign' : 'Bin'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-slate-500">
          <span>DRAG DIRECTIVES INTO BINS • DRAG BACK TO UNBINNED TO REMOVE • OR 1-CLICK SELECT & ASSIGN</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer transition-colors self-end sm:self-auto"
          >
            Done Sorting
          </button>
        </div>
      </div>
    </div>
  );
};
