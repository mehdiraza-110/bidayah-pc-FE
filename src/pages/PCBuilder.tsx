import React, { useState, useEffect, useRef } from 'react';
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
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { CyberButton } from '@/components/ui/CyberButton';
import { NeonCard } from '@/components/ui/NeonCard';
import {
  getPublicPCBuilderOptions,
  getPublicPCBuilderProducts,
  type Category,
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
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Record<string, ApiProduct | null>>({});
  const [selectedVendors, setSelectedVendors] = useState<Record<string, Vendor | null>>({});
  const [activeCategoryId, setActiveCategoryId] = useState('');
  const [isOptionsLoading, setIsOptionsLoading] = useState(true);
  const [isProductsLoading, setIsProductsLoading] = useState(false);
  const [optionsError, setOptionsError] = useState('');
  const [productsError, setProductsError] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

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
        setVendors(response.data.vendors || []);
        setActiveCategoryId(response.data.categories?.[0]?.id || '');
      } else {
        setOptionsError(response.message || 'Failed to load builder options.');
      }

      setIsOptionsLoading(false);
    };

    loadOptions();
  }, []);

  const activeCategory = categories.find(category => category.id === activeCategoryId);
  const selectedActiveVendor = selectedVendors[activeCategoryId];

  useEffect(() => {
    const loadProducts = async () => {
      if (!activeCategoryId || !selectedVendors[activeCategoryId]) {
        setProducts([]);
        setProductsError('');
        return;
      }

      setIsProductsLoading(true);
      setProductsError('');

      const response = await getPublicPCBuilderProducts({
        selected_category_id: activeCategoryId,
        selected_vendor_id: selectedVendors[activeCategoryId]?.id,
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
  }, [activeCategoryId, selectedVendors]);

  const handleSelectProduct = (product: ApiProduct) => {
    const categoryId = product.category_id || activeCategoryId;

    setSelectedProducts(prev => ({
      ...prev,
      [categoryId]: product,
    }));
  };

  const handleSelectVendor = (vendor: Vendor) => {
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
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Component Selection */}
            <div className="lg:col-span-2 space-y-6">
              {/* Category Tabs */}
              <NeonCard className="p-4" glowColor="cyan" hover={false}>
                {isOptionsLoading ? (
                  <div className="text-sm text-muted-foreground">Loading builder options...</div>
                ) : optionsError ? (
                  <div className="text-sm text-destructive">{optionsError}</div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => {
                      const Icon = getCategoryIcon(category.category_name);
                      const isSelected = selectedProducts[category.id] !== null && selectedProducts[category.id] !== undefined;
                      const isActive = activeCategoryId === category.id;

                      return (
                        <motion.button
                          key={category.id}
                          onClick={() => setActiveCategoryId(category.id)}
                          className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all",
                            isActive
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border hover:border-primary/50 text-foreground/70 hover:text-foreground",
                            isSelected && "ring-2 ring-accent/50"
                          )}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="font-rajdhani font-semibold">{category.category_name}</span>
                          {isSelected && (
                            <Check className="w-4 h-4 text-accent" />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </NeonCard>

              {/* Vendor Selection */}
              <NeonCard className="p-6" glowColor="green" hover={false}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <Settings className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h2 className="font-orbitron text-xl font-bold">
                      SELECT {activeCategory?.category_name || 'CATEGORY'} VENDOR
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Choose a vendor before selecting your {activeCategory?.category_name || 'product'}.
                    </p>
                  </div>
                </div>

                {vendors.length === 0 ? (
                  <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
                    No vendors are available.
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {vendors.map((vendor) => {
                      const isSelected = selectedActiveVendor?.id === vendor.id;

                      return (
                        <motion.button
                          key={vendor.id}
                          type="button"
                          onClick={() => handleSelectVendor(vendor)}
                          className={cn(
                            "flex items-center justify-between rounded-lg border-2 p-4 text-left transition-all",
                            isSelected
                              ? "border-accent bg-accent/10 text-accent"
                              : "border-border hover:border-accent/60 hover:bg-muted/30"
                          )}
                          whileTap={{ scale: 0.98 }}
                        >
                          <span className="font-rajdhani font-semibold">{vendor.vendor_name}</span>
                          {isSelected && <Check className="w-4 h-4" />}
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </NeonCard>

              {/* Component List */}
              <NeonCard className="p-6" glowColor="purple" hover={false}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    {React.createElement(getCategoryIcon(activeCategory?.category_name || ''), {
                      className: 'w-5 h-5 text-primary',
                    })}
                  </div>
                  <h2 className="font-orbitron text-xl font-bold">
                    SELECT {activeCategory?.category_name || 'PRODUCT'}
                  </h2>
                </div>

                {isProductsLoading ? (
                  <div className="rounded-lg border border-border bg-muted/20 p-6 text-sm text-muted-foreground">
                    Loading products...
                  </div>
                ) : productsError ? (
                  <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive">
                    {productsError}
                  </div>
                ) : !selectedActiveVendor ? (
                  <div className="rounded-lg border border-border bg-muted/20 p-6 text-sm text-muted-foreground">
                    Select a vendor to load products for this category.
                  </div>
                ) : products.length === 0 ? (
                  <div className="rounded-lg border border-border bg-muted/20 p-6 text-sm text-muted-foreground">
                    No products found for this category and vendor selection.
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    <AnimatePresence mode="wait">
                      {products.map((product, index) => {
                        const productCategoryId = product.category_id || activeCategoryId;
                        const isSelected = selectedProducts[productCategoryId]?.id === product.id;
                        const specs = product.specs?.map(spec => spec.spec_text) || [];

                        return (
                          <motion.div
                            key={product.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => handleSelectProduct(product)}
                            className={cn(
                              "relative p-4 rounded-lg border-2 cursor-pointer transition-all group",
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

                            <div className="flex gap-4">
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-20 h-20 object-cover rounded-lg"
                              />
                              <div className="flex-1 min-w-0">
                                <h3 className="font-rajdhani font-semibold text-sm mb-1 truncate">
                                  {product.name}
                                </h3>
                                <div className="space-y-1 mb-2">
                                  {specs.slice(0, 2).map((spec, i) => (
                                    <p key={i} className="text-xs text-muted-foreground">
                                      {spec}
                                    </p>
                                  ))}
                                  {specs.length === 0 && (
                                    <p className="text-xs text-muted-foreground">
                                      {product.category_name || activeCategory?.category_name}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-primary font-orbitron text-lg font-bold">
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
                    </AnimatePresence>
                  </div>
                )}
              </NeonCard>
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
