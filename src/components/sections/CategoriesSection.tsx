import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getPublicCategories, getPublicProducts, type Category } from '@/services/api';
import { toast } from 'sonner';

gsap.registerPlugin(ScrollTrigger);

interface CategoryWithCount extends Category {
  productCount?: number;
}

const CategoriesSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load categories from public API
  useEffect(() => {
    const loadCategories = async () => {
      setIsLoading(true);
      try {
        const response = await getPublicCategories();
        if (response.success && response.data) {
          // Load product count for each category
          const categoriesWithCounts = await Promise.all(
            response.data.map(async (category) => {
              const productsResponse = await getPublicProducts({
                category_id: category.id,
              });
              return {
                ...category,
                productCount: productsResponse.success && productsResponse.data
                  ? productsResponse.data.length
                  : 0,
              };
            })
          );
          setCategories(categoriesWithCounts);
        } else {
          console.error('Failed to load categories:', response.message);
        }
      } catch (error) {
        console.error('Error loading categories:', error);
        toast.error('Failed to load categories');
      } finally {
        setIsLoading(false);
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    if (!containerRef.current || categories.length === 0) return;

    const cards = containerRef.current.querySelectorAll('.category-card');

    const ctx = gsap.context(() => {
      cards.forEach((card, i) => {
        gsap.fromTo(card,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 85%',
              toggleActions: 'play none none none',
            },
          }
        );
      });
    }, containerRef);

    return () => ctx.revert();
  }, [categories]);

  const scroll = (direction: 'left' | 'right') => {
    if (!carouselRef.current) return;
    // Calculate scroll amount: card width (300px) + gap (24px) = 324px per card
    // Scroll by 4 cards at a time (4 visible items)
    const cardWidth = 300;
    const gap = 24;
    const scrollAmount = (cardWidth + gap) * 4;
    carouselRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  if (isLoading) {
    return (
      <section className="py-24 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-muted-foreground">Loading categories...</p>
          </div>
        </div>
      </section>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <section ref={containerRef} className="py-24 bg-card/50">
      <style>{`
        .categories-carousel::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-orbitron text-4xl md:text-5xl font-bold text-foreground mb-4">
            SHOP BY <span className="text-primary">CATEGORY</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Find exactly what you need for your setup
          </p>
        </motion.div>

        {/* Carousel Container */}
        <div className="relative">
          {/* Navigation buttons */}
          {categories.length > 4 && (
            <div className="absolute -top-16 right-0 flex gap-2 z-10">
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
          )}

          {/* Carousel */}
          <motion.div
            ref={carouselRef}
            className="categories-carousel flex gap-6 overflow-x-auto pb-4"
            style={{ 
              scrollbarWidth: 'none', 
              msOverflowStyle: 'none'
            }}
            drag="x"
            dragConstraints={{ left: -1000, right: 0 }}
          >
            {categories.map((category, index) => {
              const colors = ['cyan', 'purple', 'green', 'cyan'];
              const color = colors[index % colors.length];
              
              return (
                <Link
                  key={category.id}
                  to={`/products?category_id=${category.id}`}
                  className="flex-shrink-0 w-[300px]"
                >
                  <motion.div
                    className="category-card group relative h-80 rounded-xl overflow-hidden cursor-pointer"
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    {/* Background image */}
                    {category.image ? (
                      <img
                        src={category.image}
                        alt={category.category_name}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20" />
                    )}
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                    
                    {/* Border glow on hover */}
                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 border-2 rounded-xl ${
                      color === 'cyan' ? 'border-primary shadow-[inset_0_0_30px_hsl(var(--neon-cyan)/0.3)]' :
                      color === 'purple' ? 'border-secondary shadow-[inset_0_0_30px_hsl(var(--neon-purple)/0.3)]' :
                      'border-accent shadow-[inset_0_0_30px_hsl(var(--neon-green)/0.3)]'
                    }`} />
                    
                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${
                        color === 'cyan' ? 'bg-primary/20' :
                        color === 'purple' ? 'bg-secondary/20' :
                        'bg-accent/20'
                      }`}>
                        <span className={`text-2xl ${
                          color === 'cyan' ? 'text-primary' :
                          color === 'purple' ? 'text-secondary' :
                          'text-accent'
                        }`}>
                          {category.category_name.charAt(0)}
                        </span>
                      </div>
                      
                      <h3 className="font-orbitron text-2xl font-bold text-foreground mb-1">
                        {category.category_name}
                      </h3>
                      <p className="text-muted-foreground text-sm font-mono-tech">
                        {category.productCount || 0} Products
                      </p>
                    </div>

                    {/* Hover indicator */}
                    <motion.div
                      className="absolute top-4 right-4 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      whileHover={{ scale: 1.1 }}
                    >
                      <span className="text-primary">→</span>
                    </motion.div>
                  </motion.div>
                </Link>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;
