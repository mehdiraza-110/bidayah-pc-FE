import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, ChevronLeft, ShieldCheck, XCircle } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { NeonCard } from '@/components/ui/NeonCard';
import { GSAPScrollReveal } from '@/components/effects/GSAPScrollReveal';

const covered = [
  'Manufacturing defects in any component we install',
  'Hardware failures under normal use (GPU, CPU, motherboard, RAM, storage, PSU, cooling, and casing)',
  'Workmanship issues with our own build, cabling, and assembly',
];

const notCovered = [
  'Accidental damage, liquid damage, or physical abuse',
  'Damage from unauthorized repairs, modifications, or overclocking beyond safe limits',
  'Normal wear and tear, or cosmetic issues that don\'t affect performance',
  'Software issues, viruses, or damage caused by third-party software',
];

const WarrantyPage: React.FC = () => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-12 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1">
              <ChevronLeft className="w-4 h-4" />
              Home
            </Link>
            <span>/</span>
            <span className="text-foreground">Warranty</span>
          </div>

          <GSAPScrollReveal animation="fadeUp">
            <div className="mb-10 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <ShieldCheck className="h-7 w-7 text-primary" />
              </div>
              <h1 className="font-orbitron text-4xl md:text-5xl font-bold mb-4">
                WARRANTY <span className="text-primary">POLICY</span>
              </h1>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                Every gaming PC we build is backed by a 1-year warranty from the delivery date.
              </p>
            </div>
          </GSAPScrollReveal>

          <div className="space-y-6">
            <GSAPScrollReveal animation="fadeUp" delay={0.1}>
              <NeonCard className="p-6 sm:p-8" glowColor="cyan" hover={false}>
                <h2 className="font-orbitron text-xl font-bold mb-3">Coverage Period</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Every gaming PC and custom build ships with a 1-year warranty starting from the date your order is
                  delivered. This applies whether you ordered a ready-to-ship build or configured your own through
                  the PC Builder.
                </p>
              </NeonCard>
            </GSAPScrollReveal>

            <GSAPScrollReveal animation="fadeUp" delay={0.15}>
              <NeonCard className="p-6 sm:p-8" glowColor="cyan" hover={false}>
                <h2 className="font-orbitron text-xl font-bold mb-4">What's Covered</h2>
                <ul className="space-y-2.5">
                  {covered.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-accent" />
                      {item}
                    </li>
                  ))}
                </ul>
              </NeonCard>
            </GSAPScrollReveal>

            <GSAPScrollReveal animation="fadeUp" delay={0.2}>
              <NeonCard className="p-6 sm:p-8" glowColor="purple" hover={false}>
                <h2 className="font-orbitron text-xl font-bold mb-4">What's Not Covered</h2>
                <ul className="space-y-2.5">
                  {notCovered.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-muted-foreground">
                      <XCircle className="w-4 h-4 mt-0.5 shrink-0 text-destructive" />
                      {item}
                    </li>
                  ))}
                </ul>
              </NeonCard>
            </GSAPScrollReveal>

            <GSAPScrollReveal animation="fadeUp" delay={0.25}>
              <NeonCard className="p-6 sm:p-8" glowColor="cyan" hover={false}>
                <h2 className="font-orbitron text-xl font-bold mb-3">How To Make A Claim</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Reach out through our{' '}
                  <Link to="/contact" className="text-primary hover:underline">Contact Us</Link> page or via WhatsApp
                  with your order number and a description of the issue. Our team will guide you through diagnosis,
                  repair, or replacement.
                </p>
              </NeonCard>
            </GSAPScrollReveal>
          </div>
        </div>
      </main>

      <Footer />
    </motion.div>
  );
};

export default WarrantyPage;
