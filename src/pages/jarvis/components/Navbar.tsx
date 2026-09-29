/**
 * @fileoverview Main navigation and status telemetry bar for the Jarvis interface.
 * Exposes account status, Supabase cloud sync status, dark/light theme toggle,
 * Command Palette (Cmd+K) trigger, Command Spotlight Deep Work trigger, and
 * a responsive mobile navigation drawer that prevents horizontal overflow on phone viewports.
 * @packageDocumentation
 */

import React, { useState } from 'react';
import {
  Cpu,
  Plus,
  Moon,
  Sun,
  LogOut,
  HardDrive,
  Cloud,
  Wifi,
  WifiOff,
  Terminal,
  Target,
  Command,
  Layers,
  Sparkles,
  Menu,
  X,
  Zap
} from 'lucide-react';
import { UserSession } from '../types/task';
import { isSupabaseConfigured } from '../services/supabaseClient';
import { QuotaStatus } from '../services/aiQuotaService';
import { AiQuotaBadge } from './AiQuotaAlert';

interface NavbarProps {
  session: UserSession | null;
  onOpenAuth: () => void;
  onOpenNewTask: () => void;
  onOpenCommandPalette: () => void;
  onOpenSpotlight: () => void;
  onOpenBinSorting?: () => void;
  onOpenAiPrompt?: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  isOnline: boolean;
  onLogout: () => void;
  quotaStatus?: QuotaStatus;
  onOpenQuotaHud?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  session,
  onOpenAuth,
  onOpenNewTask,
  onOpenCommandPalette,
  onOpenSpotlight,
  onOpenBinSorting,
  onOpenAiPrompt,
  isDark,
  onToggleTheme,
  isOnline,
  onLogout,
  quotaStatus,
  onOpenQuotaHud
}) => {
  const isCloudAuthReady = isSupabaseConfigured();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full max-w-full border-b border-slate-200/90 dark:border-slate-800/90 bg-white/85 dark:bg-slate-950/80 backdrop-blur-xl shadow-xs transition-colors overflow-x-clip">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-3">
        {/* Brand & Telemetry (Responsive: compact on mobile) */}
        <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
          <div className="relative p-2 sm:p-2.5 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/15 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 shadow-md shadow-cyan-950/5 shrink-0">
            <Cpu className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
            <span className="absolute -top-0.5 -right-0.5 flex h-2 sm:h-2.5 w-2 sm:w-2.5">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isOnline ? 'bg-cyan-400' : 'bg-amber-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 sm:h-2.5 w-2 sm:w-2.5 ${
                  isOnline ? 'bg-cyan-500' : 'bg-amber-500'
                }`}
              />
            </span>
          </div>

          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-sm sm:text-base font-extrabold font-mono tracking-wider text-slate-950 dark:text-white">
                JARVIS
              </h1>
              <span className="text-[9px] sm:text-[10px] font-mono px-1.5 sm:px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-800 dark:text-cyan-300 border border-cyan-500/20 font-bold hidden sm:inline-block">
                TASK MATRIX
              </span>
            </div>
            <div className="hidden md:flex items-center gap-2 text-[11px] font-mono text-slate-600 dark:text-slate-400 font-medium">
              <span className="flex items-center gap-1">
                {isOnline ? (
                  <>
                    <Wifi className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold">ONLINE</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    <span className="text-amber-700 dark:text-amber-400 font-bold">OFFLINE RESILIENT</span>
                  </>
                )}
              </span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span>
                {isCloudAuthReady ? 'SUPABASE CLOUD READY' : 'LOCAL CACHE READY'}
              </span>
            </div>
          </div>
        </div>

        {/* Desktop Controls (Rendered on md screens and above, 768px+) */}
        <div className="hidden md:flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Global Command Palette Trigger */}
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700/80 bg-slate-100/90 dark:bg-slate-900/90 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono font-bold transition-all cursor-pointer shadow-xs active:scale-95"
            title="Open Command Palette (Cmd+K / Ctrl+K)"
          >
            <Terminal className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span className="hidden md:inline">Command</span>
            <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md border border-slate-300 dark:border-slate-700">
              <Command className="w-2.5 h-2.5" />K
            </kbd>
          </button>

          {/* Mission Bins Workstation Trigger */}
          {onOpenBinSorting && (
            <button
              type="button"
              onClick={onOpenBinSorting}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-indigo-300 dark:border-indigo-800/80 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-mono font-extrabold uppercase tracking-wider transition-all cursor-pointer shadow-xs active:scale-95"
              title="Open Mission Bin Sorting Workstation"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden sm:inline">Mission Bins</span>
            </button>
          )}

          {/* Gemini AI Assistant Trigger & Quota Badge */}
          {onOpenAiPrompt && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onOpenAiPrompt}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-cyan-400 dark:border-cyan-700/80 bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 hover:from-cyan-500/20 hover:to-indigo-500/20 text-cyan-800 dark:text-cyan-300 text-xs font-mono font-extrabold uppercase tracking-wider transition-all cursor-pointer shadow-xs active:scale-95"
                title="Engage Gemini 3.8 Flash AI Assistant (ai create, ai guide, ai plan, ai audit)"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 animate-pulse" />
                <span className="hidden sm:inline">Jarvis AI</span>
              </button>

              {quotaStatus && onOpenQuotaHud && (
                <div className="hidden lg:block">
                  <AiQuotaBadge status={quotaStatus} onClick={onOpenQuotaHud} />
                </div>
              )}
            </div>
          )}

          {/* Command Spotlight & Pomodoro Focus Mode Trigger */}
          <button
            type="button"
            onClick={onOpenSpotlight}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-cyan-300 dark:border-cyan-800/80 bg-cyan-50 dark:bg-cyan-950/40 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300 text-xs font-mono font-extrabold uppercase tracking-wider transition-all cursor-pointer shadow-xs active:scale-95"
            title="Launch Command Spotlight & Deep Work Chronometer"
          >
            <Target className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 animate-pulse" />
            <span className="hidden sm:inline">Focus Mode</span>
          </button>

          {/* New Task Trigger Button */}
          <button
            type="button"
            onClick={onOpenNewTask}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-cyan-600/25 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span className="hidden sm:inline">Add Task</span>
          </button>

          {/* Theme Mode Toggle */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="p-2 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/90 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer"
            aria-label="Toggle visual theme"
            title={isDark ? 'Switch to Daylight Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-800" />}
          </button>

          {/* User Session Profile Button */}
          {session ? (
            <div className="flex items-center gap-2">
              {session.isGuest ? (
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-amber-400 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-900 dark:text-amber-300 transition-all cursor-pointer group"
                  title="Guest mode active. Click to save data to a permanent account."
                >
                  <HardDrive className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <div className="text-left hidden md:block">
                    <div className="text-[11px] font-mono font-bold leading-tight">
                      GUEST SANDBOX
                    </div>
                    <div className="text-[9px] text-amber-800 dark:text-amber-400/90 font-medium group-hover:underline">
                      Click to secure
                    </div>
                  </div>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="hidden lg:flex flex-col text-right">
                    <span className="text-xs font-mono text-slate-950 dark:text-white font-bold truncate max-w-[120px]">
                      {session.name}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-end gap-1">
                      {isCloudAuthReady ? <Cloud className="w-2.5 h-2.5" /> : <HardDrive className="w-2.5 h-2.5" />}
                      {isCloudAuthReady ? 'CLOUD SYNCED' : 'LOCAL SECURED'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={onLogout}
                    className="p-2 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-mono font-bold transition-colors cursor-pointer"
            >
              Sign In
            </button>
          )}
        </div>

        {/* Mobile Action Controls (Active on all screens up to 768px, guaranteeing safety for <= 600px) */}
        <div className="flex md:hidden items-center gap-1.5 shrink-0">
          {/* Primary Quick Add Button */}
          <button
            type="button"
            onClick={onOpenNewTask}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-mono font-bold text-xs shadow-md shadow-cyan-600/25 active:scale-95 cursor-pointer"
            title="Add Task"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span className="text-[11px]">Add</span>
          </button>

          {/* Quick AI & Command Palette Trigger */}
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="p-2 rounded-xl border border-cyan-400 dark:border-cyan-700 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 active:scale-95 cursor-pointer"
            title="Open Command Palette & AI"
            aria-label="Open Command Palette"
          >
            <Terminal className="w-4 h-4" />
          </button>

          {/* Theme Mode Toggle on Mobile */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="p-2 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 active:scale-95 cursor-pointer"
            aria-label="Toggle visual theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-800" />}
          </button>

          {/* Mobile Menu Drawer Toggle (Hamburger / Close) */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className={`p-2 rounded-xl border transition-all active:scale-95 cursor-pointer ${
              isMobileMenuOpen
                ? 'bg-cyan-600 text-white border-cyan-500 shadow-xs'
                : 'border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300'
            }`}
            title="More Options"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expandable Mobile Navigation Drawer (Revealed below top bar on screens < 768px) */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200/90 dark:border-slate-800/90 bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl px-4 py-3.5 space-y-3 shadow-xl animate-fadeIn">
          {/* Quick Action Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            {/* Focus Mode Chronometer */}
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenSpotlight();
              }}
              className="flex items-center gap-2 p-2.5 rounded-xl border border-cyan-300 dark:border-cyan-800 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 font-bold active:scale-95 cursor-pointer"
            >
              <Target className="w-4 h-4 text-cyan-600 dark:text-cyan-400 animate-pulse" />
              <span>Focus Mode</span>
            </button>

            {/* Mission Bins Workstation */}
            {onOpenBinSorting && (
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenBinSorting();
                }}
                className="flex items-center gap-2 p-2.5 rounded-xl border border-indigo-300 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold active:scale-95 cursor-pointer"
              >
                <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Mission Bins</span>
              </button>
            )}

            {/* Jarvis AI Direct Trigger */}
            {onOpenAiPrompt && (
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenAiPrompt();
                }}
                className="flex items-center gap-2 p-2.5 rounded-xl border border-cyan-400 dark:border-cyan-700 bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 text-cyan-800 dark:text-cyan-300 font-bold active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-cyan-600 dark:text-cyan-400 animate-pulse" />
                <span>Jarvis AI</span>
              </button>
            )}

            {/* AI Quota HUD Telemetry */}
            {quotaStatus && onOpenQuotaHud && (
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenQuotaHud();
                }}
                className="flex items-center gap-2 p-2.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-bold active:scale-95 cursor-pointer"
              >
                <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Quota: {quotaStatus.requestCount}/{quotaStatus.dailyLimit}</span>
              </button>
            )}
          </div>

          {/* Account Profile & Sync Telemetry on Mobile */}
          <div className="pt-2.5 border-t border-slate-200 dark:border-slate-800">
            {session ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <div className="text-left">
                    <div className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                      {session.isGuest ? 'GUEST SANDBOX' : session.name}
                    </div>
                    <div className="text-[10px] font-mono text-slate-500">
                      {isCloudAuthReady ? 'Cloud Synced' : 'Local Sandbox Mode'}
                    </div>
                  </div>
                </div>

                {session.isGuest ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenAuth();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/40 dark:hover:bg-amber-800/60 text-amber-900 dark:text-amber-300 font-mono text-xs font-bold transition-colors cursor-pointer"
                  >
                    Save & Sync
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onLogout();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 font-mono text-xs font-bold transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenAuth();
                }}
                className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-mono text-xs font-bold cursor-pointer"
              >
                Sign In / Register
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
