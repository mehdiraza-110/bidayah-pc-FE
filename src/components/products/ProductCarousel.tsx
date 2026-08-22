import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Product } from '@/data/products';
import { ProductCard } from './ProductCard';
import { cn } from '@/lib/utils';

// Continuous auto-scroll speed for the pinned (native-scroll) rows, in pixels
// per second — a slow, constant glide rather than a discrete jump every N ms.
// Cards are much narrower on phones (see the w-[150px] sm:w-[220px]... row
// below), so the same px/sec speed reads as noticeably faster there — a
// slower mobile rate keeps the perceived pace roughly the same as desktop's.
const AUTOPLAY_SPEED_PX_PER_SEC_MOBILE = 18;
const AUTOPLAY_SPEED_PX_PER_SEC_DESKTOP = 40;
const MOBILE_BREAKPOINT_PX = 640; // Tailwind's `sm`

interface ProductCarouselProps {
  products: Product[];
  title?: string;
  /**
   * Rendered as a fixed, always-visible first item in the row (e.g. a "category" tile) — pinned
   * via CSS `sticky`, so it stays put while the products beside it scroll past. Providing this
   * switches the row to plain native horizontal scroll (trackpad/touch/scrollbar + arrow
   * buttons) instead of the click-and-drag gesture used elsewhere: a drag transform and `sticky`
   * positioning don't combine reliably, since `sticky` only reacts to real scroll offset.
   */
  leadingContent?: React.ReactNode;
  /** Fires once the user has scrolled near the end of the row — wire this to fetch + append the next page. */
  onNearEnd?: () => void;
  isLoadingMore?: boolean;
}

const ProductCarousel: React.FC<ProductCarouselProps> = ({ products, title, leadingContent, onNearEnd, isLoadingMore }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isPausedRef = useRef(false);
  const pinned = !!leadingContent;

  const handleScroll = () => {
    if (!onNearEnd) return;
    const el = containerRef.current;
    if (!el) return;
    // Trigger a bit before the physical end so the next page is ready before the user gets there.
    if (el.scrollWidth - el.scrollLeft - el.clientWidth < 400) {
      onNearEnd();
    }
  };

  const scrollByAmount = (amount: number) => {
    containerRef.current?.scrollBy({ left: amount, behavior: 'smooth' });
  };

  // Auto-advance the pinned (native-scroll) rows — the click-and-drag carousel elsewhere keeps
  // manual-only control. A constant per-frame nudge (rather than a periodic scrollBy jump) reads
  // as a slow, continuous glide instead of a visible step every few seconds. Paused on hover so
  // it doesn't fight a user mid-browse, and it drives the same `handleScroll` path as manual
  // scrolling, so onNearEnd/load-more keeps firing as it advances. Loops back to the start once
  // truly at the end (no more pages left to load).
  useEffect(() => {
    if (!pinned) return undefined;

    let frameId: number;
    let lastTimestamp: number | null = null;
    let isResetting = false;

    const tick = (timestamp: number) => {
      const el = containerRef.current;
      const delta = lastTimestamp === null ? 0 : timestamp - lastTimestamp;
      lastTimestamp = timestamp;

      if (el && !isPausedRef.current && !isResetting) {
        const atEnd = el.scrollWidth - el.scrollLeft - el.clientWidth < 1;

        if (atEnd) {
          // Ease back to the start rather than a jarring instant cut.
          isResetting = true;
          el.scrollTo({ left: 0, behavior: 'smooth' });
          window.setTimeout(() => { isResetting = false; }, 600);
        } else {
          const speed = window.innerWidth < MOBILE_BREAKPOINT_PX
            ? AUTOPLAY_SPEED_PX_PER_SEC_MOBILE
            : AUTOPLAY_SPEED_PX_PER_SEC_DESKTOP;
          el.scrollLeft += (speed * delta) / 1000;
        }
      }

      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [pinned]);

  // Only the plain-scroll (pinned) mode gets drag-free native scrolling; the original
  // click-and-drag carousel (no leadingContent) keeps its existing motion-drag behavior.
  const dragProps = pinned ? {} : { drag: 'x' as const, dragConstraints: { left: -1000, right: 0 } };

  return (
    <div className="relative">
      {title && (
        <h2 className="font-orbitron text-3xl font-bold mb-8 text-foreground">
          {title}
        </h2>
      )}

      <div
        className="relative"
        onMouseEnter={() => { isPausedRef.current = true; }}
        onMouseLeave={() => { isPausedRef.current = false; }}
      >
        {pinned && (
          <>
            <button
              type="button"
              aria-label="Scroll left"
              onClick={() => scrollByAmount(-320)}
              className="absolute -left-12 top-1/2 z-40 hidden -translate-y-1/2 rounded-full border border-border bg-card/90 p-2 text-foreground shadow-lg backdrop-blur transition hover:bg-card md:flex"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Scroll right"
              onClick={() => scrollByAmount(320)}
              className="absolute -right-12 top-1/2 z-40 hidden -translate-y-1/2 rounded-full border border-border bg-card/90 p-2 text-foreground shadow-lg backdrop-blur transition hover:bg-card md:flex"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        <motion.div
          ref={containerRef}
          onScroll={handleScroll}
          className={cn('flex gap-3 sm:gap-6 overflow-x-auto pb-4 scrollbar-hide', !pinned && 'cursor-grab active:cursor-grabbing')}
          {...dragProps}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {leadingContent && (
            // z-30: must beat ProductCard's own absolutely-positioned "NEW" badge and hover
            // actions (both z-10) — with equal z-index, later DOM order (the scrolling product
            // cards, which come after this tile) would otherwise win and paint over the tile.
            // bg-card: the tile's own corners are rounded, so its square bounding box has small
            // transparent corner triangles outside that radius — without an opaque backing here,
            // whatever product card is scrolled underneath at that exact spot shows through them.
            // Matching bg-card makes the corner "leak" the same solid color as the tile itself.
            // hidden sm:block: screen real estate is too tight on phones for a whole extra tile —
            // the row's own "More Products" button already covers the same destination there.
            <div className="hidden sm:block sticky left-0 z-30 flex-shrink-0 self-stretch bg-card">{leadingContent}</div>
          )}

          {products.map((product, index) => (
            <div key={product.id} className="flex-shrink-0 w-[150px] sm:w-[220px] md:w-[260px] lg:w-[300px]">
              <ProductCard product={product} index={index} />
            </div>
          ))}

          {isLoadingMore && (
            <div className="flex w-[120px] flex-shrink-0 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export { ProductCarousel };
