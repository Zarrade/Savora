# Savora — Recipes, Meal Planner & AI Kitchen

**Live app: https://zarrade.github.io/Savora/**

A recipe box, weekly meal planner, nutrition tracker and grocery list for Android, iPhone and desktop browsers,
with **personal accounts that sync across devices** and an **optional AI assistant powered by [OpenRouter](https://openrouter.ai)**.
It installs like a normal app and keeps working **offline**: your data lives on the device and syncs to your account whenever you're online.

Savora is the next version of the earlier "Mise" app.

## Accounts & sync

- **Sign in with email + password**, a one-tap email link, or reset a forgotten password. People can also **continue without an account** (data stays on that device only).
- **Your data follows you.** Recipes, plans, groceries, collections and preferences sync to your account through Supabase and update live on your other devices.
- **Offline first.** Edits made offline are queued and uploaded when you're back. If the same thing was edited on two devices, the most recent edit wins.
- **Private by design.** Every row is protected by Postgres Row Level Security, so each user can only ever read or change their own data. Your OpenRouter key and AI-estimated foods stay on the device and are kept per user.
- **Signing in on a phone that already has guest data** asks whether to add it to your account.
- **Me → Account**: rename yourself, see sync status, sign out (removes your data from that device only), or permanently delete your account and all its data.

### One-time Supabase dashboard setup (required for email links)

Project: `egwfaymxvrlphznceyfj`. In the Supabase dashboard:

1. **Authentication → URL Configuration**
   - **Site URL:** `https://zarrade.github.io/Savora/`
   - **Redirect URLs:** add `https://zarrade.github.io/Savora/**` and `http://localhost:5173/**`

   Without this, confirmation, magic-link and password-reset emails send people to `localhost`.
2. **Emails.** Supabase's built-in email sender is for testing only. It sends a handful of emails per hour and **only to members of your Supabase team**. To let anyone sign up, either:
   - set up **custom SMTP** (Authentication → Emails → SMTP settings — e.g. Resend, Postmark, SendGrid), or
   - turn off **Confirm email** (Authentication → Sign In / Providers → Email) so new accounts can sign in straight away.

The database schema (table `user_records`, RLS policies, `push_records` and `delete_my_account` functions) is in `supabase/migrations/`.

## AI features (all optional)

**Free for everyone with a Savora account — AI comes only from the app owner's OpenRouter key.** Requests go through a
Supabase Edge Function (`supabase/functions/ai`) that keeps the key on the server and always uses OpenRouter's free-models
router (`openrouter/free`), which picks a free model automatically (including one that can read photos). Each user gets
20 AI requests a day (set the `SAVORA_AI_DAILY_LIMIT` secret to change it). Guests are asked to sign in.

> **Free-tier limits:** OpenRouter's free models allow about 20 requests/minute and **50 requests/day for the whole account**
> (shared by all Savora users), or 1,000/day once the account has bought $10 of credits — still free models only.
> Free model providers may log prompts. The OpenRouter key lives only in Supabase's Edge Function secrets — it is never put in
> the app or GitHub (anything in the static site is public), so the copy in GitHub secrets isn't used.

- 📋 **Smart import** — paste messy text or a recipe link; the AI returns a clean recipe (ingredients, steps, times, tags). Falls back to the offline parser.
- 🧊 **What can I make?** — list what's in your kitchen; get 3 full recipe ideas that respect your allergies, diet and appliances, plus what you'd still need to buy.
- 👩‍🍳 **Cook assistant** — in cook mode, ask for substitutions, doneness cues or fixes. Streams answers and knows the recipe and your current step.
- 📸 **Photo to recipe** — photograph a cookbook page, handwritten card or a finished dish (vision model).
- 🔁 **Smarter swaps** — in the planner, ask for "something light and spicy". The AI only *ranks* recipes the normal planner already allows, so allergies, avoided foods, diet and kitchen equipment can never be bypassed.
- 🥦 **Nutrition for unknown foods** — estimate missing ingredients and keep them in your on-device database.

**Privacy & safety**
- With no key (or no internet) everything else works as normal — every AI feature is an optional extra.
- Text or photos are sent to OpenRouter and your chosen model **only when you press an AI button**.
- AI recipes always open in the editor for review before saving. Allergy/avoid lists are re-checked in code on AI suggestions. Nutrition values and quantities are estimates.

---


## Features

**New in this version**
- 🍳 **My kitchen** — pick your appliances (hob, oven, air fryer, kettle, microwave, blender…). Recipes and plans only use what you have; oven recipes switch to the air fryer with temperature/time tips.
- **Grocery cost & weekly budget** in **AED, USD or LBP** (switch in Me → Weekly budget) — estimated UAE prices for every recipe, meal plan and grocery item; set a weekly budget and Plan my week stays under it. Set your own prices on any item. Prices are stored in AED and converted (USD 3.6725 AED; LBP 89,500 per USD).
- 📸 **Real photos** — the 100 starter recipes get real food photos from Wikipedia / Wikimedia Commons (credited), cached for offline. "Find a real photo" for your own recipes.
- ↻ **Regenerate** — the whole week, one day, or a single meal, with suggestions to swap in.
- A cleaner, photo-first design with a floating tab bar.

**Recipes**
- **1,000+ starter recipes** across 60+ cuisines — Lebanese, Emirati & Gulf, Levantine, Egyptian, Iraqi, Persian, Turkish, Greek, Moroccan, Italian, Indian, Chinese, Japanese, Korean, Thai, Mexican, American, British, European and African — plus breakfasts, meal-prep, quick dinners, snacks, drinks and desserts. 100 ship in the app; the rest install in the background on first open (and work offline)
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
- **At home** list: what's already in your fridge and cupboards. Put ticked shopping away in one tap, mark things as run out, and Savora leaves them off shopping lists and uses them for “What can I make?”
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
git remote add origin https://github.com/Zarrade/Savora.git
git push -u origin main
```

Then on GitHub:

1. Open the repo → **Settings → Pages**
2. Under **Build and deployment → Source**, choose **GitHub Actions**
3. The included workflow (`.github/workflows/deploy.yml`) builds and deploys on every push to `main`.
   Watch it under the **Actions** tab (≈1 minute).
4. Your app will be live at `https://zarrade.github.io/Savora/`

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

**Signed in:** your data is saved to your account automatically — sign in on any device to get it back.
**Guest mode:** everything lives only in the app's storage on that device; clearing site data or uninstalling deletes it.
Either way, **Me → Back up** exports a file you can keep, and **Me → Restore from backup** brings it back (old Mise backups work too).

---

## Customising

| What | Where |
|---|---|
| Starter recipes | `src/data/seedRecipes*.ts` (bundled) and `src/data/more/*.txt` (background batches — check with `npx tsx scripts/check-recipes.ts`) |
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

React 18 + TypeScript + Vite, IndexedDB via Dexie (local working copy), Supabase Auth + Postgres + Realtime for accounts and sync
(`src/lib/account.ts`, `src/lib/sync.ts`, `src/lib/outbox.ts`), offline service worker via `vite-plugin-pwa`, hash routing
(works on any static host). AI calls go straight from the device to OpenRouter (`src/lib/ai/`). Fonts are bundled (Plus Jakarta Sans) so the UI works offline.

## Notes

- Nutrition values and prices are estimates — not medical or financial advice. Prices are typical UAE supermarket averages; set your own in the app.
- Recipe photos are loaded from Wikimedia Commons the first time the app is online (free licences; each photo links to its source page).
- Dictation uses Android's speech recognition, which may need an internet connection.
- Personal use. Not affiliated with Albo or The Feel Good Project.

- **Moving from Mise:** Savora uses a fresh on-device database. In the old app do **Me → Back up**, then in Savora **Me → Restore from backup**.
- AI "Connect" uses OpenRouter's OAuth (PKCE) and returns to this page; if it fails, paste a key instead.
