import React from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import HeroSection from '@/components/sections/HeroSection';
import FeaturedSection from '@/components/sections/FeaturedSection';
import FeaturesSection from '@/components/sections/FeaturesSection';
import CategoriesSection from '@/components/sections/CategoriesSection';

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
        <FeaturedSection />
        <CategoriesSection />
        <FeaturesSection />
      </main>

      <Footer />
    </motion.div>
  );
};

export default Index;
