import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { getPublicCategories, getPublicProducts, type Category } from '@/services/api';
import { Product } from '@/data/products';
import { ProductCard } from '@/components/products/ProductCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { Loader } from '@/components/ui/Loader';
import { mapApiProductToLocal } from '@/lib/mapProduct';
import { sortByCategoryPriority } from '@/lib/categoryPriority';

const CategoriesSection: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  useEffect(() => {
    const loadCategories = async () => {
      setIsLoadingCategories(true);
      try {
        const response = await getPublicCategories();
        if (response.success && response.data && response.data.length > 0) {
          const sorted = sortByCategoryPriority(response.data);
          setCategories(sorted);
          setActiveCategoryId(sorted[0].id);
        }
      } catch (error) {
        console.error('Error loading categories:', error);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    if (!activeCategoryId) return;

    const loadProducts = async () => {
      setIsLoadingProducts(true);
      try {
        const response = await getPublicProducts({ category_id: activeCategoryId });
        if (response.success && response.data) {
          const sorted = [...response.data].sort((a, b) => {
            const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return dateB - dateA;
          });
          setProducts(sorted.slice(0, 4).map(mapApiProductToLocal));
        } else {
          setProducts([]);
        }
      } catch (error) {
        console.error('Error loading category products:', error);
        setProducts([]);
      } finally {
        setIsLoadingProducts(false);
      }
    };

    loadProducts();
  }, [activeCategoryId]);

  if (isLoadingCategories) {
    return (
      <section className="py-24 bg-card/50">
        <div className="container mx-auto px-4 text-center">
          <Loader label="Loading categories..." />
        </div>
      </section>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  const activeCategoryName = categories.find((c) => c.id === activeCategoryId)?.category_name || '';

  return (
    <section className="py-24 bg-card/50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="font-orbitron text-4xl md:text-5xl font-bold text-foreground mb-4">
            Shop By <span className="text-primary">Category</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Browse the latest arrivals in each category
          </p>
        </motion.div>

        {/* Category tabs */}
        <div className="relative">
          <div className="scrollbar-hide flex justify-start gap-2 overflow-x-auto px-1 py-1 sm:justify-center sm:flex-wrap sm:gap-3 sm:overflow-visible">
            {categories.map((category) => {
              const isActive = activeCategoryId === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategoryId(category.id)}
                  className={`relative shrink-0 whitespace-nowrap rounded-full px-5 py-2.5 font-rajdhani text-sm font-semibold uppercase tracking-wider transition-colors ${
                    isActive ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="category-pill"
                      className="absolute inset-0 rounded-full bg-primary"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10">{category.category_name}</span>
                </button>
              );
            })}
          </div>

          {/* Edge fades hint that the row scrolls, instead of a bare scrollbar */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-card to-transparent sm:hidden" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-card to-transparent sm:hidden" />
        </div>

        {/* Products for active category */}
        <div className="mt-10">
          {isLoadingProducts ? (
            <Loader />
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
              {products.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center text-muted-foreground">
              No products yet in this category.
            </div>
          )}
        </div>

        {activeCategoryId && (
          <div className="mt-12 text-center">
            <Link to={`/products?category_id=${activeCategoryId}`}>
              <CyberButton variant="outline" size="lg" className="inline-flex items-center gap-2">
                View All in {activeCategoryName.split(' ')[0]}
                <ArrowRight className="w-4 h-4" />
              </CyberButton>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default CategoriesSection;
