import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Product } from '@/data/products';
import { ProductCarousel } from '@/components/products/ProductCarousel';
import { GSAPScrollReveal } from '@/components/effects/GSAPScrollReveal';
import { CyberButton } from '@/components/ui/CyberButton';
import { getPublicFeaturedProducts } from '@/services/api';
import { Loader } from '@/components/ui/Loader';
import { mapApiProductToLocal } from '@/lib/mapProduct';

const FeaturedSection: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFeaturedProducts = async () => {
      setIsLoading(true);
      try {
        const response = await getPublicFeaturedProducts();
        if (response.success && response.data) {
          const mappedProducts = response.data.map(mapApiProductToLocal);
          setFeaturedProducts(mappedProducts);
        }
      } catch (error) {
        console.error('Error loading featured products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFeaturedProducts();
  }, []);

  // Nothing to show — don't render an empty section.
  if (!isLoading && featuredProducts.length === 0) {
    return null;
  }

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <GSAPScrollReveal animation="fadeUp">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
            <div>
              <motion.span
                className="inline-block px-3 py-1 bg-primary/10 border border-primary/30 rounded text-xs font-mono-tech text-primary mb-4"
              >
                TOP PICKS
              </motion.span>
              <h2 className="font-orbitron text-4xl md:text-5xl font-bold text-foreground">
                Featured <span className="text-primary">Builds</span>
              </h2>
            </div>
          </div>
        </GSAPScrollReveal>

        <GSAPScrollReveal animation="fadeUp" delay={0.2}>
          {isLoading ? (
            <Loader label="Loading featured products..." />
          ) : (
            <ProductCarousel products={featuredProducts} />
          )}
        </GSAPScrollReveal>

        <GSAPScrollReveal animation="fadeUp" delay={0.4}>
          <div className="text-center mt-12">
            <Link to="/products">
              <CyberButton variant="outline" size="lg" className="inline-flex items-center gap-2">
                View All Products
                <ArrowRight className="w-4 h-4" />
              </CyberButton>
            </Link>
          </div>
        </GSAPScrollReveal>
      </div>
    </section>
  );
};

export default FeaturedSection;
