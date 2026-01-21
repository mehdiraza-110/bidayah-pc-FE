import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import {
  ShoppingCart,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
  RefreshCw,
  FileText,
} from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { NeonCard } from '@/components/ui/NeonCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CyberButton } from '@/components/ui/CyberButton';
import { DatePicker } from '@/components/ui/DatePicker';
import { cn } from '@/lib/utils';
import { getOrders, updateOrderStatus, type Order } from '@/services/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import InvoiceGenerator from '@/components/InvoiceGenerator';

type OrderStatus = 'pending' | 'pending_payment' | 'agent_review' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

const statusConfig: Record<OrderStatus, { icon: typeof Clock; color: string; bg: string; border: string }> = {
  pending: { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
  pending_payment: { icon: Clock, color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
  agent_review: { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  confirmed: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/30' },
  processing: { icon: Package, color: 'text-cyan-500', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' },
  shipped: { icon: Truck, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  delivered: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-600/10', border: 'border-green-600/30' },
  cancelled: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/30' },
};

const AdminOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load orders from API
  useEffect(() => {
    loadOrders();
  }, [currentPage, itemsPerPage, statusFilter, paymentMethodFilter, dateFrom, dateTo]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        loadOrders();
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const filters: any = {
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
      };

      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }

      if (paymentMethodFilter !== 'all') {
        filters.payment_method = paymentMethodFilter;
      }

      if (searchQuery) {
        // Try order number first, then email
        if (searchQuery.toUpperCase().startsWith('ORD-')) {
          filters.order_number = searchQuery;
        } else {
          filters.shipping_email = searchQuery;
        }
      }

      if (dateFrom) {
        filters.date_from = format(dateFrom, 'yyyy-MM-dd');
      }

      if (dateTo) {
        filters.date_to = format(dateTo, 'yyyy-MM-dd');
      }

      const response = await getOrders(filters);
      
      if (response.success && response.data) {
        setOrders(response.data);
        // If API returns count, use it; otherwise use array length
        setTotalCount((response as any).count || response.data.length);
      } else {
        toast.error('Failed to load orders', {
          description: response.message || response.error,
        });
      }
    } catch (error) {
      toast.error('Error loading orders', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
    } finally {
      setIsLoading(false);
    }
  };

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

  // Pagination calculations
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, paymentMethodFilter, dateFrom, dateTo, itemsPerPage]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPaymentMethodFilter('all');
    setDateFrom(undefined);
    setDateTo(undefined);
    setCurrentPage(1);
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await updateOrderStatus(orderId, newStatus);
      
      if (response.success && response.data) {
        toast.success('Order status updated successfully');
        // Reload orders
        loadOrders();
      } else {
        toast.error('Failed to update order status', {
          description: response.message || response.error,
        });
      }
    } catch (error) {
      toast.error('Error updating order status', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
    }
  };

  return (
    <AdminLayout>
      <div className="p-6" ref={containerRef}>
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-orbitron text-3xl font-bold mb-2">
            ORDER <span className="text-primary">MANAGEMENT</span>
          </h1>
          <p className="text-muted-foreground">Track and manage customer orders</p>
        </div>

        {/* Filters */}
        <NeonCard className="p-6 mb-6" glowColor="cyan" hover={false}>
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search orders, customers, emails, or payment methods..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Status Filter */}
              <div>
                <Label className="text-xs mb-2 block">Status</Label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="pending_payment">Pending Payment</option>
                  <option value="agent_review">Agent Review</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Payment Method Filter */}
              <div>
                <Label className="text-xs mb-2 block">Payment Method</Label>
                <select
                  value={paymentMethodFilter}
                  onChange={(e) => setPaymentMethodFilter(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="all">All Methods</option>
                  <option value="bank-transfer">Bank Transfer</option>
                  <option value="agent">Agent</option>
                </select>
              </div>

              {/* Date From */}
              <div>
                <Label className="text-xs mb-2 block">Date From</Label>
                <DatePicker
                  date={dateFrom}
                  onDateChange={setDateFrom}
                  placeholder="Select start date"
                  maxDate={dateTo}
                />
              </div>

              {/* Date To */}
              <div>
                <Label className="text-xs mb-2 block">Date To</Label>
                <DatePicker
                  date={dateTo}
                  onDateChange={setDateTo}
                  placeholder="Select end date"
                  minDate={dateFrom}
                />
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <CyberButton
                  variant="outline"
                  size="sm"
                  onClick={handleClearFilters}
                  className="w-full"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear Filters
                </CyberButton>
              </div>
            </div>

            {/* Results count and items per page */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span>
                  Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, totalCount)} of {totalCount} orders
                </span>
                <button
                  onClick={loadOrders}
                  className="p-1 hover:bg-muted rounded transition-colors"
                  title="Refresh orders"
                >
                  <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs">Items per page:</Label>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                </select>
              </div>
            </div>
          </div>
        </NeonCard>

        {/* Orders Table */}
        <NeonCard className="p-6" glowColor="purple" hover={false}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-orbitron text-sm text-muted-foreground">Order #</th>
                  <th className="text-left p-4 font-orbitron text-sm text-muted-foreground">Customer</th>
                  <th className="text-left p-4 font-orbitron text-sm text-muted-foreground">Items</th>
                  <th className="text-left p-4 font-orbitron text-sm text-muted-foreground">Total</th>
                  <th className="text-left p-4 font-orbitron text-sm text-muted-foreground">Status</th>
                  <th className="text-left p-4 font-orbitron text-sm text-muted-foreground">Date & Payment</th>
                  <th className="text-left p-4 font-orbitron text-sm text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin" />
                      Loading orders...
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-30" />
                      <p>No orders found</p>
                    </td>
                  </tr>
                ) : (
                  orders.map((order, index) => {
                    const orderStatus = order.status as OrderStatus;
                    const statusConfigItem = statusConfig[orderStatus] || statusConfig.pending;
                    const StatusIcon = statusConfigItem.icon;
                    const customerName = `${order.shipping_info.first_name} ${order.shipping_info.last_name}`;
                    const itemsCount = order.items?.length || 0;
                    const orderDate = format(new Date(order.created_at), 'MMM dd, yyyy');
                    
                    return (
                      <motion.tr
                        key={order.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-border hover:bg-muted/30 transition-colors"
                      >
                        <td className="p-4">
                          <span className="font-mono-tech text-primary">{order.order_number}</span>
                        </td>
                        <td className="p-4">
                          <div>
                            <p className="font-rajdhani font-semibold">{customerName}</p>
                            <p className="text-sm text-muted-foreground">{order.shipping_info.email}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="font-mono-tech">{itemsCount}</span>
                        </td>
                        <td className="p-4">
                          <span className="font-orbitron font-bold text-primary">
                            AED {order.total.toLocaleString()}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className={cn(
                            "inline-flex items-center gap-2 px-3 py-1 rounded-lg border",
                            statusConfigItem.bg,
                            statusConfigItem.border
                          )}>
                            <StatusIcon className={cn("w-4 h-4", statusConfigItem.color)} />
                            <span className="text-sm capitalize">{order.status.replace('_', ' ')}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div>
                            <span className="text-sm text-muted-foreground">{orderDate}</span>
                            <p className="text-xs text-muted-foreground/70 capitalize">
                              {order.payment_method.replace('-', ' ')}
                            </p>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <CyberButton 
                              size="sm" 
                              variant="outline"
                              onClick={() => navigate(`/admin/orders/${order.id}`)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </CyberButton>
                            <CyberButton 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedOrderForInvoice(order);
                                setIsInvoiceModalOpen(true);
                              }}
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              Invoice
                            </CyberButton>
                            <select
                              value={order.status}
                              onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                              className="h-8 rounded-md border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              <option value="pending">Pending</option>
                              <option value="pending_payment">Pending Payment</option>
                              <option value="agent_review">Agent Review</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="processing">Processing</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>


          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <CyberButton
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </CyberButton>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                  // Show first page, last page, current page, and pages around current
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={cn(
                          "w-10 h-10 rounded-lg border transition-colors",
                          currentPage === page
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border hover:bg-muted"
                        )}
                      >
                        {page}
                      </button>
                    );
                  } else if (
                    page === currentPage - 2 ||
                    page === currentPage + 2
                  ) {
                    return (
                      <span key={page} className="px-2 text-muted-foreground">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
              </div>

              <CyberButton
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </CyberButton>
            </div>
          )}
        </NeonCard>
      </div>

      {/* Invoice Generator Modal */}
      <InvoiceGenerator
        order={selectedOrderForInvoice}
        open={isInvoiceModalOpen}
        onOpenChange={setIsInvoiceModalOpen}
      />
    </AdminLayout>
  );
};

export default AdminOrdersPage;

