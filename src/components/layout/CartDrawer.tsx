import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { useNavigate } from 'react-router-dom';
import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { CyberButton } from '@/components/ui/CyberButton';

const CartDrawer: React.FC = () => {
  const { items, isOpen, closeCart, updateQuantity, removeItem, getTotalPrice } = useCartStore();
  const navigate = useNavigate();
  const drawerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && drawerRef.current) {
      gsap.fromTo(drawerRef.current,
        { x: '100%' },
        { x: 0, duration: 0.4, ease: 'power3.out' }
      );
    }
  }, [isOpen]);

  const handleClose = () => {
    if (drawerRef.current) {
      gsap.to(drawerRef.current, {
        x: '100%',
        duration: 0.3,
        ease: 'power3.in',
        onComplete: closeCart,
      });
    } else {
      closeCart();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            ref={overlayRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
          />

          {/* Drawer */}
          <div
            ref={drawerRef}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-card border-l border-neon-cyan/30 z-50 flex flex-col shadow-[0_0_50px_hsl(var(--neon-cyan)/0.2)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-6 h-6 text-primary" />
                <h2 className="font-orbitron text-xl font-bold">YOUR CART</h2>
              </div>
              <motion.button
                onClick={handleClose}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <X className="w-6 h-6" />
              </motion.button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <ShoppingBag className="w-16 h-16 mb-4 opacity-30" />
                  <p className="font-rajdhani text-lg">Your cart is empty</p>
                  <p className="text-sm">Add some gear to get started!</p>
                </div>
              ) : (
                <AnimatePresence>
                  {items.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -50, height: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex gap-4 p-4 bg-muted/30 rounded-lg border border-border hover:border-primary/30 transition-colors"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded-md"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-rajdhani font-semibold text-sm truncate">
                          {item.name}
                        </h3>
                        <p className="text-primary font-orbitron text-lg">
                          AED {item.price.toLocaleString()}
                        </p>
                        
                        {/* Quantity controls */}
                        <div className="flex items-center gap-2 mt-2">
                          <motion.button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-7 h-7 rounded bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-primary/20 transition-colors"
                            whileTap={{ scale: 0.9 }}
                          >
                            <Minus className="w-4 h-4" />
                          </motion.button>
                          <span className="font-mono-tech w-8 text-center">{item.quantity}</span>
                          <motion.button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-7 h-7 rounded bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-primary/20 transition-colors"
                            whileTap={{ scale: 0.9 }}
                          >
                            <Plus className="w-4 h-4" />
                          </motion.button>
                          <motion.button
                            onClick={() => removeItem(item.id)}
                            className="ml-auto w-7 h-7 rounded bg-destructive/20 flex items-center justify-center text-destructive hover:bg-destructive/30 transition-colors"
                            whileTap={{ scale: 0.9 }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-6 border-t border-border bg-background/50">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-orbitron text-2xl text-primary">
                    AED {getTotalPrice().toLocaleString()}
                  </span>
                </div>
                <CyberButton 
                  className="w-full" 
                  size="lg"
                  onClick={() => {
                    closeCart();
                    navigate('/checkout');
                  }}
                >
                  CHECKOUT
                </CyberButton>
                <p className="text-center text-xs text-muted-foreground mt-3">
                  Shipping calculated at checkout
                </p>
              </div>
            )}

            {/* Decorative glow */}
            <div className="absolute top-1/2 left-0 w-1 h-32 bg-gradient-to-b from-transparent via-neon-cyan to-transparent -translate-y-1/2 opacity-50" />
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
