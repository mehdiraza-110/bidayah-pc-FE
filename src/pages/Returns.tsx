import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, PackageSearch } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { NeonCard } from '@/components/ui/NeonCard';
import { GSAPScrollReveal } from '@/components/effects/GSAPScrollReveal';

const ReturnsPage: React.FC = () => {
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
            <span className="text-foreground">Returns</span>
          </div>

          <GSAPScrollReveal animation="fadeUp">
            <div className="mb-10 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <PackageSearch className="h-7 w-7 text-primary" />
              </div>
              <h1 className="font-orbitron text-4xl md:text-5xl font-bold mb-4">
                RETURNS <span className="text-primary">& REFUNDS</span>
              </h1>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                Not quite right? Here's how returns and refunds work.
              </p>
            </div>
          </GSAPScrollReveal>

          <div className="space-y-6">
            <GSAPScrollReveal animation="fadeUp" delay={0.1}>
              <NeonCard className="p-6 sm:p-8" glowColor="cyan" hover={false}>
                <h2 className="font-orbitron text-xl font-bold mb-3">Eligibility</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Since every order goes through an agent review and pricing confirmation before it's finalized,
                  most return questions are best resolved before your order ships — talk to our team when they
                  confirm your quotation if anything needs to change. Once delivered, unused hardware in its
                  original packaging and condition can be returned within 7 days of delivery.
                </p>
              </NeonCard>
            </GSAPScrollReveal>

            <GSAPScrollReveal animation="fadeUp" delay={0.15}>
              <NeonCard className="p-6 sm:p-8" glowColor="cyan" hover={false}>
                <h2 className="font-orbitron text-xl font-bold mb-3">Custom Builds</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Gaming PCs configured through the PC Builder are assembled specifically for your order. If a
                  component turns out to be faulty, that's covered under our{' '}
                  <Link to="/warranty" className="text-primary hover:underline">warranty</Link> rather than a
                  standard return — reach out and we'll sort out a repair or replacement.
                </p>
              </NeonCard>
            </GSAPScrollReveal>

            <GSAPScrollReveal animation="fadeUp" delay={0.2}>
              <NeonCard className="p-6 sm:p-8" glowColor="cyan" hover={false}>
                <h2 className="font-orbitron text-xl font-bold mb-3">How To Start A Return</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Message us through our{' '}
                  <Link to="/contact" className="text-primary hover:underline">Contact Us</Link> page or via
                  WhatsApp with your order number and reason for the return. Our team will confirm eligibility and
                  arrange pickup or drop-off.
                </p>
              </NeonCard>
            </GSAPScrollReveal>

            <GSAPScrollReveal animation="fadeUp" delay={0.25}>
              <NeonCard className="p-6 sm:p-8" glowColor="cyan" hover={false}>
                <h2 className="font-orbitron text-xl font-bold mb-3">Refunds</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Once a returned item is received and inspected, we'll confirm your refund and process it back
                  to your original payment method as agreed with our team.
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

export default ReturnsPage;
