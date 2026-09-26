/**
 * @fileoverview Command Spotlight HUD & Deep Work Pomodoro Chronometer.
 * Isolates an operator's selected high-priority task, provides an Ultradian 90-minute
 * focus timer with proportional rest calculation, and accumulates real-time focus duration telemetry.
 * @packageDocumentation
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  TaskItem,
  CognitiveStrainLevel
} from '../types/task';
import {
  FOCUS_PRESETS,
  COGNITIVE_STRAIN_DEFINITIONS,
  IMPORTANCE_DEFINITIONS,
  URGENCY_DEFINITIONS
} from '../constants/definitions';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Clock,
  Zap,
  Target,
  ChevronDown,
  Layers,
  Sparkles,
  Coffee,
  BrainCircuit
} from 'lucide-react';

interface CommandSpotlightModalProps {
  isOpen: boolean;
  tasks: TaskItem[];
  defaultTaskId?: string | null;
  onClose: () => void;
  onUpdateTask: (id: string, updates: Partial<TaskItem>) => Promise<TaskItem>;
  onCompleteTask: (id: string, isCompleted: boolean) => void;
  onTriggerBurst?: (x: number, y: number) => void;
}

export const CommandSpotlightModal: React.FC<CommandSpotlightModalProps> = ({
  isOpen,
  tasks,
  defaultTaskId,
  onClose,
  onUpdateTask,
  onCompleteTask,
  onTriggerBurst
}) => {
  const activeTasks = useMemo(() => tasks.filter((t) => !t.isCompleted), [tasks]);

  const [selectedTaskId, setSelectedTaskId] = useState<string>(() => {
    if (defaultTaskId && activeTasks.some((t) => t.id === defaultTaskId)) {
      return defaultTaskId;
    }
    return activeTasks[0]?.id || '';
  });

  const [isTaskSelectorOpen, setIsTaskSelectorOpen] = useState(false);

  // Focus Chronometer States
  const [workDurationMinutes, setWorkDurationMinutes] = useState(90);
  const restDurationMinutes = useMemo(() => {
    // Proportional rest calculation: ~4.5:1 ratio
    return Math.max(5, Math.round(workDurationMinutes / 4.5));
  }, [workDurationMinutes]);

  const [timerMode, setTimerMode] = useState<'WORK' | 'REST'>('WORK');
  const [secondsRemaining, setSecondsRemaining] = useState(90 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionSecondsElapsed, setSessionSecondsElapsed] = useState(0);

  const activeTask = useMemo(() => {
    return tasks.find((t) => t.id === selectedTaskId) || activeTasks[0] || null;
  }, [tasks, selectedTaskId, activeTasks]);

  // Sync selected task when default changes
  useEffect(() => {
    if (defaultTaskId && activeTasks.some((t) => t.id === defaultTaskId)) {
      setSelectedTaskId(defaultTaskId);
    } else if (activeTasks.length > 0 && !activeTasks.some((t) => t.id === selectedTaskId)) {
      setSelectedTaskId(activeTasks[0].id);
    }
  }, [defaultTaskId, activeTasks, selectedTaskId]);

  // Reset timer on duration change
  useEffect(() => {
    if (!isRunning) {
      setSecondsRemaining(
        timerMode === 'WORK' ? workDurationMinutes * 60 : restDurationMinutes * 60
      );
    }
  }, [workDurationMinutes, restDurationMinutes, timerMode, isRunning]);

  // Chronometer ticker
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            // Timer expired
            if (timerMode === 'WORK') {
              setTimerMode('REST');
              return restDurationMinutes * 60;
            } else {
              setTimerMode('WORK');
              setIsRunning(false);
              return workDurationMinutes * 60;
            }
          }
          return prev - 1;
        });

        if (timerMode === 'WORK') {
          setSessionSecondsElapsed((prev) => prev + 1);
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timerMode, workDurationMinutes, restDurationMinutes]);

  // Synchronize elapsed session seconds back to task periodically
  const lastSyncRef = useRef<number>(0);
  useEffect(() => {
    if (sessionSecondsElapsed > 0 && sessionSecondsElapsed - lastSyncRef.current >= 15 && activeTask) {
      lastSyncRef.current = sessionSecondsElapsed;
      const currentLogged = activeTask.actualDurationSeconds || 0;
      onUpdateTask(activeTask.id, {
        actualDurationSeconds: currentLogged + 15,
        lastWorkedAt: new Date().toISOString()
      });
    }
  }, [sessionSecondsElapsed, activeTask, onUpdateTask]);

  if (!isOpen || !activeTask) return null;

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleTimer = () => {
    setIsRunning((prev) => !prev);
  };

  const handleResetTimer = () => {
    setIsRunning(false);
    setSecondsRemaining(
      timerMode === 'WORK' ? workDurationMinutes * 60 : restDurationMinutes * 60
    );
  };

  const handleCompleteCurrentTask = (e: React.MouseEvent) => {
    if (onTriggerBurst) {
      onTriggerBurst(e.clientX, e.clientY);
    }
    // Finalize time logged
    const remainingDelta = sessionSecondsElapsed - lastSyncRef.current;
    if (remainingDelta > 0) {
      onUpdateTask(activeTask.id, {
        actualDurationSeconds: (activeTask.actualDurationSeconds || 0) + remainingDelta,
        lastWorkedAt: new Date().toISOString()
      });
    }
    onCompleteTask(activeTask.id, true);
    setIsRunning(false);
    onClose();
  };

  const totalLoggedMinutes = Math.round(
    ((activeTask.actualDurationSeconds || 0) + sessionSecondsElapsed) / 60
  );
  const estimatedMins = activeTask.estimatedDurationMinutes || 45;
  const progressRatio = Math.min(
    1,
    (timerMode === 'WORK' ? workDurationMinutes * 60 - secondsRemaining : restDurationMinutes * 60 - secondsRemaining) /
      (timerMode === 'WORK' ? workDurationMinutes * 60 : restDurationMinutes * 60)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-2xl overflow-y-auto animate-fadeIn">
      {/* Container Card */}
      <div className="relative w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl text-slate-100 p-6 sm:p-8 space-y-6 overflow-hidden my-auto">
        {/* Glow ambient background aura */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-40 bg-cyan-500/15 blur-3xl pointer-events-none" />

        {/* Header Strip */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
              <Target className="w-5 h-5 animate-pulse-subtle" />
            </div>
            <div>
              <span className="text-[11px] font-mono font-extrabold uppercase tracking-widest text-cyan-400 block">
                COMMAND SPOTLIGHT // DEEP WORK MODE
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Ultradian Chronometer • Single-Point Execution HUD
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Task Chooser Dropdown */}
        <div className="relative z-20">
          <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            ACTIVE FOCUS TARGET (CLICK TO SWITCH TARGET)
          </label>
          <button
            type="button"
            onClick={() => setIsTaskSelectorOpen((prev) => !prev)}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-left transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2.5 truncate">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-extrabold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {activeTask.category}
              </span>
              {activeTask.megaBucket && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {activeTask.megaBucket}
                </span>
              )}
              <span className="font-bold text-sm text-white truncate">
                {activeTask.title}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
          </button>

          {/* Task Dropdown Menu */}
          {isTaskSelectorOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 max-h-60 overflow-y-auto rounded-2xl bg-slate-800 border border-slate-700 shadow-2xl z-30 p-2 space-y-1">
              {activeTasks.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setSelectedTaskId(t.id);
                    setIsTaskSelectorOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs font-mono transition-colors cursor-pointer ${
                    t.id === activeTask.id
                      ? 'bg-cyan-600 text-white font-bold'
                      : 'hover:bg-slate-700/70 text-slate-200'
                  }`}
                >
                  <span className="truncate max-w-[360px]">{t.title}</span>
                  <span className="text-[10px] opacity-75 shrink-0 ml-2">
                    IMP:{t.importance} • URG:{t.urgency}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Focused Hero Card Details */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3">
          <h2 className="text-lg font-bold text-white leading-snug">
            {activeTask.title}
          </h2>
          {activeTask.notes && (
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {activeTask.notes}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-mono">
            <span className="px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-bold">
              IMPORTANCE: {activeTask.importance}/5
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-bold">
              URGENCY: {activeTask.urgency}/5
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-bold">
              IMPACT: {activeTask.impact}/5
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-bold">
              EFFORT: {activeTask.effort}/5
            </span>
            {activeTask.cognitiveStrain && (
              <span className="px-2.5 py-1 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold flex items-center gap-1">
                <BrainCircuit className="w-3 h-3" />
                {activeTask.cognitiveStrain} STRAIN
              </span>
            )}
          </div>
        </div>

        {/* Ultradian / Pomodoro Chronometer Display */}
        <div className="text-center py-4 space-y-4">
          <div className="flex items-center justify-center gap-2 font-mono text-xs uppercase font-extrabold tracking-widest text-slate-400">
            {timerMode === 'WORK' ? (
              <span className="flex items-center gap-1.5 text-cyan-400">
                <Zap className="w-4 h-4 animate-pulse" />
                DEEP WORK FOCUS PHASE
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-emerald-400">
                <Coffee className="w-4 h-4" />
                COGNITIVE RECOVERY / REST PHASE
              </span>
            )}
          </div>

          {/* Digital Chronometer */}
          <div className="font-mono text-6xl sm:text-7xl font-extrabold tracking-tight text-white drop-shadow-md">
            {formatTime(secondsRemaining)}
          </div>

          {/* Proportional Rest Indicator */}
          <div className="text-xs font-mono text-slate-400 flex items-center justify-center gap-2">
            <span>Work Block: {workDurationMinutes}m</span>
            <span>•</span>
            <span className="text-emerald-400 font-bold">
              Auto-Calculated Rest: {restDurationMinutes}m
            </span>
          </div>

          {/* Circular/Linear Progress Bar */}
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden max-w-md mx-auto">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                timerMode === 'WORK'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-400'
              }`}
              style={{ width: `${progressRatio * 100}%` }}
            />
          </div>

          {/* Timer Duration Presets */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {FOCUS_PRESETS.map((p) => (
              <button
                key={p.workMinutes}
                type="button"
                onClick={() => {
                  setWorkDurationMinutes(p.workMinutes);
                  setIsRunning(false);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  workDurationMinutes === p.workMinutes
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
              >
                {p.workMinutes}m Focus ({p.restMinutes}m Rest)
              </button>
            ))}
          </div>

          {/* Controls: Start/Pause/Reset */}
          <div className="flex items-center justify-center gap-3 pt-3">
            <button
              type="button"
              onClick={handleToggleTimer}
              className={`px-6 py-3 rounded-2xl font-mono text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95 ${
                isRunning
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/25'
              }`}
            >
              {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isRunning ? 'PAUSE CHRONOMETER' : 'ENGAGE FOCUS TIMER'}
            </button>

            <button
              type="button"
              onClick={handleResetTimer}
              className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Reset Timer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Telemetry Comparison: Estimate vs Actual */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-300">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>ESTIMATE: <strong className="text-white font-extrabold">{estimatedMins} min</strong></span>
          </div>

          <div className="flex items-center gap-2 text-slate-300">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>TOTAL LOGGED: <strong className="text-white font-extrabold">{totalLoggedMinutes} min</strong></span>
          </div>
        </div>

        {/* Action: Resolve Task with Velocity Burst */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleCompleteCurrentTask}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-mono text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all cursor-pointer active:scale-98"
          >
            <CheckCircle2 className="w-4 h-4" />
            MARK COMPLETE // TRIGGER VELOCITY BURST
          </button>
        </div>
      </div>
    </div>
  );
};
