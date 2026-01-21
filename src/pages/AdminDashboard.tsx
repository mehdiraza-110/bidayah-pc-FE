import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import {
  Package,
  Users,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Plus,
  BarChart3,
  ArrowRight,
  Settings,
  RefreshCw,
} from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { CyberButton } from '@/components/ui/CyberButton';
import { NeonCard } from '@/components/ui/NeonCard';
import { getDashboardStatistics, type DashboardStatistics } from '@/services/api';
import { toast } from 'sonner';

const AdminDashboardPage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [statistics, setStatistics] = useState<DashboardStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (containerRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(containerRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }
        );
      });

      return () => ctx.revert();
    }
  }, []);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    setIsLoading(true);
    try {
      const response = await getDashboardStatistics();
      if (response.success && response.data) {
        setStatistics(response.data);
      } else {
        toast.error('Failed to load statistics', {
          description: response.message || response.error,
        });
      }
    } catch (error) {
      toast.error('Error loading statistics', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const stats = statistics ? [
    {
      label: 'Total Products',
      value: statistics.total_published_products.toLocaleString(),
      subtitle: 'Published Products',
      icon: Package,
      color: 'cyan',
    },
    {
      label: 'Total Orders',
      value: statistics.total_orders_this_month.toLocaleString(),
      subtitle: `This Month (${statistics.month})`,
      icon: ShoppingCart,
      color: 'purple',
    },
    {
      label: 'Revenue',
      value: `AED ${statistics.total_revenue_this_month.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: `This Month (${statistics.month})`,
      icon: DollarSign,
      color: 'green',
    },
  ] : [];

  const quickActions = [
    {
      title: 'Manage Products',
      description: 'Add, edit, or remove products',
      icon: Package,
      path: '/admin/products',
      color: 'cyan',
    },
    {
      title: 'View Orders',
      description: 'Track and manage orders',
      icon: ShoppingCart,
      path: '/admin/orders',
      color: 'purple',
    },
    {
      title: 'Analytics',
      description: 'View sales and performance',
      icon: BarChart3,
      path: '/admin/analytics',
      color: 'green',
    },
    {
      title: 'Settings',
      description: 'Configure system settings',
      icon: Settings,
      path: '/admin/settings',
      color: 'cyan',
    },
  ];

  return (
    <AdminLayout>
      <div className="p-6" ref={containerRef}>
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-orbitron text-3xl font-bold mb-2">
              DASHBOARD <span className="text-primary">OVERVIEW</span>
            </h1>
            <p className="text-muted-foreground">
              Welcome back, Administrator
              {statistics && ` • ${statistics.month}`}
            </p>
          </div>
          <CyberButton
            variant="outline"
            size="sm"
            onClick={loadStatistics}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </CyberButton>
        </div>
        {/* Stats Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((index) => (
              <NeonCard key={index} className="p-6 h-full" glowColor="cyan" hover={false}>
                <div className="flex items-center justify-center h-32">
                  <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              </NeonCard>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="h-full"
                >
                  <NeonCard className="p-6 h-full" glowColor={stat.color as 'cyan' | 'purple' | 'green'} hover={false}>
                    <div className="flex items-start justify-between h-full">
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground mb-2">{stat.label}</p>
                        <p className="font-orbitron text-3xl font-bold mb-1">{stat.value}</p>
                        {stat.subtitle && (
                          <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                        )}
                      </div>
                      <div className="p-3 bg-primary/10 rounded-lg flex-shrink-0">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                  </NeonCard>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Quick Actions */}
        <NeonCard className="p-6" glowColor="cyan" hover={false}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-orbitron text-xl font-bold">QUICK ACTIONS</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.div
                  key={action.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                >
                  <Link to={action.path}>
                    <motion.div
                      className="p-5 rounded-lg border-2 border-border bg-muted/30 transition-all cursor-pointer group"
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <h3 className="font-rajdhani font-semibold text-lg mb-1">
                        {action.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">{action.description}</p>
                    </motion.div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </NeonCard>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboardPage;

