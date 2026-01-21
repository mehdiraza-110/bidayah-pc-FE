import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, X, Grid, List } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import { ProductCard } from '@/components/products/ProductCard';
import { Product } from '@/data/products';
import { 
  getPublicProducts, 
  getPublicCategories, 
  getPublicVendors,
  type Product as ApiProduct,
  type Category,
  type Vendor
} from '@/services/api';
import { GSAPScrollReveal } from '@/components/effects/GSAPScrollReveal';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const ProductsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('featured');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
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

  const activeCategory = searchParams.get('category') || 'All';
  const activeCategoryId = searchParams.get('category_id') || '';
  const activeVendorId = searchParams.get('vendor_id') || '';

  // Load products, categories, and vendors from public API
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      try {
        // Load categories
        const categoriesResponse = await getPublicCategories();
        if (categoriesResponse.success && categoriesResponse.data) {
          setCategories(categoriesResponse.data);
        } else {
          console.error('Failed to load categories:', categoriesResponse.message);
        }

        // Load vendors
        const vendorsResponse = await getPublicVendors();
        if (vendorsResponse.success && vendorsResponse.data) {
          setVendors(vendorsResponse.data);
        } else {
          console.error('Failed to load vendors:', vendorsResponse.message);
        }

        // Load products with filters from URL params
        const filters: any = {};
        if (activeCategoryId) filters.category_id = activeCategoryId;
        if (activeVendorId) filters.vendor_id = activeVendorId;
        if (searchParams.get('search')) filters.search = searchParams.get('search');
        if (searchParams.get('featured') === 'true') filters.featured = true;
        if (searchParams.get('in_stock') === 'true') filters.in_stock = true;

        const productsResponse = await getPublicProducts(filters);
        if (productsResponse.success && productsResponse.data) {
          const mappedProducts = productsResponse.data.map(mapApiProductToLocal);
          setProducts(mappedProducts);
        } else {
          console.error('Failed to load products:', productsResponse.message);
          toast.error('Failed to load products');
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('An error occurred while loading products');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategoryId, activeVendorId, searchParams.toString()]);

  const filteredProducts = useMemo(() => {
    let filtered = products;
    
    // Filter by category name (if using category name instead of ID)
    if (activeCategory !== 'All' && !activeCategoryId) {
      filtered = filtered.filter((p) => p.category === activeCategory);
    }
    
    switch (sortBy) {
      case 'price-low':
        return [...filtered].sort((a, b) => a.price - b.price);
      case 'price-high':
        return [...filtered].sort((a, b) => b.price - a.price);
      case 'rating':
        return [...filtered].sort((a, b) => b.rating - a.rating);
      case 'newest':
        return [...filtered].sort((a, b) => (b.new ? 1 : 0) - (a.new ? 1 : 0));
      default:
        return [...filtered].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }
  }, [products, activeCategory, activeCategoryId, sortBy]);

  const handleCategoryChange = (categoryId: string) => {
    if (categoryId === 'All' || categoryId === '') {
      searchParams.delete('category_id');
      searchParams.delete('category');
    } else {
      const category = categories.find(c => c.id === categoryId);
      searchParams.set('category_id', categoryId);
      if (category) {
        searchParams.set('category', category.category_name);
      }
    }
    setSearchParams(searchParams);
  };

  const handleVendorChange = (vendorId: string) => {
    if (vendorId === '' || vendorId === 'All') {
      searchParams.delete('vendor_id');
    } else {
      searchParams.set('vendor_id', vendorId);
    }
    setSearchParams(searchParams);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-background"
    >
      <Navbar />
      <CartDrawer />

      <main className="pt-28 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <GSAPScrollReveal animation="fadeUp">
            <div className="text-center mb-12">
              <h1 className="font-orbitron text-4xl md:text-5xl font-bold text-foreground mb-4">
                ALL <span className="text-primary">PRODUCTS</span>
              </h1>
              <p className="text-muted-foreground text-lg">
                {filteredProducts.length} products available
              </p>
            </div>
          </GSAPScrollReveal>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Filters */}
            <AnimatePresence>
              {(isFilterOpen || window.innerWidth >= 1024) && (
                <motion.aside
                  initial={{ x: -300, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -300, opacity: 0 }}
                  className={cn(
                    "lg:w-64 flex-shrink-0",
                    "fixed lg:static inset-y-0 left-0 z-40 lg:z-0",
                    "bg-card lg:bg-transparent p-6 lg:p-0",
                    "border-r border-border lg:border-0"
                  )}
                >
                  <div className="flex items-center justify-between lg:hidden mb-6">
                    <h3 className="font-orbitron text-lg font-bold">Filters</h3>
                    <button onClick={() => setIsFilterOpen(false)}>
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Categories */}
                  <div className="mb-8">
                    <h4 className="font-orbitron text-sm font-bold text-primary uppercase tracking-wider mb-4">
                      Categories
                    </h4>
                    <div className="space-y-2">
                      <motion.button
                        onClick={() => handleCategoryChange('All')}
                        className={cn(
                          "w-full text-left px-4 py-3 rounded-lg transition-all font-rajdhani",
                          (activeCategory === 'All' || !activeCategoryId)
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                        whileHover={{ x: 5 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        All
                      </motion.button>
                      {categories.map((category) => (
                        <motion.button
                          key={category.id}
                          onClick={() => handleCategoryChange(category.id)}
                          className={cn(
                            "w-full text-left px-4 py-3 rounded-lg transition-all font-rajdhani",
                            activeCategoryId === category.id
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                          whileHover={{ x: 5 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {category.category_name}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Vendors */}
                  {vendors.length > 0 && (
                    <div className="mb-8">
                      <h4 className="font-orbitron text-sm font-bold text-primary uppercase tracking-wider mb-4">
                        Vendors
                      </h4>
                      <select
                        value={activeVendorId}
                        onChange={(e) => handleVendorChange(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg bg-muted border border-border text-foreground focus:outline-none focus:border-primary"
                      >
                        <option value="">All Vendors</option>
                        {vendors.map((vendor) => (
                          <option key={vendor.id} value={vendor.id}>
                            {vendor.vendor_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Sort */}
                  <div>
                    <h4 className="font-orbitron text-sm font-bold text-primary uppercase tracking-wider mb-4">
                      Sort By
                    </h4>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg bg-muted border border-border text-foreground focus:outline-none focus:border-primary"
                    >
                      <option value="featured">Featured</option>
                      <option value="newest">Newest</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                      <option value="rating">Top Rated</option>
                    </select>
                  </div>
                </motion.aside>
              )}
            </AnimatePresence>

            {/* Overlay for mobile */}
            {isFilterOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden"
                onClick={() => setIsFilterOpen(false)}
              />
            )}

            {/* Products Grid */}
            <div className="flex-1">
              {/* Toolbar */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => setIsFilterOpen(true)}
                  className="lg:hidden flex items-center gap-2 px-4 py-2 bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filters
                </button>

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      viewMode === 'grid' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Grid className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      viewMode === 'list' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Products */}
              <motion.div
                layout
                className={cn(
                  "grid gap-6",
                  viewMode === 'grid'
                    ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
                    : "grid-cols-1"
                )}
              >
                <AnimatePresence mode="popLayout">
                  {filteredProducts.map((product, index) => (
                    <motion.div
                      key={product.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <ProductCard product={product} index={index} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>

              {isLoading ? (
                <div className="text-center py-16">
                  <p className="text-muted-foreground text-lg">Loading products...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-muted-foreground text-lg">No products found</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </motion.div>
  );
};

export default ProductsPage;
