/**
 * @fileoverview Mindful Cognitive Workload Distribution & Balance Meter.
 * Provides executive telemetry on cognitive bandwidth, estimated execution hours remaining,
 * and supportive, non-stressful guidance when entering high-capacity workload states.
 * @packageDocumentation
 */

import React from 'react';
import { WorkloadDistribution } from '../types/task';
import { HeartPulse, CheckCircle2, ShieldCheck, Sparkles, Clock, AlertCircle } from 'lucide-react';

interface WorkloadDistributionMeterProps {
  distribution: WorkloadDistribution;
}

export const WorkloadDistributionMeter: React.FC<WorkloadDistributionMeterProps> = ({
  distribution
}) => {
  const {
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
  } = distribution;

  // Calming, supportive state styling
  const stateConfig = {
    OPTIMAL: {
      badge: 'STEADY CADENCE',
      color: 'text-emerald-700 dark:text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/30',
      barColor: 'from-emerald-500 to-teal-500'
    },
    FOCUSED: {
      badge: 'FOCUSED FLOW',
      color: 'text-cyan-700 dark:text-cyan-400',
      bg: 'bg-cyan-500/10 border-cyan-500/30',
      barColor: 'from-cyan-500 to-blue-500'
    },
    ELEVATED: {
      badge: 'ACTIVE RUNWAY',
      color: 'text-sky-700 dark:text-sky-400',
      bg: 'bg-sky-500/10 border-sky-500/30',
      barColor: 'from-sky-500 to-indigo-500'
    },
    HIGH_CAPACITY: {
      badge: 'HIGH FOCUS ZONE',
      color: 'text-amber-800 dark:text-amber-300',
      bg: 'bg-amber-500/10 border-amber-500/30',
      barColor: 'from-amber-500 to-orange-400'
    }
  }[overloadState];

  const percent = Math.min(100, Math.round(cognitiveCapacityRatio * 100));

  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-sm backdrop-blur-xl transition-all">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Telemetry & State */}
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-xl border ${stateConfig.bg} ${stateConfig.color}`}>
              <HeartPulse className="w-4 h-4 animate-pulse-subtle" />
            </div>
            <span className="text-xs font-mono font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-300">
              COGNITIVE LOAD & BANDWIDTH METER
            </span>
            <span
              className={`text-[10px] font-mono font-extrabold px-2.5 py-0.5 rounded-full border ${stateConfig.bg} ${stateConfig.color}`}
            >
              {stateConfig.badge}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
            {advisoryMessage}
          </p>
        </div>

        {/* Right: Hours & Focus Metric */}
        <div className="flex items-center gap-4 text-xs font-mono self-start md:self-auto shrink-0">
          <div className="px-3.5 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80">
            <span className="text-[10px] text-slate-600 dark:text-slate-400 block font-bold">
              EST. TIME REMAINING
            </span>
            <span className="text-sm font-bold text-slate-950 dark:text-white flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              {estimatedHoursRemaining} hrs
            </span>
          </div>

          <div className="px-3.5 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80">
            <span className="text-[10px] text-slate-600 dark:text-slate-400 block font-bold">
              ACTIVE TASKS
            </span>
            <span className="text-sm font-bold text-slate-950 dark:text-white">
              {totalActive} items
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar & Quadrant Segments */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-600 dark:text-slate-400 font-bold">
          <span>CAPACITY COMMITTED: {percent}%</span>
          <div className="flex items-center gap-3">
            <span className="text-rose-700 dark:text-rose-400 font-extrabold">Q1: {q1Count}</span>
            <span className="text-amber-700 dark:text-amber-400 font-extrabold">Q2: {q2Count}</span>
            <span className="text-cyan-700 dark:text-cyan-400 font-extrabold">Q3: {q3Count}</span>
            <span className="text-slate-600 dark:text-slate-400 font-extrabold">Q4: {q4Count}</span>
          </div>
        </div>

        <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden relative">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${stateConfig.barColor} transition-all duration-500`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  );
};
