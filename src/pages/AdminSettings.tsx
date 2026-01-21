import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import {
  Settings,
  Save,
  Bell,
  Mail,
  Shield,
  Globe,
  CreditCard,
  User,
  Lock,
} from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { NeonCard } from '@/components/ui/NeonCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { CyberButton } from '@/components/ui/CyberButton';

const AdminSettingsPage: React.FC = () => {
  const [isSaving, setIsSaving] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [settings, setSettings] = useState({
    siteName: 'NEXUSGEAR',
    siteEmail: 'admin@nexusgear.com',
    siteUrl: 'https://nexusgear.com',
    currency: 'USD',
    taxRate: 8,
    shippingCost: 0,
    freeShippingThreshold: 100,
    notifications: {
      email: true,
      orders: true,
      products: true,
      marketing: false,
    },
    security: {
      twoFactor: false,
      sessionTimeout: 30,
    },
  });

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

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      // In a real app, save to backend
      console.log('Settings saved:', settings);
    }, 1000);
  };

  return (
    <AdminLayout>
      <div className="p-6" ref={containerRef}>
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-orbitron text-3xl font-bold mb-2">
            SETTINGS <span className="text-primary">CONFIGURATION</span>
          </h1>
          <p className="text-muted-foreground">Manage your store settings and preferences</p>
        </div>

        <div className="space-y-6">
          {/* General Settings */}
          <NeonCard className="p-6" glowColor="cyan" hover={false}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Globe className="w-5 h-5 text-primary" />
              </div>
              <h2 className="font-orbitron text-xl font-bold">GENERAL SETTINGS</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="siteName">Site Name</Label>
                <Input
                  id="siteName"
                  value={settings.siteName}
                  onChange={(e) => setSettings(prev => ({ ...prev, siteName: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="siteEmail">Site Email</Label>
                <Input
                  id="siteEmail"
                  type="email"
                  value={settings.siteEmail}
                  onChange={(e) => setSettings(prev => ({ ...prev, siteEmail: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="siteUrl">Site URL</Label>
                <Input
                  id="siteUrl"
                  type="url"
                  value={settings.siteUrl}
                  onChange={(e) => setSettings(prev => ({ ...prev, siteUrl: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Input
                  id="currency"
                  value={settings.currency}
                  onChange={(e) => setSettings(prev => ({ ...prev, currency: e.target.value }))}
                />
              </div>
            </div>
          </NeonCard>

          {/* Store Settings */}
          <NeonCard className="p-6" glowColor="purple" hover={false}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-secondary/10 rounded-lg">
                <CreditCard className="w-5 h-5 text-secondary" />
              </div>
              <h2 className="font-orbitron text-xl font-bold">STORE SETTINGS</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="taxRate">Tax Rate (%)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  value={settings.taxRate}
                  onChange={(e) => setSettings(prev => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))}
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
              <div>
                <Label htmlFor="shippingCost">Shipping Cost (AED)</Label>
                <Input
                  id="shippingCost"
                  type="number"
                  value={settings.shippingCost}
                  onChange={(e) => setSettings(prev => ({ ...prev, shippingCost: parseFloat(e.target.value) || 0 }))}
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <Label htmlFor="freeShippingThreshold">Free Shipping Threshold (AED)</Label>
                <Input
                  id="freeShippingThreshold"
                  type="number"
                  value={settings.freeShippingThreshold}
                  onChange={(e) => setSettings(prev => ({ ...prev, freeShippingThreshold: parseFloat(e.target.value) || 0 }))}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </NeonCard>

          {/* Notifications */}
          <NeonCard className="p-6" glowColor="green" hover={false}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-accent/10 rounded-lg">
                <Bell className="w-5 h-5 text-accent" />
              </div>
              <h2 className="font-orbitron text-xl font-bold">NOTIFICATIONS</h2>
            </div>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={settings.notifications.email}
                  onCheckedChange={(checked) =>
                    setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, email: checked as boolean },
                    }))
                  }
                />
                <span>Email Notifications</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={settings.notifications.orders}
                  onCheckedChange={(checked) =>
                    setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, orders: checked as boolean },
                    }))
                  }
                />
                <span>New Order Alerts</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={settings.notifications.products}
                  onCheckedChange={(checked) =>
                    setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, products: checked as boolean },
                    }))
                  }
                />
                <span>Product Updates</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={settings.notifications.marketing}
                  onCheckedChange={(checked) =>
                    setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, marketing: checked as boolean },
                    }))
                  }
                />
                <span>Marketing Emails</span>
              </label>
            </div>
          </NeonCard>

          {/* Security */}
          <NeonCard className="p-6" glowColor="cyan" hover={false}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <h2 className="font-orbitron text-xl font-bold">SECURITY</h2>
            </div>
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={settings.security.twoFactor}
                  onCheckedChange={(checked) =>
                    setSettings(prev => ({
                      ...prev,
                      security: { ...prev.security, twoFactor: checked as boolean },
                    }))
                  }
                />
                <span>Enable Two-Factor Authentication</span>
              </label>
              <div>
                <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  value={settings.security.sessionTimeout}
                  onChange={(e) =>
                    setSettings(prev => ({
                      ...prev,
                      security: { ...prev.security, sessionTimeout: parseInt(e.target.value) || 30 },
                    }))
                  }
                  min="5"
                  max="120"
                />
              </div>
            </div>
          </NeonCard>

          {/* Save Button */}
          <div className="flex justify-end">
            <CyberButton size="lg" onClick={handleSave} disabled={isSaving}>
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
                  SAVE SETTINGS
                </span>
              )}
            </CyberButton>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSettingsPage;

