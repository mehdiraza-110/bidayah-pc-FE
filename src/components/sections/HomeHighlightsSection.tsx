import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Award, MapPin, ShieldCheck } from 'lucide-react';
import { getPublicCategories, type Category } from '@/services/api';

const infoItems = [
  {
    icon: MapPin,
    title: 'LOCAL GAMING HARDWARE EXPERTS',
    body: 'Guided component selection, custom builds, and practical setup advice.',
  },
  {
    icon: Award,
    title: 'BUILT FOR REAL CUSTOMER NEEDS',
    body: 'Balanced performance, thermal planning, and upgrade-friendly recommendations.',
  },
  {
    icon: ShieldCheck,
    title: 'SECURE CHECKOUT AND SUPPORT',
    body: 'Clear ordering flow with help available before and after purchase.',
  },
];

const featuredCategories = [
  { label: 'CPU', terms: ['cpu', 'processor'], image: '/pc-components/cpu.jpg' },
  { label: 'GPU', terms: ['gpu', 'graphics', 'graphic', 'video card'], image: '/pc-components/gpu.jpg' },
  { label: 'RAM', terms: ['ram', 'memory'], image: '/pc-components/ram.jpg' },
  { label: 'PSU', terms: ['psu', 'power supply'], image: '/pc-components/psu.webp' },
  { label: 'MOBO', terms: ['mobo', 'motherboard', 'mainboard'], image: '/pc-components/motherboard.png' },
];

const HomeHighlightsSection: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const loadCategories = async () => {
      const response = await getPublicCategories();
      if (response.success && response.data) {
        setCategories(response.data);
      }
    };

    loadCategories();
  }, []);

  const categoryTiles = useMemo(() => {
    return featuredCategories.map((tile) => {
      const match = categories.find((category) => {
        const name = category.category_name.toLowerCase();
        return tile.terms.some(term => name.includes(term));
      });

      return {
        ...tile,
        path: match
          ? `/products?category_id=${match.id}`
          : `/products?search=${encodeURIComponent(tile.label)}`,
      };
    });
  }, [categories]);

  return (
    <section className="bg-background">
      <div className="border-y border-border bg-card/70">
        <div className="container mx-auto px-4">
          <div className="grid gap-5 py-6 lg:grid-cols-3">
            {infoItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  className="flex items-start gap-4"
                >
                  <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded border border-primary/30 bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-orbitron text-sm font-semibold text-foreground">
                      {item.title}
                    </h3>
                    <p className="mt-1 max-w-md text-sm leading-snug text-muted-foreground">
                      {item.body}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto grid max-w-6xl grid-cols-1 justify-center gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {categoryTiles.map((tile, index) => (
            <motion.div
              key={tile.label}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                to={tile.path}
                className="group relative block h-40 overflow-hidden rounded-lg border border-border bg-card sm:h-44 lg:h-48"
              >
                <img
                  src={tile.image}
                  alt={tile.label}
                  className="absolute inset-0 h-full w-full object-cover opacity-65 transition duration-500 group-hover:scale-110 group-hover:opacity-85"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/35 to-background/10" />
                <div className="absolute inset-0 border border-transparent transition-colors group-hover:border-primary/70" />
                <div className="relative z-10 flex h-full items-center justify-center">
                  <span className="font-orbitron text-3xl font-light tracking-widest text-foreground drop-shadow-[0_0_12px_hsl(var(--background))]">
                    {tile.label}
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomeHighlightsSection;
