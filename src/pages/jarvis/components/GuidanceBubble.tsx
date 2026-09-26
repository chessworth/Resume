/**
 * @fileoverview Tiered Notification & Guidance System for Jarvis.
 * Supports bright Daylight Mode and Obsidian Dark Mode with high legibility.
 * @packageDocumentation
 */

import React, { useEffect, useState } from 'react';
import { Bot, Info, AlertTriangle, WifiOff, X, ArrowRight } from 'lucide-react';
import { GuidanceBubble as BubbleType } from '../types/task';

interface GuidanceBubbleProps {
  bubble: BubbleType;
  onDismiss: (id: string) => void;
}

/**
 * Top-level Critical Alert Banner.
 * Reserved exclusively for high-urgency operational notices (e.g. offline status).
 */
export const CriticalAlertBanner: React.FC<GuidanceBubbleProps> = ({
  bubble,
  onDismiss
}) => {
  return (
    <div
      role="alert"
      className="relative flex items-center justify-between gap-4 px-4 py-3 rounded-2xl border border-amber-400 dark:border-amber-500/30 bg-amber-50/90 dark:bg-gradient-to-r dark:from-amber-950/40 dark:via-zinc-900/90 dark:to-zinc-900/80 backdrop-blur-md shadow-md text-slate-800 dark:text-zinc-100 transition-all"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-700 dark:text-amber-400 shrink-0">
          {bubble.variant === 'offline' ? (
            <WifiOff className="w-4 h-4" />
          ) : (
            <AlertTriangle className="w-4 h-4" />
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
              PRIORITY DIRECTIVE:
            </span>
            <span className="text-xs font-semibold text-slate-900 dark:text-white font-sans">
              {bubble.title}
            </span>
          </div>
          <p className="text-xs text-slate-700 dark:text-zinc-300 font-sans mt-0.5 leading-relaxed">
            {bubble.message}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {bubble.actionLabel && bubble.onAction && (
          <button
            type="button"
            onClick={bubble.onAction}
            className="px-3 py-1.5 rounded-xl bg-amber-200/80 hover:bg-amber-200 dark:bg-amber-500/20 dark:hover:bg-amber-500/30 text-amber-900 dark:text-amber-300 font-mono text-xs border border-amber-300 dark:border-amber-500/40 transition-colors cursor-pointer"
          >
            {bubble.actionLabel}
          </button>
        )}
        <button
          type="button"
          onClick={() => onDismiss(bubble.id)}
          className="p-1 rounded-lg text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          aria-label="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

/**
 * Floating Transient Toast with Auto-Dismiss Countdown.
 */
export const TransientToast: React.FC<GuidanceBubbleProps> = ({
  bubble,
  onDismiss
}) => {
  const duration = bubble.autoDismissMs ?? 5000;
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);

      if (elapsed >= duration) {
        clearInterval(interval);
        onDismiss(bubble.id);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [bubble.id, duration, onDismiss]);

  const getIcon = () => {
    switch (bubble.variant) {
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'tip':
        return <Bot className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />;
      case 'info':
      default:
        return <Info className="w-4 h-4 text-sky-600 dark:text-sky-400" />;
    }
  };

  return (
    <div
      role="status"
      className="relative flex flex-col rounded-2xl border border-slate-300 dark:border-zinc-700/80 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl shadow-2xl p-4 text-slate-800 dark:text-zinc-100 max-w-sm w-full transition-all overflow-hidden"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-slate-100 dark:bg-cyan-500/10 border border-slate-200 dark:border-cyan-500/20 shrink-0">
          {getIcon()}
        </div>

        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[10px] font-mono font-bold uppercase text-cyan-600 dark:text-cyan-400 tracking-wider">
              NOTIFICATION
            </span>
            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {bubble.title}
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-zinc-300 font-sans leading-relaxed">
            {bubble.message}
          </p>

          {bubble.actionLabel && bubble.onAction && (
            <button
              type="button"
              onClick={bubble.onAction}
              className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cyan-50 dark:bg-cyan-500/15 hover:bg-cyan-100 dark:hover:bg-cyan-500/25 border border-cyan-200 dark:border-cyan-500/30 text-xs font-mono font-medium text-cyan-700 dark:text-cyan-300 transition-colors cursor-pointer"
            >
              <span>{bubble.actionLabel}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => onDismiss(bubble.id)}
          className="text-slate-400 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-zinc-300 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          aria-label="Dismiss toast"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-200 dark:bg-zinc-800">
        <div
          className="h-full bg-cyan-500 transition-all duration-75"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
