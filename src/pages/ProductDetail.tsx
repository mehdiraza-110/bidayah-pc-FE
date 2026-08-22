import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import {
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Heart,
  Share2,
  Check,
  Minus,
  Plus,
  Eye,
  Scale,
  Truck,
  MapPin,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import { CyberButton } from '@/components/ui/CyberButton';
import { NeonCard } from '@/components/ui/NeonCard';
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon';
import { Product } from '@/data/products';
import {
  getPublicProductById,
  getPublicProductBySlug,
  getPublicProducts,
  getPublicSiteSettings,
  getPublicStoreLocations,
  type StoreLocation,
} from '@/services/api';
import { mapApiProductToLocal } from '@/lib/mapProduct';
import { isUuid, productUrl } from '@/lib/slug';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useCompareStore } from '@/store/compareStore';
import { ProductCarousel } from '@/components/products/ProductCarousel';
import { Loader } from '@/components/ui/Loader';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const LOW_STOCK_THRESHOLD = 5;

const sanitizeRichText = (html?: string) => {
  if (!html || typeof window === 'undefined') return '';

  const document = new DOMParser().parseFromString(html, 'text/html');
  const blockedTags = ['script', 'style', 'iframe', 'object', 'embed'];

  blockedTags.forEach((tag) => {
    document.querySelectorAll(tag).forEach((element) => element.remove());
  });

  document.body.querySelectorAll('*').forEach((element) => {
    Array.from(element.attributes).forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim().toLowerCase();

      if (name.startsWith('on') || ((name === 'href' || name === 'src') && value.startsWith('javascript:'))) {
        element.removeAttribute(attribute.name);
      }
    });
  });

  return document.body.innerHTML;
};

const ProductDetailPage: React.FC = () => {
  const { id, slug } = useParams<{ id: string; slug?: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });
  const [quantity, setQuantity] = useState(1);
  const [whatsappNumber, setWhatsappNumber] = useState<string | null>(null);
  const [pickupLocations, setPickupLocations] = useState<StoreLocation[]>([]);
  const { addItem, openCart } = useCartStore();
  const isWishlisted = useWishlistStore((state) => (product ? state.isWishlisted(product.id) : false));
  const toggleWishlist = useWishlistStore((state) => state.toggleItem);
  const isCompared = useCompareStore((state) => (product ? state.isCompared(product.id) : false));
  const toggleCompare = useCompareStore((state) => state.toggleItem);
  const imageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Load product and related products. Two URL shapes land here:
  //  - legacy: /product/<uuid>[/<any-slug>]      — `id` is the real product id
  //  - current: /product/<category-slug>/<slug>  — `slug` is the real lookup key,
  //    `id` here is just the decorative (unused) category segment
  useEffect(() => {
    const loadProduct = async () => {
      if (!id) return;

      setIsLoading(true);
      try {
        const legacyById = isUuid(id);
        const response = legacyById
          ? await getPublicProductById(id)
          : await getPublicProductBySlug(slug || id);

        if (response.success && response.data) {
          const mappedProduct = mapApiProductToLocal(response.data);
          setProduct(mappedProduct);
          setCategoryId(response.data.category_id || null);
          setSelectedImage(0); // Reset to first image
          setQuantity(1);

          // Keep the URL in sync with the canonical, id-free /product/<category>/<slug>
          // form — covers old id-based links, a renamed product, or a category rename.
          const canonicalUrl = productUrl(mappedProduct);
          if (window.location.pathname !== canonicalUrl) {
            navigate(canonicalUrl, { replace: true });
          }

          // Load related products from the same category
          if (response.data.category_id) {
            const relatedResponse = await getPublicProducts({
              category_id: response.data.category_id,
            });
            if (relatedResponse.success && relatedResponse.data) {
              const mappedRelated = relatedResponse.data
                .filter(p => p.id !== mappedProduct.id)
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
  }, [id, slug]);

  // Site-wide config: WhatsApp contact number + admin-managed pickup locations
  useEffect(() => {
    getPublicSiteSettings().then((response) => {
      if (response.success && response.data?.whatsapp_number) {
        setWhatsappNumber(response.data.whatsapp_number);
      }
    });
    getPublicStoreLocations().then((response) => {
      if (response.success && response.data) {
        setPickupLocations(response.data);
      }
    });
  }, []);

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

  const handleBuyNow = () => {
    if (!product) return;
    for (let i = 0; i < quantity; i++) {
      addItem(product);
    }
    navigate('/checkout');
  };

  const handleToggleWishlist = () => {
    if (!product) return;
    const added = toggleWishlist(product);
    toast.success(added ? 'Added to wishlist' : 'Removed from wishlist');
  };

  const handleToggleCompare = () => {
    if (!product) return;
    const result = toggleCompare(product);
    if (result === 'added') toast.success('Added to compare');
    else if (result === 'removed') toast.success('Removed from compare');
    else toast.error('You can compare up to 4 products at a time');
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: product?.name, url });
      } catch {
        // user cancelled the share sheet — nothing to do
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    }
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
  const showPrevImage = () => setSelectedImage((i) => (i - 1 + images.length) % images.length);
  const showNextImage = () => setSelectedImage((i) => (i + 1) % images.length);

  const handleImageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomOrigin({ x, y });
  };

  const handleImageMouseLeave = () => {
    setIsImageZoomed(false);
    setZoomOrigin({ x: 50, y: 50 });
  };

  const warrantyFeature = product?.keyFeatures?.find((f) => f.key.toLowerCase() === 'warranty');
  const skuFeature = product?.keyFeatures?.find((f) => f.key.toLowerCase() === 'sku');
  const specFeatures = product?.keyFeatures?.filter((f) => f !== warrantyFeature && f !== skuFeature) || [];

  // Deterministic per-product "watching now" count — a stable urgency indicator, not live analytics.
  const watcherCount = useMemo(() => {
    if (!product) return 0;
    let hash = 0;
    for (let i = 0; i < product.id.length; i++) {
      hash = (hash * 31 + product.id.charCodeAt(i)) >>> 0;
    }
    return 3 + (hash % 15);
  }, [product?.id]);

  const whatsappHref = product && whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi, is "${product.name}" available?`)}`
    : undefined;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <Loader label="Loading..." />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <h1 className="text-4xl font-orbitron font-bold mb-4">Product Not Found</h1>
            <Link to="/products" className="text-primary hover:underline">
              Back to Products
            </Link>
          </div>
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

      <main className="pt-12 pb-16">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-8"
          >
            <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1">
              <ChevronLeft className="w-4 h-4" />
              Home
            </Link>
            {product.category && (
              <>
                <span>/</span>
                <Link
                  to={categoryId ? `/products?category_id=${categoryId}` : '/products'}
                  className="hover:text-primary transition-colors"
                >
                  {product.category}
                </Link>
              </>
            )}
            <span>/</span>
            <span className="text-foreground line-clamp-1">{product.name}</span>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Image Gallery — sticks in place while the info column scrolls past it */}
            <div ref={imageRef} className="lg:sticky lg:top-20 self-start w-full max-w-[620px] lg:ml-auto">
              <div className="flex gap-3">
                {/* Thumbnails — vertical column on the left */}
                {images.length > 1 && (
                  <div className="flex max-h-[480px] shrink-0 flex-col gap-3 overflow-y-auto">
                    {images.map((img, i) => (
                      <motion.button
                        key={i}
                        onClick={() => setSelectedImage(i)}
                        className={cn(
                          "h-20 w-20 shrink-0 rounded-lg overflow-hidden border-2 bg-white p-1 transition-all",
                          selectedImage === i
                            ? "border-primary shadow-[0_0_15px_hsl(var(--neon-cyan)/0.5)]"
                            : "border-border hover:border-primary/50"
                        )}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <img src={img} alt="" className="w-full h-full object-contain" />
                      </motion.button>
                    ))}
                  </div>
                )}

                {/* Main image */}
                <NeonCard className="flex-1 p-4" glowColor="cyan" hover={false}>
                  <div
                    className={cn(
                      "relative aspect-square overflow-hidden rounded-lg bg-white p-6",
                      images.length > 0 && "cursor-zoom-in"
                    )}
                    onMouseEnter={() => setIsImageZoomed(true)}
                    onMouseLeave={handleImageMouseLeave}
                    onMouseMove={handleImageMouseMove}
                  >
                    {images.length > 0 && (
                      <motion.img
                        key={selectedImage}
                        src={images[selectedImage] || images[0]}
                        alt={product.name}
                        className="w-full h-full object-contain"
                        style={{ transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%` }}
                        initial={{ scale: 1.1, opacity: 0 }}
                        animate={{ scale: isImageZoomed ? 2 : 1, opacity: 1 }}
                        transition={{ duration: isImageZoomed ? 0.15 : 0.3 }}
                      />
                    )}
                    {images.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={showPrevImage}
                          aria-label="Previous image"
                          className="absolute left-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-background/80 text-foreground shadow-md hover:bg-primary hover:text-primary-foreground transition-colors"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                          type="button"
                          onClick={showNextImage}
                          aria-label="Next image"
                          className="absolute right-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-background/80 text-foreground shadow-md hover:bg-primary hover:text-primary-foreground transition-colors"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </>
                    )}
                  </div>
                </NeonCard>
              </div>
            </div>

            {/* Product Info */}
            <div ref={contentRef}>
              <h1 className="animate-item font-orbitron text-2xl md:text-3xl font-bold text-foreground mb-4">
                {product.name}
              </h1>

              {/* Key feature bullets */}
              {specFeatures.length > 0 && (
                <ul className="animate-item space-y-1.5 text-sm mb-4">
                  {specFeatures.map((feature) => (
                    <li key={feature.key} className="flex items-start gap-1.5">
                      <ChevronRight className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
                      <span>
                        <span className="font-semibold text-foreground">{feature.key}:</span>{' '}
                        <span className="text-muted-foreground">{feature.value}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {warrantyFeature && (
                <p className="animate-item text-sm font-bold text-primary mb-1">
                  Warranty: {warrantyFeature.value}
                </p>
              )}
              {skuFeature && (
                <p className="animate-item text-xs text-muted-foreground mb-4">
                  SKU: {skuFeature.value}
                </p>
              )}

              {/* Price + stock */}
              <div className="animate-item flex flex-wrap items-center gap-4 mb-6">
                {product.in_stock === false ? (
                  <span className="font-orbitron text-3xl font-bold text-destructive">
                    Out of Stock
                  </span>
                ) : (
                  <>
                    <span className="font-orbitron text-3xl font-bold text-primary">
                      AED {product.price.toLocaleString()}
                    </span>
                    {product.originalPrice && (
                      <span className="text-lg text-muted-foreground line-through">
                        AED {product.originalPrice.toLocaleString()}
                      </span>
                    )}
                  </>
                )}

                {product.in_stock !== false && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                    </span>
                    {product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD
                      ? `Only ${product.stock} left in stock`
                      : 'In stock'}
                  </span>
                )}
              </div>

              <div className="space-y-8">
                {/* Quantity, Add to Cart & Buy Now — only if in stock */}
                {product.in_stock !== false && (
                  <div className="animate-item flex flex-col sm:flex-row gap-3">
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

                    <CyberButton size="lg" className="flex-1 gap-2" onClick={handleAddToCart}>
                      <ShoppingCart className="w-5 h-5" />
                      Add to Cart
                    </CyberButton>

                    <button
                      type="button"
                      onClick={handleBuyNow}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-md border border-border bg-black px-8 py-4 text-base font-orbitron font-semibold uppercase tracking-wider text-white transition-colors hover:bg-black/85"
                    >
                      Buy Now
                    </button>
                  </div>
                )}

                {/* WhatsApp availability check */}
                {whatsappHref && (
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="animate-item flex items-center gap-3 rounded-full bg-[#25D366] px-5 py-3 text-white shadow-md transition hover:brightness-95 w-fit"
                  >
                    <WhatsAppIcon className="w-7 h-7 shrink-0" />
                    <span className="text-left leading-tight">
                      <span className="block text-xs opacity-90">Customer Care</span>
                      <span className="block text-sm font-bold">Check Availability</span>
                    </span>
                  </a>
                )}

                {/* Compare / Wishlist / Share */}
                <div className="animate-item flex flex-wrap items-center gap-6 border-t border-border pt-6 text-sm">
                  <button
                    type="button"
                    onClick={handleToggleCompare}
                    className={cn(
                      "flex items-center gap-2 transition-colors",
                      isCompared ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Scale className="w-4 h-4" />
                    {isCompared ? 'Added to Compare' : 'Compare'}
                  </button>
                  <button
                    type="button"
                    onClick={handleToggleWishlist}
                    className={cn(
                      "flex items-center gap-2 transition-colors",
                      isWishlisted ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Heart className={cn("w-4 h-4", isWishlisted && "fill-current")} />
                    {isWishlisted ? 'Wishlisted' : 'Add to wishlist'}
                  </button>
                  <button
                    type="button"
                    onClick={handleShare}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                </div>

                {/* Watching now banner */}
                <div className="animate-item flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary">
                  <Eye className="w-4 h-4 shrink-0" />
                  {watcherCount} people are watching this product right now!
                </div>

                {/* Delivery & pickup */}
                <div className="animate-item space-y-3">
                  {pickupLocations.map((location) => (
                    <div
                      key={location.id}
                      className="flex items-center justify-between gap-4 rounded-lg border border-border p-4"
                    >
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-primary shrink-0" />
                        <div className="text-sm">
                          <p className="font-semibold text-foreground">Pick up from {location.name}</p>
                          <p className="text-muted-foreground">
                            {[location.address, location.city].filter(Boolean).join(', ')}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-accent shrink-0">Free</span>
                    </div>
                  ))}

                  <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-4">
                    <div className="flex items-center gap-3">
                      <Truck className="w-5 h-5 text-primary shrink-0" />
                      <div className="text-sm">
                        <p className="font-semibold text-foreground">Courier delivery</p>
                        <p className="text-muted-foreground">Delivered in 2-3 business days</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-accent shrink-0">Free</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <section className="mt-16">
              <h2 className="font-orbitron text-2xl font-bold mb-5">
                PRODUCT <span className="text-primary">DESCRIPTION</span>
              </h2>
              <div
                className="prose prose-invert max-w-none rounded-lg border border-border bg-muted/30 p-6 text-sm leading-relaxed text-muted-foreground prose-headings:font-orbitron prose-headings:text-foreground prose-a:text-primary prose-strong:text-foreground prose-ul:my-3 prose-ol:my-3 prose-li:my-1 md:p-8"
                dangerouslySetInnerHTML={{ __html: sanitizeRichText(product.description) }}
              />
            </section>
          )}

          {/* Recommended Products */}
          {relatedProducts.length > 0 && (
            <section className="mt-16">
              <div className="mb-8">
                <h2 className="font-orbitron text-3xl font-bold">
                  RECOMMENDED <span className="text-primary">PRODUCTS</span>
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Relevant picks from the same category.
                </p>
              </div>
              <ProductCarousel products={relatedProducts} />
            </section>
          )}
        </div>
      </main>

      <Footer />
    </motion.div>
  );
};

export default ProductDetailPage;
