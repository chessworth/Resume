
import React, { useState, useEffect, useCallback } from 'react';
import { FoodItem, DailyLog, DailyStats, UserGoals, Micronutrients } from './types';
import { storageService } from './services/storageService';
import Dashboard from './components/Dashboard';
import FoodSearch from './components/FoodSearch';
import GoalSettings from './components/GoalSettings';
import ManualFoodEntry from './components/ManualFoodEntry';
import LogEditModal from './components/LogEditModal';

export const NutritionTracker: React.FC = () => {
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [quantity, setQuantity] = useState<number>(100);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<DailyLog | null>(null);
  
  const [userGoals, setUserGoals] = useState<UserGoals>(storageService.getGoals());
  const [foodLibrary, setFoodLibrary] = useState<FoodItem[]>([]);
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

  const refreshStats = useCallback(() => {
    const foods = storageService.getFoods();
    setFoodLibrary(foods);

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

  const handleSaveManualFood = (food: FoodItem) => {
    storageService.saveFood(food);
    refreshStats();
    setIsManualEntryOpen(false);
    setSelectedFood(food);
  };

  const handleUpdateLog = (log: DailyLog) => {
    storageService.updateLog(log);
    setEditingLog(null);
    refreshStats();
  };

  const handleDeleteLog = (id: string) => {
    storageService.deleteLog(id);
    refreshStats();
  };

  const handleUpdateGoals = (newGoals: UserGoals) => {
    storageService.saveGoals(newGoals);
    setUserGoals(newGoals);
  };

  return (
    <div className="nt-app">
      <header className="nt-header">
        <div className="nt-container nt-header-content">
          <div className="nt-logo">
            <div className="nt-logo-icon">
               <svg style={{width: '24px', height: '24px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <h1>Nutri<span className="highlight">Track</span></h1>
          </div>
          <button onClick={() => setIsSettingsOpen(true)} className="nt-btn-icon">
            <svg style={{width: '24px', height: '24px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
          </button>
        </div>
      </header>

      <main className="nt-container" style={{marginTop: '2.5rem'}}>
        <Dashboard stats={todayStats} goals={userGoals} onDeleteLog={handleDeleteLog} onEditLog={setEditingLog} />
        
        <div style={{marginTop: '3rem'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
            <h2 style={{fontSize: '1.5rem', fontWeight: 900}}>Add Food</h2>
            <span className="nt-badge nt-badge-emerald">AI Optimized</span>
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
          <div className="nt-modal-content nt-fade-in">
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '2.5rem'}}>
              <div>
                <span className="nt-badge nt-badge-emerald" style={{marginBottom: '0.5rem'}}>{selectedFood.category}</span>
                <h3 style={{fontSize: '2rem', fontWeight: 900}}>{selectedFood.name}</h3>
              </div>
              <button onClick={() => setSelectedFood(null)} className="nt-btn-icon">
                <svg style={{width: '28px', height: '28px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div style={{display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', marginBottom: '2.5rem'}}>
              {[
                {label: 'PRO', val: Math.round(selectedFood.macros.protein * (quantity/100)) + 'g', color: 'var(--primary)'},
                {label: 'CARB', val: Math.round(selectedFood.macros.carbs * (quantity/100)) + 'g', color: 'var(--secondary)'},
                {label: 'FAT', val: Math.round(selectedFood.macros.fat * (quantity/100)) + 'g', color: 'var(--accent)'},
                {label: 'FIB', val: Math.round(selectedFood.macros.fiber * (quantity/100)) + 'g', color: '#0d9488'},
                {label: 'KCAL', val: Math.round(selectedFood.macros.calories * (quantity/100)), color: 'var(--slate-900)', highlight: true},
              ].map(macro => (
                <div key={macro.label} style={{
                  background: macro.highlight ? macro.color : 'var(--slate-50)', 
                  padding: '0.75rem', 
                  borderRadius: '1rem', 
                  textAlign: 'center',
                  color: macro.highlight ? 'white' : 'inherit',
                  boxShadow: macro.highlight ? '0 10px 15px -3px rgba(0,0,0,0.1)' : 'none'
                }}>
                  <span style={{display: 'block', fontSize: '8px', fontWeight: 900, marginBottom: '2px'}}>{macro.label}</span>
                  <span style={{fontSize: '1rem', fontWeight: 900, color: macro.highlight ? 'white' : macro.color}}>{macro.val}</span>
                </div>
              ))}
            </div>

            <div style={{marginBottom: '2.5rem'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
                <label className="nt-label">Portion Size</label>
                <div style={{position: 'relative'}}>
                   <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="nt-input"
                    style={{width: '100px', textAlign: 'right', paddingRight: '2rem', fontSize: '1.25rem', fontWeight: 900, borderColor: 'var(--primary)'}}
                  />
                  <span style={{position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 900, fontSize: '0.75rem', color: 'var(--primary)'}}>g</span>
                </div>
              </div>
              <input type="range" min="1" max="1000" step="1" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} style={{width: '100%', accentColor: 'var(--primary)'}} />
            </div>

            <button onClick={handleAddLog} className="nt-btn nt-btn-primary" style={{width: '100%'}}>Log Activity</button>
          </div>
        </div>
      )}

      <nav className="nt-bottom-nav">
        <button className="nt-nav-btn active">
           <svg style={{width: '32px', height: '32px'}} fill="currentColor" viewBox="0 0 24 24"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>
        </button>
        <button onClick={() => setIsSettingsOpen(true)} className="nt-nav-btn">
          <svg style={{width: '32px', height: '32px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
        </button>
        <button className="nt-nav-btn">
          <svg style={{width: '32px', height: '32px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
        </button>
      </nav>
    </div>
  );
};