import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getPublicPcSeriesList, type PcSeries } from '@/services/api';
import { GSAPScrollReveal } from '@/components/effects/GSAPScrollReveal';
import { Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

// Every series links to its own landing page at /gaming-pc/<slug> (same
// segment that /gaming-pc/:id already uses for single Featured Gaming PCs —
// GamingPcRouter resolves which one a given slug is) — except the pinned
// "Build your own" card, which goes straight to the PC Builder instead.
const seriesUrl = (series: PcSeries) => (series.is_custom_build ? '/pc-builder' : `/gaming-pc/${series.slug}`);

// A manually-set starting price always wins — it's what "Build your own"
// (and any series with no priced builds yet) relies on. Pairs with a manual
// ending price to show a range too, same as the computed price_from/price_to
// case below (e.g. "Build your own" has no ending_price, so it stays a
// single "from AED X" — matching the requirement that card needs no range).
const formatPriceRange = (series: PcSeries) => {
  if (series.starting_price != null) {
    const from = Number(series.starting_price).toLocaleString();
    return series.ending_price != null
      ? `from AED ${from} to AED ${Number(series.ending_price).toLocaleString()}`
      : `from AED ${from}`;
  }

  const from = series.price_from;
  if (from == null) return null;

  const to = series.price_to;
  if (to == null || Number(to) === Number(from)) {
    return `from AED ${Number(from).toLocaleString()}`;
  }

  return `from AED ${Number(from).toLocaleString()} to AED ${Number(to).toLocaleString()}`;
};

// How often the image swaps while a card is hovered — matches ProductCard.
const HOVER_CYCLE_MS = 2200;

// Shaped like SeriesCard below (same image aspect ratio, badge pill, title/
// price/button lines) so the grid doesn't jump when the real cards arrive.
const SeriesCardSkeleton: React.FC = () => (
  <div className="flex h-full flex-col">
    <div className="relative aspect-[4/3] animate-pulse overflow-hidden rounded-2xl border border-border bg-card">
      <div className="absolute top-4 right-4 h-6 w-20 rounded-full bg-muted" />
    </div>
    <div className="pt-5 flex flex-col items-center gap-2">
      <div className="h-6 w-32 rounded bg-muted animate-pulse" />
      <div className="h-4 w-40 rounded bg-muted animate-pulse" />
      <div className="h-4 w-24 rounded bg-muted animate-pulse mb-2" />
      <div className="h-9 w-28 rounded-full border border-border bg-muted/60 animate-pulse" />
    </div>
  </div>
);

interface SeriesCardProps {
  series: PcSeries;
  index: number;
}

const SeriesCard: React.FC<SeriesCardProps> = ({ series, index }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const priceRange = formatPriceRange(series);

  const galleryImages = useMemo(() => {
    const fromVariants = series.card_images && series.card_images.length > 0
      ? series.card_images
      : series.card_image
        ? [series.card_image]
        : [];
    return Array.from(new Set(fromVariants.filter(Boolean)));
  }, [series.card_images, series.card_image]);

  useEffect(() => {
    if (!isHovered || galleryImages.length <= 1) {
      setImageIndex(0);
      return;
    }

    const timer = window.setInterval(() => {
      setImageIndex((prev) => (prev + 1) % galleryImages.length);
    }, HOVER_CYCLE_MS);

    return () => window.clearInterval(timer);
  }, [isHovered, galleryImages.length]);

  const activeImage = galleryImages[imageIndex] || series.card_image;

  return (
    <GSAPScrollReveal animation="fadeUp" delay={index * 0.08}>
      <motion.div
        className="group h-full"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <Link
          to={seriesUrl(series)}
          className="flex h-full flex-col"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 group-hover:border-primary/50 group-hover:shadow-[0_0_30px_hsl(var(--primary)/0.15)]">
            {activeImage ? (
              <motion.img
                key={activeImage}
                src={activeImage}
                alt={series.name}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25 }}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted">
                <Layers className="h-16 w-16 text-muted-foreground/40" />
              </div>
            )}

            <span className="absolute top-4 right-4 rounded-full border border-border bg-background/80 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
              {series.badge_status === 'made_to_order' ? 'Made to order' : 'In stock'}
            </span>

            {/* Progress dots — one per gallery image, the active one fills up
                over HOVER_CYCLE_MS in sync with the swap above (Instagram-
                story style), so hovering shows how long until the next image. */}
            {galleryImages.length > 1 && (
              <div
                className={cn(
                  'absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1 transition-opacity duration-300',
                  isHovered ? 'opacity-100' : 'opacity-0'
                )}
              >
                {galleryImages.map((_, dotIndex) => (
                  <span
                    key={dotIndex}
                    className="relative h-1 w-5 overflow-hidden rounded-full bg-white/40"
                  >
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

          <div className="pt-5 text-center">
            <h3 className="font-orbitron text-2xl font-bold text-foreground mb-1">{series.name}</h3>
            {series.card_description?.split('\n').filter(Boolean).map((line, i) => (
              <p key={i} className="text-sm text-muted-foreground">{line}</p>
            ))}
            {priceRange && <p className="text-sm font-semibold text-foreground mt-1 mb-4">{priceRange}</p>}
            <span className="inline-flex items-center justify-center rounded-full border border-border px-5 py-2 text-sm font-semibold text-foreground transition-colors group-hover:border-primary group-hover:text-primary">
              {series.action_button_text}
            </span>
          </div>
        </Link>
      </motion.div>
    </GSAPScrollReveal>
  );
};

const PcSeriesSection: React.FC = () => {
  const [seriesList, setSeriesList] = useState<PcSeries[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getPublicPcSeriesList().then((response) => {
      if (!cancelled && response.success && response.data) {
        setSeriesList(response.data);
      }
      if (!cancelled) setIsLoading(false);
    });

    return () => { cancelled = true; };
  }, []);

  // Nothing to show — don't render an empty section.
  if (!isLoading && seriesList.length === 0) {
    return null;
  }

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <GSAPScrollReveal animation="fadeUp">
          <div className="text-center mb-12">
            <h2 className="font-orbitron text-4xl md:text-5xl font-bold text-foreground mb-4">
              Gaming <span className="text-primary">PCs</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              Explore our range of gaming PC series, each designed to deliver exceptional performance and immersive gaming experiences. 
            </p>
          </div>
        </GSAPScrollReveal>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => <SeriesCardSkeleton key={i} />)
            : seriesList.map((series, index) => (
                <SeriesCard key={series.id} series={series} index={index} />
              ))}
        </div>
      </div>
    </section>
  );
};

export default PcSeriesSection;
