import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import {
  CreditCard,
  Building2,
  Save,
  Building,
  FileText,
} from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { NeonCard } from '@/components/ui/NeonCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CyberButton } from '@/components/ui/CyberButton';
import { toast } from 'sonner';
import { getPublicBillingInfo, setBillingInfo as saveBillingInfo, type BillingInfo } from '@/services/api';

const AdminBillingPage: React.FC = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const [billingInfo, setBillingInfo] = useState({
    // Bank Account Information
    bankAccountName: '',
    bankAccountNumber: '',
    bankName: '',
    bankBranch: '',
    bankAddress: '',
    accountType: 'checking', // checking, savings, current, business
    currency: 'AED',
    
    // Contact Information
    beneficiaryName: '',
    contactEmail: '',
    contactPhone: '',
    
    // Additional Information
    notes: '',
  });

  /*
   * Complete Payload Structure for API Integration:
   * 
   * POST /api/v1/billing or PUT /api/v1/billing
   * 
   * {
   *   "bank_account_name": "string",        // Required
   *   "bank_account_number": "string",     // Required
   *   "bank_name": "string",                // Required
   *   "bank_branch": "string",             // Optional
   *   "bank_address": "string",            // Optional
   *   "account_type": "string",            // Required: "checking" | "savings" | "current" | "business"
   *   "currency": "string",                // Required: "AED" | "USD" | "EUR" | "GBP" | "SAR" | "INR"
   *   "beneficiary_name": "string",        // Required
   *   "contact_email": "string",           // Required (email format)
   *   "contact_phone": "string",          // Optional
   *   "notes": "string"                    // Optional
   * }
   * 
   * Response Structure:
   * {
   *   "success": true,
   *   "message": "Billing information saved successfully",
   *   "data": {
   *     "id": "uuid",
   *     "bank_account_name": "string",
   *     "bank_account_number": "string",
   *     "bank_name": "string",
   *     "bank_branch": "string",
   *     "bank_address": "string",
   *     "account_type": "string",
   *     "currency": "string",
   *     "beneficiary_name": "string",
   *     "contact_email": "string",
   *     "contact_phone": "string",
   *     "notes": "string",
   *     "created_at": "ISO 8601 datetime",
   *     "updated_at": "ISO 8601 datetime"
   *   }
   * }
   */

  // Load existing billing information
  useEffect(() => {
    const loadBillingInfo = async () => {
      setIsLoading(true);
      try {
        const response = await getPublicBillingInfo();
        if (response.success && response.data) {
          const data = response.data;
          setBillingInfo(prev => ({
            ...prev,
            bankAccountName: data.bank_account_name || '',
            bankAccountNumber: data.bank_account_number || '',
            bankName: data.bank_name || '',
            bankBranch: data.bank_branch || '',
            bankAddress: data.bank_address || '',
            accountType: data.account_type || 'checking',
            currency: data.currency || 'AED',
            beneficiaryName: data.beneficiary_name || '',
            contactEmail: data.contact_email || '',
            contactPhone: data.contact_phone || '',
            notes: data.notes || '',
          }));
        }
      } catch (error) {
        console.error('Error loading billing info:', error);
        // It's okay if billing info doesn't exist yet
      } finally {
        setIsLoading(false);
      }
    };

    loadBillingInfo();
  }, []);

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

  const handleChange = (field: string, value: string) => {
    setBillingInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      // Check if user is authenticated
      const token = localStorage.getItem('jwt_token');
      if (!token) {
        toast.error('You must be logged in to save billing information');
        setIsSaving(false);
        return;
      }

      const payload = {
        bank_account_name: billingInfo.bankAccountName,
        bank_account_number: billingInfo.bankAccountNumber,
        bank_name: billingInfo.bankName,
        bank_branch: billingInfo.bankBranch || undefined,
        bank_address: billingInfo.bankAddress || undefined,
        account_type: billingInfo.accountType as 'checking' | 'savings' | 'current' | 'business',
        currency: billingInfo.currency as 'AED' | 'USD' | 'EUR' | 'GBP' | 'SAR' | 'INR',
        beneficiary_name: billingInfo.beneficiaryName,
        contact_email: billingInfo.contactEmail,
        contact_phone: billingInfo.contactPhone || undefined,
        notes: billingInfo.notes || undefined,
      };

      const response = await saveBillingInfo(payload);
      
      if (response.success) {
        toast.success(response.message || 'Billing information saved successfully');
      } else {
        const errorMsg = response.error || response.message || 'Failed to save billing information';
        toast.error(errorMsg);
        if (errorMsg.toLowerCase().includes('unauthorized') || errorMsg.toLowerCase().includes('token')) {
          toast.error('Please log in again', {
            description: 'Your session may have expired',
          });
        }
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error('Error saving billing info:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-6" ref={containerRef}>
          <div className="text-center py-16">
            <p className="text-muted-foreground">Loading billing information...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6" ref={containerRef}>
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-orbitron text-3xl font-bold mb-2">
            BILLING <span className="text-primary">INFORMATION</span>
          </h1>
          <p className="text-muted-foreground">
            Configure your payment and banking details for customer payments
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Bank Account Information */}
          <NeonCard className="p-6" glowColor="cyan" hover={false}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Building className="w-5 h-5 text-primary" />
              </div>
              <h2 className="font-orbitron text-xl font-bold">BANK ACCOUNT INFORMATION</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bankAccountName">Bank Account Name *</Label>
                <Input
                  id="bankAccountName"
                  value={billingInfo.bankAccountName}
                  onChange={(e) => handleChange('bankAccountName', e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <Label htmlFor="bankAccountNumber">Bank Account Number *</Label>
                <Input
                  id="bankAccountNumber"
                  value={billingInfo.bankAccountNumber}
                  onChange={(e) => handleChange('bankAccountNumber', e.target.value)}
                  placeholder="1234567890"
                  required
                />
              </div>

              <div>
                <Label htmlFor="bankName">Bank Name *</Label>
                <Input
                  id="bankName"
                  value={billingInfo.bankName}
                  onChange={(e) => handleChange('bankName', e.target.value)}
                  placeholder="Emirates NBD"
                  required
                />
              </div>

              <div>
                <Label htmlFor="bankBranch">Branch Name</Label>
                <Input
                  id="bankBranch"
                  value={billingInfo.bankBranch}
                  onChange={(e) => handleChange('bankBranch', e.target.value)}
                  placeholder="Dubai Main Branch"
                />
              </div>

              <div>
                <Label htmlFor="accountType">Account Type *</Label>
                <select
                  id="accountType"
                  value={billingInfo.accountType}
                  onChange={(e) => handleChange('accountType', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  required
                >
                  <option value="checking">Checking Account</option>
                  <option value="savings">Savings Account</option>
                  <option value="current">Current Account</option>
                  <option value="business">Business Account</option>
                </select>
              </div>

              <div>
                <Label htmlFor="currency">Currency *</Label>
                <select
                  id="currency"
                  value={billingInfo.currency}
                  onChange={(e) => handleChange('currency', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  required
                >
                  <option value="AED">AED - UAE Dirham</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="SAR">SAR - Saudi Riyal</option>
                  <option value="INR">INR - Indian Rupee</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="bankAddress">Bank Address</Label>
                <Input
                  id="bankAddress"
                  value={billingInfo.bankAddress}
                  onChange={(e) => handleChange('bankAddress', e.target.value)}
                  placeholder="123 Bank Street, Dubai, UAE"
                />
              </div>
            </div>
          </NeonCard>

          {/* Contact Information */}
          <NeonCard className="p-6" glowColor="green" hover={false}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-accent/10 rounded-lg">
                <Building2 className="w-5 h-5 text-accent" />
              </div>
              <h2 className="font-orbitron text-xl font-bold">CONTACT INFORMATION</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="beneficiaryName">Beneficiary Name *</Label>
                <Input
                  id="beneficiaryName"
                  value={billingInfo.beneficiaryName}
                  onChange={(e) => handleChange('beneficiaryName', e.target.value)}
                  placeholder="Company Name or Full Name"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Name as it appears on the bank account
                </p>
              </div>

              <div>
                <Label htmlFor="contactEmail">Contact Email *</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={billingInfo.contactEmail}
                  onChange={(e) => handleChange('contactEmail', e.target.value)}
                  placeholder="billing@example.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input
                  id="contactPhone"
                  type="tel"
                  value={billingInfo.contactPhone}
                  onChange={(e) => handleChange('contactPhone', e.target.value)}
                  placeholder="+971 50 123 4567"
                />
              </div>
            </div>
          </NeonCard>

          {/* Additional Notes */}
          <NeonCard className="p-6" glowColor="cyan" hover={false}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <h2 className="font-orbitron text-xl font-bold">ADDITIONAL INFORMATION</h2>
            </div>

            <div>
              <Label htmlFor="notes">Notes / Instructions</Label>
              <textarea
                id="notes"
                value={billingInfo.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Any additional instructions or notes for customers making payments..."
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                rows={4}
              />
            </div>
          </NeonCard>

          {/* Save Button */}
          <div className="flex justify-end gap-4">
            <CyberButton
              type="submit"
              size="lg"
              disabled={isSaving}
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                  />
                  SAVING...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  SAVE BILLING INFORMATION
                </span>
              )}
            </CyberButton>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default AdminBillingPage;
