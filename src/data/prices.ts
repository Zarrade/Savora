import type { Aisle } from './nutritionDb';

/*
 * Estimated UAE supermarket prices (mid-range, e.g. Carrefour / Lulu / Union Coop),
 * in AED per kg (liquids ≈ per litre). Keyed by the food's first name in nutritionDb.
 * These are rough averages for estimating — you can set your own prices in the app.
 */
export const PRICES: Record<string, number> = {
  // Meat & fish
  'chicken breast': 32, 'chicken thigh': 28, 'chicken wings': 22, 'whole chicken': 17,
  'turkey mince': 45, 'turkey slices': 70, 'beef mince': 42, 'beef steak': 65,
  'lamb mince': 55, 'lamb': 60, 'pork loin': 55, 'bacon': 90, 'sausage': 45,
  'salmon': 85, 'white fish': 45, 'shrimp': 55, 'tuna': 55,
  // Dairy & eggs
  'egg white': 30, 'egg': 13, 'halloumi': 60, 'feta': 40, 'cheddar': 50, 'parmesan': 130,
  'mozzarella': 45, 'cream cheese': 40, 'ricotta': 45, 'cottage cheese': 30, 'labneh': 25,
  'greek yogurt': 25, 'yogurt': 9, 'sour cream': 30, 'heavy cream': 25, 'butter': 45,
  'almond milk': 15, 'oat milk': 16, 'milk': 7, 'whey protein': 130,
  'garlic sauce': 30, 'hummus': 25,
  // Pantry, sauces, cans
  'olive oil': 38, 'vegetable oil': 10, 'tahini': 30, 'peanut butter': 30, 'mayonnaise': 20,
  'pesto': 70, 'soy sauce': 20, 'vinegar': 8, 'dijon mustard': 35, 'ketchup': 12, 'sriracha': 30,
  'green curry paste': 60, 'fish sauce': 25, 'harissa': 50, 'pomegranate molasses': 30,
  'tomato paste': 15, 'passata': 8, 'canned tomatoes': 10, 'coconut milk': 15,
  'chicken stock': 4, 'stock cube': 60, 'olives': 25, 'capers': 60, 'pickles': 12,
  // Grains & bakery
  'cooked rice': 4, 'brown rice': 12, 'basmati rice': 10, 'spaghetti': 10, 'egg noodles': 15,
  'rice noodles': 18, 'bulgur': 9, 'freekeh': 25, 'couscous': 12, 'quinoa': 30, 'rolled oats': 12,
  'granola': 35, 'whole wheat flour': 6, 'all-purpose flour': 5, 'cornstarch': 12,
  'breadcrumbs': 15, 'pita': 5, 'tortilla': 20, 'sourdough': 12,
  // Legumes
  'dried chickpeas': 9, 'chickpeas': 14, 'cooked lentils': 14, 'red lentils': 10,
  'black beans': 15, 'kidney beans': 14, 'tofu': 25, 'edamame': 25,
  // Sweet & baking
  'brown sugar': 8, 'icing sugar': 5, 'honey': 50, 'maple syrup': 80, 'dark chocolate': 60,
  'cocoa powder': 50, 'baking powder': 30, 'baking soda': 15, 'dried yeast': 50,
  'vanilla extract': 300, 'rose water': 15,
  // Spices
  'sea salt': 2, 'black pepper': 60, 'cumin': 40, 'smoked paprika': 40, 'turmeric': 30,
  'cinnamon': 50, 'seven spice': 60,
  // Nuts & seeds
  'almonds': 50, 'walnuts': 55, 'pine nuts': 220, 'cashews': 55, 'peanuts': 25,
  'sesame seeds': 25, 'chia seeds': 40,
  // Produce
  'garlic': 15, 'ginger': 12, 'spring onion': 12, 'shallot': 15, 'red onion': 4,
  'cherry tomatoes': 15, 'tomato': 6, 'cucumber': 6, 'romaine': 12, 'baby spinach': 18,
  'kale': 25, 'rocket': 30, 'flat-leaf parsley': 17, 'coriander leaves': 17, 'fresh mint': 25,
  'fresh basil': 60, 'dill': 40, 'lemon juice': 10, 'lemon zest': 8, 'lime': 10, 'carrot': 5,
  'sweet potato': 9, 'potato': 5, 'red pepper': 12, 'green pepper': 9, 'green chili': 15,
  'zucchini': 8, 'eggplant': 7, 'broccoli': 15, 'cauliflower': 9, 'mushrooms': 20,
  'red cabbage': 6, 'green beans': 14, 'frozen peas': 12, 'sweetcorn': 12,
  'mixed vegetables': 12, 'celery': 10, 'radish': 10, 'avocado': 22, 'pumpkin': 8, 'okra': 15,
  'banana': 6, 'apple': 9, 'strawberries': 25, 'blueberries': 45, 'mango': 12, 'orange': 6,
  'pomegranate seeds': 15, 'medjool dates': 30, 'raisins': 25, 'grapes': 15, 'pineapple': 8,
  'watermelon': 4,
  // Drinks
  'coffee': 80, 'water': 0
};

/** Fallback AED/kg by aisle when an ingredient isn't in the table. */
export const AISLE_PRICE: Record<Aisle, number> = {
  'Produce': 12, 'Meat & Fish': 45, 'Dairy & Eggs': 30, 'Bakery': 12, 'Grains & Pasta': 12,
  'Canned & Jars': 18, 'Pantry': 25, 'Spices': 50, 'Nuts & Seeds': 50, 'Frozen': 15,
  'Drinks': 10, 'Other': 20
};
