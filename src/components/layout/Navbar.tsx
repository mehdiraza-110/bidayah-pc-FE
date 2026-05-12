import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Cpu, Languages, Menu, Moon, Search, ShoppingCart, Sun, X } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useCartStore } from '@/store/cartStore';
import { cn } from '@/lib/utils';

const categoryLinks = [
  { name: 'Gaming PC', path: '/products?category=Gaming+PC' },
  { name: 'Build From Scratch', path: '/pc-builder' },
  { name: 'Laptops', path: '/products?category=Laptops' },
  { name: 'Monitors', path: '/products?category=Monitors' },
  {
    name: 'Hardware PC Parts',
    path: '/products?category=Hardware',
    children: [
      { name: 'CPU', path: '/products?search=CPU' },
      { name: 'GPU', path: '/products?search=GPU' },
      { name: 'Motherboards', path: '/products?search=Motherboard' },
      { name: 'RAM', path: '/products?search=RAM' },
      { name: 'Storage', path: '/products?search=Storage' },
      { name: 'Power Supplies', path: '/products?search=PSU' },
      { name: 'Cooling', path: '/products?search=Cooling' },
    ],
  },
  {
    name: 'Gaming Accessories',
    path: '/products?category=Gaming+Accessories',
    children: [
      { name: 'Keyboards', path: '/products?search=Keyboard' },
      { name: 'Mice', path: '/products?search=Mouse' },
      { name: 'Headsets', path: '/products?search=Headset' },
      { name: 'Mousepads', path: '/products?search=Mousepad' },
      { name: 'Controllers', path: '/products?search=Controller' },
      { name: 'Streaming Gear', path: '/products?search=Streaming' },
    ],
  },
];

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [language, setLanguage] = useState<'en' | 'ar'>('en');
  const [isMounted, setIsMounted] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { openCart, getTotalItems } = useCartStore();
  const totalItems = getTotalItems();
  const isLightMode = theme === 'light';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();

    const query = searchQuery.trim();
    if (query) {
      navigate(`/products?search=${encodeURIComponent(query)}`);
    } else {
      navigate('/products');
    }
    setIsMobileMenuOpen(false);
  };

  const isActive = (path: string) => {
    const [pathname, queryString] = path.split('?');
    if (location.pathname !== pathname) return false;
    if (!queryString) return true;
    return location.search.includes(queryString.split('=')[0]);
  };

  const handleThemeToggle = () => {
    setTheme(isLightMode ? 'dark' : 'light');
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={cn(
          "relative z-50 border-b border-border transition-all duration-300",
          isScrolled
            ? "bg-background/90 backdrop-blur-lg border-b border-neon-cyan/20 shadow-[0_0_30px_hsl(var(--neon-cyan)/0.1)]"
            : "bg-background/95 backdrop-blur-sm"
        )}
      >
        {/* Language strip */}
        <div className="border-b border-border/70 bg-card/40">
          <div className="container mx-auto px-3 h-7 flex items-center justify-end md:h-9 md:px-4">
            <div className="flex items-center gap-2 text-xs font-mono-tech text-muted-foreground">
              <Languages className="w-3.5 h-3.5 text-primary md:h-4 md:w-4" />
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={cn('transition-colors hover:text-foreground', language === 'en' && 'text-primary')}
              >
                English
              </button>
              <span className="text-border">/</span>
              <button
                type="button"
                onClick={() => setLanguage('ar')}
                className={cn('transition-colors hover:text-foreground', language === 'ar' && 'text-primary')}
              >
                العربية
              </button>
            </div>
          </div>
        </div>

        {/* Main row */}
        <div className="container mx-auto px-3 md:px-4">
          <div className="grid h-14 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 md:h-20 md:grid-cols-[auto_1fr_auto] md:gap-4">
            {/* Logo */}
            <Link to="/" className="flex min-w-0 items-center gap-2 group">
              <motion.div
                whileHover={{ rotate: 180, scale: 1.1 }}
                transition={{ duration: 0.5 }}
                className="relative shrink-0"
              >
                <Cpu className="w-8 h-8 text-primary md:h-10 md:w-10" />
                <div className="absolute inset-0 bg-primary/30 blur-xl group-hover:bg-primary/50 transition-all" />
              </motion.div>
              <span className="truncate font-orbitron text-lg font-bold text-foreground sm:text-xl md:text-2xl">
                NEXUS<span className="text-primary">GEAR</span>
              </span>
            </Link>

            {/* Search */}
            <form onSubmit={handleSearch} className="hidden md:flex min-w-0 justify-center">
              <div className="flex w-full max-w-xl">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 w-5 h-5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search products..."
                    className="h-11 w-full border border-border bg-muted/20 pl-11 pr-4 font-rajdhani text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                  />
                </div>
                <button
                  type="submit"
                  className="h-11 border border-l-0 border-primary px-6 font-orbitron text-xs font-semibold uppercase tracking-wider text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Cart & Mobile Menu */}
            <div className="flex items-center justify-end gap-1.5 md:gap-4">
              <motion.button
                type="button"
                onClick={handleThemeToggle}
                aria-label={isLightMode ? 'Switch to dark mode' : 'Switch to light mode'}
                className="relative inline-flex h-9 w-9 items-center justify-center rounded border border-border bg-card/60 text-foreground/70 transition-colors hover:border-primary hover:text-primary md:h-10 md:w-10"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
              >
                {isMounted && isLightMode ? (
                  <Moon className="h-4 w-4 md:h-5 md:w-5" />
                ) : (
                  <Sun className="h-4 w-4 md:h-5 md:w-5" />
                )}
              </motion.button>

              <motion.button
                onClick={openCart}
                className="relative inline-flex items-center gap-2 p-2 text-foreground/70 hover:text-primary transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <ShoppingCart className="w-5 h-5 md:h-6 md:w-6" />
                <span className="hidden sm:inline font-rajdhani text-sm">
                  Bag ({totalItems})
                </span>
                <AnimatePresence>
                  {totalItems > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center"
                    >
                      {totalItems}
                    </motion.span>
                  )}
                </AnimatePresence>
                {/* Glow effect */}
                {totalItems > 0 && (
                  <span className="absolute inset-0 bg-primary/20 blur-lg rounded-full animate-pulse" />
                )}
              </motion.button>

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-foreground/70 hover:text-primary transition-colors md:hidden"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <form onSubmit={handleSearch} className="pb-3 md:hidden">
            <div className="flex">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search products..."
                  className="h-10 w-full border border-border bg-muted/20 pl-10 pr-3 font-rajdhani text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
                />
              </div>
              <button
                type="submit"
                className="inline-flex h-10 w-11 shrink-0 items-center justify-center border border-l-0 border-primary font-orbitron text-xs font-semibold uppercase text-primary"
                aria-label="Search products"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>

        {/* Ticker */}
        <div className="overflow-hidden border-t border-border/70 bg-background/90">
          <div className="flex h-7 items-center whitespace-nowrap font-rajdhani text-xs text-foreground/80 md:h-9 md:text-sm">
            <motion.div
              className="flex gap-12"
              animate={{ x: ['0%', '-50%'] }}
              transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
            >
              {[0, 1].map((set) => (
                <div key={set} className="flex gap-12">
                  <span><strong className="text-primary">Supply Chain Notice:</strong> Fast delivery on available builds and components.</span>
                  <span><strong className="text-primary">Custom Builds:</strong> Choose your parts and build from scratch.</span>
                  <span><strong className="text-primary">Support:</strong> Need help choosing hardware? Message us before ordering.</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden border-t border-border/70 bg-background/95 backdrop-blur-lg md:hidden"
            >
              <div className="max-h-[calc(100svh-9rem)] overflow-y-auto px-4 py-6">
                <div className="flex flex-col items-center gap-6">
                  {categoryLinks.map((link, i) => (
                    <motion.div
                      key={link.name}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="text-center"
                    >
                      <Link
                        to={link.path}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="font-orbitron text-base font-bold uppercase text-foreground transition-colors hover:text-primary sm:text-xl"
                      >
                        {link.name}
                      </Link>
                      {link.children && (
                        <div className="mt-3 flex max-w-[18rem] flex-wrap justify-center gap-2">
                          {link.children.map((child) => (
                            <Link
                              key={child.name}
                              to={child.path}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className="rounded border border-border bg-card/70 px-2.5 py-1.5 font-rajdhani text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary"
                            >
                              {child.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Sticky category row */}
      <div className="sticky top-0 z-50 hidden border-y border-border/70 bg-card/90 backdrop-blur-lg md:block">
        <div className="container mx-auto px-4">
          <div className="grid h-12 grid-cols-[auto_1fr_auto] items-center gap-6">
            <Link to="/" className="flex items-center gap-2 text-primary">
              <Cpu className="h-7 w-7" />
            </Link>

            <div className="flex h-12 items-center justify-center gap-7">
              {categoryLinks.map((link) => (
                <div key={link.name} className="group relative flex h-12 items-center">
                  <Link
                    to={link.path}
                    className="relative inline-flex items-center gap-1 whitespace-nowrap font-rajdhani text-sm font-semibold uppercase tracking-wider text-foreground/80 transition-colors hover:text-primary"
                  >
                    <span className={cn(isActive(link.path) && 'text-primary')}>{link.name}</span>
                    {link.children && (
                      <ChevronDown className="w-3 h-3 transition-transform group-hover:rotate-180 group-focus-within:rotate-180" />
                    )}
                    <motion.span
                      className="absolute -bottom-3 left-0 h-0.5 w-full origin-left bg-gradient-cyber"
                      initial={{ scaleX: 0 }}
                      whileHover={{ scaleX: 1 }}
                      transition={{ duration: 0.25 }}
                    />
                  </Link>

                  {link.children && (
                    <div className="invisible absolute left-1/2 top-full z-50 w-56 -translate-x-1/2 translate-y-2 opacity-0 transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
                      <div className="mt-0 overflow-hidden rounded-lg border border-border bg-card/95 shadow-[0_18px_50px_hsl(var(--background)/0.45)] backdrop-blur-lg">
                        <div className="border-b border-border/70 px-4 py-3">
                          <p className="font-orbitron text-xs font-semibold uppercase tracking-wider text-primary">
                            {link.name}
                          </p>
                        </div>
                        <div className="py-2">
                          {link.children.map((child) => (
                            <Link
                              key={child.name}
                              to={child.path}
                              className="block px-4 py-2.5 font-rajdhani text-sm font-semibold text-foreground/75 transition-colors hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary focus:outline-none"
                            >
                              {child.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <motion.button
              onClick={openCart}
              className="relative inline-flex items-center justify-end gap-2 text-foreground/80 transition-colors hover:text-primary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="font-rajdhani text-sm font-semibold">Bag ({totalItems})</span>
              <AnimatePresence>
                {totalItems > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground"
                  >
                    {totalItems}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
