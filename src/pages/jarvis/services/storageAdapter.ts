/**
 * @fileoverview Data persistence adapter interface, local storage, and hybrid routing.
 * Provides unified interface (ITaskRepository) routing seamlessly between local browser
 * storage and Supabase cloud PostgreSQL with execution telemetry support.
 * @packageDocumentation
 */

import { TaskItem, UserSession } from "../types/task";
import {
  calculateRecommendedUrgency,
  checkUrgencyEscalation,
} from "../constants/definitions";
import { isSupabaseConfigured } from "./supabaseClient";
import { generateUUID, isValidUUID } from "../utils/uuid";

export const STORAGE_KEYS = {
  TASKS: "jarvis_tasks_v1",
  SESSION: "jarvis_session_v1",
  THEME: "jarvis_theme_v1",
  DISMISSED_BUBBLES: "jarvis_dismissed_bubbles_v1",
  MEGA_BUCKETS: "jarvis_mega_buckets_v1",
  DELETED_TASK_IDS: "jarvis_deleted_task_ids_v1",
  DELETED_HABIT_PERIODS: "jarvis_deleted_habit_periods_v1",
  INITIALIZED_FLAG: "jarvis_initialized_v1",
} as const;

/**
 * Retrieves cached set of permanently deleted task UUIDs.
 */
export function getDeletedTaskIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DELETED_TASK_IDS);
    if (!raw) return new Set<string>();
    const list = JSON.parse(raw);
    return new Set(Array.isArray(list) ? list : []);
  } catch {
    return new Set<string>();
  }
}

/**
 * Persists a task UUID into the permanent tombstone deletion registry.
 */
export function recordDeletedTaskId(id: string): void {
  try {
    const set = getDeletedTaskIds();
    set.add(id);
    localStorage.setItem(
      STORAGE_KEYS.DELETED_TASK_IDS,
      JSON.stringify(Array.from(set)),
    );
  } catch (err) {
    console.warn("[Jarvis Storage] Failed to record deleted task ID:", err);
  }
}

/**
 * Retrieves set of explicitly pruned habit-period keys (e.g. "habitId:2026-09-30").
 */
export function getDeletedHabitPeriods(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DELETED_HABIT_PERIODS);
    if (!raw) return new Set<string>();
    const list = JSON.parse(raw);
    return new Set(Array.isArray(list) ? list : []);
  } catch {
    return new Set<string>();
  }
}

/**
 * Records that a habit task for a specific recurrence period was explicitly deleted by the user.
 * Prevents syncHabitsToTasks from resurrecting this task for the current window.
 */
export function recordDeletedHabitPeriod(
  habitId: string,
  periodKey: string,
): void {
  try {
    const set = getDeletedHabitPeriods();
    set.add(`${habitId}:${periodKey}`);
    localStorage.setItem(
      STORAGE_KEYS.DELETED_HABIT_PERIODS,
      JSON.stringify(Array.from(set)),
    );
  } catch (err) {
    console.warn(
      "[Jarvis Storage] Failed to record deleted habit period:",
      err,
    );
  }
}
/**
 * Interface contract for storage providers.
 */
export interface ITaskRepository {
  fetchTasks(): Promise<TaskItem[]>;
  saveTask(task: TaskItem): Promise<TaskItem>;
  saveTasks(tasks: TaskItem[]): Promise<void>;
  updateTask(id: string, updates: Partial<TaskItem>): Promise<TaskItem>;
  deleteTask(id: string): Promise<boolean>;
  fetchSession(): Promise<UserSession | null>;
  setSession(session: UserSession | null): Promise<void>;
  getDismissedBubbles(): string[];
  dismissBubble(id: string): void;
  getMegaBuckets(): string[];
  saveMegaBucket(bucketName: string): void;
}

/**
 * Seed dataset demonstrating Eisenhower categorization and Impact-Effort rating upon initial entry.
 * All IDs are compliant RFC 4122 v4 UUIDs for seamless Supabase cloud synchronization.
 */
const SEED_TASKS: TaskItem[] = [
  {
    id: "e0100000-0000-4000-8000-000000000001",
    title: "Complete core architecture documentation & Supabase migration plan",
    notes:
      "Draft data schema for cloud synchronization and offline queue resolution.",
    category: "Work",
    megaBucket: "Core Engine 2.0",
    importance: 4,
    urgency: 4,
    recommendedUrgency: 4,
    impact: 4,
    effort: 2,
    estimatedDurationMinutes: 60,
    actualDurationSeconds: 1800,
    cognitiveStrain: "HIGH",
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    isCompleted: false,
    completedAt: null,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    lastWorkedAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: "e0100000-0000-4000-8000-000000000002",
    title: "Finish high-impact life vision manifesto & personal core goals",
    notes:
      "Non-negotiable foundational document for guiding 5-year trajectory.",
    category: "Strategic Life",
    megaBucket: "Life Operating System",
    importance: 5,
    urgency: 3,
    recommendedUrgency: 3,
    impact: 5,
    effort: 4,
    estimatedDurationMinutes: 120,
    actualDurationSeconds: 0,
    cognitiveStrain: "EXTREME",
    dueDate: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
    isCompleted: false,
    completedAt: null,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "e0100000-0000-4000-8000-000000000003",
    title: "Renew server hosting SSL certificates and verify DNS propagation",
    notes: "Expiring in 18 hours. Urgent operational requirement.",
    category: "Operations",
    megaBucket: "Infrastructure & DevOps",
    importance: 3,
    urgency: 5,
    recommendedUrgency: 5,
    impact: 3,
    effort: 1,
    estimatedDurationMinutes: 25,
    actualDurationSeconds: 0,
    cognitiveStrain: "LOW",
    dueDate: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(),
    isCompleted: false,
    completedAt: null,
    createdAt: new Date(Date.now() - 10800000).toISOString(),
    updatedAt: new Date(Date.now() - 10800000).toISOString(),
  },
  {
    id: "e0100000-0000-4000-8000-000000000004",
    title: "Review speculative tech podcast episode on quantum computing",
    notes: "Low impact exploratory media consumption.",
    category: "Personal",
    megaBucket: null,
    importance: 1,
    urgency: 1,
    recommendedUrgency: 1,
    impact: 1,
    effort: 2,
    estimatedDurationMinutes: 45,
    actualDurationSeconds: 0,
    cognitiveStrain: "LOW",
    dueDate: null,
    isCompleted: false,
    completedAt: null,
    createdAt: new Date(Date.now() - 14400000).toISOString(),
    updatedAt: new Date(Date.now() - 14400000).toISOString(),
  },
];

const DEFAULT_MEGA_BUCKETS = [
  "Core Engine 2.0",
  "Life Operating System",
  "Infrastructure & DevOps",
];

/**
 * LocalStorage Implementation of ITaskRepository.
 * Handles client-side caching, guest persistence, and offline durability.
 */
export class LocalStorageTaskRepository implements ITaskRepository {
  /**
   * Retrieves all tasks from local persistent storage, auto-sanitizing legacy IDs to UUIDs.
   */
  async fetchTasks(): Promise<TaskItem[]> {
    try {
      const deletedIds = getDeletedTaskIds();
      const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
      const isInitialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED_FLAG);

      if (raw === null && !isInitialized) {
        localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(SEED_TASKS));
        localStorage.setItem(STORAGE_KEYS.INITIALIZED_FLAG, "true");
        return SEED_TASKS;
      }
      if (raw === null) {
        return [];
      }

      const rawTasks: TaskItem[] = JSON.parse(raw);
      let needsResave = false;

      const tasks = rawTasks
        .filter((t) => !t.isDeleted && !deletedIds.has(t.id))
        .map((t) => {
          let validId = t.id;
          // Auto-migrate any legacy non-UUID IDs (e.g., 'seed-task-1', 'tsk_123') to RFC 4122 UUIDs
          if (!isValidUUID(validId)) {
            validId = generateUUID();
            needsResave = true;
          }

          const taskItem: TaskItem = {
            ...t,
            id: validId,
            impact: t.impact ?? t.importance ?? 3,
            effort: t.effort ?? 3,
            estimatedDurationMinutes: t.estimatedDurationMinutes ?? 30,
            actualDurationSeconds: t.actualDurationSeconds ?? 0,
            cognitiveStrain: t.cognitiveStrain ?? "MODERATE",
            megaBucket: t.megaBucket || null,
            recommendedUrgency: calculateRecommendedUrgency(t.dueDate),
          };

          // Compute urgency escalation daemon flag
          taskItem.isEscalated = checkUrgencyEscalation(taskItem);

          return taskItem;
        });

      if (needsResave) {
        localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
      }

      return tasks;
    } catch (error) {
      console.error(
        "[Jarvis Storage] Failed to load tasks from localStorage:",
        error,
      );
      return [];
    }
  }

  /**
   * Inserts or appends a new task record.
   */
  async saveTask(task: TaskItem): Promise<TaskItem> {
    const deletedIds = getDeletedTaskIds();
    if (task.isDeleted || deletedIds.has(task.id)) {
      return task;
    }

    const tasks = await this.fetchTasks();
    const existingIndex = tasks.findIndex((t) => t.id === task.id);
    let updatedTasks: TaskItem[];

    const enrichedTask: TaskItem = {
      ...task,
      isEscalated: checkUrgencyEscalation(task),
      updatedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      updatedTasks = [...tasks];
      updatedTasks[existingIndex] = enrichedTask;
    } else {
      updatedTasks = [enrichedTask, ...tasks];
    }

    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updatedTasks));
    return enrichedTask;
  }

  /**
   * Persists an entire task list collection in a single atomic storage operation.
   * Strips any deleted task entities from being re-persisted.
   */
  async saveTasks(tasks: TaskItem[]): Promise<void> {
    const deletedIds = getDeletedTaskIds();
    const activeTasks = tasks.filter(
      (t) => !t.isDeleted && !deletedIds.has(t.id),
    );

    const enrichedTasks = activeTasks.map((t) => ({
      ...t,
      isEscalated: checkUrgencyEscalation(t),
      updatedAt: t.updatedAt || new Date().toISOString(),
    }));
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(enrichedTasks));
  }

  /**
   * Updates discrete properties of an existing task item.
   */
  async updateTask(id: string, updates: Partial<TaskItem>): Promise<TaskItem> {
    const tasks = await this.fetchTasks();
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new Error(`Task entity with id ${id} not found.`);
    }

    const current = tasks[index];
    const updated: TaskItem = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
      ...(updates.dueDate !== undefined
        ? {
            recommendedUrgency: calculateRecommendedUrgency(
              updates.dueDate ?? null,
            ),
          }
        : {}),
    };

    updated.isEscalated = checkUrgencyEscalation(updated);

    tasks[index] = updated;
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    return updated;
  }

  /**
   * Permanently deletes a task by ID and registers a tombstone to prevent resurrection.
   */
  async deleteTask(id: string): Promise<boolean> {
    recordDeletedTaskId(id);
    const tasks = await this.fetchTasks();
    const target = tasks.find((t) => t.id === id);
    if (target?.isHabit && target.habitId && target.habitPeriodKey) {
      recordDeletedHabitPeriod(target.habitId, target.habitPeriodKey);
    }

    const filtered = tasks.filter((t) => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(filtered));
    return true;
  }

  /**
   * Fetches active user session from local storage.
   */
  async fetchSession(): Promise<UserSession | null> {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SESSION);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  /**
   * Sets or terminates the active user session.
   */
  async setSession(session: UserSession | null): Promise<void> {
    if (!session) {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
    } else {
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
    }
  }

  /**
   * Retrieves array of bubble guidance IDs dismissed by user.
   */
  getDismissedBubbles(): string[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.DISMISSED_BUBBLES);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /**
   * Marks a guidance bubble as dismissed.
   */
  dismissBubble(id: string): void {
    const current = this.getDismissedBubbles();
    if (!current.includes(id)) {
      current.push(id);
      localStorage.setItem(
        STORAGE_KEYS.DISMISSED_BUBBLES,
        JSON.stringify(current),
      );
    }
  }

  /**
   * Retrieves list of Mega Task Bins.
   */
  getMegaBuckets(): string[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.MEGA_BUCKETS);
      if (!raw) {
        localStorage.setItem(
          STORAGE_KEYS.MEGA_BUCKETS,
          JSON.stringify(DEFAULT_MEGA_BUCKETS),
        );
        return DEFAULT_MEGA_BUCKETS;
      }
      return JSON.parse(raw);
    } catch {
      return DEFAULT_MEGA_BUCKETS;
    }
  }

  /**
   * Saves or creates a new Mega Task Bin.
   */
  saveMegaBucket(bucketName: string): void {
    const trimmed = bucketName.trim();
    if (!trimmed) return;
    const current = this.getMegaBuckets();
    if (!current.includes(trimmed)) {
      const updated = [...current, trimmed];
      localStorage.setItem(STORAGE_KEYS.MEGA_BUCKETS, JSON.stringify(updated));
    }
  }
}

/**
 * Hybrid Repository routing transparently between Supabase and LocalStorage.
 */
class HybridTaskRepository implements ITaskRepository {
  private localRepo = new LocalStorageTaskRepository();

  private async shouldUseCloud(): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    const session = await this.localRepo.fetchSession();
    return Boolean(session && !session.isGuest);
  }

  async fetchTasks(): Promise<TaskItem[]> {
    if (await this.shouldUseCloud()) {
      const { supabaseRepository } = await import("./supabaseRepository");
      const cloudTasks = await supabaseRepository.fetchTasks();
      return cloudTasks.map((t) => ({
        ...t,
        isEscalated: checkUrgencyEscalation(t),
      }));
    }
    return this.localRepo.fetchTasks();
  }

  async saveTask(task: TaskItem): Promise<TaskItem> {
    if (await this.shouldUseCloud()) {
      const { supabaseRepository } = await import("./supabaseRepository");
      return supabaseRepository.saveTask(task);
    }
    return this.localRepo.saveTask(task);
  }

  async saveTasks(tasks: TaskItem[]): Promise<void> {
    if (await this.shouldUseCloud()) {
      const { supabaseRepository } = await import("./supabaseRepository");
      return supabaseRepository.saveTasks(tasks);
    }
    return this.localRepo.saveTasks(tasks);
  }

  async updateTask(id: string, updates: Partial<TaskItem>): Promise<TaskItem> {
    if (await this.shouldUseCloud()) {
      const { supabaseRepository } = await import("./supabaseRepository");
      return supabaseRepository.updateTask(id, updates);
    }
    return this.localRepo.updateTask(id, updates);
  }

  async deleteTask(id: string): Promise<boolean> {
    if (await this.shouldUseCloud()) {
      const { supabaseRepository } = await import("./supabaseRepository");
      return supabaseRepository.deleteTask(id);
    }
    return this.localRepo.deleteTask(id);
  }

  fetchSession(): Promise<UserSession | null> {
    return this.localRepo.fetchSession();
  }

  setSession(session: UserSession | null): Promise<void> {
    return this.localRepo.setSession(session);
  }

  getDismissedBubbles(): string[] {
    return this.localRepo.getDismissedBubbles();
  }

  dismissBubble(id: string): void {
    this.localRepo.dismissBubble(id);
  }

  getMegaBuckets(): string[] {
    return this.localRepo.getMegaBuckets();
  }

  saveMegaBucket(bucketName: string): void {
    this.localRepo.saveMegaBucket(bucketName);
  }
}

/**
 * Singleton repository instance.
 */
export const storageAdapter: ITaskRepository = new HybridTaskRepository();
