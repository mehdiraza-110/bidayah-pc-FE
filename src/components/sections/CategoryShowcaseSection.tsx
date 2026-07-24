import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { getPublicCategories, getPublicProducts, type Product as ApiProduct } from '@/services/api';
import { Product } from '@/data/products';
import { ProductCard } from '@/components/products/ProductCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { GSAPScrollReveal } from '@/components/effects/GSAPScrollReveal';
import { cn } from '@/lib/utils';

interface CategoryShowcaseSectionProps {
  title: string;
  /** Lowercase substrings matched against category_name to find the right category. */
  matchTerms: string[];
  limit?: number;
  /** Tints the section bg-muted so consecutive showcases don't blend together. */
  tinted?: boolean;
}

const mapApiProductToLocal = (apiProduct: ApiProduct): Product => ({
  id: apiProduct.id,
  name: apiProduct.name,
  category: apiProduct.category_name || apiProduct.category_id || '',
  price: Number(apiProduct.price),
  originalPrice: apiProduct.original_price ? Number(apiProduct.original_price) : undefined,
  image: apiProduct.image,
  description: apiProduct.description,
  specs: apiProduct.specs?.map((s) => s.spec_text) || [],
  rating: apiProduct.rating || 0,
  reviews: apiProduct.reviews_count || 0,
  stock: apiProduct.stock,
  in_stock: apiProduct.in_stock,
  vendor_id: apiProduct.vendor_id,
  status: apiProduct.status || 'published',
  featured: apiProduct.featured,
  new: apiProduct.new_product,
  media: apiProduct.media?.map((m) => ({ url: m.url, type: m.type })) || [],
});

const CategoryShowcaseSection: React.FC<CategoryShowcaseSectionProps> = ({ title, matchTerms, limit = 6, tinted = false }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      try {
        const categoriesResponse = await getPublicCategories();
        const match = categoriesResponse.success && categoriesResponse.data
          ? categoriesResponse.data.find((category) => {
              const name = category.category_name.toLowerCase();
              return matchTerms.some((term) => name.includes(term));
            })
          : undefined;

        if (!match) {
          if (!cancelled) setIsLoading(false);
          return;
        }

        if (!cancelled) setCategoryId(match.id);

        const productsResponse = await getPublicProducts({
          category_id: match.id,
          in_stock: true,
          page: 1,
          limit,
        });

        if (!cancelled && productsResponse.success && productsResponse.data) {
          setProducts(productsResponse.data.map(mapApiProductToLocal));
        }
      } catch (error) {
        console.error(`Error loading "${title}" showcase:`, error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Nothing to show — don't render an empty section.
  if (!isLoading && products.length === 0) {
    return null;
  }

  return (
    <section className={cn('py-16 md:py-20', tinted && 'bg-muted')}>
      <div className="container mx-auto px-4">
        <GSAPScrollReveal animation="fadeUp">
          <div className="flex items-end justify-between mb-8">
            <h2 className="font-orbitron text-3xl md:text-4xl font-bold text-foreground">
              {title}
            </h2>
            {categoryId && (
              <Link to={`/products?category_id=${categoryId}`}>
                <CyberButton variant="outline" size="sm" className="inline-flex items-center gap-2 whitespace-nowrap">
                  More Products
                  <ArrowRight className="w-4 h-4" />
                </CyberButton>
              </Link>
            )}
          </div>
        </GSAPScrollReveal>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6 lg:grid-cols-6">
            {Array.from({ length: limit }).map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-card" />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6 lg:grid-cols-6"
          >
            {products.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default CategoryShowcaseSection;
