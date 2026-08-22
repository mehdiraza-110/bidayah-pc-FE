import { create } from 'zustand';
import { Product } from '@/data/products';

interface WishlistStore {
  items: Product[];
  toggleItem: (product: Product) => boolean;
  removeItem: (productId: string) => void;
  clearWishlist: () => void;
  isWishlisted: (productId: string) => boolean;
}

export const useWishlistStore = create<WishlistStore>((set, get) => ({
  items: [],

  // Returns true if the product ended up in the wishlist, false if it was removed.
  toggleItem: (product) => {
    const exists = get().items.some((item) => item.id === product.id);
    set((state) => ({
      items: exists
        ? state.items.filter((item) => item.id !== product.id)
        : [...state.items, product],
    }));
    return !exists;
  },

  removeItem: (productId) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== productId),
    }));
  },

  clearWishlist: () => set({ items: [] }),

  isWishlisted: (productId) => get().items.some((item) => item.id === productId),
}));
