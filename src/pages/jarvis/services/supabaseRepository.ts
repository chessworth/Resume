/**
 * @fileoverview Supabase implementation of ITaskRepository.
 * Manages cloud PostgreSQL persistence, row-level security mapping,
 * real-time subscription channels, and cache synchronization with focus telemetry.
 * @packageDocumentation
 */

import { supabase, isSupabaseConfigured } from "./supabaseClient";
import { ITaskRepository, LocalStorageTaskRepository } from "./storageAdapter";
import { TaskItem, UserSession, CognitiveStrainLevel } from "../types/task";
import { calculateRecommendedUrgency } from "../constants/definitions";
import { generateUUID, isValidUUID } from "../utils/uuid";

/**
 * Database schema representation matching public.tasks in PostgreSQL.
 */
export interface SupabaseTaskRow {
  id: string;
  user_id: string;
  title: string;
  notes: string | null;
  category: string;
  mega_bucket: string | null;
  importance: number;
  urgency: number;
  recommended_urgency: number;
  impact: number;
  effort: number;
  estimated_duration_minutes: number | null;
  actual_duration_seconds: number | null;
  cognitive_strain: string | null;
  due_date: string | null;
  last_worked_at: string | null;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Converts Supabase PostgreSQL snake_case row to frontend camelCase TaskItem.
 */
export function mapRowToTask(row: SupabaseTaskRow): TaskItem {
  return {
    id: row.id,
    title: row.title,
    notes: row.notes || undefined,
    category: row.category,
    megaBucket: row.mega_bucket || null,
    importance: row.importance as TaskItem["importance"],
    urgency: row.urgency as TaskItem["urgency"],
    recommendedUrgency:
      row.recommended_urgency as TaskItem["recommendedUrgency"],
    impact: (row.impact ?? 3) as TaskItem["impact"],
    effort: (row.effort ?? 3) as TaskItem["effort"],
    estimatedDurationMinutes: row.estimated_duration_minutes ?? 30,
    actualDurationSeconds: row.actual_duration_seconds ?? 0,
    cognitiveStrain:
      (row.cognitive_strain as CognitiveStrainLevel) || "MODERATE",
    dueDate: row.due_date,
    lastWorkedAt: row.last_worked_at,
    isCompleted: row.is_completed,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Converts frontend camelCase TaskItem to Supabase PostgreSQL snake_case payload.
 */
export function mapTaskToRow(
  task: TaskItem,
  userId: string,
): Omit<SupabaseTaskRow, "created_at" | "updated_at"> {
  const safeId = isValidUUID(task.id) ? task.id : generateUUID();
  return {
    id: safeId,
    user_id: userId,
    title: task.title,
    notes: task.notes || null,
    category: task.category,
    mega_bucket: task.megaBucket || null,
    importance: task.importance,
    urgency: task.urgency,
    recommended_urgency:
      task.recommendedUrgency || calculateRecommendedUrgency(task.dueDate),
    impact: task.impact ?? 3,
    effort: task.effort ?? 3,
    estimated_duration_minutes: task.estimatedDurationMinutes ?? 30,
    actual_duration_seconds: task.actualDurationSeconds ?? 0,
    cognitive_strain: task.cognitiveStrain ?? "MODERATE",
    due_date: task.dueDate,
    last_worked_at: task.lastWorkedAt || null,
    is_completed: task.isCompleted,
    completed_at: task.completedAt,
  };
}

export class SupabaseTaskRepository implements ITaskRepository {
  private localFallback = new LocalStorageTaskRepository();

  /**
   * Retrieves current authenticated user ID from active Supabase session.
   */
  private async getUserId(): Promise<string | null> {
    if (!isSupabaseConfigured() || !supabase) return null;
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.id || null;
  }

  /**
   * Fetches tasks from Supabase cloud database with local cache fallback.
   */
  async fetchTasks(): Promise<TaskItem[]> {
    if (!isSupabaseConfigured() || !supabase) {
      return this.localFallback.fetchTasks();
    }

    const userId = await this.getUserId();
    if (!userId) {
      return this.localFallback.fetchTasks();
    }

    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("importance", { ascending: false })
        .order("urgency", { ascending: false });

      if (error) {
        console.warn(
          "[Jarvis Cloud] Supabase fetch error. Using local cache:",
          error.message,
        );
        return this.localFallback.fetchTasks();
      }

      if (data) {
        const cloudTasks = data.map((row) =>
          mapRowToTask(row as SupabaseTaskRow),
        );
        // Synchronize local cache for offline availability
        localStorage.setItem("jarvis_tasks_v1", JSON.stringify(cloudTasks));
        return cloudTasks;
      }
    } catch (err) {
      console.warn(
        "[Jarvis Cloud] Network failure on fetch. Falling back to local cache:",
        err,
      );
    }

    return this.localFallback.fetchTasks();
  }

  /**
   * Saves a new or modified task into Supabase cloud table.
   */
  async saveTask(task: TaskItem): Promise<TaskItem> {
    if (!isSupabaseConfigured() || !supabase) {
      return this.localFallback.saveTask(task);
    }

    const userId = await this.getUserId();
    if (!userId) {
      return this.localFallback.saveTask(task);
    }

    try {
      const row = mapTaskToRow(task, userId);
      const { data, error } = await supabase
        .from("tasks")
        .upsert(row)
        .select()
        .single();

      if (error) {
        console.warn(
          "[Jarvis Cloud] Supabase save error. Saving locally:",
          error.message,
        );
        return this.localFallback.saveTask(task);
      }

      const saved = mapRowToTask(data as SupabaseTaskRow);
      await this.localFallback.saveTask(saved);
      return saved;
    } catch (err) {
      console.warn(
        "[Jarvis Cloud] Network failure on save. Saving locally:",
        err,
      );
      return this.localFallback.saveTask(task);
    }
  }

  /**
   * Persists an entire task collection atomically.
   */
  async saveTasks(tasks: TaskItem[]): Promise<void> {
    await this.localFallback.saveTasks(tasks);
    if (!isSupabaseConfigured() || !supabase) return;
    const userId = await this.getUserId();
    if (!userId) return;

    try {
      const rows = tasks.map((t) => mapTaskToRow(t, userId));
      await supabase.from("tasks").upsert(rows);
    } catch (err) {
      console.warn(
        "[Jarvis Cloud] Failed to batch upsert tasks to Supabase:",
        err,
      );
    }
  }

  /**
   * Updates discrete properties of an existing task item.
   */
  async updateTask(id: string, updates: Partial<TaskItem>): Promise<TaskItem> {
    if (!isSupabaseConfigured() || !supabase) {
      return this.localFallback.updateTask(id, updates);
    }

    const userId = await this.getUserId();
    if (!userId) {
      return this.localFallback.updateTask(id, updates);
    }

    try {
      const payload: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (updates.title !== undefined) payload.title = updates.title;
      if (updates.notes !== undefined) payload.notes = updates.notes || null;
      if (updates.category !== undefined) payload.category = updates.category;
      if (updates.megaBucket !== undefined)
        payload.mega_bucket = updates.megaBucket || null;
      if (updates.importance !== undefined)
        payload.importance = updates.importance;
      if (updates.urgency !== undefined) payload.urgency = updates.urgency;
      if (updates.impact !== undefined) payload.impact = updates.impact;
      if (updates.effort !== undefined) payload.effort = updates.effort;
      if (updates.estimatedDurationMinutes !== undefined)
        payload.estimated_duration_minutes = updates.estimatedDurationMinutes;
      if (updates.actualDurationSeconds !== undefined)
        payload.actual_duration_seconds = updates.actualDurationSeconds;
      if (updates.cognitiveStrain !== undefined)
        payload.cognitive_strain = updates.cognitiveStrain;
      if (updates.lastWorkedAt !== undefined)
        payload.last_worked_at = updates.lastWorkedAt;
      if (updates.dueDate !== undefined) {
        payload.due_date = updates.dueDate;
        payload.recommended_urgency = calculateRecommendedUrgency(
          updates.dueDate,
        );
      }
      if (updates.isCompleted !== undefined) {
        payload.is_completed = updates.isCompleted;
        payload.completed_at =
          updates.completedAt ||
          (updates.isCompleted ? new Date().toISOString() : null);
      }

      const { data, error } = await supabase
        .from("tasks")
        .update(payload)
        .eq("id", id)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) {
        console.warn(
          "[Jarvis Cloud] Supabase update error. Applying locally:",
          error.message,
        );
        return this.localFallback.updateTask(id, updates);
      }

      const updated = mapRowToTask(data as SupabaseTaskRow);
      await this.localFallback.updateTask(id, updates);
      return updated;
    } catch (err) {
      console.warn(
        "[Jarvis Cloud] Network failure on update. Applying locally:",
        err,
      );
      return this.localFallback.updateTask(id, updates);
    }
  }

  /**
   * Permanently deletes a task from the database.
   */
  async deleteTask(id: string): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) {
      return this.localFallback.deleteTask(id);
    }

    const userId = await this.getUserId();
    if (!userId) {
      return this.localFallback.deleteTask(id);
    }

    try {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      if (error) {
        console.warn("[Jarvis Cloud] Supabase delete error:", error.message);
      }
    } catch (err) {
      console.warn("[Jarvis Cloud] Network failure on delete:", err);
    }

    return this.localFallback.deleteTask(id);
  }

  /**
   * Subscribes to Supabase Realtime changes for the current operator's tasks.
   */
  subscribeToChanges(userId: string, onUpdate: () => void): () => void {
    if (!isSupabaseConfigured() || !supabase) {
      return () => {};
    }

    const channel = supabase
      .channel(`realtime:tasks:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          onUpdate();
        },
      )
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }

  /**
   * Migrates local guest tasks into Supabase when an operator registers or signs in.
   */
  async migrateLocalTasksToCloud(userId: string): Promise<number> {
    if (!isSupabaseConfigured() || !supabase) return 0;

    const localTasks = await this.localFallback.fetchTasks();
    if (localTasks.length === 0) return 0;

    let migratedCount = 0;
    for (const task of localTasks) {
      try {
        const row = mapTaskToRow(task, userId);
        const { error } = await supabase.from("tasks").upsert(row);
        if (!error) {
          migratedCount++;
        }
      } catch (err) {
        console.warn(
          "[Jarvis Cloud] Failed to migrate local task:",
          task.title,
          err,
        );
      }
    }

    return migratedCount;
  }

  fetchSession(): Promise<UserSession | null> {
    return this.localFallback.fetchSession();
  }

  setSession(session: UserSession | null): Promise<void> {
    return this.localFallback.setSession(session);
  }

  getDismissedBubbles(): string[] {
    return this.localFallback.getDismissedBubbles();
  }

  dismissBubble(id: string): void {
    this.localFallback.dismissBubble(id);
  }

  getMegaBuckets(): string[] {
    return this.localFallback.getMegaBuckets();
  }

  saveMegaBucket(bucketName: string): void {
    this.localFallback.saveMegaBucket(bucketName);
  }
}

export const supabaseRepository = new SupabaseTaskRepository();
