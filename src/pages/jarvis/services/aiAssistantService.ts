/**
 * @fileoverview Client-side communication service for Jarvis Gemini AI Assistant endpoints.
 * Provides typed methods for automated task specification parsing (Option A),
 * surgical step-by-step task roadmaps, daily schedule optimization, and priority audits.
 * Communicates with server-side proxy to protect API keys.
 * Enforces proactive quota pre-flight checks and intercepts 429 rate limit boundaries.
 * @packageDocumentation
 */

import { TaskItem, ImportanceLevel, UrgencyLevel, ImpactLevel, EffortLevel, CognitiveStrainLevel } from '../types/task';
import { aiQuotaService, QuotaStatus } from './aiQuotaService';

export interface GeneratedTaskProposal {
  title: string;
  notes?: string;
  category?: string;
  importance: ImportanceLevel;
  urgency: UrgencyLevel;
  impact: ImpactLevel;
  effort: EffortLevel;
  dueDate?: string | null;
  estimatedDurationMinutes?: number;
  cognitiveStrain?: CognitiveStrainLevel;
  megaBucket?: string | null;
  microtasks?: string[];
}

export interface TaskGuidePhase {
  phaseName: string;
  durationMinutes: number;
  actions: string[];
}

export interface TaskGuideResponse {
  taskTitle: string;
  overview: string;
  keyObjectives: string[];
  phases: TaskGuidePhase[];
  pitfallsToAvoid: string[];
  microtasks: string[];
}

export interface DailyScheduleBlock {
  taskId: string;
  title: string;
  blockLabel: string;
  focusMinutes: number;
  rationale: string;
}

export interface DailyPlanResponse {
  summary: string;
  totalEstimatedMinutes?: number;
  schedule: DailyScheduleBlock[];
  restRecommendations?: string[];
}

export interface AuditFinding {
  taskId: string;
  title: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  issueDescription: string;
  recommendedAdjustment: string;
  suggestedImportance?: ImportanceLevel;
  suggestedUrgency?: UrgencyLevel;
  suggestedImpact?: ImpactLevel;
  suggestedEffort?: EffortLevel;
}

export interface PriorityAuditResponse {
  healthScore: number;
  executiveSummary: string;
  anomaliesFound?: number;
  findings: AuditFinding[];
}

/**
 * Custom error thrown when daily AI quota is exhausted or rate limit 429 is encountered.
 */
export class AiQuotaExhaustedError extends Error {
  public readonly isRateLimit = true;
  public readonly resetTimeIso: string;
  public readonly resetsInFormatted: string;

  constructor(message: string, resetTimeIso: string, resetsInFormatted: string) {
    super(message);
    this.name = 'AiQuotaExhaustedError';
    this.resetTimeIso = resetTimeIso;
    this.resetsInFormatted = resetsInFormatted;
  }
}

/**
 * Handles error decoding from fetch responses, transforming 429 quota exhaustion into typed error.
 */
async function handleResponseError(res: Response): Promise<never> {
  let errorData: any = {};
  try {
    errorData = await res.json();
  } catch {
    errorData = { error: `Server returned status ${res.status}` };
  }

  if (res.status === 429 || errorData.isRateLimit || errorData.exhausted) {
    const updatedStatus = aiQuotaService.markExhausted(
      errorData.resetTime,
      errorData.message || errorData.error
    );

    throw new AiQuotaExhaustedError(
      errorData.message || errorData.error || 'Daily free AI token/request quota exhausted.',
      updatedStatus.resetTimeIso,
      updatedStatus.resetsInFormatted
    );
  }

  throw new Error(errorData.error || `Request failed with HTTP status ${res.status}`);
}

/**
 * Pre-flight gate check to prevent network requests when local quota is exhausted.
 */
function assertQuotaAvailable(): void {
  const gate = aiQuotaService.canMakeRequest();
  if (!gate.allowed) {
    const status = aiQuotaService.getQuotaStatus();
    throw new AiQuotaExhaustedError(
      gate.reason || 'Daily free AI token/request quota exhausted.',
      status.resetTimeIso,
      status.resetsInFormatted
    );
  }
}

export const aiAssistantService = {
  /**
   * Generates a calibrated task proposal from natural language prompt using Gemini 3.8 Flash.
   */
  async generateTaskProposal(prompt: string, availableBuckets: string[] = []): Promise<GeneratedTaskProposal> {
    assertQuotaAvailable();

    const res = await fetch('/api/gemini/create-task', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, availableBuckets }),
    });

    if (!res.ok) {
      await handleResponseError(res);
    }

    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error || 'Failed to synthesize task proposal from prompt.');
    }

    aiQuotaService.recordRequest(600);
    return json.data as GeneratedTaskProposal;
  },

  /**
   * Generates a step-by-step execution roadmap for an existing task.
   */
  async generateTaskGuide(task: TaskItem, breakIntoMicrotasks = false): Promise<TaskGuideResponse> {
    assertQuotaAvailable();

    const res = await fetch('/api/gemini/guide-task', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task, breakIntoMicrotasks }),
    });

    if (!res.ok) {
      await handleResponseError(res);
    }

    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error || 'Failed to generate task execution guide.');
    }

    aiQuotaService.recordRequest(850);
    return json.data as TaskGuideResponse;
  },

  /**
   * Generates an optimal sequential execution plan for the day based on cognitive pacing.
   */
  async generateDailyPlan(tasks: TaskItem[]): Promise<DailyPlanResponse> {
    assertQuotaAvailable();

    const res = await fetch('/api/gemini/daily-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tasks }),
    });

    if (!res.ok) {
      await handleResponseError(res);
    }

    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error || 'Failed to generate daily execution plan.');
    }

    aiQuotaService.recordRequest(900);
    return json.data as DailyPlanResponse;
  },

  /**
   * Scans active tasks and identifies logical misalignments and misclassified priorities.
   */
  async auditTaskPriorities(tasks: TaskItem[]): Promise<PriorityAuditResponse> {
    assertQuotaAvailable();

    const res = await fetch('/api/gemini/priority-audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tasks }),
    });

    if (!res.ok) {
      await handleResponseError(res);
    }

    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error || 'Failed to run priority calibration audit.');
    }

    aiQuotaService.recordRequest(750);
    return json.data as PriorityAuditResponse;
  },

  /**
   * Retrieves active quota status metrics.
   */
  getQuotaStatus(): QuotaStatus {
    return aiQuotaService.getQuotaStatus();
  },

  /**
   * Subscribes to live quota state alterations.
   */
  subscribeQuota(listener: (status: QuotaStatus) => void): () => void {
    return aiQuotaService.subscribe(listener);
  },
};
