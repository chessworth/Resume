/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Main application controller for Jarvis Task Matrix.
 * Orchestrates task persistence, multi-criteria priority ranking,
 * Supabase real-time cloud synchronization, interactive Cartesian planes,
 * Command Spotlight deep work chronometer, Mindful Workload Distribution meter,
 * and global Command Palette (Cmd+K).
 * @packageDocumentation
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { ControlsToolbar } from './components/ControlsToolbar';
import { MegaTaskBinBar } from './components/MegaTaskBinBar';
import { WorkloadDistributionMeter } from './components/WorkloadDistributionMeter';
import { PrioritizedListView } from './components/PrioritizedListView';
import { EisenhowerMatrixView } from './components/EisenhowerMatrixView';
import { ImpactEffortMatrixView } from './components/ImpactEffortMatrixView';
import { TaskInputModal } from './components/TaskInputModal';
import { AuthModal } from './components/AuthModal';
import { CommandSpotlightModal } from './components/CommandSpotlightModal';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { BinSortingModal } from './components/BinSortingModal';
import { CompletionParticleBurst } from './components/CompletionParticleBurst';
import { CriticalAlertBanner, TransientToast } from './components/GuidanceBubble';
import { AiTaskGuideModal } from './components/AiTaskGuideModal';
import { AiPlanModal } from './components/AiPlanModal';
import { AiAuditModal } from './components/AiAuditModal';
import { AiQuotaAlertBanner, AiQuotaModal } from './components/AiQuotaAlert';
import { aiQuotaService, QuotaStatus } from './services/aiQuotaService';
import {
  aiAssistantService,
  AiQuotaExhaustedError,
  GeneratedTaskProposal,
  TaskGuideResponse,
  DailyPlanResponse,
  PriorityAuditResponse,
  AuditFinding
} from './services/aiAssistantService';
import {
  TaskItem,
  UserSession,
  SortingViewMode,
  GuidanceBubble
} from './types/task';
import { storageAdapter } from './services/storageAdapter';
import { authService } from './services/authService';
import { supabaseRepository } from './services/supabaseRepository';
import { isSupabaseConfigured } from './services/supabaseClient';
import { sortTasks, classifyQuadrant } from './services/priorityEngine';
import { calculateWorkloadDistribution } from './constants/definitions';
import { generateUUID } from './utils/uuid';
import { PlusCircle, ShieldAlert, Cpu, Sparkles, Activity, Layers, Target } from 'lucide-react';

export function App() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [session, setSession] = useState<UserSession | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);

  // Gemini AI Assistant States
  const [aiTaskProposal, setAiTaskProposal] = useState<Partial<TaskItem> | null>(null);
  const [isAiProposalOpen, setIsAiProposalOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // AI Step-by-Step Task Guide
  const [guideTask, setGuideTask] = useState<TaskItem | null>(null);
  const [guideData, setGuideData] = useState<TaskGuideResponse | null>(null);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [isGuideLoading, setIsGuideLoading] = useState(false);

  // AI Daily Plan (Suggestion 4)
  const [planData, setPlanData] = useState<DailyPlanResponse | null>(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isPlanLoading, setIsPlanLoading] = useState(false);

  // AI Calibration Audit (Suggestion 5)
  const [auditData, setAuditData] = useState<PriorityAuditResponse | null>(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isAuditLoading, setIsAuditLoading] = useState(false);

  // Gemini AI Free Tier Quota & Rate Limit State
  const [quotaStatus, setQuotaStatus] = useState<QuotaStatus>(() => aiQuotaService.getQuotaStatus());
  const [isQuotaAlertDismissed, setIsQuotaAlertDismissed] = useState(false);
  const [isQuotaModalOpen, setIsQuotaModalOpen] = useState(false);

  // Live Quota Subscription
  useEffect(() => {
    return aiQuotaService.subscribe((newStatus) => {
      setQuotaStatus(newStatus);
      if (!newStatus.isExhausted) {
        setIsQuotaAlertDismissed(false);
      }
    });
  }, []);

  // Command Spotlight & Focus Chronometer
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);
  const [spotlightTaskId, setSpotlightTaskId] = useState<string | null>(null);

  // Command Palette (Cmd+K)
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Velocity Particle Burst
  const [burstCoords, setBurstCoords] = useState<{ x: number; y: number } | null>(null);

  // Mega Task Bins / Mission Clusters
  const [availableBuckets, setAvailableBuckets] = useState<string[]>(() =>
    storageAdapter.getMegaBuckets()
  );
  const [selectedBucket, setSelectedBucket] = useState<string | 'ALL'>('ALL');
  const [isBinSortingOpen, setIsBinSortingOpen] = useState(false);

  const [viewMode, setViewMode] = useState<SortingViewMode>('STRATEGIC');
  const [selectedCategory, setSelectedCategory] = useState<string | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCompleted, setShowCompleted] = useState(true);

  // Theme: Daylight Light mode by default (isDark = false)
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('jarvis_theme_v1');
    return saved !== null ? saved === 'dark' : false;
  });
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [dismissedBubbleIds, setDismissedBubbleIds] = useState<string[]>(() =>
    storageAdapter.getDismissedBubbles()
  );

  const [transientToasts, setTransientToasts] = useState<GuidanceBubble[]>([]);

  // Network Telemetry
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      pushTransientToast({
        id: 'toast-online-' + Date.now(),
        title: 'NETWORK RECONNECTED',
        message: 'Online connection restored. Local changes ready for cloud sync.',
        variant: 'info',
        autoDismissMs: 4000
      });
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Global Keyboard Shortcuts (Cmd+K / Ctrl+K, '/')
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement;

      // Cmd+K or Ctrl+K triggers Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }

      // Cmd+Shift+V or Ctrl+Shift+V triggers Command Palette with microphone voice search
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
        return;
      }

      // '/' triggers command palette if not currently in an input
      if (!isInput && e.key === '/' && !isCommandPaletteOpen && !isSpotlightOpen && !isTaskModalOpen) {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
        return;
      }

      // 'f' or 'z' triggers focus spotlight if not typing
      if (!isInput && (e.key === 'f' || e.key === 'z') && !isCommandPaletteOpen && !isSpotlightOpen && !isTaskModalOpen) {
        e.preventDefault();
        setIsSpotlightOpen(true);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, isSpotlightOpen, isTaskModalOpen]);

  const pushTransientToast = useCallback((toast: GuidanceBubble) => {
    setTransientToasts((prev) => {
      if (prev.some((t) => t.id === toast.id)) {
        return prev;
      }
      return [...prev, toast];
    });
  }, []);

  const handleDismissToast = useCallback((id: string) => {
    setTransientToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const refreshTasks = useCallback(async () => {
    const freshTasks = await storageAdapter.fetchTasks();
    setTasks(freshTasks);
  }, []);

  // Hydration & Auth State Listener
  useEffect(() => {
    let isSubscribed = true;

    async function hydrate() {
      const currentSession = await authService.getCurrentSession();
      if (!isSubscribed) return;

      if (!currentSession) {
        setIsAuthModalOpen(true);
      } else {
        setSession(currentSession);
        if (currentSession.isGuest && !storageAdapter.getDismissedBubbles().includes('guest-initial-toast')) {
          pushTransientToast({
            id: 'guest-session-notice-' + Date.now(),
            title: 'GUEST OPERATOR SESSION',
            message: 'Operating in local cache. Cross-device sync requires account creation.',
            variant: 'warning',
            tier: 'TRANSIENT',
            autoDismissMs: 6000,
            actionLabel: 'Upgrade',
            onAction: () => setIsAuthModalOpen(true)
          });
        }
      }

      const initialTasks = await storageAdapter.fetchTasks();
      if (isSubscribed) {
        setTasks(initialTasks);
      }
    }

    hydrate();

    // Subscribe to Supabase auth events
    const unsubscribeAuth = authService.onAuthStateChange(async (newSession) => {
      if (!isSubscribed) return;
      setSession(newSession);
      if (!newSession) {
        setIsAuthModalOpen(true);
      } else {
        const refreshed = await storageAdapter.fetchTasks();
        setTasks(refreshed);
      }
    });

    return () => {
      isSubscribed = false;
      unsubscribeAuth();
    };
  }, [pushTransientToast]);

  // Phase 4: Supabase Realtime Subscription Listener
  useEffect(() => {
    if (!session || session.isGuest || !isSupabaseConfigured()) {
      return;
    }

    const unsubscribeRealtime = supabaseRepository.subscribeToChanges(
      session.id,
      () => {
        refreshTasks();
        pushTransientToast({
          id: 'realtime-sync-' + Date.now(),
          title: 'REALTIME CLOUD SYNC',
          message: 'Task matrix updated from remote change.',
          variant: 'info',
          autoDismissMs: 2500
        });
      }
    );

    return () => {
      unsubscribeRealtime();
    };
  }, [session, refreshTasks, pushTransientToast]);

  // Theme Sync
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('jarvis_theme_v1', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('jarvis_theme_v1', 'light');
    }
  }, [isDark]);

  // Session Handlers
  const handleAuthenticate = useCallback(async (newSession: UserSession) => {
    setSession(newSession);
    setIsAuthModalOpen(false);

    // Automatically migrate local guest tasks to cloud account
    if (isSupabaseConfigured() && !newSession.isGuest) {
      const migratedCount = await supabaseRepository.migrateLocalTasksToCloud(newSession.id);
      if (migratedCount > 0) {
        pushTransientToast({
          id: 'toast-migrated-' + Date.now(),
          title: 'LOCAL TASKS SYNCED',
          message: `Successfully migrated ${migratedCount} local tasks to your cloud account.`,
          variant: 'tip',
          autoDismissMs: 5000
        });
      }
    }

    const currentTasks = await storageAdapter.fetchTasks();
    setTasks(currentTasks);

    pushTransientToast({
      id: 'toast-auth-' + Date.now(),
      title: 'OPERATOR AUTHENTICATED',
      message: `Session verified for ${newSession.name}.`,
      variant: 'tip',
      autoDismissMs: 4000
    });
  }, [pushTransientToast]);

  const handleProceedGuest = useCallback(async () => {
    const guestSession = await authService.proceedAsGuest();
    setSession(guestSession);
    setIsAuthModalOpen(false);
    pushTransientToast({
      id: 'guest-toast-' + Date.now(),
      title: 'GUEST MODE INITIALIZED',
      message: 'Tasks persisted in local cache. Click header badge anytime to upgrade.',
      variant: 'warning',
      tier: 'TRANSIENT',
      autoDismissMs: 6000,
      actionLabel: 'Upgrade Account',
      onAction: () => setIsAuthModalOpen(true)
    });
  }, [pushTransientToast]);

  const handleLogout = useCallback(async () => {
    await authService.signOut();
    setSession(null);
    setIsAuthModalOpen(true);
    pushTransientToast({
      id: 'toast-signout-' + Date.now(),
      title: 'SESSION TERMINATED',
      message: 'Operator logged out.',
      variant: 'info',
      autoDismissMs: 3000
    });
  }, [pushTransientToast]);

  // Task Mutations
  const handleSaveTask = useCallback(
    async (
      taskInput: Omit<
        TaskItem,
        'id' | 'createdAt' | 'updatedAt' | 'isCompleted' | 'completedAt'
      >
    ) => {
      if (editingTask) {
        const updated = await storageAdapter.updateTask(editingTask.id, taskInput);
        setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        setEditingTask(null);
        pushTransientToast({
          id: 'toast-updated-' + Date.now(),
          title: 'TASK PARAMETERS UPDATED',
          message: `"${updated.title}" updated successfully.`,
          variant: 'info',
          autoDismissMs: 3500
        });
      } else {
        const newTask: TaskItem = {
          ...taskInput,
          id: generateUUID(),
          isCompleted: false,
          completedAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        const saved = await storageAdapter.saveTask(newTask);
        setTasks((prev) => [saved, ...prev]);
        pushTransientToast({
          id: 'toast-created-' + Date.now(),
          title: 'TASK INGESTED',
          message: `"${saved.title}" assigned to matrix queue.`,
          variant: 'tip',
          autoDismissMs: 3500
        });
      }
    },
    [editingTask, pushTransientToast]
  );

  const handleUpdateTask = useCallback(
    async (id: string, updates: Partial<TaskItem>) => {
      const updated = await storageAdapter.updateTask(id, updates);
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
      setEditingTask((prevEditing) => {
        if (prevEditing && prevEditing.id === id) {
          return { ...prevEditing, ...updates, ...updated };
        }
        return prevEditing;
      });
      return updated;
    },
    []
  );

  const handleToggleComplete = useCallback(async (id: string, isCompleted: boolean) => {
    const updated = await storageAdapter.updateTask(id, {
      isCompleted,
      completedAt: isCompleted ? new Date().toISOString() : null
    });
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));

    if (isCompleted) {
      pushTransientToast({
        id: 'toast-completed-' + Date.now(),
        title: 'TASK RESOLVED // VELOCITY LOGGED',
        message: `Task marked complete. Workload updated.`,
        variant: 'tip',
        autoDismissMs: 3000
      });
    }
  }, [pushTransientToast]);

  const handleDeleteTask = useCallback(async (id: string) => {
    await storageAdapter.deleteTask(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
    pushTransientToast({
      id: 'toast-deleted-' + Date.now(),
      title: 'TASK PURGED',
      message: 'Task removed from matrix.',
      variant: 'info',
      autoDismissMs: 3000
    });
  }, [pushTransientToast]);

  const handleEditClick = useCallback((task: TaskItem) => {
    // Look up freshest state for task to avoid stale data in edit modal
    setTasks((currentTasks) => {
      const freshTask = currentTasks.find((t) => t.id === task.id) || task;
      setEditingTask(freshTask);
      return currentTasks;
    });
    setIsTaskModalOpen(true);
  }, []);

  const handleFocusClick = useCallback((task: TaskItem) => {
    setSpotlightTaskId(task.id);
    setIsSpotlightOpen(true);
  }, []);

  const handleTriggerBurst = useCallback((x: number, y: number) => {
    setBurstCoords({ x, y });
  }, []);

  // Interactive Cartesian Canvas Coordinate Updater
  const handleUpdateTaskCoords = useCallback(
    async (taskId: string, coords: { x: number; y: number }) => {
      if (viewMode === 'MATRIX') {
        // Eisenhower: x = urgency, y = importance
        await handleUpdateTask(taskId, {
          urgency: coords.x as TaskItem['urgency'],
          importance: coords.y as TaskItem['importance']
        });
        pushTransientToast({
          id: 'toast-coords-' + Date.now(),
          title: 'COORDINATES RE-CALIBRATED',
          message: `Eisenhower priority updated to (${coords.x}, ${coords.y}).`,
          variant: 'info',
          autoDismissMs: 2500
        });
      } else if (viewMode === 'IMPACT_EFFORT') {
        // Impact Effort: x = effort, y = impact
        await handleUpdateTask(taskId, {
          effort: coords.x as TaskItem['effort'],
          impact: coords.y as TaskItem['impact']
        });
        pushTransientToast({
          id: 'toast-coords-' + Date.now(),
          title: 'COORDINATES RE-CALIBRATED',
          message: `Impact-Effort priority updated to (${coords.x}, ${coords.y}).`,
          variant: 'info',
          autoDismissMs: 2500
        });
      }
    },
    [viewMode, handleUpdateTask, pushTransientToast]
  );

  // Mega Task Bins / Mission Clusters Management
  const handleCreateBucket = useCallback((bucketName: string) => {
    storageAdapter.saveMegaBucket(bucketName);
    setAvailableBuckets(storageAdapter.getMegaBuckets());
    pushTransientToast({
      id: 'toast-bucket-' + Date.now(),
      title: 'MISSION BIN CREATED',
      message: `"${bucketName}" initialized for atomic task grouping.`,
      variant: 'tip',
      autoDismissMs: 3500
    });
  }, [pushTransientToast]);

  const handleAssignTaskToBucket = useCallback(
    async (taskId: string, bucketName: string | null) => {
      await handleUpdateTask(taskId, { megaBucket: bucketName });
      pushTransientToast({
        id: 'toast-assign-' + Date.now(),
        title: 'MISSION ALLOCATION UPDATED',
        message: bucketName
          ? `Task assigned to mission bin "${bucketName}".`
          : 'Task unassigned from mission bin.',
        variant: 'info',
        autoDismissMs: 2500
      });
    },
    [handleUpdateTask, pushTransientToast]
  );

  // Gemini AI Assistant Execution Handlers

  const handleAiError = useCallback(
    (err: any, fallbackTitle: string, fallbackMsg: string) => {
      if (err instanceof AiQuotaExhaustedError || err?.isRateLimit) {
        setIsQuotaAlertDismissed(false);
        setIsQuotaModalOpen(true);
        pushTransientToast({
          id: 'toast-quota-exhausted-' + Date.now(),
          title: 'DAILY AI QUOTA EXHAUSTED',
          message:
            err.message ||
            `Free personal quota reached. Resets in ${quotaStatus.resetsInFormatted}. Offline task matrix remains 100% operational.`,
          variant: 'warning',
          autoDismissMs: 8000,
        });
        return;
      }

      pushTransientToast({
        id: 'toast-ai-err-' + Date.now(),
        title: fallbackTitle,
        message: err?.message || fallbackMsg,
        variant: 'warning',
        autoDismissMs: 6000,
      });
    },
    [pushTransientToast, quotaStatus.resetsInFormatted]
  );

  /**
   * Option A: Synthesizes task parameters with Gemini 3.8 Flash and pre-populates
   * the TaskInputModal for operator review and manual calibration before saving.
   */
  const handleAiCreateTask = useCallback(
    async (prompt: string) => {
      setIsAiLoading(true);
      try {
        const proposal = await aiAssistantService.generateTaskProposal(prompt, availableBuckets);
        let notesText = proposal.notes || '';
        if (proposal.microtasks && proposal.microtasks.length > 0) {
          notesText +=
            (notesText ? '\n\n' : '') +
            '## Micro-Tasks Breakdown:\n' +
            proposal.microtasks.map((m) => `[ ] ${m}`).join('\n');
        }

        const taskDraft: Partial<TaskItem> = {
          title: proposal.title,
          notes: notesText,
          category: proposal.category || 'Work',
          importance: proposal.importance,
          urgency: proposal.urgency,
          impact: proposal.impact,
          effort: proposal.effort,
          dueDate: proposal.dueDate || null,
          estimatedDurationMinutes: proposal.estimatedDurationMinutes || 45,
          cognitiveStrain: proposal.cognitiveStrain || 'MODERATE',
          megaBucket: proposal.megaBucket || null,
        };

        setEditingTask(null);
        setAiTaskProposal(taskDraft);
        setIsAiProposalOpen(true);
        setIsTaskModalOpen(true);

        pushTransientToast({
          id: 'toast-ai-create-' + Date.now(),
          title: 'GEMINI AI SYNTHESIS COMPLETE',
          message: 'Option A: Review & calibrate proposed task parameters before confirming.',
          variant: 'tip',
          autoDismissMs: 5000,
        });
      } catch (err: any) {
        handleAiError(err, 'AI SYNTHESIS NOTICE', 'Failed to synthesize task proposal with Gemini AI.');
      } finally {
        setIsAiLoading(false);
      }
    },
    [availableBuckets, pushTransientToast, handleAiError]
  );

  /**
   * Generates a surgical step-by-step roadmap for an existing task.
   */
  const handleAiGuideTask = useCallback(
    async (taskOrTitle: TaskItem | string) => {
      let target: TaskItem | undefined;
      if (typeof taskOrTitle === 'string') {
        const q = taskOrTitle.toLowerCase().trim();
        target =
          tasks.find((t) => t.title.toLowerCase().includes(q) && !t.isCompleted) ||
          tasks.find((t) => !t.isCompleted) ||
          tasks[0];
      } else {
        target = taskOrTitle;
      }

      if (!target) {
        pushTransientToast({
          id: 'toast-guide-no-task-' + Date.now(),
          title: 'NO TARGET TASK IDENTIFIED',
          message: 'Please create a task first to generate a tactical execution roadmap.',
          variant: 'warning',
          autoDismissMs: 4000,
        });
        return;
      }

      setGuideTask(target);
      setGuideData(null);
      setIsGuideModalOpen(true);
      setIsGuideLoading(true);

      try {
        const guide = await aiAssistantService.generateTaskGuide(target, true);
        setGuideData(guide);
      } catch (err: any) {
        handleAiError(err, 'AI ROADMAP ERROR', 'Failed to generate execution guide with Gemini AI.');
      } finally {
        setIsGuideLoading(false);
      }
    },
    [tasks, pushTransientToast, handleAiError]
  );

  /**
   * Ingests selected micro-tasks generated by the AI Guide as distinct child tasks in Jarvis.
   */
  const handleApplyMicrotasksAsTasks = useCallback(
    async (microtasks: string[], parentTask: TaskItem) => {
      for (const micro of microtasks) {
        await handleSaveTask({
          title: micro,
          notes: `Micro-task derived from: "${parentTask.title}"`,
          category: parentTask.category,
          importance: Math.max(1, parentTask.importance - 1) as any,
          urgency: parentTask.urgency,
          recommendedUrgency: parentTask.recommendedUrgency,
          impact: Math.max(1, (parentTask.impact || 3) - 1) as any,
          effort: 1,
          dueDate: parentTask.dueDate,
          megaBucket: parentTask.megaBucket,
          estimatedDurationMinutes: 15,
          actualDurationSeconds: 0,
          cognitiveStrain: 'LOW',
        });
      }
      pushTransientToast({
        id: 'toast-microtasks-added-' + Date.now(),
        title: 'MICRO-TASKS INGESTED',
        message: `Added ${microtasks.length} subtasks to task matrix.`,
        variant: 'tip',
        autoDismissMs: 4000,
      });
    },
    [handleSaveTask, pushTransientToast]
  );

  /**
   * Appends micro-tasks as a markdown checklist to the task notes.
   */
  const handleAppendMicrotasksToNotes = useCallback(
    async (microtasks: string[], parentTask: TaskItem) => {
      const existingNotes = parentTask.notes || '';
      const checklistStr =
        (existingNotes ? existingNotes + '\n\n' : '') +
        '## Micro-Tasks Checklist:\n' +
        microtasks.map((m) => `[ ] ${m}`).join('\n');
      await handleUpdateTask(parentTask.id, { notes: checklistStr });
      pushTransientToast({
        id: 'toast-notes-updated-' + Date.now(),
        title: 'TASK NOTES UPDATED',
        message: `Checklist with ${microtasks.length} micro-tasks appended to task.`,
        variant: 'info',
        autoDismissMs: 3000,
      });
    },
    [handleUpdateTask, pushTransientToast]
  );

  /**
   * Suggestion 4: Evaluates active tasks and generates an optimal daily cadence.
   */
  const handleAiPlan = useCallback(async () => {
    const active = tasks.filter((t) => !t.isCompleted);
    if (active.length === 0) {
      pushTransientToast({
        id: 'toast-no-tasks-plan-' + Date.now(),
        title: 'ZERO ACTIVE TASKS',
        message: 'Add active tasks before generating a daily execution plan.',
        variant: 'warning',
        autoDismissMs: 4000,
      });
      return;
    }

    setPlanData(null);
    setIsPlanModalOpen(true);
    setIsPlanLoading(true);

    try {
      const plan = await aiAssistantService.generateDailyPlan(active);
      setPlanData(plan);
    } catch (err: any) {
      handleAiError(err, 'SCHEDULE GENERATION NOTICE', 'Failed to generate schedule with Gemini AI.');
    } finally {
      setIsPlanLoading(false);
    }
  }, [tasks, pushTransientToast, handleAiError]);

  /**
   * Suggestion 5: Priority Calibration Audit - detects misclassifications and deadline conflicts.
   */
  const handleAiAudit = useCallback(async () => {
    const active = tasks.filter((t) => !t.isCompleted);
    if (active.length === 0) {
      pushTransientToast({
        id: 'toast-no-tasks-audit-' + Date.now(),
        title: 'ZERO ACTIVE TASKS',
        message: 'Add active tasks before auditing priority calibration.',
        variant: 'warning',
        autoDismissMs: 4000,
      });
      return;
    }

    setAuditData(null);
    setIsAuditModalOpen(true);
    setIsAuditLoading(true);

    try {
      const audit = await aiAssistantService.auditTaskPriorities(active);
      setAuditData(audit);
    } catch (err: any) {
      handleAiError(err, 'CALIBRATION AUDIT NOTICE', 'Failed to conduct audit with Gemini AI.');
    } finally {
      setIsAuditLoading(false);
    }
  }, [tasks, pushTransientToast, handleAiError]);

  /**
   * Applies recommended single calibration from audit finding.
   */
  const handleApplySingleCalibration = useCallback(
    async (taskId: string, updates: Partial<TaskItem>) => {
      await handleUpdateTask(taskId, updates);
      pushTransientToast({
        id: 'toast-calibrated-' + Date.now(),
        title: 'TASK CALIBRATED',
        message: 'Priority parameters updated to recommended alignment.',
        variant: 'tip',
        autoDismissMs: 2500,
      });
    },
    [handleUpdateTask, pushTransientToast]
  );

  /**
   * Applies all recommended calibrations in batch.
   */
  const handleApplyBatchCalibration = useCallback(
    async (findings: AuditFinding[]) => {
      for (const finding of findings) {
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
        await handleUpdateTask(finding.taskId, updates);
      }
      pushTransientToast({
        id: 'toast-batch-calibrated-' + Date.now(),
        title: 'BATCH CALIBRATION COMPLETE',
        message: `Successfully recalibrated ${findings.length} tasks.`,
        variant: 'tip',
        autoDismissMs: 3500,
      });
    },
    [handleUpdateTask, pushTransientToast]
  );

  const criticalTopBanners = useMemo<GuidanceBubble[]>(() => {
    const list: GuidanceBubble[] = [];
    if (!isOnline && !dismissedBubbleIds.includes('offline-top-banner')) {
      list.push({
        id: 'offline-top-banner',
        title: 'OFFLINE MODE ACTIVE',
        message:
          'Local persistence is active. All priority matrix calculations and task mutations continue uninterrupted.',
        variant: 'offline',
        tier: 'CRITICAL'
      });
    }
    return list;
  }, [isOnline, dismissedBubbleIds]);

  const handleDismissBanner = useCallback((id: string) => {
    storageAdapter.dismissBubble(id);
    setDismissedBubbleIds((prev) => [...prev, id]);
  }, []);

  // Filter & Sort
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.notes && t.notes.toLowerCase().includes(q))
      );
    }

    if (selectedCategory !== 'ALL') {
      filtered = filtered.filter((t) => t.category === selectedCategory);
    }

    // Mega Task Bin filter
    if (selectedBucket !== 'ALL') {
      filtered = filtered.filter((t) => t.megaBucket === selectedBucket);
    }

    if (!showCompleted) {
      filtered = filtered.filter((t) => !t.isCompleted);
    }

    return sortTasks(filtered, viewMode);
  }, [tasks, searchQuery, selectedCategory, selectedBucket, showCompleted, viewMode]);

  const totalCount = tasks.length;
  const criticalCount = tasks.filter(
    (t) => !t.isCompleted && classifyQuadrant(t) === 'DO_FIRST'
  ).length;
  const completedCount = tasks.filter((t) => t.isCompleted).length;

  const workloadDistribution = useMemo(() => {
    return calculateWorkloadDistribution(tasks);
  }, [tasks]);

  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => {
      if (t.category) set.add(t.category);
    });
    return Array.from(set);
  }, [tasks]);

  return (
    <div className={`relative min-h-screen flex flex-col font-sans transition-colors duration-300 w-full max-w-full overflow-x-hidden ${
      isDark ? 'text-slate-100' : 'text-slate-900'
    }`}>
      {/* Ambient Blurred Light Canvas Background Layer */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <img
          src={'./assets/ambient_mesh_canvas.jpg'}
          alt=""
          className="w-full h-full object-cover opacity-35 dark:opacity-20 blur-3xl scale-125 transition-opacity duration-700"
        />
        <div className={`absolute inset-0 transition-colors duration-300 ${
          isDark
            ? 'bg-gradient-to-b from-slate-950/80 via-slate-900/85 to-slate-950/95'
            : 'bg-gradient-to-b from-slate-50/70 via-cyan-50/30 to-slate-100/85'
        }`} />
      </div>

      {/* Velocity Particle Burst Overlay */}
      {burstCoords && (
        <CompletionParticleBurst
          originX={burstCoords.x}
          originY={burstCoords.y}
          onComplete={() => setBurstCoords(null)}
        />
      )}

      {/* Main App Content Stack */}
      <div className="relative z-10 flex flex-col min-h-screen w-full max-w-full overflow-x-hidden">
        {/* Primary Navigation & Telemetry */}
        <Navbar
          session={session}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onOpenNewTask={() => {
            setEditingTask(null);
            setAiTaskProposal(null);
            setIsAiProposalOpen(false);
            setIsTaskModalOpen(true);
          }}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenSpotlight={() => {
            setSpotlightTaskId(null);
            setIsSpotlightOpen(true);
          }}
          onOpenBinSorting={() => setIsBinSortingOpen(true)}
          onOpenAiPrompt={() => setIsCommandPaletteOpen(true)}
          isDark={isDark}
          onToggleTheme={() => setIsDark((prev) => !prev)}
          isOnline={isOnline}
          onLogout={handleLogout}
          quotaStatus={quotaStatus}
          onOpenQuotaHud={() => setIsQuotaModalOpen(true)}
        />

        {/* Main Execution Surface */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-7 pb-24 sm:pb-7 space-y-6">
          {/* Daily AI Free Quota Exhaustion Alert Banner */}
          {quotaStatus.isExhausted && !isQuotaAlertDismissed && (
            <AiQuotaAlertBanner
              status={quotaStatus}
              onDismiss={() => setIsQuotaAlertDismissed(true)}
              onOpenSettings={() => setIsQuotaModalOpen(true)}
            />
          )}

          {/* Tier 1: Critical Top Banners */}
          {criticalTopBanners.length > 0 && (
            <div className="space-y-3">
              {criticalTopBanners.map((banner) => (
                <CriticalAlertBanner
                  key={banner.id}
                  bubble={banner}
                  onDismiss={handleDismissBanner}
                />
              ))}
            </div>
          )}

          {/* Welcoming Status & Orientation Hero Strip */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-sm backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/25 shrink-0 animate-pulse-subtle">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-extrabold uppercase tracking-wider text-cyan-800 dark:text-cyan-400">
                    SYSTEM DIRECTIVE:
                  </span>
                  <span className="text-base font-bold text-slate-950 dark:text-white">
                    Welcome, {session?.name || 'Operator'}.
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 mt-0.5 leading-relaxed font-medium">
                  Task matrix active. <strong className="text-rose-700 dark:text-rose-400 font-extrabold">{criticalCount} Critical Q1 items</strong> require immediate focus.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-mono text-cyan-950 dark:text-cyan-200 bg-cyan-50 dark:bg-cyan-950/60 px-4 py-2 rounded-2xl border border-cyan-200 dark:border-cyan-800/80 shadow-xs">
              <Activity className="w-3.5 h-3.5 text-cyan-700 dark:text-cyan-400 animate-pulse" />
              <span className="font-bold tracking-wide">JARVIS TELEMETRY ACTIVE</span>
            </div>
          </div>

          {/* Mindful Cognitive Workload Distribution Meter */}
          <WorkloadDistributionMeter distribution={workloadDistribution} />

          {/* Interactive Mega Task Bins / Mission Clusters Bar */}
          <MegaTaskBinBar
            tasks={tasks}
            availableBuckets={availableBuckets}
            selectedBucket={selectedBucket}
            onSelectBucket={setSelectedBucket}
            onCreateBucket={handleCreateBucket}
            onAssignTaskToBucket={handleAssignTaskToBucket}
            onOpenBinSorting={() => setIsBinSortingOpen(true)}
          />

          {/* View Mode & Filter Controls */}
          <ControlsToolbar
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            availableCategories={availableCategories}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            showCompleted={showCompleted}
            onToggleShowCompleted={() => setShowCompleted((prev) => !prev)}
            totalCount={totalCount}
            criticalCount={criticalCount}
            completedCount={completedCount}
          />

          {/* View Mode Context Descriptor */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-3.5 rounded-2xl bg-white/90 dark:bg-slate-900/70 border border-slate-200/90 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-300 gap-2 shadow-xs backdrop-blur-md">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-700 dark:text-cyan-400 shrink-0" />
              <span>
                ACTIVE PERSPECTIVE:{' '}
                <strong className="text-slate-950 dark:text-white font-extrabold">
                  {viewMode === 'STRATEGIC'
                    ? 'STRATEGIC PRIORITY (HIGH IMPORTANCE FIRST)'
                    : viewMode === 'DEADLINE'
                    ? 'DEADLINE ACCELERATION (URGENT & IMPORTANT -> URGENT -> IMPORTANT -> LOW BOTH)'
                    : viewMode === 'MATRIX'
                    ? 'EISENHOWER 2X2 (URGENCY VS IMPORTANCE)'
                    : 'IMPACT-EFFORT 2X2 (QUICK WINS -> MAJOR PROJECTS -> FILL-INS -> TIME SINKS)'}
                </strong>
              </span>
            </div>
            <span className="text-[11px] text-slate-600 dark:text-slate-400 font-bold">
              SECONDARY: DUE DATE ASC • TERTIARY: CREATED AT ASC
            </span>
          </div>

          {/* Main Content Area */}
          {filteredAndSortedTasks.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-3xl bg-white/80 dark:bg-slate-900/40 p-8 space-y-4 shadow-xs backdrop-blur-sm">
              <div className="w-14 h-14 mx-auto rounded-3xl bg-cyan-50 dark:bg-slate-800 border border-cyan-200 dark:border-slate-700 flex items-center justify-center text-cyan-700 dark:text-cyan-400 shadow-sm">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-mono text-sm font-bold text-slate-950 dark:text-white uppercase tracking-wider">
                  NO TASKS MATCH QUERY CRITERIA
                </h3>
                <p className="text-xs text-slate-700 dark:text-slate-300 max-w-sm mx-auto mt-1 leading-relaxed font-medium">
                  Zero tasks detected matching the current category, mission bin, or completion filter.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingTask(null);
                  setIsTaskModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-mono font-bold uppercase rounded-2xl transition-all shadow-md shadow-cyan-600/25 cursor-pointer active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                Ingest New Task
              </button>
            </div>
          ) : viewMode === 'MATRIX' ? (
            <EisenhowerMatrixView
              tasks={filteredAndSortedTasks}
              onToggleComplete={handleToggleComplete}
              onEdit={handleEditClick}
              onDelete={handleDeleteTask}
              onFocusTask={handleFocusClick}
              onAiGuide={handleAiGuideTask}
              onTriggerBurst={handleTriggerBurst}
              onUpdateTaskCoords={handleUpdateTaskCoords}
            />
          ) : viewMode === 'IMPACT_EFFORT' ? (
            <ImpactEffortMatrixView
              tasks={filteredAndSortedTasks}
              onToggleComplete={handleToggleComplete}
              onEdit={handleEditClick}
              onDelete={handleDeleteTask}
              onFocusTask={handleFocusClick}
              onAiGuide={handleAiGuideTask}
              onTriggerBurst={handleTriggerBurst}
              onUpdateTaskCoords={handleUpdateTaskCoords}
            />
          ) : (
            <PrioritizedListView
              tasks={filteredAndSortedTasks}
              viewMode={viewMode}
              onToggleComplete={handleToggleComplete}
              onEdit={handleEditClick}
              onDelete={handleDeleteTask}
              onFocusTask={handleFocusClick}
              onAiGuide={handleAiGuideTask}
              onTriggerBurst={handleTriggerBurst}
            />
          )}
        </main>

        {/* Tier 2: Floating Transient Notification Tray */}
        {transientToasts.length > 0 && (
          <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
            {transientToasts.map((toast) => (
              <div key={toast.id} className="pointer-events-auto">
                <TransientToast
                  bubble={toast}
                  onDismiss={handleDismissToast}
                />
              </div>
            ))}
          </div>
        )}

        {/* Task Creation & Calibration Modal (with Option A AI Pre-population) */}
        <TaskInputModal
          isOpen={isTaskModalOpen}
          onClose={() => {
            setIsTaskModalOpen(false);
            setEditingTask(null);
            setAiTaskProposal(null);
            setIsAiProposalOpen(false);
          }}
          onSubmit={handleSaveTask}
          initialTask={editingTask}
          initialValues={aiTaskProposal}
          isAiProposal={isAiProposalOpen}
          availableBuckets={availableBuckets}
          onCreateBucket={handleCreateBucket}
        />

        {/* Command Spotlight & Deep Work Pomodoro Chronometer Modal */}
        <CommandSpotlightModal
          isOpen={isSpotlightOpen}
          tasks={tasks}
          defaultTaskId={spotlightTaskId}
          onClose={() => {
            setIsSpotlightOpen(false);
            setSpotlightTaskId(null);
          }}
          onUpdateTask={handleUpdateTask}
          onCompleteTask={handleToggleComplete}
          onTriggerBurst={handleTriggerBurst}
        />

        {/* Universal Global Command Palette (`Cmd+K` / `Ctrl+K`) */}
        <CommandPaletteModal
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          tasks={tasks}
          availableBuckets={availableBuckets}
          onCreateBucket={handleCreateBucket}
          onSelectBucket={setSelectedBucket}
          onAddTask={handleSaveTask}
          onSelectTask={handleEditClick}
          onCompleteTask={handleToggleComplete}
          onChangeViewMode={setViewMode}
          onOpenFocusMode={(taskId) => {
            setSpotlightTaskId(taskId || null);
            setIsSpotlightOpen(true);
          }}
          onOpenNewTaskModal={() => {
            setEditingTask(null);
            setAiTaskProposal(null);
            setIsAiProposalOpen(false);
            setIsTaskModalOpen(true);
          }}
          onAiCreateTask={handleAiCreateTask}
          onAiGuideTask={(title) => handleAiGuideTask(title)}
          onAiPlan={handleAiPlan}
          onAiAudit={handleAiAudit}
          isAiLoading={isAiLoading}
          onOpenQuotaHud={() => setIsQuotaModalOpen(true)}
        />

        {/* Gemini AI Step-by-Step Task Execution Guide Modal */}
        <AiTaskGuideModal
          isOpen={isGuideModalOpen}
          onClose={() => {
            setIsGuideModalOpen(false);
            setGuideTask(null);
            setGuideData(null);
          }}
          task={guideTask}
          guideData={guideData}
          isLoading={isGuideLoading}
          onApplyMicrotasksAsTasks={handleApplyMicrotasksAsTasks}
          onAppendMicrotasksToNotes={handleAppendMicrotasksToNotes}
          onRequestBreakdownAgain={() => {
            if (guideTask) handleAiGuideTask(guideTask);
          }}
        />

        {/* Gemini AI Strategic Daily Cadence Plan Modal (Suggestion 4) */}
        <AiPlanModal
          isOpen={isPlanModalOpen}
          onClose={() => {
            setIsPlanModalOpen(false);
            setPlanData(null);
          }}
          planData={planData}
          isLoading={isPlanLoading}
          onEngageFocusBlock={(taskId) => {
            setSpotlightTaskId(taskId);
            setIsSpotlightOpen(true);
          }}
        />

        {/* Gemini AI Priority Calibration & Alignment Audit Modal (Suggestion 5) */}
        <AiAuditModal
          isOpen={isAuditModalOpen}
          onClose={() => {
            setIsAuditModalOpen(false);
            setAuditData(null);
          }}
          auditData={auditData}
          isLoading={isAuditLoading}
          onApplySingleCalibration={handleApplySingleCalibration}
          onApplyBatchCalibration={handleApplyBatchCalibration}
        />

        {/* Dedicated Bin Sorting & Mission Allocation Screen */}
        <BinSortingModal
          isOpen={isBinSortingOpen}
          onClose={() => setIsBinSortingOpen(false)}
          tasks={tasks}
          availableBuckets={availableBuckets}
          onCreateBucket={handleCreateBucket}
          onAssignTaskToBucket={handleAssignTaskToBucket}
        />

        {/* Gemini AI Daily Quota HUD & Rate Limit Governance Modal */}
        <AiQuotaModal
          isOpen={isQuotaModalOpen}
          onClose={() => setIsQuotaModalOpen(false)}
          status={quotaStatus}
          onUpdateLimit={(newLimit) => aiQuotaService.setDailyLimit(newLimit)}
          onResetQuota={() => aiQuotaService.resetQuota()}
        />

        {/* Authentication & Guest Gate Modal */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onAuthenticate={handleAuthenticate}
          onProceedGuest={handleProceedGuest}
          onClose={() => setIsAuthModalOpen(false)}
          canClose={Boolean(session)}
        />

        {/* Mobile Persistent Bottom Taskbar (Thumb-Accessible Dock for Phone Screens up to 600px) */}
        <nav
          aria-label="Mobile Navigation Dock"
          className="max-[600px]:flex sm:hidden fixed bottom-0 inset-x-0 w-full max-w-full z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl border-t border-slate-200/90 dark:border-slate-800/90 px-1.5 sm:px-3 py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] flex items-center justify-between shadow-2xl overflow-x-clip box-border"
        >
          {/* 1. Perspective View Toggle */}
          <button
            type="button"
            onClick={() => {
              const modes: SortingViewMode[] = ['STRATEGIC', 'DEADLINE', 'MATRIX', 'IMPACT_EFFORT'];
              const nextIdx = (modes.indexOf(viewMode) + 1) % modes.length;
              setViewMode(modes[nextIdx]);
            }}
            className="flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 p-1 text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 font-mono text-[10px] active:scale-95 cursor-pointer"
            title="Cycle View Perspective"
          >
            <Activity className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
            <span className="font-bold truncate max-w-full text-center">
              {viewMode === 'STRATEGIC' ? 'Strategic' : viewMode === 'DEADLINE' ? 'Deadline' : viewMode === 'MATRIX' ? 'Matrix' : 'Impact'}
            </span>
          </button>

          {/* 2. Mission Bins */}
          <button
            type="button"
            onClick={() => setIsBinSortingOpen(true)}
            className="flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 p-1 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-mono text-[10px] active:scale-95 cursor-pointer"
            title="Mission Bins"
          >
            <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="font-bold truncate max-w-full text-center">Bins</span>
          </button>

          {/* 3. Add Task (Prominent Center Button) */}
          <button
            type="button"
            onClick={() => {
              setEditingTask(null);
              setAiTaskProposal(null);
              setIsAiProposalOpen(false);
              setIsTaskModalOpen(true);
            }}
            className="shrink-0 -mt-5 flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/35 active:scale-90 transition-transform cursor-pointer border-2 border-white dark:border-slate-900 mx-1"
            title="Create New Task"
            aria-label="Add Task"
          >
            <PlusCircle className="w-6 h-6 stroke-[2.5]" />
          </button>

          {/* 4. Command & AI Palette */}
          <button
            type="button"
            onClick={() => setIsCommandPaletteOpen(true)}
            className="flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 p-1 text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 font-mono text-[10px] active:scale-95 cursor-pointer"
            title="Command Palette & AI"
          >
            <Sparkles className="w-4 h-4 text-cyan-600 dark:text-cyan-400 animate-pulse shrink-0" />
            <span className="font-bold truncate max-w-full text-center">AI / Cmd</span>
          </button>

          {/* 5. Focus Mode */}
          <button
            type="button"
            onClick={() => {
              setSpotlightTaskId(null);
              setIsSpotlightOpen(true);
            }}
            className="flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 p-1 text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 font-mono text-[10px] active:scale-95 cursor-pointer"
            title="Focus Chronometer"
          >
            <Target className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
            <span className="font-bold truncate max-w-full text-center">Focus</span>
          </button>
        </nav>

        {/* Persistent System Footer */}
        <footer className="border-t border-slate-200/90 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md py-4 text-center text-xs font-mono text-slate-700 dark:text-slate-400 font-medium max-[600px]:pb-20">
          <p>JARVIS TASK ENGINE // MULTI-CRITERIA PRIORITIZATION // HIGH PRODUCTIVITY AMBIENT CANVAS & DEEP SLATE</p>
        </footer>
      </div>
    </div>
  );
}

export { App as JarvisTaskMatrix };
export default App;
