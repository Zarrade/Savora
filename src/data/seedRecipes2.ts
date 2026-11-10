import type { SeedRecipe } from './seedRecipes';

/** Starter recipes, part 2 (brings the library to 100). */
export const SEED_RECIPES_2: SeedRecipe[] = [
  /* =========================================================== Breakfast */
  {
    id: 'seed-manakish', title: "Manakish Za'atar", emoji: 'flatbread',
    description: 'Lebanese flatbreads topped with za\'atar and olive oil, baked until crisp at the edges.',
    servings: 6, prepMin: 20, cookMin: 10, cuisine: 'Lebanese', mealTypes: ['breakfast', 'lunch'], tags: ['vegan', 'baking', 'weekend'],
    ingredients: ['400 g plain flour', '7 g instant yeast', '1 tsp sugar', '1 tsp salt', '250 ml warm water', '2 tbsp olive oil', '## Topping', '6 tbsp zaatar', '120 ml olive oil', '2 tomatoes, sliced', '1 cucumber, sliced', '1 handful fresh mint'],
    steps: [
      'Mix the flour, yeast, sugar and salt. Add the warm water and 2 tbsp olive oil and knead for 8 minutes until smooth.',
      'Cover and leave to rise for 1 hour, until doubled.',
      'Heat the oven to 240°C with a tray inside. Mix the za\'atar with the olive oil into a loose paste.',
      'Divide the dough into 6 balls and press each into a thin round. Dimple with your fingertips and spread with the za\'atar oil.',
      'Bake on the hot tray for 7 minutes until golden at the edges. Serve with tomato, cucumber and mint.'
    ]
  },
  {
    id: 'seed-cilbir', title: 'Turkish Eggs (Çılbır)', emoji: 'pan',
    description: 'Poached eggs on garlicky yogurt with sizzling chili butter.',
    servings: 2, prepMin: 5, cookMin: 10, cuisine: 'Turkish', mealTypes: ['breakfast'], tags: ['quick', 'vegetarian'],
    ingredients: ['250 g greek yogurt', '1 garlic clove, grated', '1 pinch salt', '4 eggs', '1 tbsp vinegar', '25 g butter', '1 tsp aleppo pepper', '1 tbsp dill, chopped', '2 slices sourdough, toasted'],
    steps: [
      'Stir the yogurt with the garlic and salt and spread onto two plates.',
      'Bring a pan of water to a gentle simmer with the vinegar. Poach the eggs for 3 minutes, then lift out with a slotted spoon.',
      'Melt the butter until foaming and stir in the aleppo pepper.',
      'Set the eggs on the yogurt, spoon over the chili butter, scatter with dill and serve with toast.'
    ]
  },
  {
    id: 'seed-menemen', title: 'Menemen', emoji: 'tomato',
    description: 'Turkish soft-scrambled eggs with tomatoes and green peppers.',
    servings: 2, prepMin: 5, cookMin: 15, cuisine: 'Turkish', mealTypes: ['breakfast'], tags: ['quick', 'vegetarian', 'one-pan'],
    ingredients: ['2 tbsp olive oil', '2 green chilies, sliced', '1 green pepper, chopped', '4 tomatoes, grated', '½ tsp salt', '½ tsp chili flakes', '4 eggs', '30 g feta, crumbled', '2 pita'],
    steps: [
      'Heat the oil and soften the chilies and pepper for 4 minutes.',
      'Add the grated tomatoes, salt and chili flakes and cook for 6 minutes until jammy.',
      'Crack in the eggs and gently stir for 2 minutes until just set and still soft.',
      'Top with feta and serve straight away with bread.'
    ]
  },
  {
    id: 'seed-balaleet', title: 'Balaleet', emoji: 'noodles',
    description: 'Emirati sweet saffron vermicelli topped with a thin omelette — a classic weekend breakfast.',
    servings: 4, prepMin: 10, cookMin: 20, cuisine: 'Emirati', mealTypes: ['breakfast', 'dessert'], tags: ['weekend', 'vegetarian'],
    ingredients: ['200 g vermicelli', '2 tbsp ghee', '60 g sugar', '½ tsp cardamom', '1 pinch saffron', '2 tbsp rose water', '4 eggs', '1 pinch salt', '1 tsp butter'],
    steps: [
      'Boil the vermicelli for 3 minutes, then drain.',
      'Melt the ghee in a pan, add the vermicelli, sugar, cardamom, saffron and rose water and stir over low heat for 5 minutes until glossy.',
      'Beat the eggs with the salt. Cook as a thin omelette in the butter for 2 minutes per side.',
      'Serve the vermicelli in bowls topped with the omelette.'
    ]
  },
  {
    id: 'seed-chia-mango', title: 'Mango Coconut Chia Pudding', emoji: 'mango',
    description: 'Creamy make-ahead chia pots with fresh mango.',
    servings: 2, prepMin: 5, cookMin: 0, cuisine: 'International', mealTypes: ['breakfast', 'snack', 'dessert'], tags: ['meal-prep', 'no-cook', 'vegan'],
    ingredients: ['50 g chia seeds', '200 ml coconut milk', '200 ml almond milk', '1 tbsp maple syrup', '1 mango, diced', '1 tbsp almonds, flaked'],
    steps: [
      'Whisk the chia seeds, coconut milk, almond milk and maple syrup. Rest for 5 minutes, then whisk again to stop clumps.',
      'Cover and chill for at least 3 hours or overnight.',
      'Divide into jars and top with mango and flaked almonds.'
    ]
  },
  {
    id: 'seed-protein-oats', title: 'Peanut Butter Protein Oats', emoji: 'nut',
    description: 'Hot creamy oats with whey, banana and peanut butter — 40 g protein.',
    servings: 1, prepMin: 2, cookMin: 5, cuisine: 'International', mealTypes: ['breakfast'], tags: ['quick', 'high-protein'],
    ingredients: ['60 g rolled oats', '250 ml milk', '1 scoop whey protein', '1 banana, sliced', '1 tbsp peanut butter', '1 pinch cinnamon'],
    steps: [
      'Simmer the oats in the milk for 4 minutes, stirring, until creamy.',
      'Take off the heat and stir in the whey protein with a splash of water if thick.',
      'Top with banana, peanut butter and cinnamon.'
    ]
  },
  {
    id: 'seed-egg-muffins', title: 'Veggie Egg Muffins', emoji: 'cupcake',
    description: 'Grab-and-go baked egg bites packed with vegetables.',
    servings: 6, prepMin: 10, cookMin: 20, cuisine: 'International', mealTypes: ['breakfast', 'snack'], tags: ['meal-prep', 'high-protein', 'gluten-free'],
    ingredients: ['10 eggs', '60 ml milk', '½ tsp salt', '1 pinch black pepper', '1 red pepper, diced', '1 handful baby spinach, chopped', '3 spring onions, sliced', '60 g cheddar, grated', '1 tsp olive oil'],
    steps: [
      'Heat the oven to 180°C and oil a 12-hole muffin tin.',
      'Whisk the eggs, milk, salt and pepper.',
      'Divide the pepper, spinach, spring onion and cheese between the holes, then pour over the egg.',
      'Bake for 20 minutes until puffed and set. Cool and refrigerate for up to 4 days.'
    ]
  },
  {
    id: 'seed-halloumi-wrap', title: 'Halloumi Breakfast Wrap', emoji: 'wrap',
    description: 'Grilled halloumi, egg, tomato and rocket rolled in a warm wrap.',
    servings: 2, prepMin: 5, cookMin: 10, cuisine: 'Mediterranean', mealTypes: ['breakfast', 'lunch'], tags: ['quick', 'vegetarian'],
    ingredients: ['120 g halloumi, sliced', '2 eggs', '2 tortillas', '1 tomato, sliced', '1 handful rocket', '1 tbsp labneh', '1 tsp olive oil'],
    steps: [
      'Fry the halloumi in a dry pan for 2 minutes per side until golden.',
      'Scramble the eggs in the oil for 2 minutes.',
      'Spread the wraps with labneh, fill with halloumi, egg, tomato and rocket, and roll up.'
    ]
  },
  {
    id: 'seed-smoothie-bowl', title: 'Berry Smoothie Bowl', emoji: 'berries',
    description: 'Thick berry and banana smoothie topped with granola and seeds.',
    servings: 1, prepMin: 5, cookMin: 0, cuisine: 'International', mealTypes: ['breakfast', 'snack'], tags: ['quick', 'no-cook'],
    ingredients: ['150 g frozen berries', '1 banana', '100 g greek yogurt', '60 ml milk', '30 g granola', '1 tsp chia seeds'],
    steps: [
      'Blend the berries, banana, yogurt and milk until thick and smooth.',
      'Pour into a bowl and top with granola and chia seeds.'
    ]
  },
  {
    id: 'seed-breakfast-burrito', title: 'Breakfast Burritos', emoji: 'wrap',
    description: 'Eggs, black beans, peppers and cheese — freezer-friendly.',
    servings: 4, prepMin: 10, cookMin: 15, cuisine: 'Mexican', mealTypes: ['breakfast'], tags: ['meal-prep', 'freezer-friendly', 'vegetarian'],
    ingredients: ['8 eggs', '1 tbsp olive oil', '1 red pepper, diced', '1 onion, diced', '1 can black beans, drained', '1 tsp ground cumin', '½ tsp salt', '80 g cheddar, grated', '4 tortillas', '4 tbsp hot sauce'],
    steps: [
      'Cook the onion and pepper in the oil for 6 minutes. Add the beans and cumin for 2 minutes.',
      'Whisk the eggs with salt, pour in and scramble gently for 3 minutes.',
      'Divide between the tortillas, top with cheese and hot sauce, and roll up tightly.',
      'Eat now, or wrap in foil and freeze. Reheat from frozen in a 180°C oven for 25 minutes.'
    ]
  },
  {
    id: 'seed-cottage-pancakes', title: 'Cottage Cheese Pancakes', emoji: 'pancakes',
    description: 'High-protein blender pancakes with a tender, custardy middle.',
    servings: 2, prepMin: 5, cookMin: 12, cuisine: 'International', mealTypes: ['breakfast'], tags: ['high-protein'],
    ingredients: ['250 g cottage cheese', '3 eggs', '60 g rolled oats', '1 tsp baking powder', '1 tsp vanilla extract', '1 tsp butter', '100 g strawberries, sliced', '1 tbsp honey'],
    steps: [
      'Blend the cottage cheese, eggs, oats, baking powder and vanilla until smooth.',
      'Heat a non-stick pan with a little butter and cook small pancakes for 2 minutes per side.',
      'Serve with strawberries and a drizzle of honey.'
    ]
  },
  {
    id: 'seed-fatteh', title: 'Fattet Hummus', emoji: 'bowl',
    description: 'Layers of crispy pita, warm chickpeas and garlicky tahini yogurt topped with pine nuts.',
    servings: 4, prepMin: 15, cookMin: 15, cuisine: 'Lebanese', mealTypes: ['breakfast', 'lunch'], tags: ['vegetarian', 'weekend'],
    ingredients: ['2 pita', '1 tbsp olive oil', '2 cans chickpeas', '½ tsp ground cumin', '## Yogurt sauce', '400 g plain yogurt', '3 tbsp tahini', '2 garlic cloves, crushed', '2 tbsp lemon juice', '½ tsp salt', '## Topping', '20 g butter', '30 g pine nuts', '1 pinch paprika', '1 tbsp parsley, chopped'],
    steps: [
      'Cut the pita into squares, toss with oil and bake at 200°C for 8 minutes until crisp.',
      'Warm the chickpeas in their liquid with the cumin for 5 minutes.',
      'Whisk the yogurt, tahini, garlic, lemon juice and salt.',
      'Toast the pine nuts in the butter for 2 minutes until golden.',
      'Layer pita in a dish, add drained chickpeas, cover with yogurt sauce, then pour over the pine nut butter. Finish with paprika and parsley.'
    ]
  },
  {
    id: 'seed-french-toast', title: 'Cinnamon French Toast', emoji: 'bread',
    description: 'Golden custardy toast with berries and maple syrup.',
    servings: 2, prepMin: 5, cookMin: 10, cuisine: 'International', mealTypes: ['breakfast'], tags: ['kid-friendly', 'weekend'],
    ingredients: ['3 eggs', '120 ml milk', '1 tsp cinnamon', '1 tsp vanilla extract', '4 slices bread', '15 g butter', '150 g mixed berries', '2 tbsp maple syrup', '100 g greek yogurt'],
    steps: [
      'Whisk the eggs, milk, cinnamon and vanilla in a shallow dish.',
      'Dip each slice of bread for 10 seconds per side.',
      'Fry in the butter over medium heat for 3 minutes per side until golden.',
      'Serve with yogurt, berries and maple syrup.'
    ]
  },
  {
    id: 'seed-green-shakshuka', title: 'Green Shakshuka', emoji: 'greens',
    description: 'Eggs baked in garlicky spinach, zucchini and herbs, finished with feta.',
    servings: 2, prepMin: 10, cookMin: 15, cuisine: 'Middle Eastern', mealTypes: ['breakfast', 'lunch'], tags: ['one-pan', 'vegetarian', 'low-carb'],
    ingredients: ['2 tbsp olive oil', '1 zucchini, grated', '3 spring onions, sliced', '2 garlic cloves, sliced', '1 tsp ground cumin', '200 g baby spinach', '½ tsp salt', '4 eggs', '50 g feta', '1 handful fresh herbs', '1 lemon'],
    steps: [
      'Cook the zucchini and spring onion in the oil for 5 minutes. Add the garlic and cumin for 1 minute.',
      'Add the spinach and salt and stir until wilted, about 2 minutes.',
      'Make 4 wells, crack in the eggs, cover and cook for 5 minutes until the whites set.',
      'Top with feta, herbs and a squeeze of lemon.'
    ]
  },
  {
    id: 'seed-bircher', title: 'Apple Bircher Muesli', emoji: 'apple',
    description: 'Overnight oats soaked with grated apple, yogurt and nuts.',
    servings: 2, prepMin: 10, cookMin: 0, cuisine: 'Swiss', mealTypes: ['breakfast'], tags: ['meal-prep', 'no-cook', 'vegetarian'],
    ingredients: ['100 g rolled oats', '1 apple, grated', '150 g greek yogurt', '150 ml milk', '1 tbsp honey', '2 tbsp raisins', '2 tbsp walnuts, chopped', '½ tsp cinnamon'],
    steps: [
      'Mix the oats, apple, yogurt, milk, honey, raisins and cinnamon.',
      'Cover and chill overnight.',
      'Stir and top with walnuts before serving.'
    ]
  },

  /* ================================================ Lunch, salads & soups */
  {
    id: 'seed-caesar', title: 'Chicken Caesar Salad', emoji: 'salad',
    description: 'Crisp romaine, juicy chicken, croutons and a lighter yogurt Caesar dressing.',
    servings: 2, prepMin: 15, cookMin: 15, cuisine: 'American', mealTypes: ['lunch', 'dinner'], tags: ['high-protein', 'salad'],
    ingredients: ['2 chicken breasts', '1 tbsp olive oil', '½ tsp salt', '2 slices sourdough, cubed', '1 romaine lettuce, chopped', '30 g parmesan, shaved', '## Dressing', '3 tbsp greek yogurt', '1 tbsp mayonnaise', '1 tbsp lemon juice', '1 tsp dijon mustard', '1 garlic clove, grated', '20 g parmesan, grated', '1 pinch black pepper'],
    steps: [
      'Season the chicken with oil and salt and cook in a pan for 6 minutes per side. Rest and slice.',
      'Toast the bread cubes in the same pan for 4 minutes until crisp.',
      'Whisk all the dressing ingredients.',
      'Toss the lettuce with the dressing, then top with chicken, croutons and parmesan.'
    ]
  },
  {
    id: 'seed-lentil-feta-salad', title: 'Lentil, Feta & Herb Salad', emoji: 'salad',
    description: 'Hearty green lentils with roasted peppers, feta and a mustard vinaigrette.',
    servings: 4, prepMin: 10, cookMin: 20, cuisine: 'Mediterranean', mealTypes: ['lunch'], tags: ['vegetarian', 'meal-prep', 'salad'],
    ingredients: ['200 g green lentils', '2 red peppers, chopped', '1 tbsp olive oil', '½ red onion, finely diced', '150 g feta, crumbled', '1 bunch parsley, chopped', '100 g cherry tomatoes, halved', '## Dressing', '3 tbsp olive oil', '2 tbsp red wine vinegar', '1 tsp dijon mustard', '½ tsp salt'],
    steps: [
      'Simmer the lentils in plenty of water for 20 minutes until tender but holding shape. Drain.',
      'Meanwhile roast the peppers with 1 tbsp oil at 210°C for 20 minutes.',
      'Whisk the dressing and toss through the warm lentils.',
      'Fold in the peppers, onion, tomatoes, parsley and feta. Keeps 3 days in the fridge.'
    ]
  },
  {
    id: 'seed-shawarma-wrap', title: 'Chicken Shawarma Wraps', emoji: 'wrap',
    description: 'Spiced roasted chicken wrapped with garlic sauce, pickles and fries-free crunch.',
    servings: 4, prepMin: 15, cookMin: 25, cuisine: 'Lebanese', mealTypes: ['lunch', 'dinner'], tags: ['high-protein', 'family'],
    ingredients: ['700 g chicken thighs', '2 tbsp shawarma spice', '3 tbsp plain yogurt', '2 tbsp lemon juice', '2 tbsp olive oil', '3 garlic cloves, crushed', '1 tsp salt', '4 arabic bread', '4 tbsp garlic sauce', '4 pickles, sliced', '2 tomatoes, sliced', '1 handful parsley'],
    steps: [
      'Mix the shawarma spice, yogurt, lemon juice, oil, garlic and salt. Coat the chicken and marinate for at least 30 minutes.',
      'Roast at 220°C for 25 minutes until charred at the edges. Rest, then slice thinly.',
      'Spread the bread with garlic sauce, add chicken, pickles, tomato and parsley.',
      'Roll tightly and toast seam-side down in a dry pan for 1 minute.'
    ]
  },
  {
    id: 'seed-falafel-bowl', title: 'Baked Falafel Bowl', emoji: 'falafel',
    description: 'Herby oven-baked falafel with salad, hummus and tahini drizzle.',
    servings: 4, prepMin: 20, cookMin: 25, cuisine: 'Lebanese', mealTypes: ['lunch', 'dinner'], tags: ['vegan', 'meal-prep'],
    ingredients: ['250 g dried chickpeas, soaked overnight', '1 onion, chopped', '3 garlic cloves', '1 bunch parsley', '1 bunch coriander', '2 tsp ground cumin', '1 tsp ground coriander', '1 tsp salt', '1 tsp baking soda', '3 tbsp olive oil', '## Bowl', '200 g hummus', '1 cucumber, diced', '2 tomatoes, diced', '2 handfuls salad leaves', '2 tbsp tahini', '2 tbsp lemon juice'],
    steps: [
      'Drain the soaked chickpeas well. Pulse with the onion, garlic, herbs, spices and salt until finely chopped but not a paste.',
      'Stir in the baking soda and chill for 15 minutes.',
      'Heat the oven to 210°C. Shape into 20 patties, brush with the oil and bake for 25 minutes, flipping halfway.',
      'Thin the tahini with the lemon juice and a splash of water.',
      'Build bowls with leaves, cucumber, tomato, hummus and falafel. Drizzle with tahini.'
    ]
  },
  {
    id: 'seed-tuna-salad', title: 'Mediterranean Tuna & Bean Salad', emoji: 'fish',
    description: 'No-cook protein salad with tuna, white beans, olives and lemon.',
    servings: 2, prepMin: 10, cookMin: 0, cuisine: 'Mediterranean', mealTypes: ['lunch'], tags: ['quick', 'no-cook', 'high-protein'],
    ingredients: ['2 cans tuna', '1 can white beans, drained', '150 g cherry tomatoes, halved', '½ red onion, thinly sliced', '10 olives', '1 handful parsley, chopped', '3 tbsp olive oil', '2 tbsp lemon juice', '1 pinch salt'],
    steps: [
      'Combine the tuna, beans, tomatoes, onion, olives and parsley.',
      'Dress with olive oil, lemon juice and salt and toss gently.'
    ]
  },
  {
    id: 'seed-harira', title: 'Moroccan Harira', emoji: 'soup',
    description: 'Spiced tomato, lentil and chickpea soup with lamb.',
    servings: 6, prepMin: 15, cookMin: 50, cuisine: 'Moroccan', mealTypes: ['lunch', 'dinner'], tags: ['meal-prep', 'freezer-friendly'],
    ingredients: ['2 tbsp olive oil', '300 g lamb, diced small', '1 onion, chopped', '2 celery sticks, chopped', '1 tsp turmeric', '1 tsp cinnamon', '1 tsp ground ginger', '2 tbsp tomato paste', '1 can chopped tomatoes', '150 g red lentils', '1 can chickpeas, drained', '1.5 l chicken stock', '1 tsp salt', '1 bunch coriander, chopped', '1 lemon'],
    steps: [
      'Brown the lamb in the oil for 5 minutes. Add the onion and celery for 5 minutes.',
      'Stir in the spices and tomato paste for 1 minute.',
      'Add the tomatoes, lentils, chickpeas, stock and salt. Simmer for 40 minutes.',
      'Stir in most of the coriander. Serve with lemon wedges and the rest of the herbs.'
    ]
  },
  {
    id: 'seed-tomato-soup', title: 'Roasted Tomato & Basil Soup', emoji: 'tomato',
    description: 'Velvety soup from roasted tomatoes, garlic and basil.',
    servings: 4, prepMin: 10, cookMin: 40, cuisine: 'Italian', mealTypes: ['lunch'], tags: ['vegan', 'freezer-friendly'],
    ingredients: ['1 kg tomatoes, halved', '1 onion, quartered', '4 garlic cloves', '3 tbsp olive oil', '1 tsp salt', '500 ml vegetable stock', '1 handful fresh basil', '4 slices sourdough'],
    steps: [
      'Heat the oven to 200°C. Roast the tomatoes, onion and garlic with the oil and salt for 35 minutes.',
      'Tip into a pot with the stock and basil and simmer for 5 minutes.',
      'Blend until smooth and serve with toasted sourdough.'
    ]
  },
  {
    id: 'seed-chicken-noodle', title: 'Chicken Noodle Soup', emoji: 'noodles',
    description: 'Comforting broth with chicken, vegetables and noodles.',
    servings: 4, prepMin: 10, cookMin: 30, cuisine: 'International', mealTypes: ['lunch', 'dinner'], tags: ['family', 'high-protein'],
    ingredients: ['1 tbsp olive oil', '1 onion, diced', '2 carrots, sliced', '2 celery sticks, sliced', '2 garlic cloves, minced', '500 g chicken thighs', '1.5 l chicken stock', '1 bay leaf', '150 g egg noodles', '1 handful parsley, chopped', '1 lemon'],
    steps: [
      'Soften the onion, carrot and celery in the oil for 6 minutes. Add the garlic for 1 minute.',
      'Add the whole chicken thighs, stock and bay leaf. Simmer for 20 minutes.',
      'Lift out the chicken, shred it and return to the pot with the noodles. Cook for 4 minutes.',
      'Finish with parsley and a squeeze of lemon.'
    ]
  },
  {
    id: 'seed-batata-harra', title: 'Batata Harra', emoji: 'potato',
    description: 'Lebanese spicy potatoes with garlic, coriander and chili.',
    servings: 4, prepMin: 10, cookMin: 35, cuisine: 'Lebanese', mealTypes: ['lunch', 'snack'], tags: ['vegan', 'side'],
    ingredients: ['800 g potatoes, cubed', '4 tbsp olive oil', '1 tsp salt', '4 garlic cloves, crushed', '1 red chili, chopped', '1 bunch coriander, chopped', '1 tsp chili flakes', '2 tbsp lemon juice'],
    steps: [
      'Heat the oven to 220°C. Toss the potatoes with 3 tbsp oil and the salt and roast for 30 minutes, turning once.',
      'Fry the garlic and chili in the remaining oil for 1 minute, then stir in the coriander and chili flakes.',
      'Toss the hot potatoes with the garlic mix and lemon juice.'
    ]
  },
  {
    id: 'seed-caprese-pasta', title: 'Caprese Pasta Salad', emoji: 'pasta',
    description: 'Pasta with cherry tomatoes, mozzarella, basil and pesto.',
    servings: 4, prepMin: 10, cookMin: 10, cuisine: 'Italian', mealTypes: ['lunch'], tags: ['vegetarian', 'meal-prep'],
    ingredients: ['300 g fusilli', '300 g cherry tomatoes, halved', '250 g mozzarella, torn', '3 tbsp pesto', '2 tbsp olive oil', '1 handful fresh basil', '1 pinch salt'],
    steps: [
      'Cook the pasta for 10 minutes, drain and rinse under cold water.',
      'Toss with the pesto, olive oil and salt.',
      'Fold in the tomatoes, mozzarella and basil. Serve or chill for later.'
    ]
  },
  {
    id: 'seed-peanut-noodles', title: 'Thai Peanut Noodle Salad', emoji: 'nut',
    description: 'Rice noodles and crunchy veg tossed in a zingy peanut-lime sauce.',
    servings: 3, prepMin: 15, cookMin: 5, cuisine: 'Thai', mealTypes: ['lunch', 'dinner'], tags: ['vegan', 'quick'],
    ingredients: ['200 g rice noodles', '2 carrots, cut into matchsticks', '1 red pepper, thinly sliced', '150 g red cabbage, shredded', '3 spring onions, sliced', '1 handful coriander', '30 g peanuts, chopped', '## Sauce', '3 tbsp peanut butter', '2 tbsp soy sauce', '2 tbsp lime juice', '1 tbsp maple syrup', '1 tsp ginger, grated', '60 ml warm water'],
    steps: [
      'Soak or cook the noodles according to the packet, about 5 minutes. Rinse under cold water.',
      'Whisk the sauce ingredients until smooth.',
      'Toss the noodles with the vegetables and sauce.',
      'Top with coriander and peanuts.'
    ]
  },
  {
    id: 'seed-chicken-avocado-bowl', title: 'Chicken & Avocado Rice Bowl', emoji: 'avocado',
    description: 'Lemon chicken, brown rice, avocado and crunchy veg.',
    servings: 2, prepMin: 10, cookMin: 25, cuisine: 'International', mealTypes: ['lunch', 'dinner'], tags: ['high-protein', 'meal-prep'],
    ingredients: ['120 g brown rice', '350 g chicken breast', '1 tbsp olive oil', '1 tsp paprika', '½ tsp salt', '1 avocado, sliced', '1 cucumber, diced', '100 g sweetcorn', '2 tbsp greek yogurt', '1 tbsp lemon juice'],
    steps: [
      'Cook the rice in plenty of water for 25 minutes; drain.',
      'Rub the chicken with oil, paprika and salt; cook for 6 minutes per side. Rest and slice.',
      'Stir the lemon juice into the yogurt.',
      'Build bowls with rice, chicken, avocado, cucumber and sweetcorn. Drizzle with lemon yogurt.'
    ]
  },
  {
    id: 'seed-egg-fried-rice', title: 'Egg Fried Rice', emoji: 'rice',
    description: 'Fast fried rice with egg, peas and spring onion — perfect for leftover rice.',
    servings: 2, prepMin: 5, cookMin: 10, cuisine: 'Chinese', mealTypes: ['lunch', 'dinner'], tags: ['quick', 'budget', 'vegetarian'],
    ingredients: ['400 g cooked rice', '2 tbsp vegetable oil', '3 eggs, beaten', '120 g frozen peas', '1 carrot, diced', '3 spring onions, sliced', '2 garlic cloves, minced', '2 tbsp soy sauce', '1 tsp sesame oil'],
    steps: [
      'Heat 1 tbsp oil in a wok and scramble the eggs for 1 minute; remove.',
      'Add the remaining oil and stir-fry the carrot, peas and garlic for 3 minutes.',
      'Add the rice and fry for 4 minutes, pressing it against the wok.',
      'Return the eggs, add soy sauce, sesame oil and spring onions and toss well.'
    ]
  },
  {
    id: 'seed-loubieh', title: 'Loubieh bi Zeit', emoji: 'peas',
    description: 'Lebanese green beans braised in tomato, garlic and olive oil. Served warm or cold.',
    servings: 4, prepMin: 10, cookMin: 35, cuisine: 'Lebanese', mealTypes: ['lunch', 'dinner'], tags: ['vegan', 'side'],
    ingredients: ['4 tbsp olive oil', '1 onion, sliced', '4 garlic cloves, sliced', '600 g green beans, trimmed', '3 tomatoes, chopped', '1 tbsp tomato paste', '1 tsp salt', '½ tsp seven spice', '150 ml water', '2 pita'],
    steps: [
      'Cook the onion in the oil for 5 minutes, then add the garlic for 1 minute.',
      'Add the beans and toss for 3 minutes.',
      'Add the tomatoes, tomato paste, salt, seven spice and water. Cover and simmer for 25 minutes until the beans are very tender.',
      'Serve warm or at room temperature with bread.'
    ]
  },
  {
    id: 'seed-pumpkin-soup', title: 'Spiced Pumpkin Soup', emoji: 'pumpkin',
    description: 'Silky roasted butternut squash soup with cumin and coconut.',
    servings: 4, prepMin: 15, cookMin: 40, cuisine: 'International', mealTypes: ['lunch', 'dinner'], tags: ['vegan', 'freezer-friendly'],
    ingredients: ['1 kg butternut squash, cubed', '1 onion, chopped', '2 tbsp olive oil', '1 tsp ground cumin', '1 tsp salt', '800 ml vegetable stock', '200 ml coconut milk', '2 tbsp pumpkin seeds'],
    steps: [
      'Heat the oven to 210°C. Roast the squash and onion with the oil, cumin and salt for 30 minutes.',
      'Simmer with the stock for 5 minutes, then blend until smooth.',
      'Stir in most of the coconut milk. Serve with a swirl of the rest and the pumpkin seeds.'
    ]
  },

  /* ================================================================ Dinner */
  {
    id: 'seed-machboos', title: 'Chicken Machboos', emoji: 'drumstick',
    description: 'Emirati spiced chicken and rice with dried lime, tomato and baharat.',
    servings: 6, prepMin: 15, cookMin: 60, cuisine: 'Emirati', mealTypes: ['dinner'], tags: ['family', 'weekend'],
    ingredients: ['1 whole chicken, cut into pieces', '3 tbsp ghee', '2 onions, sliced', '4 garlic cloves, minced', '1 thumb ginger, grated', '2 tbsp machboos spice', '1 tsp turmeric', '2 dried limes, pierced', '2 tomatoes, chopped', '1 green chili', '1.2 l water', '2 tsp salt', '500 g basmati rice, soaked', '1 pinch saffron', '2 tbsp rose water', '1 handful coriander'],
    steps: [
      'Fry the onions in the ghee for 10 minutes until golden. Add the garlic, ginger, spices and dried limes for 1 minute.',
      'Add the chicken and brown for 5 minutes, then the tomatoes and chili for 3 minutes.',
      'Pour in the water with the salt and simmer for 35 minutes. Lift out the chicken and roast it at 220°C for 15 minutes to crisp.',
      'Add the drained rice to the broth (you need about 800 ml), cover and cook on low for 18 minutes.',
      'Soak the saffron in the rose water and drizzle over the rice. Serve topped with the chicken and coriander.'
    ]
  },
  {
    id: 'seed-kibbeh-sanieh', title: 'Baked Kibbeh (Kibbeh bil Sanieh)', emoji: 'pie',
    description: 'Layers of spiced lamb and bulgur with a pine-nut and onion filling, baked in a tray.',
    servings: 8, prepMin: 40, cookMin: 40, cuisine: 'Lebanese', mealTypes: ['dinner', 'lunch'], tags: ['family', 'weekend', 'freezer-friendly'],
    ingredients: ['## Shell', '250 g bulgur', '500 g lamb mince', '1 onion, grated', '1 tsp seven spice', '1 tsp salt', '## Filling', '300 g lamb mince', '2 onions, finely chopped', '40 g pine nuts', '1 tsp seven spice', '½ tsp salt', '## To finish', '60 g butter, melted', '2 tbsp olive oil', '500 g plain yogurt', '1 cucumber, diced'],
    steps: [
      'Soak the bulgur in cold water for 15 minutes, then squeeze very dry.',
      'For the filling, fry the onions in the olive oil for 8 minutes, add the lamb and brown for 8 minutes. Stir in the pine nuts, seven spice and salt.',
      'For the shell, knead the bulgur with the lamb, grated onion, spice and salt into a smooth paste, wetting your hands as you go.',
      'Heat the oven to 200°C. Press half the shell into a buttered tray, spread over the filling, then cover with the rest of the shell, smoothing with wet hands.',
      'Score into diamonds, pour over the melted butter and bake for 40 minutes until browned. Serve with yogurt and cucumber.'
    ]
  },
  {
    id: 'seed-kofta-tahini', title: 'Lamb Kofta with Tahini Sauce', emoji: 'skewer',
    description: 'Grilled spiced lamb skewers with lemony tahini and a quick salad.',
    servings: 4, prepMin: 20, cookMin: 12, cuisine: 'Lebanese', mealTypes: ['dinner'], tags: ['high-protein', 'grill'],
    ingredients: ['600 g lamb mince', '1 onion, grated', '1 bunch parsley, finely chopped', '1 tsp seven spice', '1 tsp salt', '## Tahini sauce', '80 g tahini', '3 tbsp lemon juice', '1 garlic clove, crushed', '80 ml cold water', '## To serve', '4 pita', '2 tomatoes, sliced', '1 red onion, sliced', '1 tsp sumac'],
    steps: [
      'Squeeze the grated onion dry, then knead with the lamb, parsley, seven spice and salt for 2 minutes.',
      'Shape around 8 skewers and chill for 15 minutes.',
      'Whisk the tahini, lemon, garlic and water until smooth and pourable.',
      'Grill the kofta for 10 minutes, turning, until charred and cooked through.',
      'Serve on pita with tomato, onion tossed with sumac, and tahini sauce.'
    ]
  },
  {
    id: 'seed-maqluba', title: 'Maqluba', emoji: 'eggplant',
    description: 'The "upside-down" pot of spiced rice, chicken and roasted aubergine.',
    servings: 6, prepMin: 25, cookMin: 70, cuisine: 'Middle Eastern', mealTypes: ['dinner'], tags: ['family', 'weekend'],
    ingredients: ['800 g chicken thighs', '1 onion, quartered', '1.2 l water', '2 tsp salt', '2 eggplants, sliced', '1 cauliflower, cut into florets', '4 tbsp olive oil', '2 tomatoes, sliced', '400 g basmati rice, soaked', '2 tsp seven spice', '1 tsp turmeric', '30 g almonds, toasted', '30 g pine nuts, toasted', '300 g plain yogurt'],
    steps: [
      'Simmer the chicken with the onion, water and half the salt for 30 minutes. Keep the broth.',
      'Brush the aubergine and cauliflower with oil and roast at 220°C for 25 minutes until golden.',
      'Layer a heavy pot with tomato slices, then the chicken, aubergine and cauliflower.',
      'Mix the rice with the spices and remaining salt and spread on top. Pour over 800 ml of broth.',
      'Cover and cook on low for 35 minutes. Rest 10 minutes, then flip onto a tray. Top with nuts; serve with yogurt.'
    ]
  },
  {
    id: 'seed-freekeh-chicken', title: 'Freekeh with Chicken', emoji: 'wheat',
    description: 'Smoky cracked green wheat cooked in chicken broth with warm spices and nuts.',
    servings: 4, prepMin: 15, cookMin: 50, cuisine: 'Lebanese', mealTypes: ['dinner'], tags: ['high-protein', 'family'],
    ingredients: ['700 g chicken thighs', '1 onion, chopped', '2 tbsp butter', '1 tsp seven spice', '½ tsp cinnamon', '250 g freekeh, rinsed', '900 ml chicken stock', '1 tsp salt', '30 g almonds, toasted', '200 g plain yogurt'],
    steps: [
      'Season the chicken with half the spices and salt and brown in the butter for 5 minutes per side; remove.',
      'Soften the onion for 5 minutes, add the freekeh and remaining spices and stir for 2 minutes.',
      'Add the stock, nestle in the chicken, cover and simmer for 35 minutes until the freekeh is tender.',
      'Shred the chicken over the freekeh, top with almonds and serve with yogurt.'
    ]
  },
  {
    id: 'seed-sayadieh', title: 'Sayadieh', emoji: 'fish',
    description: 'Lebanese fisherman\'s rice — caramelised onion rice with spiced white fish.',
    servings: 4, prepMin: 15, cookMin: 50, cuisine: 'Lebanese', mealTypes: ['dinner'], tags: ['high-protein'],
    ingredients: ['4 white fish fillets', '1 tsp ground cumin', '1 tsp salt', '4 tbsp olive oil', '3 onions, thinly sliced', '300 g basmati rice, rinsed', '600 ml vegetable stock', '½ tsp cinnamon', '30 g pine nuts, toasted', '1 lemon'],
    steps: [
      'Fry the onions in 3 tbsp oil for 20 minutes until deep brown. Set aside a third for topping.',
      'Add the rice, cumin, cinnamon and half the salt to the pot, stir, then pour in the stock. Cover and cook on low for 18 minutes.',
      'Season the fish with the rest of the salt and pan-fry in the remaining oil for 3 minutes per side.',
      'Serve the rice topped with fish, crispy onions, pine nuts and lemon wedges.'
    ]
  },
  {
    id: 'seed-bamia', title: 'Bamia (Okra & Lamb Stew)', emoji: 'casserole',
    description: 'Tender lamb and okra in a garlicky tomato and coriander sauce.',
    servings: 4, prepMin: 15, cookMin: 75, cuisine: 'Lebanese', mealTypes: ['dinner'], tags: ['family', 'freezer-friendly'],
    ingredients: ['500 g lamb, diced', '2 tbsp olive oil', '1 onion, chopped', '6 garlic cloves, crushed', '1 bunch coriander, chopped', '500 g okra', '3 tbsp tomato paste', '1 can chopped tomatoes', '600 ml water', '1 tsp seven spice', '1 tsp salt', '2 tbsp lemon juice', '300 g basmati rice'],
    steps: [
      'Brown the lamb in the oil for 6 minutes. Add the onion for 5 minutes.',
      'Add the tomato paste, tomatoes, water, seven spice and salt. Cover and simmer for 45 minutes.',
      'Fry the garlic and coriander in a splash of oil for 1 minute and stir into the stew with the okra. Simmer 20 minutes more.',
      'Finish with lemon juice. Serve with rice.'
    ]
  },
  {
    id: 'seed-tikka-masala', title: 'Chicken Tikka Masala', emoji: 'curry',
    description: 'Charred yogurt-marinated chicken in a creamy spiced tomato sauce.',
    servings: 4, prepMin: 20, cookMin: 35, cuisine: 'Indian', mealTypes: ['dinner'], tags: ['high-protein', 'family'],
    ingredients: ['700 g chicken breast, cubed', '150 g plain yogurt', '2 tsp garam masala', '1 tsp turmeric', '1 tsp salt', '## Sauce', '2 tbsp ghee', '1 onion, finely chopped', '4 garlic cloves, minced', '1 thumb ginger, grated', '2 tsp garam masala', '1 tsp ground cumin', '1 tsp paprika', '1 can crushed tomatoes', '150 ml cooking cream', '1 handful coriander', '300 g basmati rice'],
    steps: [
      'Marinate the chicken in the yogurt, garam masala, turmeric and salt for at least 30 minutes.',
      'Grill or roast at 230°C for 12 minutes until charred.',
      'Cook the onion in the ghee for 8 minutes; add the garlic, ginger and spices for 1 minute.',
      'Add the tomatoes and simmer for 10 minutes, then stir in the cream and chicken and simmer for 5 minutes.',
      'Serve with rice and coriander.'
    ]
  },
  {
    id: 'seed-green-curry', title: 'Thai Green Chicken Curry', emoji: 'soup',
    description: 'Fragrant coconut curry with chicken, green beans and basil.',
    servings: 4, prepMin: 10, cookMin: 20, cuisine: 'Thai', mealTypes: ['dinner'], tags: ['quick', 'dairy-free'],
    ingredients: ['1 tbsp vegetable oil', '3 tbsp green curry paste', '600 g chicken thighs, sliced', '1 can coconut milk', '200 ml chicken stock', '1 tbsp fish sauce', '1 tsp sugar', '200 g green beans, halved', '1 red pepper, sliced', '1 handful fresh basil', '1 lime', '300 g jasmine rice'],
    steps: [
      'Cook the rice.',
      'Fry the curry paste in the oil for 1 minute until fragrant.',
      'Add the chicken and stir-fry for 4 minutes.',
      'Pour in the coconut milk, stock, fish sauce and sugar. Add the beans and pepper and simmer for 10 minutes.',
      'Stir in the basil and a squeeze of lime. Serve over rice.'
    ]
  },
  {
    id: 'seed-bulgogi', title: 'Beef Bulgogi Rice Bowls', emoji: 'steak',
    description: 'Sweet-savoury Korean-style beef with rice and quick cucumber pickle.',
    servings: 4, prepMin: 15, cookMin: 10, cuisine: 'Korean', mealTypes: ['dinner'], tags: ['quick', 'high-protein'],
    ingredients: ['600 g beef steak, very thinly sliced', '4 tbsp soy sauce', '2 tbsp brown sugar', '1 tbsp sesame oil', '3 garlic cloves, grated', '1 tsp ginger, grated', '1 pear or apple, grated', '1 tbsp vegetable oil', '3 spring onions, sliced', '1 tbsp sesame seeds', '300 g short grain rice', '1 cucumber, thinly sliced', '2 tbsp vinegar'],
    steps: [
      'Mix the soy sauce, sugar, sesame oil, garlic, ginger and grated apple. Marinate the beef for 15 minutes.',
      'Cook the rice. Toss the cucumber with the vinegar and a pinch of salt.',
      'Stir-fry the beef in batches in a very hot oiled pan for 2 minutes each.',
      'Serve over rice with cucumber, spring onions and sesame seeds.'
    ]
  },
  {
    id: 'seed-shrimp-pasta', title: 'Garlic Shrimp Linguine', emoji: 'shrimp',
    description: 'Prawns, garlic, chili and lemon tossed with linguine.',
    servings: 2, prepMin: 10, cookMin: 15, cuisine: 'Italian', mealTypes: ['dinner'], tags: ['quick', 'high-protein'],
    ingredients: ['200 g linguine', '300 g prawns, peeled', '3 tbsp olive oil', '4 garlic cloves, sliced', '½ tsp chili flakes', '150 g cherry tomatoes, halved', '1 lemon', '1 handful parsley, chopped', '½ tsp salt'],
    steps: [
      'Cook the linguine for 10 minutes. Save a cup of pasta water.',
      'Gently fry the garlic and chili in the oil for 1 minute. Add the prawns and salt and cook for 2 minutes per side.',
      'Add the tomatoes for 2 minutes, then toss in the pasta, lemon zest and juice, parsley and a splash of pasta water.'
    ]
  },
  {
    id: 'seed-pesto-chicken-pasta', title: 'Creamy Pesto Chicken Pasta', emoji: 'herb',
    description: 'Chicken, spinach and penne in a light pesto cream sauce.',
    servings: 4, prepMin: 10, cookMin: 20, cuisine: 'Italian', mealTypes: ['dinner'], tags: ['family', 'high-protein'],
    ingredients: ['350 g penne', '500 g chicken breast, sliced', '1 tbsp olive oil', '½ tsp salt', '4 tbsp pesto', '100 ml cooking cream', '100 g baby spinach', '30 g parmesan, grated'],
    steps: [
      'Cook the penne for 11 minutes.',
      'Season the chicken with salt and fry in the oil for 7 minutes until cooked.',
      'Add the pesto and cream and bubble for 1 minute, then wilt in the spinach.',
      'Toss with the pasta and a splash of pasta water. Serve with parmesan.'
    ]
  },
  {
    id: 'seed-lasagne', title: 'Classic Beef Lasagne', emoji: 'cheese',
    description: 'Rich beef ragù layered with pasta and a quick ricotta-mozzarella topping.',
    servings: 6, prepMin: 25, cookMin: 75, cuisine: 'Italian', mealTypes: ['dinner'], tags: ['family', 'freezer-friendly', 'weekend'],
    ingredients: ['1 tbsp olive oil', '1 onion, diced', '1 carrot, diced', '3 garlic cloves, minced', '600 g beef mince', '2 tbsp tomato paste', '700 ml passata', '1 tsp dried oregano', '1 tsp salt', '250 g lasagne sheets', '250 g ricotta', '1 egg', '200 g mozzarella, grated', '40 g parmesan, grated'],
    steps: [
      'Cook the onion and carrot in the oil for 6 minutes. Add the garlic and beef and brown for 8 minutes.',
      'Stir in the tomato paste, passata, oregano and salt; simmer for 25 minutes.',
      'Heat the oven to 190°C. Mix the ricotta with the egg and half the parmesan.',
      'Layer ragù, pasta and ricotta three times, finishing with ragù. Top with mozzarella and parmesan.',
      'Bake for 40 minutes until bubbling and golden. Rest for 10 minutes before cutting.'
    ]
  },
  {
    id: 'seed-fajitas', title: 'Sheet-Pan Chicken Fajitas', emoji: 'pepper',
    description: 'Smoky chicken and peppers roasted on one tray, wrapped in warm tortillas.',
    servings: 4, prepMin: 10, cookMin: 22, cuisine: 'Mexican', mealTypes: ['dinner'], tags: ['one-pan', 'high-protein', 'family'],
    ingredients: ['600 g chicken breast, sliced', '3 peppers, sliced', '1 red onion, sliced', '2 tbsp olive oil', '2 tbsp fajita seasoning', '½ tsp salt', '8 tortillas', '1 avocado', '100 g sour cream', '1 lime'],
    steps: [
      'Heat the oven to 220°C. Toss the chicken, peppers and onion with the oil, seasoning and salt on a large tray.',
      'Roast for 22 minutes, stirring halfway.',
      'Mash the avocado with half the lime juice.',
      'Serve in warm tortillas with avocado, sour cream and lime wedges.'
    ]
  },
  {
    id: 'seed-beef-tacos', title: 'Beef Tacos', emoji: 'taco',
    description: 'Spiced beef with crunchy lettuce, tomato salsa and cheese.',
    servings: 4, prepMin: 10, cookMin: 15, cuisine: 'Mexican', mealTypes: ['dinner'], tags: ['quick', 'family'],
    ingredients: ['500 g beef mince', '1 onion, diced', '2 tbsp taco seasoning', '2 tbsp tomato paste', '100 ml water', '8 tortillas', '2 tomatoes, diced', '1 handful coriander', '1 lime', '100 g lettuce, shredded', '80 g cheddar, grated'],
    steps: [
      'Brown the beef and onion for 8 minutes.',
      'Stir in the taco seasoning, tomato paste and water and simmer for 5 minutes until saucy.',
      'Mix the tomatoes, coriander and lime juice for a quick salsa.',
      'Fill warm tortillas with beef, lettuce, salsa and cheese.'
    ]
  },
  {
    id: 'seed-baked-fish', title: 'Lemon Herb Baked Fish', emoji: 'fish',
    description: 'Flaky white fish baked with lemon, garlic and herbs over cherry tomatoes.',
    servings: 2, prepMin: 10, cookMin: 15, cuisine: 'Mediterranean', mealTypes: ['dinner'], tags: ['quick', 'high-protein', 'low-carb'],
    ingredients: ['2 white fish fillets', '250 g cherry tomatoes', '2 tbsp olive oil', '2 garlic cloves, sliced', '1 lemon, sliced', '1 tsp dried oregano', '½ tsp salt', '1 handful parsley', '200 g green beans'],
    steps: [
      'Heat the oven to 200°C. Toss the tomatoes and garlic with half the oil in a dish.',
      'Lay the fish on top, season with salt and oregano, cover with lemon slices and drizzle with the rest of the oil.',
      'Bake for 14 minutes until the fish flakes. Steam the beans for 4 minutes.',
      'Scatter with parsley and serve with the beans.'
    ]
  },
  {
    id: 'seed-harissa-salmon', title: 'Harissa Salmon with Couscous', emoji: 'chili',
    description: 'Spicy harissa-glazed salmon over herby lemon couscous.',
    servings: 2, prepMin: 10, cookMin: 12, cuisine: 'Moroccan', mealTypes: ['dinner'], tags: ['quick', 'high-protein'],
    ingredients: ['2 salmon fillets', '2 tbsp harissa', '1 tsp honey', '120 g couscous', '180 ml boiling water', '1 tbsp olive oil', '1 lemon', '1 handful mint, chopped', '1 handful parsley, chopped', '100 g plain yogurt'],
    steps: [
      'Heat the oven to 210°C. Mix the harissa and honey and spread over the salmon. Roast for 12 minutes.',
      'Pour the boiling water over the couscous with the oil and a pinch of salt, cover for 5 minutes, then fluff.',
      'Stir the lemon juice and herbs through the couscous.',
      'Serve the salmon on the couscous with a spoon of yogurt.'
    ]
  },
  {
    id: 'seed-turkey-burgers', title: 'Turkey Burgers & Sweet Potato Wedges', emoji: 'burger',
    description: 'Juicy lean burgers with crispy oven wedges.',
    servings: 4, prepMin: 15, cookMin: 30, cuisine: 'American', mealTypes: ['dinner'], tags: ['high-protein', 'family'],
    ingredients: ['3 sweet potatoes, cut into wedges', '2 tbsp olive oil', '1 tsp smoked paprika', '1 tsp salt', '500 g turkey mince', '1 egg', '30 g breadcrumbs', '1 tsp garlic powder', '4 burger buns', '1 tomato, sliced', '4 lettuce leaves', '4 tbsp ketchup'],
    steps: [
      'Heat the oven to 220°C. Toss the wedges with the oil, paprika and half the salt and roast for 30 minutes.',
      'Mix the turkey, egg, breadcrumbs, garlic powder and remaining salt. Shape 4 patties.',
      'Cook the patties in a hot pan for 5 minutes per side until cooked through.',
      'Build burgers with lettuce, tomato and ketchup. Serve with the wedges.'
    ]
  },
  {
    id: 'seed-souvlaki', title: 'Chicken Souvlaki with Tzatziki', emoji: 'salad',
    description: 'Oregano-lemon chicken skewers with cool homemade tzatziki.',
    servings: 4, prepMin: 20, cookMin: 12, cuisine: 'Greek', mealTypes: ['dinner', 'lunch'], tags: ['high-protein', 'grill'],
    ingredients: ['700 g chicken breast, cubed', '3 tbsp olive oil', '3 tbsp lemon juice', '2 tsp dried oregano', '2 garlic cloves, crushed', '1 tsp salt', '## Tzatziki', '250 g greek yogurt', '½ cucumber, grated', '1 garlic clove, grated', '1 tbsp dill, chopped', '1 pinch salt', '## To serve', '4 pita', '2 tomatoes, sliced', '½ red onion, sliced'],
    steps: [
      'Marinate the chicken with the oil, lemon, oregano, garlic and salt for 30 minutes.',
      'Squeeze the grated cucumber dry and mix with the yogurt, garlic, dill and salt.',
      'Thread onto skewers and grill for 12 minutes, turning, until golden.',
      'Serve with warm pita, tomato, onion and tzatziki.'
    ]
  },
  {
    id: 'seed-mushroom-risotto', title: 'Mushroom Risotto', emoji: 'mushroom',
    description: 'Creamy risotto with garlicky mushrooms and parmesan.',
    servings: 4, prepMin: 10, cookMin: 30, cuisine: 'Italian', mealTypes: ['dinner'], tags: ['vegetarian'],
    ingredients: ['400 g mushrooms, sliced', '2 tbsp olive oil', '30 g butter', '1 onion, finely diced', '2 garlic cloves, minced', '300 g arborio rice', '1.2 l vegetable stock, hot', '50 g parmesan, grated', '1 handful parsley, chopped', '½ tsp salt'],
    steps: [
      'Fry the mushrooms in the oil over high heat for 6 minutes until golden; set aside.',
      'Melt half the butter, soften the onion for 5 minutes and add the garlic and rice for 1 minute.',
      'Add the hot stock a ladle at a time, stirring, until absorbed, for about 20 minutes.',
      'Stir in the mushrooms, remaining butter, parmesan, salt and parsley. Rest 2 minutes before serving.'
    ]
  },
  {
    id: 'seed-tagine', title: 'Moroccan Chicken Tagine', emoji: 'pot',
    description: 'Chicken thighs braised with chickpeas, apricots and warm spices.',
    servings: 4, prepMin: 15, cookMin: 45, cuisine: 'Moroccan', mealTypes: ['dinner'], tags: ['family', 'dairy-free'],
    ingredients: ['800 g chicken thighs', '2 tbsp olive oil', '1 onion, sliced', '3 garlic cloves, minced', '2 tsp ras el hanout', '1 tsp turmeric', '1 can chopped tomatoes', '1 can chickpeas, drained', '80 g dried apricots, halved', '300 ml chicken stock', '1 tsp salt', '1 handful coriander', '250 g couscous'],
    steps: [
      'Brown the chicken in the oil for 5 minutes per side; remove.',
      'Cook the onion for 6 minutes, then the garlic and spices for 1 minute.',
      'Add the tomatoes, chickpeas, apricots, stock and salt. Return the chicken, cover and simmer for 30 minutes.',
      'Prepare the couscous with boiling water. Serve the tagine over couscous with coriander.'
    ]
  },
  {
    id: 'seed-stroganoff', title: 'Beef Stroganoff', emoji: 'steak',
    description: 'Seared beef and mushrooms in a tangy paprika cream sauce.',
    servings: 4, prepMin: 10, cookMin: 20, cuisine: 'Russian', mealTypes: ['dinner'], tags: ['quick', 'high-protein'],
    ingredients: ['500 g beef steak, thinly sliced', '1 tbsp olive oil', '20 g butter', '1 onion, sliced', '250 g mushrooms, sliced', '2 garlic cloves, minced', '1 tsp paprika', '1 tsp dijon mustard', '250 ml beef stock', '150 g sour cream', '½ tsp salt', '300 g tagliatelle', '1 tbsp parsley, chopped'],
    steps: [
      'Cook the tagliatelle according to the packet.',
      'Sear the beef in the oil over high heat for 2 minutes in batches; remove.',
      'Melt the butter and cook the onion and mushrooms for 8 minutes. Add garlic and paprika for 1 minute.',
      'Add the mustard and stock and bubble for 3 minutes, then stir in the sour cream, salt and beef.',
      'Serve over the pasta with parsley.'
    ]
  },
  {
    id: 'seed-prawn-noodles', title: 'Prawn & Veg Stir-Fry Noodles', emoji: 'noodles',
    description: 'Quick egg noodles with prawns, crunchy veg and a garlicky soy sauce.',
    servings: 3, prepMin: 10, cookMin: 10, cuisine: 'Chinese', mealTypes: ['dinner'], tags: ['quick', 'high-protein'],
    ingredients: ['225 g egg noodles', '350 g prawns, peeled', '2 tbsp vegetable oil', '3 garlic cloves, minced', '1 thumb ginger, grated', '1 red pepper, sliced', '150 g broccoli, small florets', '2 carrots, cut into matchsticks', '3 tbsp soy sauce', '1 tbsp honey', '1 tsp sesame oil', '3 spring onions, sliced'],
    steps: [
      'Cook the noodles for 4 minutes, drain and toss with the sesame oil.',
      'Stir-fry the prawns in half the oil for 2 minutes; remove.',
      'Stir-fry the garlic, ginger and vegetables in the rest of the oil for 3 minutes.',
      'Add the noodles, prawns, soy sauce and honey and toss for 2 minutes. Top with spring onions.'
    ]
  },
  {
    id: 'seed-stuffed-peppers', title: 'Stuffed Peppers with Beef & Rice', emoji: 'pepper',
    description: 'Peppers baked with a spiced beef, rice and tomato filling.',
    servings: 4, prepMin: 20, cookMin: 40, cuisine: 'Mediterranean', mealTypes: ['dinner'], tags: ['family', 'gluten-free'],
    ingredients: ['4 red peppers', '400 g beef mince', '1 onion, diced', '2 garlic cloves, minced', '250 g cooked rice', '1 can chopped tomatoes', '1 tsp seven spice', '1 tsp salt', '1 tbsp olive oil', '60 g mozzarella, grated', '1 handful parsley'],
    steps: [
      'Heat the oven to 200°C. Halve the peppers and remove the seeds.',
      'Brown the beef and onion in the oil for 8 minutes. Add garlic, spices, salt and half the tomatoes; simmer 5 minutes.',
      'Stir in the rice and fill the peppers. Pour the remaining tomatoes into the dish around them.',
      'Cover with foil and bake for 25 minutes, then top with cheese and bake uncovered for 10 minutes. Finish with parsley.'
    ]
  },
  {
    id: 'seed-lamb-chops', title: 'Grilled Lamb Chops with Lemon Potatoes', emoji: 'meat',
    description: 'Garlic-rosemary lamb chops with crispy lemony roast potatoes.',
    servings: 4, prepMin: 15, cookMin: 40, cuisine: 'Greek', mealTypes: ['dinner'], tags: ['weekend', 'gluten-free'],
    ingredients: ['8 lamb chops', '3 tbsp olive oil', '3 garlic cloves, crushed', '1 tbsp fresh rosemary, chopped', '1 tsp salt', '800 g baby potatoes, halved', '1 lemon', '1 tsp dried oregano', '2 handfuls rocket'],
    steps: [
      'Heat the oven to 220°C. Toss the potatoes with 2 tbsp oil, oregano, half the salt and the lemon zest. Roast for 35 minutes.',
      'Rub the lamb with the remaining oil, garlic, rosemary and salt.',
      'Grill or pan-fry the chops for 3 to 4 minutes per side for medium. Rest for 5 minutes.',
      'Squeeze the lemon over the potatoes and serve with the lamb and rocket.'
    ]
  },
  {
    id: 'seed-roast-chicken', title: 'Roast Chicken with Vegetables', emoji: 'drumstick',
    description: 'Golden roast chicken over carrots, onions and potatoes that soak up the juices.',
    servings: 5, prepMin: 15, cookMin: 80, cuisine: 'International', mealTypes: ['dinner'], tags: ['family', 'weekend', 'gluten-free'],
    ingredients: ['1 whole chicken', '2 tbsp olive oil', '20 g butter, softened', '1 lemon, halved', '4 garlic cloves', '1 tsp dried thyme', '1.5 tsp salt', '1 pinch black pepper', '600 g potatoes, quartered', '4 carrots, cut into chunks', '2 onions, quartered'],
    steps: [
      'Heat the oven to 200°C. Toss the vegetables with the oil and half the salt in a roasting tin.',
      'Rub the chicken with butter, thyme, remaining salt and pepper. Put the lemon and garlic inside.',
      'Set the chicken on the vegetables and roast for 75 to 80 minutes, until the juices run clear.',
      'Rest for 10 minutes before carving. Serve with the vegetables and pan juices.'
    ]
  },
  {
    id: 'seed-lentil-bolognese', title: 'Lentil Bolognese', emoji: 'pasta',
    description: 'A hearty meat-free bolognese with red lentils and mushrooms.',
    servings: 4, prepMin: 10, cookMin: 35, cuisine: 'Italian', mealTypes: ['dinner'], tags: ['vegan', 'budget', 'meal-prep'],
    ingredients: ['2 tbsp olive oil', '1 onion, diced', '1 carrot, diced', '1 celery stick, diced', '200 g mushrooms, chopped', '3 garlic cloves, minced', '2 tbsp tomato paste', '200 g red lentils', '700 ml passata', '400 ml vegetable stock', '1 tsp dried oregano', '1 tsp salt', '350 g spaghetti', '1 handful fresh basil'],
    steps: [
      'Cook the onion, carrot, celery and mushrooms in the oil for 8 minutes. Add the garlic and tomato paste for 1 minute.',
      'Add the lentils, passata, stock, oregano and salt. Simmer for 25 minutes, stirring often.',
      'Cook the spaghetti for 10 minutes.',
      'Serve the sauce over the pasta with torn basil.'
    ]
  },
  {
    id: 'seed-crispy-tofu', title: 'Crispy Tofu & Broccoli', emoji: 'broccoli',
    description: 'Golden tofu and broccoli in a sticky garlic-soy glaze.',
    servings: 3, prepMin: 15, cookMin: 20, cuisine: 'Chinese', mealTypes: ['dinner'], tags: ['vegan'],
    ingredients: ['400 g firm tofu, cubed', '2 tbsp cornstarch', '2 tbsp vegetable oil', '1 broccoli, cut into florets', '3 garlic cloves, minced', '3 tbsp soy sauce', '1 tbsp maple syrup', '1 tbsp vinegar', '60 ml water', '1 tsp sesame seeds', '250 g jasmine rice'],
    steps: [
      'Cook the rice. Press the tofu dry, then toss in the cornstarch.',
      'Fry the tofu in the oil for 8 minutes until crisp on all sides; remove.',
      'Stir-fry the broccoli for 4 minutes with a splash of water, then add the garlic for 30 seconds.',
      'Add the soy sauce, maple syrup, vinegar and water, bubble until glossy, then toss with the tofu. Serve over rice with sesame seeds.'
    ]
  },
  {
    id: 'seed-biryani', title: 'Chicken Biryani', emoji: 'curry',
    description: 'Layered spiced chicken and saffron basmati, cooked low and slow.',
    servings: 6, prepMin: 25, cookMin: 60, cuisine: 'Indian', mealTypes: ['dinner'], tags: ['family', 'weekend'],
    ingredients: ['800 g chicken thighs', '200 g plain yogurt', '2 tbsp biryani masala', '1 tsp turmeric', '1.5 tsp salt', '3 tbsp ghee', '3 onions, thinly sliced', '4 garlic cloves, minced', '1 thumb ginger, grated', '2 tomatoes, chopped', '450 g basmati rice, soaked', '1 pinch saffron', '60 ml warm milk', '1 handful fresh mint', '1 handful coriander'],
    steps: [
      'Marinate the chicken with the yogurt, biryani masala, turmeric and 1 tsp salt for at least 30 minutes.',
      'Fry the onions in the ghee for 15 minutes until golden; set aside half.',
      'Add the garlic, ginger and tomatoes to the pot, then the chicken. Cook for 15 minutes.',
      'Parboil the rice in salted water for 5 minutes and drain. Soak the saffron in the warm milk.',
      'Layer the rice over the chicken, add the herbs, reserved onions and saffron milk. Cover tightly and cook on very low for 25 minutes.'
    ]
  },

  /* ======================================================= Snacks & dips */
  {
    id: 'seed-baba-ghanoush', title: 'Baba Ghanoush', emoji: 'eggplant',
    description: 'Smoky charred aubergine dip with tahini and lemon.',
    servings: 6, prepMin: 10, cookMin: 35, cuisine: 'Lebanese', mealTypes: ['snack'], tags: ['vegan', 'dip'],
    ingredients: ['2 eggplants', '3 tbsp tahini', '2 tbsp lemon juice', '1 garlic clove, crushed', '½ tsp salt', '1 tbsp olive oil', '1 tbsp pomegranate seeds', '1 tbsp parsley, chopped', '3 pita'],
    steps: [
      'Char the aubergines over a gas flame or under a hot grill for 25 minutes, turning, until collapsed. Cool.',
      'Scoop out the flesh and drain in a sieve for 10 minutes.',
      'Mash with the tahini, lemon, garlic and salt.',
      'Drizzle with olive oil and top with pomegranate and parsley. Serve with pita.'
    ]
  },
  {
    id: 'seed-muhammara', title: 'Muhammara', emoji: 'chili',
    description: 'Roasted red pepper and walnut dip with pomegranate molasses.',
    servings: 6, prepMin: 10, cookMin: 25, cuisine: 'Middle Eastern', mealTypes: ['snack'], tags: ['vegan', 'dip'],
    ingredients: ['3 red peppers', '100 g walnuts, toasted', '30 g breadcrumbs', '1 tbsp pomegranate molasses', '1 tbsp lemon juice', '1 garlic clove', '1 tsp ground cumin', '1 tsp aleppo pepper', '½ tsp salt', '3 tbsp olive oil', '2 carrots, cut into sticks'],
    steps: [
      'Roast the peppers at 230°C for 25 minutes until blackened. Cover, cool, then peel and deseed.',
      'Blitz the walnuts and breadcrumbs until coarse.',
      'Add the peppers and everything else except the carrots and blitz to a thick paste.',
      'Serve with an extra drizzle of oil and carrot sticks.'
    ]
  },
  {
    id: 'seed-roasted-chickpeas', title: 'Crunchy Spiced Chickpeas', emoji: 'beans',
    description: 'Oven-roasted chickpeas — a crunchy, high-fibre snack.',
    servings: 4, prepMin: 5, cookMin: 30, cuisine: 'International', mealTypes: ['snack'], tags: ['vegan', 'meal-prep'],
    ingredients: ['2 cans chickpeas, drained', '1 tbsp olive oil', '1 tsp smoked paprika', '½ tsp ground cumin', '½ tsp garlic powder', '½ tsp salt'],
    steps: [
      'Heat the oven to 200°C. Pat the chickpeas very dry.',
      'Toss with the oil and roast for 20 minutes.',
      'Toss with the spices and salt and roast for 10 minutes more until crunchy. Cool completely before storing.'
    ]
  },
  {
    id: 'seed-tzatziki', title: 'Tzatziki & Veggie Sticks', emoji: 'cucumber',
    description: 'Cool garlicky yogurt dip with crunchy vegetables.',
    servings: 4, prepMin: 10, cookMin: 0, cuisine: 'Greek', mealTypes: ['snack'], tags: ['vegetarian', 'no-cook', 'quick'],
    ingredients: ['300 g greek yogurt', '1 cucumber', '1 garlic clove, grated', '1 tbsp olive oil', '1 tbsp lemon juice', '1 tbsp dill, chopped', '1 pinch salt', '2 carrots, cut into sticks', '1 red pepper, cut into strips', '2 celery sticks'],
    steps: [
      'Grate half the cucumber and squeeze out the liquid. Cut the rest into sticks.',
      'Mix the grated cucumber with the yogurt, garlic, oil, lemon, dill and salt.',
      'Serve with the cucumber, carrot, pepper and celery sticks.'
    ]
  },
  {
    id: 'seed-guacamole', title: 'Chunky Guacamole', emoji: 'avocado',
    description: 'Fresh avocado, lime, tomato and coriander.',
    servings: 4, prepMin: 10, cookMin: 0, cuisine: 'Mexican', mealTypes: ['snack'], tags: ['vegan', 'no-cook', 'quick'],
    ingredients: ['3 avocados', '1 lime', '1 tomato, diced', '½ red onion, finely diced', '1 green chili, finely chopped', '1 handful coriander, chopped', '½ tsp salt', '2 carrots, cut into sticks'],
    steps: [
      'Mash the avocados roughly with the lime juice and salt.',
      'Fold in the tomato, onion, chili and coriander.',
      'Serve right away with carrot sticks or tortilla chips.'
    ]
  },

  /* ============================================================ Desserts */
  {
    id: 'seed-mouhalabieh', title: 'Mouhalabieh', emoji: 'pudding',
    description: 'Silky Lebanese milk pudding scented with rose water, topped with pistachios.',
    servings: 6, prepMin: 5, cookMin: 15, cuisine: 'Lebanese', mealTypes: ['dessert'], tags: ['vegetarian', 'gluten-free'],
    ingredients: ['1 l milk', '60 g cornstarch', '80 g sugar', '1 tbsp rose water', '1 tbsp orange blossom water', '30 g pistachios, chopped'],
    steps: [
      'Whisk the cornstarch into 200 ml of the cold milk until smooth.',
      'Heat the remaining milk with the sugar until steaming, then whisk in the cornstarch mix.',
      'Stir constantly over medium heat for 8 minutes until thick enough to coat a spoon. Stir in the rose and blossom waters.',
      'Pour into cups and chill for 3 hours. Top with pistachios.'
    ]
  },
  {
    id: 'seed-choc-mousse', title: 'Chocolate Avocado Mousse', emoji: 'chocolate',
    description: 'Rich, dairy-free chocolate mousse made in the blender.',
    servings: 4, prepMin: 10, cookMin: 0, cuisine: 'International', mealTypes: ['dessert'], tags: ['vegan', 'no-cook'],
    ingredients: ['2 avocados', '40 g cocoa powder', '60 ml maple syrup', '80 ml almond milk', '1 tsp vanilla extract', '1 pinch salt', '100 g raspberries'],
    steps: [
      'Blend the avocados, cocoa, maple syrup, almond milk, vanilla and salt until completely smooth.',
      'Spoon into glasses and chill for 30 minutes.',
      'Top with raspberries.'
    ]
  },
  {
    id: 'seed-baked-apples', title: 'Cinnamon Baked Apples', emoji: 'apple',
    description: 'Soft baked apples stuffed with oats, dates and walnuts.',
    servings: 4, prepMin: 10, cookMin: 30, cuisine: 'International', mealTypes: ['dessert'], tags: ['vegetarian', 'budget'],
    ingredients: ['4 apples', '40 g rolled oats', '4 medjool dates, chopped', '30 g walnuts, chopped', '1 tsp cinnamon', '20 g butter, melted', '1 tbsp honey', '150 g greek yogurt'],
    steps: [
      'Heat the oven to 180°C. Core the apples, leaving the bottoms intact.',
      'Mix the oats, dates, walnuts, cinnamon, butter and honey and pack into the apples.',
      'Bake for 30 minutes until tender. Serve warm with yogurt.'
    ]
  },
  {
    id: 'seed-lemon-yogurt-cake', title: 'Lemon Yogurt Cake', emoji: 'lemon',
    description: 'A light, moist loaf cake with a lemon glaze.',
    servings: 10, prepMin: 15, cookMin: 45, cuisine: 'International', mealTypes: ['dessert', 'snack'], tags: ['baking', 'vegetarian'],
    ingredients: ['200 g greek yogurt', '3 eggs', '150 g sugar', '80 ml olive oil', '2 lemons', '200 g self-raising flour', '1 tsp baking powder', '1 pinch salt', '80 g icing sugar'],
    steps: [
      'Heat the oven to 175°C and line a loaf tin.',
      'Whisk the yogurt, eggs, sugar, oil and the zest of both lemons.',
      'Fold in the flour, baking powder and salt. Pour into the tin and bake for 45 minutes until a skewer comes out clean.',
      'Mix the icing sugar with 1 to 2 tbsp lemon juice and drizzle over the cooled cake.'
    ]
  }
];
