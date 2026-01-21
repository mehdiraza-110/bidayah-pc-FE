import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  CreditCard,
  FileText,
  Image as ImageIcon,
  RefreshCw,
  Save,
} from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { NeonCard } from '@/components/ui/NeonCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { getOrderById, updateOrderStatus, type Order } from '@/services/api';
import { toast } from 'sonner';
import { format } from 'date-fns';

type OrderStatus = 'pending' | 'pending_payment' | 'agent_review' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

const statusConfig: Record<OrderStatus, { icon: typeof Clock; color: string; bg: string; border: string; label: string }> = {
  pending: { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', label: 'Pending' },
  pending_payment: { icon: Clock, color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/30', label: 'Pending Payment' },
  agent_review: { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30', label: 'Agent Review' },
  confirmed: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/30', label: 'Confirmed' },
  processing: { icon: Package, color: 'text-cyan-500', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', label: 'Processing' },
  shipped: { icon: Truck, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/30', label: 'Shipped' },
  delivered: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-600/10', border: 'border-green-600/30', label: 'Delivered' },
  cancelled: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/30', label: 'Cancelled' },
};

const AdminOrderDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      loadOrder();
    }
  }, [id]);

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

  const loadOrder = async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      const response = await getOrderById(id);
      
      if (response.success && response.data) {
        setOrder(response.data);
        setSelectedStatus(response.data.status);
      } else {
        toast.error('Failed to load order', {
          description: response.message || response.error,
        });
        navigate('/admin/orders');
      }
    } catch (error) {
      toast.error('Error loading order', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
      navigate('/admin/orders');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!order || !selectedStatus || selectedStatus === order.status) return;

    setIsUpdating(true);
    try {
      const response = await updateOrderStatus(order.id, selectedStatus);
      
      if (response.success && response.data) {
        setOrder(response.data);
        toast.success('Order status updated successfully');
      } else {
        toast.error('Failed to update order status', {
          description: response.message || response.error,
        });
        setSelectedStatus(order.status); // Reset on error
      }
    } catch (error) {
      toast.error('Error updating order status', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
      setSelectedStatus(order.status); // Reset on error
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-6" ref={containerRef}>
          <div className="text-center py-16">
            <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Loading order details...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!order) {
    return (
      <AdminLayout>
        <div className="p-6" ref={containerRef}>
          <div className="text-center py-16">
            <p className="text-muted-foreground">Order not found</p>
            <CyberButton onClick={() => navigate('/admin/orders')} className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Orders
            </CyberButton>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const orderStatus = order.status as OrderStatus;
  const statusConfigItem = statusConfig[orderStatus] || statusConfig.pending;
  const StatusIcon = statusConfigItem.icon;
  const orderDate = format(new Date(order.created_at), 'PPpp');
  const updatedDate = format(new Date(order.updated_at), 'PPpp');

  return (
    <AdminLayout>
      <div className="p-6" ref={containerRef}>
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-orbitron text-3xl font-bold mb-2">
              ORDER <span className="text-primary">{order.order_number}</span>
            </h1>
            <p className="text-muted-foreground">Order Details & Management</p>
          </div>
          <CyberButton variant="outline" onClick={() => navigate('/admin/orders')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </CyberButton>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Order Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Status & Actions */}
            <NeonCard className="p-6" glowColor="cyan" hover={false}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "inline-flex items-center gap-2 px-4 py-2 rounded-lg border",
                    statusConfigItem.bg,
                    statusConfigItem.border
                  )}>
                    <StatusIcon className={cn("w-5 h-5", statusConfigItem.color)} />
                    <span className="font-semibold capitalize">{order.status.replace('_', ' ')}</span>
                  </div>
                  <span className="text-sm text-muted-foreground capitalize">
                    Payment: {order.payment_method.replace('-', ' ')}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm mb-2 block">Update Status</Label>
                  <div className="flex gap-2">
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                    <CyberButton
                      onClick={handleStatusUpdate}
                      disabled={isUpdating || selectedStatus === order.status}
                      size="sm"
                    >
                      {isUpdating ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Update
                        </>
                      )}
                    </CyberButton>
                  </div>
                </div>
              </div>
            </NeonCard>

            {/* Order Items */}
            <NeonCard className="p-6" glowColor="purple" hover={false}>
              <div className="flex items-center gap-3 mb-6">
                <Package className="w-5 h-5 text-primary" />
                <h2 className="font-orbitron text-xl font-bold">ORDER ITEMS</h2>
              </div>

              <div className="space-y-4">
                {order.items?.map((item, index) => (
                  <motion.div
                    key={item.id || index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-4 p-4 border border-border rounded-lg bg-muted/30"
                  >
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{item.name}</h3>
                      {item.category && (
                        <p className="text-sm text-muted-foreground mb-1">Category: {item.category}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Qty: {item.quantity}</span>
                        <span>Price: AED {item.price.toLocaleString()}</span>
                        <span className="font-semibold text-foreground">Subtotal: AED {item.subtotal.toLocaleString()}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-semibold">AED {order.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-muted-foreground">Shipping:</span>
                  <span className="font-semibold">AED {order.shipping.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-muted-foreground">Tax:</span>
                  <span className="font-semibold">AED {order.tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-border">
                  <span className="font-orbitron text-lg font-bold">Total:</span>
                  <span className="font-orbitron text-xl font-bold text-primary">AED {order.total.toLocaleString()}</span>
                </div>
              </div>
            </NeonCard>

            {/* Shipping Information */}
            <NeonCard className="p-6" glowColor="green" hover={false}>
              <div className="flex items-center gap-3 mb-6">
                <Truck className="w-5 h-5 text-primary" />
                <h2 className="font-orbitron text-xl font-bold">SHIPPING INFORMATION</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1">Name</Label>
                  <p className="font-semibold">{order.shipping_info.first_name} {order.shipping_info.last_name}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1">Email</Label>
                  <p className="font-semibold">{order.shipping_info.email}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1">Phone</Label>
                  <p className="font-semibold">{order.shipping_info.phone}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1">Address</Label>
                  <p className="font-semibold">{order.shipping_info.address}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1">City</Label>
                  <p className="font-semibold">{order.shipping_info.city}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1">State</Label>
                  <p className="font-semibold">{order.shipping_info.state}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1">ZIP Code</Label>
                  <p className="font-semibold">{order.shipping_info.zip_code}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1">Country</Label>
                  <p className="font-semibold">{order.shipping_info.country}</p>
                </div>
              </div>
            </NeonCard>

            {/* Billing Information */}
            <NeonCard className="p-6" glowColor="orange" hover={false}>
              <div className="flex items-center gap-3 mb-6">
                <CreditCard className="w-5 h-5 text-primary" />
                <h2 className="font-orbitron text-xl font-bold">BILLING INFORMATION</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1">Name</Label>
                  <p className="font-semibold">{order.billing_info.first_name} {order.billing_info.last_name}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1">Email</Label>
                  <p className="font-semibold">{order.billing_info.email}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1">Address</Label>
                  <p className="font-semibold">{order.billing_info.address}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1">City</Label>
                  <p className="font-semibold">{order.billing_info.city}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1">State</Label>
                  <p className="font-semibold">{order.billing_info.state}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1">ZIP Code</Label>
                  <p className="font-semibold">{order.billing_info.zip_code}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1">Country</Label>
                  <p className="font-semibold">{order.billing_info.country}</p>
                </div>
              </div>
            </NeonCard>
          </div>

          {/* Right Column - Payment Screenshot & Order Info */}
          <div className="space-y-6">
            {/* Payment Screenshot (Bank Transfer Only) */}
            {order.payment_method === 'bank-transfer' && order.payment_screenshot_url && (
              <NeonCard className="p-6" glowColor="blue" hover={false}>
                <div className="flex items-center gap-3 mb-4">
                  <ImageIcon className="w-5 h-5 text-primary" />
                  <h2 className="font-orbitron text-lg font-bold">PAYMENT SCREENSHOT</h2>
                </div>
                <div className="relative">
                  <img
                    src={order.payment_screenshot_url}
                    alt="Payment screenshot"
                    className="w-full rounded-lg border border-border cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => window.open(order.payment_screenshot_url!, '_blank')}
                  />
                </div>
              </NeonCard>
            )}

            {/* Order Metadata */}
            <NeonCard className="p-6" glowColor="cyan" hover={false}>
              <div className="flex items-center gap-3 mb-6">
                <FileText className="w-5 h-5 text-primary" />
                <h2 className="font-orbitron text-lg font-bold">ORDER INFO</h2>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1">Order Number</Label>
                  <p className="font-mono-tech text-primary font-semibold">{order.order_number}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1">Order ID</Label>
                  <p className="font-mono text-xs break-all">{order.id}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1">Payment Method</Label>
                  <p className="font-semibold capitalize">{order.payment_method.replace('-', ' ')}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1">Items Count</Label>
                  <p className="font-semibold">{order.items?.length || 0} items</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1">Created At</Label>
                  <p className="font-semibold">{orderDate}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1">Last Updated</Label>
                  <p className="font-semibold">{updatedDate}</p>
                </div>
              </div>
            </NeonCard>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminOrderDetailPage;
