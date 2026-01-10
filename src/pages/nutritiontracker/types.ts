
export interface Macronutrients {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface Micronutrients {
  vitaminC: number; // mg
  iron: number; // mg
  calcium: number; // mg
  potassium: number; // mg
  sodium: number; // mg
}

export interface UserGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  micros: Micronutrients;
}

export interface FoodItem {
  id: string;
  name: string;
  description: string;
  category: string;
  macros: Macronutrients;
  micros: Micronutrients;
  servingSizeGrams: number;
}

export interface DailyLog {
  id: string;
  foodId: string;
  foodName: string;
  date: string; // YYYY-MM-DD
  quantityGrams: number;
  calculatedNutrients: Macronutrients;
  calculatedMicros?: Micronutrients;
}

export interface DailyStats {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  totalMicros: Micronutrients;
  logs: DailyLog[];
}
