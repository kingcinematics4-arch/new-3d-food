export const DEFAULT_FOOD_CATEGORIES = [
  'Starters',
  'Soups',
  'Salads',
  'Main Course',
  'Indian Breads',
  'Rice & Biryani',
  'Chinese',
  'South Indian',
  'Continental',
  'Pizza & Pasta',
  'Fast Food',
  'Desserts',
  'Beverages',
  'Snacks',
  'Combos & Thalis',
] as const;

export function normalizeCategoryName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

export function categoryKey(name: string): string {
  return normalizeCategoryName(name).toLocaleLowerCase();
}
