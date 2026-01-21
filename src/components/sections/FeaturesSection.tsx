import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Truck, Shield, Headphones, Award } from 'lucide-react';
import { NeonCard } from '@/components/ui/NeonCard';

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    icon: Truck,
    title: 'Free Shipping',
    description: 'On all orders over AED 500. Fast & secure delivery worldwide.',
    color: 'cyan' as const,
  },
  {
    icon: Shield,
    title: '3-Year Warranty',
    description: 'Extended protection on all gaming PCs and components.',
    color: 'purple' as const,
  },
  {
    icon: Headphones,
    title: '24/7 Support',
    description: 'Expert gaming support whenever you need assistance.',
    color: 'green' as const,
  },
  {
    icon: Award,
    title: 'Premium Quality',
    description: 'Only the finest components from trusted brands.',
    color: 'cyan' as const,
  },
];

const FeaturesSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const cards = containerRef.current.querySelectorAll('.feature-card');

    const ctx = gsap.context(() => {
      cards.forEach((card, i) => {
        gsap.fromTo(card,
          { opacity: 0, y: 60, rotateX: 10 },
          {
            opacity: 1,
            y: 0,
            rotateX: 0,
            duration: 0.8,
            delay: i * 0.15,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 85%',
              toggleActions: 'play none none none',
            },
          }
        );
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="py-24 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-orbitron text-4xl md:text-5xl font-bold text-foreground mb-4">
            WHY CHOOSE <span className="text-primary">NEXUSGEAR</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            We're not just selling hardware — we're empowering gamers to achieve greatness.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <NeonCard
              key={feature.title}
              className="feature-card p-8 text-center"
              glowColor={feature.color}
            >
              <motion.div
                className="relative inline-flex items-center justify-center w-16 h-16 mb-6 mx-auto"
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                <div className={`absolute inset-0 rounded-xl bg-${feature.color === 'cyan' ? 'primary' : feature.color === 'purple' ? 'secondary' : 'accent'}/20`} />
                <feature.icon className={`w-8 h-8 ${feature.color === 'cyan' ? 'text-primary' : feature.color === 'purple' ? 'text-secondary' : 'text-accent'}`} />
              </motion.div>
              
              <h3 className="font-orbitron text-xl font-bold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm">
                {feature.description}
              </p>
            </NeonCard>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
