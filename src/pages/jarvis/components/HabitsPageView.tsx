/**
 * @fileoverview Dedicated Habit Management and Cadence Execution Surface.
 * Displays recurring habit definitions, recurrence cycle deadlines,
 * completion status checks for active periods, historical streaks,
 * and portfolio telemetry.
 * @packageDocumentation
 */

import React, { useState, useMemo } from 'react';
import {
  Repeat,
  PlusCircle,
  Flame,
  CheckCircle2,
  Clock,
  Calendar,
  Tag,
  Star,
  Zap,
  Edit2,
  Trash2,
  Filter,
  Check,
  Award,
  TrendingUp,
  RotateCw,
  AlertCircle
} from 'lucide-react';
import { HabitItem, HabitFrequency, HabitTelemetrySummary } from '../types/habit';
import {
  evaluateHabitPeriodStatus,
  calculateHabitTelemetry,
  getHabitPeriodKey
} from '../services/habitEngine';
import { DEFAULT_TASK_CATEGORIES } from '../constants/definitions';

interface HabitsPageViewProps {
  habits: HabitItem[];
  onOpenAddHabit: () => void;
  onEditHabit: (habit: HabitItem) => void;
  onDeleteHabit: (id: string) => void;
  onToggleHabitCompletion: (habitId: string) => void;
}

export const HabitsPageView: React.FC<HabitsPageViewProps> = ({
  habits,
  onOpenAddHabit,
  onEditHabit,
  onDeleteHabit,
  onToggleHabitCompletion
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | 'ALL'>('ALL');
  const [selectedFrequency, setSelectedFrequency] = useState<HabitFrequency | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('ALL');

  const telemetry = useMemo(() => calculateHabitTelemetry(habits), [habits]);

  // Unique categories
  const categories = useMemo(() => {
    return Array.from(new Set([...DEFAULT_TASK_CATEGORIES, ...habits.map((h) => h.category)]));
  }, [habits]);

  // Filtered habits
  const filteredHabits = useMemo(() => {
    return habits.filter((habit) => {
      if (selectedCategory !== 'ALL' && habit.category !== selectedCategory) return false;
      if (selectedFrequency !== 'ALL' && habit.frequency !== selectedFrequency) return false;

      const status = evaluateHabitPeriodStatus(habit);
      if (statusFilter === 'PENDING' && status.isCompletedInPeriod) return false;
      if (statusFilter === 'COMPLETED' && !status.isCompletedInPeriod) return false;

      return true;
    });
  }, [habits, selectedCategory, selectedFrequency, statusFilter]);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Telemetry Deck */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Active Disciplines */}
        <div className="p-4 rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-sm backdrop-blur-xl space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-mono text-[11px] font-bold">
            <span>ACTIVE DISCIPLINES</span>
            <Repeat className="w-4 h-4 text-violet-500" />
          </div>
          <div className="text-2xl font-mono font-extrabold text-slate-950 dark:text-white">
            {telemetry.activeHabits}
          </div>
          <div className="text-[11px] font-mono text-slate-500">
            Automated recurring cadences
          </div>
        </div>

        {/* Due Today / In Period Status */}
        <div className="p-4 rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-sm backdrop-blur-xl space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-mono text-[11px] font-bold">
            <span>PERIOD CONSISTENCY</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
            {telemetry.overallConsistencyPercentage}%
          </div>
          <div className="text-[11px] font-mono text-slate-500">
            {telemetry.completedTodayCount} completed • {telemetry.pendingTodayCount} pending
          </div>
        </div>

        {/* Best Unbroken Streak */}
        <div className="p-4 rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-sm backdrop-blur-xl space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-mono text-[11px] font-bold">
            <span>PEAK STREAK</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-mono font-extrabold text-amber-600 dark:text-amber-400">
            {telemetry.bestActiveStreak} <span className="text-xs font-normal text-slate-500">periods</span>
          </div>
          <div className="text-[11px] font-mono text-slate-500">
            Max consecutive iterations
          </div>
        </div>

        {/* Total Lifetime Completions */}
        <div className="p-4 rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-sm backdrop-blur-xl space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-mono text-[11px] font-bold">
            <span>LIFETIME EXECUTIONS</span>
            <Award className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-2xl font-mono font-extrabold text-cyan-600 dark:text-cyan-400">
            {telemetry.totalHistoricalCompletions} <span className="text-xs font-normal text-slate-500">times</span>
          </div>
          <div className="text-[11px] font-mono text-slate-500">
            Total verified completions
          </div>
        </div>
      </div>

      {/* Control Strip */}
      <div className="p-4 rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-sm backdrop-blur-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="font-mono text-sm font-extrabold uppercase tracking-wider text-slate-950 dark:text-white flex items-center gap-2">
              <Repeat className="w-4 h-4 text-violet-500" />
              <span>RECURRING HABITS & BEHAVIORAL DISCIPLINES</span>
            </h3>
            <p className="font-mono text-xs text-slate-500">
              Synchronized automatically into task prioritization matrix per active recurrence cycle
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenAddHabit}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-mono text-xs font-bold shadow-md shadow-violet-600/25 active:scale-95 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 stroke-[2.5]" />
            <span>ADD NEW HABIT</span>
          </button>
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs font-mono">
          {/* Status Segment */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 gap-1">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer font-bold ${
                statusFilter === 'ALL'
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              ALL ({habits.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('PENDING')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer font-bold ${
                statusFilter === 'PENDING'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              PENDING ({telemetry.pendingTodayCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('COMPLETED')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer font-bold ${
                statusFilter === 'COMPLETED'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              COMPLETED ({telemetry.completedTodayCount})
            </button>
          </div>

          {/* Cadence Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            <span className="text-[11px] text-slate-500 shrink-0 font-semibold">CADENCE:</span>
            {(['ALL', 'DAILY', 'WEEKDAYS', 'WEEKLY', 'MONTHLY'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setSelectedFrequency(f)}
                className={`px-2.5 py-1 rounded-lg border text-[11px] whitespace-nowrap transition-all cursor-pointer ${
                  selectedFrequency === f
                    ? 'bg-violet-600 text-white border-violet-500 font-bold'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Habit Cards Grid */}
      {filteredHabits.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3 font-mono">
          <Repeat className="w-10 h-10 text-violet-400 mx-auto stroke-1" />
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase">
            No habits matching active filter parameters
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Register a recurring routine above to automate prioritized task creation every cycle.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredHabits.map((habit) => {
            const status = evaluateHabitPeriodStatus(habit);

            return (
              <div
                key={habit.id}
                className={`relative rounded-3xl p-5 border transition-all duration-300 space-y-4 shadow-sm hover:shadow-md ${
                  status.isCompletedInPeriod
                    ? 'bg-violet-50/40 dark:bg-violet-950/20 border-violet-200 dark:border-violet-800/80 ring-1 ring-violet-500/20'
                    : 'bg-white/95 dark:bg-slate-900/90 border-slate-200/90 dark:border-slate-800 hover:border-violet-400 dark:hover:border-violet-600'
                }`}
              >
                {/* Header: Cadence Badge & Actions */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                      {/* Recurrence Cadence Badge */}
                      <span className="font-extrabold px-2.5 py-0.5 rounded-full bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/30 flex items-center gap-1">
                        <Repeat className="w-3 h-3 text-violet-500" />
                        <span>{habit.frequency}</span>
                      </span>

                      {/* Period Deadline / Label */}
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold border border-slate-200 dark:border-slate-700">
                        {status.periodLabel}
                      </span>

                      {/* Category */}
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {habit.category}
                      </span>
                    </div>

                    <h4
                      className={`text-sm sm:text-base font-mono font-bold leading-snug pt-1 ${
                        status.isCompletedInPeriod
                          ? 'line-through text-slate-500 dark:text-slate-400'
                          : 'text-slate-950 dark:text-white'
                      }`}
                    >
                      {habit.title}
                    </h4>

                    {habit.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
                        {habit.description}
                      </p>
                    )}
                  </div>

                  {/* Edit & Delete Action Buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onEditHabit(habit)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Edit Habit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteHabit(habit.id)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="Delete Habit"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Recurrence Period Status Switcher / Completion Trigger */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-3 font-mono text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => onToggleHabitCompletion(habit.id)}
                      className={`w-6 h-6 rounded-xl flex items-center justify-center border transition-all cursor-pointer shrink-0 ${
                        status.isCompletedInPeriod
                          ? 'bg-violet-600 border-violet-600 text-white shadow-xs'
                          : 'border-slate-400 dark:border-slate-600 hover:border-violet-500 bg-white dark:bg-slate-900'
                      }`}
                      aria-label="Toggle Period Completion"
                    >
                      {status.isCompletedInPeriod && <Check className="w-4 h-4 stroke-[3]" />}
                    </button>

                    <div className="min-w-0">
                      <span className="font-extrabold block truncate text-[11px]">
                        {status.isCompletedInPeriod
                          ? 'COMPLETED FOR CURRENT CADENCE'
                          : 'PENDING CURRENT CADENCE'}
                      </span>
                      <span className="text-[10px] text-slate-500 block truncate">
                        {status.isCompletedInPeriod
                          ? `Recorded: ${new Date(status.completedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                          : `Due window: ${status.periodLabel}`}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                      status.isCompletedInPeriod
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                    }`}
                  >
                    {status.isCompletedInPeriod ? 'RESOLVED' : 'INCOMPLETE'}
                  </span>
                </div>

                {/* Telemetry Strip: Streak, Lifetime Total & Duration */}
                <div className="flex items-center justify-between text-xs font-mono pt-1 text-slate-600 dark:text-slate-400 border-t border-slate-200/60 dark:border-slate-800/60">
                  <div className="flex items-center gap-3">
                    {/* Current Streak */}
                    <span className="flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                      <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>{habit.streak} streak</span>
                    </span>

                    {/* Best Streak */}
                    <span className="text-[11px] text-slate-500">
                      Best: <strong>{habit.longestStreak}</strong>
                    </span>
                  </div>

                  {/* Total Completed Record */}
                  <span className="text-[11px] text-slate-500 font-medium">
                    Total: <strong className="text-slate-900 dark:text-slate-100">{habit.totalCompletions}</strong> cycles
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
