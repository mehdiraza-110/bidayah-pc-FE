import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { getPublicCategories, getPublicProducts, type Category, type Product as ApiProduct } from '@/services/api';
import { Product } from '@/data/products';
import { ProductCard } from '@/components/products/ProductCard';
import { CyberButton } from '@/components/ui/CyberButton';

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
          setCategories(response.data);
          setActiveCategoryId(response.data[0].id);
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
          <p className="text-muted-foreground">Loading categories...</p>
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
        <div className="flex justify-start gap-8 overflow-x-auto border-b border-border pb-px sm:justify-center">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategoryId(category.id)}
              className={`shrink-0 whitespace-nowrap border-b-2 px-1 pb-3 font-rajdhani text-sm font-semibold uppercase tracking-wider transition-colors ${
                activeCategoryId === category.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {category.category_name}
            </button>
          ))}
        </div>

        {/* Products for active category */}
        <div className="mt-10">
          {isLoadingProducts ? (
            <div className="py-16 text-center text-muted-foreground">Loading products...</div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
