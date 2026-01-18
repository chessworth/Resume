import { FoodItem, DailyLog, UserGoals, DailyLogDTO } from "../types";

const FOODS_KEY = "nutritrack_foods";
const LOGS_KEY = "nutritrack_logs";
const GOALS_KEY = "nutritrack_goals";

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
    sodium: 2300,
    vitaminA: 900,
    vitaminD: 15,
    vitaminE: 15,
    vitaminK: 120,
    magnesium: 400,
  },
};

/**
 * Service for local persistence and server synchronization via Netlify functions.
 */
export const storageService = {
  getFoods: (): FoodItem[] => {
    const data = localStorage.getItem(FOODS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveFood: async (food: FoodItem, localOnly: boolean = false) => {
    // 1. Try to Sync with Supabase via Backend Function if not localOnly
    if (!localOnly) {
      try {
        let syncedID = await fetch("/.netlify/functions/food-storage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "SAVE_FOOD", payload: food }),
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

  getLogs: async (localOnly: boolean = false): Promise<DailyLog[] | null> => {
    // TODO: Filter by date
    const offset = new Date().getTimezoneOffset();
    //get today's date based on client timezone.
    const today = new Date(new Date().getTime() - offset * 60 * 1000);

    // get timezone adjusted date time (calculate what the stored time as UTC would be)
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(today.getTime() - offset * 60 * 1000);
    today.setHours(23, 59, 59, 999);
    const endDate = new Date(today.getTime() - offset * 60 * 1000);

    // fetch today's logs from supabase via backend function
    try {
      let response: Response | null = null;
      if (!localOnly) {
        response = await fetch("/.netlify/functions/daily-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "FETCH_LOGS",
            payload: {
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString(),
            },
          }),
        });
      }
      if (localOnly || !response || !response.ok) {
        //fallback to local storage
        const data = localStorage.getItem(LOGS_KEY);
        return data ? JSON.parse(data) : [];
      }
      const data: DailyLogDTO[] = await response.json();
      const mapped: DailyLog[] = data.map((dto) => ({
        id: dto.id,
        user_id: dto.user_id,
        foodId: dto.food_id,
        foodName: dto.food_name,
        date: dto.log_date,
        quantityGrams: dto.quantity_grams,
        calculatedNutrients: {
          calories: dto.calories_consumed,
          protein: dto.protein_consumed,
          carbs: dto.carbs_consumed,
          fat: dto.fat_consumed,
          fiber: dto.fiber_consumed,
        },
        calculatedMicros: dto.micros_snapshot,
      }));
      //persist fetched logs locally
      localStorage.setItem(LOGS_KEY, JSON.stringify(mapped));
      return mapped;
    } catch (e) {
      console.warn("Server sync failed, but local copy used.");
      return null;
    }
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
      let syncedID = await fetch("/.netlify/functions/daily-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "LOG_CONSUMPTION", payload: log }),
      });
      //if succesful, update local log id
      await syncedID.json().then((res) => {
        log.id = res.id;
        const data = localStorage.getItem(LOGS_KEY);
        const allLogs: DailyLog[] = data ? JSON.parse(data) : [];
        const index = allLogs.findIndex((l) => l.id === cryptoId);
        if (index !== -1) {
          allLogs[index].id = log.id;
          localStorage.setItem(LOGS_KEY, JSON.stringify(allLogs));
        }
      });
    } catch (e) {
      console.warn("Log sync failed, but local copy saved.");
    }
  },

  updateLog: (updatedLog: DailyLog) => {
    // 1. Persist Locally
    const data = localStorage.getItem(LOGS_KEY);
    const allLogs: DailyLog[] = data ? JSON.parse(data) : [];
    const index = allLogs.findIndex((l) => l.id === updatedLog.id);
    if (index !== -1) {
      allLogs[index] = updatedLog;
      localStorage.setItem(LOGS_KEY, JSON.stringify(allLogs));
    }
    // 2. Sync Update with Supabase via Backend Function
    try {
      fetch("/.netlify/functions/daily-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "LOG_CONSUMPTION",
          payload: updatedLog,
        }),
      });
    } catch (e) {
      console.warn("Log sync failed, but local copy saved.");
    }
  },

  deleteLog: (id: string) => {
    // 1. Persist Locally
    const data = localStorage.getItem(LOGS_KEY);
    const allLogs: DailyLog[] = data ? JSON.parse(data) : [];
    const filtered = allLogs.filter((l) => l.id !== id);
    localStorage.setItem(LOGS_KEY, JSON.stringify(filtered));
    // 2. Sync Deletion with Supabase via Backend Function
    try {
      fetch("/.netlify/functions/daily-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "DELETE_LOG", payload: { id } }),
      });
    } catch (e) {
      console.warn("Log sync failed, but local copy saved.");
    }
  },

  getGoals: (): UserGoals => {
    const data = localStorage.getItem(GOALS_KEY);
    const stored = data ? JSON.parse(data) : defaultGoals;
    if (stored.fiber === undefined) stored.fiber = defaultGoals.fiber;
    return stored;
  },

  saveGoals: (goals: UserGoals) => {
    localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
  },
};
