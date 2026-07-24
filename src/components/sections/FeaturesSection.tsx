import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Truck, Shield, Headphones, Award } from 'lucide-react';
import { NeonCard } from '@/components/ui/NeonCard';

gsap.registerPlugin(ScrollTrigger);

const FeaturesSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const cards = containerRef.current.querySelectorAll('.feature-card');

    const ctx = gsap.context(() => {
      cards.forEach((card, i) => {
        gsap.fromTo(card,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            delay: i * 0.1,
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
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-orbitron text-4xl md:text-5xl font-bold text-foreground mb-4">
            Why Choose <span className="text-primary">Bidayah PC</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            We're not just selling hardware. We're empowering gamers to achieve greatness.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2">
          <NeonCard className="feature-card p-8 lg:col-span-2 lg:row-span-2 flex flex-col justify-center bg-gradient-to-br from-primary/10 via-card to-card">
            <Shield className="w-10 h-10 text-primary mb-6" />
            <div className="font-orbitron text-5xl font-bold text-foreground mb-2">
              3-Year
            </div>
            <h3 className="font-orbitron text-xl font-bold text-foreground mb-3">
              Full Warranty Coverage
            </h3>
            <p className="text-muted-foreground max-w-sm">
              Extended protection on every gaming PC and component we build, with
              genuine parts and honest repair turnaround.
            </p>
          </NeonCard>

          <NeonCard className="feature-card p-8 lg:col-span-2">
            <div className="flex items-start gap-5">
              <Truck className="w-8 h-8 text-primary shrink-0" />
              <div>
                <h3 className="font-orbitron text-xl font-bold text-foreground mb-2">
                  Free Shipping
                </h3>
                <p className="text-muted-foreground text-sm">
                  On all orders over AED 500, with fast and secure delivery across the UAE.
                </p>
              </div>
            </div>
          </NeonCard>

          <NeonCard className="feature-card p-8">
            <Headphones className="w-8 h-8 text-primary mb-5" />
            <h3 className="font-orbitron text-lg font-bold text-foreground mb-2">
              24/7 Support
            </h3>
            <p className="text-muted-foreground text-sm">
              Expert help choosing parts, whenever you need it.
            </p>
          </NeonCard>

          <NeonCard className="feature-card p-8">
            <Award className="w-8 h-8 text-primary mb-5" />
            <h3 className="font-orbitron text-lg font-bold text-foreground mb-2">
              Premium Quality
            </h3>
            <p className="text-muted-foreground text-sm">
              Only genuine components from trusted, authorized brands.
            </p>
          </NeonCard>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
