
import { FoodItem, DailyLog, UserGoals, /* Macronutrients, */ } from "../types";

const FOODS_KEY = 'nutritrack_foods';
const LOGS_KEY = 'nutritrack_logs';
const GOALS_KEY = 'nutritrack_goals';

const defaultGoals: UserGoals = {
  calories: 2000,
  protein: 150,
  carbs: 200,
  fat: 70,
  fiber: 30,
  micros: {
    vitaminC: 90, iron: 18, calcium: 1000, potassium: 3500, sodium: 2300, vitaminA: 900, vitaminD: 15, vitaminE: 15, vitaminK: 120, magnesium: 400
  }
};

/**
 * Service for local persistence and server synchronization via Netlify functions.
 */
export const storageService = {
  getFoods: (): FoodItem[] => {
    const data = localStorage.getItem(FOODS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveFood: async (food: FoodItem, localOnly:boolean = false) => {
    // 1. Try to Sync with Supabase via Backend Function if not localOnly
    if (!localOnly) {
      try {
        let syncedID = await fetch('/.netlify/functions/food-storage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'SAVE_FOOD', payload: food })
        });
        food.id = (await syncedID.json()).id;
      } catch (e) {
        console.warn("Server sync failed, but local copy saved.");
      }
    }
    
    // 2. Persist Locally
    const foods = storageService.getFoods();
    foods.push(food);
    localStorage.setItem(FOODS_KEY, JSON.stringify(foods));
  },

  getLogs: (date: string): DailyLog[] => {
    const data = localStorage.getItem(LOGS_KEY);
    const allLogs: DailyLog[] = data ? JSON.parse(data) : [];
    return allLogs.filter(log => log.date === date);
  },

  addLog: async (log: DailyLog) => {
    // 1. Persist Locally
    log.id = crypto.randomUUID();
    const cryptoId = log.id;
    const data = localStorage.getItem(LOGS_KEY);
    const allLogs: DailyLog[] = data ? JSON.parse(data) : [];
    allLogs.push(log);
    localStorage.setItem(LOGS_KEY, JSON.stringify(allLogs));
    
    // 2. Sync with Supabase via Backend Function
    try {
      let syncedID = await fetch('/.netlify/functions/food-storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'LOG_CONSUMPTION', payload: log })
      });
      log.id = (await syncedID.json()).id;
    } catch (e) {
      console.warn("Log sync failed, but local copy saved.");
    }
    //if succesful, update local log id
    const index = allLogs.findIndex(l => l.id === cryptoId);
    if (index !== -1) {
      allLogs[index].id = log.id;
      localStorage.setItem(LOGS_KEY, JSON.stringify(allLogs));
    }
  },

  updateLog: (updatedLog: DailyLog) => {
    const data = localStorage.getItem(LOGS_KEY);
    const allLogs: DailyLog[] = data ? JSON.parse(data) : [];
    const index = allLogs.findIndex(l => l.id === updatedLog.id);
    if (index !== -1) {
      allLogs[index] = updatedLog;
      localStorage.setItem(LOGS_KEY, JSON.stringify(allLogs));
    }
  },

  deleteLog: (id: string) => {
    const data = localStorage.getItem(LOGS_KEY);
    const allLogs: DailyLog[] = data ? JSON.parse(data) : [];
    const filtered = allLogs.filter(l => l.id !== id);
    localStorage.setItem(LOGS_KEY, JSON.stringify(filtered));
  },

  getGoals: (): UserGoals => {
    const data = localStorage.getItem(GOALS_KEY);
    const stored = data ? JSON.parse(data) : defaultGoals;
    if (stored.fiber === undefined) stored.fiber = defaultGoals.fiber;
    return stored;
  },

  saveGoals: (goals: UserGoals) => {
    localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
  }
};
