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
  Save,
  Cpu,
  Pencil,
  Plus,
  Trash2,
  X,
  Search,
} from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { NeonCard } from '@/components/ui/NeonCard';
import { Loader } from '@/components/ui/Loader';
import { CyberButton } from '@/components/ui/CyberButton';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  getOrderById,
  updateOrderStatus,
  updateOrder,
  getProducts,
  type Order,
  type OrderItem,
  type OrderItemComponent,
  type Product,
} from '@/services/api';
import { toast } from 'sonner';
import { format } from 'date-fns';

// Local editable shape for the item list while the admin is editing an order:
// same fields as OrderItem, plus a stable `_key` for React lists (item.id is
// just the client-generated product_id and isn't guaranteed unique/stable
// once new items are added), and components default to [] so rows always
// render controlled inputs.
interface EditableItem extends Omit<OrderItem, 'components'> {
  _key: string;
  components: OrderItemComponent[];
}

type EditableInfo = Order['shipping_info'];

const blankInfo = (): EditableInfo => ({
  first_name: '', last_name: '', email: '', phone: '', address: '', city: '', state: '', zip_code: '', country: '',
});

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

  // Full order edit mode — items, customer info, shipping/tax. Seeded from
  // `order` when edit mode is entered; discarded (not written back) on cancel.
  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [editItems, setEditItems] = useState<EditableItem[]>([]);
  const [editShippingInfo, setEditShippingInfo] = useState<EditableInfo>(blankInfo());
  const [editBillingInfo, setEditBillingInfo] = useState<EditableInfo>(blankInfo());
  const [editShippingCost, setEditShippingCost] = useState(0);
  const [editTax, setEditTax] = useState(0);
  // Total normally tracks subtotal+shipping+tax automatically; once the admin
  // types into the Total field directly it's "overridden" and stops
  // following further item/shipping/tax edits (their typed price wins), until
  // they hit "Use calculated" to go back to auto mode.
  const [editTotal, setEditTotal] = useState(0);
  const [isTotalOverridden, setIsTotalOverridden] = useState(false);

  // Search-and-link-a-product picker for one item row at a time (the item's
  // _key currently open, or null when closed).
  const [productPickerKey, setProductPickerKey] = useState<string | null>(null);
  const [productSearchText, setProductSearchText] = useState('');
  const [productSearchResults, setProductSearchResults] = useState<Product[]>([]);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);

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

  const startEditingOrder = () => {
    if (!order) return;
    setEditItems(order.items.map((item, index) => ({
      ...item,
      _key: `${item.id}-${index}-${Date.now()}`,
      components: item.components ? [...item.components] : [],
    })));
    setEditShippingInfo({ ...blankInfo(), ...order.shipping_info });
    setEditBillingInfo({ ...blankInfo(), ...order.billing_info });
    setEditShippingCost(Number(order.shipping) || 0);
    setEditTax(Number(order.tax) || 0);
    setEditTotal(Number(order.total) || 0);
    setIsTotalOverridden(false);
    setIsEditingOrder(true);
  };

  const cancelEditingOrder = () => {
    setIsEditingOrder(false);
  };

  const updateEditItem = <K extends keyof EditableItem>(key: string, field: K, value: EditableItem[K]) => {
    setEditItems((prev) => prev.map((item) => (item._key === key ? { ...item, [field]: value } : item)));
  };

  const removeEditItem = (key: string) => {
    setEditItems((prev) => prev.filter((item) => item._key !== key));
  };

  const addEditItem = () => {
    setEditItems((prev) => [
      ...prev,
      {
        _key: `new-${Date.now()}`,
        id: `manual-${Date.now()}`,
        name: '',
        price: 0,
        quantity: 1,
        category: '',
        components: [],
      },
    ]);
  };

  const updateEditComponent = (itemKey: string, index: number, field: keyof OrderItemComponent, value: string | number) => {
    setEditItems((prev) => prev.map((item) => {
      if (item._key !== itemKey) return item;
      const components = item.components.map((component, i) => (i === index ? { ...component, [field]: value } : component));
      return { ...item, components };
    }));
  };

  const removeEditComponent = (itemKey: string, index: number) => {
    setEditItems((prev) => prev.map((item) => {
      if (item._key !== itemKey) return item;
      return { ...item, components: item.components.filter((_, i) => i !== index) };
    }));
  };

  const addEditComponent = (itemKey: string) => {
    setEditItems((prev) => prev.map((item) => {
      if (item._key !== itemKey) return item;
      return { ...item, components: [...item.components, { category: '', name: '', quantity: 1 }] };
    }));
  };

  // Search-and-link-a-product for an item row — lets the admin pick a real
  // catalog product instead of typing a free-text name, auto-filling
  // name/price/category/image/vendor from it.
  useEffect(() => {
    if (!productPickerKey) {
      setProductSearchResults([]);
      return;
    }
    const handle = setTimeout(async () => {
      if (!productSearchText.trim()) {
        setProductSearchResults([]);
        return;
      }
      setIsSearchingProducts(true);
      try {
        const response = await getProducts({ search: productSearchText.trim() });
        if (response.success && response.data) {
          setProductSearchResults(response.data.slice(0, 20));
        }
      } finally {
        setIsSearchingProducts(false);
      }
    }, 300);

    return () => clearTimeout(handle);
  }, [productSearchText, productPickerKey]);

  const openProductPicker = (itemKey: string) => {
    setProductPickerKey((prev) => (prev === itemKey ? null : itemKey));
    setProductSearchText('');
    setProductSearchResults([]);
  };

  const selectProductForItem = (itemKey: string, product: Product) => {
    const vendorId = product.vendors?.[0]?.id || product.vendor_id;
    setEditItems((prev) => prev.map((item) => (item._key === itemKey ? {
      ...item,
      id: product.id,
      name: product.name,
      price: Number(product.price) || 0,
      category: product.category_name || item.category,
      image: product.image || item.image,
      vendor_id: vendorId || item.vendor_id,
    } : item)));
    setProductPickerKey(null);
    setProductSearchText('');
    setProductSearchResults([]);
  };

  const editSubtotal = editItems.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0);
  const computedTotal = editSubtotal + (Number(editShippingCost) || 0) + (Number(editTax) || 0);

  // Keep Total following the computed sum until the admin types into it
  // directly (see isTotalOverridden above).
  useEffect(() => {
    if (isEditingOrder && !isTotalOverridden) {
      setEditTotal(computedTotal);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [computedTotal, isEditingOrder, isTotalOverridden]);

  const handleSaveOrder = async () => {
    if (!order) return;

    if (editItems.length === 0) {
      toast.error('At least one item is required');
      return;
    }
    for (const item of editItems) {
      if (!item.name.trim() || Number(item.price) <= 0 || Number(item.quantity) < 1) {
        toast.error('Each item needs a name, a price greater than 0, and a quantity of at least 1');
        return;
      }
    }
    if (!(Number(editTotal) > 0)) {
      toast.error('Total must be greater than 0');
      return;
    }

    setIsSavingOrder(true);
    try {
      const response = await updateOrder(order.id, {
        shipping_info: editShippingInfo,
        billing_info: editBillingInfo,
        shipping: Number(editShippingCost) || 0,
        tax: Number(editTax) || 0,
        total: Number(editTotal) || 0,
        items: editItems.map(({ _key, components, ...rest }) => ({
          ...rest,
          components: components.length > 0 ? components : undefined,
        })),
      });

      if (response.success && response.data) {
        setOrder(response.data);
        setIsEditingOrder(false);
        toast.success('Order updated successfully');
      } else {
        toast.error('Failed to update order', {
          description: response.message || response.error,
        });
      }
    } catch (error) {
      toast.error('Error updating order', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
    } finally {
      setIsSavingOrder(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-6" ref={containerRef}>
          <Loader label="Loading order details..." />
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
          <div className="flex items-center gap-2">
            {isEditingOrder ? (
              <>
                <CyberButton variant="outline" onClick={cancelEditingOrder} disabled={isSavingOrder}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </CyberButton>
                <CyberButton onClick={handleSaveOrder} disabled={isSavingOrder}>
                  {isSavingOrder ? <Loader size="sm" label="Saving..." /> : (<><Save className="w-4 h-4 mr-2" />Save Order</>)}
                </CyberButton>
              </>
            ) : (
              <CyberButton variant="outline" onClick={startEditingOrder}>
                <Pencil className="w-4 h-4 mr-2" />
                Edit Order
              </CyberButton>
            )}
            <CyberButton variant="outline" onClick={() => navigate('/admin/orders')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Orders
            </CyberButton>
          </div>
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
                        <Loader size="sm" label="Updating..." />
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

              {isEditingOrder ? (
                <div className="space-y-4">
                  {editItems.map((item) => (
                    <div key={item._key} className="p-4 border border-border rounded-lg bg-muted/30 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs text-muted-foreground">Product</Label>
                            <button
                              type="button"
                              onClick={() => openProductPicker(item._key)}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                            >
                              <Search className="w-3.5 h-3.5" />
                              {productPickerKey === item._key ? 'Close search' : 'Link a product from catalog'}
                            </button>
                          </div>

                          {productPickerKey === item._key && (
                            <div className="relative rounded-md border border-border bg-background p-2">
                              <Input
                                autoFocus
                                value={productSearchText}
                                onChange={(e) => setProductSearchText(e.target.value)}
                                placeholder="Search products by name..."
                              />
                              {isSearchingProducts ? (
                                <div className="mt-2"><Loader size="sm" label="Searching..." /></div>
                              ) : productSearchResults.length > 0 ? (
                                <div className="mt-2 max-h-56 overflow-y-auto rounded-md border border-border divide-y divide-border">
                                  {productSearchResults.map((product) => (
                                    <button
                                      type="button"
                                      key={product.id}
                                      onClick={() => selectProductForItem(item._key, product)}
                                      className="w-full flex items-center gap-3 p-2.5 text-left hover:bg-muted/30 transition-colors"
                                    >
                                      {product.image ? (
                                        <img src={product.image} alt="" className="h-9 w-9 rounded-md object-cover shrink-0" />
                                      ) : (
                                        <div className="h-9 w-9 rounded-md bg-muted shrink-0" />
                                      )}
                                      <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium truncate">{product.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                          AED {Number(product.price).toLocaleString()}
                                          {product.category_name ? ` · ${product.category_name}` : ''}
                                        </p>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              ) : productSearchText.trim() ? (
                                <p className="mt-2 text-xs text-muted-foreground">No products found.</p>
                              ) : null}
                            </div>
                          )}

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs text-muted-foreground mb-1">Name</Label>
                              <Input
                                value={item.name}
                                onChange={(e) => updateEditItem(item._key, 'name', e.target.value)}
                                placeholder="Item name"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground mb-1">Category</Label>
                              <Input
                                value={item.category || ''}
                                onChange={(e) => updateEditItem(item._key, 'category', e.target.value)}
                                placeholder="Category"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground mb-1">Price (AED)</Label>
                              <Input
                                type="number"
                                min={0}
                                step="0.01"
                                value={item.price}
                                onChange={(e) => updateEditItem(item._key, 'price', Number(e.target.value))}
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground mb-1">Quantity</Label>
                              <Input
                                type="number"
                                min={1}
                                step="1"
                                value={item.quantity}
                                onChange={(e) => updateEditItem(item._key, 'quantity', Number(e.target.value))}
                              />
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeEditItem(item._key)}
                          className="mt-6 p-2 rounded-md text-red-500 hover:bg-red-500/10 transition-colors"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex justify-end text-sm font-semibold text-foreground">
                        Subtotal: AED {((Number(item.price) || 0) * (Number(item.quantity) || 0)).toLocaleString()}
                      </div>

                      {/* Component breakdown — editable for bundled items (Custom
                          PC Build, prebuilt Gaming PC bundles). */}
                      <div className="pt-3 border-t border-border/60">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            <Cpu className="w-3.5 h-3.5" />
                            Components ({item.components.length})
                          </div>
                          <button
                            type="button"
                            onClick={() => addEditComponent(item._key)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Add Component
                          </button>
                        </div>
                        <div className="space-y-2">
                          {item.components.map((component, componentIndex) => (
                            <div key={componentIndex} className="grid grid-cols-2 sm:grid-cols-6 gap-2 items-center">
                              <Input
                                className="sm:col-span-1"
                                placeholder="Category"
                                value={component.category}
                                onChange={(e) => updateEditComponent(item._key, componentIndex, 'category', e.target.value)}
                              />
                              <Input
                                className="sm:col-span-2"
                                placeholder="Part name"
                                value={component.name}
                                onChange={(e) => updateEditComponent(item._key, componentIndex, 'name', e.target.value)}
                              />
                              <Input
                                className="sm:col-span-1"
                                placeholder="Vendor"
                                value={component.vendor || ''}
                                onChange={(e) => updateEditComponent(item._key, componentIndex, 'vendor', e.target.value)}
                              />
                              <Input
                                type="number"
                                min={1}
                                placeholder="Qty"
                                value={component.quantity}
                                onChange={(e) => updateEditComponent(item._key, componentIndex, 'quantity', Number(e.target.value))}
                              />
                              <div className="flex items-center gap-1">
                                <Input
                                  type="number"
                                  min={0}
                                  step="0.01"
                                  placeholder="Price"
                                  value={component.price ?? ''}
                                  onChange={(e) => updateEditComponent(item._key, componentIndex, 'price', Number(e.target.value))}
                                />
                                <button
                                  type="button"
                                  onClick={() => removeEditComponent(item._key, componentIndex)}
                                  className="p-2 rounded-md text-red-500 hover:bg-red-500/10 transition-colors shrink-0"
                                  aria-label="Remove component"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}

                  <CyberButton type="button" variant="outline" size="sm" onClick={addEditItem}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </CyberButton>
                </div>
              ) : (
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
                        <span>Price: AED {Number(item.price).toLocaleString()}</span>
                        <span className="font-semibold text-foreground">Subtotal: AED {Number(item.subtotal).toLocaleString()}</span>
                      </div>

                      {/* Itemized breakdown for bundled items (Custom PC Build,
                          prebuilt Gaming PC bundles) — shows what's actually
                          inside the single line item above. */}
                      {!!item.components?.length && (
                        <div className="mt-3 pt-3 border-t border-border/60">
                          <div className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            <Cpu className="w-3.5 h-3.5" />
                            Components ({item.components.length})
                          </div>
                          <div className="space-y-1.5">
                            {item.components.map((component, componentIndex) => (
                              <div
                                key={componentIndex}
                                className="flex items-center justify-between gap-3 text-sm"
                              >
                                <span className="text-foreground">
                                  <span className="text-muted-foreground">{component.category}:</span>{' '}
                                  {component.name}
                                  {component.quantity > 1 && (
                                    <span className="text-muted-foreground"> ×{component.quantity}</span>
                                  )}
                                  {component.vendor && (
                                    <span className="text-muted-foreground"> ({component.vendor})</span>
                                  )}
                                </span>
                                {typeof component.price === 'number' && component.price > 0 && (
                                  <span className="text-muted-foreground whitespace-nowrap">
                                    AED {component.price.toLocaleString()}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
              )}

              {isEditingOrder ? (
                <div className="mt-6 pt-6 border-t border-border space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-semibold">AED {editSubtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center gap-4">
                    <Label className="text-muted-foreground shrink-0">Shipping:</Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={editShippingCost}
                      onChange={(e) => setEditShippingCost(Number(e.target.value))}
                      className="max-w-[160px] text-right"
                    />
                  </div>
                  <div className="flex justify-between items-center gap-4">
                    <Label className="text-muted-foreground shrink-0">Tax:</Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={editTax}
                      onChange={(e) => setEditTax(Number(e.target.value))}
                      className="max-w-[160px] text-right"
                    />
                  </div>
                  <div className="pt-4 border-t border-border">
                    <div className="flex justify-between items-center gap-4">
                      <span className="font-orbitron text-lg font-bold shrink-0">Total:</span>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={editTotal}
                        onChange={(e) => {
                          setEditTotal(Number(e.target.value));
                          setIsTotalOverridden(true);
                        }}
                        className="max-w-[160px] text-right font-orbitron text-lg font-bold text-primary"
                      />
                    </div>
                    {isTotalOverridden && (
                      <div className="flex justify-end mt-1">
                        <button
                          type="button"
                          onClick={() => { setIsTotalOverridden(false); setEditTotal(computedTotal); }}
                          className="text-xs text-muted-foreground hover:text-primary hover:underline"
                        >
                          Use calculated total (AED {computedTotal.toLocaleString()})
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-6 pt-6 border-t border-border">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-semibold">AED {Number(order.subtotal).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-muted-foreground">Shipping:</span>
                    <span className="font-semibold">AED {Number(order.shipping).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-muted-foreground">Tax:</span>
                    <span className="font-semibold">AED {Number(order.tax).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-border">
                    <span className="font-orbitron text-lg font-bold">Total:</span>
                    <span className="font-orbitron text-xl font-bold text-primary">AED {Number(order.total).toLocaleString()}</span>
                  </div>
                </div>
              )}
            </NeonCard>

            {/* Customer Information — checkout only collects one combined
                name/email/phone/address, used for both shipping and billing.
                City/state/zip/country only show for older orders that still
                have that data (this build no longer collects it), and the
                billing card is only shown if it actually differs from the
                customer info (again, only possible on an older order). */}
            <NeonCard className="p-6" glowColor="green" hover={false}>
              <div className="flex items-center gap-3 mb-6">
                <Truck className="w-5 h-5 text-primary" />
                <h2 className="font-orbitron text-xl font-bold">CUSTOMER INFORMATION</h2>
              </div>

              {isEditingOrder ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1">First Name</Label>
                    <Input value={editShippingInfo.first_name} onChange={(e) => setEditShippingInfo((prev) => ({ ...prev, first_name: e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1">Last Name</Label>
                    <Input value={editShippingInfo.last_name} onChange={(e) => setEditShippingInfo((prev) => ({ ...prev, last_name: e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1">Email</Label>
                    <Input type="email" value={editShippingInfo.email} onChange={(e) => setEditShippingInfo((prev) => ({ ...prev, email: e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1">Phone</Label>
                    <Input value={editShippingInfo.phone} onChange={(e) => setEditShippingInfo((prev) => ({ ...prev, phone: e.target.value }))} />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-xs text-muted-foreground mb-1">Address</Label>
                    <Input value={editShippingInfo.address} onChange={(e) => setEditShippingInfo((prev) => ({ ...prev, address: e.target.value }))} />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1">Name</Label>
                    <p className="font-semibold">{`${order.shipping_info.first_name} ${order.shipping_info.last_name}`.trim()}</p>
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
                  {order.shipping_info.city && (
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1">City</Label>
                      <p className="font-semibold">{order.shipping_info.city}</p>
                    </div>
                  )}
                  {order.shipping_info.state && (
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1">State</Label>
                      <p className="font-semibold">{order.shipping_info.state}</p>
                    </div>
                  )}
                  {order.shipping_info.zip_code && (
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1">ZIP Code</Label>
                      <p className="font-semibold">{order.shipping_info.zip_code}</p>
                    </div>
                  )}
                  {order.shipping_info.country && (
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1">Country</Label>
                      <p className="font-semibold">{order.shipping_info.country}</p>
                    </div>
                  )}
                </div>
              )}
            </NeonCard>

            {(isEditingOrder ||
              order.billing_info.address !== order.shipping_info.address ||
              order.billing_info.email !== order.shipping_info.email) && (
              <NeonCard className="p-6" glowColor="orange" hover={false}>
                <div className="flex items-center gap-3 mb-6">
                  <CreditCard className="w-5 h-5 text-primary" />
                  <h2 className="font-orbitron text-xl font-bold">BILLING INFORMATION</h2>
                </div>

                {isEditingOrder ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1">First Name</Label>
                      <Input value={editBillingInfo.first_name} onChange={(e) => setEditBillingInfo((prev) => ({ ...prev, first_name: e.target.value }))} />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1">Last Name</Label>
                      <Input value={editBillingInfo.last_name} onChange={(e) => setEditBillingInfo((prev) => ({ ...prev, last_name: e.target.value }))} />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1">Email</Label>
                      <Input type="email" value={editBillingInfo.email} onChange={(e) => setEditBillingInfo((prev) => ({ ...prev, email: e.target.value }))} />
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-xs text-muted-foreground mb-1">Address</Label>
                      <Input value={editBillingInfo.address} onChange={(e) => setEditBillingInfo((prev) => ({ ...prev, address: e.target.value }))} />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1">Name</Label>
                      <p className="font-semibold">{`${order.billing_info.first_name} ${order.billing_info.last_name}`.trim()}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1">Email</Label>
                      <p className="font-semibold">{order.billing_info.email}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1">Address</Label>
                      <p className="font-semibold">{order.billing_info.address}</p>
                    </div>
                    {order.billing_info.city && (
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1">City</Label>
                        <p className="font-semibold">{order.billing_info.city}</p>
                      </div>
                    )}
                    {order.billing_info.state && (
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1">State</Label>
                        <p className="font-semibold">{order.billing_info.state}</p>
                      </div>
                    )}
                    {order.billing_info.zip_code && (
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1">ZIP Code</Label>
                        <p className="font-semibold">{order.billing_info.zip_code}</p>
                      </div>
                    )}
                    {order.billing_info.country && (
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1">Country</Label>
                        <p className="font-semibold">{order.billing_info.country}</p>
                      </div>
                    )}
                  </div>
                )}
              </NeonCard>
            )}
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
