/**
 * @fileoverview High-Legibility Quota Exhaustion Alert and Telemetry HUD.
 * Alerts users when their Gemini AI free personal tokens or daily requests are depleted.
 * Displays exact reset times (local and UTC), live countdown clocks, safety limit controls,
 * and operational continuity assurances for offline task matrix features.
 * @packageDocumentation
 */

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Clock,
  Zap,
  CheckCircle2,
  X,
  RefreshCw,
  Sliders,
  ShieldCheck,
  ChevronRight,
  Info
} from 'lucide-react';
import { aiQuotaService, QuotaStatus } from '../services/aiQuotaService';

interface AiQuotaAlertBannerProps {
  status: QuotaStatus;
  onDismiss: () => void;
  onOpenSettings?: () => void;
}

/**
 * Top-level High-Visibility Critical Alert Banner when Quota is Exhausted.
 */
export const AiQuotaAlertBanner: React.FC<AiQuotaAlertBannerProps> = ({
  status,
  onDismiss,
  onOpenSettings
}) => {
  const [countdown, setCountdown] = useState(status.resetsInFormatted);

  useEffect(() => {
    const interval = setInterval(() => {
      const current = aiQuotaService.getQuotaStatus();
      setCountdown(current.resetsInFormatted);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      role="alert"
      className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 px-5 py-4 rounded-2xl border-2 border-amber-500/80 dark:border-amber-500/60 bg-gradient-to-r from-amber-50 via-amber-100/70 to-orange-50 dark:from-amber-950/60 dark:via-zinc-900/90 dark:to-zinc-900/90 backdrop-blur-xl shadow-lg text-slate-900 dark:text-zinc-100 transition-all animate-fadeIn"
    >
      <div className="flex items-start gap-3.5">
        <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-700 dark:text-amber-400 shrink-0">
          <AlertTriangle className="w-5 h-5 animate-pulse" />
        </div>

        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono font-extrabold uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30">
              AI QUOTA NOTICE
            </span>
            <h3 className="text-sm font-extrabold font-mono text-slate-950 dark:text-white">
              Daily Free AI Tokens & Requests Exhausted
            </h3>
          </div>

          <p className="text-xs text-slate-700 dark:text-zinc-300 font-sans leading-relaxed">
            {status.exhaustionReason ||
              `You have reached your daily free personal allowance of ${status.dailyLimit} requests for Gemini 3.8 Flash.`}
          </p>

          {/* Reset Time Telemetry Badge */}
          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-mono text-amber-900 dark:text-amber-300 font-bold">
            <span className="flex items-center gap-1.5 bg-amber-200/60 dark:bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-500/30">
              <Clock className="w-3.5 h-3.5" />
              <span>Resets in: <strong>{countdown}</strong></span>
            </span>

            <span className="text-[11px] text-slate-600 dark:text-zinc-400 font-medium">
              (Reset boundary: <strong>{status.resetsAtFormattedUtc}</strong> / {status.resetsAtFormattedLocal})
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
        {onOpenSettings && (
          <button
            type="button"
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-200/90 hover:bg-amber-300 dark:bg-amber-500/20 dark:hover:bg-amber-500/30 text-amber-900 dark:text-amber-200 font-mono text-xs font-bold border border-amber-300 dark:border-amber-500/40 transition-colors cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Manage Limit</span>
          </button>
        )}

        <button
          type="button"
          onClick={onDismiss}
          className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          aria-label="Dismiss alert"
          title="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

interface AiQuotaModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: QuotaStatus;
  onUpdateLimit: (newLimit: number) => void;
  onResetQuota: () => void;
}

/**
 * Detailed Diagnostic & Governance Modal for Gemini AI Quota.
 */
export const AiQuotaModal: React.FC<AiQuotaModalProps> = ({
  isOpen,
  onClose,
  status,
  onUpdateLimit,
  onResetQuota
}) => {
  const [customLimit, setCustomLimit] = useState(status.dailyLimit);
  const [liveCountdown, setLiveCountdown] = useState(status.resetsInFormatted);

  useEffect(() => {
    setCustomLimit(status.dailyLimit);
  }, [status.dailyLimit]);

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      const s = aiQuotaService.getQuotaStatus();
      setLiveCountdown(s.resetsInFormatted);
    }, 5000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-all text-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold font-mono tracking-wider text-slate-950 dark:text-white">
                GEMINI AI QUOTA GOVERNANCE
              </h2>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                Personal Free Tier Telemetry & Protection
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Status Indicator Banner */}
          <div
            className={`p-4 rounded-2xl border ${
              status.isExhausted
                ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700/60 text-amber-900 dark:text-amber-200'
                : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700/60 text-emerald-900 dark:text-emerald-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider">
                QUOTA STATUS:
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-extrabold uppercase bg-white/80 dark:bg-black/40 border">
                {status.isExhausted ? 'EXHAUSTED FOR TODAY' : 'ACTIVE & AVAILABLE'}
              </span>
            </div>
            <div className="mt-2 text-xs leading-relaxed">
              {status.isExhausted ? (
                <span>
                  All free requests for today have been consumed. Requests will automatically reactivate in{' '}
                  <strong>{liveCountdown}</strong>.
                </span>
              ) : (
                <span>
                  Operating within safe free tier allowances. You have <strong>{status.remainingRequests}</strong> requests remaining today.
                </span>
              )}
            </div>
          </div>

          {/* Telemetry Metric Cards */}
          <div className="grid grid-cols-2 gap-3 font-mono">
            <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-500 uppercase block font-bold">Requests Executed</span>
              <div className="text-lg font-extrabold text-slate-900 dark:text-white mt-1">
                {status.requestCount} <span className="text-xs text-slate-400 font-normal">/ {status.dailyLimit}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-2 overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    status.percentUsed > 90 ? 'bg-amber-500' : 'bg-cyan-500'
                  }`}
                  style={{ width: `${status.percentUsed}%` }}
                />
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-500 uppercase block font-bold">Estimated Tokens</span>
              <div className="text-lg font-extrabold text-slate-900 dark:text-white mt-1">
                ~{status.estimatedTokens.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-500 block mt-1">
                Free limit: 1M TPM
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 col-span-2">
              <span className="text-[10px] text-slate-500 uppercase block font-bold">Next Quota Reset</span>
              <div className="flex items-center justify-between mt-1">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <strong className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {liveCountdown}
                  </strong>
                </div>
                <div className="text-right text-[11px] text-slate-500">
                  <div>{status.resetsAtFormattedUtc}</div>
                  <div>({status.resetsAtFormattedLocal})</div>
                </div>
              </div>
            </div>
          </div>

          {/* Safety Threshold Customization */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                Daily Safety Ceiling:
              </label>
              <span className="text-xs font-mono font-extrabold text-cyan-600 dark:text-cyan-400">
                {customLimit} requests / day
              </span>
            </div>

            <input
              type="range"
              min="25"
              max="1500"
              step="25"
              value={customLimit}
              onChange={(e) => setCustomLimit(parseInt(e.target.value, 10))}
              className="w-full accent-cyan-600 cursor-pointer"
            />

            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
              <span>25 (Conservative)</span>
              <span>500 (Moderate)</span>
              <span>1500 (Full Free Tier)</span>
            </div>

            <button
              type="button"
              onClick={() => {
                onUpdateLimit(customLimit);
              }}
              className="w-full py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold uppercase transition-colors cursor-pointer"
            >
              Apply Safety Threshold
            </button>
          </div>

          {/* Core Feature Continuity Reassurance */}
          <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-800/40 text-[11px] text-slate-600 dark:text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900 dark:text-white block font-bold">
                100% Operational Offline Continuity
              </strong>
              <span>
                Even when AI requests are exhausted, all core Jarvis task matrix functions (Eisenhower view, Impact-Effort plane, local persistence, sorting, and manual task creation) remain fully active without impairment.
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70">
          <button
            type="button"
            onClick={onResetQuota}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-mono font-medium text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
            title="Reset counter for testing"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset Counter</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-mono font-bold transition-all cursor-pointer"
          >
            Close HUD
          </button>
        </div>
      </div>
    </div>
  );
};

interface AiQuotaBadgeProps {
  status: QuotaStatus;
  onClick: () => void;
}

/**
 * Compact Nav & Toolbar Telemetry Badge.
 */
export const AiQuotaBadge: React.FC<AiQuotaBadgeProps> = ({ status, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-mono text-[11px] font-bold border transition-all cursor-pointer shadow-xs active:scale-95 ${
        status.isExhausted
          ? 'bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 dark:hover:bg-amber-900/80 border-amber-400 text-amber-900 dark:text-amber-300 animate-pulse'
          : 'bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-950/40 dark:hover:bg-cyan-900/60 border-cyan-300 dark:border-cyan-800 text-cyan-800 dark:text-cyan-300'
      }`}
      title={
        status.isExhausted
          ? `Daily AI Quota Exhausted. Resets in ${status.resetsInFormatted} at ${status.resetsAtFormattedUtc}. Click to inspect.`
          : `Daily AI Quota: ${status.requestCount}/${status.dailyLimit} requests used. Click to inspect.`
      }
    >
      <Zap className={`w-3 h-3 ${status.isExhausted ? 'text-amber-600 dark:text-amber-400' : 'text-cyan-600 dark:text-cyan-400'}`} />
      <span className="hidden sm:inline">AI Quota:</span>
      <span>
        {status.isExhausted
          ? 'Exhausted'
          : `${status.requestCount}/${status.dailyLimit}`}
      </span>
    </button>
  );
};
