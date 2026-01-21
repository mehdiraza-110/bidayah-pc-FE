import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Product } from '@/data/products';
import { ProductCarousel } from '@/components/products/ProductCarousel';
import { GSAPScrollReveal } from '@/components/effects/GSAPScrollReveal';
import { CyberButton } from '@/components/ui/CyberButton';
import { getPublicFeaturedProducts, type Product as ApiProduct } from '@/services/api';

const FeaturedSection: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Helper function to convert API Product to local Product format
  const mapApiProductToLocal = (apiProduct: ApiProduct): Product => {
    return {
      id: apiProduct.id,
      name: apiProduct.name,
      category: apiProduct.category_name || apiProduct.category_id || '',
      price: Number(apiProduct.price),
      originalPrice: apiProduct.original_price ? Number(apiProduct.original_price) : undefined,
      image: apiProduct.image,
      description: apiProduct.description,
      specs: apiProduct.specs?.map(s => s.spec_text) || [],
      rating: apiProduct.rating || 0,
      reviews: apiProduct.reviews_count || 0,
      stock: apiProduct.stock,
      in_stock: apiProduct.in_stock,
      vendor_id: apiProduct.vendor_id,
      status: apiProduct.status || 'published',
      featured: apiProduct.featured,
      new: apiProduct.new_product,
      media: apiProduct.media?.map(m => ({ url: m.url, type: m.type })) || [],
    };
  };

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

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-gradient-radial-purple opacity-20 blur-3xl -translate-y-1/2" />
      <div className="absolute top-1/2 right-0 w-96 h-96 bg-gradient-radial-cyan opacity-20 blur-3xl -translate-y-1/2" />

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
                FEATURED <span className="text-primary">BUILDS</span>
              </h2>
            </div>
            <Link to="/products" className="mt-4 md:mt-0">
              <motion.span 
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-rajdhani"
                whileHover={{ x: 5 }}
              >
                View All Products
                <ArrowRight className="w-4 h-4" />
              </motion.span>
            </Link>
          </div>
        </GSAPScrollReveal>

        <GSAPScrollReveal animation="fadeUp" delay={0.2}>
          {isLoading ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">Loading featured products...</p>
            </div>
          ) : featuredProducts.length > 0 ? (
            <ProductCarousel products={featuredProducts} />
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No featured products available</p>
            </div>
          )}
        </GSAPScrollReveal>

        <GSAPScrollReveal animation="fadeUp" delay={0.4}>
          <div className="text-center mt-12">
            <Link to="/products">
              <CyberButton variant="outline" size="lg" glowColor="purple" className="inline-flex items-center gap-2">
                EXPLORE ALL PRODUCTS
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
