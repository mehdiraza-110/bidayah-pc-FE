import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ShoppingCart, Star, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Product } from '@/data/products';
import { useCartStore } from '@/store/cartStore';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  index?: number;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, index = 0 }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const { addItem, openCart } = useCartStore();
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);
  
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['7.5deg', '-7.5deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-7.5deg', '7.5deg']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
    openCart();
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
      className="perspective-1000"
    >
      <Link to={`/product/${product.id}`}>
        <div className="group relative bg-card border border-border rounded-xl overflow-hidden transition-all duration-300 hover:border-neon-cyan/50 hover:shadow-[0_0_30px_hsl(var(--neon-cyan)/0.2)]">
          {/* RGB Border Animation on Hover */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-green animate-rgb-rotate blur-sm" />
          </div>
          
          <div className="relative bg-card m-[1px] rounded-xl overflow-hidden">
            {/* Badges */}
            <div className="absolute top-3 left-3 z-10 flex gap-2">
              {product.featured && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="px-2 py-1 bg-primary text-primary-foreground text-xs font-orbitron font-bold rounded"
                >
                  FEATURED
                </motion.span>
              )}
              {product.new && (
                <span className="px-2 py-1 bg-neon-green text-primary-foreground text-xs font-orbitron font-bold rounded">
                  NEW
                </span>
              )}
              {product.originalPrice && (
                <span className="px-2 py-1 bg-destructive text-destructive-foreground text-xs font-orbitron font-bold rounded">
                  SALE
                </span>
              )}
            </div>

            {/* Image */}
            <div className="relative aspect-square overflow-hidden bg-muted">
              <motion.img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              {/* Quick add button - only show if in stock */}
              {product.in_stock !== false && (
                <motion.button
                  onClick={handleAddToCart}
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 px-6 py-3 bg-primary text-primary-foreground font-orbitron font-bold text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center gap-2 hover:bg-primary/90 shadow-[0_0_20px_hsl(var(--neon-cyan)/0.5)]"
                  initial={{ y: 20 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ShoppingCart className="w-4 h-4" />
                  ADD TO CART
                </motion.button>
              )}
            </div>

            {/* Content */}
            <div className="p-5">
              <span className="text-xs text-muted-foreground font-mono-tech uppercase tracking-wider">
                {product.category}
              </span>
              
              <h3 className="font-orbitron font-bold text-lg mt-1 text-foreground group-hover:text-primary transition-colors line-clamp-1">
                {product.name}
              </h3>
              
              {/* Rating */}
              <div className="flex items-center gap-1 mt-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "w-3 h-3",
                      i < Math.floor(product.rating)
                        ? "text-neon-orange fill-neon-orange"
                        : "text-muted-foreground"
                    )}
                  />
                ))}
                <span className="text-xs text-muted-foreground ml-1">
                  ({product.reviews})
                </span>
              </div>

              {/* Price or Out of Stock */}
              <div className="flex items-center gap-2 mt-3">
                {product.in_stock === false ? (
                  <span className="font-orbitron text-lg font-bold text-destructive">
                    Out of Stock
                  </span>
                ) : (
                  <>
                    <span className="font-orbitron text-xl font-bold text-primary">
                      AED {product.price.toLocaleString()}
                    </span>
                    {product.originalPrice && (
                      <span className="text-sm text-muted-foreground line-through">
                        AED {product.originalPrice.toLocaleString()}
                      </span>
                    )}
                  </>
                )}
              </div>

              {/* Specs preview */}
              <div className="flex flex-wrap gap-1 mt-3">
                {product.specs.slice(0, 2).map((spec, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export { ProductCard };
