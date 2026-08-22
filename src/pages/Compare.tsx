import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Scale, ShoppingCart, X } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import { CyberButton } from '@/components/ui/CyberButton';
import { Loader } from '@/components/ui/Loader';
import { Product } from '@/data/products';
import { getPublicProductById } from '@/services/api';
import { mapApiProductToLocal } from '@/lib/mapProduct';
import { useCompareStore } from '@/store/compareStore';
import { useCartStore } from '@/store/cartStore';
import { productUrl } from '@/lib/slug';

const ComparePage: React.FC = () => {
  const items = useCompareStore((state) => state.items);
  const removeItem = useCompareStore((state) => state.removeItem);
  const clearCompare = useCompareStore((state) => state.clearCompare);
  const { addItem, openCart } = useCartStore();

  const [details, setDetails] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (items.length === 0) {
      setDetails([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    Promise.all(items.map((item) => getPublicProductById(item.id)))
      .then((responses) => {
        if (cancelled) return;
        const mapped = responses.map((response, i) =>
          response.success && response.data ? mapApiProductToLocal(response.data) : items[i]
        );
        setDetails(mapped);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [items]);

  const featureKeys = Array.from(
    new Set(details.flatMap((product) => product.keyFeatures?.map((f) => f.key) || []))
  );

  const handleAddToCart = (product: Product) => {
    addItem(product);
    openCart();
  };

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
          <div className="flex items-end justify-between mb-8">
            <h1 className="font-orbitron text-3xl md:text-4xl font-bold text-foreground">
              Compare <span className="text-primary">Products</span>
            </h1>
            {items.length > 0 && (
              <CyberButton variant="outline" size="sm" onClick={clearCompare}>
                Clear All
              </CyberButton>
            )}
          </div>

          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
              <Scale className="h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">
                You haven't added any products to compare yet.
              </p>
              <Link to="/products">
                <CyberButton>Browse Products</CyberButton>
              </Link>
            </div>
          ) : isLoading ? (
            <Loader label="Loading comparison..." />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="w-40 p-4 text-left align-bottom font-rajdhani text-muted-foreground">
                      Product
                    </th>
                    {details.map((product) => (
                      <th key={product.id} className="p-4 align-top">
                        <div className="relative flex flex-col items-center gap-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeItem(product.id)}
                            aria-label={`Remove ${product.name} from comparison`}
                            className="absolute -top-1 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-background text-muted-foreground shadow hover:text-destructive"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                          <Link to={productUrl(product)} className="h-24 w-24 overflow-hidden rounded-lg bg-muted">
                            <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                          </Link>
                          <Link
                            to={productUrl(product)}
                            className="font-orbitron text-sm font-bold text-foreground hover:text-primary line-clamp-2"
                          >
                            {product.name}
                          </Link>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="p-4 font-semibold text-foreground">Vendor</td>
                    {details.map((product) => (
                      <td key={product.id} className="p-4 text-center text-muted-foreground">
                        {product.vendorName || '—'}
                      </td>
                    ))}
                  </tr>

                  <tr className="border-b border-border bg-muted/20">
                    <td className="p-4 font-semibold text-foreground">Price</td>
                    {details.map((product) => (
                      <td key={product.id} className="p-4 text-center">
                        <span className="font-orbitron font-bold text-primary">
                          AED {product.price.toLocaleString()}
                        </span>
                        {product.originalPrice && (
                          <span className="ml-2 text-xs text-muted-foreground line-through">
                            AED {product.originalPrice.toLocaleString()}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>

                  <tr className="border-b border-border">
                    <td className="p-4 font-semibold text-foreground">Availability</td>
                    {details.map((product) => (
                      <td key={product.id} className="p-4 text-center">
                        {product.in_stock === false ? (
                          <span className="text-xs font-semibold text-destructive">Out of Stock</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                            <Check className="h-3.5 w-3.5" /> In Stock
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {featureKeys.map((key, i) => (
                    <tr key={key} className={i % 2 === 0 ? 'border-b border-border bg-muted/20' : 'border-b border-border'}>
                      <td className="p-4 font-semibold text-foreground">{key}</td>
                      {details.map((product) => {
                        const value = product.keyFeatures?.find((f) => f.key === key)?.value;
                        return (
                          <td key={product.id} className="p-4 text-center text-muted-foreground">
                            {value || '—'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}

                  <tr>
                    <td className="p-4" />
                    {details.map((product) => (
                      <td key={product.id} className="p-4 text-center">
                        <CyberButton
                          size="sm"
                          className="gap-2"
                          disabled={product.in_stock === false}
                          onClick={() => handleAddToCart(product)}
                        >
                          <ShoppingCart className="h-4 w-4" />
                          Add to Cart
                        </CyberButton>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </motion.div>
  );
};

export default ComparePage;
