import type { Recipe } from '../types';

/** World regions used to organise ~100 cuisines into a few browsable groups. */
export const REGIONS: { id: string; label: string; cuisines: string[] }[] = [
  { id: 'arab', label: 'Middle East', cuisines: ['Arabic', 'Bahraini', 'Emirati', 'Iraqi', 'Jordanian', 'Kuwaiti', 'Lebanese', 'Levantine', 'Middle Eastern', 'Omani', 'Palestinian', 'Persian', 'Qatari', 'Saudi', 'Syrian', 'Turkish', 'Yemeni', 'Afghan', 'Armenian', 'Georgian', 'Cypriot'] },
  { id: 'africa', label: 'Africa', cuisines: ['African', 'Algerian', 'Egyptian', 'Ethiopian', 'Ghanaian', 'Kenyan', 'Libyan', 'Moroccan', 'Nigerian', 'North African', 'Somali', 'South African', 'Sudanese', 'Tunisian', 'West African'] },
  { id: 'europe', label: 'Europe', cuisines: ['Austrian', 'Belgian', 'British', 'Bulgarian', 'Croatian', 'Czech', 'Danish', 'Dutch', 'Finnish', 'French', 'German', 'Greek', 'Hungarian', 'Irish', 'Italian', 'Lithuanian', 'Maltese', 'Mediterranean', 'Polish', 'Portuguese', 'Romanian', 'Russian', 'Scandinavian', 'Scottish', 'Spanish', 'Swedish', 'Swiss', 'Ukrainian'] },
  { id: 'asia', label: 'Asia', cuisines: ['Asian', 'Asian Fusion', 'Bangladeshi', 'Chinese', 'Filipino', 'Indian', 'Indonesian', 'Japanese', 'Korean', 'Malaysian', 'Pakistani', 'Singaporean', 'Sri Lankan', 'Thai', 'Uzbek', 'Vietnamese'] },
  { id: 'americas', label: 'Americas', cuisines: ['American', 'Argentinian', 'Brazilian', 'Canadian', 'Caribbean', 'Chilean', 'Colombian', 'Cuban', 'Hawaiian', 'Italian-American', 'Jamaican', 'Latin American', 'Mexican', 'Peruvian', 'Tex-Mex', 'Venezuelan'] },
  { id: 'world', label: 'World & fusion', cuisines: ['International', 'Fusion', 'Australian'] },
];

const REGION_OF = new Map(REGIONS.flatMap(r => r.cuisines.map(c => [c.toLowerCase(), r.id] as const)));
export const regionOf = (cuisine: string) => REGION_OF.get(cuisine.trim().toLowerCase()) ?? 'world';

export interface CuisineCount { name: string; count: number }
export interface RegionGroup { id: string; label: string; count: number; cuisines: CuisineCount[] }

/** Group the cuisines that actually appear in `recipes` by region, biggest cuisines first. */
export function groupCuisines(recipes: Recipe[]): RegionGroup[] {
  const counts = new Map<string, number>();
  recipes.forEach(r => r.cuisine && counts.set(r.cuisine, (counts.get(r.cuisine) ?? 0) + 1));
  const groups = new Map<string, CuisineCount[]>();
  counts.forEach((count, name) => {
    const id = regionOf(name);
    groups.set(id, [...(groups.get(id) ?? []), { name, count }]);
  });
  return REGIONS.filter(r => groups.has(r.id)).map(r => {
    const cuisines = groups.get(r.id)!.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    return { id: r.id, label: r.label, count: cuisines.reduce((s, c) => s + c.count, 0), cuisines };
  });
}
