/**
 * @fileoverview Quota and Rate Limit Governance Engine for Gemini AI Services.
 * Proactively tracks daily request counts and token consumption to prevent
 * exceeding Google Gemini free tier allowances (15 RPM, 1,500 RPD, 1,000,000 TPM).
 * Computes exact daily reset boundaries at 00:00:00 UTC and broadcasts telemetry
 * to user interface alerts and status indicators.
 * @packageDocumentation
 */

export interface AiQuotaRecord {
  /** UTC Date string for daily tracking (YYYY-MM-DD) */
  dateUtc: string;
  /** Cumulative request count executed today */
  requestCount: number;
  /** Estimated tokens consumed today */
  estimatedTokens: number;
  /** Daily safety limit ceiling (defaults to 1500 for Gemini 3.8 Flash free tier) */
  dailyLimit: number;
  /** Flag indicating whether the quota has been declared exhausted */
  isExhausted: boolean;
  /** ISO string of the expected quota reset time */
  resetTimeIso: string;
  /** Human-readable explanation of exhaustion */
  exhaustionReason?: string;
}

export interface QuotaStatus {
  requestCount: number;
  estimatedTokens: number;
  dailyLimit: number;
  remainingRequests: number;
  percentUsed: number;
  isExhausted: boolean;
  resetTimeIso: string;
  resetsInFormatted: string;
  resetsAtFormattedLocal: string;
  resetsAtFormattedUtc: string;
  exhaustionReason?: string;
}

const STORAGE_KEY = 'jarvis_gemini_quota_v1';
const DEFAULT_DAILY_LIMIT = 1500; // Free tier standard for Gemini Flash (1,500 RPD)

/**
 * Calculates the next 00:00:00 UTC boundary timestamp when Google Cloud quotas reset.
 */
export function calculateNextUtcMidnight(): Date {
  const now = new Date();
  const next = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0, 0, 0, 0
  ));
  return next;
}

/**
 * Returns the current date in UTC ISO format (YYYY-MM-DD).
 */
export function getCurrentUtcDateString(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Computes a human-readable duration countdown string from now until the target date.
 * @param targetDate - The boundary date when quotas reset
 */
export function formatCountdown(targetDate: Date): string {
  const diffMs = targetDate.getTime() - Date.now();
  if (diffMs <= 0) {
    return 'momentarily';
  }

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

type QuotaListener = (status: QuotaStatus) => void;

class AiQuotaService {
  private record: AiQuotaRecord;
  private listeners: Set<QuotaListener> = new Set();

  constructor() {
    this.record = this.loadRecord();
    this.checkAndResetIfNewDay();
  }

  /**
   * Loads existing quota tracking record from persistent storage.
   */
  private loadRecord(): AiQuotaRecord {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed;
      }
    } catch (e) {
      console.warn('[AiQuotaService] Failed to load quota record from localStorage:', e);
    }

    const currentUtc = getCurrentUtcDateString();
    return {
      dateUtc: currentUtc,
      requestCount: 0,
      estimatedTokens: 0,
      dailyLimit: DEFAULT_DAILY_LIMIT,
      isExhausted: false,
      resetTimeIso: calculateNextUtcMidnight().toISOString()
    };
  }

  /**
   * Persists current quota record to localStorage and notifies subscribers.
   */
  private saveRecord(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.record));
    } catch (e) {
      console.warn('[AiQuotaService] Failed to persist quota record:', e);
    }
    this.notifySubscribers();
  }

  /**
   * Verifies if the UTC calendar day has elapsed, resetting counts if so.
   */
  public checkAndResetIfNewDay(): boolean {
    const currentUtc = getCurrentUtcDateString();
    if (this.record.dateUtc !== currentUtc) {
      this.record = {
        dateUtc: currentUtc,
        requestCount: 0,
        estimatedTokens: 0,
        dailyLimit: this.record.dailyLimit || DEFAULT_DAILY_LIMIT,
        isExhausted: false,
        resetTimeIso: calculateNextUtcMidnight().toISOString()
      };
      this.saveRecord();
      return true;
    }

    // Check if previous exhaustion time has now passed
    if (this.record.isExhausted) {
      const resetDate = new Date(this.record.resetTimeIso);
      if (Date.now() >= resetDate.getTime()) {
        this.record.isExhausted = false;
        this.record.exhaustionReason = undefined;
        this.record.resetTimeIso = calculateNextUtcMidnight().toISOString();
        this.saveRecord();
        return true;
      }
    }

    return false;
  }

  /**
   * Retrieves comprehensive snapshot of current quota metrics and reset countdowns.
   */
  public getQuotaStatus(): QuotaStatus {
    this.checkAndResetIfNewDay();

    const resetDate = new Date(this.record.resetTimeIso);
    const remainingRequests = Math.max(0, this.record.dailyLimit - this.record.requestCount);
    const percentUsed = Math.min(100, Math.round((this.record.requestCount / this.record.dailyLimit) * 100));

    const resetsInFormatted = formatCountdown(resetDate);

    // Format local time representation (e.g. "5:00 PM PDT")
    let resetsAtFormattedLocal = '';
    try {
      resetsAtFormattedLocal = resetDate.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      });
    } catch {
      resetsAtFormattedLocal = resetDate.toLocaleTimeString();
    }

    // Format UTC boundary representation (e.g. "00:00 UTC")
    const resetsAtFormattedUtc = `${String(resetDate.getUTCHours()).padStart(2, '0')}:${String(resetDate.getUTCMinutes()).padStart(2, '0')} UTC`;

    return {
      requestCount: this.record.requestCount,
      estimatedTokens: this.record.estimatedTokens,
      dailyLimit: this.record.dailyLimit,
      remainingRequests,
      percentUsed,
      isExhausted: this.record.isExhausted || this.record.requestCount >= this.record.dailyLimit,
      resetTimeIso: this.record.resetTimeIso,
      resetsInFormatted,
      resetsAtFormattedLocal,
      resetsAtFormattedUtc,
      exhaustionReason: this.record.exhaustionReason
    };
  }

  /**
   * Pre-flight gate check to prevent outbound network requests if quota is exhausted.
   * @returns Object indicating if request may proceed or why it was rejected.
   */
  public canMakeRequest(): { allowed: boolean; reason?: string; resetTimeIso?: string } {
    this.checkAndResetIfNewDay();
    const status = this.getQuotaStatus();

    if (status.isExhausted) {
      return {
        allowed: false,
        reason: status.exhaustionReason || `Daily AI free allowance reached (${this.record.requestCount}/${this.record.dailyLimit} requests). Resets in ${status.resetsInFormatted}.`,
        resetTimeIso: status.resetTimeIso
      };
    }

    return { allowed: true };
  }

  /**
   * Records a successfully executed AI request, incrementing daily counters.
   * @param estimatedTokens - Estimated token quantity consumed (default ~500)
   */
  public recordRequest(estimatedTokens = 500): QuotaStatus {
    this.checkAndResetIfNewDay();
    this.record.requestCount += 1;
    this.record.estimatedTokens += estimatedTokens;

    if (this.record.requestCount >= this.record.dailyLimit) {
      this.record.isExhausted = true;
      this.record.exhaustionReason = `Daily request threshold reached (${this.record.requestCount}/${this.record.dailyLimit}).`;
    }

    this.saveRecord();
    return this.getQuotaStatus();
  }

  /**
   * Marks quota as exhausted when a 429 status code is received from the Gemini API.
   * @param upstreamResetTimeIso - Optional reset timestamp provided by upstream server/headers
   * @param reason - Optional explanatory message
   */
  public markExhausted(upstreamResetTimeIso?: string, reason?: string): QuotaStatus {
    this.checkAndResetIfNewDay();
    this.record.isExhausted = true;

    if (upstreamResetTimeIso && !isNaN(new Date(upstreamResetTimeIso).getTime())) {
      this.record.resetTimeIso = upstreamResetTimeIso;
    } else {
      this.record.resetTimeIso = calculateNextUtcMidnight().toISOString();
    }

    this.record.exhaustionReason = reason || 'Daily free personal AI allowance exhausted (Google Gemini Rate Limit 429).';
    this.saveRecord();
    return this.getQuotaStatus();
  }

  /**
   * Updates user-configured daily safety threshold (e.g. 50, 100, 500, or 1500).
   * @param limit - New maximum daily requests
   */
  public setDailyLimit(limit: number): void {
    if (limit <= 0 || !Number.isFinite(limit)) return;
    this.record.dailyLimit = Math.floor(limit);
    if (this.record.requestCount >= this.record.dailyLimit) {
      this.record.isExhausted = true;
    } else if (this.record.isExhausted && this.record.requestCount < this.record.dailyLimit) {
      // Re-enable if raised above current count and not locked by upstream 429
      this.record.isExhausted = false;
      this.record.exhaustionReason = undefined;
    }
    this.saveRecord();
  }

  /**
   * Manually resets quota counters for operator diagnostics.
   */
  public resetQuota(): void {
    const currentUtc = getCurrentUtcDateString();
    this.record = {
      dateUtc: currentUtc,
      requestCount: 0,
      estimatedTokens: 0,
      dailyLimit: this.record.dailyLimit || DEFAULT_DAILY_LIMIT,
      isExhausted: false,
      resetTimeIso: calculateNextUtcMidnight().toISOString()
    };
    this.saveRecord();
  }

  /**
   * Subscribes to live quota updates.
   * @param listener - Callback receiving current QuotaStatus on state alterations
   * @returns Unsubscribe function
   */
  public subscribe(listener: QuotaListener): () => void {
    this.listeners.add(listener);
    listener(this.getQuotaStatus());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifySubscribers(): void {
    const status = this.getQuotaStatus();
    for (const listener of this.listeners) {
      try {
        listener(status);
      } catch (err) {
        console.error('[AiQuotaService] Subscriber notification error:', err);
      }
    }
  }
}

export const aiQuotaService = new AiQuotaService();
