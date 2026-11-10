# Savora — AI Recipes & Meal Planner

A personal, **offline-first** recipe box and weekly meal planner for Android (and any phone), now with an
**optional AI assistant powered by [OpenRouter](https://openrouter.ai)**. It installs from Chrome like a normal app,
works with no internet, and keeps every recipe, plan and grocery list **only on your phone**. No accounts, no subscription, no tracking.

Savora is the next version of the earlier "Mise" app (same engine, new name, big AI upgrade).

## AI features (all optional)

Connect once in **Me → AI assistant** (sign in with OpenRouter, or paste an API key). Pick any model from OpenRouter's catalogue.

- 📋 **Smart import** — paste messy text or a recipe link; the AI returns a clean recipe (ingredients, steps, times, tags). Falls back to the offline parser.
- 🧊 **What can I make?** — list what's in your kitchen; get 3 full recipe ideas that respect your allergies, diet and appliances, plus what you'd still need to buy.
- 👩‍🍳 **Cook assistant** — in cook mode, ask for substitutions, doneness cues or fixes. Streams answers and knows the recipe and your current step.
- 📸 **Photo to recipe** — photograph a cookbook page, handwritten card or a finished dish (vision model).
- 🔁 **Smarter swaps** — in the planner, ask for "something light and spicy". The AI only *ranks* recipes the normal planner already allows, so allergies, avoided foods, diet and kitchen equipment can never be bypassed.
- 🥦 **Nutrition for unknown foods** — estimate missing ingredients and keep them in your on-device database.

**Privacy & safety**
- With no key (or no internet) the app behaves exactly as before — every AI feature is an optional extra.
- Your key is stored on this device only (localStorage) and is **never included in backups**. Set a spend limit on the key at openrouter.ai.
- Text or photos are sent to OpenRouter and your chosen model **only when you press an AI button**.
- AI recipes always open in the editor for review before saving. Allergy/avoid lists are re-checked in code on AI suggestions. Nutrition values and quantities are estimates.

---


## Features

**New in this version**
- 🍳 **My kitchen** — pick your appliances (hob, oven, air fryer, kettle, microwave, blender…). Recipes and plans only use what you have; oven recipes switch to the air fryer with temperature/time tips.
- 💰 **Grocery cost & weekly budget** — estimated UAE prices for every recipe, meal plan and grocery item; set a weekly budget and Plan my week stays under it. Set your own prices on any item.
- 📸 **Real photos** — the 100 starter recipes get real food photos from Wikipedia / Wikimedia Commons (credited), cached for offline. "Find a real photo" for your own recipes.
- ↻ **Regenerate** — the whole week, one day, or a single meal, with suggestions to swap in.
- A cleaner, photo-first design with a floating tab bar.

**Recipes**
- 100 starter recipes (Lebanese, Mediterranean, Asian, Mexican, Indian, breakfasts, snacks)
- Write your own, or **dictate** them with the mic button
- **Paste a recipe** from any website, caption or note — it's split into ingredients & steps offline
- Edit any recipe; starter recipes can be **remixed** and restored to the original anytime
- Photos (camera or gallery), emoji covers, video & source links
- Favourites, collections, tags, ratings & reviews, "cooked ×" history
- Search by title / cuisine / ingredient, **ingredient filters** (must include / without), diet, time, sort
- Servings scaling with friendly fractions (½, ⅓, ¾ …)
- Allergy & avoided‑food warnings on every recipe

**Cook mode**
- Full‑screen step‑by‑step view with big text, swipe between steps
- "Gather ingredients" checklist first
- **Auto‑detected timers** ("simmer for 10 minutes" → tap to start), with sound + vibration
- Shows the ingredients used in each step
- Keeps the screen awake; YouTube videos play in a floating mini‑player
- "Done?" card: rate it, add notes, logs it as cooked

**Nutrition (offline)**
- Calories, protein, carbs, fat, fibre, sugar, saturates, salt per serving
- Macro split bar and swipeable **% of your daily target** rings
- UK‑style **traffic lights** (low / medium / high) with % reference intake
- Micronutrients: calcium, iron, magnesium, potassium, vitamins A & C
- Personal daily targets calculated from your profile (or set manually)
- Built‑in database of ~150 common ingredients with unit/density conversions

**Meal planner**
- Weekly view: breakfast, lunch, dinner, snack; daily calories & protein vs target
- **Plan my week** generator that respects:
  allergies, foods you avoid, diet, **cooking days**, weeknight time limit,
  calorie target, favourites, variety, and **locked meals**
- **Cook once, eat twice** — next‑day lunches from last night's dinner (portions scaled up automatically)
- Lock, swap, move to another day, change servings, mark as leftovers
- Copy last week, clear week, week average nutrition

**Groceries**
- **Send the week's plan** to the list — ingredients combined, scaled and rounded sensibly
- Add a single recipe's ingredients with **editable quantities**
- Add items by typing (`1 kg tomatoes`) with suggestions
- Grouped by aisle, tick off, edit, share/copy the list
- Pantry staples (salt, pepper…) are left off automatically — editable in settings

**Other**
- Light / dark / system theme
- Backup & restore (JSON file — save it to Google Drive via the share sheet). Old Mise backups restore into Savora.
- Works 100% offline after the first load

---

## 1. Run it on your computer (optional)

Requires [Node.js](https://nodejs.org) 18 or newer.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build into dist/
```

## 2. Put it on GitHub (free hosting with GitHub Pages)

```bash
git init            # skip if the folder is already a git repo
git add .
git commit -m "Savora"
git branch -M main
git remote add origin https://github.com/<your-username>/savora.git
git push -u origin main
```

Then on GitHub:

1. Open the repo → **Settings → Pages**
2. Under **Build and deployment → Source**, choose **GitHub Actions**
3. The included workflow (`.github/workflows/deploy.yml`) builds and deploys on every push to `main`.
   Watch it under the **Actions** tab (≈1 minute).
4. Your app will be live at `https://<your-username>.github.io/savora/`

> **Public or private repo?** GitHub Pages is free for **public** repos. Your recipes are *not* in the
> repo (they live on your phone), so a public repo exposes only the app code. If you want a private repo,
> GitHub Pages needs a paid plan — or connect the private repo to **Cloudflare Pages** or **Netlify** for free
> (build command `npm run build`, output folder `dist`).

## 3. Install on your Android phone

1. Open your Pages URL in **Chrome** on the phone
2. Tap **⋮ → Install app** (or **Add to Home screen**)
3. Savora appears in your app drawer with its own icon and opens full‑screen
4. After the first open it works **offline** — no internet needed

**Updates:** push changes to GitHub; the app updates itself the next time you open it online.

## 4. Keep your data safe

Everything is stored in the browser storage of the installed app on your phone. Clearing Chrome's
site data or uninstalling the app deletes it. Use **Me → Back up** regularly and keep the file in
Google Drive. **Me → Restore from backup** brings it back (on the same or a new phone).

---

## Customising

| What | Where |
|---|---|
| Starter recipes | `src/data/seedRecipes.ts` |
| Nutrition database (per 100 g) | `src/data/nutritionDb.ts` |
| Ingredient prices (AED/kg) | `src/data/prices.ts` |
| Photo sources per recipe | `src/lib/photos.ts` |
| Kitchen equipment rules | `src/lib/kitchen.ts` |
| Meal‑plan generator rules | `src/lib/planner.ts` |
| AI client, prompts & validators | `src/lib/ai/` (`client.ts`, `features.ts`, `json.ts`, `oauth.ts`) |
| Ingredient parsing / units | `src/lib/ingredients.ts` |
| Grocery combining & rounding | `src/lib/grocery.ts` |
| Colours & layout | `src/styles.css` (tokens at the top) |

To add an ingredient to the nutrition database, add a line to `FOODS` with its names, aisle and the
14 per‑100 g values (see the comment at the top of the file).

## Tech

React 18 + TypeScript + Vite, IndexedDB via Dexie, offline service worker via `vite-plugin-pwa`,
hash routing (works on any static host). No backend. AI calls go straight from the phone to OpenRouter (`src/lib/ai/`).

## Notes

- Nutrition values and prices are estimates — not medical or financial advice. Prices are typical UAE supermarket averages; set your own in the app.
- Recipe photos are loaded from Wikimedia Commons the first time the app is online (free licences; each photo links to its source page).
- Dictation uses Android's speech recognition, which may need an internet connection.
- Personal use. Not affiliated with Albo or The Feel Good Project.

- **Moving from Mise:** Savora uses a fresh on-device database. In the old app do **Me → Back up**, then in Savora **Me → Restore from backup**.
- AI "Connect" uses OpenRouter's OAuth (PKCE) and returns to this page; if it fails, paste a key instead.
