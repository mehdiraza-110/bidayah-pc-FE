import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import {
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Share2,
  Check,
  Minus,
  Plus,
  Search,
  Truck,
  MapPin,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import { CyberButton } from '@/components/ui/CyberButton';
import { NeonCard } from '@/components/ui/NeonCard';
import { Input } from '@/components/ui/input';
import { ScoreRing } from '@/components/pc-series/ScoreRing';
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon';
import { Product } from '@/data/products';
import {
  getPublicFeaturedGamingPcById,
  getPublicFeaturedGamingPcBySlug,
  getPublicSiteSettings,
  getPublicStoreLocations,
  getPublicProducts,
  type FeaturedGamingPc,
  type StoreLocation,
  type Product as CatalogProduct,
} from '@/services/api';
import { useCartStore } from '@/store/cartStore';
import { Loader } from '@/components/ui/Loader';
import { cn } from '@/lib/utils';
import { isUuid, gamingPcUrl } from '@/lib/slug';

// One extra, optional product a shopper has added on top of the fixed build
// — same "product + quantity" shape as the admin form's own product picker.
interface SelectedExtra {
  product: CatalogProduct;
  quantity: number;
}

// Main image first, then the rest of the gallery in display order, de-duped —
// same convention as ProductCard's own galleryImages memo. Works for both a
// catalog Product and a FeaturedGamingPcProduct (this build's own fixed
// components), which share this same shape.
const productGalleryImages = (product: {
  image: string | null;
  media?: { url: string; type: string; display_order?: number }[];
}): string[] => {
  const mediaImages = (product.media || [])
    .filter((item) => item.type === 'image')
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
    .map((item) => item.url);
  return Array.from(new Set([product.image, ...mediaImages].filter(Boolean))) as string[];
};

// How often the preview swaps images while hovered — matches ProductCard.
const HOVER_PREVIEW_CYCLE_MS = 2200;

// Wraps a small product row/card so hovering it pops up a bigger preview that
// cycles through the product's own photo gallery — lets a shopper see more
// than the tiny thumbnail before adding an extra product to their build.
const HoverGalleryPreview: React.FC<{ images: string[]; alt: string; children: React.ReactNode }> = ({
  images,
  alt,
  children,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    if (!isHovered || images.length <= 1) {
      setImageIndex(0);
      return;
    }

    const timer = window.setInterval(() => {
      setImageIndex((prev) => (prev + 1) % images.length);
    }, HOVER_PREVIEW_CYCLE_MS);

    return () => window.clearInterval(timer);
  }, [isHovered, images.length]);

  return (
    <div className="relative" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      {children}

      {isHovered && images.length > 0 && (
        <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2">
          <div className="relative h-48 w-48 overflow-hidden rounded-lg border border-border bg-white shadow-2xl">
            <motion.img
              key={images[imageIndex]}
              src={images[imageIndex]}
              alt={alt}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
              className="h-full w-full object-contain"
            />

            {images.length > 1 && (
              <div className="absolute bottom-1.5 left-1/2 z-10 flex -translate-x-1/2 gap-1">
                {images.map((_, dotIndex) => (
                  <span key={dotIndex} className="relative h-1 w-4 overflow-hidden rounded-full bg-black/20">
                    <motion.span
                      className="absolute inset-y-0 left-0 rounded-full bg-primary"
                      initial={false}
                      animate={{ width: dotIndex <= imageIndex ? '100%' : '0%' }}
                      transition={
                        dotIndex === imageIndex
                          ? { duration: HOVER_PREVIEW_CYCLE_MS / 1000, ease: 'linear' }
                          : { duration: 0.2 }
                      }
                    />
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const GamingPcDetailPage: React.FC = () => {
  // Two URL shapes land here: the legacy `/gaming-pc/<uuid>` and the current,
  // canonical `/gaming-pc/<slug>` — same dual-lookup approach as ProductDetail.
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [gamingPc, setGamingPc] = useState<FeaturedGamingPc | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });
  const [quantity, setQuantity] = useState(1);
  const [whatsappNumber, setWhatsappNumber] = useState<string | null>(null);
  const [pickupLocations, setPickupLocations] = useState<StoreLocation[]>([]);
  const [selectedExtras, setSelectedExtras] = useState<SelectedExtra[]>([]);
  const [extraSearch, setExtraSearch] = useState('');
  const [extraResults, setExtraResults] = useState<CatalogProduct[]>([]);
  const [isSearchingExtras, setIsSearchingExtras] = useState(false);
  const [suggestedExtras, setSuggestedExtras] = useState<CatalogProduct[]>([]);
  const { addItem, openCart } = useCartStore();
  const imageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadGamingPc = async () => {
      if (!id) return;

      setIsLoading(true);
      try {
        const legacyById = isUuid(id);
        const response = legacyById
          ? await getPublicFeaturedGamingPcById(id)
          : await getPublicFeaturedGamingPcBySlug(id);

        if (response.success && response.data) {
          setGamingPc(response.data);
          setSelectedImage(0);
          setQuantity(1);
          setSelectedExtras([]);
          setExtraSearch('');
          setExtraResults([]);

          // Keep the URL in sync with the canonical, id-free /gaming-pc/<slug>
          // form — covers old id-based links or a renamed build.
          const canonicalUrl = gamingPcUrl(response.data);
          if (window.location.pathname !== canonicalUrl) {
            navigate(canonicalUrl, { replace: true });
          }
        } else {
          toast.error(response.message || 'Gaming PC not found');
        }
      } catch (error) {
        console.error('Error loading featured gaming PC:', error);
        toast.error('Failed to load gaming PC');
      } finally {
        setIsLoading(false);
      }
    };

    loadGamingPc();
  }, [id]);

  // Debounced product search for "add an extra product" — same pattern as
  // the admin Featured Gaming PC form's own product picker.
  useEffect(() => {
    const handle = setTimeout(async () => {
      if (!extraSearch.trim()) {
        setExtraResults([]);
        return;
      }
      setIsSearchingExtras(true);
      const response = await getPublicProducts({ search: extraSearch.trim(), in_stock: true });
      if (response.success && response.data) {
        setExtraResults(response.data.slice(0, 20));
      }
      setIsSearchingExtras(false);
    }, 300);

    return () => clearTimeout(handle);
  }, [extraSearch]);

  // Default suggestions shown before the shopper types a search — in-stock
  // products from categories *not* already part of this build (so we don't
  // suggest "another GPU" alongside the one it already ships with).
  useEffect(() => {
    if (!gamingPc) {
      setSuggestedExtras([]);
      return;
    }

    let cancelled = false;
    const excludedCategoryIds = new Set(
      gamingPc.products.map((p) => p.category_id).filter((categoryId): categoryId is string => Boolean(categoryId))
    );

    getPublicProducts({ in_stock: true, sort: 'featured', limit: 30 }).then((response) => {
      if (cancelled || !response.success || !response.data) return;
      const suggestions = response.data.filter((p) => !p.category_id || !excludedCategoryIds.has(p.category_id));
      setSuggestedExtras(suggestions.slice(0, 8));
    });

    return () => { cancelled = true; };
  }, [gamingPc]);

  const handleAddExtra = (product: CatalogProduct) => {
    setSelectedExtras((prev) => {
      if (prev.some((entry) => entry.product.id === product.id)) return prev;
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleRemoveExtra = (productId: string) => {
    setSelectedExtras((prev) => prev.filter((entry) => entry.product.id !== productId));
  };

  // +/- stepper for an already-added extra — dropping to 0 removes it entirely.
  const handleChangeExtraQuantity = (productId: string, delta: 1 | -1) => {
    setSelectedExtras((prev) => {
      const index = prev.findIndex((entry) => entry.product.id === productId);
      if (index === -1) return prev;

      const nextQuantity = prev[index].quantity + delta;
      if (nextQuantity <= 0) return prev.filter((_, i) => i !== index);

      return prev.map((entry, i) => (i === index ? { ...entry, quantity: nextQuantity } : entry));
    });
  };

  const extrasTotal = selectedExtras.reduce((sum, { product, quantity }) => sum + Number(product.price) * quantity, 0);

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
    if (!imageRef.current || !contentRef.current || !gamingPc) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(imageRef.current,
        { scale: 0.8, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.8, ease: 'power3.out' }
      );

      const elements = contentRef.current?.querySelectorAll('.animate-item');
      gsap.fromTo(elements,
        { x: 50, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out', delay: 0.3 }
      );
    });

    return () => ctx.revert();
  }, [gamingPc]);

  // Bundle line item — its `specs` list is the actual component products, same
  // convention as the homepage card's Add to Cart (see FeaturedGamingPcsSection).
  // Extra (optional) products the shopper added get folded into the same flat
  // line item — the cart only understands a single price/specs list per item,
  // same as PC Builder's custom build — so the id also encodes which extras
  // (and how many of each) are in this particular selection, otherwise two
  // differently-priced picks of the same build would wrongly merge quantities.
  const buildBundle = (pc: FeaturedGamingPc, extras: SelectedExtra[]): Product => {
    const extrasSignature = extras
      .map(({ product, quantity }) => `${product.id}x${quantity}`)
      .sort()
      .join('-');

    return {
      id: extrasSignature ? `gaming-pc-${pc.id}--${extrasSignature}` : `gaming-pc-${pc.id}`,
      name: pc.name,
      category: 'Gaming PC',
      price: Number(pc.price) + extras.reduce((sum, { product, quantity }) => sum + Number(product.price) * quantity, 0),
      image: pc.images[0] || '',
      media: pc.images.slice(1).map((url) => ({ url, type: 'image' as const })),
      description: pc.description || undefined,
      specs: [
        ...pc.products.map((p) => {
          const label = p.category_name ? `${p.category_name}: ${p.name}` : p.name;
          return p.quantity > 1 ? `${label} ×${p.quantity}` : label;
        }),
        ...extras.map(({ product, quantity }) => {
          const label = `${product.name} (add-on)`;
          return quantity > 1 ? `${label} ×${quantity}` : label;
        }),
      ],
      rating: 5.0,
      reviews: 0,
      stock: 1,
      in_stock: true,
      featured: false,
    };
  };

  const handleAddToCart = () => {
    if (!gamingPc) return;
    const bundle = buildBundle(gamingPc, selectedExtras);
    for (let i = 0; i < quantity; i++) {
      addItem(bundle);
    }
    openCart();
  };

  const handleBuyNow = () => {
    if (!gamingPc) return;
    const bundle = buildBundle(gamingPc, selectedExtras);
    for (let i = 0; i < quantity; i++) {
      addItem(bundle);
    }
    navigate('/checkout');
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: gamingPc?.name, url });
      } catch {
        // user cancelled the share sheet — nothing to do
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    }
  };

  const images = gamingPc?.images || [];
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

  const whatsappHref = gamingPc && whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi, is "${gamingPc.name}" available?`)}`
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

  if (!gamingPc) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <h1 className="text-4xl font-orbitron font-bold mb-4">Gaming PC Not Found</h1>
            <Link to="/" className="text-primary hover:underline">
              Back to Home
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
            <span>/</span>
            <span className="text-foreground line-clamp-1">{gamingPc.name}</span>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Image Gallery — sticks in place while the info column scrolls past it */}
            <div ref={imageRef} className="lg:sticky lg:top-20 self-start w-full max-w-[620px] lg:ml-auto">
              <div className="flex gap-3">
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
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </motion.button>
                    ))}
                  </div>
                )}

                <NeonCard className="flex-1 p-4" glowColor="cyan" hover={false}>
                  <div
                    className={cn(
                      "relative aspect-square overflow-hidden rounded-lg bg-white",
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
                        alt={gamingPc.name}
                        className="w-full h-full object-cover"
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

            {/* Gaming PC Info */}
            <div ref={contentRef}>
              <h1 className="animate-item font-orbitron text-2xl md:text-3xl font-bold text-foreground mb-4">
                {gamingPc.name}
              </h1>

              {/* FPS score — only set when this build is assigned to a PC Series */}
              {gamingPc.fps_score != null && (
                <div className="animate-item mb-5">
                  <ScoreRing score={gamingPc.fps_score} settingsLabel={gamingPc.fps_settings_label} />
                </div>
              )}

              {/* Key feature bullets */}
              {gamingPc.key_features.length > 0 && (
                <ul className="animate-item space-y-1.5 text-sm mb-6">
                  {gamingPc.key_features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              )}

              {/* Price — includes any extra products added below */}
              <div className="animate-item flex flex-wrap items-center gap-4 mb-6">
                <span className="font-orbitron text-3xl font-bold text-primary">
                  AED {(Number(gamingPc.price) + extrasTotal).toLocaleString()}
                </span>
                {extrasTotal > 0 && (
                  <span className="text-sm text-muted-foreground">
                    (AED {Number(gamingPc.price).toLocaleString()} build + AED {extrasTotal.toLocaleString()} in extras)
                  </span>
                )}
                <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                  </span>
                  Ready to ship
                </span>
              </div>

              <div className="space-y-8">
                <p className="animate-item text-sm font-semibold text-destructive">
                  The price is not final. Our team will send you a pricing quotation after order placement.
                </p>

                {/* Quantity, Add to Cart & Buy Now */}
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
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-md border border-border bg-black px-8 py-4 text-base font-orbitron font-semibold uppercase tracking-wider text-white transition-colors hover:bg-black/85 hover:border-primary"
                  >
                    Buy Now
                  </button>
                </div>

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

                {/* Share */}
                <div className="animate-item flex flex-wrap items-center gap-6 border-t border-border pt-6 text-sm">
                  <button
                    type="button"
                    onClick={handleShare}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
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
                        <p className="text-muted-foreground">Delivered to your door</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-accent shrink-0">Free</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {gamingPc.description && (
            <section className="mt-16">
              <h2 className="font-orbitron text-2xl font-bold mb-5">
                ABOUT THIS <span className="text-primary">BUILD</span>
              </h2>
              <div className="whitespace-pre-line rounded-lg border border-border bg-muted/30 p-6 text-sm leading-relaxed text-muted-foreground md:p-8">
                {gamingPc.description}
              </div>
            </section>
          )}

          {/* What's Included */}
          <section className="mt-16">
              <div className="mb-8">
                <h2 className="font-orbitron text-3xl font-bold">
                  WHAT'S <span className="text-primary">INCLUDED</span>
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Every real component in this build, listed so there are no surprises.
                </p>
              </div>

              {gamingPc.products.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {gamingPc.products.map((product) => (
                    <HoverGalleryPreview key={product.id} images={productGalleryImages(product)} alt={product.name}>
                      <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
                        {product.image ? (
                          <img src={product.image} alt={product.name} className="h-14 w-14 rounded-md object-cover border border-border bg-white shrink-0" />
                        ) : (
                          <div className="h-14 w-14 rounded-md border border-border bg-muted shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          {product.category_name && (
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                              {product.category_name}
                            </p>
                          )}
                          <p className="font-rajdhani font-semibold text-sm leading-snug truncate">
                            {product.name}
                          </p>
                          {product.quantity > 1 && (
                            <p className="text-xs text-primary font-semibold">×{product.quantity}</p>
                          )}
                        </div>
                      </div>
                    </HoverGalleryPreview>
                  ))}
                </div>
              )}

              {/* Add extra, optional products — folded into the price/cart bundle above */}
              <div className="mt-10 rounded-lg border border-border bg-card p-6">
                <h3 className="font-orbitron text-lg font-bold mb-1">Add extra products</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Want anything else with this build? Search the catalog and add it — the price above updates instantly.
                </p>

                {selectedExtras.length > 0 && (
                  <div className="mb-4 space-y-2">
                    {selectedExtras.map(({ product, quantity }) => (
                      <div
                        key={product.id}
                        className="flex items-center gap-3 rounded-lg border border-border p-3"
                      >
                        {product.image ? (
                          <img src={product.image} alt={product.name} className="h-11 w-11 rounded-md object-cover border border-border bg-white shrink-0" />
                        ) : (
                          <div className="h-11 w-11 rounded-md border border-border bg-muted shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-rajdhani font-semibold text-sm truncate">{product.name}</p>
                          <p className="text-xs text-primary font-semibold">
                            AED {Number(product.price).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleChangeExtraQuantity(product.id, -1)}
                            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-5 text-center font-mono-tech text-sm">{quantity}</span>
                          <button
                            type="button"
                            onClick={() => handleChangeExtraQuantity(product.id, 1)}
                            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveExtra(product.id)}
                          className="shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          aria-label={`Remove ${product.name}`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={extraSearch}
                    onChange={(e) => setExtraSearch(e.target.value)}
                    placeholder="Search products to add..."
                    className="pl-9"
                  />
                </div>

                {isSearchingExtras ? (
                  <div className="mt-2"><Loader size="sm" label="Searching..." /></div>
                ) : extraSearch.trim() ? (
                  extraResults.length > 0 ? (
                    <div className="mt-2 max-h-64 overflow-y-auto rounded-md border border-border divide-y divide-border">
                      {extraResults.map((product) => {
                        const isSelected = selectedExtras.some((entry) => entry.product.id === product.id);
                        return (
                          <HoverGalleryPreview key={product.id} images={productGalleryImages(product)} alt={product.name}>
                            <div className="flex items-center gap-3 p-2.5">
                              {product.image ? (
                                <img src={product.image} alt="" className="h-9 w-9 rounded-md object-cover shrink-0 bg-white border border-border" />
                              ) : (
                                <div className="h-9 w-9 rounded-md bg-muted shrink-0" />
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate">{product.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  AED {Number(product.price).toLocaleString()}
                                  {product.category_name ? ` · ${product.category_name}` : ''}
                                </p>
                              </div>
                              <CyberButton
                                size="sm"
                                variant={isSelected ? 'outline' : undefined}
                                disabled={isSelected}
                                onClick={() => handleAddExtra(product)}
                              >
                                {isSelected ? 'Added' : 'Add'}
                              </CyberButton>
                            </div>
                          </HoverGalleryPreview>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-muted-foreground">No products found.</p>
                  )
                ) : (
                  suggestedExtras.length > 0 && (
                    <div className="mt-4">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                        Suggested for this build
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {suggestedExtras.map((product) => {
                          const isSelected = selectedExtras.some((entry) => entry.product.id === product.id);
                          return (
                            <HoverGalleryPreview key={product.id} images={productGalleryImages(product)} alt={product.name}>
                              <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                                {product.image ? (
                                  <img src={product.image} alt="" className="h-11 w-11 rounded-md object-cover shrink-0 bg-white border border-border" />
                                ) : (
                                  <div className="h-11 w-11 rounded-md bg-muted shrink-0" />
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium truncate">{product.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    AED {Number(product.price).toLocaleString()}
                                  </p>
                                </div>
                                <CyberButton
                                  size="sm"
                                  variant={isSelected ? 'outline' : undefined}
                                  disabled={isSelected}
                                  onClick={() => handleAddExtra(product)}
                                >
                                  {isSelected ? 'Added' : 'Add'}
                                </CyberButton>
                              </div>
                            </HoverGalleryPreview>
                          );
                        })}
                      </div>
                    </div>
                  )
                )}
              </div>
            </section>
        </div>
      </main>


      <Footer />
    </motion.div>
  );
};

export default GamingPcDetailPage;
