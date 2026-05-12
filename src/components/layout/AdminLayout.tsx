import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Package,
  Store,
  Folder,
  Palette,
  ShoppingCart,
  BarChart3,
  LogOut,
  Menu,
  X,
  Shield,
  Star,
  CreditCard,
  SlidersHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { GridBackground } from '@/components/effects/GridBackground';
import { useIsMobile } from '@/hooks/use-mobile';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/admin/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Products',
      path: '/admin/products',
      icon: Package,
    },
    {
      name: 'Vendors',
      path: '/admin/vendors',
      icon: Store,
    },
    {
      name: 'Categories',
      path: '/admin/categories',
      icon: Folder,
    },
    {
      name: 'Customization',
      path: '/admin/customization',
      icon: Palette,
    },
    {
      name: 'Orders',
      path: '/admin/orders',
      icon: ShoppingCart,
    },
    {
      name: 'Featured Products',
      path: '/admin/featured-products',
      icon: Star,
    },
    {
      name: 'Filter Rules',
      path: '/admin/filter-rules',
      icon: SlidersHorizontal,
    },
    {
      name: 'Billing',
      path: '/admin/billing',
      icon: CreditCard,
    },
    {
      name: 'Analytics',
      path: '/admin/analytics',
      icon: BarChart3,
    },
  ];

  const isActive = (path: string) => {
    if (path === '/admin/dashboard') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Background */}
      <div className="fixed inset-0">
        <GridBackground />
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
            />
          </>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ 
          x: isMobile ? (isSidebarOpen ? 0 : -300) : 0
        }}
        className={cn(
          "fixed md:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col",
          "md:translate-x-0"
        )}
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <Link to="/admin/dashboard" className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <span className="font-orbitron text-xl font-bold">
                ADMIN
              </span>
            </Link>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link key={item.path} to={item.path} onClick={() => setIsSidebarOpen(false)}>
                <motion.div
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer group",
                    active
                      ? "bg-primary/10 border border-primary/30 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/30 border border-transparent"
                  )}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-rajdhani font-semibold">{item.name}</span>
                  {active && (
                    <motion.div
                      layoutId="activeSidebar"
                      className="ml-auto w-2 h-2 bg-primary rounded-full"
                    />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-border">
          <motion.button
            onClick={() => navigate('/admin/login')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/30 transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <LogOut className="w-5 h-5" />
            <span className="font-rajdhani font-semibold">Logout</span>
          </motion.button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative z-10">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between px-4 py-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex-1" />
            <Link
              to="/"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Back to Store
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
