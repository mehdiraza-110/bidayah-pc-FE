import React from 'react';
import { motion } from 'framer-motion';

const trustBadges = [
  { icon: '/google.webp', title: '4.8/5 Rating', subtitle: 'Trusted Customer Reviews' },
  { icon: '/pc.webp', title: '500+ Builds', subtitle: 'Custom Systems Shipped' },
  { icon: '/united-arab-emirates.webp', title: 'UAE Based', subtitle: 'Proudly Serving The Emirates' },
  { icon: '/shield.webp', title: '3-Yr Warranty', subtitle: 'On Every Build' },
  { icon: '/verify.webp', title: '100% Genuine', subtitle: 'Certified Components Only' },
];

// The circular CPU/GPU/RAM/PSU/MOBO "shop by category" icon row that used to live below the
// trust badges was removed — each CategoryShowcaseSection below now opens with its own pinned
// category tile, so this was a redundant second entry point to the same categories.
const HomeHighlightsSection: React.FC = () => {
  return (
    <section className="bg-background">
      <div className="border-y border-border bg-card/40">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-4 py-5 sm:grid-cols-5 sm:gap-0 sm:divide-x sm:divide-border/60">
            {trustBadges.map((badge, index) => (
              <motion.div
                key={badge.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.06 }}
                className="flex items-center gap-3 sm:justify-center sm:px-5"
              >
                <img src={badge.icon} alt="" className="h-8 w-8 shrink-0 object-contain sm:h-9 sm:w-9" />
                <div className="min-w-0">
                  <div className="font-orbitron text-xs font-bold text-foreground sm:text-sm">
                    {badge.title}
                  </div>
                  <div className="mt-0.5 text-[11px] leading-tight text-muted-foreground sm:text-xs">
                    {badge.subtitle}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeHighlightsSection;
