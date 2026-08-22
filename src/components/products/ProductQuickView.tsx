import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, ChevronLeft, ChevronRight, CreditCard, ShoppingCart } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { CyberButton } from '@/components/ui/CyberButton';
import { Loader } from '@/components/ui/Loader';
import { Product } from '@/data/products';
import { getPublicProductById } from '@/services/api';
import { mapApiProductToLocal } from '@/lib/mapProduct';
import { useCartStore } from '@/store/cartStore';
import { productUrl } from '@/lib/slug';
import { cn } from '@/lib/utils';

const LOW_STOCK_THRESHOLD = 5;

interface ProductQuickViewProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProductQuickView: React.FC<ProductQuickViewProps> = ({ product, open, onOpenChange }) => {
  const navigate = useNavigate();
  const { addItem, openCart } = useCartStore();
  const [detail, setDetail] = useState<Product>(product);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    if (!open) return;

    setDetail(product);
    setSelectedImage(0);
    setIsLoading(true);

    let cancelled = false;
    getPublicProductById(product.id)
      .then((response) => {
        if (!cancelled && response.success && response.data) {
          setDetail(mapApiProductToLocal(response.data));
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, product]);

  const images = detail.media?.filter((m) => m.type === 'image').map((m) => m.url).length
    ? detail.media!.filter((m) => m.type === 'image').map((m) => m.url)
    : [detail.image];

  const showPrev = () => setSelectedImage((i) => (i - 1 + images.length) % images.length);
  const showNext = () => setSelectedImage((i) => (i + 1) % images.length);

  const handleAddToCart = () => {
    addItem(detail);
    openCart();
  };

  const handleBuyNow = () => {
    addItem(detail);
    onOpenChange(false);
    navigate('/checkout');
  };

  const stockNode = detail.in_stock === false ? (
    <span className="text-sm font-semibold text-destructive">Out of Stock</span>
  ) : detail.stock > 0 && detail.stock <= LOW_STOCK_THRESHOLD ? (
    <span className="inline-flex items-center gap-1 rounded border border-primary/40 px-2 py-1 text-xs font-semibold text-primary">
      Only {detail.stock} left in stock
    </span>
  ) : (
    <span className="flex items-center gap-1 text-sm font-semibold text-primary">
      <Check className="w-4 h-4" /> In Stock
    </span>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-hidden p-0 gap-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader label="Loading product..." />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 max-h-[90vh]">
            {/* Gallery */}
            <div className="flex flex-col gap-4 bg-muted/30 p-6 md:p-8">
              <div className="relative aspect-square overflow-hidden rounded-lg bg-white p-6">
                <motion.img
                  key={selectedImage}
                  src={images[selectedImage]}
                  alt={detail.name}
                  className="h-full w-full object-contain"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={showPrev}
                      aria-label="Previous image"
                      className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground shadow-md hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={showNext}
                      aria-label="Next image"
                      className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground shadow-md hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>

              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {images.map((img, i) => (
                    <button
                      key={img + i}
                      type="button"
                      onClick={() => setSelectedImage(i)}
                      className={cn(
                        'h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 bg-white p-1 transition-colors',
                        selectedImage === i ? 'border-primary' : 'border-border hover:border-primary/50'
                      )}
                    >
                      <img src={img} alt="" className="h-full w-full object-contain" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="overflow-y-auto p-6 md:p-8">
              <DialogTitle className="font-orbitron text-xl font-bold leading-snug text-foreground md:text-2xl">
                {detail.name}
              </DialogTitle>

              {detail.vendorName && (
                <p className="mt-1 text-sm text-muted-foreground">{detail.vendorName}</p>
              )}

              <div className="mt-4 flex items-baseline gap-3">
                {detail.in_stock === false ? (
                  <span className="font-orbitron text-2xl font-bold text-destructive">Out of Stock</span>
                ) : (
                  <>
                    <span className="font-orbitron text-2xl font-bold text-primary">
                      AED {detail.price.toLocaleString()}
                    </span>
                    {detail.originalPrice && (
                      <span className="text-base text-muted-foreground line-through">
                        AED {detail.originalPrice.toLocaleString()}
                      </span>
                    )}
                  </>
                )}
              </div>

              {detail.keyFeatures && detail.keyFeatures.length > 0 && (
                <ul className="mt-5 space-y-1.5 text-sm text-muted-foreground">
                  {detail.keyFeatures.map((feature) => (
                    <li key={feature.key} className="flex gap-1.5">
                      <span className="font-semibold text-foreground">{feature.key}:</span>
                      <span>{feature.value}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-5">{stockNode}</div>

              {detail.in_stock !== false && (
                <div className="mt-6 flex gap-3">
                  <CyberButton onClick={handleAddToCart} className="flex-1 gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    Add to Cart
                  </CyberButton>
                  <CyberButton variant="outline" onClick={handleBuyNow} className="flex-1 gap-2">
                    <CreditCard className="h-4 w-4" />
                    Buy Now
                  </CyberButton>
                </div>
              )}

              {detail.category && (
                <p className="mt-6 border-t border-border pt-4 text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">Category:</span> {detail.category}
                </p>
              )}

              <Link to={productUrl(detail)} onClick={() => onOpenChange(false)}>
                <CyberButton variant="ghost" className="mt-4 w-full">
                  View Full Details
                </CyberButton>
              </Link>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export { ProductQuickView };
