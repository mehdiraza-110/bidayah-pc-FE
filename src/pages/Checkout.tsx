import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import {
  ChevronLeft,
  ChevronDown,
  Lock,
  Truck,
  Shield,
  Check,
  MapPin,
  User,
  Mail,
  Phone,
  FileText,
  ArrowRight,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { CyberButton } from '@/components/ui/CyberButton';
import { NeonCard } from '@/components/ui/NeonCard';
import { Loader } from '@/components/ui/Loader';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCartStore } from '@/store/cartStore';
import { cn } from '@/lib/utils';
import { createAgentOrder } from '@/services/api';
import { toast } from 'sonner';

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { items, getTotalPrice } = useCartStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOrderSubmitted, setIsOrderSubmitted] = useState(false);
  // Which order-summary line items have their component breakdown (specs)
  // expanded — collapsed by default so a multi-component bundle doesn't
  // dominate the summary panel.
  const [expandedItemIds, setExpandedItemIds] = useState<Set<string>>(new Set());

  const containerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const isNavigatingRef = useRef(false);

  // One combined contact/address form — used for both shipping and billing.
  const [contactInfo, setContactInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    // Don't redirect if:
    // 1. Order was just submitted
    // 2. We're navigating away (ref flag)
    // 3. We're already on a different page (location check)
    if (items.length === 0 && !isOrderSubmitted && !isNavigatingRef.current && location.pathname === '/checkout') {
      navigate('/products');
      return;
    }

    if (containerRef.current && formRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(containerRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }
        );

        const formElements = formRef.current?.querySelectorAll('.animate-form-item');
        gsap.fromTo(formElements,
          { opacity: 0, x: 30 },
          { opacity: 1, x: 0, duration: 0.5, stagger: 0.05, ease: 'power3.out', delay: 0.2 }
        );
      });

      return () => ctx.revert();
    }
  }, [items, navigate, isOrderSubmitted, location.pathname]);

  const handleContactChange = (field: keyof typeof contactInfo, value: string) => {
    setContactInfo((prev) => ({ ...prev, [field]: value }));
  };

  const subtotal = getTotalPrice();
  const shipping = 0; // Free shipping (automatically set by backend)
  const tax = 0; // VAT removed
  const total = subtotal + shipping + tax; // Estimated total (final calculated by backend)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsProcessing(true);

    try {
      // Prepare items for API
      const orderItems = items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        category: item.category,
        vendor_id: item.vendor_id,
        image: item.image,
      }));

      // Every order goes to agent_review — a sales agent quotes the final
      // price and confirms payment afterward.
      const response = await createAgentOrder({
        name: contactInfo.name,
        email: contactInfo.email,
        phone: contactInfo.phone,
        address: contactInfo.address,
        items: orderItems,
      });

      if (response.success && response.data) {
        // Set flags to prevent redirect
        setIsOrderSubmitted(true);
        isNavigatingRef.current = true;

        // Show success toast
        toast.success('Order placed successfully!', {
          description: `Order Number: ${response.data.order_number}`,
        });

        const message = 'Your order has been received. Our team will contact you soon with a pricing quotation and to confirm your order.';

        // Navigate to thank you page FIRST (before clearing cart)
        navigate(`/thank-you?message=${encodeURIComponent(message)}&orderNumber=${response.data.order_number}`);

        // Clear cart after a short delay to ensure navigation happens first
        setTimeout(() => {
          const { clearCart } = useCartStore.getState();
          clearCart();
        }, 100);
      } else {
        toast.error(response.message || 'Failed to place order', {
          description: response.error || 'Please try again',
        });
      }
    } catch (error) {
      toast.error('Failed to submit order', {
        description: error instanceof Error ? error.message : 'Please try again later',
      });
      console.error('Error submitting order:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-background"
    >
      <Navbar />

      <main className="pt-12 pb-16" ref={containerRef}>
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Breadcrumb */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-sm text-muted-foreground mb-8"
          >
            <Link to="/products" className="hover:text-primary transition-colors flex items-center gap-1">
              <ChevronLeft className="w-4 h-4" />
              Products
            </Link>
            <span>/</span>
            <Link to="/" className="hover:text-primary transition-colors">Cart</Link>
            <span>/</span>
            <span className="text-foreground">Checkout</span>
          </motion.div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="font-orbitron text-4xl md:text-5xl font-bold mb-2">
              CHECKOUT
            </h1>
            <p className="text-muted-foreground">
              Complete your order to secure your gaming gear
            </p>
          </div>

          <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Form */}
            <div className="lg:col-span-2 space-y-6" ref={formRef}>
              {/* Contact & Address */}
              <NeonCard className="p-6" glowColor="cyan" hover={false}>
                <div className="flex items-center gap-3 mb-6 animate-form-item">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Truck className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="font-orbitron text-xl font-bold">CONTACT & ADDRESS</h2>
                </div>

                <div className="grid gap-4">
                  <div className="animate-form-item">
                    <Label htmlFor="contact-name" className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4" />
                      Full Name
                    </Label>
                    <Input
                      id="contact-name"
                      value={contactInfo.name}
                      onChange={(e) => handleContactChange('name', e.target.value)}
                      placeholder="John Doe"
                      required
                    />
                  </div>

                  <div className="animate-form-item">
                    <Label htmlFor="contact-email" className="flex items-center gap-2 mb-2">
                      <Mail className="w-4 h-4" />
                      Email Address
                    </Label>
                    <Input
                      id="contact-email"
                      type="email"
                      value={contactInfo.email}
                      onChange={(e) => handleContactChange('email', e.target.value)}
                      placeholder="john.doe@example.com"
                      required
                    />
                  </div>

                  <div className="animate-form-item">
                    <Label htmlFor="contact-phone" className="flex items-center gap-2 mb-2">
                      <Phone className="w-4 h-4" />
                      Phone Number
                    </Label>
                    <Input
                      id="contact-phone"
                      type="tel"
                      value={contactInfo.phone}
                      onChange={(e) => handleContactChange('phone', e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      required
                    />
                  </div>

                  <div className="animate-form-item">
                    <Label htmlFor="contact-address" className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4" />
                      Address
                    </Label>
                    <Input
                      id="contact-address"
                      value={contactInfo.address}
                      onChange={(e) => handleContactChange('address', e.target.value)}
                      placeholder="123 Gaming Street, Dubai"
                      required
                    />
                  </div>
                </div>
              </NeonCard>

              <p className="animate-form-item text-sm font-semibold text-destructive">
                The price is not final. Our team will send you a pricing quotation after order placement.
              </p>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-32">
                <NeonCard className="p-6 bg-card/95 border-border" glowColor="cyan" hover={false}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="font-orbitron text-xl font-bold">ORDER SUMMARY</h2>
                  </div>

                  {/* Items List */}
                  <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                    <AnimatePresence>
                      {items.map((item, index) => {
                        const hasSpecs = item.specs && item.specs.length > 0;
                        const isExpanded = expandedItemIds.has(item.id);

                        return (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="p-3 bg-muted/30 rounded-lg"
                          >
                            <div className="flex gap-3">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-16 h-16 object-cover rounded-md"
                              />
                              <div className="flex-1 min-w-0">
                                <h3 className="font-rajdhani font-semibold text-sm truncate">
                                  {item.name}
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                  Qty: {item.quantity}
                                </p>
                                <p className="text-primary font-orbitron text-sm mt-1">
                                  AED {(item.price * item.quantity).toLocaleString()}
                                </p>
                              </div>
                            </div>

                            {hasSpecs && (
                              <div className="mt-2 pt-2 border-t border-border/60">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedItemIds((prev) => {
                                      const next = new Set(prev);
                                      if (next.has(item.id)) {
                                        next.delete(item.id);
                                      } else {
                                        next.add(item.id);
                                      }
                                      return next;
                                    })
                                  }
                                  className="flex w-full items-center justify-between gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
                                >
                                  <span>{isExpanded ? 'Hide components' : `View components (${item.specs!.length})`}</span>
                                  <ChevronDown className={cn('h-3.5 w-3.5 transition-transform shrink-0', isExpanded && 'rotate-180')} />
                                </button>

                                {isExpanded && (
                                  <ul className="mt-2 space-y-1">
                                    {item.specs!.map((spec, specIndex) => (
                                      <li key={specIndex} className="text-xs text-muted-foreground truncate">
                                        {spec}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>

                  {/* Price Breakdown */}
                  <div className="space-y-3 pt-6 border-t border-border">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-mono-tech">AED {subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between pt-3 border-t border-border">
                      <span className="font-orbitron text-lg font-bold">Total</span>
                      <span className="font-orbitron text-2xl font-bold text-primary">
                        AED {total.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Security Badge */}
                  <div className="mt-6 p-4 bg-muted/30 rounded-lg flex items-center gap-3">
                    <Shield className="w-5 h-5 text-accent" />
                    <div className="flex-1">
                      <p className="text-xs font-semibold">Secure Checkout</p>
                      <p className="text-xs text-muted-foreground">
                        Your information is protected
                      </p>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <CyberButton
                    type="submit"
                    size="lg"
                    className="w-full mt-6"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <Loader size="sm" label="Processing..." />
                    ) : (
                      <span className="flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        PLACE ORDER
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    )}
                  </CyberButton>

                  <p className="text-xs text-center text-muted-foreground mt-3">
                    By placing your order, you agree to our Terms of Service
                  </p>
                </NeonCard>

                {/* Features */}
                <div className="grid grid-cols-3 gap-3 mt-6">
                  {[
                    { icon: Truck, label: 'Free Shipping' },
                    { icon: Shield, label: 'Secure' },
                    { icon: Check, label: 'Warranty' },
                  ].map((feature) => (
                    <motion.div
                      key={feature.label}
                      whileHover={{ scale: 1.05 }}
                      className="flex flex-col items-center gap-2 p-3 bg-muted/30 rounded-lg text-center"
                    >
                      <feature.icon className="w-5 h-5 text-primary" />
                      <span className="text-xs text-muted-foreground">{feature.label}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </motion.div>
  );
};

export default CheckoutPage;
