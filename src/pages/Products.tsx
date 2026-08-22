import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, X, Grid, List, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import { ProductCard } from '@/components/products/ProductCard';
import { CategoryHeroBanner } from '@/components/products/CategoryHeroBanner';
import { Product } from '@/data/products';
import {
  getPublicProducts,
  getPublicCategories,
  getPublicVendors,
  getCategoryFilters,
  type Category,
  type Vendor,
  type Pagination,
  type CategoryFilterGroup,
  type KeyFeatureFilterSelection
} from '@/services/api';
import { GSAPScrollReveal } from '@/components/effects/GSAPScrollReveal';
import { Loader } from '@/components/ui/Loader';
import { mapApiProductToLocal } from '@/lib/mapProduct';
import { sortByCategoryPriority } from '@/lib/categoryPriority';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const ProductsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('featured');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [categoryFilters, setCategoryFilters] = useState<CategoryFilterGroup[]>([]);
  // Vendors scoped to the active category (e.g. only Corsair/Samsung/Kingston/XPG under
  // Ram) — falls back to the global `vendors` list below when no category is selected.
  const [categoryVendors, setCategoryVendors] = useState<Vendor[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const PAGE_SIZE = 12;

  const activeCategory = searchParams.get('category') || 'All';
  const activeCategoryId = searchParams.get('category_id') || '';
  const activeVendorId = searchParams.get('vendor_id') || '';
  const activeCategoryObj = categories.find((c) => c.id === activeCategoryId);
  const hasCategoryHero = !!(
    activeCategoryObj &&
    (activeCategoryObj.hero_image || activeCategoryObj.hero_tagline || activeCategoryObj.hero_description)
  );

  // Selected "Specifications" checkboxes live in the URL, same convention as
  // category_id/vendor_id, so a filtered view is shareable/bookmarkable.
  const selectedKeyFeatures: KeyFeatureFilterSelection[] = useMemo(() => {
    const raw = searchParams.get('key_features');
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [searchParams]);

  // Load categories and vendors once — they don't depend on filters/page
  useEffect(() => {
    const loadFilters = async () => {
      const categoriesResponse = await getPublicCategories();
      if (categoriesResponse.success && categoriesResponse.data) {
        setCategories(sortByCategoryPriority(categoriesResponse.data));
      } else {
        console.error('Failed to load categories:', categoriesResponse.message);
      }

      const vendorsResponse = await getPublicVendors();
      if (vendorsResponse.success && vendorsResponse.data) {
        setVendors(vendorsResponse.data);
      } else {
        console.error('Failed to load vendors:', vendorsResponse.message);
      }
    };

    loadFilters();
  }, []);

  // Dynamic "Specifications" filters — whatever Key Features + values the
  // admin has actually populated for the active category, narrowed further to the
  // selected vendor's own products when one is picked (e.g. AMD under CPU stops
  // offering "Intel" or LGA1700/LGA1851). Empty for "All" or for a category with
  // no specs configured/used yet.
  useEffect(() => {
    if (!activeCategoryId) {
      setCategoryFilters([]);
      setCategoryVendors(null);
      return;
    }

    let isCancelled = false;

    const loadCategoryFilters = async () => {
      const response = await getCategoryFilters(activeCategoryId, activeVendorId || undefined);
      if (isCancelled) return;
      setCategoryFilters(response.success && response.data ? response.data.key_features : []);
      setCategoryVendors(response.success && response.data ? response.data.vendors : []);
    };

    loadCategoryFilters();

    return () => {
      isCancelled = true;
    };
  }, [activeCategoryId, activeVendorId]);

  // Reset to page 1 whenever filters or sort change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategoryId, activeVendorId, searchParams.toString(), sortBy]);

  // Load the current page of products from the server whenever filters,
  // sort, or the page itself change.
  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);

      try {
        const filters: {
          category_id?: string;
          vendor_id?: string;
          featured?: boolean;
          in_stock?: boolean;
          search?: string;
          sort?: 'featured' | 'newest' | 'price-low' | 'price-high' | 'rating';
          page?: number;
          limit?: number;
          key_features?: KeyFeatureFilterSelection[];
        } = { sort: sortBy as 'featured' | 'newest' | 'price-low' | 'price-high' | 'rating', page: currentPage, limit: PAGE_SIZE };
        if (activeCategoryId) filters.category_id = activeCategoryId;
        if (activeVendorId) filters.vendor_id = activeVendorId;
        if (searchParams.get('search')) filters.search = searchParams.get('search');
        if (searchParams.get('featured') === 'true') filters.featured = true;
        if (searchParams.get('in_stock') === 'true') filters.in_stock = true;
        if (selectedKeyFeatures.length > 0) filters.key_features = selectedKeyFeatures;

        const productsResponse = await getPublicProducts(filters);
        if (productsResponse.success && productsResponse.data) {
          const mappedProducts = productsResponse.data.map(mapApiProductToLocal);
          setProducts(mappedProducts);
          setPagination(productsResponse.pagination ?? null);
        } else {
          console.error('Failed to load products:', productsResponse.message);
          toast.error('Failed to load products');
        }
      } catch (error) {
        console.error('Error loading products:', error);
        toast.error('An error occurred while loading products');
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategoryId, activeVendorId, searchParams.toString(), sortBy, currentPage]);

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
    // Specification checkboxes are scoped to the previous category's
    // key-feature ids — carrying them over would silently filter the new
    // category's results against ids it has no rows for. Same reasoning for
    // vendor_id: a vendor with products in the old category may sell nothing
    // in the new one (e.g. NVIDIA under GPU, but not under Ram).
    searchParams.delete('key_features');
    searchParams.delete('vendor_id');
    setSearchParams(searchParams);
    // Collapse back down to just the newly-picked category, hiding the rest again.
    setShowAllCategories(false);
  };

  const toggleKeyFeatureValue = (groupId: string, value: string) => {
    const group = selectedKeyFeatures.find((kf) => kf.id === groupId);
    let next: KeyFeatureFilterSelection[];

    if (!group) {
      next = [...selectedKeyFeatures, { id: groupId, values: [value] }];
    } else {
      const updatedValues = group.values.includes(value)
        ? group.values.filter((v) => v !== value)
        : [...group.values, value];
      next = updatedValues.length > 0
        ? selectedKeyFeatures.map((kf) => (kf.id === groupId ? { ...kf, values: updatedValues } : kf))
        : selectedKeyFeatures.filter((kf) => kf.id !== groupId);
    }

    if (next.length > 0) {
      searchParams.set('key_features', JSON.stringify(next));
    } else {
      searchParams.delete('key_features');
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

      <main className="pt-12 pb-16">
        <div className="container mx-auto px-4">
          {/* Header — a category with an admin-configured hero gets the full
              banner; every other view keeps the plain heading, now aware of
              which category (if any) is active. */}
          <GSAPScrollReveal animation="fadeUp">
            {activeCategoryObj && hasCategoryHero ? (
              <CategoryHeroBanner category={activeCategoryObj} />
            ) : (
              <div className="text-center mb-12">
                <h1 className="font-orbitron text-4xl md:text-5xl font-bold uppercase text-foreground mb-4">
                  {activeCategoryObj ? (
                    <>{activeCategoryObj.category_name} <span className="text-primary">Products</span></>
                  ) : (
                    <>All <span className="text-primary">Products</span></>
                  )}
                </h1>
                <p className="text-muted-foreground text-lg">
                  {pagination?.total ?? products.length} products available
                </p>
              </div>
            )}
          </GSAPScrollReveal>

          {activeCategoryObj && hasCategoryHero && (
            <p className="mb-12 text-center text-muted-foreground text-lg">
              {pagination?.total ?? products.length} products available
            </p>
          )}

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Filters */}
            <AnimatePresence>
              {(isFilterOpen || window.innerWidth >= 1024) && (
                <motion.aside
                  initial={{ x: -300, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -300, opacity: 0 }}
                  className={cn(
                    "w-[85vw] max-w-sm lg:w-64 lg:max-w-none flex-shrink-0",
                    "fixed lg:static inset-y-0 left-0 z-[60] lg:z-0",
                    "bg-card lg:bg-transparent p-6 lg:p-0",
                    "overflow-y-auto shadow-2xl lg:shadow-none",
                    "border-r border-border lg:border-0"
                  )}
                >
                  <div className="sticky -top-6 z-10 -mx-6 mb-6 flex items-center justify-between border-b border-border bg-card px-6 py-4 lg:hidden">
                    <h3 className="font-orbitron text-lg font-bold">Filters</h3>
                    <button onClick={() => setIsFilterOpen(false)} aria-label="Close filters">
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Categories — collapsed to just "All" + whichever one is selected,
                      instead of dumping the entire list open at once. */}
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

                      {!showAllCategories && activeCategoryObj && (
                        <motion.button
                          key={activeCategoryObj.id}
                          onClick={() => handleCategoryChange(activeCategoryObj.id)}
                          className="w-full text-left px-4 py-3 rounded-lg font-rajdhani bg-primary text-primary-foreground"
                        >
                          {activeCategoryObj.category_name}
                        </motion.button>
                      )}

                      <AnimatePresence initial={false}>
                        {showAllCategories && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-2 overflow-hidden"
                          >
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
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {categories.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowAllCategories((prev) => !prev)}
                          className="flex w-full items-center justify-center gap-1.5 px-4 py-2 text-sm font-rajdhani font-semibold text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showAllCategories ? 'Show Less' : 'Show All Categories'}
                          <ChevronDown className={cn("w-4 h-4 transition-transform", showAllCategories && "rotate-180")} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Vendors — scoped to the active category once one is selected, so the
                      dropdown never offers a brand with zero products here (e.g. no NVIDIA
                      under Ram). Falls back to every vendor storewide for "All". */}
                  {(() => {
                    const vendorOptions = activeCategoryId ? (categoryVendors ?? []) : vendors;
                    return vendorOptions.length > 0 && (
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
                          {vendorOptions.map((vendor) => (
                            <option key={vendor.id} value={vendor.id}>
                              {vendor.vendor_name}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })()}

                  {/* Specifications — dynamic per category: whichever Key
                      Features + values the admin has actually set on this
                      category's published products. */}
                  {categoryFilters.length > 0 && (
                    <div className="mb-8">
                      <h4 className="font-orbitron text-sm font-bold text-primary uppercase tracking-wider mb-4">
                        Specifications
                      </h4>
                      <div className="space-y-5">
                        {categoryFilters.map((group) => (
                          <div key={group.id}>
                            <h5 className="mb-2 font-rajdhani text-sm font-semibold text-foreground">
                              {group.feature_key}
                            </h5>
                            <div className="space-y-1.5">
                              {group.values.map((value) => {
                                const isChecked = selectedKeyFeatures.some(
                                  (kf) => kf.id === group.id && kf.values.includes(value)
                                );
                                return (
                                  <label
                                    key={value}
                                    className="flex cursor-pointer items-center gap-2 font-rajdhani text-sm text-muted-foreground transition-colors hover:text-foreground"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => toggleKeyFeatureValue(group.id, value)}
                                      className="h-4 w-4 rounded border-border text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                    {value}
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
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
                className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[55] lg:hidden"
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
                  "grid gap-3 sm:gap-6",
                  viewMode === 'grid'
                    ? "grid-cols-2 xl:grid-cols-3"
                    : "grid-cols-1"
                )}
              >
                <AnimatePresence mode="popLayout">
                  {products.map((product, index) => (
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
                <Loader label="Loading products..." />
              ) : products.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-muted-foreground text-lg">No products found</p>
                </div>
              ) : null}

              {!isLoading && pagination && pagination.totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={cn(
                      "flex items-center gap-1 px-4 py-2 rounded-lg border border-border transition-colors font-rajdhani",
                      currentPage === 1
                        ? "opacity-40 cursor-not-allowed"
                        : "hover:bg-muted text-foreground"
                    )}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                      .filter(
                        (page) =>
                          page === 1 ||
                          page === pagination.totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                      )
                      .map((page, i, arr) => (
                        <React.Fragment key={page}>
                          {i > 0 && page - arr[i - 1] > 1 && (
                            <span className="px-2 text-muted-foreground">...</span>
                          )}
                          <button
                            onClick={() => setCurrentPage(page)}
                            className={cn(
                              "w-10 h-10 rounded-lg border transition-colors font-rajdhani",
                              currentPage === page
                                ? "bg-primary text-primary-foreground border-primary"
                                : "border-border hover:bg-muted text-foreground"
                            )}
                          >
                            {page}
                          </button>
                        </React.Fragment>
                      ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(pagination.totalPages, prev + 1))}
                    disabled={currentPage === pagination.totalPages}
                    className={cn(
                      "flex items-center gap-1 px-4 py-2 rounded-lg border border-border transition-colors font-rajdhani",
                      currentPage === pagination.totalPages
                        ? "opacity-40 cursor-not-allowed"
                        : "hover:bg-muted text-foreground"
                    )}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </motion.div>
  );
};

export default ProductsPage;
