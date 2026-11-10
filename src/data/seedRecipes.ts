import type { MealType } from '../types';

export interface SeedRecipe {
  id: string;
  title: string;
  emoji: string;
  description: string;
  servings: number;
  prepMin: number;
  cookMin: number;
  cuisine: string;
  mealTypes: MealType[];
  tags: string[];
  ingredients: string[]; // "## Heading" starts a group
  steps: string[];
  notes?: string;
}

export const SEED_RECIPES: SeedRecipe[] = [
  /* --------------------------------------------------------- Breakfast */
  {
    id: 'seed-shakshuka', title: 'Shakshuka', emoji: '🍳',
    description: 'Eggs gently poached in a smoky, spiced tomato and pepper sauce.',
    servings: 2, prepMin: 10, cookMin: 20, cuisine: 'Middle Eastern', mealTypes: ['breakfast', 'lunch'], tags: ['one-pan', 'quick'],
    ingredients: ['1 tbsp olive oil', '1 onion, diced', '1 red pepper, diced', '2 garlic cloves, minced', '1 tsp ground cumin', '1 tsp smoked paprika', '¼ tsp chili flakes', '1 can chopped tomatoes (400 g)', '½ tsp salt', '4 eggs', '30 g feta, crumbled', '1 tbsp parsley, chopped', '1 pita, to serve'],
    steps: [
      'Heat the olive oil in a frying pan over medium heat. Add the onion and pepper and cook for 6 minutes until soft.',
      'Stir in the garlic, cumin, paprika and chili flakes and cook for 1 minute until fragrant.',
      'Add the chopped tomatoes and salt. Simmer for 8 minutes until slightly thickened.',
      'Make 4 wells in the sauce and crack an egg into each. Cover and cook for 5 minutes, until the whites are set but the yolks are still soft.',
      'Scatter over the feta and parsley and serve straight from the pan with warm pita.'
    ]
  },
  {
    id: 'seed-overnight-oats', title: 'Overnight Oats with Berries', emoji: '🥣',
    description: 'No-cook creamy oats you prep the night before. Grab and go.',
    servings: 1, prepMin: 5, cookMin: 0, cuisine: 'International', mealTypes: ['breakfast'], tags: ['meal-prep', 'no-cook', 'quick'],
    ingredients: ['50 g rolled oats', '120 ml milk', '80 g greek yogurt', '1 tbsp chia seeds', '1 tsp honey', '80 g mixed berries', '1 tbsp almonds, chopped'],
    steps: [
      'In a jar, stir together the oats, milk, yogurt, chia seeds and honey.',
      'Cover and refrigerate overnight, or for at least 4 hours.',
      'In the morning, stir, then top with the berries and chopped almonds.'
    ],
    notes: 'Keeps for 3 days in the fridge. Make several jars at once.'
  },
  {
    id: 'seed-banana-pancakes', title: 'Banana Oat Pancakes', emoji: '🥞',
    description: 'Fluffy, naturally sweet pancakes blended from oats, banana and eggs.',
    servings: 2, prepMin: 5, cookMin: 15, cuisine: 'International', mealTypes: ['breakfast'], tags: ['kid-friendly'],
    ingredients: ['2 bananas', '2 eggs', '100 g rolled oats', '120 ml milk', '1 tsp baking powder', '½ tsp cinnamon', '1 pinch salt', '1 tsp butter', '1 tbsp maple syrup', '100 g greek yogurt'],
    steps: [
      'Blend the bananas, eggs, oats, milk, baking powder, cinnamon and salt until smooth. Rest for 5 minutes.',
      'Heat a non-stick pan over medium heat and brush with a little butter.',
      'Pour in small ladlefuls of batter and cook for 2 minutes until bubbles appear, then flip and cook 1 minute more.',
      'Serve stacked with greek yogurt and a drizzle of maple syrup.'
    ]
  },
  {
    id: 'seed-veggie-omelette', title: 'Spinach & Feta Omelette', emoji: '🥚',
    description: 'A high-protein, 10-minute breakfast.',
    servings: 1, prepMin: 3, cookMin: 7, cuisine: 'Mediterranean', mealTypes: ['breakfast'], tags: ['quick', 'high-protein'],
    ingredients: ['3 eggs', '1 pinch salt', '1 pinch black pepper', '1 tsp olive oil', '1 handful baby spinach', '4 cherry tomatoes, halved', '30 g feta, crumbled'],
    steps: [
      'Whisk the eggs with salt and pepper.',
      'Heat the oil in a non-stick pan. Wilt the spinach and tomatoes for 1 minute.',
      'Pour in the eggs and cook for 3 minutes, pulling the edges into the middle as they set.',
      'Scatter the feta over one half, fold and slide onto a plate.'
    ]
  },
  {
    id: 'seed-labneh-plate', title: 'Labneh Breakfast Plate', emoji: '🫒',
    description: 'A classic Lebanese breakfast spread — labneh, za\'atar, olives and fresh veg.',
    servings: 2, prepMin: 10, cookMin: 0, cuisine: 'Lebanese', mealTypes: ['breakfast'], tags: ['no-cook', 'vegetarian'],
    ingredients: ['200 g labneh', '2 tbsp olive oil', '1 tbsp zaatar', '1 cucumber, sliced', '2 tomatoes, sliced', '10 olives', '1 handful fresh mint', '2 pita'],
    steps: [
      'Spread the labneh on a plate and make a swirl with the back of a spoon.',
      'Drizzle with olive oil and sprinkle with za\'atar.',
      'Arrange the cucumber, tomatoes, olives and mint around it.',
      'Serve with warm pita for scooping.'
    ]
  },
  {
    id: 'seed-avocado-toast', title: 'Avocado Toast with Eggs', emoji: '🥑',
    description: 'Smashed avocado, lemon and chili on sourdough, topped with eggs.',
    servings: 2, prepMin: 5, cookMin: 8, cuisine: 'International', mealTypes: ['breakfast', 'lunch'], tags: ['quick'],
    ingredients: ['2 slices sourdough', '1 avocado', '1 tbsp lemon juice', '1 pinch salt', '1 pinch chili flakes', '2 eggs', '1 tsp olive oil'],
    steps: [
      'Toast the sourdough.',
      'Mash the avocado with lemon juice, salt and chili flakes.',
      'Fry or poach the eggs for 4 minutes.',
      'Spread the avocado on the toast and top each slice with an egg.'
    ]
  },
  {
    id: 'seed-foul', title: 'Foul Medames', emoji: '🫘',
    description: 'Warm fava beans with garlic, lemon, cumin and plenty of olive oil.',
    servings: 2, prepMin: 5, cookMin: 10, cuisine: 'Lebanese', mealTypes: ['breakfast', 'lunch'], tags: ['vegan', 'budget'],
    ingredients: ['1 can fava beans (240 g drained)', '2 garlic cloves, crushed', '2 tbsp lemon juice', '½ tsp ground cumin', '½ tsp salt', '2 tbsp olive oil', '1 tomato, diced', '1 tbsp parsley, chopped', '2 pita'],
    steps: [
      'Warm the fava beans with a splash of water in a pan for 5 minutes, then lightly mash about half.',
      'Pound the garlic with the salt, then stir into the beans with the lemon juice and cumin.',
      'Spoon into a bowl, drizzle generously with olive oil and top with tomato and parsley.',
      'Serve with pita.'
    ]
  },

  /* --------------------------------------------------- Lunch / Salads */
  {
    id: 'seed-fattoush', title: 'Fattoush', emoji: '🥗',
    description: 'Crunchy Lebanese bread salad with sumac and pomegranate molasses dressing.',
    servings: 4, prepMin: 15, cookMin: 10, cuisine: 'Lebanese', mealTypes: ['lunch', 'dinner'], tags: ['vegan', 'salad'],
    ingredients: ['2 pita', '1 tbsp olive oil', '1 romaine lettuce, chopped', '2 tomatoes, diced', '1 cucumber, diced', '4 radishes, sliced', '3 spring onions, sliced', '1 green pepper, diced', '1 bunch parsley, chopped', '1 handful fresh mint', '## Dressing', '4 tbsp olive oil', '3 tbsp lemon juice', '1 tbsp pomegranate molasses', '2 tsp sumac', '1 garlic clove, crushed', '½ tsp salt'],
    steps: [
      'Heat the oven to 200°C. Tear the pita into pieces, toss with 1 tbsp olive oil and bake for 8 minutes until golden and crisp.',
      'Whisk all the dressing ingredients together.',
      'Combine the lettuce, tomatoes, cucumber, radishes, spring onions, pepper, parsley and mint in a large bowl.',
      'Just before serving, toss with the dressing and the toasted bread. Sprinkle with extra sumac.'
    ]
  },
  {
    id: 'seed-tabbouleh', title: 'Tabbouleh', emoji: '🌿',
    description: 'Herb-packed parsley salad with fine bulgur, tomato and lemon.',
    servings: 4, prepMin: 25, cookMin: 0, cuisine: 'Lebanese', mealTypes: ['lunch', 'dinner', 'snack'], tags: ['vegan', 'salad', 'no-cook'],
    ingredients: ['40 g bulgur', '3 bunches flat-leaf parsley, finely chopped', '1 bunch fresh mint, finely chopped', '3 tomatoes, finely diced', '3 spring onions, finely sliced', '4 tbsp lemon juice', '4 tbsp olive oil', '½ tsp seven spice', '½ tsp salt'],
    steps: [
      'Rinse the bulgur and soak in the lemon juice for 10 minutes.',
      'Combine the parsley, mint, tomatoes and spring onions in a bowl.',
      'Add the bulgur with its lemon juice, the olive oil, seven spice and salt. Toss well.',
      'Taste and adjust lemon and salt. Serve with lettuce leaves.'
    ]
  },
  {
    id: 'seed-greek-salad', title: 'Greek Salad', emoji: '🥒',
    description: 'Tomato, cucumber, olives and feta with oregano and olive oil.',
    servings: 2, prepMin: 10, cookMin: 0, cuisine: 'Greek', mealTypes: ['lunch', 'dinner'], tags: ['vegetarian', 'salad', 'no-cook', 'quick'],
    ingredients: ['3 tomatoes, chopped', '1 cucumber, chopped', '½ red onion, thinly sliced', '1 green pepper, sliced', '12 kalamata olives', '150 g feta', '3 tbsp olive oil', '1 tbsp red wine vinegar', '1 tsp dried oregano', '1 pinch salt'],
    steps: [
      'Combine the tomatoes, cucumber, onion, pepper and olives in a bowl.',
      'Whisk the olive oil, vinegar, oregano and salt and pour over.',
      'Top with the block of feta and an extra pinch of oregano.'
    ]
  },
  {
    id: 'seed-halloumi-quinoa', title: 'Halloumi Quinoa Bowl', emoji: '🧀',
    description: 'Golden halloumi over lemony quinoa with roasted veg and rocket.',
    servings: 2, prepMin: 10, cookMin: 25, cuisine: 'Mediterranean', mealTypes: ['lunch', 'dinner'], tags: ['vegetarian', 'meal-prep'],
    ingredients: ['120 g quinoa', '1 zucchini, chopped', '1 red pepper, chopped', '2 tbsp olive oil', '1 tsp smoked paprika', '200 g halloumi, sliced', '2 handfuls rocket', '2 tbsp lemon juice', '1 tbsp pomegranate seeds', '1 pinch salt'],
    steps: [
      'Heat the oven to 210°C. Toss the zucchini and pepper with 1 tbsp oil, paprika and salt and roast for 20 minutes.',
      'Meanwhile, rinse the quinoa and simmer in 250 ml water for 15 minutes until tender. Stir in the lemon juice and remaining oil.',
      'Dry-fry the halloumi slices for 2 minutes per side until golden.',
      'Divide the quinoa, roasted veg and rocket between bowls and top with halloumi and pomegranate seeds.'
    ]
  },
  {
    id: 'seed-lentil-soup', title: 'Lebanese Lentil Soup', emoji: '🍲',
    description: 'Shorbat adas — silky red lentil soup with cumin and lemon.',
    servings: 4, prepMin: 10, cookMin: 30, cuisine: 'Lebanese', mealTypes: ['lunch', 'dinner'], tags: ['vegan', 'budget', 'meal-prep'],
    ingredients: ['2 tbsp olive oil', '1 onion, chopped', '1 carrot, chopped', '2 garlic cloves', '250 g red lentils, rinsed', '1.25 l vegetable stock', '1.5 tsp ground cumin', '½ tsp turmeric', '1 tsp salt', '1 lemon, cut into wedges', '1 pita, toasted'],
    steps: [
      'Heat the oil in a large pot and cook the onion and carrot for 8 minutes until soft. Add the garlic for 1 minute.',
      'Add the lentils, stock, cumin, turmeric and salt. Bring to the boil, then simmer for 20 minutes until the lentils collapse.',
      'Blend until smooth, adding water if too thick.',
      'Serve with lemon wedges to squeeze and toasted pita croutons.'
    ]
  },
  {
    id: 'seed-tuna-wrap', title: 'Tuna & Sweetcorn Wraps', emoji: '🌯',
    description: 'A quick high-protein lunch from store-cupboard staples.',
    servings: 2, prepMin: 10, cookMin: 0, cuisine: 'International', mealTypes: ['lunch'], tags: ['quick', 'high-protein', 'no-cook'],
    ingredients: ['2 cans tuna (112 g drained)', '3 tbsp greek yogurt', '1 tbsp mayonnaise', '80 g sweetcorn', '1 spring onion, sliced', '1 tbsp lemon juice', '1 pinch black pepper', '2 tortillas', '1 handful salad leaves'],
    steps: [
      'Mix the tuna, yogurt, mayonnaise, sweetcorn, spring onion, lemon juice and pepper.',
      'Lay the salad leaves on the tortillas, spoon over the tuna mix and roll up tightly.',
      'Cut in half and serve.'
    ]
  },

  /* ----------------------------------------------------------- Dinner */
  {
    id: 'seed-shish-tawook', title: 'Shish Tawook', emoji: '🍢',
    description: 'Garlicky, lemony yogurt-marinated chicken skewers.',
    servings: 4, prepMin: 15, cookMin: 15, cuisine: 'Lebanese', mealTypes: ['dinner', 'lunch'], tags: ['high-protein', 'grill'],
    ingredients: ['800 g chicken breast, cubed', '150 g plain yogurt', '3 tbsp lemon juice', '2 tbsp olive oil', '4 garlic cloves, crushed', '1 tbsp tomato paste', '1 tsp paprika', '½ tsp seven spice', '1 tsp salt', '1 green pepper, chopped', '1 onion, cut into chunks', '## To serve', '4 pita', '4 tbsp garlic sauce', '1 tomato, sliced', '4 pickles'],
    steps: [
      'Mix the yogurt, lemon juice, olive oil, garlic, tomato paste, paprika, seven spice and salt.',
      'Add the chicken, coat well and marinate for at least 2 hours, ideally overnight.',
      'Thread the chicken onto skewers with the pepper and onion.',
      'Grill or griddle over high heat for 12 minutes, turning, until charred and cooked through.',
      'Serve with pita, garlic sauce, tomato and pickles.'
    ],
    notes: 'Garlic sauce = toum. A spoon of mayo mixed with crushed garlic works in a pinch.'
  },
  {
    id: 'seed-mujaddara', title: 'Mujaddara', emoji: '🧅',
    description: 'Lentils and rice crowned with sweet, crispy caramelised onions.',
    servings: 4, prepMin: 10, cookMin: 45, cuisine: 'Lebanese', mealTypes: ['dinner', 'lunch'], tags: ['vegan', 'budget'],
    ingredients: ['200 g brown lentils', '150 g basmati rice', '3 onions, thinly sliced', '5 tbsp olive oil', '1.5 tsp ground cumin', '1 tsp salt', '1 l water', '## To serve', '200 g plain yogurt', '1 cucumber, diced'],
    steps: [
      'Simmer the lentils in the water for 15 minutes until just tender.',
      'Meanwhile, fry the onions in the olive oil over medium-high heat for 25 minutes, stirring, until deep golden. Remove half for topping.',
      'Add the rinsed rice, cumin and salt to the lentils (with their water, about 450 ml left). Stir in the remaining onions.',
      'Cover and cook on low for 18 minutes until the rice is tender. Rest for 5 minutes.',
      'Top with the crispy onions and serve with yogurt and cucumber.'
    ]
  },
  {
    id: 'seed-kafta-bake', title: 'Kafta & Potato Bake', emoji: '🥔',
    description: 'Spiced lamb kafta baked with potatoes in a rich tomato sauce.',
    servings: 4, prepMin: 20, cookMin: 45, cuisine: 'Lebanese', mealTypes: ['dinner'], tags: ['family'],
    ingredients: ['500 g lamb mince', '1 onion, grated', '1 bunch parsley, finely chopped', '1 tsp seven spice', '1 tsp salt', '4 potatoes, sliced', '2 tbsp olive oil', '2 tomatoes, sliced', '## Sauce', '2 tbsp tomato paste', '400 ml water', '½ tsp salt'],
    steps: [
      'Heat the oven to 200°C.',
      'Mix the lamb, onion, parsley, seven spice and salt. Shape into flat patties.',
      'Toss the potato slices in the oil and arrange in a baking dish with the kafta and tomato slices.',
      'Whisk the tomato paste with the water and salt and pour over.',
      'Cover with foil and bake for 30 minutes, then uncover and bake for 15 minutes more until bubbling.',
      'Serve with rice or bread.'
    ]
  },
  {
    id: 'seed-chicken-rice', title: 'Lebanese Chicken & Vermicelli Rice', emoji: '🍗',
    description: 'Fluffy vermicelli rice with spiced chicken and toasted nuts.',
    servings: 4, prepMin: 15, cookMin: 35, cuisine: 'Lebanese', mealTypes: ['dinner'], tags: ['family', 'high-protein'],
    ingredients: ['600 g chicken thigh', '1 tsp seven spice', '1 tsp salt', '2 tbsp butter', '50 g vermicelli', '300 g basmati rice, rinsed', '600 ml chicken stock', '½ tsp cinnamon', '30 g almonds, toasted', '20 g pine nuts, toasted', '200 g plain yogurt'],
    steps: [
      'Season the chicken with seven spice and half the salt. Pan-fry for 6 minutes per side until cooked through. Rest and slice.',
      'Melt the butter in a pot and toast the vermicelli for 3 minutes until golden.',
      'Add the rice, stir to coat, then add the stock, cinnamon and remaining salt. Bring to the boil, cover and cook on low for 15 minutes.',
      'Rest for 5 minutes, then fluff with a fork.',
      'Top the rice with the chicken and toasted nuts. Serve with yogurt.'
    ]
  },
  {
    id: 'seed-salmon-traybake', title: 'Sheet-Pan Lemon Salmon & Veg', emoji: '🐟',
    description: 'Salmon, potatoes and broccoli roasted on one tray.',
    servings: 2, prepMin: 10, cookMin: 30, cuisine: 'International', mealTypes: ['dinner'], tags: ['one-pan', 'high-protein'],
    ingredients: ['2 salmon fillets', '400 g baby potatoes, halved', '1 broccoli, cut into florets', '2 tbsp olive oil', '1 lemon', '2 garlic cloves, crushed', '1 tsp dried oregano', '½ tsp salt', '1 pinch black pepper'],
    steps: [
      'Heat the oven to 210°C. Toss the potatoes with 1 tbsp oil and half the salt and roast for 15 minutes.',
      'Add the broccoli to the tray and nestle in the salmon.',
      'Mix the remaining oil, garlic, oregano, the zest of the lemon, salt and pepper, and brush over the salmon and veg.',
      'Roast for 12 minutes until the salmon flakes easily.',
      'Squeeze over the lemon juice and serve.'
    ]
  },
  {
    id: 'seed-stir-fry', title: 'Ginger Chicken Stir-Fry', emoji: '🥢',
    description: 'Fast, saucy chicken and veg stir-fry with jasmine rice.',
    servings: 3, prepMin: 15, cookMin: 15, cuisine: 'Chinese', mealTypes: ['dinner'], tags: ['quick', 'high-protein'],
    ingredients: ['450 g chicken breast, sliced', '1 tbsp cornstarch', '2 tbsp vegetable oil', '1 thumb ginger, grated', '3 garlic cloves, minced', '1 red pepper, sliced', '1 broccoli, cut into small florets', '3 spring onions, sliced', '## Sauce', '3 tbsp soy sauce', '1 tbsp honey', '1 tbsp vinegar', '1 tsp sesame oil', '60 ml water', '## To serve', '200 g jasmine rice', '1 tsp sesame seeds'],
    steps: [
      'Cook the rice according to the packet, about 15 minutes.',
      'Toss the chicken with the cornstarch. Mix the sauce ingredients.',
      'Heat the oil in a wok over high heat. Stir-fry the chicken for 5 minutes until golden; remove.',
      'Stir-fry the ginger and garlic for 30 seconds, then the pepper and broccoli for 3 minutes.',
      'Return the chicken, pour in the sauce and toss for 2 minutes until glossy.',
      'Serve over rice with spring onions and sesame seeds.'
    ]
  },
  {
    id: 'seed-chickpea-curry', title: 'Chickpea & Spinach Curry', emoji: '🍛',
    description: 'Creamy coconut chickpea curry ready in 30 minutes.',
    servings: 4, prepMin: 10, cookMin: 20, cuisine: 'Indian', mealTypes: ['dinner', 'lunch'], tags: ['vegan', 'budget', 'meal-prep'],
    ingredients: ['1 tbsp vegetable oil', '1 onion, diced', '3 garlic cloves, minced', '1 thumb ginger, grated', '2 tbsp curry powder', '1 tsp ground cumin', '1 can chopped tomatoes', '2 cans chickpeas, drained', '1 can coconut milk', '150 g baby spinach', '1 tsp salt', '1 lime', '250 g basmati rice'],
    steps: [
      'Cook the rice according to the packet.',
      'Heat the oil and fry the onion for 6 minutes. Add garlic, ginger, curry powder and cumin and cook for 1 minute.',
      'Add the tomatoes, chickpeas, coconut milk and salt. Simmer for 12 minutes.',
      'Stir in the spinach until wilted and finish with a squeeze of lime.',
      'Serve with the rice.'
    ]
  },
  {
    id: 'seed-pasta-pomodoro', title: 'Spaghetti Pomodoro', emoji: '🍝',
    description: 'Simple, glossy tomato and basil spaghetti.',
    servings: 2, prepMin: 5, cookMin: 20, cuisine: 'Italian', mealTypes: ['dinner'], tags: ['vegetarian', 'quick', 'budget'],
    ingredients: ['200 g spaghetti', '3 tbsp olive oil', '3 garlic cloves, sliced', '1 can plum tomatoes', '½ tsp salt', '1 pinch chili flakes', '1 handful fresh basil', '30 g parmesan, grated'],
    steps: [
      'Cook the spaghetti in salted boiling water for 10 minutes until al dente. Reserve a cup of pasta water.',
      'Meanwhile, gently fry the garlic in the olive oil for 2 minutes. Add the tomatoes, salt and chili flakes, crush with a spoon and simmer for 12 minutes.',
      'Toss the drained pasta in the sauce with a splash of pasta water and the torn basil.',
      'Serve topped with parmesan.'
    ]
  },
  {
    id: 'seed-turkey-meatballs', title: 'Turkey Meatballs in Tomato Sauce', emoji: '🧆',
    description: 'Lean, herby meatballs baked then simmered in sauce.',
    servings: 4, prepMin: 15, cookMin: 30, cuisine: 'Italian', mealTypes: ['dinner'], tags: ['high-protein', 'meal-prep', 'family'],
    ingredients: ['500 g turkey mince', '1 egg', '40 g breadcrumbs', '30 g parmesan, grated', '2 garlic cloves, crushed', '1 tsp dried oregano', '½ tsp salt', '500 ml passata', '1 tbsp olive oil', '1 handful fresh basil', '250 g penne'],
    steps: [
      'Heat the oven to 200°C. Mix the turkey, egg, breadcrumbs, parmesan, garlic, oregano and salt. Roll into 16 balls.',
      'Bake on an oiled tray for 15 minutes.',
      'Meanwhile, cook the penne for 11 minutes.',
      'Warm the passata with the olive oil, add the meatballs and simmer for 10 minutes.',
      'Serve over the pasta with torn basil.'
    ]
  },
  {
    id: 'seed-beef-chili', title: 'Beef & Bean Chili', emoji: '🌶️',
    description: 'Smoky, hearty chili — great for batch cooking.',
    servings: 6, prepMin: 15, cookMin: 50, cuisine: 'Mexican', mealTypes: ['dinner'], tags: ['meal-prep', 'high-protein', 'freezer-friendly'],
    ingredients: ['1 tbsp olive oil', '2 onions, diced', '2 red peppers, diced', '4 garlic cloves, minced', '750 g beef mince', '2 tsp ground cumin', '2 tsp smoked paprika', '1 tsp chili powder', '2 tbsp tomato paste', '2 cans chopped tomatoes', '2 cans kidney beans, drained', '250 ml beef stock', '1 tsp salt', '300 g basmati rice', '150 g greek yogurt'],
    steps: [
      'Heat the oil in a large pot. Cook the onions and peppers for 8 minutes.',
      'Add the garlic and beef, breaking it up, and brown for 8 minutes.',
      'Stir in the cumin, paprika, chili powder and tomato paste for 1 minute.',
      'Add the tomatoes, beans, stock and salt. Simmer gently for 30 minutes, stirring occasionally.',
      'Cook the rice according to the packet. Serve the chili over rice with a spoon of yogurt.'
    ],
    notes: 'Freezes well for up to 3 months.'
  },
  {
    id: 'seed-black-bean-tacos', title: 'Black Bean & Sweet Potato Tacos', emoji: '🌮',
    description: 'Roasted sweet potato, spiced black beans and a zesty slaw.',
    servings: 3, prepMin: 15, cookMin: 25, cuisine: 'Mexican', mealTypes: ['dinner', 'lunch'], tags: ['vegetarian'],
    ingredients: ['2 sweet potatoes, cubed', '1 tbsp olive oil', '1 tsp smoked paprika', '1 tsp ground cumin', '1 can black beans, drained', '6 tortillas', '1 avocado, sliced', '150 g red cabbage, shredded', '1 lime', '3 tbsp sour cream', '1 handful coriander', '½ tsp salt'],
    steps: [
      'Heat the oven to 210°C. Toss the sweet potato with oil, paprika, cumin and salt; roast for 25 minutes.',
      'Warm the black beans in a pan and lightly mash.',
      'Toss the cabbage with the juice of half the lime and a pinch of salt.',
      'Warm the tortillas, then fill with beans, sweet potato, slaw, avocado, sour cream and coriander. Serve with lime wedges.'
    ]
  },
  {
    id: 'seed-burrito-bowl', title: 'Chicken Burrito Bowl', emoji: '🥙',
    description: 'Meal-prep friendly bowls of spiced chicken, rice, beans and salsa.',
    servings: 4, prepMin: 15, cookMin: 25, cuisine: 'Mexican', mealTypes: ['lunch', 'dinner'], tags: ['meal-prep', 'high-protein'],
    ingredients: ['600 g chicken breast', '2 tsp taco seasoning', '1 tbsp olive oil', '250 g basmati rice', '1 lime', '1 handful coriander, chopped', '1 can black beans, drained', '200 g sweetcorn', '250 g cherry tomatoes, quartered', '½ red onion, diced', '1 avocado, diced', '100 g greek yogurt'],
    steps: [
      'Rub the chicken with the taco seasoning and oil. Pan-fry for 7 minutes per side, rest and slice.',
      'Cook the rice, then stir in the juice of half the lime and half the coriander.',
      'Mix the tomatoes, onion, remaining coriander and lime juice for a quick salsa.',
      'Build bowls with rice, chicken, beans, sweetcorn, salsa and avocado. Top with yogurt.'
    ]
  },
  {
    id: 'seed-teriyaki-salmon', title: 'Teriyaki Salmon & Greens', emoji: '🍱',
    description: 'Sticky homemade teriyaki salmon with rice and green beans.',
    servings: 2, prepMin: 5, cookMin: 20, cuisine: 'Japanese', mealTypes: ['dinner'], tags: ['quick', 'high-protein'],
    ingredients: ['2 salmon fillets', '150 g jasmine rice', '200 g green beans', '1 tsp sesame seeds', '## Teriyaki sauce', '3 tbsp soy sauce', '1 tbsp honey', '1 tbsp vinegar', '1 garlic clove, grated', '1 tsp ginger, grated', '1 tsp cornstarch', '3 tbsp water'],
    steps: [
      'Cook the rice. Steam the green beans for 4 minutes.',
      'Whisk all the sauce ingredients together.',
      'Sear the salmon skin-side down in a hot pan for 4 minutes, flip and cook 2 minutes.',
      'Pour in the sauce and bubble for 2 minutes, spooning it over the salmon until sticky.',
      'Serve with the rice and beans, sprinkled with sesame seeds.'
    ]
  },
  {
    id: 'seed-dal', title: 'Everyday Red Lentil Dal', emoji: '🥘',
    description: 'Comforting, budget-friendly dal with a sizzling spiced tarka.',
    servings: 4, prepMin: 5, cookMin: 30, cuisine: 'Indian', mealTypes: ['dinner', 'lunch'], tags: ['vegan', 'budget', 'meal-prep'],
    ingredients: ['250 g red lentils', '1 l water', '1 tsp turmeric', '1 tsp salt', '2 tbsp vegetable oil', '1 tsp cumin seeds', '1 onion, sliced', '3 garlic cloves, sliced', '1 green chili, sliced', '2 tomatoes, chopped', '1 tsp garam masala', '1 handful coriander', '4 pita'],
    steps: [
      'Simmer the lentils in the water with turmeric and salt for 20 minutes, until soft and creamy.',
      'Heat the oil, add the cumin seeds for 30 seconds, then the onion for 8 minutes until golden.',
      'Add the garlic, chili and tomatoes and cook for 4 minutes. Stir in the garam masala.',
      'Pour the tarka into the dal, stir and scatter with coriander. Serve with flatbread.'
    ]
  },
  {
    id: 'seed-stuffed-zucchini', title: 'Stuffed Zucchini (Kousa Mahshi)', emoji: '🥒',
    description: 'Zucchini filled with spiced rice and beef, simmered in tomato.',
    servings: 4, prepMin: 40, cookMin: 50, cuisine: 'Lebanese', mealTypes: ['dinner'], tags: ['family', 'weekend'],
    ingredients: ['8 zucchini', '250 g beef mince', '150 g short grain rice, rinsed', '1 tsp seven spice', '1 tsp salt', '1 tbsp olive oil', '3 tbsp tomato paste', '700 ml water', '3 garlic cloves, crushed', '1 tbsp dried mint', '2 tbsp lemon juice'],
    steps: [
      'Cut the stem ends off the zucchini and hollow them out with a corer, leaving thin walls.',
      'Mix the beef, rice, seven spice, half the salt and olive oil. Loosely fill the zucchini three-quarters full.',
      'Lay them in a pot. Whisk the tomato paste with the water and remaining salt and pour over.',
      'Bring to the boil, cover and simmer for 45 minutes until the rice is cooked.',
      'Pound the garlic with the dried mint, stir in the lemon juice, add to the pot and simmer 5 minutes more.'
    ]
  },

  /* ---------------------------------------------- Snacks & desserts */
  {
    id: 'seed-hummus', title: 'Classic Hummus', emoji: '🫓',
    description: 'Ultra-smooth hummus with tahini, lemon and garlic.',
    servings: 6, prepMin: 10, cookMin: 0, cuisine: 'Lebanese', mealTypes: ['snack', 'lunch'], tags: ['vegan', 'no-cook', 'meal-prep'],
    ingredients: ['2 cans chickpeas, drained', '100 g tahini', '4 tbsp lemon juice', '1 garlic clove', '1 tsp salt', '60 ml cold water', '2 tbsp olive oil', '1 pinch paprika', '2 carrots, cut into sticks', '1 cucumber, cut into sticks'],
    steps: [
      'Blend the tahini and lemon juice for 1 minute until whipped.',
      'Add the chickpeas, garlic and salt and blend, drizzling in the cold water, for 3 minutes until very smooth.',
      'Spread in a bowl, drizzle with olive oil and dust with paprika.',
      'Serve with carrot and cucumber sticks.'
    ]
  },
  {
    id: 'seed-energy-balls', title: 'Date & Tahini Energy Balls', emoji: '🟤',
    description: 'No-bake snack bites — great before or after training.',
    servings: 12, prepMin: 15, cookMin: 0, cuisine: 'Middle Eastern', mealTypes: ['snack', 'dessert'], tags: ['vegan', 'no-cook', 'meal-prep'],
    ingredients: ['200 g medjool dates, pitted', '100 g rolled oats', '60 g tahini', '30 g almonds', '1 tbsp cocoa powder', '1 pinch salt', '2 tbsp sesame seeds'],
    steps: [
      'Blitz the oats and almonds in a food processor until fine.',
      'Add the dates, tahini, cocoa and salt and blitz until the mixture clumps.',
      'Roll into 24 small balls and coat in sesame seeds.',
      'Chill for 30 minutes. Keeps for a week in the fridge.'
    ]
  },
  {
    id: 'seed-yogurt-parfait', title: 'Greek Yogurt Parfait', emoji: '🍓',
    description: 'Layers of yogurt, granola, berries and honey.',
    servings: 1, prepMin: 3, cookMin: 0, cuisine: 'International', mealTypes: ['breakfast', 'snack'], tags: ['quick', 'no-cook', 'high-protein'],
    ingredients: ['200 g greek yogurt', '40 g granola', '80 g strawberries, sliced', '1 tsp honey'],
    steps: [
      'Layer half the yogurt, granola and strawberries in a glass.',
      'Repeat, then drizzle with honey.'
    ]
  },
  {
    id: 'seed-banana-bread', title: 'Healthy Banana Bread', emoji: '🍌',
    description: 'Moist banana bread sweetened mostly with fruit.',
    servings: 10, prepMin: 15, cookMin: 50, cuisine: 'International', mealTypes: ['dessert', 'snack', 'breakfast'], tags: ['baking', 'kid-friendly'],
    ingredients: ['3 bananas, very ripe', '2 eggs', '60 ml olive oil', '60 ml maple syrup', '1 tsp vanilla extract', '200 g whole wheat flour', '1 tsp baking soda', '1 tsp cinnamon', '1 pinch salt', '50 g walnuts, chopped'],
    steps: [
      'Heat the oven to 175°C and line a loaf tin.',
      'Mash the bananas, then whisk in the eggs, oil, maple syrup and vanilla.',
      'Fold in the flour, baking soda, cinnamon and salt until just combined, then the walnuts.',
      'Pour into the tin and bake for 50 minutes, until a skewer comes out clean.',
      'Cool in the tin for 10 minutes before slicing.'
    ]
  }
];
