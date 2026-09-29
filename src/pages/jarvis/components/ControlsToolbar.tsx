/**
 * @fileoverview Filter, search, and algorithmic view selector toolbar.
 * Supports Strategic, Deadline, 2x2 Eisenhower Matrix, and 2x2 Impact-Effort Matrix views.
 * Features a single unified active color system and high-contrast, readable typography.
 * @packageDocumentation
 */

import React from 'react';
import {
  Search,
  Filter,
  LayoutGrid,
  ListOrdered,
  Clock,
  CheckCircle,
  X,
  Target
} from 'lucide-react';
import { SortingViewMode } from '../types/task';
import { DEFAULT_TASK_CATEGORIES } from '../constants/definitions';

interface ControlsToolbarProps {
  viewMode: SortingViewMode;
  onViewModeChange: (mode: SortingViewMode) => void;
  selectedCategory: string | 'ALL';
  onCategoryChange: (cat: string | 'ALL') => void;
  availableCategories: string[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  showCompleted: boolean;
  onToggleShowCompleted: () => void;
  totalCount: number;
  criticalCount: number;
  completedCount: number;
}

export const ControlsToolbar: React.FC<ControlsToolbarProps> = ({
  viewMode,
  onViewModeChange,
  selectedCategory,
  onCategoryChange,
  availableCategories,
  searchQuery,
  onSearchChange,
  showCompleted,
  onToggleShowCompleted,
  totalCount,
  criticalCount,
  completedCount
}) => {
  const allCategories = Array.from(
    new Set([...DEFAULT_TASK_CATEGORIES, ...availableCategories])
  );

  // Unified active view button styling across all 4 views (Rule / Req 2)
  const getButtonClass = (mode: SortingViewMode) => {
    const isActive = viewMode === mode;
    return `flex items-center justify-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl transition-all duration-200 cursor-pointer font-mono text-[11px] sm:text-xs w-full sm:w-auto text-center ${
      isActive
        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold shadow-md shadow-cyan-600/25 scale-[1.02]'
        : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 font-medium'
    }`;
  };

  return (
    <div className="space-y-4 w-full max-w-full overflow-hidden">
      {/* Top Row: View Mode Selectors + Vibrant Telemetry Cards */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3.5 bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl p-3 sm:p-3.5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm transition-all">
        {/* View Perspective Selector (Unified Colors, 2-column grid on mobile <= 600px) */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center p-1.5 bg-slate-100/90 dark:bg-slate-950/70 rounded-2xl border border-slate-200 dark:border-slate-800 gap-1.5 shadow-inner w-full xl:w-auto">
          <button
            type="button"
            onClick={() => onViewModeChange('STRATEGIC')}
            className={getButtonClass('STRATEGIC')}
          >
            <ListOrdered className="w-3.5 h-3.5 shrink-0" />
            <span>STRATEGIC</span>
          </button>

          <button
            type="button"
            onClick={() => onViewModeChange('DEADLINE')}
            className={getButtonClass('DEADLINE')}
          >
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>DEADLINE</span>
          </button>

          <button
            type="button"
            onClick={() => onViewModeChange('MATRIX')}
            className={getButtonClass('MATRIX')}
          >
            <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
            <span>EISENHOWER 2X2</span>
          </button>

          <button
            type="button"
            onClick={() => onViewModeChange('IMPACT_EFFORT')}
            className={getButtonClass('IMPACT_EFFORT')}
          >
            <Target className="w-3.5 h-3.5 shrink-0" />
            <span>IMPACT-EFFORT 2X2</span>
          </button>
        </div>

        {/* High-Contrast Telemetry Counters */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs font-mono w-full xl:w-auto">
          <div className="flex-1 sm:flex-initial justify-center px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 flex items-center gap-2 shadow-xs transition-transform hover:scale-105">
            <span className="text-slate-600 dark:text-slate-400 font-semibold text-[10px] sm:text-xs">TOTAL:</span>
            <strong className="text-slate-950 dark:text-white font-extrabold">{totalCount}</strong>
          </div>
          <div className="flex-1 sm:flex-initial justify-center px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-500/40 text-rose-800 dark:text-rose-200 flex items-center gap-2 shadow-xs transition-transform hover:scale-105">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
            <span className="font-semibold text-[10px] sm:text-xs">CRITICAL:</span>
            <strong className="text-rose-900 dark:text-rose-100 font-extrabold">{criticalCount}</strong>
          </div>
          <div className="flex-1 sm:flex-initial justify-center px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-200 flex items-center gap-2 shadow-xs transition-transform hover:scale-105">
            <span className="font-semibold text-[10px] sm:text-xs">RESOLVED:</span>
            <strong className="text-emerald-950 dark:text-emerald-100 font-extrabold">{completedCount}</strong>
          </div>
        </div>
      </div>

      {/* Second Row: Search, Category Filters, and Completed Toggle */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Animated Search Input */}
        <div className="relative flex-1 max-w-md group">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500 group-focus-within:text-cyan-600 dark:group-focus-within:text-cyan-400 transition-colors" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tasks by title, category, or notes..."
            className="w-full pl-10 pr-9 py-2.5 bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 font-sans shadow-xs transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-3 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Toggle Completed */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleShowCompleted}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-mono border transition-all duration-200 cursor-pointer ${
              showCompleted
                ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold shadow-xs'
                : 'bg-white dark:bg-slate-900/60 border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <CheckCircle className={`w-4 h-4 transition-colors ${showCompleted ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-600'}`} />
            <span>{showCompleted ? 'SHOWING COMPLETED' : 'HIDE COMPLETED'}</span>
          </button>
        </div>
      </div>

      {/* Third Row: Category Filter Badges */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1.5 scrollbar-none w-full max-w-full">
        <span className="text-xs font-mono text-slate-800 dark:text-slate-200 flex items-center gap-1.5 pr-1 shrink-0 font-bold">
          <Filter className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" /> CATEGORIES:
        </span>
        <button
          type="button"
          onClick={() => onCategoryChange('ALL')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-mono border whitespace-nowrap transition-all duration-200 cursor-pointer ${
            selectedCategory === 'ALL'
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold border-cyan-500 shadow-sm scale-105'
              : 'bg-white dark:bg-slate-900/80 border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-300 hover:text-cyan-700 hover:border-cyan-400 dark:hover:text-cyan-300 font-medium'
          }`}
        >
          ALL ({totalCount})
        </button>

        {allCategories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => onCategoryChange(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono border whitespace-nowrap transition-all duration-200 cursor-pointer ${
              selectedCategory === cat
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold border-cyan-500 shadow-sm scale-105'
                : 'bg-white dark:bg-slate-900/80 border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-300 hover:text-cyan-700 hover:border-cyan-400 dark:hover:text-cyan-300 font-medium'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
};
