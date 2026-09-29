/**
 * @fileoverview Daily Execution Sequence & Cognitive Schedule Optimization Modal.
 * Implements Suggestion 4: Evaluates active tasks across urgency, importance, effort,
 * impact, and cognitive strain to generate an optimal daily sequence with focus blocks.
 * @packageDocumentation
 */

import React from 'react';
import {
  X,
  Sparkles,
  Calendar,
  Clock,
  Zap,
  Target,
  Coffee,
  Play,
  CheckCircle2,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { TaskItem } from '../types/task';
import { DailyPlanResponse, DailyScheduleBlock } from '../services/aiAssistantService';

interface AiPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  planData: DailyPlanResponse | null;
  isLoading: boolean;
  onEngageFocusBlock?: (taskId: string) => void;
}

export const AiPlanModal: React.FC<AiPlanModalProps> = ({
  isOpen,
  onClose,
  planData,
  isLoading,
  onEngageFocusBlock,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-3xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col text-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
              <Calendar className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-[11px] font-mono font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 block">
                JARVIS AI // STRATEGIC DAILY CADENCE
              </span>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Cognitive Daily Execution Plan
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="py-16 text-center space-y-4">
              <div className="inline-block p-4 rounded-3xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 animate-spin">
                <Sparkles className="w-8 h-8" />
              </div>
              <div className="font-mono text-xs uppercase tracking-widest text-indigo-600 dark:text-indigo-400 font-bold">
                Synthesizing Optimal Daily Cadence...
              </div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Gemini 3.8 Flash is harmonizing ultradian focus rhythms, high-strain tasks, and quick momentum wins into an ergonomic day plan.
              </p>
            </div>
          ) : planData ? (
            <>
              {/* Executive Summary */}
              <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 space-y-2">
                <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-indigo-700 dark:text-indigo-400">
                  STRATEGIC REASONING & CADENCE
                </span>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {planData.summary}
                </p>
                {planData.totalEstimatedMinutes && (
                  <div className="pt-1 text-xs font-mono text-indigo-600 dark:text-indigo-300 font-bold">
                    Estimated Focus Time Required: {Math.round(planData.totalEstimatedMinutes / 60)}h {planData.totalEstimatedMinutes % 60}m
                  </div>
                )}
              </div>

              {/* Execution Sequence Blocks */}
              <div className="space-y-3">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-cyan-500" />
                  CHRONOLOGICAL EXECUTION SEQUENCE
                </span>

                <div className="space-y-3">
                  {planData.schedule.map((block, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-indigo-500/50 transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-mono text-[10px] font-extrabold">
                            STEP {idx + 1}
                          </span>
                          <span className="text-[11px] font-mono font-bold text-cyan-600 dark:text-cyan-400">
                            {block.blockLabel}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          {block.title}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-mono">
                          {block.rationale}
                        </p>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                        <span className="px-2.5 py-1 rounded-xl bg-slate-200 dark:bg-slate-700 text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                          {block.focusMinutes}m Focus
                        </span>
                        {onEngageFocusBlock && (
                          <button
                            type="button"
                            onClick={() => {
                              onEngageFocusBlock(block.taskId);
                              onClose();
                            }}
                            className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                          >
                            <Play className="w-3 h-3" />
                            Focus
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Biological Recovery / Rest Strategies */}
              {planData.restRecommendations && planData.restRecommendations.length > 0 && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                  <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <Coffee className="w-3.5 h-3.5 text-emerald-500" />
                    BIOLOGICAL RECOVERY & REST HYGIENE
                  </span>
                  <ul className="space-y-1">
                    {planData.restRecommendations.map((tip, i) => (
                      <li key={i} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                        <span className="text-emerald-500 font-bold">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <div className="py-12 text-center text-slate-500 text-xs font-mono">
              No daily schedule generated yet.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 flex items-center justify-between text-xs font-mono text-slate-500">
          <span>COGNITIVE PACING OPTIMIZER</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
