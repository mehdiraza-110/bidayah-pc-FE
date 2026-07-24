import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import {
  Cpu,
  Monitor,
  HardDrive,
  Zap,
  Box,
  Wind,
  Check,
  ShoppingCart,
  Trash2,
  AlertCircle,
  ArrowRight,
  Settings,
  ChevronDown,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { CyberButton } from '@/components/ui/CyberButton';
import { NeonCard } from '@/components/ui/NeonCard';
import {
  getPublicPCBuilderOptions,
  getPublicPCBuilderProducts,
  getPublicPCBuilderVendorsForCategory,
  type Category,
  type PCBuilderPriorSelection,
  type Product as ApiProduct,
  type Vendor,
} from '@/services/api';
import { useCartStore } from '@/store/cartStore';
import { cn } from '@/lib/utils';

const getCategoryIcon = (categoryName: string) => {
  const normalized = categoryName.toLowerCase();

  if (normalized.includes('cpu') || normalized.includes('processor')) return Cpu;
  if (normalized.includes('gpu') || normalized.includes('graphic')) return Monitor;
  if (normalized.includes('motherboard')) return Settings;
  if (normalized.includes('ram') || normalized.includes('memory')) return Zap;
  if (normalized.includes('storage') || normalized.includes('ssd') || normalized.includes('hard')) return HardDrive;
  if (normalized.includes('psu') || normalized.includes('power')) return Zap;
  if (normalized.includes('case') || normalized.includes('chassis')) return Box;
  if (normalized.includes('cool')) return Wind;

  return Settings;
};

const PCBuilderPage: React.FC = () => {
  const navigate = useNavigate();
  const { addItem } = useCartStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryVendors, setCategoryVendors] = useState<Vendor[]>([]);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Record<string, ApiProduct | null>>({});
  const [selectedVendors, setSelectedVendors] = useState<Record<string, Vendor | null>>({});
  const [activeCategoryId, setActiveCategoryId] = useState('');
  const [isOptionsLoading, setIsOptionsLoading] = useState(true);
  const [isVendorsLoading, setIsVendorsLoading] = useState(false);
  const [isProductsLoading, setIsProductsLoading] = useState(false);
  const [optionsError, setOptionsError] = useState('');
  const [vendorsError, setVendorsError] = useState('');
  const [productsError, setProductsError] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Other categories' chosen vendors, used to narrow this category's vendor/product list
  const getPriorSelections = useCallback(
    (excludeCategoryId: string): PCBuilderPriorSelection[] =>
      Object.entries(selectedVendors)
        .filter(([categoryId, vendor]) => categoryId !== excludeCategoryId && vendor)
        .map(([categoryId, vendor]) => ({ category_id: categoryId, vendor_id: vendor!.id })),
    [selectedVendors]
  );

  useEffect(() => {
    if (containerRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(containerRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }
        );
      });

      return () => ctx.revert();
    }
  }, []);

  useEffect(() => {
    const loadOptions = async () => {
      setIsOptionsLoading(true);
      setOptionsError('');
      const response = await getPublicPCBuilderOptions();

      if (response.success && response.data) {
        setCategories(response.data.categories || []);
        setActiveCategoryId(response.data.categories?.[0]?.id || '');
      } else {
        setOptionsError(response.message || 'Failed to load builder options.');
      }

      setIsOptionsLoading(false);
    };

    loadOptions();
  }, []);

  useEffect(() => {
    const loadVendors = async () => {
      if (!activeCategoryId) {
        setCategoryVendors([]);
        return;
      }

      setIsVendorsLoading(true);
      setVendorsError('');

      const response = await getPublicPCBuilderVendorsForCategory(activeCategoryId, getPriorSelections(activeCategoryId));

      if (response.success && response.data) {
        setCategoryVendors(response.data);
      } else {
        setCategoryVendors([]);
        setVendorsError(response.message || 'Failed to load vendors for this category.');
      }

      setIsVendorsLoading(false);
    };

    loadVendors();
  }, [activeCategoryId, selectedVendors, getPriorSelections]);

  useEffect(() => {
    const loadProducts = async () => {
      if (!activeCategoryId) {
        setProducts([]);
        setProductsError('');
        return;
      }

      setIsProductsLoading(true);
      setProductsError('');

      const response = await getPublicPCBuilderProducts({
        selected_category_id: activeCategoryId,
        selected_vendor_id: selectedVendors[activeCategoryId]?.id,
        prior_selections: getPriorSelections(activeCategoryId),
        in_stock: true,
      });

      if (response.success && response.data) {
        setProducts(response.data);
      } else {
        setProducts([]);
        setProductsError(response.message || 'Failed to load builder products.');
      }

      setIsProductsLoading(false);
    };

    loadProducts();
  }, [activeCategoryId, selectedVendors, getPriorSelections]);

  // Products can now be picked without choosing a vendor pill first; infer the
  // vendor from the product itself so the build summary and compatibility
  // engine still see it as a prior selection.
  const resolveProductVendor = (product: ApiProduct): Vendor | undefined => {
    const productWithVendors = product as ApiProduct & { vendors?: { id: string; vendor_name: string }[] };

    if (product.vendor_id && product.vendor_name) {
      return { id: product.vendor_id, vendor_name: product.vendor_name };
    }

    return productWithVendors.vendors?.[0];
  };

  const handleSelectProduct = (product: ApiProduct) => {
    const categoryId = product.category_id || activeCategoryId;

    setSelectedProducts(prev => ({
      ...prev,
      [categoryId]: product,
    }));

    if (!selectedVendors[categoryId]) {
      const inferredVendor = resolveProductVendor(product);
      if (inferredVendor) {
        setSelectedVendors(prev => ({
          ...prev,
          [categoryId]: inferredVendor,
        }));
      }
    }

    // Auto-advance the accordion to the next incomplete step
    const currentIndex = categories.findIndex(category => category.id === categoryId);
    const nextCategory = categories
      .slice(currentIndex + 1)
      .find(category => !selectedProducts[category.id]);

    setTimeout(() => {
      setActiveCategoryId(nextCategory ? nextCategory.id : '');
    }, 350);
  };

  const toggleStep = (categoryId: string) => {
    setActiveCategoryId(prev => (prev === categoryId ? '' : categoryId));
  };

  const handleSelectVendor = (vendor: Vendor | null) => {
    setSelectedVendors(prev => ({
      ...prev,
      [activeCategoryId]: vendor,
    }));
    setSelectedProducts(prev => ({
      ...prev,
      [activeCategoryId]: null,
    }));
  };

  const handleRemoveProduct = (categoryId: string) => {
    setSelectedProducts(prev => ({
      ...prev,
      [categoryId]: null,
    }));
  };

  const getTotalPrice = () => {
    return Object.values(selectedProducts).reduce((total, product) => {
      return total + Number(product?.price || 0);
    }, 0);
  };

  const isBuildComplete = () => {
    return categories.length > 0 && categories.every(category =>
      selectedProducts[category.id] !== null && selectedProducts[category.id] !== undefined
    );
  };

  const handleAddToCart = () => {
    const selectedItems = categories
      .map(category => selectedProducts[category.id])
      .filter(Boolean) as ApiProduct[];
    if (selectedItems.length === 0) return;

    const customBuild = {
      id: `custom-build-${Date.now()}`,
      name: 'Custom PC Build',
      category: 'Gaming PC',
      price: getTotalPrice(),
      image: selectedItems[0]?.image || 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=600',
      specs: selectedItems.map(product => {
        const categoryName = product.category_name || categories.find(category => category.id === product.category_id)?.category_name || 'Component';
        const vendor = selectedVendors[product.category_id || ''];
        return vendor ? `${categoryName}: ${product.name} (${vendor.vendor_name})` : `${categoryName}: ${product.name}`;
      }),
      rating: 5.0,
      reviews: 0,
      stock: 1,
      inStock: true,
      featured: false,
    };

    addItem(customBuild);
    navigate('/checkout');
  };

  const totalPrice = getTotalPrice();
  const productsRemaining = categories.filter(category => !selectedProducts[category.id]).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-background"
      ref={containerRef}
    >
      <Navbar />

      <main className="pt-12 pb-16">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-orbitron text-4xl md:text-5xl font-bold mb-2">
              BUILD YOUR <span className="text-primary">SYSTEM</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Select components and create your perfect gaming rig
            </p>

            {categories.length > 0 && (
              <div className="mt-5 flex items-center gap-3 max-w-xl">
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full bg-primary"
                    animate={{ width: `${((categories.length - productsRemaining) / categories.length) * 100}%` }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  />
                </div>
                <span className="text-sm text-muted-foreground font-mono-tech whitespace-nowrap">
                  {categories.length - productsRemaining}/{categories.length} steps
                </span>
              </div>
            )}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Step-by-step Component Selection */}
            <div className="lg:col-span-2 space-y-3">
              {isOptionsLoading ? (
                <NeonCard className="p-6" glowColor="cyan" hover={false}>
                  <div className="text-sm text-muted-foreground">Loading builder options...</div>
                </NeonCard>
              ) : optionsError ? (
                <NeonCard className="p-6" glowColor="cyan" hover={false}>
                  <div className="text-sm text-destructive">{optionsError}</div>
                </NeonCard>
              ) : (
                categories.map((category, categoryIndex) => {
                  const Icon = getCategoryIcon(category.category_name);
                  const selectedProduct = selectedProducts[category.id];
                  const selectedVendor = selectedVendors[category.id];
                  const isComplete = !!selectedProduct;
                  const isActive = activeCategoryId === category.id;

                  return (
                    <NeonCard
                      key={category.id}
                      className={cn(
                        "overflow-hidden transition-colors",
                        isActive && "border-primary/60"
                      )}
                      hover={false}
                    >
                      <button
                        type="button"
                        onClick={() => toggleStep(category.id)}
                        className="w-full flex items-center justify-between gap-3 p-4 sm:p-5 text-left"
                      >
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                          <div
                            className={cn(
                              "w-9 h-9 shrink-0 rounded-full flex items-center justify-center font-orbitron font-bold text-sm transition-colors",
                              isComplete
                                ? "bg-accent text-accent-foreground"
                                : isActive
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {isComplete ? <Check className="w-4 h-4" /> : categoryIndex + 1}
                          </div>
                          <Icon className="w-4 h-4 text-muted-foreground shrink-0 hidden sm:block" />
                          <div className="min-w-0">
                            <p className="font-orbitron font-bold text-sm sm:text-base uppercase tracking-wide">
                              {category.category_name}
                            </p>
                            {selectedProduct ? (
                              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                                {selectedVendor && `${selectedVendor.vendor_name} · `}{selectedProduct.name}
                              </p>
                            ) : (
                              <p className="text-xs sm:text-sm text-muted-foreground">Not selected yet</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                          {selectedProduct && (
                            <span className="hidden sm:block text-primary font-orbitron font-bold text-sm">
                              AED {Number(selectedProduct.price).toLocaleString()}
                            </span>
                          )}
                          <ChevronDown
                            className={cn(
                              "w-5 h-5 text-muted-foreground transition-transform duration-300",
                              isActive && "rotate-180"
                            )}
                          />
                        </div>
                      </button>

                      <AnimatePresence initial={false}>
                        {isActive && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-border">
                              {/* Vendor pills */}
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-4 mb-2">
                                Filter by vendor (optional)
                              </p>
                              {isVendorsLoading ? (
                                <div className="rounded-lg border border-border bg-muted/20 p-3 text-sm text-muted-foreground">
                                  Loading vendors...
                                </div>
                              ) : vendorsError ? (
                                <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                                  {vendorsError}
                                </div>
                              ) : categoryVendors.length === 0 ? (
                                <div className="rounded-lg border border-border bg-muted/20 p-3 text-sm text-muted-foreground">
                                  No vendors are available.
                                </div>
                              ) : (
                                <div className="flex flex-wrap gap-2 mb-5">
                                  <motion.button
                                    type="button"
                                    onClick={() => handleSelectVendor(null)}
                                    className={cn(
                                      "px-3.5 py-1.5 rounded-full border text-xs sm:text-sm font-rajdhani font-semibold transition-all",
                                      !selectedVendor
                                        ? "border-accent bg-accent/10 text-accent"
                                        : "border-border text-foreground/70 hover:border-accent/60 hover:text-foreground"
                                    )}
                                    whileTap={{ scale: 0.96 }}
                                  >
                                    All vendors
                                  </motion.button>
                                  {categoryVendors.map((vendor) => {
                                    const isVendorSelected = selectedVendor?.id === vendor.id;

                                    return (
                                      <motion.button
                                        key={vendor.id}
                                        type="button"
                                        onClick={() => handleSelectVendor(vendor)}
                                        className={cn(
                                          "px-3.5 py-1.5 rounded-full border text-xs sm:text-sm font-rajdhani font-semibold transition-all",
                                          isVendorSelected
                                            ? "border-accent bg-accent/10 text-accent"
                                            : "border-border text-foreground/70 hover:border-accent/60 hover:text-foreground"
                                        )}
                                        whileTap={{ scale: 0.96 }}
                                      >
                                        {vendor.vendor_name}
                                      </motion.button>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Products for this category, optionally filtered by vendor */}
                              {isProductsLoading ? (
                                <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
                                  Loading products...
                                </div>
                              ) : productsError ? (
                                <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                                  {productsError}
                                </div>
                              ) : products.length === 0 ? (
                                <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
                                  No products found for this category{selectedVendor ? ' and vendor selection' : ''}.
                                </div>
                              ) : (
                                <div className="grid sm:grid-cols-2 gap-3">
                                  {products.map((product, index) => {
                                    const productCategoryId = product.category_id || activeCategoryId;
                                    const isSelected = selectedProducts[productCategoryId]?.id === product.id;
                                    const specs = product.specs?.map(spec => spec.spec_text) || [];

                                    return (
                                      <motion.div
                                        key={product.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.04 }}
                                        onClick={() => handleSelectProduct(product)}
                                        className={cn(
                                          "relative p-3 rounded-lg border-2 cursor-pointer transition-all group",
                                          isSelected
                                            ? "border-primary bg-primary/10 shadow-[0_0_20px_hsl(var(--neon-cyan)/0.3)]"
                                            : "border-border hover:border-primary/50 hover:bg-muted/30"
                                        )}
                                        whileTap={{ scale: 0.98 }}
                                      >
                                        {isSelected && (
                                          <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                                            <Check className="w-4 h-4 text-primary-foreground" />
                                          </div>
                                        )}

                                        <div className="flex gap-3">
                                          <img
                                            src={product.image}
                                            alt={product.name}
                                            className="w-16 h-16 object-cover rounded-lg shrink-0"
                                          />
                                          <div className="flex-1 min-w-0">
                                            <h3 className="font-rajdhani font-semibold text-sm mb-1 truncate pr-6">
                                              {product.name}
                                            </h3>
                                            <div className="space-y-0.5 mb-1.5">
                                              {specs.slice(0, 2).map((spec, i) => (
                                                <p key={i} className="text-xs text-muted-foreground truncate">
                                                  {spec}
                                                </p>
                                              ))}
                                              {specs.length === 0 && (
                                                <p className="text-xs text-muted-foreground">
                                                  {product.category_name || category.category_name}
                                                </p>
                                              )}
                                            </div>
                                            <div className="flex items-center justify-between">
                                              <span className="text-primary font-orbitron text-sm font-bold">
                                                AED {Number(product.price).toLocaleString()}
                                              </span>
                                              {product.in_stock !== undefined && (
                                                <span className="text-xs text-muted-foreground">
                                                  {product.in_stock ? 'In stock' : 'Out of stock'}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </motion.div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </NeonCard>
                  );
                })
              )}
            </div>

            {/* Right Column - Build Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-32">
                <NeonCard className="p-6 bg-card/95 border-border" glowColor="cyan" hover={false}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Settings className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="font-orbitron text-xl font-bold">BUILD SUMMARY</h2>
                  </div>

                  {/* Selected Components */}
                  <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
                    {categories.map((category) => {
                      const product = selectedProducts[category.id];
                      const vendor = selectedVendors[category.id];
                      const Icon = getCategoryIcon(category.category_name);

                      if (!product) return null;

                      return (
                        <motion.div
                          key={category.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg group"
                        >
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Icon className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground mb-1">{category.category_name}</p>
                            <p className="font-rajdhani font-semibold text-sm truncate">
                              {product.name}
                            </p>
                            {vendor && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Vendor: {vendor.vendor_name}
                              </p>
                            )}
                            <p className="text-primary font-orbitron text-sm mt-1">
                              AED {Number(product.price).toLocaleString()}
                            </p>
                          </div>
                          <motion.button
                            onClick={() => handleRemoveProduct(category.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-destructive hover:bg-destructive/20 rounded transition-all"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </motion.div>
                      );
                    })}

                    {Object.values(selectedProducts).every(product => !product) && (
                      <div className="text-center py-8 text-muted-foreground">
                        <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No components selected</p>
                        <p className="text-xs">Start building your system!</p>
                      </div>
                    )}
                  </div>

                  {/* Price Breakdown */}
                  <div className="space-y-3 pt-6 border-t border-border">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-mono-tech">AED {totalPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Assembly</span>
                      <span className="font-mono-tech text-accent">FREE</span>
                    </div>
                    <div className="flex justify-between pt-3 border-t border-border">
                      <span className="font-orbitron text-lg font-bold">Total</span>
                      <span className="font-orbitron text-2xl font-bold text-primary">
                        AED {totalPrice.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Build Status */}
                  <div className="mt-6 p-4 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2 mb-2">
                      {isBuildComplete() ? (
                        <>
                          <Check className="w-5 h-5 text-accent" />
                          <span className="text-sm font-semibold text-accent">
                            Build Complete
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-5 h-5 text-muted-foreground" />
                          <span className="text-sm font-semibold text-muted-foreground">
                            {productsRemaining} components remaining
                          </span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {isBuildComplete()
                        ? 'Your build is ready! Add to cart to proceed.'
                        : 'Select all components and vendors to complete your build.'}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 space-y-3">
                    <CyberButton
                      size="lg"
                      className="w-full"
                      onClick={handleAddToCart}
                      disabled={totalPrice === 0}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      ADD TO CART
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </CyberButton>

                    {totalPrice > 0 && (
                      <CyberButton
                        variant="outline"
                        size="lg"
                        className="w-full"
                        onClick={() => {
                          setSelectedProducts({});
                          setSelectedVendors({});
                        }}
                      >
                        CLEAR BUILD
                      </CyberButton>
                    )}
                  </div>

                  {/* Info */}
                  <p className="text-xs text-center text-muted-foreground mt-4">
                    All components are tested and compatible
                  </p>
                </NeonCard>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </motion.div>
  );
};

export default PCBuilderPage;
