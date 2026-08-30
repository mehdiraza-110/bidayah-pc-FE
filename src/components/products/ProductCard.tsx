import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Heart, Scale, Search, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Product } from '@/data/products';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useCompareStore, MAX_COMPARE_ITEMS } from '@/store/compareStore';
import { ProductQuickView } from '@/components/products/ProductQuickView';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { productUrl } from '@/lib/slug';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  index?: number;
}

// How often the image swaps while a card is hovered.
const HOVER_CYCLE_MS = 2200;

const ProductCard: React.FC<ProductCardProps> = ({ product, index = 0 }) => {
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const { addItem, openCart } = useCartStore();
  const isWishlisted = useWishlistStore((state) => state.isWishlisted(product.id));
  const toggleWishlist = useWishlistStore((state) => state.toggleItem);
  const isCompared = useCompareStore((state) => state.isCompared(product.id));
  const toggleCompare = useCompareStore((state) => state.toggleItem);

  // Main image first, then the rest of the gallery — de-duped in case the main
  // image is also listed in `media`.
  const galleryImages = useMemo(() => {
    const mediaImages = (product.media || [])
      .filter((item) => item.type === 'image')
      .map((item) => item.url);
    return Array.from(new Set([product.image, ...mediaImages].filter(Boolean)));
  }, [product.image, product.media]);

  useEffect(() => {
    if (!isHovered || galleryImages.length <= 1) {
      setImageIndex(0);
      return;
    }

    const timer = window.setInterval(() => {
      setImageIndex((prev) => (prev + 1) % galleryImages.length);
    }, HOVER_CYCLE_MS);

    return () => window.clearInterval(timer);
  }, [isHovered, galleryImages.length]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
    openCart();
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const added = toggleWishlist(product);
    toast.success(added ? 'Added to wishlist' : 'Removed from wishlist');
  };

  const handleToggleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const result = toggleCompare(product);
    if (result === 'added') toast.success('Added to compare');
    else if (result === 'removed') toast.success('Removed from compare');
    else toast.error(`You can compare up to ${MAX_COMPARE_ITEMS} products at a time`);
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsQuickViewOpen(true);
  };

  const actionButtons = [
    { icon: ShoppingCart, label: 'Add to cart', onClick: handleAddToCart, active: false },
    { icon: Search, label: 'Quick view', onClick: handleQuickView, active: false },
    { icon: Scale, label: 'Compare', onClick: handleToggleCompare, active: isCompared },
    { icon: Heart, label: 'Wishlist', onClick: handleToggleWishlist, active: isWishlisted },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
    >
      <Link to={productUrl(product)}>
        <div
          className="group relative bg-card border border-border rounded-xl overflow-hidden transition-all duration-300 hover:border-primary/50 hover:shadow-[0_0_30px_hsl(var(--primary)/0.15)]"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="relative bg-card rounded-xl overflow-hidden">
            {/* Badges */}
            <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10 flex gap-1.5 sm:gap-2">
              {product.featured && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-primary text-primary-foreground text-[10px] sm:text-xs font-orbitron font-bold rounded"
                >
                  FEATURED
                </motion.span>
              )}
              {product.new && (
                <span className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-accent text-accent-foreground text-[10px] sm:text-xs font-orbitron font-bold rounded">
                  NEW
                </span>
              )}
              {product.originalPrice && (
                <span className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-destructive text-destructive-foreground text-[10px] sm:text-xs font-orbitron font-bold rounded">
                  SALE
                </span>
              )}
            </div>

            {/* Hover action rail */}
            <div className="absolute top-3 right-3 z-10 flex flex-col gap-2 opacity-0 translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
              {actionButtons.map(({ icon: Icon, label, onClick, active }) => (
                <Tooltip key={label} delayDuration={150}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={onClick}
                      aria-label={label}
                      className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-full bg-black text-white shadow-lg transition-colors hover:bg-primary hover:text-primary-foreground',
                        active && 'bg-primary text-primary-foreground'
                      )}
                    >
                      <Icon className={cn('w-4 h-4', active && label === 'Wishlist' && 'fill-current')} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="bg-black/90 text-white border-none">
                    {label}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>

            {/* Image — cycles through the gallery while hovered */}
            <div className="relative aspect-square overflow-hidden bg-white p-2 sm:p-3">
              <motion.img
                key={galleryImages[imageIndex]}
                src={galleryImages[imageIndex] || product.image}
                alt={product.name}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25 }}
                className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
              />

              {/* Progress dots — one per gallery image, the active one fills up
                  over HOVER_CYCLE_MS in sync with the swap above (Instagram-
                  story style), so hovering shows how long until the next image. */}
              {galleryImages.length > 1 && (
                <div
                  className={cn(
                    'absolute bottom-1.5 sm:bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1 transition-opacity duration-300',
                    isHovered ? 'opacity-100' : 'opacity-0'
                  )}
                >
                  {galleryImages.map((_, dotIndex) => (
                    <span
                      key={dotIndex}
                      className="relative h-1 w-4 sm:w-5 overflow-hidden rounded-full bg-white/40"
                    >
                      <motion.span
                        className="absolute inset-y-0 left-0 rounded-full bg-primary"
                        initial={false}
                        animate={{
                          width: dotIndex < imageIndex || (dotIndex === imageIndex && isHovered) ? '100%' : '0%',
                        }}
                        transition={
                          dotIndex === imageIndex && isHovered
                            ? { duration: HOVER_CYCLE_MS / 1000, ease: 'linear' }
                            : { duration: 0.2 }
                        }
                      />
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-2.5 sm:p-3.5">
              <h3 className="font-orbitron font-bold text-xs sm:text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem]">
                {product.name}
              </h3>

              {product.vendorName && (
                <span className="text-xs text-muted-foreground mt-1 block">
                  {product.vendorName}
                </span>
              )}

              {/* Stock status */}
              {product.in_stock !== false && (
                <div className="mt-2">
                  <span className="flex items-center gap-1 text-xs font-semibold text-primary">
                    <Check className="w-3.5 h-3.5" />
                    In Stock
                  </span>
                </div>
              )}

              {/* Price or Out of Stock */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-2 sm:mt-3">
                {product.in_stock === false ? (
                  <span className="font-orbitron text-sm sm:text-lg font-bold text-destructive">
                    Out of Stock
                  </span>
                ) : (
                  <>
                    <span className="font-orbitron text-sm sm:text-xl font-bold text-primary">
                      AED {product.price.toLocaleString()}
                    </span>
                    {product.originalPrice && (
                      <span className="text-xs sm:text-sm text-muted-foreground line-through">
                        AED {product.originalPrice.toLocaleString()}
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>

      <ProductQuickView product={product} open={isQuickViewOpen} onOpenChange={setIsQuickViewOpen} />
    </motion.div>
  );
};

export { ProductCard };
