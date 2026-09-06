import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { NeonCard } from '@/components/ui/NeonCard';
import { GSAPScrollReveal } from '@/components/effects/GSAPScrollReveal';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';

const faqs = [
  {
    question: 'How do I place an order?',
    answer: 'Add a ready-to-ship build or a custom PC Builder configuration to your cart, then check out with your name, email, phone, and address — no payment is collected on the site itself.',
  },
  {
    question: 'Is the price shown at checkout final?',
    answer: "No. The price shown is an estimate. After you place an order, our team reviews it and sends you a pricing quotation — this covers any final adjustments and lets you confirm before anything is paid.",
  },
  {
    question: 'How do I pay for my order?',
    answer: 'Our team will reach out after you place your order to confirm details and arrange payment — nothing is charged automatically at checkout.',
  },
  {
    question: 'Can I build my own custom PC?',
    answer: "Yes — use the PC Builder to pick each component yourself and see the price update live, or start from one of our ready-made Gaming PC lines and customize it further.",
  },
  {
    question: 'Do your gaming PCs come with a warranty?',
    answer: 'Every system we build is backed by a 1-year warranty. See our Warranty page for full coverage details.',
  },
  {
    question: 'Where do you deliver, and is shipping free?',
    answer: "We're based in the UAE and offer free courier delivery, along with in-store pickup at our locations where available.",
  },
  {
    question: 'How do I know if a product is in stock?',
    answer: "Each product page shows its current stock status. If you want to double-check before ordering, use the \"Check Availability\" button to message us directly on WhatsApp.",
  },
  {
    question: 'What if I need to return or exchange something?',
    answer: 'See our Returns page for eligibility and how to start a return.',
  },
  {
    question: "I have another question — how do I reach you?",
    answer: "Send us a message through our Contact Us page, or use the WhatsApp \"Check Availability\" button on any product page.",
  },
];

const FAQPage: React.FC = () => {
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
            <span className="text-foreground">FAQ</span>
          </div>

          <GSAPScrollReveal animation="fadeUp">
            <div className="mb-10 text-center">
              <h1 className="font-orbitron text-4xl md:text-5xl font-bold mb-4">
                FREQUENTLY ASKED <span className="text-primary">QUESTIONS</span>
              </h1>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                Answers to the questions we hear most. Can't find what you're looking for? Reach out on our Contact Us page.
              </p>
            </div>
          </GSAPScrollReveal>

          <GSAPScrollReveal animation="fadeUp" delay={0.1}>
            <NeonCard className="p-2 sm:p-4" glowColor="cyan" hover={false}>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, i) => (
                  <AccordionItem key={i} value={`item-${i}`} className="border-border px-4">
                    <AccordionTrigger className="font-rajdhani text-left text-base font-semibold hover:text-primary">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </NeonCard>
          </GSAPScrollReveal>
        </div>
      </main>

      <Footer />
    </motion.div>
  );
};

export default FAQPage;
