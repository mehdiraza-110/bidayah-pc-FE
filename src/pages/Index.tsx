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
import FeaturedBlogsSection from '@/components/sections/FeaturedBlogsSection';
import FaqSection from '@/components/sections/FaqSection';

// One stacked section per category, mirroring the competitor's homepage layout.
const CATEGORY_SHOWCASES = [
  { title: 'Graphics Cards', matchTerms: ['gpu', 'graphics'], limit: 12 },
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
            limit={showcase.limit}
            tinted={index % 2 === 1}
          />
        ))}
        <FeaturesSection />
        <FeaturedBlogsSection />
        <FaqSection />
      </main>

      <Footer />
    </motion.div>
  );
};

export default Index;
