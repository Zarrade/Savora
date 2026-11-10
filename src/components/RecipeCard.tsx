import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Recipe } from '../types';
import { Icon } from './Icon';
import { recipeNutrition } from '../lib/ingredients';
import { recipeCost, fmtMoney } from '../lib/pricing';
import { missingEquipment } from '../lib/kitchen';
import { updateRecipe, useSettings } from '../hooks';
import { SIcon } from './SavoraIcons';
import { recipeIcon } from '../lib/foodIcons';

const HUES = [150, 30, 200, 345, 45, 270, 10, 180, 95, 320];
function hueFor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return HUES[h % HUES.length];
}

/** Recipe photo, falling back to a colourful Savora-icon tile when there's no photo (or it can't load offline). */
export function Cover({ recipe, className = '', large }: { recipe: Pick<Recipe, 'id' | 'image' | 'emoji' | 'title'>; className?: string; large?: boolean }) {
  const [failed, setFailed] = useState<string | null>(null);
  if (recipe.image && failed !== recipe.image) {
    return <img className={`cover ${className}`} src={recipe.image} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setFailed(recipe.image!)} />;
  }
  return (
    <div className={`cover cover-emoji ${className}`} style={{ ['--hue' as string]: hueFor(recipe.id) }} aria-hidden="true">
      <SIcon name={recipeIcon(recipe)} size={large ? 96 : 44} className="cover-icon" />
    </div>
  );
}

export function totalTime(r: Recipe) { return (r.prepMin || 0) + (r.cookMin || 0); }

export function avgRating(r: Recipe) {
  return r.reviews.length ? r.reviews.reduce((s, x) => s + x.rating, 0) / r.reviews.length : 0;
}

export function RecipeCard({ recipe, compact }: { recipe: Recipe; compact?: boolean }) {
  const settings = useSettings();
  const n = recipeNutrition(recipe).perServing;
  const cost = recipeCost(recipe, settings.priceOverrides).perServing;
  const t = totalTime(recipe);
  const rating = avgRating(recipe);
  const missing = missingEquipment(recipe, settings.equipment).length > 0;
  return (
    <div className={`recipe-card ${compact ? 'recipe-card-compact' : ''}`}>
      <Link to={`/recipe/${recipe.id}`} className="recipe-card-link">
        <div style={{ position: 'relative' }}>
          <Cover recipe={recipe} />
          {t > 0 && <span className="card-pill"><Icon name="clock" size={12} /> {t} min</span>}
          {missing && <span className="card-pill card-warn" title="Needs equipment you don't have"><SIcon name="hob" size={12} /> Not in your kitchen</span>}
        </div>
        <div className="recipe-card-body">
          <div className="recipe-card-title">{recipe.title}</div>
          <div className="recipe-card-meta">
            {n.kcal > 0 && <span>{Math.round(n.kcal)} kcal</span>}
            {cost > 0 && <span>· {fmtMoney(cost, settings.currency)}</span>}
            {rating > 0 && <span>· <SIcon name="star" size={12} /> {rating.toFixed(1)}</span>}
          </div>
        </div>
      </Link>
      <button
        className={`fav-btn ${recipe.favorite ? 'fav-on' : ''}`}
        aria-label={recipe.favorite ? 'Remove from favourites' : 'Add to favourites'}
        onClick={() => updateRecipe(recipe.id, { favorite: !recipe.favorite })}
      >
        <Icon name="heart" size={17} filled={recipe.favorite} />
      </button>
    </div>
  );
}

export function RecipeRow({ recipe, onClick, right }: { recipe: Recipe; onClick?: () => void; right?: React.ReactNode }) {
  const settings = useSettings();
  const n = recipeNutrition(recipe).perServing;
  const cost = recipeCost(recipe, settings.priceOverrides).perServing;
  const t = totalTime(recipe);
  return (
    <button type="button" className="recipe-row" onClick={onClick}>
      <Cover recipe={recipe} className="cover-sm" />
      <div className="recipe-row-body">
        <div className="recipe-row-title">{recipe.title}</div>
        <div className="recipe-card-meta">
          <span>{recipe.cuisine}</span>
          {t > 0 && <span>· {t} min</span>}
          {n.kcal > 0 && <span>· {Math.round(n.kcal)} kcal</span>}
          {cost > 0 && <span>· {fmtMoney(cost, settings.currency)}</span>}
        </div>
      </div>
      {right}
    </button>
  );
}
