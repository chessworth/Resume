
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
  const [category, setCategory] = useState('Custom');
  const [macros, setMacros] = useState<Macronutrients>({ calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
  const [micros, setMicros] = useState<Micronutrients>({ vitaminC: 0, iron: 0, calcium: 0, potassium: 0, sodium: 0 });

  /**
   * Validates and submits the new food item definition.
   * @param {React.FormEvent} e - Form event.
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newFood: FoodItem = {
      id: crypto.randomUUID(),
      name,
      description: 'Manually entered food',
      category,
      macros,
      micros,
      servingSizeGrams: 100
    };

    onSave(newFood);
  };

  return (
    <div className="nt-modal-overlay">
      <div className="nt-modal-content nt-fade-in max-w-xl">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Manual Food Entry</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Food Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Homemade Granola" className="nt-input" required />
            </div>
            <div className="col-span-2 space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
              <input type="text" value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Snacks" className="nt-input" />
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="nt-badge bg-emerald-50 text-emerald-700">Macros (per 100g)</h3>
            <div className="grid grid-cols-3 gap-3">
              {Object.keys(macros).map((key) => (
                <div key={key} className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{key}</label>
                  <input
                    type="number"
                    value={macros[key as keyof Macronutrients]}
                    onChange={e => setMacros(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                    className="nt-input !py-2"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="nt-badge bg-blue-50 text-blue-700">Micros (per 100g)</h3>
            <div className="grid grid-cols-3 gap-3">
              {Object.keys(micros).map((key) => (
                <div key={key} className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{key}</label>
                  <input
                    type="number"
                    value={micros[key as keyof Micronutrients]}
                    onChange={e => setMicros(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                    className="nt-input !py-2"
                  />
                </div>
              ))}
            </div>
          </div>

          <button type="submit" className="nt-btn-dark w-full mt-4">Save to Library</button>
        </form>
      </div>
    </div>
  );
};

export default ManualFoodEntry;
