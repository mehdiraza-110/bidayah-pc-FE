import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CalendarDays } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import heroImage from '@/assets/hero-gaming-pc.jpg';

const blogPosts = [
  {
    title: 'How to Choose the Right Gaming PC for Your Budget',
    category: 'Buying Guide',
    date: 'May 2026',
    excerpt: 'A practical way to balance GPU, CPU, memory, storage, and upgrade room before you order.',
    path: '/products?category=Gaming+PC',
  },
  {
    title: 'Build From Scratch: What to Pick First',
    category: 'PC Builder',
    date: 'May 2026',
    excerpt: 'Start with performance goals, then choose compatible parts without overspending on the wrong component.',
    path: '/pc-builder',
  },
  {
    title: 'Airflow, Cooling, and Why Case Choice Matters',
    category: 'Hardware Tips',
    date: 'May 2026',
    excerpt: 'Better cooling keeps boost clocks stable and makes your system quieter during long gaming sessions.',
    path: '/products?search=cooling',
  },
];

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

const BlogFaqSection: React.FC = () => {
  return (
    <section className="bg-background py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
        >
          <div>
            <h2 className="font-orbitron text-4xl font-bold text-foreground md:text-5xl">
              LATEST <span className="text-primary">BLOGS</span>
            </h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Short hardware guides and setup advice for smarter buying decisions.
            </p>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 font-rajdhani text-sm font-semibold uppercase tracking-wider text-primary hover:text-foreground"
          >
            Browse Products
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-3">
          {blogPosts.map((post, index) => (
            <motion.article
              key={post.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              className="group overflow-hidden rounded-lg border border-border bg-card"
            >
              <Link to={post.path} className="block">
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={heroImage}
                    alt={post.title}
                    className="h-full w-full object-cover opacity-70 transition duration-500 group-hover:scale-110 group-hover:opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
                  <span className="absolute left-4 top-4 rounded border border-primary/30 bg-primary/10 px-3 py-1 font-mono-tech text-xs text-primary">
                    {post.category}
                  </span>
                </div>
                <div className="p-6">
                  <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                    {post.date}
                  </div>
                  <h3 className="font-orbitron text-xl font-bold text-foreground transition-colors group-hover:text-primary">
                    {post.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {post.excerpt}
                  </p>
                  <div className="mt-5 inline-flex items-center gap-2 font-rajdhani text-sm font-semibold uppercase tracking-wider text-primary">
                    Read More
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </Link>
            </motion.article>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20 grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start"
        >
          <div>
            <h2 className="font-orbitron text-4xl font-bold text-foreground md:text-5xl">
              COMMON <span className="text-primary">QUESTIONS</span>
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

export default BlogFaqSection;
