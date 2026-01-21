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
import { pcComponents, componentCategories, ComponentCategory, PCComponent } from '@/data/pcComponents';
import { useCartStore } from '@/store/cartStore';
import { cn } from '@/lib/utils';

const categoryIcons = {
  CPU: Cpu,
  GPU: Monitor,
  Motherboard: Settings,
  RAM: Zap,
  Storage: HardDrive,
  PSU: Zap,
  Case: Box,
  Cooling: Wind,
};

const PCBuilderPage: React.FC = () => {
  const navigate = useNavigate();
  const { addItem } = useCartStore();
  const [selectedComponents, setSelectedComponents] = useState<Record<ComponentCategory, PCComponent | null>>({
    CPU: null,
    GPU: null,
    Motherboard: null,
    RAM: null,
    Storage: null,
    PSU: null,
    Case: null,
    Cooling: null,
  });
  const [activeCategory, setActiveCategory] = useState<ComponentCategory>('CPU');
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

  const handleSelectComponent = (component: PCComponent) => {
    setSelectedComponents(prev => ({
      ...prev,
      [component.category]: component,
    }));
  };

  const handleRemoveComponent = (category: ComponentCategory) => {
    setSelectedComponents(prev => ({
      ...prev,
      [category]: null,
    }));
  };

  const getTotalPrice = () => {
    return Object.values(selectedComponents).reduce((total, component) => {
      return total + (component?.price || 0);
    }, 0);
  };

  const isBuildComplete = () => {
    return Object.values(selectedComponents).every(component => component !== null);
  };

  const handleAddToCart = () => {
    const components = Object.values(selectedComponents).filter(Boolean) as PCComponent[];
    if (components.length === 0) return;

    // Create a custom build product
    const customBuild = {
      id: `custom-build-${Date.now()}`,
      name: 'Custom PC Build',
      category: 'Gaming PC',
      price: getTotalPrice(),
      image: selectedComponents.Case?.image || 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=600',
      specs: components.map(c => c.name),
      rating: 5.0,
      reviews: 0,
      inStock: true,
      featured: false,
    };

    addItem(customBuild);
    navigate('/checkout');
  };

  const currentComponents = pcComponents[activeCategory];
  const totalPrice = getTotalPrice();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-background"
      ref={containerRef}
    >
      <Navbar />

      <main className="pt-28 pb-16">
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
              <NeonCard className="p-4" glowColor="cyan">
                <div className="flex flex-wrap gap-2">
                  {componentCategories.map((category) => {
                    const Icon = categoryIcons[category];
                    const isSelected = selectedComponents[category] !== null;
                    const isActive = activeCategory === category;

                    return (
                      <motion.button
                        key={category}
                        onClick={() => setActiveCategory(category)}
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
                        <span className="font-rajdhani font-semibold">{category}</span>
                        {isSelected && (
                          <Check className="w-4 h-4 text-accent" />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </NeonCard>

              {/* Component List */}
              <NeonCard className="p-6" glowColor="purple">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    {React.createElement(categoryIcons[activeCategory], {
                      className: 'w-5 h-5 text-primary',
                    })}
                  </div>
                  <h2 className="font-orbitron text-xl font-bold">
                    SELECT {activeCategory}
                  </h2>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <AnimatePresence mode="wait">
                    {currentComponents.map((component, index) => {
                      const isSelected = selectedComponents[activeCategory]?.id === component.id;

                      return (
                        <motion.div
                          key={component.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => handleSelectComponent(component)}
                          className={cn(
                            "relative p-4 rounded-lg border-2 cursor-pointer transition-all group",
                            isSelected
                              ? "border-primary bg-primary/10 shadow-[0_0_20px_hsl(var(--neon-cyan)/0.3)]"
                              : "border-border hover:border-primary/50 hover:bg-muted/30"
                          )}
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                              <Check className="w-4 h-4 text-primary-foreground" />
                            </div>
                          )}

                          <div className="flex gap-4">
                            <img
                              src={component.image}
                              alt={component.name}
                              className="w-20 h-20 object-cover rounded-lg"
                            />
                            <div className="flex-1 min-w-0">
                              <h3 className="font-rajdhani font-semibold text-sm mb-1 truncate">
                                {component.name}
                              </h3>
                              <div className="space-y-1 mb-2">
                                {component.specs.slice(0, 2).map((spec, i) => (
                                  <p key={i} className="text-xs text-muted-foreground">
                                    {spec}
                                  </p>
                                ))}
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-primary font-orbitron text-lg font-bold">
                                  AED {component.price.toLocaleString()}
                                </span>
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-muted-foreground">
                                    {component.rating}★
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
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
                    {componentCategories.map((category) => {
                      const component = selectedComponents[category];
                      const Icon = categoryIcons[category];

                      if (!component) return null;

                      return (
                        <motion.div
                          key={category}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg group"
                        >
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Icon className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground mb-1">{category}</p>
                            <p className="font-rajdhani font-semibold text-sm truncate">
                              {component.name}
                            </p>
                            <p className="text-primary font-orbitron text-sm mt-1">
                              AED {component.price.toLocaleString()}
                            </p>
                          </div>
                          <motion.button
                            onClick={() => handleRemoveComponent(category)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-destructive hover:bg-destructive/20 rounded transition-all"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </motion.div>
                      );
                    })}

                    {Object.values(selectedComponents).every(c => c === null) && (
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
                            {componentCategories.filter(c => selectedComponents[c] === null).length} components remaining
                          </span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {isBuildComplete()
                        ? 'Your build is ready! Add to cart to proceed.'
                        : 'Select all components to complete your build.'}
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
                          setSelectedComponents({
                            CPU: null,
                            GPU: null,
                            Motherboard: null,
                            RAM: null,
                            Storage: null,
                            PSU: null,
                            Case: null,
                            Cooling: null,
                          });
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

