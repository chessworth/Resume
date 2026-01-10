
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
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
          <h2 style={{fontSize: '1.5rem', fontWeight: 900}}>Daily Targets</h2>
          <button onClick={onClose} className="nt-btn-icon">
            <svg style={{width: '24px', height: '24px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{marginBottom: '2rem'}}>
            <span className="nt-badge nt-badge-emerald" style={{marginBottom: '1rem'}}>Macros</span>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem'}}>
              <div className="nt-form-group">
                <label className="nt-label">Calories (kcal)</label>
                <input type="number" name="calories" value={goals.calories} onChange={handleMacroChange} className="nt-input" />
              </div>
              <div className="nt-form-group">
                <label className="nt-label">Protein (g)</label>
                <input type="number" name="protein" value={goals.protein} onChange={handleMacroChange} className="nt-input" />
              </div>
              <div className="nt-form-group">
                <label className="nt-label">Carbs (g)</label>
                <input type="number" name="carbs" value={goals.carbs} onChange={handleMacroChange} className="nt-input" />
              </div>
              <div className="nt-form-group">
                <label className="nt-label">Fat (g)</label>
                <input type="number" name="fat" value={goals.fat} onChange={handleMacroChange} className="nt-input" />
              </div>
            </div>
          </div>

          <div style={{marginBottom: '2rem'}}>
            <span className="nt-badge nt-badge-blue" style={{marginBottom: '1rem'}}>Micros</span>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem'}}>
              <div className="nt-form-group">
                <label className="nt-label">Vit C (mg)</label>
                <input type="number" name="vitaminC" value={goals.micros.vitaminC} onChange={handleMicroChange} className="nt-input" />
              </div>
              <div className="nt-form-group">
                <label className="nt-label">Iron (mg)</label>
                <input type="number" name="iron" value={goals.micros.iron} onChange={handleMicroChange} className="nt-input" />
              </div>
              <div className="nt-form-group">
                <label className="nt-label">Calcium (mg)</label>
                <input type="number" name="calcium" value={goals.micros.calcium} onChange={handleMicroChange} className="nt-input" />
              </div>
              <div className="nt-form-group">
                <label className="nt-label">Sodium (mg)</label>
                <input type="number" name="sodium" value={goals.micros.sodium} onChange={handleMicroChange} className="nt-input" />
              </div>
            </div>
          </div>

          <button type="submit" className="nt-btn nt-btn-dark" style={{width: '100%'}}>Apply Goals</button>
        </form>
      </div>
    </div>
  );
};

export default GoalSettings;
