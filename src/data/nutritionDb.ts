/*
 * Offline ingredient nutrition database.
 * Values are approximate per 100 g (edible portion), based on typical
 * USDA FoodData Central figures. Good for estimates, not medical use.
 *
 * n = [kcal, protein g, carbs g, fat g, satFat g, sugar g, fibre g, salt g,
 *      calcium mg, iron mg, potassium mg, vitC mg, vitA µg RAE, magnesium mg]
 * d = density in g per ml (for cup/tbsp/tsp/ml conversions). Default 1.
 * u = weight in g of one "unit" (each / clove / can / bunch / slice …)
 */

export type Aisle =
  | 'Produce' | 'Meat & Fish' | 'Dairy & Eggs' | 'Bakery' | 'Grains & Pasta'
  | 'Canned & Jars' | 'Pantry' | 'Spices' | 'Nuts & Seeds' | 'Frozen' | 'Drinks' | 'Other';

export const AISLES: Aisle[] = [
  'Produce', 'Meat & Fish', 'Dairy & Eggs', 'Bakery', 'Grains & Pasta',
  'Canned & Jars', 'Pantry', 'Spices', 'Nuts & Seeds', 'Frozen', 'Drinks', 'Other'
];

export interface Food {
  k: string[];
  a: Aisle;
  n: number[];
  d?: number;
  u?: Record<string, number>;
  tags?: string[]; // meat, fish, dairy, egg, gluten, nuts, shellfish, soy, sesame, pork
}

const SPICE = [300, 12, 55, 12, 2, 5, 30, 0.2, 600, 25, 1500, 5, 100, 200];

export const FOODS: Food[] = [
  // ---------- Meat & fish ----------
  { k: ['chicken breast', 'chicken fillet', 'chicken breasts'], a: 'Meat & Fish', n: [120, 22.5, 0, 2.6, 0.6, 0, 0, 0.11, 5, 0.4, 370, 0, 9, 28], u: { each: 200 }, tags: ['meat'] },
  { k: ['chicken thigh', 'chicken thighs', 'boneless chicken'], a: 'Meat & Fish', n: [121, 19.7, 0, 4.1, 1, 0, 0, 0.2, 7, 0.8, 240, 0, 13, 23], u: { each: 110 }, tags: ['meat'] },
  { k: ['chicken wings', 'chicken wing'], a: 'Meat & Fish', n: [191, 17.5, 0, 12.8, 3.7, 0, 0, 0.2, 11, 0.6, 180, 0, 40, 18], u: { each: 35 }, tags: ['meat'] },
  { k: ['whole chicken', 'chicken'], a: 'Meat & Fish', n: [215, 18.6, 0, 15, 4.3, 0, 0, 0.18, 11, 0.9, 190, 1.6, 41, 20], u: { each: 1500 }, tags: ['meat'] },
  { k: ['turkey mince', 'ground turkey', 'minced turkey'], a: 'Meat & Fish', n: [150, 19.7, 0, 8, 2.2, 0, 0, 0.18, 21, 1.1, 230, 0, 0, 22], tags: ['meat'] },
  { k: ['turkey slices', 'deli turkey', 'sliced turkey'], a: 'Meat & Fish', n: [104, 17, 4, 1.7, 0.5, 3.5, 0.5, 2.6, 10, 0.5, 350, 0, 0, 25], u: { slice: 15 }, tags: ['meat'] },
  { k: ['beef mince', 'ground beef', 'minced beef', 'mince', 'minced meat', 'ground meat'], a: 'Meat & Fish', n: [176, 20, 0, 10, 4, 0, 0, 0.17, 12, 2.2, 320, 0, 0, 20], tags: ['meat'] },
  { k: ['beef steak', 'steak', 'sirloin', 'ribeye', 'beef', 'stewing beef', 'beef chunks'], a: 'Meat & Fish', n: [160, 21, 0, 8, 3.2, 0, 0, 0.14, 18, 1.8, 330, 0, 0, 22], u: { each: 250 }, tags: ['meat'] },
  { k: ['lamb mince', 'ground lamb', 'minced lamb'], a: 'Meat & Fish', n: [282, 16.6, 0, 23.4, 10.2, 0, 0, 0.15, 16, 1.6, 222, 0, 0, 21], tags: ['meat'] },
  { k: ['lamb', 'lamb shoulder', 'lamb leg', 'lamb chops'], a: 'Meat & Fish', n: [200, 19, 0, 13.5, 6, 0, 0, 0.16, 12, 1.7, 280, 0, 0, 23], u: { each: 100 }, tags: ['meat'] },
  { k: ['pork loin', 'pork chop', 'pork'], a: 'Meat & Fish', n: [143, 21, 0, 6, 2, 0, 0, 0.13, 6, 0.8, 360, 0.6, 2, 23], u: { each: 180 }, tags: ['meat', 'pork'] },
  { k: ['bacon'], a: 'Meat & Fish', n: [458, 12, 1.3, 45, 15, 0, 0, 2.1, 6, 0.5, 200, 0, 11, 12], u: { slice: 25 }, tags: ['meat', 'pork'] },
  { k: ['sausage', 'sausages'], a: 'Meat & Fish', n: [301, 12, 2, 27, 9, 1, 0, 1.9, 13, 1, 230, 0, 0, 15], u: { each: 60 }, tags: ['meat'] },
  { k: ['salmon', 'salmon fillet'], a: 'Meat & Fish', n: [208, 20, 0, 13, 3, 0, 0, 0.15, 9, 0.3, 363, 0, 12, 27], u: { each: 150 }, tags: ['fish'] },
  { k: ['white fish', 'cod', 'sea bass', 'hammour', 'tilapia', 'haddock', 'fish fillet', 'fish'], a: 'Meat & Fish', n: [82, 18, 0, 0.7, 0.1, 0, 0, 0.14, 16, 0.4, 413, 1, 12, 32], u: { each: 150 }, tags: ['fish'] },
  { k: ['shrimp', 'prawns', 'prawn'], a: 'Meat & Fish', n: [85, 20, 0, 0.5, 0.1, 0, 0, 0.3, 64, 0.2, 264, 0, 0, 39], u: { each: 12 }, tags: ['shellfish'] },
  { k: ['tuna', 'canned tuna', 'tinned tuna'], a: 'Canned & Jars', n: [116, 26, 0, 0.8, 0.2, 0, 0, 0.85, 11, 1.5, 237, 0, 17, 27], u: { can: 112, each: 112 }, tags: ['fish'] },

  // ---------- Dairy & eggs ----------
  { k: ['egg white', 'egg whites'], a: 'Dairy & Eggs', n: [52, 11, 0.7, 0.2, 0, 0.7, 0, 0.4, 7, 0.1, 163, 0, 0, 11], u: { each: 33 }, d: 1.03, tags: ['egg'] },
  { k: ['egg', 'eggs', 'egg yolk'], a: 'Dairy & Eggs', n: [143, 12.6, 0.7, 9.5, 3.1, 0.4, 0, 0.36, 56, 1.75, 138, 0, 160, 12], u: { each: 50 }, d: 1.03, tags: ['egg'] },
  { k: ['halloumi'], a: 'Dairy & Eggs', n: [321, 21, 2, 25, 17, 2, 0, 3.3, 700, 0.2, 100, 0, 280, 30], u: { slice: 30 }, tags: ['dairy'] },
  { k: ['feta', 'feta cheese', 'white cheese', 'akkawi'], a: 'Dairy & Eggs', n: [264, 14, 4, 21, 15, 4, 0, 2.9, 493, 0.65, 62, 0, 125, 19], d: 0.6, tags: ['dairy'] },
  { k: ['cheddar', 'cheddar cheese', 'grated cheese', 'cheese'], a: 'Dairy & Eggs', n: [403, 25, 1.3, 33, 21, 0.5, 0, 1.6, 720, 0.7, 98, 0, 265, 28], d: 0.45, u: { slice: 20 }, tags: ['dairy'] },
  { k: ['parmesan', 'parmigiano', 'pecorino'], a: 'Dairy & Eggs', n: [431, 38, 4, 29, 19, 0.9, 0, 3.9, 1184, 0.8, 92, 0, 207, 44], d: 0.4, tags: ['dairy'] },
  { k: ['mozzarella'], a: 'Dairy & Eggs', n: [280, 28, 3, 17, 10, 1, 0, 1.6, 505, 0.4, 76, 0, 180, 20], d: 0.45, u: { each: 125 }, tags: ['dairy'] },
  { k: ['cream cheese'], a: 'Dairy & Eggs', n: [342, 6, 4, 34, 19, 3.2, 0, 0.8, 98, 0.1, 138, 0, 308, 9], d: 1.0, tags: ['dairy'] },
  { k: ['ricotta'], a: 'Dairy & Eggs', n: [174, 11, 3, 13, 8.3, 0.3, 0, 0.2, 207, 0.4, 105, 0, 120, 11], d: 1.0, tags: ['dairy'] },
  { k: ['cottage cheese'], a: 'Dairy & Eggs', n: [98, 11, 3.4, 4.3, 1.7, 2.7, 0, 0.9, 83, 0.1, 104, 0, 37, 8], d: 0.95, tags: ['dairy'] },
  { k: ['labneh', 'labne', 'labaneh'], a: 'Dairy & Eggs', n: [180, 7, 4, 15, 10, 4, 0, 0.8, 150, 0.1, 150, 0, 100, 12], d: 1.05, tags: ['dairy'] },
  { k: ['greek yogurt', 'greek yoghurt', 'skyr'], a: 'Dairy & Eggs', n: [73, 10, 3.9, 1.9, 1.2, 3.6, 0, 0.09, 110, 0.1, 141, 0, 10, 11], d: 1.05, tags: ['dairy'] },
  { k: ['yogurt', 'yoghurt', 'laban', 'plain yogurt'], a: 'Dairy & Eggs', n: [61, 3.5, 4.7, 3.3, 2.1, 4.7, 0, 0.11, 121, 0.05, 155, 0.5, 27, 12], d: 1.03, tags: ['dairy'] },
  { k: ['sour cream'], a: 'Dairy & Eggs', n: [198, 2.4, 4.6, 19, 11, 3.4, 0, 0.08, 101, 0.1, 141, 0.9, 175, 10], d: 1.0, tags: ['dairy'] },
  { k: ['heavy cream', 'double cream', 'whipping cream', 'cooking cream', 'cream'], a: 'Dairy & Eggs', n: [340, 2.8, 2.7, 36, 23, 2.9, 0, 0.07, 66, 0, 95, 0.6, 411, 7], d: 1.0, tags: ['dairy'] },
  { k: ['butter', 'ghee', 'samneh'], a: 'Dairy & Eggs', n: [717, 0.9, 0.1, 81, 51, 0.1, 0, 0.6, 24, 0, 24, 0, 684, 2], d: 0.91, tags: ['dairy'] },
  { k: ['almond milk'], a: 'Drinks', n: [15, 0.6, 0.3, 1.2, 0.1, 0, 0.2, 0.18, 184, 0.3, 67, 0, 51, 7], d: 1.02, tags: ['nuts'] },
  { k: ['oat milk'], a: 'Drinks', n: [48, 1, 6.7, 2, 0.2, 4, 0.8, 0.1, 120, 0.3, 150, 0, 0, 8], d: 1.02, tags: ['gluten'] },
  { k: ['milk', 'whole milk', 'skimmed milk', 'low fat milk'], a: 'Dairy & Eggs', n: [61, 3.2, 4.8, 3.3, 1.9, 5, 0, 0.11, 113, 0, 132, 0, 46, 10], d: 1.03, tags: ['dairy'] },
  { k: ['whey protein', 'protein powder'], a: 'Pantry', n: [380, 78, 8, 4, 2, 4, 0, 0.5, 450, 1, 500, 0, 0, 80], d: 0.4, u: { scoop: 30, each: 30 }, tags: ['dairy'] },

  // ---------- Fats, oils & sauces ----------
  { k: ['olive oil', 'extra virgin olive oil'], a: 'Pantry', n: [884, 0, 0, 100, 14, 0, 0, 0, 1, 0.6, 1, 0, 0, 0], d: 0.91 },
  { k: ['vegetable oil', 'sunflower oil', 'canola oil', 'oil', 'sesame oil', 'coconut oil', 'cooking spray'], a: 'Pantry', n: [884, 0, 0, 100, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0], d: 0.92 },
  { k: ['tahini', 'tahina'], a: 'Pantry', n: [595, 17, 21, 54, 7.5, 0.5, 9.3, 0.29, 426, 8.95, 414, 0, 3, 95], d: 1.05, tags: ['sesame'] },
  { k: ['peanut butter'], a: 'Pantry', n: [588, 25, 20, 50, 10, 9, 6, 0.9, 43, 1.9, 649, 0, 0, 154], d: 1.09, tags: ['nuts'] },
  { k: ['mayonnaise', 'mayo'], a: 'Pantry', n: [680, 1, 0.6, 75, 11.7, 0.6, 0, 1.6, 8, 0.2, 20, 0, 20, 1], d: 0.91, tags: ['egg'] },
  { k: ['garlic sauce', 'toum'], a: 'Dairy & Eggs', n: [600, 1, 4, 64, 5, 0.5, 0.3, 1.2, 15, 0.2, 40, 3, 0, 3], d: 0.95 },
  { k: ['hummus'], a: 'Dairy & Eggs', n: [166, 7.9, 14.3, 9.6, 1.4, 0.3, 6, 0.95, 38, 2.4, 228, 0, 1, 71], d: 1.03, tags: ['sesame'] },
  { k: ['pesto'], a: 'Canned & Jars', n: [430, 5, 6, 43, 7, 3, 1.6, 2.3, 170, 1, 200, 2, 150, 30], d: 1.05, tags: ['dairy', 'nuts'] },
  { k: ['soy sauce', 'tamari', 'soya sauce'], a: 'Pantry', n: [53, 8.1, 4.9, 0.6, 0.1, 0.4, 0.8, 14.1, 33, 1.5, 435, 0, 0, 74], d: 1.15, tags: ['soy', 'gluten'] },
  { k: ['vinegar', 'apple cider vinegar', 'white vinegar', 'balsamic vinegar', 'balsamic'], a: 'Pantry', n: [21, 0, 0.9, 0, 0, 0.4, 0, 0.01, 7, 0.2, 73, 0, 0, 5], d: 1.01 },
  { k: ['dijon mustard', 'mustard'], a: 'Pantry', n: [66, 4.4, 5.8, 4, 0.2, 0.9, 4, 2.8, 63, 1.6, 138, 0.3, 3, 48], d: 1.05 },
  { k: ['ketchup', 'tomato ketchup'], a: 'Pantry', n: [101, 1, 27, 0.1, 0, 22, 0.3, 2.3, 15, 0.4, 281, 4, 24, 13], d: 1.15 },
  { k: ['sriracha', 'hot sauce', 'chili sauce', 'chilli sauce'], a: 'Pantry', n: [93, 1.9, 19, 0.9, 0.1, 15, 2.2, 5.5, 18, 1.6, 321, 27, 140, 18], d: 1.1 },
  { k: ['green curry paste', 'red curry paste', 'thai curry paste', 'curry paste'], a: 'Canned & Jars', n: [140, 3, 15, 8, 1, 6, 5, 9, 60, 3, 400, 10, 200, 30], d: 1.1 },
  { k: ['fish sauce'], a: 'Pantry', n: [35, 5, 3.6, 0, 0, 3.6, 0, 18.5, 43, 0.8, 288, 0.5, 4, 175], d: 1.2, tags: ['fish'] },
  { k: ['harissa'], a: 'Canned & Jars', n: [100, 3, 10, 6, 1, 5, 5, 4, 50, 3, 400, 30, 500, 30], d: 1.05 },
  { k: ['pomegranate molasses'], a: 'Pantry', n: [240, 0.5, 60, 0, 0, 50, 0.5, 0.05, 40, 1, 500, 1, 0, 20], d: 1.35 },
  { k: ['tomato paste', 'tomato puree', 'tomato purée'], a: 'Canned & Jars', n: [82, 4.3, 19, 0.5, 0.1, 12, 4.1, 0.15, 36, 3, 1014, 22, 76, 42], d: 1.1 },
  { k: ['passata', 'tomato sauce', 'marinara'], a: 'Canned & Jars', n: [32, 1.4, 6.2, 0.4, 0.1, 4, 1.5, 0.4, 18, 0.8, 300, 7, 20, 15], d: 1.03, u: { can: 500, each: 500 } },
  { k: ['canned tomatoes', 'chopped tomatoes', 'diced tomatoes', 'crushed tomatoes', 'tinned tomatoes', 'plum tomatoes'], a: 'Canned & Jars', n: [24, 1.2, 4.5, 0.3, 0, 3, 1.9, 0.3, 34, 1, 190, 9, 20, 11], d: 1.02, u: { can: 400, each: 400 } },
  { k: ['coconut milk', 'coconut cream'], a: 'Canned & Jars', n: [230, 2.3, 5.5, 24, 21, 3.3, 2.2, 0.04, 16, 1.6, 263, 1, 0, 46], d: 1.0, u: { can: 400, each: 400 } },
  { k: ['chicken stock', 'vegetable stock', 'beef stock', 'chicken broth', 'vegetable broth', 'beef broth', 'stock', 'broth'], a: 'Pantry', n: [7, 1, 0.5, 0.2, 0.1, 0.3, 0, 0.9, 4, 0.1, 60, 0, 0, 2], d: 1.0 },
  { k: ['stock cube', 'bouillon cube', 'maggi cube'], a: 'Pantry', n: [250, 10, 20, 15, 6, 3, 1, 58, 50, 2, 300, 0, 0, 30], u: { each: 10 } },
  { k: ['olives', 'olive', 'kalamata'], a: 'Canned & Jars', n: [115, 0.8, 6.3, 10.7, 1.4, 0, 3.2, 2.5, 88, 3.3, 8, 0.9, 20, 4], d: 0.6, u: { each: 4 } },
  { k: ['capers'], a: 'Canned & Jars', n: [23, 2.4, 4.9, 0.9, 0.2, 0.4, 3.2, 7.5, 40, 1.7, 40, 4, 7, 33], d: 0.6 },
  { k: ['pickles', 'pickled cucumber', 'gherkins', 'pickled turnips', 'pickle'], a: 'Canned & Jars', n: [12, 0.5, 2.3, 0.3, 0.1, 1.1, 1, 2.4, 20, 0.3, 23, 1, 9, 4], u: { each: 35 } },

  // ---------- Grains, bread & pasta ----------
  { k: ['cooked rice', 'steamed rice', 'leftover rice'], a: 'Grains & Pasta', n: [130, 2.7, 28, 0.3, 0.1, 0, 0.4, 0, 10, 0.2, 35, 0, 0, 12], d: 0.66 },
  { k: ['brown rice'], a: 'Grains & Pasta', n: [370, 7.9, 77, 2.9, 0.6, 0.8, 3.5, 0, 23, 1.5, 223, 0, 0, 143], d: 0.8 },
  { k: ['basmati rice', 'jasmine rice', 'white rice', 'egyptian rice', 'short grain rice', 'arborio rice', 'risotto rice', 'rice'], a: 'Grains & Pasta', n: [365, 7.1, 80, 0.7, 0.2, 0.1, 1.3, 0, 28, 0.8, 115, 0, 0, 25], d: 0.8 },
  { k: ['spaghetti', 'penne', 'pasta', 'fusilli', 'linguine', 'macaroni', 'orzo', 'lasagne sheets', 'lasagna sheets', 'vermicelli', 'tagliatelle', 'rigatoni'], a: 'Grains & Pasta', n: [371, 13, 75, 1.5, 0.3, 2.7, 3.2, 0, 21, 1.3, 223, 0, 0, 53], d: 0.45, tags: ['gluten'] },
  { k: ['egg noodles', 'noodles', 'ramen noodles', 'udon'], a: 'Grains & Pasta', n: [384, 14, 71, 4.4, 0.9, 2, 3.3, 0.05, 35, 4.3, 233, 0, 17, 50], d: 0.45, u: { each: 75 }, tags: ['gluten', 'egg'] },
  { k: ['rice noodles', 'rice vermicelli', 'glass noodles'], a: 'Grains & Pasta', n: [364, 6, 80, 0.6, 0.2, 0, 1.6, 0.05, 18, 0.7, 30, 0, 0, 12], d: 0.45 },
  { k: ['bulgur', 'burghul', 'bulgar'], a: 'Grains & Pasta', n: [342, 12.3, 76, 1.3, 0.2, 0.4, 12.5, 0.04, 35, 2.5, 410, 0, 1, 164], d: 0.6, tags: ['gluten'] },
  { k: ['freekeh'], a: 'Grains & Pasta', n: [353, 13, 72, 2.5, 0.4, 1, 16, 0, 40, 4, 400, 0, 0, 140], d: 0.7, tags: ['gluten'] },
  { k: ['couscous'], a: 'Grains & Pasta', n: [376, 12.8, 77, 0.6, 0.1, 0, 5, 0.03, 24, 1.1, 166, 0, 0, 44], d: 0.73, tags: ['gluten'] },
  { k: ['quinoa'], a: 'Grains & Pasta', n: [368, 14, 64, 6, 0.7, 0, 7, 0.01, 47, 4.6, 563, 0, 1, 197], d: 0.72 },
  { k: ['rolled oats', 'oats', 'oatmeal', 'porridge oats'], a: 'Grains & Pasta', n: [379, 13, 68, 6.5, 1.1, 1, 10, 0.01, 52, 4.3, 362, 0, 0, 138], d: 0.38, tags: ['gluten'] },
  { k: ['granola'], a: 'Grains & Pasta', n: [471, 10, 64, 20, 4, 24, 7, 0.05, 80, 3, 500, 0.5, 0, 100], d: 0.5, tags: ['gluten', 'nuts'] },
  { k: ['whole wheat flour', 'wholemeal flour', 'brown flour'], a: 'Pantry', n: [340, 13, 72, 2.5, 0.4, 0.4, 10.7, 0, 34, 3.6, 363, 0, 1, 137], d: 0.51, tags: ['gluten'] },
  { k: ['all-purpose flour', 'plain flour', 'self-raising flour', 'bread flour', 'flour'], a: 'Pantry', n: [364, 10.3, 76, 1, 0.2, 0.3, 2.7, 0, 15, 1.2, 107, 0, 0, 22], d: 0.53, tags: ['gluten'] },
  { k: ['cornstarch', 'cornflour', 'corn starch'], a: 'Pantry', n: [381, 0.3, 91, 0.1, 0, 0, 0.9, 0.02, 2, 0.5, 3, 0, 0, 3], d: 0.53 },
  { k: ['breadcrumbs', 'panko'], a: 'Bakery', n: [395, 13, 72, 5.3, 1.2, 6, 4.5, 1.8, 183, 4.8, 196, 0, 0, 43], d: 0.45, tags: ['gluten'] },
  { k: ['pita', 'pitta', 'arabic bread', 'khubz', 'flatbread', 'markouk'], a: 'Bakery', n: [275, 9.1, 55.7, 1.2, 0.2, 1.3, 2.2, 1.3, 86, 2.6, 120, 0, 0, 26], u: { each: 60, slice: 60 }, tags: ['gluten'] },
  { k: ['tortilla', 'tortillas', 'wrap', 'wraps'], a: 'Bakery', n: [300, 8, 50, 7.5, 2.5, 2, 3, 1.3, 140, 3.5, 140, 0, 0, 20], u: { each: 45 }, tags: ['gluten'] },
  { k: ['sourdough', 'bread', 'toast', 'brown bread', 'wholemeal bread', 'baguette', 'bun', 'buns', 'burger buns'], a: 'Bakery', n: [265, 9, 49, 3.2, 0.7, 5, 2.7, 1.2, 144, 3.6, 115, 0, 0, 23], u: { slice: 35, each: 60 }, tags: ['gluten'] },

  // ---------- Legumes & soy ----------
  { k: ['dried chickpeas'], a: 'Pantry', n: [378, 20, 63, 6, 0.6, 11, 12, 0.06, 57, 4.3, 718, 4, 3, 79], d: 0.8 },
  { k: ['chickpeas', 'garbanzo beans', 'canned chickpeas', 'chickpea'], a: 'Canned & Jars', n: [164, 8.9, 27.4, 2.6, 0.3, 4.8, 7.6, 0.5, 49, 2.9, 291, 1.3, 1, 48], d: 0.68, u: { can: 240, each: 240 } },
  { k: ['cooked lentils'], a: 'Canned & Jars', n: [116, 9, 20, 0.4, 0.1, 1.8, 7.9, 0.01, 19, 3.3, 369, 1.5, 0, 36], d: 0.83, u: { can: 240 } },
  { k: ['red lentils', 'green lentils', 'brown lentils', 'lentils', 'split lentils'], a: 'Pantry', n: [352, 24.6, 63, 1.1, 0.2, 2, 10.7, 0.01, 35, 6.5, 677, 4.4, 2, 47], d: 0.8 },
  { k: ['black beans'], a: 'Canned & Jars', n: [132, 8.9, 23.7, 0.5, 0.1, 0.3, 8.7, 0.4, 27, 2.1, 355, 0, 0, 70], d: 0.72, u: { can: 240, each: 240 } },
  { k: ['kidney beans', 'red beans', 'white beans', 'cannellini beans', 'butter beans', 'fava beans', 'foul', 'ful medames', 'beans'], a: 'Canned & Jars', n: [127, 8.7, 22.8, 0.5, 0.1, 0.3, 6.4, 0.4, 35, 2.9, 405, 1.2, 0, 42], d: 0.72, u: { can: 240, each: 240 } },
  { k: ['tofu', 'firm tofu', 'silken tofu'], a: 'Other', n: [144, 17.3, 2.8, 8.7, 1.3, 0.6, 2.3, 0.04, 683, 2.7, 237, 0.2, 0, 58], u: { each: 400, block: 400 }, tags: ['soy'] },
  { k: ['edamame'], a: 'Frozen', n: [121, 11.9, 8.9, 5.2, 0.6, 2.2, 5.2, 0.02, 63, 2.3, 436, 6.1, 15, 64], d: 0.6, tags: ['soy'] },

  // ---------- Sweet & baking ----------
  { k: ['brown sugar'], a: 'Pantry', n: [380, 0.1, 98, 0, 0, 97, 0, 0.07, 83, 0.7, 133, 0, 0, 9], d: 0.9 },
  { k: ['icing sugar', 'powdered sugar', 'caster sugar', 'white sugar', 'sugar'], a: 'Pantry', n: [387, 0, 100, 0, 0, 100, 0, 0, 1, 0, 2, 0, 0, 0], d: 0.85 },
  { k: ['honey'], a: 'Pantry', n: [304, 0.3, 82, 0, 0, 82, 0.2, 0.01, 6, 0.4, 52, 0.5, 0, 2], d: 1.42 },
  { k: ['maple syrup', 'date syrup', 'dibs', 'agave', 'syrup'], a: 'Pantry', n: [260, 0, 67, 0.1, 0, 60, 0, 0.03, 102, 0.1, 212, 0, 0, 21], d: 1.32 },
  { k: ['dark chocolate', 'chocolate chips', 'chocolate'], a: 'Pantry', n: [598, 7.8, 46, 43, 24, 24, 11, 0.05, 73, 11.9, 715, 0, 2, 228], d: 0.6, tags: ['dairy'] },
  { k: ['cocoa powder', 'cacao powder', 'cocoa'], a: 'Pantry', n: [228, 19.6, 58, 13.7, 8, 1.8, 37, 0.05, 128, 13.9, 1524, 0, 0, 499], d: 0.42 },
  { k: ['baking powder'], a: 'Pantry', n: [53, 0, 28, 0, 0, 0, 0.2, 26.5, 5876, 11, 20, 0, 0, 27], d: 0.9 },
  { k: ['baking soda', 'bicarbonate of soda', 'bicarb'], a: 'Pantry', n: [0, 0, 0, 0, 0, 0, 0, 68, 0, 0, 0, 0, 0, 0], d: 0.96 },
  { k: ['dried yeast', 'instant yeast', 'yeast'], a: 'Pantry', n: [325, 40, 41, 7.6, 1, 0, 27, 0.13, 30, 2.2, 955, 0.3, 0, 54], d: 0.6, u: { sachet: 7, each: 7 } },
  { k: ['vanilla extract', 'vanilla essence', 'vanilla'], a: 'Pantry', n: [288, 0, 12.7, 0.1, 0, 12.7, 0, 0.02, 11, 0.1, 148, 0, 0, 12], d: 0.88 },
  { k: ['rose water', 'orange blossom water', 'blossom water'], a: 'Pantry', n: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], d: 1 },

  // ---------- Salt, pepper & spices ----------
  { k: ['sea salt', 'kosher salt', 'salt'], a: 'Spices', n: [0, 0, 0, 0, 0, 0, 0, 97, 24, 0.3, 8, 0, 0, 1], d: 1.22 },
  { k: ['black pepper', 'white pepper', 'pepper', 'peppercorns'], a: 'Spices', n: [251, 10, 64, 3.3, 1.4, 0.6, 25, 0.05, 443, 9.7, 1329, 0, 27, 171], d: 0.46 },
  { k: ['cumin', 'ground cumin', 'cumin seeds'], a: 'Spices', n: [375, 17.8, 44, 22, 1.5, 2.3, 10.5, 0.42, 931, 66, 1788, 7.7, 64, 366], d: 0.43 },
  { k: ['smoked paprika', 'paprika', 'sweet paprika'], a: 'Spices', n: [282, 14, 54, 13, 2, 10, 35, 0.17, 229, 21, 2280, 0.9, 2463, 178], d: 0.46 },
  { k: ['turmeric', 'ground turmeric'], a: 'Spices', n: [312, 9.7, 67, 3.3, 1.8, 3.2, 22.7, 0.07, 168, 55, 2080, 0.7, 0, 208], d: 0.45 },
  { k: ['cinnamon', 'ground cinnamon', 'cinnamon stick'], a: 'Spices', n: [247, 4, 81, 1.2, 0.3, 2.2, 53, 0.03, 1002, 8.3, 431, 3.8, 15, 60], d: 0.53, u: { each: 3 } },
  { k: ['seven spice', '7 spice', 'baharat', 'allspice', 'garam masala', 'curry powder', 'chili powder', 'chilli powder', 'chili flakes', 'chilli flakes', 'red pepper flakes', 'cayenne', 'zaatar', "za'atar", 'zaatar', 'sumac', 'oregano', 'dried oregano', 'thyme', 'dried thyme', 'rosemary', 'dried mint', 'coriander powder', 'ground coriander', 'coriander seeds', 'cardamom', 'nutmeg', 'cloves', 'ginger powder', 'ground ginger', 'garlic powder', 'onion powder', 'italian seasoning', 'mixed herbs', 'bay leaf', 'bay leaves', 'saffron', 'fennel seeds', 'mustard seeds', 'shawarma spice', 'taco seasoning', 'dried lime', 'dried limes', 'loomi', 'machboos spice', 'biryani masala', 'ras el hanout', 'fajita seasoning', 'aleppo pepper', 'mixed spice', 'spice', 'spices', 'seasoning'], a: 'Spices', n: SPICE, d: 0.45, u: { each: 0.5 } },

  // ---------- Nuts & seeds ----------
  { k: ['almonds', 'almond', 'flaked almonds', 'ground almonds', 'almond flour'], a: 'Nuts & Seeds', n: [579, 21, 22, 50, 3.8, 4.4, 12.5, 0, 269, 3.7, 733, 0, 0, 270], d: 0.6, tags: ['nuts'] },
  { k: ['walnuts', 'walnut'], a: 'Nuts & Seeds', n: [654, 15, 14, 65, 6, 2.6, 6.7, 0, 98, 2.9, 441, 1.3, 1, 158], d: 0.5, tags: ['nuts'] },
  { k: ['pine nuts', 'pine nut', 'snobar'], a: 'Nuts & Seeds', n: [673, 13.7, 13, 68, 4.9, 3.6, 3.7, 0, 16, 5.5, 597, 0.8, 1, 251], d: 0.55, tags: ['nuts'] },
  { k: ['cashews', 'cashew', 'pistachios', 'pistachio', 'hazelnuts', 'mixed nuts', 'nuts'], a: 'Nuts & Seeds', n: [560, 19, 28, 45, 6.5, 6, 6, 0.02, 80, 5, 800, 3, 10, 200], d: 0.55, tags: ['nuts'] },
  { k: ['peanuts', 'peanut'], a: 'Nuts & Seeds', n: [567, 25.8, 16, 49, 6.3, 4, 8.5, 0.04, 92, 4.6, 705, 0, 0, 168], d: 0.6, tags: ['nuts'] },
  { k: ['sesame seeds', 'sesame'], a: 'Nuts & Seeds', n: [573, 17.7, 23.5, 49.7, 7, 0.3, 11.8, 0.03, 975, 14.6, 468, 0, 0, 351], d: 0.6, tags: ['sesame'] },
  { k: ['chia seeds', 'chia', 'flaxseed', 'flax seeds', 'linseed', 'pumpkin seeds', 'sunflower seeds', 'seeds'], a: 'Nuts & Seeds', n: [520, 20, 30, 38, 4, 1, 25, 0.03, 400, 6, 600, 1, 1, 380], d: 0.65 },

  // ---------- Produce: veg ----------
  { k: ['garlic', 'garlic cloves', 'garlic clove'], a: 'Produce', n: [149, 6.4, 33, 0.5, 0.1, 1, 2.1, 0.04, 181, 1.7, 401, 31, 0, 25], d: 0.6, u: { each: 5, clove: 5, head: 50 } },
  { k: ['ginger', 'fresh ginger', 'ginger root'], a: 'Produce', n: [80, 1.8, 17.8, 0.8, 0.2, 1.7, 2, 0.03, 16, 0.6, 415, 5, 0, 43], d: 0.5, u: { each: 15, thumb: 15, piece: 15 } },
  { k: ['spring onion', 'spring onions', 'green onion', 'green onions', 'scallion', 'scallions'], a: 'Produce', n: [32, 1.8, 7.3, 0.2, 0, 2.3, 2.6, 0.04, 72, 1.5, 276, 18.8, 50, 20], d: 0.4, u: { each: 15, bunch: 100 } },
  { k: ['shallot', 'shallots'], a: 'Produce', n: [72, 2.5, 16.8, 0.1, 0, 7.9, 3.2, 0.03, 37, 1.2, 334, 8, 1, 21], d: 0.65, u: { each: 30 } },
  { k: ['red onion', 'white onion', 'yellow onion', 'brown onion', 'onion', 'onions'], a: 'Produce', n: [40, 1.1, 9.3, 0.1, 0, 4.2, 1.7, 0.01, 23, 0.2, 146, 7.4, 0, 10], d: 0.65, u: { each: 150 } },
  { k: ['cherry tomatoes', 'cherry tomato', 'grape tomatoes'], a: 'Produce', n: [18, 0.9, 3.9, 0.2, 0, 2.6, 1.2, 0.01, 10, 0.3, 237, 13.7, 42, 11], d: 0.65, u: { each: 15, punnet: 250 } },
  { k: ['tomato', 'tomatoes'], a: 'Produce', n: [18, 0.9, 3.9, 0.2, 0, 2.6, 1.2, 0.01, 10, 0.3, 237, 13.7, 42, 11], d: 0.75, u: { each: 120 } },
  { k: ['cucumber', 'cucumbers'], a: 'Produce', n: [15, 0.7, 3.6, 0.1, 0, 1.7, 0.5, 0, 16, 0.3, 147, 2.8, 5, 13], d: 0.55, u: { each: 150 } },
  { k: ['romaine', 'lettuce', 'iceberg', 'little gem', 'salad leaves', 'mixed greens', 'mixed salad'], a: 'Produce', n: [17, 1.2, 3.3, 0.3, 0, 1.2, 2.1, 0.02, 33, 1, 247, 4, 436, 14], d: 0.2, u: { each: 400, head: 400, handful: 25 } },
  { k: ['baby spinach', 'spinach'], a: 'Produce', n: [23, 2.9, 3.6, 0.4, 0.1, 0.4, 2.2, 0.2, 99, 2.7, 558, 28, 469, 79], d: 0.13, u: { bunch: 250, handful: 30 } },
  { k: ['kale', 'chard', 'swiss chard', 'silverbeet'], a: 'Produce', n: [35, 2.9, 4.4, 1.5, 0.2, 1, 4.1, 0.13, 254, 1.6, 348, 93, 241, 33], d: 0.1, u: { bunch: 250, handful: 30 } },
  { k: ['rocket', 'arugula', 'watercress'], a: 'Produce', n: [25, 2.6, 3.7, 0.7, 0.1, 2, 1.6, 0.07, 160, 1.5, 369, 15, 119, 47], d: 0.08, u: { bunch: 100, handful: 20 } },
  { k: ['flat-leaf parsley', 'flat leaf parsley', 'parsley'], a: 'Produce', n: [36, 3, 6.3, 0.8, 0.1, 0.9, 3.3, 0.14, 138, 6.2, 554, 133, 421, 50], d: 0.25, u: { bunch: 60, handful: 15, sprig: 1 } },
  { k: ['coriander leaves', 'fresh coriander', 'cilantro', 'coriander'], a: 'Produce', n: [23, 2.1, 3.7, 0.5, 0, 0.9, 2.8, 0.12, 67, 1.8, 521, 27, 337, 26], d: 0.1, u: { bunch: 50, handful: 10, sprig: 1 } },
  { k: ['fresh mint', 'mint leaves', 'mint'], a: 'Produce', n: [70, 3.8, 15, 0.9, 0.2, 0, 8, 0.08, 243, 5, 569, 31.8, 212, 80], d: 0.1, u: { bunch: 30, handful: 8, sprig: 1 } },
  { k: ['fresh basil', 'basil', 'basil leaves'], a: 'Produce', n: [23, 3.2, 2.7, 0.6, 0, 0.3, 1.6, 0.01, 177, 3.2, 295, 18, 264, 64], d: 0.1, u: { bunch: 30, handful: 8, sprig: 1 } },
  { k: ['dill', 'fresh dill', 'chives', 'fresh thyme', 'fresh rosemary', 'fresh herbs'], a: 'Produce', n: [43, 3.5, 7, 1.1, 0.1, 0, 2.1, 0.15, 208, 6.6, 738, 85, 386, 55], d: 0.1, u: { bunch: 30, handful: 8, sprig: 1 } },
  { k: ['lemon juice', 'juice of lemon', 'lemon, juiced', 'lime juice'], a: 'Produce', n: [22, 0.4, 6.9, 0.2, 0, 2.5, 0.3, 0, 6, 0.1, 103, 38.7, 1, 6], d: 1.03, u: { each: 45 } },
  { k: ['lemon zest', 'lemon', 'lemons'], a: 'Produce', n: [29, 1.1, 9.3, 0.3, 0, 2.5, 2.8, 0, 26, 0.6, 138, 53, 1, 8], u: { each: 100 } },
  { k: ['lime', 'limes', 'lime zest'], a: 'Produce', n: [30, 0.7, 10.5, 0.2, 0, 1.7, 2.8, 0, 33, 0.6, 102, 29, 2, 6], u: { each: 65 } },
  { k: ['carrot', 'carrots'], a: 'Produce', n: [41, 0.9, 9.6, 0.2, 0, 4.7, 2.8, 0.17, 33, 0.3, 320, 5.9, 835, 12], d: 0.55, u: { each: 70 } },
  { k: ['sweet potato', 'sweet potatoes'], a: 'Produce', n: [86, 1.6, 20, 0.1, 0, 4.2, 3, 0.14, 30, 0.6, 337, 2.4, 709, 25], d: 0.6, u: { each: 200 } },
  { k: ['potato', 'potatoes', 'baby potatoes', 'new potatoes'], a: 'Produce', n: [77, 2, 17.5, 0.1, 0, 0.8, 2.2, 0.02, 12, 0.8, 425, 19.7, 0, 23], d: 0.65, u: { each: 200 } },
  { k: ['red pepper', 'yellow pepper', 'bell pepper', 'bell peppers', 'capsicum', 'peppers', 'sweet pepper'], a: 'Produce', n: [31, 1, 6, 0.3, 0, 4.2, 2.1, 0.01, 7, 0.4, 211, 128, 157, 12], d: 0.5, u: { each: 150 } },
  { k: ['green pepper', 'green bell pepper'], a: 'Produce', n: [20, 0.9, 4.6, 0.2, 0, 2.4, 1.7, 0, 10, 0.3, 175, 80, 18, 10], d: 0.5, u: { each: 150 } },
  { k: ['green chili', 'green chilli', 'red chili', 'red chilli', 'jalapeno', 'jalapeño', 'chili', 'chilli', 'chilies', 'chillies', 'bird eye chili'], a: 'Produce', n: [40, 1.9, 8.8, 0.4, 0, 5.3, 1.5, 0.02, 14, 1, 322, 144, 48, 23], d: 0.5, u: { each: 15 } },
  { k: ['zucchini', 'courgette', 'courgettes', 'koosa', 'kousa'], a: 'Produce', n: [17, 1.2, 3.1, 0.3, 0.1, 2.5, 1, 0.02, 16, 0.4, 261, 17.9, 10, 18], d: 0.5, u: { each: 200 } },
  { k: ['eggplant', 'aubergine', 'aubergines', 'eggplants'], a: 'Produce', n: [25, 1, 5.9, 0.2, 0, 3.5, 3, 0, 9, 0.2, 229, 2.2, 1, 14], d: 0.35, u: { each: 450 } },
  { k: ['broccoli', 'tenderstem broccoli'], a: 'Produce', n: [34, 2.8, 6.6, 0.4, 0, 1.7, 2.6, 0.08, 47, 0.7, 316, 89, 31, 21], d: 0.38, u: { each: 300, head: 300 } },
  { k: ['cauliflower'], a: 'Produce', n: [25, 1.9, 5, 0.3, 0.1, 1.9, 2, 0.08, 22, 0.4, 299, 48, 0, 15], d: 0.45, u: { each: 600, head: 600 } },
  { k: ['mushrooms', 'mushroom', 'button mushrooms', 'chestnut mushrooms', 'portobello'], a: 'Produce', n: [22, 3.1, 3.3, 0.3, 0, 2, 1, 0.01, 3, 0.5, 318, 2.1, 0, 9], d: 0.3, u: { each: 18 } },
  { k: ['red cabbage', 'white cabbage', 'cabbage'], a: 'Produce', n: [25, 1.3, 5.8, 0.1, 0, 3.2, 2.5, 0.05, 40, 0.5, 170, 36.6, 5, 12], d: 0.38, u: { each: 900, head: 900 } },
  { k: ['green beans', 'string beans', 'fine beans'], a: 'Produce', n: [31, 1.8, 7, 0.2, 0, 3.3, 2.7, 0.02, 37, 1, 211, 12.2, 35, 25], d: 0.45 },
  { k: ['frozen peas', 'peas', 'garden peas'], a: 'Frozen', n: [77, 5.2, 13.6, 0.4, 0.1, 4.7, 4.5, 0.27, 22, 1.5, 153, 18, 105, 22], d: 0.6 },
  { k: ['sweetcorn', 'corn kernels', 'corn', 'sweet corn'], a: 'Frozen', n: [86, 3.3, 19, 1.4, 0.3, 6.3, 2, 0.04, 2, 0.5, 270, 6.8, 9, 37], d: 0.6, u: { can: 200, each: 150 } },
  { k: ['mixed vegetables', 'frozen vegetables', 'stir fry vegetables', 'vegetables'], a: 'Frozen', n: [65, 2.9, 13, 0.5, 0.1, 3, 4, 0.1, 25, 0.8, 200, 10, 300, 20], d: 0.55 },
  { k: ['celery', 'celery stalk', 'celery sticks'], a: 'Produce', n: [14, 0.7, 3, 0.2, 0, 1.3, 1.6, 0.2, 40, 0.2, 260, 3.1, 22, 11], d: 0.5, u: { each: 40, stalk: 40 } },
  { k: ['radish', 'radishes'], a: 'Produce', n: [16, 0.7, 3.4, 0.1, 0, 1.9, 1.6, 0.1, 25, 0.3, 233, 14.8, 0, 10], u: { each: 10 } },
  { k: ['avocado', 'avocados'], a: 'Produce', n: [160, 2, 8.5, 14.7, 2.1, 0.7, 6.7, 0.02, 12, 0.6, 485, 10, 7, 29], d: 0.6, u: { each: 150 } },
  { k: ['pumpkin', 'butternut squash', 'squash'], a: 'Produce', n: [45, 1, 11.7, 0.1, 0, 2.2, 2, 0.01, 48, 0.7, 352, 21, 532, 34], d: 0.55, u: { each: 1000 } },
  { k: ['okra', 'bamia'], a: 'Produce', n: [33, 1.9, 7.5, 0.2, 0, 1.5, 3.2, 0.02, 82, 0.6, 299, 23, 36, 57], d: 0.5 },

  // ---------- Produce: fruit ----------
  { k: ['banana', 'bananas'], a: 'Produce', n: [89, 1.1, 22.8, 0.3, 0.1, 12.2, 2.6, 0, 5, 0.3, 358, 8.7, 3, 27], d: 0.6, u: { each: 118 } },
  { k: ['apple', 'apples'], a: 'Produce', n: [52, 0.3, 13.8, 0.2, 0, 10.4, 2.4, 0, 6, 0.1, 107, 4.6, 3, 5], d: 0.55, u: { each: 180 } },
  { k: ['strawberries', 'strawberry'], a: 'Produce', n: [32, 0.7, 7.7, 0.3, 0, 4.9, 2, 0, 16, 0.4, 153, 58.8, 1, 13], d: 0.6, u: { each: 12, punnet: 250 } },
  { k: ['blueberries', 'raspberries', 'mixed berries', 'berries', 'frozen berries', 'blackberries'], a: 'Produce', n: [52, 0.9, 12.5, 0.4, 0, 7.5, 4, 0, 18, 0.5, 120, 20, 3, 15], d: 0.6, u: { punnet: 150, handful: 40 } },
  { k: ['mango', 'mangoes'], a: 'Produce', n: [60, 0.8, 15, 0.4, 0.1, 13.7, 1.6, 0, 11, 0.2, 168, 36.4, 54, 10], d: 0.65, u: { each: 200 } },
  { k: ['orange', 'oranges', 'orange juice'], a: 'Produce', n: [47, 0.9, 11.8, 0.1, 0, 9.4, 2.4, 0, 40, 0.1, 181, 53.2, 11, 10], d: 1.04, u: { each: 130 } },
  { k: ['pomegranate seeds', 'pomegranate', 'pomegranate arils'], a: 'Produce', n: [83, 1.7, 18.7, 1.2, 0.1, 13.7, 4, 0, 10, 0.3, 236, 10.2, 0, 12], d: 0.73, u: { each: 180 } },
  { k: ['medjool dates', 'dates', 'date'], a: 'Produce', n: [277, 1.8, 75, 0.2, 0, 66, 6.7, 0, 64, 0.9, 696, 0, 7, 54], d: 0.6, u: { each: 20 } },
  { k: ['raisins', 'sultanas', 'dried cranberries', 'dried apricots', 'dried fruit'], a: 'Pantry', n: [299, 3.1, 79, 0.5, 0.1, 59, 3.7, 0.03, 50, 1.9, 749, 2.3, 0, 32], d: 0.66 },
  { k: ['grapes'], a: 'Produce', n: [69, 0.7, 18, 0.2, 0.1, 15.5, 0.9, 0, 10, 0.4, 191, 3.2, 3, 7], d: 0.6 },
  { k: ['pineapple'], a: 'Produce', n: [50, 0.5, 13, 0.1, 0, 10, 1.4, 0, 13, 0.3, 109, 47.8, 3, 12], d: 0.65 },
  { k: ['watermelon', 'melon'], a: 'Produce', n: [30, 0.6, 7.6, 0.2, 0, 6.2, 0.4, 0, 7, 0.2, 112, 8.1, 28, 10], d: 0.6 },

  // ---------- Drinks / zero ----------
  { k: ['coffee', 'espresso'], a: 'Drinks', n: [2, 0.1, 0, 0, 0, 0, 0, 0.01, 2, 0, 49, 0, 0, 3], d: 1 },
  { k: ['water', 'ice', 'boiling water', 'cold water', 'warm water', 'hot water', 'ice cubes', 'sparkling water'], a: 'Other', n: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], d: 1 }
];

// Fallback weights (g) for count-style units when a food has no specific value
export const DEFAULT_UNIT_G: Record<string, number> = {
  each: 100, clove: 5, slice: 30, can: 400, bunch: 50, handful: 30, pinch: 0.36, dash: 0.6,
  sprig: 1, stalk: 40, head: 500, fillet: 150, sachet: 7, scoop: 30, thumb: 15, piece: 50,
  punnet: 250, block: 400, packet: 250, jar: 300, drop: 0.05, knob: 15, splash: 10
};

// Reference intakes (adult, UK/EU RI) used for % values
export const RI = {
  kcal: 2000, protein: 50, carbs: 260, fat: 70, satFat: 20, sugar: 90, fibre: 30, salt: 6,
  calcium: 800, iron: 14, potassium: 2000, vitC: 80, vitA: 800, magnesium: 375
};
