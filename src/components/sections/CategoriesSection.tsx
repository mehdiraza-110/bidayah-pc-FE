import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { getPublicCategories, getPublicProducts, type Category } from '@/services/api';
import { Product } from '@/data/products';
import { ProductCard } from '@/components/products/ProductCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { Loader } from '@/components/ui/Loader';
import { mapApiProductToLocal } from '@/lib/mapProduct';
import { sortByCategoryPriority } from '@/lib/categoryPriority';

// Same idea as ProductCarousel's auto-scrolling rows: a slow, constant glide
// rather than a periodic jump. Kept slower than the product rows since these
// pills are read as text, not skimmed as images.
const AUTOPLAY_SPEED_PX_PER_SEC = 28;

const CategoriesSection: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const wrapMarkerRef = useRef<HTMLButtonElement>(null);
  const isPausedRef = useRef(false);

  useEffect(() => {
    const loadCategories = async () => {
      setIsLoadingCategories(true);
      try {
        const response = await getPublicCategories();
        if (response.success && response.data && response.data.length > 0) {
          const sorted = sortByCategoryPriority(response.data);
          setCategories(sorted);
          setActiveCategoryId(sorted[0].id);
        }
      } catch (error) {
        console.error('Error loading categories:', error);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    if (!activeCategoryId) return;

    const loadProducts = async () => {
      setIsLoadingProducts(true);
      try {
        const response = await getPublicProducts({ category_id: activeCategoryId });
        if (response.success && response.data) {
          const sorted = [...response.data].sort((a, b) => {
            const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return dateB - dateA;
          });
          setProducts(sorted.slice(0, 4).map(mapApiProductToLocal));
        } else {
          setProducts([]);
        }
      } catch (error) {
        console.error('Error loading category products:', error);
        setProducts([]);
      } finally {
        setIsLoadingProducts(false);
      }
    };

    loadProducts();
  }, [activeCategoryId]);

  // Only worth looping when there's more than a screenful of pills — a short
  // list just sits still (nothing to scroll, nothing to wrap).
  const shouldLoop = categories.length > 6;

  // Position (in scrollLeft terms) where the duplicated ("second lap") copy of
  // the pills begins — see ProductCarousel's identical wrap technique. Once
  // auto-scroll reaches this point it's already scrolling into a pixel-identical
  // copy, so stepping scrollLeft back by this width is an invisible jump.
  const getWrapWidth = () => {
    const marker = wrapMarkerRef.current;
    const container = scrollerRef.current;
    if (!marker || !container) return null;
    return marker.getBoundingClientRect().left - container.getBoundingClientRect().left + container.scrollLeft;
  };

  useEffect(() => {
    if (!shouldLoop) return undefined;

    let frameId: number;
    let lastTimestamp: number | null = null;

    const tick = (timestamp: number) => {
      const el = scrollerRef.current;
      const delta = lastTimestamp === null ? 0 : timestamp - lastTimestamp;
      lastTimestamp = timestamp;

      if (el && !isPausedRef.current) {
        const wrapWidth = getWrapWidth();
        const canWrap = wrapWidth !== null && wrapWidth > 0;

        if (canWrap && el.scrollLeft >= wrapWidth - 1) {
          el.scrollLeft -= wrapWidth;
        } else if (!canWrap && el.scrollWidth - el.scrollLeft - el.clientWidth < 1) {
          // Safety net if the marker can't be measured yet — never freeze at the end.
          el.scrollLeft = 0;
        } else {
          el.scrollLeft += (AUTOPLAY_SPEED_PX_PER_SEC * delta) / 1000;
        }
      }

      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [shouldLoop]);

  const scrollByAmount = (amount: number) => {
    scrollerRef.current?.scrollBy({ left: amount, behavior: 'smooth' });
  };

  if (isLoadingCategories) {
    return (
      <section className="py-24 bg-card/50">
        <div className="container mx-auto px-4 text-center">
          <Loader label="Loading categories..." />
        </div>
      </section>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  const activeCategoryName = categories.find((c) => c.id === activeCategoryId)?.category_name || '';

  return (
    <section className="py-24 bg-card/50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="font-orbitron text-4xl md:text-5xl font-bold text-foreground mb-4">
            Shop By <span className="text-primary">Category</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Browse the latest arrivals in each category
          </p>
        </motion.div>

        {/* Category tabs — always a single scrollable row (never wraps to multiple
            lines, however many categories admins add), auto-gliding seamlessly
            when there are enough to loop; paused on hover, click still works
            mid-glide, and dragging/scrolling manually is unaffected. */}
        <div
          className="relative"
          onMouseEnter={() => { isPausedRef.current = true; }}
          onMouseLeave={() => { isPausedRef.current = false; }}
        >
          {shouldLoop && (
            <>
              <button
                type="button"
                aria-label="Scroll categories left"
                onClick={() => scrollByAmount(-240)}
                className="absolute -left-4 top-1/2 z-20 hidden -translate-y-1/2 rounded-full border border-border bg-card/90 p-2 text-foreground shadow-lg backdrop-blur transition hover:bg-card md:-left-5 md:flex"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Scroll categories right"
                onClick={() => scrollByAmount(240)}
                className="absolute -right-4 top-1/2 z-20 hidden -translate-y-1/2 rounded-full border border-border bg-card/90 p-2 text-foreground shadow-lg backdrop-blur transition hover:bg-card md:-right-5 md:flex"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}

          <div
            ref={scrollerRef}
            className="scrollbar-hide flex justify-start gap-2 overflow-x-auto px-1 py-1 sm:gap-3"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {(shouldLoop ? [...categories, ...categories] : categories).map((category, index) => {
              const isActive = activeCategoryId === category.id;
              const isWrapMarker = shouldLoop && index === categories.length;

              return (
                <button
                  key={`${category.id}-${index < categories.length ? 'a' : 'b'}`}
                  ref={isWrapMarker ? wrapMarkerRef : undefined}
                  onClick={() => setActiveCategoryId(category.id)}
                  className={`relative shrink-0 whitespace-nowrap rounded-full px-5 py-2.5 font-rajdhani text-sm font-semibold uppercase tracking-wider transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {category.category_name}
                </button>
              );
            })}
          </div>

          {/* Edge fades hint that the row scrolls, instead of a bare scrollbar */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-card to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-card to-transparent" />
        </div>

        {/* Products for active category */}
        <div className="mt-10">
          {isLoadingProducts ? (
            <Loader />
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
              {products.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center text-muted-foreground">
              No products yet in this category.
            </div>
          )}
        </div>

        {activeCategoryId && (
          <div className="mt-12 text-center">
            <Link to={`/products?category_id=${activeCategoryId}`}>
              <CyberButton variant="outline" size="lg" className="inline-flex items-center gap-2">
                View All in {activeCategoryName.split(' ')[0]}
                <ArrowRight className="w-4 h-4" />
              </CyberButton>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default CategoriesSection;
