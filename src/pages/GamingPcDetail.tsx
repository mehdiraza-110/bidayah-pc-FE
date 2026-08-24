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
  Truck,
  MapPin,
} from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import { CyberButton } from '@/components/ui/CyberButton';
import { NeonCard } from '@/components/ui/NeonCard';
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon';
import { Product } from '@/data/products';
import {
  getPublicFeaturedGamingPcById,
  getPublicFeaturedGamingPcBySlug,
  getPublicSiteSettings,
  getPublicStoreLocations,
  type FeaturedGamingPc,
  type StoreLocation,
} from '@/services/api';
import { useCartStore } from '@/store/cartStore';
import { Loader } from '@/components/ui/Loader';
import { cn } from '@/lib/utils';
import { isUuid, gamingPcUrl } from '@/lib/slug';

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
  const buildBundle = (pc: FeaturedGamingPc): Product => ({
    id: `gaming-pc-${pc.id}`,
    name: pc.name,
    category: 'Gaming PC',
    price: pc.price,
    image: pc.images[0] || '',
    media: pc.images.slice(1).map((url) => ({ url, type: 'image' as const })),
    description: pc.description || undefined,
    specs: pc.products.map((p) => {
      const label = p.category_name ? `${p.category_name}: ${p.name}` : p.name;
      return p.quantity > 1 ? `${label} ×${p.quantity}` : label;
    }),
    rating: 5.0,
    reviews: 0,
    stock: 1,
    in_stock: true,
    featured: false,
  });

  const handleAddToCart = () => {
    if (!gamingPc) return;
    const bundle = buildBundle(gamingPc);
    for (let i = 0; i < quantity; i++) {
      addItem(bundle);
    }
    openCart();
  };

  const handleBuyNow = () => {
    if (!gamingPc) return;
    const bundle = buildBundle(gamingPc);
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

              {/* Price */}
              <div className="animate-item flex flex-wrap items-center gap-4 mb-6">
                <span className="font-orbitron text-3xl font-bold text-primary">
                  AED {gamingPc.price.toLocaleString()}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                  </span>
                  Ready to ship
                </span>
              </div>

              <div className="space-y-8">
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
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-md border border-border bg-black px-8 py-4 text-base font-orbitron font-semibold uppercase tracking-wider text-white transition-colors hover:bg-black/85"
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
          {gamingPc.products.length > 0 && (
            <section className="mt-16">
              <div className="mb-8">
                <h2 className="font-orbitron text-3xl font-bold">
                  WHAT'S <span className="text-primary">INCLUDED</span>
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Every real component in this build, listed so there are no surprises.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {gamingPc.products.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-3 rounded-lg border border-border bg-card p-4"
                  >
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
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </motion.div>
  );
};

export default GamingPcDetailPage;
