import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '@/data/products';
import { ProductCard } from './ProductCard';

interface ProductCarouselProps {
  products: Product[];
  title?: string;
}

const ProductCarousel: React.FC<ProductCarouselProps> = ({ products, title }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!containerRef.current) return;
    const scrollAmount = 350;
    containerRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <div className="relative">
      {title && (
        <h2 className="font-orbitron text-3xl font-bold mb-8 text-foreground">
          {title}
        </h2>
      )}

      {/* Navigation buttons */}
      <div className="absolute -top-4 right-0 flex gap-2 z-10">
        <motion.button
          onClick={() => scroll('left')}
          className="w-12 h-12 rounded-lg bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-all"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ChevronLeft className="w-6 h-6" />
        </motion.button>
        <motion.button
          onClick={() => scroll('right')}
          className="w-12 h-12 rounded-lg bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-all"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ChevronRight className="w-6 h-6" />
        </motion.button>
      </div>

      {/* Carousel */}
      <motion.div
        ref={containerRef}
        className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide cursor-grab active:cursor-grabbing"
        drag="x"
        dragConstraints={{ left: -1000, right: 0 }}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map((product, index) => (
          <div key={product.id} className="flex-shrink-0 w-[300px]">
            <ProductCard product={product} index={index} />
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export { ProductCarousel };
