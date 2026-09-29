/**
 * @fileoverview Priority Calibration Audit Modal.
 * Implements Suggestion 5: Scans all active tasks for priority misalignments,
 * inverted effort-impact ratings, deadline conflicts, and provides 1-click auto-calibration.
 * @packageDocumentation
 */

import React, { useState } from 'react';
import {
  X,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Gauge,
  Sliders,
  Check
} from 'lucide-react';
import { TaskItem } from '../types/task';
import { PriorityAuditResponse, AuditFinding } from '../services/aiAssistantService';

interface AiAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditData: PriorityAuditResponse | null;
  isLoading: boolean;
  onApplySingleCalibration?: (taskId: string, updates: Partial<TaskItem>) => Promise<void>;
  onApplyBatchCalibration?: (findings: AuditFinding[]) => Promise<void>;
}

export const AiAuditModal: React.FC<AiAuditModalProps> = ({
  isOpen,
  onClose,
  auditData,
  isLoading,
  onApplySingleCalibration,
  onApplyBatchCalibration,
}) => {
  const [appliedTaskIds, setAppliedTaskIds] = useState<Record<string, boolean>>({});
  const [isApplyingAll, setIsApplyingAll] = useState(false);

  if (!isOpen) return null;

  const handleApplySingle = async (finding: AuditFinding) => {
    if (!onApplySingleCalibration) return;
    const updates: Partial<TaskItem> = {};
    if (finding.suggestedImportance !== undefined && finding.suggestedImportance !== null) {
      updates.importance = finding.suggestedImportance;
    }
    if (finding.suggestedUrgency !== undefined && finding.suggestedUrgency !== null) {
      updates.urgency = finding.suggestedUrgency;
    }
    if (finding.suggestedImpact !== undefined && finding.suggestedImpact !== null) {
      updates.impact = finding.suggestedImpact;
    }
    if (finding.suggestedEffort !== undefined && finding.suggestedEffort !== null) {
      updates.effort = finding.suggestedEffort;
    }

    await onApplySingleCalibration(finding.taskId, updates);
    setAppliedTaskIds((prev) => ({ ...prev, [finding.taskId]: true }));
  };

  const handleApplyAll = async () => {
    if (!onApplyBatchCalibration || !auditData) return;
    setIsApplyingAll(true);
    await onApplyBatchCalibration(auditData.findings);
    setIsApplyingAll(false);
    onClose();
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10';
    if (score >= 65) return 'text-amber-500 border-amber-500/30 bg-amber-500/10';
    return 'text-rose-500 border-rose-500/30 bg-rose-500/10';
  };

  const getSeverityBadge = (severity: string) => {
    if (severity === 'HIGH') {
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-extrabold bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30">
          HIGH SEVERITY
        </span>
      );
    }
    if (severity === 'MEDIUM') {
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-extrabold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
          MEDIUM SEVERITY
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-extrabold bg-slate-500/20 text-slate-600 dark:text-slate-400 border border-slate-500/30">
        LOW SEVERITY
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-3xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col text-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-[11px] font-mono font-extrabold uppercase tracking-widest text-amber-600 dark:text-amber-400 block">
                JARVIS AI // CALIBRATION AUDIT
              </span>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Priority Calibration & Alignment Check
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
              <div className="inline-block p-4 rounded-3xl bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-spin">
                <Sparkles className="w-8 h-8" />
              </div>
              <div className="font-mono text-xs uppercase tracking-widest text-amber-600 dark:text-amber-400 font-bold">
                Auditing Matrix Priorities & Deadlines...
              </div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Gemini 3.8 Flash is cross-referencing impact vs. effort ratings, deadline urgency escalations, and cognitive strain balance.
              </p>
            </div>
          ) : auditData ? (
            <>
              {/* Health Score & Overview Card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="space-y-1 max-w-md">
                  <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-slate-500">
                    EXECUTIVE AUDIT SUMMARY
                  </span>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                    {auditData.executiveSummary}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div
                    className={`flex flex-col items-center justify-center w-20 h-20 rounded-2xl border ${getScoreColor(
                      auditData.healthScore
                    )} font-mono`}
                  >
                    <span className="text-2xl font-black">{auditData.healthScore}</span>
                    <span className="text-[9px] uppercase tracking-wider font-bold">HEALTH</span>
                  </div>
                </div>
              </div>

              {/* Action Banner to apply all */}
              {auditData.findings.length > 0 && (
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs font-mono">
                  <span className="text-slate-700 dark:text-slate-300">
                    Found <strong>{auditData.findings.length}</strong> calibration improvement(s).
                  </span>
                  {onApplyBatchCalibration && (
                    <button
                      type="button"
                      onClick={handleApplyAll}
                      disabled={isApplyingAll}
                      className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
                    >
                      {isApplyingAll ? 'Applying...' : 'Apply All Calibrations'}
                    </button>
                  )}
                </div>
              )}

              {/* Findings List */}
              <div className="space-y-3">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  DETECTED MISALIGNMENTS & RECOMMENDATIONS
                </span>

                {auditData.findings.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 space-y-1 font-mono text-xs">
                    <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-emerald-500" />
                    <strong>PERFECT MATRIX CALIBRATION</strong>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                      No urgency contradictions, effort distortions, or deadline oversights detected.
                    </p>
                  </div>
                ) : (
                  auditData.findings.map((finding, idx) => {
                    const isApplied = appliedTaskIds[finding.taskId];
                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-2.5 transition-all"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              {getSeverityBadge(finding.severity)}
                              <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                                {finding.title}
                              </h4>
                            </div>
                            <p className="text-xs text-rose-600 dark:text-rose-400 font-mono">
                              Issue: {finding.issueDescription}
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-300 font-sans">
                              Fix: {finding.recommendedAdjustment}
                            </p>
                          </div>

                          <div className="shrink-0">
                            {isApplied ? (
                              <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" />
                                Calibrated
                              </span>
                            ) : (
                              onApplySingleCalibration && (
                                <button
                                  type="button"
                                  onClick={() => handleApplySingle(finding)}
                                  className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-cyan-600 hover:text-white text-slate-800 dark:text-slate-200 font-mono text-[10px] font-bold uppercase transition-all cursor-pointer shadow-xs"
                                >
                                  Apply Fix
                                </button>
                              )
                            )}
                          </div>
                        </div>

                        {/* Proposed values preview */}
                        <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px] font-mono text-slate-500">
                          {finding.suggestedImportance && (
                            <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                              Target Imp: {finding.suggestedImportance}
                            </span>
                          )}
                          {finding.suggestedUrgency && (
                            <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                              Target Urg: {finding.suggestedUrgency}
                            </span>
                          )}
                          {finding.suggestedImpact && (
                            <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                              Target Impact: {finding.suggestedImpact}
                            </span>
                          )}
                          {finding.suggestedEffort && (
                            <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300">
                              Target Effort: {finding.suggestedEffort}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-slate-500 text-xs font-mono">
              No audit report generated yet.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 flex items-center justify-between text-xs font-mono text-slate-500">
          <span>PRIORITY DISCREPANCY DETECTOR</span>
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
