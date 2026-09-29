/**
 * @fileoverview Interactive Task Creation & Calibration modal.
 * Guides the user through entering task parameters, asks for estimated duration
 * and cognitive strain to automatically recommend effort ratings, and provides
 * frictionless Mega Task Bin assignment.
 * @packageDocumentation
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Sparkles,
  Tag,
  AlignLeft,
  CheckCircle2,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
  Zap,
  Star,
  Gauge,
  BrainCircuit,
  FolderPlus,
  HelpCircle
} from 'lucide-react';
import {
  ImportanceLevel,
  UrgencyLevel,
  ImpactLevel,
  EffortLevel,
  CognitiveStrainLevel,
  TaskCategory,
  TaskItem
} from '../types/task';
import {
  DEFAULT_TASK_CATEGORIES,
  IMPORTANCE_DEFINITIONS,
  URGENCY_DEFINITIONS,
  IMPACT_DEFINITIONS,
  EFFORT_DEFINITIONS,
  COGNITIVE_STRAIN_DEFINITIONS,
  calculateRecommendedUrgency,
  calculateRecommendedEffort
} from '../constants/definitions';

interface TaskInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: Omit<TaskItem, 'id' | 'createdAt' | 'updatedAt' | 'isCompleted' | 'completedAt'>) => void;
  initialTask?: TaskItem | null;
  initialValues?: Partial<TaskItem> | null;
  isAiProposal?: boolean;
  availableBuckets?: string[];
  onCreateBucket?: (bucketName: string) => void;
}

export const TaskInputModal: React.FC<TaskInputModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialTask,
  initialValues,
  isAiProposal = false,
  availableBuckets = [],
  onCreateBucket
}) => {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState<TaskCategory | string>('Work');
  const [customCategory, setCustomCategory] = useState('');
  const [megaBucket, setMegaBucket] = useState<string>('NONE');
  const [newBucketName, setNewBucketName] = useState('');
  const [isCreatingBucket, setIsCreatingBucket] = useState(false);

  const [dueDate, setDueDate] = useState<string>('');
  const [estimatedDurationMinutes, setEstimatedDurationMinutes] = useState<number>(45);
  const [cognitiveStrain, setCognitiveStrain] = useState<CognitiveStrainLevel>('MODERATE');

  const [importance, setImportance] = useState<ImportanceLevel>(3);
  const [urgency, setUrgency] = useState<UrgencyLevel>(3);
  const [impact, setImpact] = useState<ImpactLevel>(3);
  const [effort, setEffort] = useState<EffortLevel>(3);

  const [hasManuallyOverriddenUrgency, setHasManuallyOverriddenUrgency] = useState(false);
  const [hasManuallyOverriddenEffort, setHasManuallyOverriddenEffort] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [isProfilingOpen, setIsProfilingOpen] = useState(true);

  const recommendedUrgency = calculateRecommendedUrgency(dueDate || null);
  const recommendedEffort = calculateRecommendedEffort(estimatedDurationMinutes, cognitiveStrain);

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setNotes(initialTask.notes || '');
      setCategory(initialTask.category);
      setMegaBucket(initialTask.megaBucket || 'NONE');
      setDueDate(initialTask.dueDate ? initialTask.dueDate.slice(0, 16) : '');
      setEstimatedDurationMinutes(initialTask.estimatedDurationMinutes || 45);
      setCognitiveStrain(initialTask.cognitiveStrain || 'MODERATE');
      setImportance(initialTask.importance);
      setUrgency(initialTask.urgency);
      setImpact(initialTask.impact ?? (initialTask.importance ?? 3));
      setEffort(initialTask.effort ?? 3);
      setHasManuallyOverriddenUrgency(initialTask.urgency !== initialTask.recommendedUrgency);
      setHasManuallyOverriddenEffort(false);
    } else if (initialValues) {
      setTitle(initialValues.title || '');
      setNotes(initialValues.notes || '');
      setCategory(initialValues.category || 'Work');
      setMegaBucket(initialValues.megaBucket || 'NONE');
      setDueDate(initialValues.dueDate ? initialValues.dueDate.slice(0, 16) : '');
      setEstimatedDurationMinutes(initialValues.estimatedDurationMinutes || 45);
      setCognitiveStrain(initialValues.cognitiveStrain || 'MODERATE');
      setImportance(initialValues.importance || 3);
      setUrgency(initialValues.urgency || 3);
      setImpact(initialValues.impact ?? 3);
      setEffort(initialValues.effort ?? 3);
      setHasManuallyOverriddenUrgency(true);
      setHasManuallyOverriddenEffort(true);
    } else {
      resetForm();
    }
  }, [initialTask, initialValues, isOpen]);

  // Dynamic urgency auto-update
  useEffect(() => {
    if (!hasManuallyOverriddenUrgency && dueDate) {
      setUrgency(recommendedUrgency);
    }
  }, [dueDate, recommendedUrgency, hasManuallyOverriddenUrgency]);

  // Dynamic effort auto-update
  useEffect(() => {
    if (!hasManuallyOverriddenEffort) {
      setEffort(recommendedEffort);
    }
  }, [estimatedDurationMinutes, cognitiveStrain, recommendedEffort, hasManuallyOverriddenEffort]);

  const resetForm = () => {
    setTitle('');
    setNotes('');
    setCategory('Work');
    setCustomCategory('');
    setMegaBucket('NONE');
    setNewBucketName('');
    setIsCreatingBucket(false);
    setDueDate('');
    setEstimatedDurationMinutes(45);
    setCognitiveStrain('MODERATE');
    setImportance(3);
    setUrgency(3);
    setImpact(3);
    setEffort(3);
    setHasManuallyOverriddenUrgency(false);
    setHasManuallyOverriddenEffort(false);
    setValidationError(null);
    setIsProfilingOpen(true);
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setValidationError('Task title is mandatory.');
      return;
    }

    const finalCategory = customCategory.trim() ? customCategory.trim() : category;
    let finalMegaBucket = megaBucket !== 'NONE' ? megaBucket : null;
    if (newBucketName.trim()) {
      const trimmedBucket = newBucketName.trim();
      if (onCreateBucket && !availableBuckets.includes(trimmedBucket)) {
        onCreateBucket(trimmedBucket);
      }
      finalMegaBucket = trimmedBucket;
    }

    onSubmit({
      title: title.trim(),
      notes: notes.trim() || undefined,
      category: finalCategory,
      megaBucket: finalMegaBucket,
      importance,
      urgency,
      recommendedUrgency,
      impact,
      effort,
      estimatedDurationMinutes,
      actualDurationSeconds: initialTask?.actualDurationSeconds || 0,
      cognitiveStrain,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null
    });

    resetForm();
    onClose();
  };

  const handleApplyRecommendedEffort = () => {
    setEffort(recommendedEffort);
    setHasManuallyOverriddenEffort(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl text-slate-900 dark:text-slate-100 overflow-hidden my-auto transition-colors">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold font-mono text-slate-900 dark:text-white tracking-wide">
                {isAiProposal
                  ? 'GEMINI AI TASK SPECIFICATION (OPTION A REVIEW)'
                  : initialTask
                  ? 'CALIBRATE TASK PARAMETERS'
                  : 'NEW TASK SPECIFICATION'}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-mono">
                {isAiProposal
                  ? 'AI PROPOSAL SYNTHESIZED — CALIBRATE & CONFIRM PRIOR TO INGESTION'
                  : 'AUTONOMOUS MATRIX & MISSION ALLOCATION'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {isAiProposal && (
            <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5 animate-pulse" />
              <div className="text-xs font-mono">
                <span className="font-extrabold text-cyan-800 dark:text-cyan-300 uppercase block">
                  Option A: Pre-populated AI Proposal Active
                </span>
                <span className="text-slate-600 dark:text-slate-300">
                  Gemini analyzed your request and suggested these parameters. Adjust importance, urgency, impact, effort, or notes below, then submit to save.
                </span>
              </div>
            </div>
          )}

          {validationError && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-mono">
              {validationError}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Task Directive / Action Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (validationError) setValidationError(null);
              }}
              placeholder="e.g., Deliver core architecture schema & Supabase sync..."
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm font-sans text-slate-900 dark:text-white transition-all placeholder:text-slate-400"
              autoFocus
            />
          </div>

          {/* Notes & Description */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <AlignLeft className="w-3.5 h-3.5" />
              Operational Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Context, sub-actions, constraints, or reference URLs..."
              rows={2}
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-xs font-sans text-slate-900 dark:text-white transition-all placeholder:text-slate-400 resize-none"
            />
          </div>

          {/* Categorization & Mega Task Bin Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" />
                Category Domain
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-xs font-mono text-slate-900 dark:text-white"
              >
                {DEFAULT_TASK_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Mega Task Bin / Mission Cluster */}
            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-500" />
                Mega Task Bin (Mission Stream)
              </label>
              <div className="flex items-center gap-1.5">
                <select
                  value={megaBucket}
                  onChange={(e) => {
                    if (e.target.value === '__NEW__') {
                      setIsCreatingBucket(true);
                    } else {
                      setMegaBucket(e.target.value);
                    }
                  }}
                  className="flex-1 px-3 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-mono text-slate-900 dark:text-white"
                >
                  <option value="NONE">None (Standalone Atomic Task)</option>
                  {availableBuckets.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                  {initialTask?.megaBucket && !availableBuckets.includes(initialTask.megaBucket) && (
                    <option value={initialTask.megaBucket}>
                      {initialTask.megaBucket}
                    </option>
                  )}
                  {onCreateBucket && (
                    <option value="__NEW__">+ Create New Mission Bin...</option>
                  )}
                </select>
                {onCreateBucket && !isCreatingBucket && (
                  <button
                    type="button"
                    onClick={() => setIsCreatingBucket(true)}
                    className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-colors cursor-pointer"
                    title="Create New Mission Bin"
                  >
                    <FolderPlus className="w-4 h-4" />
                  </button>
                )}
              </div>
              {isCreatingBucket && (
                <div className="flex items-center gap-1 mt-2">
                  <input
                    type="text"
                    value={newBucketName}
                    onChange={(e) => setNewBucketName(e.target.value)}
                    placeholder="New Mission Bin..."
                    className="flex-1 px-2.5 py-1.5 rounded-xl text-xs font-mono bg-white dark:bg-slate-800 border border-indigo-400 text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newBucketName.trim() && onCreateBucket) {
                        onCreateBucket(newBucketName.trim());
                        setMegaBucket(newBucketName.trim());
                        setNewBucketName('');
                        setIsCreatingBucket(false);
                      }
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-mono font-bold cursor-pointer"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreatingBucket(false)}
                    className="px-2 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-xs font-mono cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Time & Cognitive Bandwidth Questions (Ask how long and what strain) */}
          <div className="p-4 rounded-2xl bg-cyan-50/50 dark:bg-cyan-950/20 border border-cyan-200/80 dark:border-cyan-800/60 space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono font-extrabold text-cyan-800 dark:text-cyan-300 uppercase">
              <BrainCircuit className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>TIME COMMITMENT & COGNITIVE STRAIN CALIBRATION</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Question 1: How long will this task take? */}
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                  1. How long might this task take?
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { label: '15 min', val: 15 },
                    { label: '30 min', val: 30 },
                    { label: '45 min', val: 45 },
                    { label: '1 hour', val: 60 },
                    { label: '2 hours', val: 120 },
                    { label: '4+ hrs', val: 240 }
                  ].map((dur) => (
                    <button
                      key={dur.val}
                      type="button"
                      onClick={() => {
                        setEstimatedDurationMinutes(dur.val);
                        setHasManuallyOverriddenEffort(false);
                      }}
                      className={`py-2 px-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                        estimatedDurationMinutes === dur.val
                          ? 'bg-cyan-600 text-white shadow-sm'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {dur.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question 2: What level of cognitive strain is it? */}
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                  2. What level of cognitive strain?
                </label>
                <div className="space-y-1.5">
                  {(['LOW', 'MODERATE', 'HIGH', 'EXTREME'] as CognitiveStrainLevel[]).map((st) => {
                    const def = COGNITIVE_STRAIN_DEFINITIONS[st];
                    const isSelected = cognitiveStrain === st;
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => {
                          setCognitiveStrain(st);
                          setHasManuallyOverriddenEffort(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs font-mono transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-cyan-600 text-white border-cyan-600 font-bold shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span>{def.label}</span>
                        <span className="text-[10px] opacity-75">Weight {def.scoreWeight}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Recommended Effort Banner based on answers */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/90 dark:bg-slate-900/80 border border-cyan-300/80 dark:border-cyan-800/80 text-xs font-mono">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                <span>
                  RECOMMENDED EFFORT:{' '}
                  <strong className="text-cyan-800 dark:text-cyan-300 font-extrabold">
                    Level {recommendedEffort} ({EFFORT_DEFINITIONS[recommendedEffort].title.split('(')[0].trim()})
                  </strong>
                </span>
              </div>
              {effort !== recommendedEffort && (
                <button
                  type="button"
                  onClick={handleApplyRecommendedEffort}
                  className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-bold uppercase transition-colors cursor-pointer"
                >
                  Apply Recommended
                </button>
              )}
            </div>
          </div>

          {/* Due Date & Recommended Urgency */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Target Deadline (Optional)
            </label>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => {
                setDueDate(e.target.value);
                setHasManuallyOverriddenUrgency(false);
              }}
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-xs font-mono text-slate-900 dark:text-white"
            />
            {dueDate && (
              <div className="mt-2 text-xs font-mono text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-500" />
                <span>
                  Due proximity recommends Urgency{' '}
                  <strong className="text-cyan-600 dark:text-cyan-400">
                    Level {recommendedUrgency}
                  </strong>
                </span>
              </div>
            )}
          </div>

          {/* Collapsible Profiling Drawer (Importance, Urgency, Impact, Effort) */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden bg-slate-50/50 dark:bg-slate-950/40">
            <button
              type="button"
              onClick={() => setIsProfilingOpen((prev) => !prev)}
              className="w-full flex items-center justify-between p-4 bg-slate-100/80 dark:bg-slate-900/80 text-left font-mono text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-cyan-500" />
                <span>FINE-GRAINED CALIBRATION (1 TO 5 SCALES)</span>
              </div>
              {isProfilingOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {isProfilingOpen && (
              <div className="p-5 space-y-5 bg-white dark:bg-slate-900">
                {/* 1. Importance (1 to 5) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-mono font-bold uppercase text-slate-700 dark:text-slate-300">
                      Importance (Vital Life Objective)
                    </label>
                    <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
                      Level {importance}: {IMPORTANCE_DEFINITIONS[importance].title}
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {([1, 2, 3, 4, 5] as ImportanceLevel[]).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setImportance(lvl)}
                        className={`py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                          importance === lvl
                            ? 'bg-rose-500 text-white shadow-md'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Urgency (1 to 5) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-mono font-bold uppercase text-slate-700 dark:text-slate-300">
                      Urgency (Time Criticality)
                    </label>
                    <span className="text-xs font-mono font-bold text-orange-600 dark:text-orange-400">
                      Level {urgency}: {URGENCY_DEFINITIONS[urgency].title}
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {([1, 2, 3, 4, 5] as UrgencyLevel[]).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => {
                          setUrgency(lvl);
                          setHasManuallyOverriddenUrgency(true);
                        }}
                        className={`py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                          urgency === lvl
                            ? 'bg-orange-500 text-white shadow-md'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Impact (1 to 5) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-mono font-bold uppercase text-slate-700 dark:text-slate-300">
                      Impact (Leverage / Outcome Scale)
                    </label>
                    <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      Level {impact}: {IMPACT_DEFINITIONS[impact].title}
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {([1, 2, 3, 4, 5] as ImpactLevel[]).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setImpact(lvl)}
                        className={`py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                          impact === lvl
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Effort (1 to 5) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-mono font-bold uppercase text-slate-700 dark:text-slate-300">
                      Effort (Operational Drag / Energy Cost)
                    </label>
                    <span className="text-xs font-mono font-bold text-teal-600 dark:text-teal-400">
                      Level {effort}: {EFFORT_DEFINITIONS[effort].title}
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {([1, 2, 3, 4, 5] as EffortLevel[]).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => {
                          setEffort(lvl);
                          setHasManuallyOverriddenEffort(true);
                        }}
                        className={`py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                          effort === lvl
                            ? 'bg-teal-600 text-white shadow-md'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer Controls */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-mono font-extrabold uppercase tracking-wider transition-all shadow-md shadow-cyan-600/25 cursor-pointer active:scale-95"
            >
              {initialTask ? 'Update Directive' : 'Ingest Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
