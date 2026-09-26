/**
 * @fileoverview Universal Global Command Palette & Natural Language Parser (`Cmd+K` / `Ctrl+K`).
 * Allows instant natural language task ingestion, rapid navigation across views,
 * focused task search, and hotkey execution (`j`/`k`, `x` complete, `f` focus).
 * @packageDocumentation
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  TaskItem,
  ImportanceLevel,
  UrgencyLevel,
  ImpactLevel,
  EffortLevel,
  SortingViewMode
} from '../types/task';
import {
  Search,
  Plus,
  Terminal,
  Compass,
  Zap,
  Target,
  CheckCircle2,
  HelpCircle,
  Clock,
  Sparkles,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { calculateRecommendedUrgency, calculateRecommendedEffort } from '../constants/definitions';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskItem[];
  availableBuckets?: string[];
  onCreateBucket?: (bucketName: string) => void;
  onSelectBucket?: (bucketName: string | 'ALL') => void;
  onAddTask: (task: Omit<TaskItem, 'id' | 'createdAt' | 'updatedAt' | 'isCompleted' | 'completedAt'>) => void;
  onSelectTask: (task: TaskItem) => void;
  onCompleteTask: (id: string, isCompleted: boolean) => void;
  onChangeViewMode: (mode: SortingViewMode) => void;
  onOpenFocusMode: (taskId?: string) => void;
  onOpenNewTaskModal: () => void;
}

type ParsedCommand =
  | { type: 'VIEW'; mode: SortingViewMode; label: string }
  | { type: 'FOCUS'; label: string }
  | { type: 'NEW_MODAL'; label: string }
  | { type: 'HELP'; label: string }
  | { type: 'BUCKET_FILTER'; bucketName: string; isNew: boolean; label: string }
  | {
      type: 'CREATE_TASK';
      title: string;
      importance: ImportanceLevel;
      urgency: UrgencyLevel;
      impact: ImpactLevel;
      effort: EffortLevel;
      dueDate: string | null;
      megaBucket: string | null;
      isNewBucket: boolean;
    };

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  tasks,
  availableBuckets = [],
  onCreateBucket,
  onSelectBucket,
  onAddTask,
  onSelectTask,
  onCompleteTask,
  onChangeViewMode,
  onOpenFocusMode,
  onOpenNewTaskModal
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showCheatsheet, setShowCheatsheet] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      setQuery('');
      setShowCheatsheet(false);
    }
  }, [isOpen]);

  // Natural Language Parser Helper
  const parsedCommand = useMemo<ParsedCommand | null>(() => {
    const raw = query.trim();
    if (!raw) return null;

    // Direct View or Slash Commands
    if (raw.startsWith('/')) {
      const slashBody = raw.slice(1).trim();
      const lowerSlash = slashBody.toLowerCase();

      // Bucket navigation command: /bucket [name] or /bin [name] or /b [name]
      const bucketNavMatch = slashBody.match(/^(?:bucket|bin|b)\s+(.+)$/i);
      if (bucketNavMatch) {
        const bucketName = bucketNavMatch[1].trim().replace(/^["']|["']$/g, '');
        if (bucketName) {
          const isNew = !availableBuckets.some((b) => b.toLowerCase() === bucketName.toLowerCase());
          return {
            type: 'BUCKET_FILTER',
            bucketName,
            isNew,
            label: isNew
              ? `Create & Switch to New Mission Bin: "${bucketName}"`
              : `Switch Matrix Filter to Mission Bin: "${bucketName}"`
          };
        }
      }

      if (lowerSlash === 'strategic' || lowerSlash === 'strat') return { type: 'VIEW', mode: 'STRATEGIC' as SortingViewMode, label: 'Switch to Strategic Priority' };
      if (lowerSlash === 'matrix' || lowerSlash === 'eisenhower') return { type: 'VIEW', mode: 'MATRIX' as SortingViewMode, label: 'Switch to Eisenhower 2x2 Matrix' };
      if (lowerSlash === 'impact' || lowerSlash === 'effort') return { type: 'VIEW', mode: 'IMPACT_EFFORT' as SortingViewMode, label: 'Switch to Impact-Effort Matrix' };
      if (lowerSlash === 'deadline' || lowerSlash === 'urgent') return { type: 'VIEW', mode: 'DEADLINE' as SortingViewMode, label: 'Switch to Deadline Acceleration' };
      if (lowerSlash === 'focus' || lowerSlash === 'spotlight' || lowerSlash === 'pomo') return { type: 'FOCUS', label: 'Engage Command Spotlight & Focus Chronometer' };
      if (lowerSlash === 'new') return { type: 'NEW_MODAL', label: 'Open Full Task Specification Modal' };
      if (lowerSlash === 'help' || lowerSlash === '?') return { type: 'HELP', label: 'Show Command Language Syntax Guide' };
    }

    // Direct bucket command without slash: bucket [name] or bin [name]
    const directBucketMatch = raw.match(/^(?:bucket|bin)\s+([^:=].+)$/i);
    if (directBucketMatch && !directBucketMatch[1].toLowerCase().includes('imp') && !directBucketMatch[1].toLowerCase().includes('due')) {
      const bucketName = directBucketMatch[1].trim().replace(/^["']|["']$/g, '');
      if (bucketName) {
        const isNew = !availableBuckets.some((b) => b.toLowerCase() === bucketName.toLowerCase());
        return {
          type: 'BUCKET_FILTER',
          bucketName,
          isNew,
          label: isNew
            ? `Create & Switch to New Mission Bin: "${bucketName}"`
            : `Switch Matrix Filter to Mission Bin: "${bucketName}"`
        };
      }
    }

    // Natural Task Ingestion:
    // Prefixes: add, task, create, new, q1, q2, q3, q4, qw, quickwin, mp, majorproject, fi, fillin, ts, timesink
    // Or auto-detected if inline flags exist (imp, urg, impact, effort, bucket:, bin:, due)
    const lower = raw.toLowerCase();
    const isExplicitAdd = lower.startsWith('add ') || lower.startsWith('task ') || lower.startsWith('create ') || lower.startsWith('new ');
    const isQ1 = lower.startsWith('q1 ');
    const isQ2 = lower.startsWith('q2 ');
    const isQ3 = lower.startsWith('q3 ');
    const isQ4 = lower.startsWith('q4 ');
    const isQuickWin = lower.startsWith('qw ') || lower.startsWith('quickwin ');
    const isMajorProject = lower.startsWith('mp ') || lower.startsWith('majorproject ');
    const isFillIn = lower.startsWith('fi ') || lower.startsWith('fillin ');
    const isTimeSink = lower.startsWith('ts ') || lower.startsWith('timesink ');

    const hasInlineFlags =
      /\b(impact|impct|impac|effort|eff|imp|importance|urg|urgency)\s*[:=]?\s*[1-5]\b/i.test(raw) ||
      /\b(?:bucket|bin|b)\s*[:=]\s*/i.test(raw) ||
      /\bdue\s*(?:today|tomorrow)\b/i.test(raw);

    if (
      isExplicitAdd ||
      isQ1 ||
      isQ2 ||
      isQ3 ||
      isQ4 ||
      isQuickWin ||
      isMajorProject ||
      isFillIn ||
      isTimeSink ||
      hasInlineFlags
    ) {
      let content = raw;
      let importance: ImportanceLevel = 3;
      let urgency: UrgencyLevel = 3;
      let impact: ImpactLevel = 3;
      let effort: EffortLevel = 3;

      if (isExplicitAdd) {
        content = raw.slice(raw.indexOf(' ') + 1).trim();
      } else if (isQ1) {
        content = raw.slice(3).trim();
        importance = 5;
        urgency = 5;
      } else if (isQ2) {
        content = raw.slice(3).trim();
        importance = 5;
        urgency = 2;
      } else if (isQ3) {
        content = raw.slice(3).trim();
        importance = 2;
        urgency = 5;
      } else if (isQ4) {
        content = raw.slice(3).trim();
        importance = 1;
        urgency = 1;
      } else if (isQuickWin) {
        content = raw.slice(raw.indexOf(' ') + 1).trim();
        impact = 5;
        effort = 1;
        importance = 4;
        urgency = 3;
      } else if (isMajorProject) {
        content = raw.slice(raw.indexOf(' ') + 1).trim();
        impact = 5;
        effort = 5;
        importance = 5;
        urgency = 3;
      } else if (isFillIn) {
        content = raw.slice(raw.indexOf(' ') + 1).trim();
        impact = 2;
        effort = 2;
        importance = 2;
        urgency = 2;
      } else if (isTimeSink) {
        content = raw.slice(raw.indexOf(' ') + 1).trim();
        impact = 1;
        effort = 5;
        importance = 1;
        urgency = 1;
      }

      // 1. Extract Impact: impact 4, impact: 4, impct: 4, impac 4, impact=4
      const impactMatch = content.match(/\b(impact|impct|impac)\s*[:=]?\s*([1-5])\b/i);
      if (impactMatch) {
        const val = parseInt(impactMatch[2], 10);
        if (val >= 1 && val <= 5) impact = val as ImpactLevel;
        content = content.replace(impactMatch[0], '').trim();
      }

      // 2. Extract Effort: effort 2, effort: 2, eff: 2, eff 2, effort=2
      const effortMatch = content.match(/\b(effort|eff)\s*[:=]?\s*([1-5])\b/i);
      if (effortMatch) {
        const val = parseInt(effortMatch[2], 10);
        if (val >= 1 && val <= 5) effort = val as EffortLevel;
        content = content.replace(effortMatch[0], '').trim();
      }

      // 3. Extract Importance: imp 5, imp: 5, importance: 5, importance 5
      const impMatch = content.match(/\b(importance|imp)\s*[:=]?\s*([1-5])\b/i);
      if (impMatch) {
        const val = parseInt(impMatch[2], 10);
        if (val >= 1 && val <= 5) importance = val as ImportanceLevel;
        content = content.replace(impMatch[0], '').trim();
      }

      // 4. Extract Urgency: urg 4, urg: 4, urgency: 4, urgency 4
      const urgMatch = content.match(/\b(urgency|urg)\s*[:=]?\s*([1-5])\b/i);
      if (urgMatch) {
        const val = parseInt(urgMatch[2], 10);
        if (val >= 1 && val <= 5) urgency = val as UrgencyLevel;
        content = content.replace(urgMatch[0], '').trim();
      }

      // 5. Extract Bucket / Bin: bucket: "Dev Ops", bucket: Dev, bin: Design, b: Core, bucket Marketing
      let dueDate: string | null = null;
      let megaBucket: string | null = null;

      const bucketMatch = content.match(/\b(?:bucket|bin|b)\s*[:=]\s*(?:"([^"]+)"|'([^']+)'|(\S+))|\b(?:bucket|bin)\s+(?:"([^"]+)"|'([^']+)'|(\S+))/i);
      if (bucketMatch) {
        megaBucket = bucketMatch[1] || bucketMatch[2] || bucketMatch[3] || bucketMatch[4] || bucketMatch[5] || bucketMatch[6];
        content = content.replace(bucketMatch[0], '').trim();
      }

      // 6. Extract Due: due tomorrow, due today, due: tomorrow, due: today
      if (/\bdue\s*[:=]?\s*tomorrow\b/i.test(content)) {
        dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        content = content.replace(/\bdue\s*[:=]?\s*tomorrow\b/i, '').trim();
      } else if (/\bdue\s*[:=]?\s*today\b/i.test(content)) {
        dueDate = new Date().toISOString();
        content = content.replace(/\bdue\s*[:=]?\s*today\b/i, '').trim();
      }

      if (content.length > 0) {
        const isNewBucket = Boolean(
          megaBucket && !availableBuckets.some((b) => b.toLowerCase() === megaBucket!.trim().toLowerCase())
        );
        return {
          type: 'CREATE_TASK',
          title: content,
          importance,
          urgency,
          impact,
          effort,
          dueDate,
          megaBucket: megaBucket ? megaBucket.trim() : null,
          isNewBucket
        };
      }
    }

    return null;
  }, [query, availableBuckets]);

  // Filter existing tasks matching query
  const matchingTasks = useMemo(() => {
    if (!query.trim()) return tasks.slice(0, 6);
    const q = query.toLowerCase();
    return tasks
      .filter((t) => t.title.toLowerCase().includes(q) || (t.notes && t.notes.toLowerCase().includes(q)))
      .slice(0, 8);
  }, [tasks, query]);

  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, matchingTasks.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      executeSelection();
    }
  };

  const executeSelection = () => {
    if (parsedCommand) {
      if (parsedCommand.type === 'VIEW') {
        onChangeViewMode(parsedCommand.mode);
        onClose();
      } else if (parsedCommand.type === 'FOCUS') {
        onOpenFocusMode();
        onClose();
      } else if (parsedCommand.type === 'NEW_MODAL') {
        onOpenNewTaskModal();
        onClose();
      } else if (parsedCommand.type === 'HELP') {
        setShowCheatsheet(true);
      } else if (parsedCommand.type === 'BUCKET_FILTER') {
        const bucketName = parsedCommand.bucketName.trim();
        if (parsedCommand.isNew && onCreateBucket) {
          onCreateBucket(bucketName);
        }
        if (onSelectBucket) {
          onSelectBucket(bucketName);
        }
        onClose();
      } else if (parsedCommand.type === 'CREATE_TASK') {
        const bucketToAssign = parsedCommand.megaBucket ? parsedCommand.megaBucket.trim() : null;
        if (bucketToAssign && onCreateBucket && !availableBuckets.includes(bucketToAssign)) {
          onCreateBucket(bucketToAssign);
        }
        onAddTask({
          title: parsedCommand.title,
          category: 'Work',
          importance: parsedCommand.importance,
          urgency: parsedCommand.urgency,
          recommendedUrgency: calculateRecommendedUrgency(parsedCommand.dueDate),
          impact: parsedCommand.impact,
          effort: parsedCommand.effort,
          dueDate: parsedCommand.dueDate,
          megaBucket: bucketToAssign,
          estimatedDurationMinutes: 30,
          actualDurationSeconds: 0,
          cognitiveStrain: 'MODERATE'
        });
        onClose();
      }
      return;
    }

    if (matchingTasks.length > 0 && selectedIndex < matchingTasks.length) {
      const selected = matchingTasks[selectedIndex];
      onSelectTask(selected);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-all text-slate-900 dark:text-slate-100">
        {/* Command Input Bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80">
          <Terminal className="w-5 h-5 text-cyan-600 dark:text-cyan-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command (/matrix, /bucket Ops), or task (q1 Fix bug impact 5 effort 1 bucket: Infra)..."
            className="w-full bg-transparent text-sm font-mono placeholder:text-slate-500 focus:outline-none text-slate-900 dark:text-white"
          />
          <button
            type="button"
            onClick={() => setShowCheatsheet((prev) => !prev)}
            className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            title="Command Syntax Guide"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>

        {/* Natural Language Ingestion Action Banner */}
        {parsedCommand && (
          <div className="px-5 py-3.5 bg-cyan-500/10 border-b border-cyan-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-xs font-mono">
              <Sparkles className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
              {parsedCommand.type === 'CREATE_TASK' ? (
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-cyan-800 dark:text-cyan-300 uppercase">
                      ACTION: INGEST NEW TASK →
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">
                      "{parsedCommand.title}"
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] text-slate-600 dark:text-slate-300">
                    <span className="px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-[10px] font-bold">
                      IMP: {parsedCommand.importance}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-[10px] font-bold">
                      URG: {parsedCommand.urgency}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold border border-emerald-300 dark:border-emerald-800">
                      IMPACT: {parsedCommand.impact}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 text-[10px] font-bold border border-indigo-300 dark:border-indigo-800">
                      EFFORT: {parsedCommand.effort}
                    </span>
                    {parsedCommand.megaBucket && (
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                          parsedCommand.isNewBucket
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700 animate-pulse'
                            : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                        }`}
                      >
                        📁 {parsedCommand.megaBucket} {parsedCommand.isNewBucket ? '(NEW BIN - AUTO CREATE)' : ''}
                      </span>
                    )}
                    {parsedCommand.dueDate && (
                      <span className="px-1.5 py-0.5 rounded bg-cyan-100 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 text-[10px] font-bold border border-cyan-200 dark:border-cyan-800">
                        ⏰ DUE SET
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <span className="font-extrabold text-cyan-800 dark:text-cyan-300 uppercase">
                    SYSTEM COMMAND:
                  </span>{' '}
                  <span className="font-bold text-slate-900 dark:text-white">
                    {parsedCommand.label}
                  </span>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={executeSelection}
              className="px-3 py-1 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-[11px] font-bold uppercase transition-all cursor-pointer shrink-0 ml-2"
            >
              Press Enter ↵
            </button>
          </div>
        )}

        {/* Search Results List */}
        <div className="max-h-80 overflow-y-auto p-3 space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase text-slate-500 tracking-wider">
            {matchingTasks.length > 0 ? 'MATCHING TASKS' : 'NO TASKS MATCH QUERY'}
          </div>

          {matchingTasks.map((t, idx) => (
            <div
              key={t.id}
              onClick={() => {
                onSelectTask(t);
                onClose();
              }}
              className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer text-xs font-mono transition-all ${
                selectedIndex === idx
                  ? 'bg-cyan-50 dark:bg-cyan-950/50 border border-cyan-300 dark:border-cyan-800/80 shadow-xs'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <span
                  className={`w-2 h-2 rounded-full ${
                    t.isCompleted
                      ? 'bg-slate-400'
                      : t.importance >= 4 && t.urgency >= 4
                      ? 'bg-rose-500'
                      : 'bg-cyan-500'
                  }`}
                />
                <span className={`truncate font-bold ${t.isCompleted ? 'line-through text-slate-500' : 'text-slate-900 dark:text-white'}`}>
                  {t.title}
                </span>
                {t.megaBucket && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    {t.megaBucket}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0 ml-3">
                <span className="text-[10px] text-slate-500">
                  IMP:{t.importance} • URG:{t.urgency}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenFocusMode(t.id);
                    onClose();
                  }}
                  className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-cyan-600 hover:text-white text-[10px] text-slate-700 dark:text-slate-300 transition-colors"
                >
                  Focus
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Embedded Syntax Cheatsheet Drawer */}
        {showCheatsheet && (
          <div className="p-4 bg-slate-100 dark:bg-slate-950/90 border-t border-slate-200 dark:border-slate-800 text-xs font-mono space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-extrabold uppercase text-cyan-700 dark:text-cyan-400">
                COMMAND PALETTE SYNTAX CHEATSHEET
              </span>
              <button
                type="button"
                onClick={() => setShowCheatsheet(false)}
                className="text-slate-500 hover:text-slate-900 dark:hover:text-white text-[11px]"
              >
                Hide
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-700 dark:text-slate-300">
              <div>
                <strong>Natural Task Entry (with Impact & Effort):</strong>
                <p className="text-slate-500 dark:text-slate-400">`add Title impact 4 effort 2 imp 5 urg 3 due tomorrow`</p>
                <p className="text-slate-500 dark:text-slate-400">`add Title bucket: "New Bin"` (creates bin if non-existent!)</p>
                <p className="text-slate-500 dark:text-slate-400">`qw Fast index` (Quick Win: Impact 5, Effort 1)</p>
                <p className="text-slate-500 dark:text-slate-400">`mp Big project` (Major Project: Impact 5, Effort 5)</p>
                <p className="text-slate-500 dark:text-slate-400">`fi Tidy desk` (Fill-In: Impact 2, Effort 2)</p>
                <p className="text-slate-500 dark:text-slate-400">`ts Casual browsing` (Time Sink: Impact 1, Effort 5)</p>
              </div>
              <div>
                <strong>View & Mission Bin Commands:</strong>
                <p className="text-slate-500 dark:text-slate-400">`/bucket [name]` → Select or Auto-Create Mission Bin</p>
                <p className="text-slate-500 dark:text-slate-400">`/impact` or `/effort` → Action Priority 2x2</p>
                <p className="text-slate-500 dark:text-slate-400">`/matrix` → Eisenhower 2x2 Matrix</p>
                <p className="text-slate-500 dark:text-slate-400">`/strategic` → Strategic Priority List</p>
                <p className="text-slate-500 dark:text-slate-400">`/focus` or `/spotlight` → Deep Work Focus</p>
              </div>
            </div>
          </div>
        )}

        {/* Footer Hotkey Legend */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 flex items-center justify-between text-[11px] font-mono text-slate-500">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select/Run</span>
            <span>ESC Close</span>
          </div>
          <span>PRESS ? OR TYPE /HELP FOR GUIDE</span>
        </div>
      </div>
    </div>
  );
};
