
import React from 'react';
import { DailyStats, UserGoals, DailyLog } from '../types';

interface DashboardProps {
  stats: DailyStats;
  goals: UserGoals;
  onDeleteLog: (id: string) => void;
  onEditLog: (log: DailyLog) => void;
}

/**
 * Reusable Progress Bar component with custom labels and goal tracking.
 * @param {object} props - Label, current value, goal value, color and unit.
 */
const ProgressBar: React.FC<{ label: string, current: number, goal: number, colorClass: string, unit: string }> = ({ label, current, goal, colorClass, unit }) => {
  const percentage = Math.min((current / goal) * 100, 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-end">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
        <span className="text-xs font-bold text-slate-600">
          <span className="text-slate-900">{Math.round(current)}</span> / {goal}{unit}
        </span>
      </div>
      <div className="nt-progress-bg">
        <div 
          className={`${colorClass} h-full transition-all duration-700 ease-out rounded-full`} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

/**
 * Main summary component displaying the daily nutrition overview.
 * @param {DashboardProps} props - Stats, Goals, Delete and Edit handlers.
 */
const Dashboard: React.FC<DashboardProps> = ({ stats, goals, onDeleteLog, onEditLog }) => {
  return (
    <div className="space-y-6 nt-fade-in">
      {/* Top Layout: Calories Ring + Macros Summary */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Calorie Ring Section */}
        <div className="md:col-span-4 nt-card p-8 flex flex-col items-center justify-center relative overflow-hidden">
          <span className="text-slate-500 text-[11px] font-black uppercase tracking-widest mb-4">Daily Calories</span>
          <div className="relative flex items-center justify-center w-40 h-40">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="80" cy="80" r="70" stroke="#f1f5f9" strokeWidth="12" fill="transparent" />
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="#10b981"
                strokeWidth="12"
                fill="transparent"
                strokeDasharray={440}
                strokeDashoffset={440 - (Math.min(stats.totalCalories / goals.calories, 1) * 440)}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-4xl font-black text-slate-900 leading-none">{Math.round(stats.totalCalories)}</span>
              <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Goal {goals.calories}</span>
            </div>
          </div>
        </div>

        {/* Macros Bars Section */}
        <div className="md:col-span-8 nt-card p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-slate-900 font-black text-xl tracking-tight">Daily Macronutrients</h3>
          </div>
          <div className="space-y-4">
            <ProgressBar label="Protein" current={stats.totalProtein} goal={goals.protein} colorClass="bg-emerald-500" unit="g" />
            <ProgressBar label="Carbohydrates" current={stats.totalCarbs} goal={goals.carbs} colorClass="bg-blue-500" unit="g" />
            <ProgressBar label="Fats" current={stats.totalFat} goal={goals.fat} colorClass="bg-amber-500" unit="g" />
            <ProgressBar label="Fiber" current={stats.totalFiber} goal={goals.fiber} colorClass="bg-teal-500" unit="g" />
          </div>
        </div>
      </div>

      {/* Micronutrients Overview */}
      <div className="nt-card p-8">
        <h3 className="text-slate-900 font-black text-xl mb-6 tracking-tight">Micronutrient Progress</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-8">
          <ProgressBar label="Vit C" current={stats.totalMicros.vitaminC} goal={goals.micros.vitaminC} colorClass="bg-orange-400" unit="mg" />
          <ProgressBar label="Iron" current={stats.totalMicros.iron} goal={goals.micros.iron} colorClass="bg-rose-400" unit="mg" />
          <ProgressBar label="Calcium" current={stats.totalMicros.calcium} goal={goals.micros.calcium} colorClass="bg-indigo-400" unit="mg" />
          <ProgressBar label="Potassium" current={stats.totalMicros.potassium} goal={goals.micros.potassium} colorClass="bg-cyan-400" unit="mg" />
          <ProgressBar label="Sodium" current={stats.totalMicros.sodium} goal={goals.micros.sodium} colorClass="bg-slate-400" unit="mg" />
        </div>
      </div>

      {/* History Log Section */}
      <div className="nt-card overflow-hidden">
        <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-black text-slate-900 uppercase text-sm tracking-widest">Today's Consumption</h3>
          <span className="nt-badge bg-white text-slate-500 shadow-sm">{stats.logs.length} items</span>
        </div>
        <div className="divide-y divide-slate-50">
          {stats.logs.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <p className="italic text-sm">Diary is empty. Start by logging some food below.</p>
            </div>
          ) : (
            stats.logs.map((log) => (
              <div key={log.id} className="px-8 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                <div className="flex gap-4 items-center">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-900 font-black text-lg">
                    {log.foodName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 leading-tight">{log.foodName}</h4>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tight">
                      {log.quantityGrams}g &bull; <span className="text-emerald-600">{Math.round(log.calculatedNutrients.calories)} kcal</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-4 text-[10px] font-black text-slate-400 mr-4">
                    <div className="flex flex-col items-center"><span className="text-emerald-600">{Math.round(log.calculatedNutrients.protein)}g</span><span>PRO</span></div>
                    <div className="flex flex-col items-center"><span className="text-blue-600">{Math.round(log.calculatedNutrients.carbs)}g</span><span>CARB</span></div>
                    <div className="flex flex-col items-center"><span className="text-amber-600">{Math.round(log.calculatedNutrients.fat)}g</span><span>FAT</span></div>
                  </div>
                  <button 
                    onClick={() => onEditLog(log)}
                    className="p-3 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                    title="Edit record"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </button>
                  <button 
                    onClick={() => onDeleteLog(log.id)}
                    className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    title="Remove item"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
