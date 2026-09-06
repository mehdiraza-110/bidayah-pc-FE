import React, { useEffect, useMemo, useState } from 'react';
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

// How often the image swaps while a card is hovered — matches ProductCard.
const HOVER_CYCLE_MS = 2200;

const TierCard: React.FC<TierCardProps> = ({ tier, selectedColorName }) => {
  const navigate = useNavigate();
  const { addItem, openCart } = useCartStore();
  const [showAllSpecs, setShowAllSpecs] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  const pc = tier.builds.find((b) => b.color_name === selectedColorName) || tier.builds[0];

  // Switching color (or tier data changing) should always restart the cycle
  // on this build's own first photo, not wherever the previous build left off.
  useEffect(() => {
    setImageIndex(0);
  }, [pc?.id]);

  useEffect(() => {
    if (!isHovered || !pc || pc.images.length <= 1) {
      setImageIndex(0);
      return;
    }

    const timer = window.setInterval(() => {
      setImageIndex((prev) => (prev + 1) % pc.images.length);
    }, HOVER_CYCLE_MS);

    return () => window.clearInterval(timer);
  }, [isHovered, pc]);

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
      <Link
        to={detailUrl}
        className="block"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative aspect-square bg-white">
          {pc.images[imageIndex] && (
            <motion.img
              key={pc.images[imageIndex]}
              src={pc.images[imageIndex]}
              alt={pc.name}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
              className="h-full w-full object-cover"
            />
          )}

          {/* Progress dots — one per gallery image, the active one fills up
              over HOVER_CYCLE_MS in sync with the swap above (Instagram-
              story style), so hovering shows how long until the next image. */}
          {pc.images.length > 1 && (
            <div
              className={cn(
                'absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1 transition-opacity duration-300',
                isHovered ? 'opacity-100' : 'opacity-0'
              )}
            >
              {pc.images.map((_, dotIndex) => (
                <span key={dotIndex} className="relative h-1 w-5 overflow-hidden rounded-full bg-black/20">
                  <motion.span
                    className="absolute inset-y-0 left-0 rounded-full bg-primary"
                    initial={false}
                    animate={{
                      width: dotIndex < imageIndex || (dotIndex === imageIndex && isHovered) ? '100%' : '0%',
                    }}
                    transition={
                      dotIndex === imageIndex && isHovered
                        ? { duration: HOVER_CYCLE_MS / 1000, ease: 'linear' }
                        : { duration: 0.2 }
                    }
                  />
                </span>
              ))}
            </div>
          )}
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

// The grid is 4-wide at its largest breakpoint — one full row shown by default.
const TIER_PREVIEW_COUNT = 4;

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

  // A tier whose builds are all a single fixed color (e.g. the admin gave
  // "Max Black" and "Max White" separate tier names instead of sharing one
  // tier_name with two color siblings) never matches the *other* color, so
  // it must be hidden rather than silently falling back to its only build —
  // otherwise the color tabs above look like they do nothing. Tiers with no
  // color info at all (colorless builds) are unaffected by the toggle.
  const visibleTiers = useMemo(() => {
    if (!selectedColor) return tiers;
    return tiers.filter((tier) => {
      const hasAnyColor = tier.builds.some((b) => b.color_name);
      return !hasAnyColor || tier.builds.some((b) => b.color_name === selectedColor);
    });
  }, [tiers, selectedColor]);

  const [showAll, setShowAll] = useState(false);

  // Collapse back to the preview count whenever the color changes — the
  // visible set is different now, so an "expanded" state from the previous
  // color wouldn't mean anything here.
  useEffect(() => {
    setShowAll(false);
  }, [selectedColor]);

  const displayedTiers = showAll ? visibleTiers : visibleTiers.slice(0, TIER_PREVIEW_COUNT);

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
        {displayedTiers.map((tier) => (
          <TierCard key={tier.key} tier={tier} selectedColorName={selectedColor} />
        ))}
      </div>

      {!showAll && visibleTiers.length > TIER_PREVIEW_COUNT && (
        <div className="mt-8 flex justify-center">
          <CyberButton variant="outline" onClick={() => setShowAll(true)}>
            See more
          </CyberButton>
        </div>
      )}
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
