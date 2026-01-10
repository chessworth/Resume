
import { FoodItem, DailyLog, UserGoals, Micronutrients } from "../types";
import { supabase } from "./supabaseClient"; // PLACEHOLDER: Imported placeholder client

const FOODS_KEY = 'nutritrack_foods';
const LOGS_KEY = 'nutritrack_logs';
const GOALS_KEY = 'nutritrack_goals';

/**
 * Default goals used when no user goals are saved in storage.
 */
const defaultGoals: UserGoals = {
  calories: 2000,
  protein: 150,
  carbs: 200,
  fat: 70,
  fiber: 30,
  micros: {
    vitaminC: 90,
    iron: 18,
    calcium: 1000,
    potassium: 3500,
    sodium: 2300
  }
};

/**
 * Service for local persistence handling. 
 * Designed to be swappable with a real database (e.g., Supabase).
 * 
 * PLACEHOLDER NOTE: The methods currently prioritize LocalStorage but are structured
 * to be easily converted to async Supabase calls.
 */
export const storageService = {
  /**
   * Retrieves all unique food items stored in the library.
   * @returns {Promise<FoodItem[]> | FoodItem[]} Array of stored FoodItem objects.
   */
  getFoods: (): FoodItem[] => {
    // PLACEHOLDER: In production, use: await supabase.from('foods').select('*')
    const data = localStorage.getItem(FOODS_KEY);
    return data ? JSON.parse(data) : [];
  },

  /**
   * Persists a new food item to the library locally.
   * @param {FoodItem} food - The food item to save.
   */
  saveFood: (food: FoodItem) => {
    // PLACEHOLDER: In production, use: await supabase.from('foods').insert([food])
    const foods = storageService.getFoods();
    foods.push(food);
    localStorage.setItem(FOODS_KEY, JSON.stringify(foods));
  },

  /**
   * Retrieves logs for a specific calendar date.
   * @param {string} date - ISO date string (YYYY-MM-DD).
   * @returns {DailyLog[]} Array of logs matching the provided date.
   */
  getLogs: (date: string): DailyLog[] => {
    // PLACEHOLDER: In production, use: await supabase.from('logs').select('*').eq('date', date)
    const data = localStorage.getItem(LOGS_KEY);
    const allLogs: DailyLog[] = data ? JSON.parse(data) : [];
    return allLogs.filter(log => log.date === date);
  },

  /**
   * Adds a new consumption entry to the diary.
   * @param {DailyLog} log - The log entry to persist.
   */
  addLog: (log: DailyLog) => {
    // PLACEHOLDER: In production, use: await supabase.from('logs').insert([log])
    const data = localStorage.getItem(LOGS_KEY);
    const allLogs: DailyLog[] = data ? JSON.parse(data) : [];
    allLogs.push(log);
    localStorage.setItem(LOGS_KEY, JSON.stringify(allLogs));
  },

  /**
   * Updates an existing consumption entry in the diary.
   * @param {DailyLog} updatedLog - The log entry with updated values.
   */
  updateLog: (updatedLog: DailyLog) => {
    // PLACEHOLDER: In production, use: await supabase.from('logs').update(updatedLog).eq('id', updatedLog.id)
    const data = localStorage.getItem(LOGS_KEY);
    const allLogs: DailyLog[] = data ? JSON.parse(data) : [];
    const index = allLogs.findIndex(l => l.id === updatedLog.id);
    if (index !== -1) {
      allLogs[index] = updatedLog;
      localStorage.setItem(LOGS_KEY, JSON.stringify(allLogs));
    }
  },

  /**
   * Removes a specific log entry by ID.
   * @param {string} id - UUID of the log entry.
   */
  deleteLog: (id: string) => {
    // PLACEHOLDER: In production, use: await supabase.from('logs').delete().eq('id', id)
    const data = localStorage.getItem(LOGS_KEY);
    const allLogs: DailyLog[] = data ? JSON.parse(data) : [];
    const filtered = allLogs.filter(l => l.id !== id);
    localStorage.setItem(LOGS_KEY, JSON.stringify(filtered));
  },

  /**
   * Retrieves user-defined nutritional targets.
   * Handles migrations for newly added fields (like fiber).
   * @returns {UserGoals} The current set of nutrition goals.
   */
  getGoals: (): UserGoals => {
    // PLACEHOLDER: In production, use: await supabase.from('user_profiles').select('goals').single()
    const data = localStorage.getItem(GOALS_KEY);
    const stored = data ? JSON.parse(data) : defaultGoals;
    if (stored.fiber === undefined) stored.fiber = defaultGoals.fiber;
    return stored;
  },

  /**
   * Updates user-defined nutritional targets.
   * @param {UserGoals} goals - The full set of target values.
   */
  saveGoals: (goals: UserGoals) => {
    // PLACEHOLDER: In production, use: await supabase.from('user_profiles').update({ goals }).eq('user_id', currentUserId)
    localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
  }
};
