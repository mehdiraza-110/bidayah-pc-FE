import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import {
  ChevronLeft,
  CreditCard,
  Lock,
  Truck,
  Shield,
  Check,
  MapPin,
  User,
  Mail,
  Phone,
  Building2,
  FileText,
  ArrowRight,
  Upload,
  X,
  Image as ImageIcon,
  Building,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { CyberButton } from '@/components/ui/CyberButton';
import { NeonCard } from '@/components/ui/NeonCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { useCartStore } from '@/store/cartStore';
import { cn } from '@/lib/utils';
import { getPublicBillingInfo, type BillingInfo, createBankTransferOrder, createAgentOrder } from '@/services/api';
import { toast } from 'sonner';

// Comprehensive list of all countries
const COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria',
  'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan',
  'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cambodia',
  'Cameroon', 'Canada', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica',
  'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador', 'Egypt',
  'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon',
  'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana',
  'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel',
  'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kuwait', 'Kyrgyzstan', 'Laos',
  'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi',
  'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova',
  'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal', 'Netherlands',
  'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Palau',
  'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania',
  'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal',
  'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Korea',
  'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan',
  'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu',
  'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela',
  'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
].sort();

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, getTotalPrice, getTotalItems } = useCartStore();
  const [paymentMethod, setPaymentMethod] = useState('bank-transfer');
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [adminBillingInfo, setAdminBillingInfo] = useState<BillingInfo | null>(null);
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [paymentScreenshotPreview, setPaymentScreenshotPreview] = useState<string | null>(null);
  const [isLoadingBilling, setIsLoadingBilling] = useState(true);
  const [isOrderSubmitted, setIsOrderSubmitted] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isNavigatingRef = useRef(false);

  // Form state
  const [shippingInfo, setShippingInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United Arab Emirates',
  });

  const [billingInfo, setBillingInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United Arab Emirates',
  });

  const [cardInfo, setCardInfo] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: '',
  });

  // Load admin billing information
  useEffect(() => {
    const loadBillingInfo = async () => {
      setIsLoadingBilling(true);
      try {
        const response = await getPublicBillingInfo();
        if (response.success && response.data) {
          setAdminBillingInfo(response.data);
        }
      } catch (error) {
        console.error('Error loading billing info:', error);
      } finally {
        setIsLoadingBilling(false);
      }
    };

    loadBillingInfo();
  }, []);

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
  }, [items, navigate, isOrderSubmitted]);

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setPaymentScreenshot(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentScreenshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveScreenshot = () => {
    setPaymentScreenshot(null);
    setPaymentScreenshotPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleShippingChange = (field: string, value: string) => {
    setShippingInfo(prev => ({ ...prev, [field]: value }));
    if (sameAsShipping) {
      setBillingInfo(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleBillingChange = (field: string, value: string) => {
    setBillingInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleCardChange = (field: string, value: string) => {
    // Format card number
    if (field === 'cardNumber') {
      value = value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
      if (value.length > 19) return;
    }
    // Format expiry date
    if (field === 'expiryDate') {
      value = value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2');
      if (value.length > 5) return;
    }
    // Format CVV
    if (field === 'cvv') {
      value = value.replace(/\D/g, '');
      if (value.length > 3) return;
    }
    setCardInfo(prev => ({ ...prev, [field]: value }));
  };

  const subtotal = getTotalPrice();
  const shipping = 0; // Free shipping (automatically set by backend)
  const tax = subtotal * 0.05; // 5% VAT (automatically calculated by backend)
  const total = subtotal + shipping + tax; // Estimated total (final calculated by backend)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate bank transfer screenshot
    if (paymentMethod === 'bank-transfer' && !paymentScreenshot) {
      toast.error('Please upload a payment screenshot');
      return;
    }

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

      let response;

      if (paymentMethod === 'bank-transfer') {
        // Bank Transfer Checkout
        if (!paymentScreenshot) {
          toast.error('Please upload a payment screenshot');
          setIsProcessing(false);
          return;
        }

        response = await createBankTransferOrder({
          shipping_first_name: shippingInfo.firstName,
          shipping_last_name: shippingInfo.lastName,
          shipping_email: shippingInfo.email,
          shipping_phone: shippingInfo.phone,
          shipping_address: shippingInfo.address,
          shipping_city: shippingInfo.city,
          shipping_state: shippingInfo.state,
          shipping_zip_code: shippingInfo.zipCode,
          shipping_country: shippingInfo.country,
          billing_first_name: billingInfo.firstName,
          billing_last_name: billingInfo.lastName,
          billing_email: billingInfo.email,
          billing_address: billingInfo.address,
          billing_city: billingInfo.city,
          billing_state: billingInfo.state,
          billing_zip_code: billingInfo.zipCode,
          billing_country: billingInfo.country,
          items: orderItems,
          // Note: shipping and tax are automatically calculated by backend
          // shipping is always 0, tax is 5% VAT of subtotal
          payment_screenshot: paymentScreenshot,
        });
      } else {
        // Agent Payment Checkout
        response = await createAgentOrder({
          shipping_first_name: shippingInfo.firstName,
          shipping_last_name: shippingInfo.lastName,
          shipping_email: shippingInfo.email,
          shipping_phone: shippingInfo.phone,
          shipping_address: shippingInfo.address,
          shipping_city: shippingInfo.city,
          shipping_state: shippingInfo.state,
          shipping_zip_code: shippingInfo.zipCode,
          shipping_country: shippingInfo.country,
          billing_first_name: billingInfo.firstName,
          billing_last_name: billingInfo.lastName,
          billing_email: billingInfo.email,
          billing_address: billingInfo.address,
          billing_city: billingInfo.city,
          billing_state: billingInfo.state,
          billing_zip_code: billingInfo.zipCode,
          billing_country: billingInfo.country,
          items: orderItems,
          // Note: shipping and tax are automatically calculated by backend
          // shipping is always 0, tax is 5% VAT of subtotal
        });
      }

      if (response.success && response.data) {
        // Set flags to prevent redirect
        setIsOrderSubmitted(true);
        isNavigatingRef.current = true;
        
        // Prepare message for thank you page
        const message = paymentMethod === 'bank-transfer' 
          ? 'Our team will contact you shortly for order confirmation.'
          : 'Your order has been received. Our team will contact you soon for order confirmation.';
        
        // Show success toast
        toast.success('Order placed successfully!', {
          description: `Order Number: ${response.data.order_number}`,
        });
        
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
            {/* Left Column - Forms */}
            <div className="lg:col-span-2 space-y-6" ref={formRef}>
              {/* Shipping Information */}
              <NeonCard className="p-6" glowColor="cyan" hover={false}>
                <div className="flex items-center gap-3 mb-6 animate-form-item">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Truck className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="font-orbitron text-xl font-bold">SHIPPING INFORMATION</h2>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="animate-form-item">
                    <Label htmlFor="shipping-firstName" className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4" />
                      First Name
                    </Label>
                    <Input
                      id="shipping-firstName"
                      value={shippingInfo.firstName}
                      onChange={(e) => handleShippingChange('firstName', e.target.value)}
                      placeholder="John"
                      required
                    />
                  </div>

                  <div className="animate-form-item">
                    <Label htmlFor="shipping-lastName" className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4" />
                      Last Name
                    </Label>
                    <Input
                      id="shipping-lastName"
                      value={shippingInfo.lastName}
                      onChange={(e) => handleShippingChange('lastName', e.target.value)}
                      placeholder="Doe"
                      required
                    />
                  </div>

                  <div className="animate-form-item md:col-span-2">
                    <Label htmlFor="shipping-email" className="flex items-center gap-2 mb-2">
                      <Mail className="w-4 h-4" />
                      Email Address
                    </Label>
                    <Input
                      id="shipping-email"
                      type="email"
                      value={shippingInfo.email}
                      onChange={(e) => handleShippingChange('email', e.target.value)}
                      placeholder="john.doe@example.com"
                      required
                    />
                  </div>

                  <div className="animate-form-item md:col-span-2">
                    <Label htmlFor="shipping-phone" className="flex items-center gap-2 mb-2">
                      <Phone className="w-4 h-4" />
                      Phone Number
                    </Label>
                    <Input
                      id="shipping-phone"
                      type="tel"
                      value={shippingInfo.phone}
                      onChange={(e) => handleShippingChange('phone', e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      required
                    />
                  </div>

                  <div className="animate-form-item md:col-span-2">
                    <Label htmlFor="shipping-address" className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4" />
                      Street Address
                    </Label>
                    <Input
                      id="shipping-address"
                      value={shippingInfo.address}
                      onChange={(e) => handleShippingChange('address', e.target.value)}
                      placeholder="123 Gaming Street"
                      required
                    />
                  </div>

                  <div className="animate-form-item">
                    <Label htmlFor="shipping-city" className="mb-2">City</Label>
                    <Input
                      id="shipping-city"
                      value={shippingInfo.city}
                      onChange={(e) => handleShippingChange('city', e.target.value)}
                      placeholder="New York"
                      required
                    />
                  </div>

                  <div className="animate-form-item">
                    <Label htmlFor="shipping-state" className="mb-2">State</Label>
                    <Input
                      id="shipping-state"
                      value={shippingInfo.state}
                      onChange={(e) => handleShippingChange('state', e.target.value)}
                      placeholder="NY"
                      required
                    />
                  </div>

                  <div className="animate-form-item">
                    <Label htmlFor="shipping-zipCode" className="mb-2">ZIP Code</Label>
                    <Input
                      id="shipping-zipCode"
                      value={shippingInfo.zipCode}
                      onChange={(e) => handleShippingChange('zipCode', e.target.value)}
                      placeholder="10001"
                      required
                    />
                  </div>

                  <div className="animate-form-item">
                    <Label htmlFor="shipping-country" className="mb-2">Country</Label>
                    <select
                      id="shipping-country"
                      value={shippingInfo.country}
                      onChange={(e) => handleShippingChange('country', e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      required
                    >
                      <option value="">Select a country</option>
                      {COUNTRIES.map((country) => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </NeonCard>

              {/* Billing Information */}
              <NeonCard className="p-6" glowColor="purple" hover={false}>
                <div className="flex items-center justify-between mb-6 animate-form-item">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-secondary/10 rounded-lg">
                      <Building2 className="w-5 h-5 text-secondary" />
                    </div>
                    <h2 className="font-orbitron text-xl font-bold">BILLING INFORMATION</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="same-as-shipping"
                      checked={sameAsShipping}
                      onCheckedChange={(checked) => {
                        setSameAsShipping(checked as boolean);
                        if (checked) {
                          setBillingInfo(shippingInfo);
                        }
                      }}
                    />
                    <Label htmlFor="same-as-shipping" className="text-sm cursor-pointer">
                      Same as shipping
                    </Label>
                  </div>
                </div>

                <AnimatePresence>
                  {!sameAsShipping && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="grid md:grid-cols-2 gap-4"
                    >
                      <div className="animate-form-item">
                        <Label htmlFor="billing-firstName" className="mb-2">First Name</Label>
                        <Input
                          id="billing-firstName"
                          value={billingInfo.firstName}
                          onChange={(e) => handleBillingChange('firstName', e.target.value)}
                          placeholder="John"
                          required={!sameAsShipping}
                        />
                      </div>

                      <div className="animate-form-item">
                        <Label htmlFor="billing-lastName" className="mb-2">Last Name</Label>
                        <Input
                          id="billing-lastName"
                          value={billingInfo.lastName}
                          onChange={(e) => handleBillingChange('lastName', e.target.value)}
                          placeholder="Doe"
                          required={!sameAsShipping}
                        />
                      </div>

                      <div className="animate-form-item md:col-span-2">
                        <Label htmlFor="billing-email" className="mb-2">Email Address</Label>
                        <Input
                          id="billing-email"
                          type="email"
                          value={billingInfo.email}
                          onChange={(e) => handleBillingChange('email', e.target.value)}
                          placeholder="john.doe@example.com"
                          required={!sameAsShipping}
                        />
                      </div>

                      <div className="animate-form-item md:col-span-2">
                        <Label htmlFor="billing-address" className="mb-2">Street Address</Label>
                        <Input
                          id="billing-address"
                          value={billingInfo.address}
                          onChange={(e) => handleBillingChange('address', e.target.value)}
                          placeholder="123 Gaming Street"
                          required={!sameAsShipping}
                        />
                      </div>

                      <div className="animate-form-item">
                        <Label htmlFor="billing-city" className="mb-2">City</Label>
                        <Input
                          id="billing-city"
                          value={billingInfo.city}
                          onChange={(e) => handleBillingChange('city', e.target.value)}
                          placeholder="New York"
                          required={!sameAsShipping}
                        />
                      </div>

                      <div className="animate-form-item">
                        <Label htmlFor="billing-state" className="mb-2">State</Label>
                        <Input
                          id="billing-state"
                          value={billingInfo.state}
                          onChange={(e) => handleBillingChange('state', e.target.value)}
                          placeholder="NY"
                          required={!sameAsShipping}
                        />
                      </div>

                      <div className="animate-form-item">
                        <Label htmlFor="billing-zipCode" className="mb-2">ZIP Code</Label>
                        <Input
                          id="billing-zipCode"
                          value={billingInfo.zipCode}
                          onChange={(e) => handleBillingChange('zipCode', e.target.value)}
                          placeholder="10001"
                          required={!sameAsShipping}
                        />
                      </div>

                      <div className="animate-form-item">
                        <Label htmlFor="billing-country" className="mb-2">Country</Label>
                        <select
                          id="billing-country"
                          value={billingInfo.country}
                          onChange={(e) => handleBillingChange('country', e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          required={!sameAsShipping}
                        >
                          <option value="">Select a country</option>
                          {COUNTRIES.map((country) => (
                            <option key={country} value={country}>
                              {country}
                            </option>
                          ))}
                        </select>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </NeonCard>

              {/* Payment Method */}
              <NeonCard className="p-6" glowColor="green" hover={false}>
                <div className="flex items-center gap-3 mb-6 animate-form-item">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <CreditCard className="w-5 h-5 text-accent" />
                  </div>
                  <h2 className="font-orbitron text-xl font-bold">PAYMENT METHOD</h2>
                </div>

                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="mb-6">
                  <div className="space-y-3">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <label
                        htmlFor="bank-transfer"
                        className={cn(
                          "flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all",
                          paymentMethod === 'bank-transfer'
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <RadioGroupItem value="bank-transfer" id="bank-transfer" />
                        <span className="flex-1 cursor-pointer flex items-center gap-2">
                          <Building className="w-5 h-5" />
                          Bank Transfer
                        </span>
                      </label>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <label
                        htmlFor="agent"
                        className={cn(
                          "flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all",
                          paymentMethod === 'agent'
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <RadioGroupItem value="agent" id="agent" />
                        <span className="flex-1 cursor-pointer flex items-center gap-2">
                          <User className="w-5 h-5" />
                          Agent
                        </span>
                      </label>
                    </motion.div>
                  </div>
                </RadioGroup>


                {paymentMethod === 'bank-transfer' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 pt-4 border-t border-border"
                  >
                    {isLoadingBilling ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Loading banking information...
                      </div>
                    ) : adminBillingInfo ? (
                      <>
                        <div className="p-4 bg-muted/30 rounded-lg space-y-3">
                          <h3 className="font-orbitron font-bold text-lg mb-4">Bank Transfer Details</h3>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Bank Name:</span>
                              <span className="font-semibold">{adminBillingInfo.bank_name}</span>
                            </div>
                            {adminBillingInfo.bank_branch && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Branch:</span>
                                <span className="font-semibold">{adminBillingInfo.bank_branch}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Account Name:</span>
                              <span className="font-semibold">{adminBillingInfo.bank_account_name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Account Number:</span>
                              <span className="font-semibold font-mono-tech">{adminBillingInfo.bank_account_number}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Account Type:</span>
                              <span className="font-semibold capitalize">{adminBillingInfo.account_type}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Currency:</span>
                              <span className="font-semibold">{adminBillingInfo.currency}</span>
                            </div>
                            {adminBillingInfo.bank_address && (
                              <div className="pt-2 border-t border-border">
                                <span className="text-muted-foreground">Bank Address:</span>
                                <p className="font-semibold mt-1">{adminBillingInfo.bank_address}</p>
                              </div>
                            )}
                            {adminBillingInfo.notes && (
                              <div className="pt-2 border-t border-border">
                                <span className="text-muted-foreground">Notes:</span>
                                <p className="font-semibold mt-1">{adminBillingInfo.notes}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Payment Screenshot Upload */}
                        <div className="animate-form-item">
                          <Label htmlFor="payment-screenshot" className="mb-2">
                            Upload Payment Screenshot *
                          </Label>
                          <div className="space-y-3">
                            {paymentScreenshotPreview ? (
                              <div className="relative">
                                <img
                                  src={paymentScreenshotPreview}
                                  alt="Payment screenshot"
                                  className="w-full h-48 object-contain rounded-lg border border-border bg-muted"
                                />
                                <button
                                  type="button"
                                  onClick={handleRemoveScreenshot}
                                  className="absolute top-2 right-2 p-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <label
                                htmlFor="payment-screenshot"
                                className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors bg-muted/30"
                              >
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                  <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
                                  <p className="mb-2 text-sm text-muted-foreground">
                                    <span className="font-semibold">Click to upload</span> or drag and drop
                                  </p>
                                  <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
                                </div>
                                <input
                                  ref={fileInputRef}
                                  id="payment-screenshot"
                                  type="file"
                                  accept="image/*"
                                  onChange={handleScreenshotUpload}
                                  className="hidden"
                                  required={paymentMethod === 'bank-transfer'}
                                />
                              </label>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Please upload a screenshot of your bank transfer confirmation
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-center">
                        <p className="text-yellow-600 dark:text-yellow-400">
                          Banking information is not available. Please contact support.
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}

                {paymentMethod === 'agent' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 pt-4 border-t border-border"
                  >
                    <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                      <div className="flex items-start gap-3">
                        <User className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                          <h3 className="font-semibold mb-2">Agent Payment</h3>
                          <p className="text-sm text-muted-foreground">
                            Your order will be created with <span className="font-semibold text-foreground">agent_review</span> status. 
                            Our team will contact you soon to confirm your order and arrange payment.
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {paymentMethod === 'crypto' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 bg-muted/30 rounded-lg text-center text-muted-foreground"
                  >
                    Cryptocurrency payment options will be available at checkout
                  </motion.div>
                )}
              </NeonCard>
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
                      {items.map((item, index) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex gap-3 p-3 bg-muted/30 rounded-lg"
                        >
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
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  {/* Price Breakdown */}
                  <div className="space-y-3 pt-6 border-t border-border">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-mono-tech">AED {subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">VAT (5%)</span>
                      <span className="font-mono-tech">AED {tax.toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground italic">
                      * Tax is automatically calculated by the system
                    </p>
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
                        Your payment is protected
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
                      <span className="flex items-center gap-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                        />
                        PROCESSING...
                      </span>
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
