import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Cpu, Eye, ShieldCheck, Wrench } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { CyberButton } from '@/components/ui/CyberButton';
import { NeonCard } from '@/components/ui/NeonCard';
import { GSAPScrollReveal } from '@/components/effects/GSAPScrollReveal';

const stats = [
  { value: '4.8/5', label: 'Average Customer Rating' },
  { value: '500+', label: 'Builds Shipped' },
  { value: '100%', label: 'Genuine Components' },
  { value: '1-Year', label: 'Warranty On Every Build' },
];

const values = [
  {
    icon: Eye,
    title: 'Real Component Transparency',
    description: "Every build lists the exact parts inside it — no vague \"gaming CPU\" or \"high-end GPU\" placeholders. What you see on the page is what ships in the box.",
  },
  {
    icon: Wrench,
    title: 'Hand-Built, Not Assembly-Lined',
    description: 'Each system is built and cable-managed by hand, then tested before it goes out the door — whether it\'s a ready-to-ship build or one configured from scratch in the PC Builder.',
  },
  {
    icon: Cpu,
    title: 'Genuine Parts Only',
    description: 'We source only genuine, authentic components from authorized channels — no grey-market or counterfeit parts, ever.',
  },
  {
    icon: ShieldCheck,
    title: 'Honest Support',
    description: "Every build is backed by a 1-year warranty, and our team is reachable directly for order questions, availability checks, and support after the sale.",
  },
];

const AboutPage: React.FC = () => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-12 pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1">
              <ChevronLeft className="w-4 h-4" />
              Home
            </Link>
            <span>/</span>
            <span className="text-foreground">About Us</span>
          </div>

          <GSAPScrollReveal animation="fadeUp">
            <div className="mb-12 text-center">
              <img
                src="/Bidayah-New.png"
                alt="Bidayah PC"
                className="mx-auto mb-6 h-28 w-28 object-contain sm:h-36 sm:w-36"
              />
              <h1 className="font-orbitron text-4xl md:text-5xl font-bold mb-4">
                ABOUT <span className="text-primary">BIDAYAH PC</span>
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                We build gaming PCs the way we'd want to buy one ourselves — real components, honest pricing, and a build quality we're willing to put our name on.
              </p>
            </div>
          </GSAPScrollReveal>

          <GSAPScrollReveal animation="fadeUp" delay={0.1}>
            <NeonCard className="p-6 sm:p-8 mb-12" glowColor="cyan" hover={false}>
              <h2 className="font-orbitron text-2xl font-bold mb-4">
                Our <span className="text-primary">Story</span>
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Bidayah PC started with a simple frustration: it was hard to find a gaming PC builder in the UAE
                  that would tell you exactly what was inside the box, at a fair price, without pushing unnecessary
                  upsells or vague spec sheets.
                </p>
                <p>
                  So we built the kind of store we wished existed — one where every listed build shows its real
                  components, where you can configure a system from scratch in our PC Builder and see the price
                  update live, and where a real person is on the other end if you have a question before or after
                  you order.
                </p>
                <p>
                  Today we hand-build gaming PCs, laptops, and custom configurations for customers across the
                  Emirates, backed by genuine parts and a 1-year warranty on every system we ship.
                </p>
              </div>
            </NeonCard>
          </GSAPScrollReveal>

          <GSAPScrollReveal animation="fadeUp" delay={0.15}>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-12">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-lg border border-border bg-card p-4 text-center">
                  <p className="font-orbitron text-2xl sm:text-3xl font-bold text-primary mb-1">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </GSAPScrollReveal>

          <GSAPScrollReveal animation="fadeUp" delay={0.2}>
            <h2 className="font-orbitron text-2xl font-bold mb-6 text-center">
              What We <span className="text-primary">Stand For</span>
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 mb-12">
              {values.map((value) => (
                <NeonCard key={value.title} className="p-6" glowColor="cyan" hover={false}>
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                      <value.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-orbitron text-base font-bold mb-1.5">{value.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{value.description}</p>
                    </div>
                  </div>
                </NeonCard>
              ))}
            </div>
          </GSAPScrollReveal>

          <GSAPScrollReveal animation="fadeUp" delay={0.25}>
            <NeonCard className="p-8 text-center" glowColor="cyan" hover={false}>
              <h2 className="font-orbitron text-2xl font-bold mb-2">Ready to build?</h2>
              <p className="text-muted-foreground mb-6">
                Shop a ready-to-ship gaming PC or configure your own from scratch.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/products">
                  <CyberButton size="lg" className="w-full sm:w-auto">Shop Gaming PCs</CyberButton>
                </Link>
                <Link to="/pc-builder">
                  <CyberButton variant="outline" size="lg" className="w-full sm:w-auto">Start Custom Build</CyberButton>
                </Link>
              </div>
            </NeonCard>
          </GSAPScrollReveal>
        </div>
      </main>

      <Footer />
    </motion.div>
  );
};

export default AboutPage;
