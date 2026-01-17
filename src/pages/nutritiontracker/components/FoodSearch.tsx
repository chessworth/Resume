
import React, { useState } from 'react';
import { FoodItem } from '../types';
import { fetchFoodDataFromAI } from '../services/geminiService';
import { searchFoodInDatabase } from '../services/databaseService';
import { storageService } from '../services/storageService';

interface FoodSearchProps {
  availableFoods: FoodItem[];
  onSelectFood: (food: FoodItem) => void;
  onRefreshFoods: () => void;
  onOpenManualEntry: () => void;
}

/**
 * Component for finding food items.
 * Receives the current library as a prop for instant reactivity.
 */
const FoodSearch: React.FC<FoodSearchProps> = ({ availableFoods, onSelectFood, onRefreshFoods, onOpenManualEntry }) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [aiError, setAiError] = useState('');
  const [databaseSearchResult, setDatabaseSearchResult] = useState<Partial<FoodItem>[]>([]);

  const filteredFoods = availableFoods.filter(food => 
    food.name.toLowerCase().includes(query.toLowerCase())
  );

  /**
   * Searches the external database for the current query string.
   */
  const searchdatabase = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    setAiError('');
    try {
      const result = await searchFoodInDatabase(query);
      if (result) {
        const formattedResult: Partial<FoodItem>[] = [];
        result.forEach(item => formattedResult.push(item));
        setDatabaseSearchResult(formattedResult);
      }
      else {
        setAiError('Could not find data in databse. Try Different query or Search AI');
      }
    } catch (e) {
      console.error(e);
      setAiError('Network error. Try again later.');
    } finally {
      setIsSearching(false);
    }
  };

  const pickFoodFromDatabase = (foodId: string) => {
    const food = databaseSearchResult.find(f => f.id === foodId);
    if (food) {
      const newFood: FoodItem = {
        id: food.id!,
        name: food.name || query,
        description: food.description || '',
        category: food.category || 'General',
        macros: food.macros!,
        micros: food.micros!,
        servingSizeGrams: food.servingSizeGrams || 100
      };
      storageService.saveFood(newFood, true);
      onRefreshFoods();
      onSelectFood(newFood);
      setQuery('');
    }
  };
  
 /**
  * Triggers the AI nutritional analysis for the current query string.
  */
  const handleAISearch = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
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
        setAiError('Could not find data. Be more specific.');
      }
    } catch (e) {
      setAiError('Network error. Try again later.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="nt-card">
      <div style={{display: 'flex', gap: '5%', alignItems: 'center'}}>
        <div style={{position: 'relative', flex: 1}}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search items..."
            className="nt-input"
            style={{paddingLeft: '3rem'}}
          />
          <svg style={{position: 'absolute', left: '2rem', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: 'var(--slate-400)'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <button onClick={onOpenManualEntry} className="nt-btn nt-btn-dark">
          <svg style={{width: '24px', height: '24px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
        </button>
      </div>

      <div style={{marginTop: '1.5rem', maxHeight: '300px', overflowY: 'auto'}}>
        {filteredFoods.map(food => (
          <button
            key={food.id}
            onClick={() => onSelectFood(food)}
            className="nt-btn"
            style={{
              width: '100%', 
              justifyContent: 'space-between', 
              background: 'transparent', 
              color: 'inherit',
              padding: '1rem',
              borderBottom: '1px solid var(--slate-50)',
              borderRadius: '0'
            }}
          >
            <div style={{textAlign: 'left'}}>
              <span style={{fontWeight: 900, display: 'block'}}>{food.name}</span>
              <span className="nt-badge" style={{fontSize: '8px', padding: '0.15rem 0.5rem', background: 'var(--slate-100)'}}>{food.category}</span>
            </div>
            <span className="nt-badge nt-badge-emerald">Select</span>
          </button>
        ))}

        {(query.length > 2 || filteredFoods.length === 0) && !isSearching && databaseSearchResult.length === 0 && (
          <div style={{textAlign: 'center', padding: '2rem'}}>
            <p style={{color: 'var(--slate-400)', marginBottom: '1.5rem', fontSize: '0.875rem'}}>Not in library.</p>
            <div className='nt-btn-group'>
              <button onClick={searchdatabase} className="nt-btn nt-btn-primary">
                <svg style={{width: '20px', height: '20px'}} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z" /></svg>
                Search Database
              </button>
              <button onClick={handleAISearch} className="nt-btn nt-btn-primary nt-btn-premium">
                <svg style={{width: '20px', height: '20px'}} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z" /></svg>
                Analyze with Gemini
              </button>
            </div>
          </div>
        )}

        {isSearching && databaseSearchResult.length === 0 && (
          <div style={{textAlign: 'center', padding: '2.5rem'}}>
            <div style={{width: '32px', height: '32px', border: '3px solid var(--primary)', borderBottomColor: 'transparent', borderRadius: '50%', margin: '0 auto 1rem', animation: 'spin 0.8s linear infinite'}}></div>
            <p className="nt-progress-label">Searching...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {databaseSearchResult.length > 0 && (
          // Display database search results as a list
          <div style={{marginTop: '1.5rem', maxHeight: '300px', overflowY: 'auto'}}>
            {databaseSearchResult.map((food) => (
              <button
                key={food.id}
                onClick={() => pickFoodFromDatabase(food.id ?? '')}
                className="nt-btn"
                style={{
                  width: '100%', 
                  justifyContent: 'space-between', 
                  background: 'transparent', 
                  color: 'inherit',
                  padding: '1rem',
                  borderBottom: '1px solid var(--slate-50)',
                  borderRadius: '0'
                }}
              >
                <div style={{textAlign: 'left'}}>
                  <span style={{fontWeight: 900, display: 'block'}}>{food.name}</span>
                  <span className="nt-badge" style={{fontSize: '8px', padding: '0.15rem 0.5rem', background: 'var(--slate-100)'}}>{food.category}</span>
                </div>
                <span className="nt-badge nt-badge-emerald">Select</span>
              </button>
            ))}
        </div>
        )}

        {aiError && (
          <div style={{padding: '1rem', background: 'var(--danger-light)', color: 'var(--danger)', borderRadius: '1rem', fontSize: '0.875rem', fontWeight: 700, textAlign: 'center'}}>
            {aiError}
          </div>
        )}
      </div>
    </div>
  );
};

export default FoodSearch;
