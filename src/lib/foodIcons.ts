import { matchFood } from './ingredients';
import type { Recipe } from '../types';
import { hasSavoraIcon } from '../components/SavoraIcons';

/** Ingredient → Savora icon (keyword rules first, then the ingredient's aisle). */
const RULES: [RegExp, string][] = [
  [/eggplant|aubergine/, 'eggplant'],
  [/noodle|vermicelli/, 'noodles'],
  [/coconut/, 'coconut'],
  [/peanut/, 'nut'],
  [/black pepper|white pepper|peppercorn|pepper flakes/, 'salt'],
  [/sweet potato/, 'potato'],
  [/salmon|tuna|fish|cod|sea bass|hammour|tilapia/, 'fish'],
  [/prawn|shrimp/, 'shrimp'],
  [/chicken|turkey/, 'drumstick'],
  [/bacon/, 'meat'],
  [/lamb/, 'meat'],
  [/beef|steak|mince|kafta|meat|sausage/, 'steak'],
  [/egg/, 'egg'],
  [/milk|cream(?! cheese)/, 'milk'],
  [/cheese|feta|halloumi|parmesan|mozzarella|cheddar|ricotta|akkawi/, 'cheese'],
  [/yogurt|yoghurt|labneh|laban|skyr/, 'yogurt'],
  [/butter|ghee/, 'butter'],
  [/pita|bread|sourdough|tortilla|wrap|bun|baguette|toast|flatbread/, 'bread'],
  [/rice/, 'rice'],
  [/spaghetti|penne|pasta|fusilli|linguine|lasagne|tagliatelle|macaroni|orzo/, 'pasta'],
  [/noodle|vermicelli/, 'noodles'],
  [/oat|granola|muesli|flour|bulgur|freekeh|couscous|quinoa|wheat|breadcrumb|panko|cornstarch|cornflour/, 'wheat'],
  [/sweet potato/, 'potato'],
  [/potato/, 'potato'],
  [/onion|shallot|scallion/, 'onion'],
  [/garlic/, 'garlic'],
  [/ginger/, 'herb'],
  [/cherry tomato|tomato|passata|marinara/, 'tomato'],
  [/carrot/, 'carrot'],
  [/chili|chilli|jalape|harissa|sriracha|hot sauce/, 'chili'],
  [/pepper(?!corn)|capsicum/, 'pepper'],
  [/cucumber|pickle|gherkin|zucchini|courgette/, 'cucumber'],
  [/lettuce|romaine|spinach|kale|chard|cabbage|rocket|arugula|salad leaves|greens/, 'greens'],
  [/broccoli|cauliflower/, 'broccoli'],
  [/mushroom/, 'mushroom'],
  [/corn/, 'corn'],
  [/avocado/, 'avocado'],
  [/eggplant|aubergine/, 'eggplant'],
  [/lemon|lime/, 'lemon'],
  [/apple/, 'apple'],
  [/pear/, 'apple'],
  [/banana/, 'banana'],
  [/strawberr|raspberr/, 'strawberry'],
  [/berr/, 'berries'],
  [/mango/, 'mango'],
  [/orange/, 'lemon'],
  [/grape|raisin|sultana/, 'grapes'],
  [/pineapple/, 'mango'],
  [/coconut/, 'coconut'],
  [/pomegranate|cranberr/, 'berries'],
  [/date/, 'nut'],
  [/melon/, 'mango'],
  [/olive/, 'olive'],
  [/peanut/, 'nut'],
  [/almond|walnut|pine nut|cashew|pistachio|hazelnut|nut/, 'nut'],
  [/sesame|tahini|chia|flax|seed/, 'seed'],
  [/chickpea|lentil|bean|foul|fava|edamame|hummus/, 'beans'],
  [/honey|syrup|molasses|dibs/, 'honey'],
  [/chocolate|cocoa|cacao/, 'chocolate'],
  [/sugar/, 'sugar'],
  [/salt/, 'salt'],
  [/parsley|coriander|cilantro|mint|basil|dill|herb|thyme|rosemary|oregano|bay/, 'herb'],
  [/oil/, 'oil'],
  [/stock|broth|bouillon/, 'soup'],
  [/water|ice/, 'water'],
  [/coffee|espresso/, 'coffee'],
  [/tofu/, 'tofu'],
  [/cumin|paprika|turmeric|cinnamon|spice|masala|curry|seasoning|zaatar|za'atar|sumac|cardamom|nutmeg|clove|saffron|baharat|loomi|ras el/, 'spice'],
  [/sauce|vinegar|mustard|ketchup|mayo|paste|pesto/, 'sauce']
];

const AISLE_ICON: Record<string, string> = {"Produce": "greens", "Meat & Fish": "steak", "Dairy & Eggs": "milk", "Bakery": "bread", "Grains & Pasta": "wheat", "Canned & Jars": "sauce", "Pantry": "spice", "Spices": "spice", "Nuts & Seeds": "nut", "Frozen": "ice", "Drinks": "drink", "Other": "basket"};

const memo = new Map<string, string>();
export function foodIcon(name: string): string {
  const k = name.toLowerCase();
  const hit = memo.get(k);
  if (hit) return hit;
  let ic = RULES.find(([re]) => re.test(k))?.[1];
  if (!ic) ic = AISLE_ICON[matchFood(name)?.a ?? 'Other'];
  memo.set(k, ic);
  return ic;
}
export function aisleIcon(aisle: string): string { return AISLE_ICON[aisle] ?? 'basket'; }

/** Older data (Mise, backups, earlier versions) stored emoji: map them to the closest Savora icon. */
const LEGACY: Record<string, string> = {
  '🍳': 'pan', '🥣': 'bowl', '🥞': 'pancakes', '🥚': 'egg', '🫒': 'olive', '🥑': 'avocado', '🫘': 'beans', '🥗': 'salad', '🌿': 'herb',
  '🥒': 'cucumber', '🧀': 'cheese', '🍲': 'soup', '🌯': 'wrap', '🍢': 'skewer', '🧅': 'onion', '🥔': 'potato', '🍗': 'drumstick', '🐟': 'fish',
  '🥢': 'noodles', '🍛': 'curry', '🍝': 'pasta', '🧆': 'falafel', '🌶️': 'chili', '🌶': 'chili', '🌮': 'taco', '🥙': 'pita', '🍱': 'bento',
  '🥘': 'casserole', '🫓': 'flatbread', '🟤': 'cookie', '🍓': 'strawberry', '🍌': 'banana', '🍅': 'tomato', '🍜': 'noodles', '🥭': 'mango',
  '🥜': 'nut', '🧁': 'cupcake', '🫐': 'berries', '🍞': 'bread', '🥬': 'greens', '🍏': 'apple', '🍎': 'apple', '🍚': 'rice', '🫛': 'peas',
  '🎃': 'pumpkin', '🥧': 'pie', '🍆': 'eggplant', '🌾': 'wheat', '🥩': 'steak', '🍤': 'shrimp', '🫑': 'pepper', '🐠': 'fish', '🍔': 'burger',
  '🇬🇷': 'salad', '🍄': 'mushroom', '🫕': 'pot', '🍖': 'meat', '🥦': 'broccoli', '🍮': 'pudding', '🍫': 'chocolate', '🍋': 'lemon',
  '🍽️': 'plate', '🍽': 'plate', '🍕': 'flatbread', '🥪': 'sandwich', '🍰': 'pie', '🍪': 'cookie', '🍵': 'coffee', '🍤️': 'shrimp',
  '⚡': 'bolt', '📦': 'box', '🎉': 'party', '📁': 'folder', '⭐': 'star', '❤️': 'heart', '🥕': 'carrot', '🥤': 'drink'
};

const TITLE_RULES: [RegExp, string][] = [
  [/salad|tabbouleh|fattoush/, 'salad'], [/soup|shorba|broth/, 'soup'], [/curry|dal|daal|korma|masala/, 'curry'],
  [/pasta|spaghetti|penne|lasagne|mac/, 'pasta'], [/noodle|ramen|pad thai|stir.?fry/, 'noodles'], [/rice|biryani|risotto|pilaf|machboos/, 'rice'],
  [/pancake|waffle|crepe/, 'pancakes'], [/egg|omelet|shakshuka|frittata/, 'pan'], [/wrap|burrito|shawarma/, 'wrap'], [/taco/, 'taco'],
  [/burger/, 'burger'], [/sandwich|toast/, 'sandwich'], [/fish|salmon|cod|tuna/, 'fish'], [/prawn|shrimp/, 'shrimp'],
  [/chicken/, 'drumstick'], [/beef|steak|kofta|kafta|lamb/, 'steak'], [/oat|porridge|granola|yog/, 'bowl'], [/smoothie|juice|shake/, 'drink'],
  [/cake|muffin|cupcake/, 'cupcake'], [/cookie|bites|balls/, 'cookie'], [/pie|tart/, 'pie'], [/bread|flatbread|manakish/, 'flatbread'],
  [/stew|tagine|casserole/, 'casserole'], [/skewer|kebab|kabab/, 'skewer']
];

export function legacyIcon(value?: string | null): string | null {
  if (!value) return null;
  if (hasSavoraIcon(value)) return value;
  return LEGACY[value] ?? LEGACY[value.replace(/\uFE0F/g, '')] ?? null;
}

/** The icon for a recipe's cover (when it has no photo). */
export function recipeIcon(r: Pick<Recipe, 'emoji' | 'title'>): string {
  const fromField = legacyIcon(r.emoji);
  if (fromField) return fromField;
  const t = (r.title || '').toLowerCase();
  return TITLE_RULES.find(([re]) => re.test(t))?.[1] ?? 'plate';
}
