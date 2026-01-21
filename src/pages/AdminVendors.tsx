import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import {
  Store,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Check,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import AdminLayout from '@/components/layout/AdminLayout';
import { CyberButton } from '@/components/ui/CyberButton';
import { NeonCard } from '@/components/ui/NeonCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  getVendors, 
  createVendor, 
  updateVendor, 
  deleteVendor, 
  type Vendor 
} from '@/services/api';
import { cn } from '@/lib/utils';

const AdminVendorsPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditing = Boolean(id);
  const [vendorList, setVendorList] = useState<Vendor[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [formData, setFormData] = useState<Partial<Vendor>>({
    vendor_name: '',
  });

  const containerRef = useRef<HTMLDivElement>(null);

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

  // Load vendors from API
  useEffect(() => {
    const loadVendors = async () => {
      setIsLoading(true);
      const response = await getVendors();
      if (response.success && response.data) {
        setVendorList(response.data);
      } else {
        toast.error(response.message || 'Failed to load vendors');
      }
      setIsLoading(false);
    };

    loadVendors();
  }, []);

  // Load vendor for editing
  useEffect(() => {
    if (isEditing && id) {
      const vendor = vendorList.find(v => v.id === id);
      if (vendor) {
        setFormData(vendor);
      } else if (!isLoading && vendorList.length > 0) {
        // Vendor not found
        toast.error('Vendor not found');
        navigate('/admin/vendors');
      }
    }
  }, [id, isEditing, vendorList, isLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.vendor_name || formData.vendor_name.trim() === '') {
      toast.error('Please enter a vendor name');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditing && id) {
        // Update existing vendor
        const response = await updateVendor(id, {
          vendor_name: formData.vendor_name!.trim(),
        });

        if (response.success && response.data) {
          setVendorList(prev =>
            prev.map(v => (v.id === id ? response.data! : v))
          );
          toast.success(response.message || 'Vendor updated successfully');
          setIsFormOpen(false);
          setFormData({ vendor_name: '' });
          navigate('/admin/vendors');
        } else {
          toast.error(response.message || 'Failed to update vendor');
        }
      } else {
        // Create new vendor
        const response = await createVendor({
          vendor_name: formData.vendor_name!.trim(),
        });

        if (response.success && response.data) {
          setVendorList(prev => [...prev, response.data!]);
          toast.success(response.message || 'Vendor created successfully');
          setIsFormOpen(false);
          setFormData({ vendor_name: '' });
          navigate('/admin/vendors');
        } else {
          toast.error(response.message || 'Failed to create vendor');
        }
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (vendorId: string) => {
    const vendor = vendorList.find(v => v.id === vendorId);
    if (!confirm(`Are you sure you want to delete "${vendor?.vendor_name}"?`)) {
      return;
    }

    const response = await deleteVendor(vendorId);
    if (response.success) {
      setVendorList(prev => prev.filter(v => v.id !== vendorId));
      toast.success(response.message || 'Vendor deleted successfully');
    } else {
      toast.error(response.message || 'Failed to delete vendor');
    }
  };

  const handleEdit = (vendor: Vendor) => {
    navigate(`/admin/vendors/${vendor.id}`);
    setIsFormOpen(true);
  };

  const handleNewVendor = () => {
    navigate('/admin/vendors');
    setIsFormOpen(true);
    setFormData({
      vendor_name: '',
    });
  };

  return (
    <AdminLayout>
      <div className="p-6" ref={containerRef}>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-orbitron text-3xl font-bold mb-2">
                VENDOR <span className="text-primary">MANAGEMENT</span>
              </h1>
              <p className="text-muted-foreground">
                {isFormOpen ? (isEditing ? 'Edit Vendor' : 'Create New Vendor') : 'Manage your vendors'}
              </p>
            </div>
            {!isFormOpen && (
              <CyberButton size="md" glowColor="cyan" onClick={handleNewVendor}>
                <Plus className="w-4 h-4 mr-2" />
                NEW VENDOR
              </CyberButton>
            )}
          </div>
        </div>
        <AnimatePresence mode="wait">
          {isFormOpen ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <NeonCard className="p-8" glowColor="cyan" hover={false}>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Vendor Name */}
                  <div>
                    <h2 className="font-orbitron text-xl font-bold mb-4">VENDOR INFORMATION</h2>
                    <div>
                      <Label htmlFor="vendor_name">Vendor Name *</Label>
                      <Input
                        id="vendor_name"
                        value={formData.vendor_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, vendor_name: e.target.value }))}
                        placeholder="e.g., NVIDIA, AMD, Intel"
                        required
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Enter the name of the vendor
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-4 pt-4 border-t border-border">
                    <CyberButton type="submit" size="lg" disabled={isSubmitting}>
                      {isSubmitting ? (
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
                          {isEditing ? 'UPDATE VENDOR' : 'CREATE VENDOR'}
                        </span>
                      )}
                    </CyberButton>
                    <CyberButton
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={() => {
                        setIsFormOpen(false);
                        navigate('/admin/vendors');
                      }}
                    >
                      <X className="w-4 h-4 mr-2" />
                      CANCEL
                    </CyberButton>
                  </div>
                </form>
              </NeonCard>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {isLoading ? (
                <NeonCard className="p-12 text-center" glowColor="cyan" hover={false}>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"
                  />
                  <p className="text-muted-foreground mt-4">Loading vendors...</p>
                </NeonCard>
              ) : vendorList.length === 0 ? (
                <NeonCard className="p-12 text-center" glowColor="cyan" hover={false}>
                  <Store className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-orbitron text-xl font-bold mb-2">No Vendors</h3>
                  <p className="text-muted-foreground mb-6">
                    Get started by creating your first vendor
                  </p>
                  <CyberButton onClick={handleNewVendor} glowColor="cyan">
                    <Plus className="w-4 h-4 mr-2" />
                    CREATE FIRST VENDOR
                  </CyberButton>
                </NeonCard>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {vendorList.map((vendor, index) => (
                    <motion.div
                      key={vendor.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <NeonCard className="p-6" glowColor="cyan" hover={false}>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-3 bg-primary/10 rounded-lg">
                              <Store className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-rajdhani font-semibold text-lg">
                                {vendor.vendor_name}
                              </h3>
                              <p className="text-xs text-muted-foreground">
                                ID: {vendor.id}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <CyberButton
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleEdit(vendor)}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            EDIT
                          </CyberButton>
                          <motion.button
                            onClick={() => handleDelete(vendor.id)}
                            className="p-2 rounded-lg border border-destructive text-destructive hover:bg-destructive/10 transition-colors"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </NeonCard>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  );
};

export default AdminVendorsPage;
