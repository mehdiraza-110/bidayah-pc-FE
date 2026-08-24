import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Check, ShoppingCart } from 'lucide-react';
import { getPublicFeaturedGamingPcs, type FeaturedGamingPc } from '@/services/api';
import { gamingPcUrl } from '@/lib/slug';
import { GSAPScrollReveal } from '@/components/effects/GSAPScrollReveal';
import { Loader } from '@/components/ui/Loader';
import { CyberButton } from '@/components/ui/CyberButton';
import { useCartStore } from '@/store/cartStore';
import type { Product } from '@/data/products';

const FeaturedGamingPcsSection: React.FC = () => {
  const [gamingPcs, setGamingPcs] = useState<FeaturedGamingPc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addItem, openCart } = useCartStore();

  useEffect(() => {
    let cancelled = false;

    getPublicFeaturedGamingPcs().then((response) => {
      if (!cancelled && response.success && response.data) {
        setGamingPcs(response.data);
      }
      if (!cancelled) setIsLoading(false);
    });

    return () => { cancelled = true; };
  }, []);

  // Nothing to show — don't render an empty section (also covers the admin
  // setting the homepage limit to 0).
  if (!isLoading && gamingPcs.length === 0) {
    return null;
  }

  const handleAddToCart = (gamingPc: FeaturedGamingPc, e: React.MouseEvent) => {
    // The card itself is a Link to the detail page — stop the click from
    // navigating there too.
    e.preventDefault();
    e.stopPropagation();

    // Added as a single bundle line item — its `specs` list is exactly the
    // component products, so the cart/checkout clearly shows what's inside,
    // same convention the PC Builder's custom-build cart item already uses.
    const bundle: Product = {
      id: `gaming-pc-${gamingPc.id}`,
      name: gamingPc.name,
      category: 'Gaming PC',
      price: gamingPc.price,
      image: gamingPc.images[0] || '',
      media: gamingPc.images.slice(1).map((url) => ({ url, type: 'image' as const })),
      description: gamingPc.description || undefined,
      specs: gamingPc.products.map((p) => {
        const label = p.category_name ? `${p.category_name}: ${p.name}` : p.name;
        return p.quantity > 1 ? `${label} ×${p.quantity}` : label;
      }),
      rating: 5.0,
      reviews: 0,
      stock: 1,
      in_stock: true,
      featured: false,
    };

    addItem(bundle);
    openCart();
    toast.success(`${gamingPc.name} added to cart`);
  };

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <GSAPScrollReveal animation="fadeUp">
          <div className="text-center mb-12">
            <span className="inline-block px-3 py-1 bg-primary/10 border border-primary/30 rounded text-xs font-mono-tech text-primary mb-4">
              CURATED BUILDS
            </span>
            <h2 className="font-orbitron text-4xl md:text-5xl font-bold text-foreground mb-4">
              Featured <span className="text-primary">Gaming PCs</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              Hand-picked, ready-to-ship rigs — every component listed, no surprises
            </p>
          </div>
        </GSAPScrollReveal>

        {isLoading ? (
          <Loader label="Loading featured gaming PCs..." />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {gamingPcs.map((gamingPc, index) => (
              <GSAPScrollReveal key={gamingPc.id} animation="fadeUp" delay={index * 0.08}>
                <motion.div
                  className="group h-full"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                <Link
                  to={gamingPcUrl(gamingPc)}
                  className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:border-primary/50 hover:shadow-[0_0_30px_hsl(var(--primary)/0.15)]"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-white">
                    <img
                      src={gamingPc.images[0]}
                      alt={gamingPc.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-orbitron text-lg font-bold text-foreground mb-2">
                      {gamingPc.name}
                    </h3>

                    {gamingPc.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {gamingPc.description}
                      </p>
                    )}

                    {gamingPc.key_features.length > 0 && (
                      <ul className="mb-3 space-y-1">
                        {gamingPc.key_features.slice(0, 4).map((feature, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                            <Check className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                            <span className="truncate">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {gamingPc.products.length > 0 && (
                      <p className="mb-4 text-xs text-muted-foreground">
                        Includes {gamingPc.products.length} component{gamingPc.products.length === 1 ? '' : 's'}:{' '}
                        <span className="text-foreground/80">
                          {gamingPc.products.slice(0, 3).map((p) => (p.quantity > 1 ? `${p.name} ×${p.quantity}` : p.name)).join(', ')}
                          {gamingPc.products.length > 3 ? ', …' : ''}
                        </span>
                      </p>
                    )}

                    <div className="mt-auto flex items-center justify-between gap-3 pt-2">
                      <span className="font-orbitron text-xl font-bold text-primary">
                        AED {Number(gamingPc.price).toLocaleString()}
                      </span>
                      <CyberButton size="sm" onClick={(e) => handleAddToCart(gamingPc, e)}>
                        <ShoppingCart className="mr-1.5 h-4 w-4" />
                        Add to Cart
                      </CyberButton>
                    </div>
                  </div>
                </Link>
                </motion.div>
              </GSAPScrollReveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedGamingPcsSection;
