
import React, { useState } from 'react';
import { UserGoals } from '../types';

interface GoalSettingsProps {
  currentGoals: UserGoals;
  onSave: (goals: UserGoals) => void;
  onClose: () => void;
}

/**
 * Settings modal for updating daily nutritional targets.
 * @param {GoalSettingsProps} props - Current goal data and lifecycle handlers.
 */
const GoalSettings: React.FC<GoalSettingsProps> = ({ currentGoals, onSave, onClose }) => {
  const [goals, setGoals] = useState<UserGoals>(currentGoals);

  /**
   * Generic handler for macro field updates.
   */
  const handleMacroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setGoals(prev => ({ ...prev, [name]: Number(value) }));
  };

  /**
   * Generic handler for micro field updates.
   */
  const handleMicroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setGoals(prev => ({
      ...prev,
      micros: { ...prev.micros, [name]: Number(value) }
    }));
  };

  /**
   * Validates and submits the goal updates.
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(goals);
    onClose();
  };

  return (
    <div className="nt-modal-overlay">
      <div className="nt-modal-content nt-fade-in">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Set Daily Targets</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Macronutrient Section */}
          <div className="space-y-6">
            <h3 className="nt-badge bg-emerald-50 text-emerald-700">Macros & Calories</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Daily Calories (kcal)</label>
                <input type="number" name="calories" value={goals.calories} onChange={handleMacroChange} className="nt-input" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Protein (g)</label>
                <input type="number" name="protein" value={goals.protein} onChange={handleMacroChange} className="nt-input" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Carbs (g)</label>
                <input type="number" name="carbs" value={goals.carbs} onChange={handleMacroChange} className="nt-input" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fat (g)</label>
                <input type="number" name="fat" value={goals.fat} onChange={handleMacroChange} className="nt-input" />
              </div>
              <div className="space-y-1.5 col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Daily Fiber Goal (g)</label>
                <input type="number" name="fiber" value={goals.fiber} onChange={handleMacroChange} className="nt-input" />
              </div>
            </div>
          </div>

          {/* Micronutrient Section */}
          <div className="space-y-6">
            <h3 className="nt-badge bg-blue-50 text-blue-700">Micronutrient Targets</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Vitamin C (mg)</label>
                <input type="number" name="vitaminC" value={goals.micros.vitaminC} onChange={handleMicroChange} className="nt-input" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Iron (mg)</label>
                <input type="number" name="iron" value={goals.micros.iron} onChange={handleMicroChange} className="nt-input" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Calcium (mg)</label>
                <input type="number" name="calcium" value={goals.micros.calcium} onChange={handleMicroChange} className="nt-input" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Potassium (mg)</label>
                <input type="number" name="potassium" value={goals.micros.potassium} onChange={handleMicroChange} className="nt-input" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sodium (mg)</label>
                <input type="number" name="sodium" value={goals.micros.sodium} onChange={handleMicroChange} className="nt-input" />
              </div>
            </div>
          </div>

          <button type="submit" className="nt-btn-dark w-full">
            Save New Targets
          </button>
        </form>
      </div>
    </div>
  );
};

export default GoalSettings;
