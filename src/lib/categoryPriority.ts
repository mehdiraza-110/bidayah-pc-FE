import type { Category } from '@/services/api';

// Rough "how important is this to a PC build" ordering, shared by every
// place that lists categories to a customer (homepage tabs, product filter
// sidebar, ...) — core components first, then case/cooling, then
// peripherals, then accessories. Anything not listed here (a category
// renamed or added later) just keeps whatever order the API returned it in,
// appended after every matched one, so this never hides a new category.
export const CATEGORY_PRIORITY_ORDER = [
  'cpu',
  'gpu',
  'motherboard',
  'ram',
  'storage',
  'power supply',
  'gaming casing',
  'cpu cooler',
  'fan',
  'monitor',
  'keyboard',
  'mouse',
  'head phone',
  'microphone',
  'mouse pad',
  'gaming chair',
  'other',
];

export const getCategoryPriority = (categoryName: string): number => {
  const index = CATEGORY_PRIORITY_ORDER.indexOf(categoryName.trim().toLowerCase());
  return index === -1 ? CATEGORY_PRIORITY_ORDER.length : index;
};

export const sortByCategoryPriority = <T extends Pick<Category, 'category_name'>>(categories: T[]): T[] =>
  [...categories].sort((a, b) => getCategoryPriority(a.category_name) - getCategoryPriority(b.category_name));
