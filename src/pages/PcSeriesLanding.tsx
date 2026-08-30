import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronDown, ShoppingCart, Cpu, Monitor, Settings, HardDrive, Zap, CircuitBoard } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import { CyberButton } from '@/components/ui/CyberButton';
import { NeonCard } from '@/components/ui/NeonCard';
import { ScoreRing } from '@/components/pc-series/ScoreRing';
import { cn } from '@/lib/utils';
import { gamingPcUrl } from '@/lib/slug';
import { useCartStore } from '@/store/cartStore';
import type { Product } from '@/data/products';
import type { PcSeries, PcSeriesType, FeaturedGamingPc } from '@/services/api';

// Same lookup as CategoryShowcaseSection.tsx — kept local rather than shared,
// same convention already used across the codebase for this small mapping.
const getCategoryIcon = (categoryName: string) => {
  const name = categoryName.toLowerCase();
  if (name.includes('cpu') || name.includes('processor')) return Cpu;
  if (name.includes('gpu') || name.includes('graphic')) return Monitor;
  if (name.includes('ram') || name.includes('memory')) return Zap;
  if (name.includes('motherboard') || name.includes('mobo')) return CircuitBoard;
  if (name.includes('storage') || name.includes('ssd')) return HardDrive;
  return Settings;
};

// One "tier" card — a group of Featured Gaming PCs sharing the same
// tier_name (e.g. "PLUS"), one per color. Ungrouped builds (no tier_name)
// are their own single-PC tier, keyed by id.
interface TierGroup {
  key: string;
  tierName: string | null;
  builds: FeaturedGamingPc[];
}

interface TierCardProps {
  tier: TierGroup;
  selectedColorName: string | null;
}

const TierCard: React.FC<TierCardProps> = ({ tier, selectedColorName }) => {
  const navigate = useNavigate();
  const { addItem, openCart } = useCartStore();
  const [showAllSpecs, setShowAllSpecs] = useState(false);

  const pc = tier.builds.find((b) => b.color_name === selectedColorName) || tier.builds[0];
  if (!pc) return null;

  const visibleSpecs = showAllSpecs ? pc.products : pc.products.slice(0, 5);
  const detailUrl = gamingPcUrl(pc);
  const cardTitle = tier.tierName || pc.name;

  const buildBundle = (): Product => ({
    id: `gaming-pc-${pc.id}`,
    name: pc.name,
    category: 'Gaming PC',
    price: Number(pc.price),
    image: pc.images[0] || '',
    media: pc.images.slice(1).map((url) => ({ url, type: 'image' as const })),
    description: pc.description || undefined,
    specs: pc.products.map((p) => {
      const label = p.category_name ? `${p.category_name}: ${p.name}` : p.name;
      return p.quantity > 1 ? `${label} ×${p.quantity}` : label;
    }),
    rating: 5.0,
    reviews: 0,
    stock: 1,
    in_stock: true,
    featured: false,
  });

  const handleConfigureAndBuy = () => {
    addItem(buildBundle());
    openCart();
  };

  return (
    <NeonCard className="flex h-full flex-col p-0 overflow-hidden" glowColor="cyan" hover={false}>
      <Link to={detailUrl} className="block">
        <div className="aspect-square bg-white">
          {pc.images[0] && <img src={pc.images[0]} alt={pc.name} className="h-full w-full object-cover" />}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        {tier.builds.length > 1 && (
          <div className="mb-2 flex items-center justify-center gap-1.5">
            {tier.builds.map((b) => (
              <span
                key={b.id}
                className={cn('h-3.5 w-3.5 rounded-full border', b.id === pc.id ? 'border-primary' : 'border-border')}
                style={{ backgroundColor: b.color_swatch_hex || '#666' }}
                title={b.color_name || undefined}
              />
            ))}
          </div>
        )}

        <Link to={detailUrl} className="text-center font-orbitron text-lg font-bold text-foreground hover:text-primary transition-colors mb-1">
          {cardTitle}
        </Link>

        {pc.fps_score != null && (
          <div className="flex justify-center mb-3">
            <ScoreRing score={pc.fps_score} settingsLabel={pc.fps_settings_label} />
          </div>
        )}

        <p className="text-center font-orbitron text-xl font-bold text-primary mb-4">
          AED {Number(pc.price).toLocaleString()}
        </p>

        <div className="mt-auto space-y-2">
          <CyberButton size="sm" className="w-full" onClick={handleConfigureAndBuy}>
            <ShoppingCart className="w-4 h-4 mr-2" />
            Configure and buy
          </CyberButton>
          <CyberButton size="sm" variant="outline" className="w-full" onClick={() => navigate(detailUrl)}>
            Details
          </CyberButton>
        </div>

        {pc.products.length > 0 && (
          <div className="mt-5 space-y-2 border-t border-border pt-4">
            {visibleSpecs.map((product) => {
              const Icon = getCategoryIcon(product.category_name || '');
              return (
                <div key={product.id} className="flex items-center gap-2 text-xs">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground shrink-0">{product.category_name || 'Spec'}</span>
                  <span className="flex-1 min-w-0 truncate text-right text-foreground/80">{product.name}</span>
                </div>
              );
            })}
            {pc.products.length > 5 && (
              <button
                type="button"
                onClick={() => setShowAllSpecs((v) => !v)}
                className="flex w-full items-center justify-center gap-1.5 pt-1 text-xs text-primary hover:text-primary/80 transition-colors"
              >
                <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', showAllSpecs && 'rotate-180')} />
                {showAllSpecs ? 'Show less' : 'Show full specification'}
              </button>
            )}
          </div>
        )}
      </div>
    </NeonCard>
  );
};

interface TypeSectionProps {
  type: PcSeriesType;
}

const TypeSection: React.FC<TypeSectionProps> = ({ type }) => {
  // `type.gaming_pcs || []` would create a new array reference every render,
  // defeating the memos below — memoize on `type.gaming_pcs` itself instead.
  const gamingPcs = useMemo(() => type.gaming_pcs || [], [type.gaming_pcs]);

  // Group builds sharing a tier_name into one card (color siblings); a build
  // with no tier_name is its own single-build tier.
  const tiers = useMemo<TierGroup[]>(() => {
    const byKey = new Map<string, TierGroup>();
    for (const pc of gamingPcs) {
      const key = pc.tier_name || `pc-${pc.id}`;
      if (!byKey.has(key)) byKey.set(key, { key, tierName: pc.tier_name, builds: [] });
      byKey.get(key)!.builds.push(pc);
    }
    return Array.from(byKey.values());
  }, [gamingPcs]);

  // Union of every color name used across this type's tiers — the toggle
  // switches all cards in the grid to the same color at once.
  const colorNames = useMemo(() => {
    const seen = new Set<string>();
    const ordered: string[] = [];
    for (const pc of gamingPcs) {
      if (pc.color_name && !seen.has(pc.color_name)) {
        seen.add(pc.color_name);
        ordered.push(pc.color_name);
      }
    }
    return ordered;
  }, [gamingPcs]);

  const [selectedColor, setSelectedColor] = useState<string | null>(colorNames[0] || null);

  if (tiers.length === 0) return null;

  return (
    <section className="mb-20">
      <div className="mb-6 text-center">
        <h2 className="font-orbitron text-2xl md:text-3xl font-bold">
          {type.name}
          {type.subtitle && <span className="font-rajdhani text-lg md:text-xl font-normal text-muted-foreground">. {type.subtitle}</span>}
        </h2>
      </div>

      {colorNames.length > 1 && (
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/30 p-1">
            {colorNames.map((colorName) => (
              <button
                key={colorName}
                type="button"
                onClick={() => setSelectedColor(colorName)}
                className={cn(
                  'rounded-full px-4 py-1.5 text-sm font-rajdhani font-semibold transition-colors',
                  selectedColor === colorName ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {colorName}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {tiers.map((tier) => (
          <TierCard key={tier.key} tier={tier} selectedColorName={selectedColor} />
        ))}
      </div>
    </section>
  );
};

const PcSeriesLanding: React.FC<{ series: PcSeries }> = ({ series }) => {
  const types = series.types || [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen bg-background">
      <Navbar />
      <CartDrawer />

      <main className="pt-12 pb-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1">
              <ChevronLeft className="w-4 h-4" />
              Home
            </Link>
            <span>/</span>
            <span className="text-foreground">{series.name}</span>
          </div>

          <h1 className="font-orbitron text-3xl md:text-4xl font-bold mb-8">
            Gaming computers <span className="text-primary">{series.name}</span>
          </h1>

          {series.hero_video && (
            <div className="mb-16 overflow-hidden rounded-2xl border border-border">
              <video src={series.hero_video} autoPlay muted loop playsInline controls className="w-full" />
            </div>
          )}

          {types.map((type) => (
            <TypeSection key={type.id} type={type} />
          ))}

          {types.length === 0 && (
            <div className="py-24 text-center text-muted-foreground">
              This series doesn't have any published builds yet — check back soon.
            </div>
          )}
        </div>
      </main>

      <Footer />
    </motion.div>
  );
};

export default PcSeriesLanding;
