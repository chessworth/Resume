
import React, { useState } from 'react';
import { FoodItem, Macronutrients, Micronutrients } from '../types';

interface ManualFoodEntryProps {
  onSave: (food: FoodItem) => void;
  onClose: () => void;
}

/**
 * Component for manually defining a new food item in the library.
 * Allows the user to specify all nutritional details without AI.
 * @param {ManualFoodEntryProps} props - Save callback and close handler.
 */
const ManualFoodEntry: React.FC<ManualFoodEntryProps> = ({ onSave, onClose }) => {
  const [name, setName] = useState('');
  const [category] = useState('Custom');
  const [macros, setMacros] = useState<Macronutrients>({ calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
  const [micros] = useState<Micronutrients>({ vitaminC: 0, iron: 0, calcium: 0, potassium: 0, sodium: 0 });

  /**
   * Validates and submits the new food item definition.
   * @param {React.FormEvent} e - Form event.
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      id: crypto.randomUUID(),
      name,
      description: 'Custom entry',
      category,
      macros,
      micros,
      servingSizeGrams: 100
    });
  };

  return (
    <div className="nt-modal-overlay">
      <div className="nt-modal-content nt-fade-in">
        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '2rem'}}>
          <h2 style={{fontSize: '1.5rem', fontWeight: 900}}>Custom Food</h2>
          <button onClick={onClose} className="nt-btn-icon">
            <svg style={{width: '24px', height: '24px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="nt-form-group">
            <label className="nt-label">Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="nt-input" placeholder="e.g. Grandma's Pie" required />
          </div>

          <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem'}}>
            <div className="nt-form-group">
              <label className="nt-label">Kcal</label>
              <input type="number" value={macros.calories} onChange={e => setMacros(p => ({...p, calories: Number(e.target.value)}))} className="nt-input" />
            </div>
            <div className="nt-form-group">
              <label className="nt-label">Protein</label>
              <input type="number" value={macros.protein} onChange={e => setMacros(p => ({...p, protein: Number(e.target.value)}))} className="nt-input" />
            </div>
            <div className="nt-form-group">
              <label className="nt-label">Carbs</label>
              <input type="number" value={macros.carbs} onChange={e => setMacros(p => ({...p, carbs: Number(e.target.value)}))} className="nt-input" />
            </div>
          </div>

          <button type="submit" className="nt-btn nt-btn-dark" style={{width: '100%'}}>Save to Library</button>
        </form>
      </div>
    </div>
  );
};

export default ManualFoodEntry;
