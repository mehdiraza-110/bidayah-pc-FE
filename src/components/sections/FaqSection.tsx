import React from 'react';
import { motion } from 'framer-motion';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: 'Can you help me choose compatible PC parts?',
    answer: 'Yes. Use Build From Scratch to start a configuration, or contact us with your budget and games or software. We can help match the CPU, GPU, motherboard, RAM, PSU, storage, and case.',
  },
  {
    question: 'Do you sell ready-made gaming PCs and individual components?',
    answer: 'Yes. You can shop complete gaming PCs, individual hardware parts, accessories, monitors, and other setup essentials from the products section.',
  },
  {
    question: 'How does search work?',
    answer: 'Use the search bar in the header to find products by name, category, vendor, or description. Search results open directly on the products page.',
  },
  {
    question: 'Can I request a custom build?',
    answer: 'Yes. Choose parts in the PC Builder or send us your requirements. We can suggest changes for better compatibility, cooling, value, and future upgrades.',
  },
  {
    question: 'What should I do if a product is out of stock?',
    answer: 'If a part is unavailable, contact us and we can recommend a close alternative with similar performance and compatibility.',
  },
];

const FaqSection: React.FC = () => {
  return (
    <section className="bg-background pb-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start"
        >
          <div>
            <h2 className="font-orbitron text-4xl font-bold text-foreground md:text-5xl">
              Common <span className="text-primary">Questions</span>
            </h2>
            <p className="mt-3 text-muted-foreground">
              Quick answers before you choose parts, place an order, or start a custom build.
            </p>
          </div>

          <Accordion type="single" collapsible className="rounded-lg border border-border bg-card px-6">
            {faqs.map((faq, index) => (
              <AccordionItem key={faq.question} value={`faq-${index}`} className="border-border">
                <AccordionTrigger className="text-left font-orbitron text-base font-semibold text-foreground hover:text-primary hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};

export default FaqSection;
