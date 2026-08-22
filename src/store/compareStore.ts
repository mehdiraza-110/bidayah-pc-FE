import { create } from 'zustand';
import { Product } from '@/data/products';

export const MAX_COMPARE_ITEMS = 4;

interface CompareStore {
  items: Product[];
  /** Returns 'added' | 'removed' | 'limit-reached' so callers can show the right feedback. */
  toggleItem: (product: Product) => 'added' | 'removed' | 'limit-reached';
  removeItem: (productId: string) => void;
  clearCompare: () => void;
  isCompared: (productId: string) => boolean;
}

export const useCompareStore = create<CompareStore>((set, get) => ({
  items: [],

  toggleItem: (product) => {
    const exists = get().items.some((item) => item.id === product.id);
    if (exists) {
      set((state) => ({ items: state.items.filter((item) => item.id !== product.id) }));
      return 'removed';
    }
    if (get().items.length >= MAX_COMPARE_ITEMS) {
      return 'limit-reached';
    }
    set((state) => ({ items: [...state.items, product] }));
    return 'added';
  },

  removeItem: (productId) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== productId),
    }));
  },

  clearCompare: () => set({ items: [] }),

  isCompared: (productId) => get().items.some((item) => item.id === productId),
}));
