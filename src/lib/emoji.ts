import { matchFood } from './ingredients';

/** Ingredient emoji bullets (Albo-style ingredient lists). */
const RULES: [RegExp, string][] = [
  [/eggplant|aubergine/, '🍆'], [/noodle|vermicelli/, '🍜'], [/coconut/, '🥥'], [/peanut/, '🥜'],
  [/black pepper|white pepper|peppercorn|pepper flakes/, '🧂'], [/sweet potato/, '🍠'],
  [/salmon|tuna|fish|cod|sea bass|hammour|tilapia/, '🐟'], [/prawn|shrimp/, '🦐'],
  [/chicken|turkey/, '🍗'], [/bacon/, '🥓'], [/lamb/, '🍖'], [/beef|steak|mince|kafta|meat|sausage/, '🥩'],
  [/egg/, '🥚'], [/milk|cream(?! cheese)/, '🥛'], [/cheese|feta|halloumi|parmesan|mozzarella|cheddar|ricotta|akkawi/, '🧀'],
  [/yogurt|yoghurt|labneh|laban|skyr/, '🥣'], [/butter|ghee/, '🧈'],
  [/pita|bread|sourdough|tortilla|wrap|bun|baguette|toast|flatbread/, '🍞'], [/rice/, '🍚'],
  [/spaghetti|penne|pasta|fusilli|linguine|lasagne|tagliatelle|macaroni|orzo/, '🍝'], [/noodle|vermicelli/, '🍜'],
  [/oat|granola|muesli|flour|bulgur|freekeh|couscous|quinoa|wheat|breadcrumb|panko|cornstarch|cornflour/, '🌾'],
  [/sweet potato/, '🍠'], [/potato/, '🥔'], [/onion|shallot|scallion/, '🧅'], [/garlic/, '🧄'], [/ginger/, '🫚'],
  [/cherry tomato|tomato|passata|marinara/, '🍅'], [/carrot/, '🥕'], [/chili|chilli|jalape|harissa|sriracha|hot sauce/, '🌶️'],
  [/pepper(?!corn)|capsicum/, '🫑'], [/cucumber|pickle|gherkin|zucchini|courgette/, '🥒'],
  [/lettuce|romaine|spinach|kale|chard|cabbage|rocket|arugula|salad leaves|greens/, '🥬'], [/broccoli|cauliflower/, '🥦'],
  [/mushroom/, '🍄'], [/corn/, '🌽'], [/avocado/, '🥑'], [/eggplant|aubergine/, '🍆'],
  [/lemon|lime/, '🍋'], [/apple/, '🍎'], [/pear/, '🍐'], [/banana/, '🍌'], [/strawberr|raspberr/, '🍓'],
  [/berr/, '🫐'], [/mango/, '🥭'], [/orange/, '🍊'], [/grape|raisin|sultana/, '🍇'], [/pineapple/, '🍍'],
  [/coconut/, '🥥'], [/pomegranate|cranberr/, '🍒'], [/date/, '🌴'], [/melon/, '🍉'],
  [/olive/, '🫒'], [/peanut/, '🥜'], [/almond|walnut|pine nut|cashew|pistachio|hazelnut|nut/, '🌰'],
  [/sesame|tahini|chia|flax|seed/, '🌱'], [/chickpea|lentil|bean|foul|fava|edamame|hummus/, '🫘'],
  [/honey|syrup|molasses|dibs/, '🍯'], [/chocolate|cocoa|cacao/, '🍫'], [/sugar/, '🍬'],
  [/salt/, '🧂'], [/parsley|coriander|cilantro|mint|basil|dill|herb|thyme|rosemary|oregano|bay/, '🌿'],
  [/oil/, '🫗'], [/stock|broth|bouillon/, '🍲'], [/water|ice/, '💧'], [/coffee|espresso/, '☕'], [/tofu/, '🍥'],
  [/cumin|paprika|turmeric|cinnamon|spice|masala|curry|seasoning|zaatar|za'atar|sumac|cardamom|nutmeg|clove|saffron|baharat|loomi|ras el/, '🫙'],
  [/sauce|vinegar|mustard|ketchup|mayo|paste|pesto/, '🥫']
];

const AISLE_EMOJI: Record<string, string> = {
  'Produce': '🥬', 'Meat & Fish': '🥩', 'Dairy & Eggs': '🥛', 'Bakery': '🍞', 'Grains & Pasta': '🌾',
  'Canned & Jars': '🥫', 'Pantry': '🫙', 'Spices': '🫙', 'Nuts & Seeds': '🌰', 'Frozen': '🧊', 'Drinks': '🥤', 'Other': '🛒'
};

const memo = new Map<string, string>();
export function foodEmoji(name: string): string {
  const k = name.toLowerCase();
  const hit = memo.get(k);
  if (hit) return hit;
  let e = RULES.find(([re]) => re.test(k))?.[1];
  if (!e) e = AISLE_EMOJI[matchFood(name)?.a ?? 'Other'];
  memo.set(k, e);
  return e;
}

export function aisleEmoji(aisle: string): string { return AISLE_EMOJI[aisle] ?? '🛒'; }
