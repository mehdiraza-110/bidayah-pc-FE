import type { NavigateFunction } from 'react-router-dom';
import type { FeaturedGamingPc } from '@/services/api';

// Handed to /pc-builder through router state so a Featured Gaming PC (plus any
// extra products the shopper added on its detail page) arrives pre-selected.
// Only product ids travel — the builder re-fetches full products itself.
export interface PcBuilderPreselect {
  buildName: string;
  // The build's own price minus its listed parts' total — what the shopper
  // pays on top of the parts so the builder total matches the advertised price.
  buildSurcharge: number;
  items: { product_id: string; quantity: number }[];
}

export const openGamingPcInBuilder = (
  navigate: NavigateFunction,
  pc: Pick<FeaturedGamingPc, 'name' | 'price' | 'products'>,
  extras: { product_id: string; quantity: number }[] = []
) => {
  const merged = new Map<string, number>();
  [...pc.products.map((p) => ({ product_id: p.id, quantity: p.quantity })), ...extras].forEach(
    ({ product_id, quantity }) => merged.set(product_id, (merged.get(product_id) || 0) + quantity)
  );

  const partsTotal = pc.products.reduce((sum, p) => sum + Number(p.price || 0) * p.quantity, 0);

  const preselect: PcBuilderPreselect = {
    buildName: pc.name,
    buildSurcharge: Math.round((Number(pc.price) - partsTotal) * 100) / 100,
    items: [...merged.entries()].map(([product_id, quantity]) => ({ product_id, quantity })),
  };
  navigate('/pc-builder', { state: { preselect } });
};
