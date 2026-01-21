import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { 
  ChevronLeft, 
  Star, 
  ShoppingCart, 
  Heart, 
  Share2, 
  Check, 
  Truck, 
  Shield, 
  RotateCcw,
  Minus,
  Plus
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import { CyberButton } from '@/components/ui/CyberButton';
import { NeonCard } from '@/components/ui/NeonCard';
import { Product } from '@/data/products';
import { getPublicProductById, getPublicProducts, type Product as ApiProduct } from '@/services/api';
import { useCartStore } from '@/store/cartStore';
import { ProductCarousel } from '@/components/products/ProductCarousel';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const { addItem, openCart } = useCartStore();
  const imageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Helper function to convert API Product to local Product format
  const mapApiProductToLocal = (apiProduct: ApiProduct): Product => {
    return {
      id: apiProduct.id,
      name: apiProduct.name,
      category: apiProduct.category_name || apiProduct.category_id || '',
      price: Number(apiProduct.price),
      originalPrice: apiProduct.original_price ? Number(apiProduct.original_price) : undefined,
      image: apiProduct.image,
      description: apiProduct.description,
      specs: apiProduct.specs?.map(s => s.spec_text) || [],
      rating: apiProduct.rating || 0,
      reviews: apiProduct.reviews_count || 0,
      stock: apiProduct.stock,
      in_stock: apiProduct.in_stock,
      vendor_id: apiProduct.vendor_id,
      status: apiProduct.status || 'published',
      featured: apiProduct.featured,
      new: apiProduct.new_product,
      media: apiProduct.media?.map(m => ({ url: m.url, type: m.type })) || [],
    };
  };

  // Load product and related products
  useEffect(() => {
    const loadProduct = async () => {
      if (!id) return;

      setIsLoading(true);
      try {
        // Load the product by ID
        const response = await getPublicProductById(id);
        if (response.success && response.data) {
          const mappedProduct = mapApiProductToLocal(response.data);
          setProduct(mappedProduct);
          setSelectedImage(0); // Reset to first image

          // Load related products from the same category
          if (response.data.category_id) {
            const relatedResponse = await getPublicProducts({
              category_id: response.data.category_id,
            });
            if (relatedResponse.success && relatedResponse.data) {
              const mappedRelated = relatedResponse.data
                .filter(p => p.id !== id)
                .slice(0, 4)
                .map(mapApiProductToLocal);
              setRelatedProducts(mappedRelated);
            }
          }
        } else {
          toast.error(response.message || 'Product not found');
        }
      } catch (error) {
        console.error('Error loading product:', error);
        toast.error('Failed to load product');
      } finally {
        setIsLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  useEffect(() => {
    if (!imageRef.current || !contentRef.current || !product) return;

    const ctx = gsap.context(() => {
      // Image zoom in animation
      gsap.fromTo(imageRef.current,
        { scale: 0.8, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.8, ease: 'power3.out' }
      );

      // Content stagger animation
      const elements = contentRef.current?.querySelectorAll('.animate-item');
      gsap.fromTo(elements,
        { x: 50, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out', delay: 0.3 }
      );
    });

    return () => ctx.revert();
  }, [product]);

  const handleAddToCart = () => {
    if (!product) return;
    for (let i = 0; i < quantity; i++) {
      addItem(product);
    }
    openCart();
  };

  // Get images from product media or use main image
  const getImages = () => {
    if (!product) return [];
    const mediaImages = product.media?.filter(m => m.type === 'image').map(m => m.url) || [];
    if (mediaImages.length > 0) {
      return mediaImages;
    }
    // Fallback to main image if no media
    return [product.image];
  };

  const images = product ? getImages() : [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-orbitron font-bold mb-4">Loading...</h1>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-orbitron font-bold mb-4">Product Not Found</h1>
          <Link to="/products" className="text-primary hover:underline">
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-background"
    >
      <Navbar />
      <CartDrawer />

      <main className="pt-28 pb-16">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-sm text-muted-foreground mb-8"
          >
            <Link to="/products" className="hover:text-primary transition-colors flex items-center gap-1">
              <ChevronLeft className="w-4 h-4" />
              Products
            </Link>
            <span>/</span>
            <span className="text-foreground">{product.name}</span>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Image Gallery */}
            <div ref={imageRef}>
              <NeonCard className="p-4 mb-4" glowColor="cyan">
                <div className="aspect-square overflow-hidden rounded-lg bg-muted">
                  {images.length > 0 && (
                    <motion.img
                      key={selectedImage}
                      src={images[selectedImage] || images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      initial={{ scale: 1.1, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    />
                  )}
                </div>
              </NeonCard>
              
              {/* Thumbnails */}
              <div className="flex gap-3">
                {images.map((img, i) => (
                  <motion.button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={cn(
                      "w-20 h-20 rounded-lg overflow-hidden border-2 transition-all",
                      selectedImage === i
                        ? "border-primary shadow-[0_0_15px_hsl(var(--neon-cyan)/0.5)]"
                        : "border-border hover:border-primary/50"
                    )}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Product Info */}
            <div ref={contentRef}>
              <div className="animate-item flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-mono-tech uppercase rounded">
                  {product.category}
                </span>
                {product.in_stock ? (
                  <span className="flex items-center gap-1 text-accent text-sm">
                    <Check className="w-4 h-4" /> In Stock
                  </span>
                ) : (
                  <span className="text-destructive text-sm">Out of Stock</span>
                )}
              </div>

              <h1 className="animate-item font-orbitron text-3xl md:text-4xl font-bold text-foreground mb-4">
                {product.name}
              </h1>

              {/* Rating */}
              <div className="animate-item flex items-center gap-2 mb-6">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "w-5 h-5",
                        i < Math.floor(product.rating)
                          ? "text-neon-orange fill-neon-orange"
                          : "text-muted-foreground"
                      )}
                    />
                  ))}
                </div>
                <span className="text-muted-foreground">
                  {product.rating} ({product.reviews} reviews)
                </span>
              </div>

              {/* Price or Out of Stock */}
              <div className="animate-item flex items-baseline gap-4 mb-8">
                {product.in_stock === false ? (
                  <span className="font-orbitron text-3xl font-bold text-destructive">
                    Out of Stock
                  </span>
                ) : (
                  <>
                    <span className="font-orbitron text-4xl font-bold text-primary">
                      AED {product.price.toLocaleString()}
                    </span>
                    {product.originalPrice && (
                      <>
                        <span className="text-xl text-muted-foreground line-through">
                          AED {product.originalPrice.toLocaleString()}
                        </span>
                        <span className="px-2 py-1 bg-destructive text-destructive-foreground text-sm font-bold rounded">
                          SAVE AED {(product.originalPrice - product.price).toLocaleString()}
                        </span>
                      </>
                    )}
                  </>
                )}
              </div>

              {/* Specs */}
              <div className="animate-item mb-8">
                <h3 className="font-orbitron text-lg font-bold mb-4">Specifications</h3>
                <div className="grid grid-cols-2 gap-3">
                  {product.specs.map((spec, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                      className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg"
                    >
                      <Check className="w-4 h-4 text-primary" />
                      <span className="text-sm">{spec}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Quantity & Add to Cart - only show if in stock */}
              {product.in_stock !== false ? (
                <div className="animate-item flex flex-col sm:flex-row gap-4 mb-8">
                  <div className="flex items-center bg-muted rounded-lg">
                    <motion.button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-4 py-3 text-muted-foreground hover:text-foreground transition-colors"
                      whileTap={{ scale: 0.9 }}
                    >
                      <Minus className="w-5 h-5" />
                    </motion.button>
                    <span className="w-12 text-center font-mono-tech text-lg">{quantity}</span>
                    <motion.button
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-4 py-3 text-muted-foreground hover:text-foreground transition-colors"
                      whileTap={{ scale: 0.9 }}
                    >
                      <Plus className="w-5 h-5" />
                    </motion.button>
                  </div>

                  <CyberButton 
                    size="lg" 
                    className="flex-1"
                    onClick={handleAddToCart}
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    ADD TO CART
                  </CyberButton>

                  <motion.button
                    onClick={() => setIsWishlisted(!isWishlisted)}
                    className={cn(
                      "p-4 rounded-lg border transition-all",
                      isWishlisted
                        ? "bg-destructive/10 border-destructive text-destructive"
                        : "bg-muted border-border text-muted-foreground hover:text-foreground"
                    )}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Heart className={cn("w-5 h-5", isWishlisted && "fill-current")} />
                  </motion.button>

                  <motion.button
                    className="p-4 rounded-lg bg-muted border border-border text-muted-foreground hover:text-foreground transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Share2 className="w-5 h-5" />
                  </motion.button>
                </div>
              ) : (
                <div className="animate-item flex gap-4 mb-8">
                  <motion.button
                    onClick={() => setIsWishlisted(!isWishlisted)}
                    className={cn(
                      "p-4 rounded-lg border transition-all",
                      isWishlisted
                        ? "bg-destructive/10 border-destructive text-destructive"
                        : "bg-muted border-border text-muted-foreground hover:text-foreground"
                    )}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Heart className={cn("w-5 h-5", isWishlisted && "fill-current")} />
                  </motion.button>

                  <motion.button
                    className="p-4 rounded-lg bg-muted border border-border text-muted-foreground hover:text-foreground transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Share2 className="w-5 h-5" />
                  </motion.button>
                </div>
              )}

              {/* Features */}
              <div className="animate-item grid grid-cols-3 gap-4">
                {[
                  { icon: Truck, label: 'Free Shipping' },
                  { icon: Shield, label: '3yr Warranty' },
                  { icon: RotateCcw, label: '30-Day Returns' },
                ].map((feature) => (
                  <div
                    key={feature.label}
                    className="flex flex-col items-center gap-2 p-4 bg-muted/50 rounded-lg text-center"
                  >
                    <feature.icon className="w-6 h-6 text-primary" />
                    <span className="text-xs text-muted-foreground">{feature.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="mt-24">
              <h2 className="font-orbitron text-3xl font-bold mb-8">
                RELATED <span className="text-primary">PRODUCTS</span>
              </h2>
              <ProductCarousel products={relatedProducts} />
            </div>
          )}
        </div>
      </main>

      <Footer />
    </motion.div>
  );
};

export default ProductDetailPage;
