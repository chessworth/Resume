/**
 * @fileoverview Modal dialog for registering and editing recurring habits.
 * Captures recurrence cadence, chronobiological preference, and multi-criteria ratings.
 * @packageDocumentation
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Repeat,
  Calendar,
  Clock,
  Tag,
  Star,
  Zap,
  Gauge,
  Info,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { HabitItem, HabitFrequency, HabitTimeOfDay } from '../types/habit';
import {
  ImportanceLevel,
  UrgencyLevel,
  ImpactLevel,
  EffortLevel,
  TaskCategory
} from '../types/task';
import {
  IMPORTANCE_DEFINITIONS,
  URGENCY_DEFINITIONS,
  IMPACT_DEFINITIONS,
  EFFORT_DEFINITIONS,
  DEFAULT_TASK_CATEGORIES
} from '../constants/definitions';
import { generateUUID } from '../utils/uuid';

interface HabitInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveHabit: (habit: HabitItem) => void;
  editingHabit?: HabitItem | null;
  availableCategories?: string[];
}

export const HabitInputModal: React.FC<HabitInputModalProps> = ({
  isOpen,
  onClose,
  onSaveHabit,
  editingHabit,
  availableCategories = []
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('Health');
  const [frequency, setFrequency] = useState<HabitFrequency>('DAILY');
  const [customDays, setCustomDays] = useState<number>(2);
  const [timeOfDay, setTimeOfDay] = useState<HabitTimeOfDay>('ANYTIME');
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(30);
  const [importance, setImportance] = useState<ImportanceLevel>(4);
  const [urgency, setUrgency] = useState<UrgencyLevel>(3);
  const [impact, setImpact] = useState<ImpactLevel>(4);
  const [effort, setEffort] = useState<EffortLevel>(2);

  const allCategories = Array.from(
    new Set([...DEFAULT_TASK_CATEGORIES, ...availableCategories])
  );

  useEffect(() => {
    if (editingHabit) {
      setTitle(editingHabit.title);
      setDescription(editingHabit.description || '');
      setCategory(editingHabit.category);
      setFrequency(editingHabit.frequency);
      setCustomDays(editingHabit.customIntervalDays || 2);
      setTimeOfDay(editingHabit.preferredTimeOfDay || 'ANYTIME');
      setEstimatedMinutes(editingHabit.estimatedDurationMinutes || 30);
      setImportance(editingHabit.importance);
      setUrgency(editingHabit.urgency);
      setImpact(editingHabit.impact);
      setEffort(editingHabit.effort);
    } else {
      setTitle('');
      setDescription('');
      setCategory('Health');
      setFrequency('DAILY');
      setCustomDays(2);
      setTimeOfDay('ANYTIME');
      setEstimatedMinutes(30);
      setImportance(4);
      setUrgency(3);
      setImpact(4);
      setEffort(2);
    }
  }, [editingHabit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const habitData: HabitItem = {
      id: editingHabit ? editingHabit.id : generateUUID(),
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      frequency,
      customIntervalDays: frequency === 'CUSTOM_DAYS' ? Math.max(1, customDays) : undefined,
      preferredTimeOfDay: timeOfDay,
      estimatedDurationMinutes: estimatedMinutes,
      importance,
      urgency,
      impact,
      effort,
      streak: editingHabit ? editingHabit.streak : 0,
      longestStreak: editingHabit ? editingHabit.longestStreak : 0,
      totalCompletions: editingHabit ? editingHabit.totalCompletions : 0,
      completionHistory: editingHabit ? editingHabit.completionHistory : [],
      archived: editingHabit ? editingHabit.archived : false,
      createdAt: editingHabit ? editingHabit.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastCompletedAt: editingHabit ? editingHabit.lastCompletedAt : null
    };

    onSaveHabit(habitData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xl p-5 sm:p-7 space-y-5 my-auto max-h-[92vh] overflow-y-auto text-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/30">
              <Repeat className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-mono font-extrabold uppercase tracking-wider text-slate-950 dark:text-white">
                {editingHabit ? 'CALIBRATE RECURRING HABIT' : 'NEW RECURRING HABIT // CADENCE'}
              </h2>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                Automatic task materialization per cadence window
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Habit Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Habit Name / Behavioral Discipline <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Morning Deep Work Ritual (90m Block)"
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            />
          </div>

          {/* Description & Trigger */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Routine Details or Trigger (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Directly after morning hydration. Phone stored in another room."
              className="w-full px-3.5 py-2 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none"
            />
          </div>

          {/* Recurrence Frequency */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-violet-500" /> Recurrence Cadence
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs font-mono">
              {[
                { id: 'DAILY', label: 'Daily', desc: 'Every day' },
                { id: 'WEEKDAYS', label: 'Weekdays', desc: 'Mon - Fri' },
                { id: 'WEEKLY', label: 'Weekly', desc: 'Once a week' },
                { id: 'MONTHLY', label: 'Monthly', desc: 'Once a month' }
              ].map((freq) => (
                <button
                  key={freq.id}
                  type="button"
                  onClick={() => setFrequency(freq.id as HabitFrequency)}
                  className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    frequency === freq.id
                      ? 'bg-violet-600 text-white border-violet-500 shadow-md font-bold'
                      : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-violet-400 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="font-extrabold">{freq.label}</div>
                  <div className={`text-[10px] ${frequency === freq.id ? 'text-violet-200' : 'text-slate-500'}`}>
                    {freq.desc}
                  </div>
                </button>
              ))}
            </div>

            {/* Custom Interval Option */}
            <div className="pt-1 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFrequency('CUSTOM_DAYS')}
                className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                  frequency === 'CUSTOM_DAYS'
                    ? 'bg-violet-600 text-white border-violet-500 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                Custom Interval (Every N Days)
              </button>
              {frequency === 'CUSTOM_DAYS' && (
                <div className="flex items-center gap-1.5 font-mono text-xs">
                  <span>Every</span>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={customDays}
                    onChange={(e) => setCustomDays(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 px-2 py-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-center font-bold"
                  />
                  <span>days</span>
                </div>
              )}
            </div>
          </div>

          {/* Row: Category & Preferred Time of Day */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-cyan-600" /> Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              >
                {allCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Time of Day Preference */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-500" /> Execution Window
              </label>
              <select
                value={timeOfDay}
                onChange={(e) => setTimeOfDay(e.target.value as HabitTimeOfDay)}
                className="w-full px-3 py-2 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              >
                <option value="ANYTIME">Anytime during period</option>
                <option value="MORNING">Morning (Focus Anchor)</option>
                <option value="AFTERNOON">Afternoon</option>
                <option value="EVENING">Evening / Wind-down</option>
              </select>
            </div>
          </div>

          {/* Row: Importance & Urgency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Importance */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-rose-500" /> Importance Rating (1-5)
              </label>
              <div className="grid grid-cols-5 gap-1 font-mono text-xs">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setImportance(lvl as ImportanceLevel)}
                    className={`py-2 rounded-xl border text-center transition-all cursor-pointer font-bold ${
                      importance === lvl
                        ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
              <p className="text-[10px] font-mono text-slate-500">
                {IMPORTANCE_DEFINITIONS[importance].title}
              </p>
            </div>

            {/* Urgency */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-500" /> Urgency Rating (1-5)
              </label>
              <div className="grid grid-cols-5 gap-1 font-mono text-xs">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setUrgency(lvl as UrgencyLevel)}
                    className={`py-2 rounded-xl border text-center transition-all cursor-pointer font-bold ${
                      urgency === lvl
                        ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
              <p className="text-[10px] font-mono text-slate-500">
                {URGENCY_DEFINITIONS[urgency].title}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-mono text-xs font-extrabold uppercase tracking-wider shadow-md shadow-violet-600/25 active:scale-95 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{editingHabit ? 'Save Changes' : 'Register Habit Discipline'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
