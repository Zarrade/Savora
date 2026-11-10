import { SEED_RECIPES } from './seedRecipes';
import { SEED_RECIPES_2 } from './seedRecipes2';

/** All built-in starter recipes. Bump SEED_VERSION when adding a new batch. */
export const ALL_SEEDS = [...SEED_RECIPES, ...SEED_RECIPES_2];
export const SEED_VERSION = 2;

/** Recipes introduced in each seed version (installed automatically on upgrade). */
export const SEEDS_BY_VERSION: Record<number, typeof ALL_SEEDS> = {
  1: SEED_RECIPES,
  2: SEED_RECIPES_2
};
