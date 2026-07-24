import React from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import HeroSection from '@/components/sections/HeroSection';
import HomeHighlightsSection from '@/components/sections/HomeHighlightsSection';
import FeaturedSection from '@/components/sections/FeaturedSection';
import FeaturesSection from '@/components/sections/FeaturesSection';
import CategoriesSection from '@/components/sections/CategoriesSection';
import CategoryShowcaseSection from '@/components/sections/CategoryShowcaseSection';
import BlogFaqSection from '@/components/sections/BlogFaqSection';

// One stacked section per category, mirroring the competitor's homepage layout.
const CATEGORY_SHOWCASES = [
  { title: 'Graphics Cards', matchTerms: ['gpu', 'graphics'] },
  { title: 'Gaming Laptops', matchTerms: ['laptop'] },
  { title: 'Monitors', matchTerms: ['monitor'] },
  { title: 'Processors', matchTerms: ['cpu', 'processor'] },
  { title: 'Keyboards', matchTerms: ['keyboard'] },
  { title: 'Mice', matchTerms: ['mouse'] },
];

const Index: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-background"
    >
      <Navbar />
      <CartDrawer />
      
      <main>
        <HeroSection />
        <HomeHighlightsSection />
        <FeaturedSection />
        <CategoriesSection />
        {CATEGORY_SHOWCASES.map((showcase, index) => (
          <CategoryShowcaseSection
            key={showcase.title}
            title={showcase.title}
            matchTerms={showcase.matchTerms}
            tinted={index % 2 === 1}
          />
        ))}
        <FeaturesSection />
        <BlogFaqSection />
      </main>

      <Footer />
    </motion.div>
  );
};

export default Index;
