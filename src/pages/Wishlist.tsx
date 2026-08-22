import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import { ProductCard } from '@/components/products/ProductCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { useWishlistStore } from '@/store/wishlistStore';

const WishlistPage: React.FC = () => {
  const items = useWishlistStore((state) => state.items);
  const clearWishlist = useWishlistStore((state) => state.clearWishlist);

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
              My <span className="text-primary">Wishlist</span>
            </h1>
            {items.length > 0 && (
              <CyberButton variant="outline" size="sm" onClick={clearWishlist}>
                Clear Wishlist
              </CyberButton>
            )}
          </div>

          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
              <Heart className="h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">Your wishlist is empty.</p>
              <Link to="/products">
                <CyberButton>Browse Products</CyberButton>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6 lg:grid-cols-4">
              {items.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </motion.div>
  );
};

export default WishlistPage;
