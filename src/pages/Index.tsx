import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import HeroSection from '@/components/sections/HeroSection';
import HomeHighlightsSection from '@/components/sections/HomeHighlightsSection';
import FeaturedSection from '@/components/sections/FeaturedSection';
import FeaturesSection from '@/components/sections/FeaturesSection';
import CategoriesSection from '@/components/sections/CategoriesSection';
import PcSeriesSection from '@/components/sections/PcSeriesSection';
import CategoryShowcaseSection from '@/components/sections/CategoryShowcaseSection';
import FeaturedBlogsSection from '@/components/sections/FeaturedBlogsSection';
import FaqSection from '@/components/sections/FaqSection';
import { getPublicHomepageSections, type PublicHomepageSection } from '@/services/api';

const Index: React.FC = () => {
  // Admin-managed via /admin/homepage-sections — which categories show as a
  // showcase row, their order, product count, and per-theme background color.
  const [homepageSections, setHomepageSections] = useState<PublicHomepageSection[]>([]);

  useEffect(() => {
    let cancelled = false;

    getPublicHomepageSections().then((response) => {
      if (!cancelled && response.success && response.data) {
        setHomepageSections(response.data);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

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
        <PcSeriesSection />
        <CategoriesSection />
        {homepageSections.map((section) => (
          <CategoryShowcaseSection
            key={section.id}
            title={section.title}
            categoryId={section.category_id}
            categoryName={section.category_name}
            limit={section.product_limit}
            bgColorLight={section.bg_color_light}
            bgColorDark={section.bg_color_dark}
            image={section.image}
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
