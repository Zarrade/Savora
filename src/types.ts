export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert';
export const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack', 'dessert'];
export type Slot = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export const SLOTS: Slot[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export type Diet = 'vegetarian' | 'vegan' | 'pescatarian' | 'gluten-free' | 'dairy-free' | 'high-protein' | 'low-carb';
export const DIETS: Diet[] = ['vegetarian', 'vegan', 'pescatarian', 'gluten-free', 'dairy-free', 'high-protein', 'low-carb'];

export interface Ingredient {
  id: string;
  qty: number | null;      // null = "to taste"
  unit: string;            // normalised unit key ('' = count)
  name: string;            // display name e.g. "chicken breast, diced"
  note?: string;
  group?: string;          // optional section heading e.g. "For the sauce"
}

export interface Review {
  date: string;            // ISO
  rating: number;          // 1-5
  text?: string;
}

export interface Recipe {
  id: string;
  title: string;
  description?: string;
  image?: string;          // data URL (your photo) or https URL (online photo)
  imageCredit?: { label: string; page: string }; // attribution for online photos
  photoAuto?: boolean;     // photo was picked automatically (may be refreshed)
  emoji?: string;          // fallback cover
  equipment?: string[];    // explicit kitchen equipment; undefined = detected from steps
  servings: number;
  prepMin: number;
  cookMin: number;
  cuisine: string;
  mealTypes: MealType[];
  tags: string[];
  ingredients: Ingredient[];
  steps: string[];
  notes?: string;
  sourceUrl?: string;
  videoUrl?: string;
  favorite: boolean;
  builtIn?: boolean;
  remixOf?: string;        // id of built-in recipe this was edited from
  collections: string[];
  reviews: Review[];
  cookedCount: number;
  lastCooked?: string;
  createdAt: number;
  updatedAt: number;
}

export interface PlanEntry {
  id: string;              // `${date}|${slot}|${n}`
  date: string;            // YYYY-MM-DD
  slot: Slot;
  recipeId?: string;
  customText?: string;     // e.g. "Eating out"
  servings: number;
  locked: boolean;
  leftover?: boolean;      // planned as leftovers from an earlier cook
  leftoverOf?: string;     // id of the entry that was cooked extra for this
}

export interface GroceryItem {
  id: string;
  name: string;
  qty: number | null;
  unit: string;
  aisle: string;
  checked: boolean;
  fromRecipes: string[];   // recipe titles, for context
  manual: boolean;
  fromPlan?: string;       // week-start date when generated from the meal plan
  price?: number;          // your own price for this item (overrides the estimate)
  createdAt: number;
}

export interface Collection {
  id: string;
  name: string;
  emoji: string;
  createdAt: number;
}

export interface Settings {
  id: 'settings';
  name: string;
  sex: 'male' | 'female';
  age: number;
  heightCm: number;
  weightKg: number;
  activity: number;        // multiplier 1.2 – 1.9
  goal: 'lose' | 'maintain' | 'gain';
  targetsMode: 'auto' | 'manual';
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  allergies: string[];     // ingredient keywords to exclude
  avoid: string[];         // foods disliked
  diets: Diet[];
  pantry: string[];        // staples always in stock — left off grocery lists
  cookingDays: number[];   // 0=Mon … 6=Sun
  planSlots: Slot[];       // which slots the generator fills
  householdServings: number;
  weekStart: 0 | 1;        // 0 = Sunday, 1 = Monday
  theme: 'system' | 'light' | 'dark';
  onboarded: boolean;
  seedVersion?: number;    // which batches of starter recipes have been installed
  equipment: string[];     // kitchen equipment you have
  weeklyBudget: number;    // grocery budget per week (0 = off)
  currency: string;
  priceOverrides: Record<string, number>; // your prices, AED per kg (or per item) keyed by food
  planOptions: PlanOptions;
  photosVersion?: number;  // starter photo set fetched
  featureTipSeen?: boolean;
}

export interface PlanOptions {
  leftoverLunches: boolean;
  respectTargets: boolean;
  stayInBudget: boolean;
  favoritesOnly: boolean;
  maxMinutes: number | null;
}

export interface Nutrition {
  kcal: number; protein: number; carbs: number; fat: number;
  satFat: number; sugar: number; fibre: number; salt: number;
  calcium: number; iron: number; potassium: number; vitC: number; vitA: number;
  magnesium: number;
}
