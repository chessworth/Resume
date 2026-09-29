/**
 * @fileoverview Step-by-Step Task Execution Guide & Micro-Task Breakdown Modal.
 * Displays Gemini-generated structured phases, time breakdowns, pitfalls to avoid,
 * and allows breaking the task into micro-tasks when requested by the user.
 * @packageDocumentation
 */

import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ListTree,
  Plus,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Layers,
  Copy,
  Check
} from 'lucide-react';
import { TaskItem } from '../types/task';
import { TaskGuideResponse } from '../services/aiAssistantService';

interface AiTaskGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: TaskItem | null;
  guideData: TaskGuideResponse | null;
  isLoading: boolean;
  onApplyMicrotasksAsTasks?: (microtasks: string[], parentTask: TaskItem) => void;
  onAppendMicrotasksToNotes?: (microtasks: string[], parentTask: TaskItem) => void;
  onRequestBreakdownAgain?: () => void;
}

export const AiTaskGuideModal: React.FC<AiTaskGuideModalProps> = ({
  isOpen,
  onClose,
  task,
  guideData,
  isLoading,
  onApplyMicrotasksAsTasks,
  onAppendMicrotasksToNotes,
  onRequestBreakdownAgain,
}) => {
  const [selectedMicrotasks, setSelectedMicrotasks] = useState<Record<number, boolean>>({});
  const [copied, setCopied] = useState(false);

  if (!isOpen || !task) return null;

  const toggleMicrotask = (index: number) => {
    setSelectedMicrotasks((prev) => ({
      ...prev,
      [index]: prev[index] === undefined ? false : !prev[index],
    }));
  };

  const allMicrotasks = guideData?.microtasks || [];
  const activeSelectedTasks = allMicrotasks.filter((_, idx) =>
    selectedMicrotasks[idx] !== undefined ? selectedMicrotasks[idx] : true
  );

  const handleCreateSelectedAsTasks = () => {
    if (onApplyMicrotasksAsTasks && activeSelectedTasks.length > 0) {
      onApplyMicrotasksAsTasks(activeSelectedTasks, task);
      onClose();
    }
  };

  const handleAppendToNotes = () => {
    if (onAppendMicrotasksToNotes && activeSelectedTasks.length > 0) {
      onAppendMicrotasksToNotes(activeSelectedTasks, task);
      onClose();
    }
  };

  const handleCopyGuide = () => {
    if (!guideData) return;
    const text = `# Execution Guide: ${guideData.taskTitle}
Overview: ${guideData.overview}

## Key Objectives:
${guideData.keyObjectives.map((o) => `- ${o}`).join('\n')}

## Phases:
${guideData.phases
  .map(
    (p, i) =>
      `Phase ${i + 1}: ${p.phaseName} (${p.durationMinutes}m)\n${p.actions.map((a) => `  * ${a}`).join('\n')}`
  )
  .join('\n\n')}

## Pitfalls to Avoid:
${guideData.pitfallsToAvoid.map((p) => `- ${p}`).join('\n')}

## Micro-tasks:
${guideData.microtasks.map((m) => `[ ] ${m}`).join('\n')}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-3xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col text-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-[11px] font-mono font-extrabold uppercase tracking-widest text-cyan-600 dark:text-cyan-400 block">
                GEMINI AI // EXECUTION ROADMAP
              </span>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate max-w-sm sm:max-w-md">
                {task.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {guideData && (
              <button
                type="button"
                onClick={handleCopyGuide}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Copy Full Guide"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="py-16 text-center space-y-4">
              <div className="inline-block p-4 rounded-3xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 animate-spin">
                <Sparkles className="w-8 h-8" />
              </div>
              <div className="font-mono text-xs uppercase tracking-widest text-cyan-600 dark:text-cyan-400 font-bold">
                Synthesizing Tactical Execution Roadmap...
              </div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Gemini 3.8 Flash is calculating optimal pacing, phase subdivisions, and cognitive hazard mitigation for "{task.title}".
              </p>
            </div>
          ) : guideData ? (
            <>
              {/* Strategic Overview */}
              <div className="p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/20 space-y-2">
                <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-cyan-700 dark:text-cyan-400">
                  STRATEGIC OVERVIEW
                </span>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {guideData.overview}
                </p>
              </div>

              {/* Key Objectives */}
              {guideData.keyObjectives && guideData.keyObjectives.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    KEY OBJECTIVES & SUCCESS CRITERIA
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {guideData.keyObjectives.map((obj, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs flex items-start gap-2 text-slate-800 dark:text-slate-200"
                      >
                        <ChevronRight className="w-3.5 h-3.5 text-cyan-500 shrink-0 mt-0.5" />
                        <span>{obj}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Execution Phases */}
              <div className="space-y-3">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  SEQUENTIAL EXECUTION PHASES
                </span>
                <div className="space-y-3">
                  {guideData.phases.map((phase, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-mono text-[10px] font-extrabold">
                            PHASE {idx + 1}
                          </span>
                          <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                            {phase.phaseName}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 font-bold">
                          ~{phase.durationMinutes} min
                        </span>
                      </div>

                      <ul className="space-y-1.5 pl-2 border-l-2 border-indigo-500/30">
                        {phase.actions.map((act, actIdx) => (
                          <li key={actIdx} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0 mt-1.5" />
                            <span>{act}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cognitive Hazard / Pitfalls */}
              {guideData.pitfallsToAvoid && guideData.pitfallsToAvoid.length > 0 && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                  <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    COGNITIVE HAZARDS & PITFALLS TO AVOID
                  </span>
                  <ul className="space-y-1">
                    {guideData.pitfallsToAvoid.map((pitfall, i) => (
                      <li key={i} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                        <span className="text-amber-500 font-bold">•</span>
                        <span>{pitfall}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Micro-Tasks Breakdown Section (Only when requested by user) */}
              {guideData.microtasks && guideData.microtasks.length > 0 && (
                <div className="p-5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ListTree className="w-4 h-4 text-cyan-500" />
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                        MICRO-TASK BREAKDOWN ({guideData.microtasks.length} SUBTASKS)
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">
                      Select items to import
                    </span>
                  </div>

                  <div className="space-y-2">
                    {guideData.microtasks.map((micro, idx) => {
                      const isChecked = selectedMicrotasks[idx] !== undefined ? selectedMicrotasks[idx] : true;
                      return (
                        <label
                          key={idx}
                          className={`flex items-center gap-3 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-300 dark:border-cyan-800 text-slate-900 dark:text-white'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 opacity-60'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleMicrotask(idx)}
                            className="rounded text-cyan-600 focus:ring-cyan-500"
                          />
                          <span className="font-mono">{micro}</span>
                        </label>
                      );
                    })}
                  </div>

                  {/* Actions for Micro-Tasks */}
                  <div className="pt-2 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCreateSelectedAsTasks}
                      className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Ingest {activeSelectedTasks.length} Micro-Tasks to Jarvis
                    </button>

                    <button
                      type="button"
                      onClick={handleAppendToNotes}
                      className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-mono text-[11px] font-bold uppercase transition-all cursor-pointer"
                    >
                      Append to Task Notes Checklist
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-12 text-center text-slate-500 text-xs font-mono">
              No roadmap generated yet.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 flex items-center justify-between text-xs font-mono text-slate-500">
          <span>POWERED BY GEMINI 3.8 FLASH</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold transition-all cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
