import React from 'react';
import { motion } from 'framer-motion';
import { ParallaxHero } from '@/components/effects/ParallaxHero';
import { type Category } from '@/services/api';

interface CategoryHeroBannerProps {
  category: Category;
}

// A shorter sibling of the homepage HeroSection, shown above the product
// grid when a category has an admin-configured hero image/tagline/description.
// Products.tsx only renders this when at least one of those three is set —
// otherwise it keeps its plain "ALL PRODUCTS" header.
export const CategoryHeroBanner: React.FC<CategoryHeroBannerProps> = ({ category }) => {
  const { category_name, hero_image, hero_tagline, hero_description } = category;

  return (
    <ParallaxHero
      className="mb-10 flex min-h-[280px] items-center rounded-2xl border border-border md:min-h-[360px]"
      backgroundElement={
        hero_image ? (
          <>
            <img
              src={hero_image}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/45 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent" />
          </>
        ) : (
          // No hero image configured — fall back to a plain card background
          // so the tagline/description still get a home of their own.
          <div className="absolute inset-0 bg-card/70" />
        )
      }
    >
      <div className="px-6 py-10 md:px-12 md:py-16">
        <div className="max-w-xl">
          {hero_tagline && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-3 font-rajdhani text-sm font-semibold uppercase tracking-wider text-primary"
            >
              {hero_tagline}
            </motion.p>
          )}

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08 }}
            className="font-orbitron text-3xl font-bold leading-tight text-foreground sm:text-4xl md:text-5xl"
          >
            {category_name}
          </motion.h1>

          {hero_description && (
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.16 }}
              className="mt-4 max-w-md text-base text-muted-foreground md:text-lg"
            >
              {hero_description}
            </motion.p>
          )}
        </div>
      </div>
    </ParallaxHero>
  );
};

export default CategoryHeroBanner;
