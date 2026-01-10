
import React, { useState, useEffect, useCallback } from 'react';
import { FoodItem, DailyLog, DailyStats, UserGoals, Micronutrients } from './types';
import { storageService } from './services/storageService';
import Dashboard from './components/Dashboard';
import FoodSearch from './components/FoodSearch';
import GoalSettings from './components/GoalSettings';
import ManualFoodEntry from './components/ManualFoodEntry';
import LogEditModal from './components/LogEditModal';

/**
 * NUTRITION TRACKER COMPONENT
 * 
 * NOTE ON EXPORT CHANGE: This component was previously named 'App' and exported as default.
 * It is now 'NutritionTracker' exported as a named member.
 * 
 * POTENTIAL ISSUES:
 * 1. Breaking changes in index.tsx or other importing modules.
 * 2. Departure from standard React 'App.tsx' default export convention.
 * 3. Requires consumers to use curly braces { NutritionTracker } for imports.
 */
export const NutritionTracker: React.FC = () => {
  /**
   * PLACEHOLDER: User Authentication State
   * In production, integrate with Supabase Auth:
   * const [user, setUser] = useState(null);
   * useEffect(() => { supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null)) }, []);
   */

  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [quantity, setQuantity] = useState<number>(100);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<DailyLog | null>(null);
  
  const [foodLibrary, setFoodLibrary] = useState<FoodItem[]>([]);
  const [userGoals, setUserGoals] = useState<UserGoals>(storageService.getGoals());
  const [todayStats, setTodayStats] = useState<DailyStats>({
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
    totalFiber: 0,
    totalMicros: { vitaminC: 0, iron: 0, calcium: 0, potassium: 0, sodium: 0 },
    logs: []
  });

  const todayStr = new Date().toISOString().split('T')[0];

  /**
   * Recalculates total nutritional intake based on today's logs.
   * Aggregates both macros and micronutrients into current state.
   */
  const refreshStats = useCallback(() => {
    const foods = storageService.getFoods();
    setFoodLibrary(foods); // Update reactive food library state

    const logs = storageService.getLogs(todayStr);
    const initialMicros: Micronutrients = { vitaminC: 0, iron: 0, calcium: 0, potassium: 0, sodium: 0 };
    
    const totals = logs.reduce((acc, log) => {
      const food = foods.find(f => f.id === log.foodId);
      const ratio = log.quantityGrams / 100;

      const entryMicros = log.calculatedMicros || {
        vitaminC: (food?.micros.vitaminC || 0) * ratio,
        iron: (food?.micros.iron || 0) * ratio,
        calcium: (food?.micros.calcium || 0) * ratio,
        potassium: (food?.micros.potassium || 0) * ratio,
        sodium: (food?.micros.sodium || 0) * ratio,
      };

      return {
        totalCalories: acc.totalCalories + log.calculatedNutrients.calories,
        totalProtein: acc.totalProtein + log.calculatedNutrients.protein,
        totalCarbs: acc.totalCarbs + log.calculatedNutrients.carbs,
        totalFat: acc.totalFat + log.calculatedNutrients.fat,
        totalFiber: acc.totalFiber + (log.calculatedNutrients.fiber || 0),
        totalMicros: {
          vitaminC: acc.totalMicros.vitaminC + entryMicros.vitaminC,
          iron: acc.totalMicros.iron + entryMicros.iron,
          calcium: acc.totalMicros.calcium + entryMicros.calcium,
          potassium: acc.totalMicros.potassium + entryMicros.potassium,
          sodium: acc.totalMicros.sodium + entryMicros.sodium,
        }
      };
    }, { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0, totalFiber: 0, totalMicros: initialMicros });

    setTodayStats({ ...totals, logs });
  }, [todayStr]);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  /**
   * Confirms food selection and saves the intake record.
   */
  const handleAddLog = () => {
    if (!selectedFood) return;

    const ratio = quantity / 100;
    const log: DailyLog = {
      id: crypto.randomUUID(),
      foodId: selectedFood.id,
      foodName: selectedFood.name,
      date: todayStr,
      quantityGrams: quantity,
      calculatedNutrients: {
        calories: selectedFood.macros.calories * ratio,
        protein: selectedFood.macros.protein * ratio,
        carbs: selectedFood.macros.carbs * ratio,
        fat: selectedFood.macros.fat * ratio,
        fiber: selectedFood.macros.fiber * ratio,
      },
      calculatedMicros: {
        vitaminC: selectedFood.micros.vitaminC * ratio,
        iron: selectedFood.micros.iron * ratio,
        calcium: selectedFood.micros.calcium * ratio,
        potassium: selectedFood.micros.potassium * ratio,
        sodium: selectedFood.micros.sodium * ratio,
      }
    };

    storageService.addLog(log);
    setSelectedFood(null);
    setQuantity(100);
    refreshStats();
  };

  /**
   * Persists a manually created food item.
   * @param {FoodItem} food - The new food definition.
   */
  const handleSaveManualFood = (food: FoodItem) => {
    storageService.saveFood(food);
    refreshStats();
    setIsManualEntryOpen(false);
    setSelectedFood(food);
  };

  /**
   * Updates an existing consumption record.
   * @param {DailyLog} log - The modified log entry.
   */
  const handleUpdateLog = (log: DailyLog) => {
    storageService.updateLog(log);
    setEditingLog(null);
    refreshStats();
  };

  /**
   * Handles log deletion.
   */
  const handleDeleteLog = (id: string) => {
    storageService.deleteLog(id);
    refreshStats();
  };

  /**
   * Updates user goals.
   */
  const handleUpdateGoals = (newGoals: UserGoals) => {
    storageService.saveGoals(newGoals);
    setUserGoals(newGoals);
  };

  return (
    <div className="min-h-screen pb-32">
      <header className="bg-white/90 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Nutri<span className="text-emerald-600">Track</span></h1>
          </div>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-3 bg-slate-50 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 rounded-2xl transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10 space-y-12">
        <Dashboard stats={todayStats} goals={userGoals} onDeleteLog={handleDeleteLog} onEditLog={setEditingLog} />
        
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Add Food</h2>
            <span className="nt-badge bg-emerald-100 text-emerald-700">AI Enabled</span>
          </div>
          <FoodSearch 
            availableFoods={foodLibrary}
            onSelectFood={setSelectedFood} 
            onRefreshFoods={refreshStats}
            onOpenManualEntry={() => setIsManualEntryOpen(true)}
          />
        </div>
      </main>

      {isSettingsOpen && (
        <GoalSettings currentGoals={userGoals} onSave={handleUpdateGoals} onClose={() => setIsSettingsOpen(false)} />
      )}
      {isManualEntryOpen && (
        <ManualFoodEntry onSave={handleSaveManualFood} onClose={() => setIsManualEntryOpen(false)} />
      )}
      {editingLog && (
        <LogEditModal log={editingLog} onSave={handleUpdateLog} onClose={() => setEditingLog(null)} />
      )}

      {selectedFood && (
        <div className="nt-modal-overlay">
          <div className="nt-modal-content nt-fade-in sm:max-w-md">
            <div className="flex justify-between items-start mb-10">
              <div>
                <span className="nt-badge bg-emerald-50 text-emerald-600 mb-2 inline-block">{selectedFood.category}</span>
                <h3 className="text-3xl font-black text-slate-900 leading-tight">{selectedFood.name}</h3>
              </div>
              <button onClick={() => setSelectedFood(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="grid grid-cols-5 gap-2 mb-10">
              <div className="bg-slate-50 p-3 rounded-2xl text-center border border-slate-100">
                <span className="block text-[8px] text-slate-400 font-black mb-1 uppercase tracking-widest">PRO</span>
                <span className="text-base font-black text-emerald-600">{Math.round(selectedFood.macros.protein * (quantity/100))}g</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl text-center border border-slate-100">
                <span className="block text-[8px] text-slate-400 font-black mb-1 uppercase tracking-widest">CARB</span>
                <span className="text-base font-black text-blue-600">{Math.round(selectedFood.macros.carbs * (quantity/100))}g</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl text-center border border-slate-100">
                <span className="block text-[8px] text-slate-400 font-black mb-1 uppercase tracking-widest">FAT</span>
                <span className="text-base font-black text-amber-600">{Math.round(selectedFood.macros.fat * (quantity/100))}g</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl text-center border border-slate-100">
                <span className="block text-[8px] text-slate-400 font-black mb-1 uppercase tracking-widest">FIB</span>
                <span className="text-base font-black text-teal-600">{Math.round(selectedFood.macros.fiber * (quantity/100))}g</span>
              </div>
              <div className="bg-slate-900 p-3 rounded-2xl text-center shadow-xl">
                <span className="block text-[8px] text-slate-500 font-black mb-1 uppercase tracking-widest">KCAL</span>
                <span className="text-base font-black text-white">{Math.round(selectedFood.macros.calories * (quantity/100))}</span>
              </div>
            </div>

            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <label className="text-sm font-black text-slate-900 uppercase tracking-widest">Portion Weight</label>
                <div className="relative">
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="nt-input w-28 text-right pr-8 !bg-white !border-emerald-200 !text-xl !font-black !text-emerald-600"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400 font-black text-xs">g</span>
                </div>
              </div>
              <input type="range" min="1" max="1000" step="1" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="w-full h-4 bg-slate-100 rounded-full appearance-none cursor-pointer accent-emerald-600" />
              <div className="grid grid-cols-4 gap-2">
                {[50, 100, 250, 500].map(v => (
                  <button key={v} onClick={() => setQuantity(v)} className={`py-3 text-xs font-black rounded-xl border transition-all ${quantity === v ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-500 hover:border-emerald-300'}`}>
                    {v}g
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleAddLog} className="nt-btn-emerald w-full mt-12">Confirm Entry</button>
          </div>
        </div>
      )}

      <nav className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-2xl px-12 py-5 rounded-[2.5rem] shadow-2xl border border-white/10 flex gap-16 z-[60]">
        <button className="text-emerald-400 group relative transition-transform hover:scale-110">
           <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>
           <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
        </button>
        <button onClick={() => setIsSettingsOpen(true)} className="text-slate-500 hover:text-emerald-400 transition-all hover:scale-110">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </button>
        <button className="text-slate-500 hover:text-emerald-400 transition-all hover:scale-110">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
        </button>
      </nav>
    </div>
  );
};
