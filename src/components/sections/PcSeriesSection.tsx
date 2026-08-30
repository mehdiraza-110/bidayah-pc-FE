import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getPublicPcSeriesList, type PcSeries } from '@/services/api';
import { GSAPScrollReveal } from '@/components/effects/GSAPScrollReveal';
import { Loader } from '@/components/ui/Loader';
import { Layers } from 'lucide-react';

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
            <span className="inline-block px-3 py-1 bg-primary/10 border border-primary/30 rounded text-xs font-mono-tech text-primary mb-4">
              PC LINES
            </span>
            <h2 className="font-orbitron text-4xl md:text-5xl font-bold text-foreground mb-4">
              Gaming <span className="text-primary">PCs</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              Every line ships in multiple spec tiers and colors — pick a line, then dial in the exact build
            </p>
          </div>
        </GSAPScrollReveal>

        {isLoading ? (
          <Loader label="Loading PC series..." />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {seriesList.map((series, index) => {
              const priceRange = formatPriceRange(series);

              return (
                <GSAPScrollReveal key={series.id} animation="fadeUp" delay={index * 0.08}>
                  <motion.div
                    className="group h-full"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                  >
                    <Link to={seriesUrl(series)} className="flex h-full flex-col">
                      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 group-hover:border-primary/50 group-hover:shadow-[0_0_30px_hsl(var(--primary)/0.15)]">
                        {series.card_image ? (
                          <img
                            src={series.card_image}
                            alt={series.name}
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
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default PcSeriesSection;
