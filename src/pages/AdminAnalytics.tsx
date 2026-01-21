import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Package,
  RefreshCw,
  BarChart3,
} from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { NeonCard } from '@/components/ui/NeonCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { cn } from '@/lib/utils';
import { getDashboardStatistics, getTopProducts, getMonthlySales, type DashboardStatistics, type TopProduct, type MonthlySalesData } from '@/services/api';
import { toast } from 'sonner';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';

const AdminAnalyticsPage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [statistics, setStatistics] = useState<DashboardStatistics | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [monthlySalesData, setMonthlySalesData] = useState<MonthlySalesData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTopProducts, setIsLoadingTopProducts] = useState(true);
  const [isLoadingMonthlySales, setIsLoadingMonthlySales] = useState(true);

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
    loadTopProducts();
    loadMonthlySales();
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

  const loadTopProducts = async () => {
    setIsLoadingTopProducts(true);
    try {
      const response = await getTopProducts(5);
      if (response.success && response.data) {
        setTopProducts(response.data);
      } else {
        toast.error('Failed to load top products', {
          description: response.message || response.error,
        });
      }
    } catch (error) {
      toast.error('Error loading top products', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
    } finally {
      setIsLoadingTopProducts(false);
    }
  };

  const loadMonthlySales = async () => {
    setIsLoadingMonthlySales(true);
    try {
      const response = await getMonthlySales();
      if (response.success && response.data) {
        setMonthlySalesData(response.data);
      } else {
        toast.error('Failed to load monthly sales', {
          description: response.message || response.error,
        });
      }
    } catch (error) {
      toast.error('Error loading monthly sales', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
    } finally {
      setIsLoadingMonthlySales(false);
    }
  };

  // Transform monthly sales data for chart
  const chartData = monthlySalesData.map((monthData) => {
    // Calculate total sales (revenue) for the month
    const totalSales = monthData.products.reduce((sum, product) => sum + product.revenue, 0);
    
    // Get month abbreviation from month_name (e.g., "January 2024" -> "Jan")
    const monthName = monthData.month_name.split(' ')[0];
    const monthAbbr = monthName.substring(0, 3);
    
    return {
      month: monthAbbr,
      monthFull: monthData.month_name,
      sales: totalSales,
      products: monthData.products,
      monthKey: monthData.month,
    };
  });

  const chartConfig: ChartConfig = {
    sales: {
      label: 'Sales',
      color: 'hsl(var(--primary))',
    },
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

  return (
    <AdminLayout>
      <div className="p-6" ref={containerRef}>
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-orbitron text-3xl font-bold mb-2">
              ANALYTICS <span className="text-primary">DASHBOARD</span>
            </h1>
            <p className="text-muted-foreground">
              Track your business performance
              {statistics && ` • ${statistics.month}`}
            </p>
          </div>
          <CyberButton
            variant="outline"
            size="sm"
            onClick={() => {
              loadStatistics();
              loadTopProducts();
              loadMonthlySales();
            }}
            disabled={isLoading || isLoadingTopProducts || isLoadingMonthlySales}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading || isLoadingTopProducts || isLoadingMonthlySales ? 'animate-spin' : ''}`} />
            Refresh
          </CyberButton>
        </div>

        {/* Stats Grid - Same as Dashboard */}
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

        {/* Monthly Sales Chart */}
        <NeonCard className="p-6 mb-8" glowColor="cyan" hover={false}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-orbitron text-xl font-bold">MONTHLY SALES</h2>
            <BarChart3 className="w-6 h-6 text-primary" />
          </div>
          {isLoadingMonthlySales ? (
            <div className="flex items-center justify-center h-[400px]">
              <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex items-center justify-center h-[400px] text-muted-foreground">
              <div className="text-center">
                <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p>No monthly sales data available</p>
              </div>
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-[400px] w-full">
              <LineChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  stroke="hsl(var(--border))"
                />
                <YAxis
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  stroke="hsl(var(--border))"
                  tickFormatter={(value) => `AED ${(value / 1000).toFixed(0)}k`}
                />
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const products = data.products || [];
                      
                      return (
                        <div className="rounded-lg border border-border/50 bg-background p-4 shadow-xl min-w-[280px] max-w-md">
                          <div className="mb-3 pb-2 border-b border-border">
                            <p className="font-orbitron font-semibold text-sm mb-1">{data.monthFull}</p>
                            <p className="text-primary font-orbitron text-lg">
                              AED {data.sales?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          </div>
                          {products.length > 0 ? (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                              <p className="text-xs font-semibold text-muted-foreground mb-2">PRODUCTS:</p>
                              {products.map((product: any) => (
                                <div
                                  key={product.product_id}
                                  className="flex items-start justify-between gap-2 p-2 bg-muted/30 rounded text-xs"
                                >
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold truncate">{product.product_name}</p>
                                    {product.category && (
                                      <p className="text-muted-foreground text-xs">{product.category}</p>
                                    )}
                                  </div>
                                  <div className="text-right flex-shrink-0">
                                    <p className="font-semibold text-primary">
                                      {product.sales_count} sold
                                    </p>
                                    <p className="text-muted-foreground text-xs">
                                      AED {product.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">No products sold this month</p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--primary))', r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ChartContainer>
          )}
        </NeonCard>

        {/* Top Products by Sales */}
        <NeonCard className="p-6" glowColor="purple" hover={false}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-orbitron text-xl font-bold">TOP 5 PRODUCTS BY SALES</h2>
            <Package className="w-6 h-6 text-primary" />
          </div>
          {isLoadingTopProducts ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : topProducts.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Package className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p>No top products data available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <motion.div
                  key={product.product_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                      {product.product_image ? (
                        <img
                          src={product.product_image}
                          alt={product.product_name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Package className="w-8 h-8 text-primary" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-rajdhani font-semibold text-lg mb-1 truncate">
                          {product.product_name}
                        </h3>
                        {product.category && (
                          <p className="text-sm text-muted-foreground mb-1">
                            Category: {product.category}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                          <span>Quantity Sold: <span className="font-semibold text-foreground">{product.total_quantity_sold}</span></span>
                          <span>Orders: <span className="font-semibold text-foreground">{product.order_count}</span></span>
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="font-orbitron text-2xl font-bold text-primary mb-1">
                          #{index + 1}
                        </p>
                        <p className="text-xs text-muted-foreground">Rank</p>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-border">
                      <p className="text-sm text-muted-foreground">
                        Total Revenue: <span className="font-orbitron font-semibold text-primary">
                          AED {product.total_revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </NeonCard>
      </div>
    </AdminLayout>
  );
};

export default AdminAnalyticsPage;

