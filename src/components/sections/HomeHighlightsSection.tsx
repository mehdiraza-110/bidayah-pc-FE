import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Award, MapPin, ShieldCheck } from 'lucide-react';
import { getPublicCategories, type Category } from '@/services/api';

const stats = [
  { value: '500+', label: 'Custom Builds Shipped' },
  { value: '4.8★', label: 'Average Customer Rating' },
  { value: '3-Yr', label: 'Warranty On Every Build' },
];

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
      <div className="border-b border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-3 divide-x divide-border py-6">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="text-center"
              >
                <div className="font-orbitron text-2xl font-bold text-foreground sm:text-3xl">
                  {stat.value}
                </div>
                <div className="mt-1 text-xs text-muted-foreground sm:text-sm">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

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
        <div className="mx-auto flex max-w-6xl flex-wrap justify-center gap-x-8 gap-y-6 sm:gap-x-10 lg:gap-x-12">
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
                className="group flex w-24 flex-col items-center gap-3 sm:w-28"
              >
                <div className="h-20 w-20 overflow-hidden rounded-full border border-border bg-card transition-colors duration-300 group-hover:border-primary sm:h-24 sm:w-24">
                  <img
                    src={tile.image}
                    alt={tile.label}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                  />
                </div>
                <span className="text-center text-xs font-semibold tracking-wide text-foreground transition-colors group-hover:text-primary sm:text-sm">
                  {tile.label}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomeHighlightsSection;
