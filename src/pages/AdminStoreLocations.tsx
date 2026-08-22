import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import {
  MapPin,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import AdminLayout from '@/components/layout/AdminLayout';
import { CyberButton } from '@/components/ui/CyberButton';
import { Loader } from '@/components/ui/Loader';
import { NeonCard } from '@/components/ui/NeonCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  getStoreLocations,
  createStoreLocation,
  updateStoreLocation,
  deleteStoreLocation,
  type StoreLocation,
} from '@/services/api';
import { cn } from '@/lib/utils';

const emptyForm: Partial<StoreLocation> = {
  name: '',
  address: '',
  city: '',
  is_active: true,
};

const AdminStoreLocationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditing = Boolean(id);
  const [locationList, setLocationList] = useState<StoreLocation[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState<Partial<StoreLocation>>(emptyForm);

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

  // Load store locations from API
  useEffect(() => {
    const loadLocations = async () => {
      setIsLoading(true);
      const response = await getStoreLocations();
      if (response.success && response.data) {
        setLocationList(response.data);
      } else {
        toast.error(response.message || 'Failed to load store locations');
      }
      setIsLoading(false);
    };

    loadLocations();
  }, []);

  // Load location for editing
  useEffect(() => {
    if (isEditing && id) {
      const location = locationList.find(l => l.id === id);
      if (location) {
        setFormData(location);
      } else if (!isLoading && locationList.length > 0) {
        toast.error('Store location not found');
        navigate('/admin/store-locations');
      }
    }
  }, [id, isEditing, locationList, isLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || formData.name.trim() === '') {
      toast.error('Please enter a location name');
      return;
    }
    if (!formData.address || formData.address.trim() === '') {
      toast.error('Please enter an address');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: formData.name!.trim(),
        address: formData.address!.trim(),
        city: formData.city?.trim() || undefined,
        is_active: formData.is_active ?? true,
      };

      if (isEditing && id) {
        const response = await updateStoreLocation(id, payload);

        if (response.success && response.data) {
          setLocationList(prev =>
            prev.map(l => (l.id === id ? response.data! : l))
          );
          toast.success(response.message || 'Store location updated successfully');
          setIsFormOpen(false);
          setFormData(emptyForm);
          navigate('/admin/store-locations');
        } else {
          toast.error(response.message || 'Failed to update store location');
        }
      } else {
        const response = await createStoreLocation(payload);

        if (response.success && response.data) {
          setLocationList(prev => [...prev, response.data!]);
          toast.success(response.message || 'Store location created successfully');
          setIsFormOpen(false);
          setFormData(emptyForm);
          navigate('/admin/store-locations');
        } else {
          toast.error(response.message || 'Failed to create store location');
        }
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (locationId: string) => {
    const location = locationList.find(l => l.id === locationId);
    if (!confirm(`Are you sure you want to delete "${location?.name}"?`)) {
      return;
    }

    const response = await deleteStoreLocation(locationId);
    if (response.success) {
      setLocationList(prev => prev.filter(l => l.id !== locationId));
      toast.success(response.message || 'Store location deleted successfully');
    } else {
      toast.error(response.message || 'Failed to delete store location');
    }
  };

  const handleEdit = (location: StoreLocation) => {
    navigate(`/admin/store-locations/${location.id}`);
    setIsFormOpen(true);
  };

  const handleNewLocation = () => {
    navigate('/admin/store-locations');
    setIsFormOpen(true);
    setFormData(emptyForm);
  };

  return (
    <AdminLayout>
      <div className="p-6" ref={containerRef}>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-orbitron text-3xl font-bold mb-2">
                STORE <span className="text-primary">LOCATIONS</span>
              </h1>
              <p className="text-muted-foreground">
                {isFormOpen ? (isEditing ? 'Edit Pickup Location' : 'Create New Pickup Location') : 'Manage in-store pickup locations shown at checkout and on product pages'}
              </p>
            </div>
            {!isFormOpen && (
              <CyberButton size="md" glowColor="cyan" onClick={handleNewLocation}>
                <Plus className="w-4 h-4 mr-2" />
                NEW LOCATION
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
                  <div className="space-y-4">
                    <h2 className="font-orbitron text-xl font-bold mb-4">LOCATION INFORMATION</h2>
                    <div>
                      <Label htmlFor="name">Location Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Bidayah PC - Dubai Store"
                        required
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Label htmlFor="address">Address *</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="Street, building, area"
                        required
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                        placeholder="e.g., Dubai"
                        className="w-full"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="is_active"
                        checked={formData.is_active ?? true}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: Boolean(checked) }))}
                      />
                      <Label htmlFor="is_active" className="cursor-pointer">
                        Active (visible to customers for pickup)
                      </Label>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-4 pt-4 border-t border-border">
                    <CyberButton type="submit" size="lg" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <Loader size="sm" label="Saving..." />
                      ) : (
                        <span className="flex items-center gap-2">
                          <Save className="w-4 h-4" />
                          {isEditing ? 'UPDATE LOCATION' : 'CREATE LOCATION'}
                        </span>
                      )}
                    </CyberButton>
                    <CyberButton
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={() => {
                        setIsFormOpen(false);
                        navigate('/admin/store-locations');
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
                  <Loader label="Loading store locations..." />
                </NeonCard>
              ) : locationList.length === 0 ? (
                <NeonCard className="p-12 text-center" glowColor="cyan" hover={false}>
                  <MapPin className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-orbitron text-xl font-bold mb-2">No Store Locations</h3>
                  <p className="text-muted-foreground mb-6">
                    Add a pickup location so customers can collect orders in-store
                  </p>
                  <CyberButton onClick={handleNewLocation} glowColor="cyan">
                    <Plus className="w-4 h-4 mr-2" />
                    CREATE FIRST LOCATION
                  </CyberButton>
                </NeonCard>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {locationList.map((location, index) => (
                    <motion.div
                      key={location.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <NeonCard className="p-6" glowColor="cyan" hover={false}>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-3 bg-primary/10 rounded-lg">
                              <MapPin className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-rajdhani font-semibold text-lg">
                                {location.name}
                              </h3>
                              <p className="text-xs text-muted-foreground">
                                {[location.address, location.city].filter(Boolean).join(', ')}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="mb-4">
                          <span
                            className={cn(
                              'inline-block px-2 py-1 rounded text-xs font-semibold',
                              location.is_active
                                ? 'bg-accent/10 text-accent'
                                : 'bg-muted text-muted-foreground'
                            )}
                          >
                            {location.is_active ? 'ACTIVE' : 'HIDDEN'}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <CyberButton
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleEdit(location)}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            EDIT
                          </CyberButton>
                          <motion.button
                            onClick={() => handleDelete(location.id)}
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

export default AdminStoreLocationsPage;
