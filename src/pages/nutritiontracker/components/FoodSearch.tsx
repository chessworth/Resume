
import React, { useState, useMemo } from 'react';
import { FoodItem } from '../types';
import { fetchFoodDataFromAI } from '../services/geminiService';
import { storageService } from '../services/storageService';

interface FoodSearchProps {
  onSelectFood: (food: FoodItem) => void;
  onRefreshFoods: () => void;
  onOpenManualEntry: () => void;
}

/**
 * Component for finding food items.
 * Prioritizes local library search, then offers Gemini AI fallback or Manual Entry.
 * @param {FoodSearchProps} props - Callbacks for selection, refresh and manual opening.
 */
const FoodSearch: React.FC<FoodSearchProps> = ({ onSelectFood, onRefreshFoods, onOpenManualEntry }) => {
  const [query, setQuery] = useState('');
  const [isSearchingAI, setIsSearchingAI] = useState(false);
  const [aiError, setAiError] = useState('');

  // Memoize foods to avoid re-calculation unless query or searching state changes
  const availableFoods = useMemo(() => storageService.getFoods(), [query, isSearchingAI]);

  // Filter local library based on search string
  const filteredFoods = availableFoods.filter(food => 
    food.name.toLowerCase().includes(query.toLowerCase())
  );

  /**
   * Triggers the AI nutritional analysis for the current query string.
   */
  const handleAISearch = async () => {
    if (!query.trim()) return;
    setIsSearchingAI(true);
    setAiError('');
    
    try {
      const result = await fetchFoodDataFromAI(query);
      if (result) {
        const newFood: FoodItem = {
          id: crypto.randomUUID(),
          name: result.name || query,
          description: result.description || 'AI Generated data',
          category: result.category || 'General',
          macros: result.macros!,
          micros: result.micros!,
          servingSizeGrams: result.servingSizeGrams || 100
        };
        storageService.saveFood(newFood);
        onRefreshFoods();
        onSelectFood(newFood);
        setQuery('');
      } else {
        setAiError('Could not find data for this item. Try a more specific name.');
      }
    } catch (e) {
      setAiError('Connection error. Please check your network and try again.');
    } finally {
      setIsSearchingAI(false);
    }
  };

  return (
    <div className="nt-card p-6">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search food library..."
            className="nt-input pl-11 !text-slate-900" 
          />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <button 
          onClick={onOpenManualEntry}
          className="p-3 bg-slate-900 text-white rounded-xl hover:bg-black transition-colors"
          title="Manual Entry"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
        </button>
      </div>

      <div className="mt-4 max-h-64 overflow-y-auto space-y-2 pr-1">
        {filteredFoods.map(food => (
          <button
            key={food.id}
            onClick={() => onSelectFood(food)}
            className="w-full text-left p-4 rounded-2xl hover:bg-emerald-50 border border-slate-50 hover:border-emerald-200 transition-all flex justify-between items-center group"
          >
            <div>
              <span className="font-black text-slate-900">{food.name}</span>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{food.category}</p>
            </div>
            <span className="nt-badge bg-slate-100 text-slate-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors">Log It</span>
          </button>
        ))}

        {/* AI Call-to-action */}
        {query.length > 2 && filteredFoods.length === 0 && !isSearchingAI && (
          <div className="text-center py-8">
            <p className="text-slate-500 text-sm mb-6 font-medium">Item not found in library.</p>
            <button
              onClick={handleAISearch}
              className="nt-btn-emerald mx-auto"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z" /></svg>
              Analyze with Gemini AI
            </button>
          </div>
        )}

        {/* Loading State */}
        {isSearchingAI && (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-slate-500 text-sm font-bold uppercase tracking-widest animate-pulse">Consulting Gemini AI...</p>
          </div>
        )}

        {/* Error Feedback */}
        {aiError && (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold text-center border border-red-100">
            {aiError}
          </div>
        )}
      </div>
    </div>
  );
};

export default FoodSearch;
