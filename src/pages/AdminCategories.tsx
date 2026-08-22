import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import {
  Folder,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Check,
  AlertCircle,
  Upload,
  Image as ImageIcon,
  Video,
  Eye,
  EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';
import AdminLayout from '@/components/layout/AdminLayout';
import { CyberButton } from '@/components/ui/CyberButton';
import { Loader } from '@/components/ui/Loader';
import { NeonCard } from '@/components/ui/NeonCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
} from '@/components/ui/alert-dialog';
import { ImpactProductsModal } from '@/components/ui/ImpactProductsModal';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryUnpublishImpact,
  getCategoryUnpublishImpactProducts,
  setCategoryPublishStatus,
  type Category
} from '@/services/api';
import { cn } from '@/lib/utils';

const AdminCategoriesPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditing = Boolean(id);
  const [categoryList, setCategoryList] = useState<Category[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [formData, setFormData] = useState<Partial<Category>>({
    category_name: '',
    image: '',
    hero_tagline: '',
    hero_description: '',
  });
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [heroImagePreview, setHeroImagePreview] = useState<string>('');
  const [heroImageFile, setHeroImageFile] = useState<File | null>(null);

  // Unpublish confirmation (cascades to this category's vendors, then their products)
  const [unpublishTarget, setUnpublishTarget] = useState<Category | null>(null);
  const [unpublishImpact, setUnpublishImpact] = useState<{ vendorCount: number; productCount: number } | null>(null);
  const [isLoadingImpact, setIsLoadingImpact] = useState(false);
  const [isTogglingId, setIsTogglingId] = useState<string | null>(null);
  const [isImpactProductsOpen, setIsImpactProductsOpen] = useState(false);

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

  // Load categories from API
  useEffect(() => {
    const loadCategories = async () => {
      setIsLoading(true);
      const response = await getCategories();
      if (response.success && response.data) {
        setCategoryList(response.data);
      } else {
        toast.error(response.message || 'Failed to load categories');
      }
      setIsLoading(false);
    };

    loadCategories();
  }, []);

  // Load category for editing
  useEffect(() => {
    if (isEditing && id) {
      const category = categoryList.find(c => c.id === id);
      if (category) {
        setFormData(category);
        setImagePreview(category.image || '');
        setImageFile(null); // Reset file when loading from API
        setHeroImagePreview(category.hero_image || '');
        setHeroImageFile(null);
      } else if (!isLoading && categoryList.length > 0) {
        // Category not found
        toast.error('Category not found');
        navigate('/admin/categories');
      }
    }
  }, [id, isEditing, categoryList, isLoading, navigate]);

  const handleImageUpload = (file: File | null) => {
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      toast.error('Please upload an image or video file');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
      setImageFile(file);
      setFormData(prev => ({ ...prev, image: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleImageUrlChange = (url: string) => {
    setImagePreview(url);
    setImageFile(null);
    setFormData(prev => ({ ...prev, image: url }));
  };

  const handleRemoveImage = () => {
    setImagePreview('');
    setImageFile(null);
    setFormData(prev => ({ ...prev, image: '' }));
  };

  const handleHeroImageUpload = (file: File | null) => {
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      toast.error('Please upload an image or video file');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setHeroImagePreview(reader.result as string);
      setHeroImageFile(file);
      setFormData(prev => ({ ...prev, hero_image: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleHeroImageUrlChange = (url: string) => {
    setHeroImagePreview(url);
    setHeroImageFile(null);
    setFormData(prev => ({ ...prev, hero_image: url }));
  };

  const handleRemoveHeroImage = () => {
    setHeroImagePreview('');
    setHeroImageFile(null);
    setFormData(prev => ({ ...prev, hero_image: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category_name || formData.category_name.trim() === '') {
      toast.error('Please enter a category name');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditing && id) {
        // Update existing category
        const response = await updateCategory(id, {
          category_name: formData.category_name!.trim(),
          image: imageFile || (imagePreview || undefined), // Use file if available, otherwise use URL
          hero_image: heroImageFile || (heroImagePreview || undefined),
          hero_tagline: formData.hero_tagline ?? '',
          hero_description: formData.hero_description ?? '',
        });

        if (response.success && response.data) {
          setCategoryList(prev =>
            prev.map(c => (c.id === id ? response.data! : c))
          );
          toast.success(response.message || 'Category updated successfully');
          setIsFormOpen(false);
          setFormData({ category_name: '', image: '', hero_tagline: '', hero_description: '' });
          setImagePreview('');
          setImageFile(null);
          setHeroImagePreview('');
          setHeroImageFile(null);
          navigate('/admin/categories');
        } else {
          toast.error(response.message || 'Failed to update category');
        }
      } else {
        // Create new category
        const response = await createCategory({
          category_name: formData.category_name!.trim(),
          image: imageFile || (imagePreview || undefined), // Use file if available, otherwise use URL
          hero_image: heroImageFile || (heroImagePreview || undefined),
          hero_tagline: formData.hero_tagline ?? '',
          hero_description: formData.hero_description ?? '',
        });

        if (response.success && response.data) {
          setCategoryList(prev => [...prev, response.data!]);
          toast.success(response.message || 'Category created successfully');
          setIsFormOpen(false);
          setFormData({ category_name: '', image: '', hero_tagline: '', hero_description: '' });
          setImagePreview('');
          setImageFile(null);
          setHeroImagePreview('');
          setHeroImageFile(null);
          navigate('/admin/categories');
        } else {
          toast.error(response.message || 'Failed to create category');
        }
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (categoryId: string) => {
    const category = categoryList.find(c => c.id === categoryId);
    if (!confirm(`Are you sure you want to delete "${category?.category_name}"?`)) {
      return;
    }

    const response = await deleteCategory(categoryId);
    if (response.success) {
      setCategoryList(prev => prev.filter(c => c.id !== categoryId));
      toast.success(response.message || 'Category deleted successfully');
    } else {
      toast.error(response.message || 'Failed to delete category');
    }
  };

  const handleTogglePublish = async (category: Category) => {
    if (category.is_published === false) {
      // Re-publishing is non-destructive — no confirmation needed.
      setIsTogglingId(category.id);
      const response = await setCategoryPublishStatus(category.id, true);
      if (response.success && response.data) {
        setCategoryList(prev => prev.map(c => (c.id === category.id ? response.data!.category : c)));
        toast.success(response.message || 'Category published');
      } else {
        toast.error(response.message || 'Failed to publish category');
      }
      setIsTogglingId(null);
      return;
    }

    // Unpublishing cascades to this category's vendors, then their products — preview the impact first.
    setUnpublishTarget(category);
    setIsImpactProductsOpen(false);
    setIsLoadingImpact(true);
    const response = await getCategoryUnpublishImpact(category.id);
    setUnpublishImpact(response.success && response.data ? response.data : { vendorCount: 0, productCount: 0 });
    setIsLoadingImpact(false);
  };

  const handleConfirmUnpublish = async () => {
    if (!unpublishTarget) return;

    setIsTogglingId(unpublishTarget.id);
    const response = await setCategoryPublishStatus(unpublishTarget.id, false);
    if (response.success && response.data) {
      setCategoryList(prev => prev.map(c => (c.id === unpublishTarget.id ? response.data!.category : c)));
      toast.success(response.message || 'Category unpublished');
    } else {
      toast.error(response.message || 'Failed to unpublish category');
    }
    setIsTogglingId(null);
    setUnpublishTarget(null);
    setUnpublishImpact(null);
  };

  const handleEdit = (category: Category) => {
    navigate(`/admin/categories/${category.id}`);
    setIsFormOpen(true);
  };

  const handleNewCategory = () => {
    navigate('/admin/categories');
    setIsFormOpen(true);
    setFormData({
      category_name: '',
      image: '',
      hero_tagline: '',
      hero_description: '',
    });
    setImagePreview('');
    setImageFile(null);
    setHeroImagePreview('');
    setHeroImageFile(null);
  };

  return (
    <AdminLayout>
      <div className="p-6" ref={containerRef}>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-orbitron text-3xl font-bold mb-2">
                CATEGORY <span className="text-primary">MANAGEMENT</span>
              </h1>
              <p className="text-muted-foreground">
                {isFormOpen ? (isEditing ? 'Edit Category' : 'Create New Category') : 'Manage your product categories'}
              </p>
            </div>
            {!isFormOpen && (
              <CyberButton size="md" glowColor="cyan" onClick={handleNewCategory}>
                <Plus className="w-4 h-4 mr-2" />
                NEW CATEGORY
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
                  {/* Category Name */}
                  <div>
                    <h2 className="font-orbitron text-xl font-bold mb-4">CATEGORY INFORMATION</h2>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="category_name">Category Name *</Label>
                        <Input
                          id="category_name"
                          value={formData.category_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, category_name: e.target.value }))}
                          placeholder="e.g., Gaming PC, Peripherals, Monitors"
                          required
                          className="w-full"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Enter the name of the category
                        </p>
                      </div>

                      {/* Category Image */}
                      <div>
                        <Label>Category Image/Video</Label>
                        <div className="mt-2">
                          {imagePreview ? (
                            <div className="relative aspect-video border-2 border-border rounded-lg overflow-hidden group">
                              {imagePreview.match(/\.(mp4|webm|ogg)$/i) ? (
                                <video
                                  src={imagePreview}
                                  className="w-full h-full object-cover"
                                  controls={false}
                                  muted
                                />
                              ) : (
                                <img
                                  src={imagePreview}
                                  alt="Category preview"
                                  className="w-full h-full object-cover"
                                />
                              )}
                              <div className="absolute top-1 right-1">
                                {imagePreview.match(/\.(mp4|webm|ogg)$/i) ? (
                                  <Video className="w-4 h-4 text-primary" />
                                ) : (
                                  <ImageIcon className="w-4 h-4 text-primary" />
                                )}
                              </div>
                              <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <motion.button
                                  type="button"
                                  onClick={handleRemoveImage}
                                  className="p-2 bg-destructive text-destructive-foreground rounded-lg"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  <X className="w-4 h-4" />
                                </motion.button>
                              </div>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                              <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                              <span className="text-sm text-muted-foreground">Upload Image/Video</span>
                              <input
                                type="file"
                                accept="image/*,video/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleImageUpload(file);
                                }}
                              />
                            </label>
                          )}
                          <Input
                            type="url"
                            placeholder="Or enter image/video URL"
                            value={imagePreview}
                            onChange={(e) => handleImageUrlChange(e.target.value)}
                            className="mt-2"
                          />
                          {imageFile && (
                            <p className="text-xs text-muted-foreground mt-1">
                              File size: {(imageFile.size / (1024 * 1024)).toFixed(2)}MB
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Category Hero Banner — shown on this category's product-listing
                      page above the grid. Entirely optional; leave it empty to keep
                      the plain heading. */}
                  <div className="pt-6 border-t border-border">
                    <h2 className="font-orbitron text-xl font-bold mb-4">CATEGORY HERO BANNER</h2>
                    <p className="text-xs text-muted-foreground mb-4">
                      Shown above the product grid when a customer browses this category. Leave blank to keep the default heading.
                    </p>
                    <div className="space-y-4">
                      <div>
                        <Label>Hero Image</Label>
                        <div className="mt-2">
                          {heroImagePreview ? (
                            <div className="relative aspect-[16/6] border-2 border-border rounded-lg overflow-hidden group">
                              {heroImagePreview.match(/\.(mp4|webm|ogg)$/i) ? (
                                <video
                                  src={heroImagePreview}
                                  className="w-full h-full object-cover"
                                  controls={false}
                                  muted
                                />
                              ) : (
                                <img
                                  src={heroImagePreview}
                                  alt="Hero preview"
                                  className="w-full h-full object-cover"
                                />
                              )}
                              <div className="absolute top-1 right-1">
                                {heroImagePreview.match(/\.(mp4|webm|ogg)$/i) ? (
                                  <Video className="w-4 h-4 text-primary" />
                                ) : (
                                  <ImageIcon className="w-4 h-4 text-primary" />
                                )}
                              </div>
                              <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <motion.button
                                  type="button"
                                  onClick={handleRemoveHeroImage}
                                  className="p-2 bg-destructive text-destructive-foreground rounded-lg"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  <X className="w-4 h-4" />
                                </motion.button>
                              </div>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                              <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                              <span className="text-sm text-muted-foreground">Upload Hero Image/Video</span>
                              <input
                                type="file"
                                accept="image/*,video/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleHeroImageUpload(file);
                                }}
                              />
                            </label>
                          )}
                          <Input
                            type="url"
                            placeholder="Or enter hero image/video URL"
                            value={heroImagePreview}
                            onChange={(e) => handleHeroImageUrlChange(e.target.value)}
                            className="mt-2"
                          />
                          {heroImageFile && (
                            <p className="text-xs text-muted-foreground mt-1">
                              File size: {(heroImageFile.size / (1024 * 1024)).toFixed(2)}MB
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="hero_tagline">Hero Tagline</Label>
                        <Input
                          id="hero_tagline"
                          value={formData.hero_tagline || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, hero_tagline: e.target.value }))}
                          placeholder="e.g., Built By Experts, Trusted By Gamers"
                          className="w-full"
                        />
                      </div>

                      <div>
                        <Label htmlFor="hero_description">Hero Description</Label>
                        <Textarea
                          id="hero_description"
                          value={formData.hero_description || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, hero_description: e.target.value }))}
                          placeholder="A sentence or two introducing this category to shoppers."
                          rows={3}
                          className="w-full"
                        />
                      </div>
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
                          {isEditing ? 'UPDATE CATEGORY' : 'CREATE CATEGORY'}
                        </span>
                      )}
                    </CyberButton>
                    <CyberButton
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={() => {
                        setIsFormOpen(false);
                        navigate('/admin/categories');
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
                  <Loader label="Loading categories..." />
                </NeonCard>
              ) : categoryList.length === 0 ? (
                <NeonCard className="p-12 text-center" glowColor="cyan" hover={false}>
                  <Folder className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-orbitron text-xl font-bold mb-2">No Categories</h3>
                  <p className="text-muted-foreground mb-6">
                    Get started by creating your first category
                  </p>
                  <CyberButton onClick={handleNewCategory} glowColor="cyan">
                    <Plus className="w-4 h-4 mr-2" />
                    CREATE FIRST CATEGORY
                  </CyberButton>
                </NeonCard>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categoryList.map((category, index) => (
                    <motion.div
                      key={category.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <NeonCard className="p-6" glowColor="cyan" hover={false}>
                        {category.image ? (
                          <div className="aspect-video overflow-hidden rounded-lg bg-muted mb-4">
                            {category.image.match(/\.(mp4|webm|ogg)$/i) ? (
                              <video
                                src={category.image}
                                className="w-full h-full object-cover"
                                controls={false}
                                muted
                              />
                            ) : (
                              <img
                                src={category.image}
                                alt={category.category_name}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                        ) : (
                          <div className="aspect-video bg-muted/30 rounded-lg flex items-center justify-center mb-4">
                            <Folder className="w-12 h-12 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-3 bg-primary/10 rounded-lg">
                              <Folder className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-rajdhani font-semibold text-lg">
                                {category.category_name}
                              </h3>
                              <p className="text-xs text-muted-foreground">
                                ID: {category.id}
                              </p>
                            </div>
                          </div>
                          <span className={cn(
                            "px-2 py-1 text-xs rounded whitespace-nowrap",
                            category.is_published === false
                              ? "bg-muted text-muted-foreground"
                              : "bg-green-500/10 text-green-500"
                          )}>
                            {category.is_published === false ? 'Unpublished' : 'Published'}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <CyberButton
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleEdit(category)}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            EDIT
                          </CyberButton>
                          <motion.button
                            onClick={() => handleTogglePublish(category)}
                            disabled={isTogglingId === category.id}
                            className="p-2 rounded-lg border border-border text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            aria-label={category.is_published === false ? 'Publish category' : 'Unpublish category'}
                          >
                            {category.is_published === false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </motion.button>
                          <motion.button
                            onClick={() => handleDelete(category.id)}
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

      <AlertDialog open={!!unpublishTarget} onOpenChange={(open) => { if (!open) { setUnpublishTarget(null); setUnpublishImpact(null); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unpublish "{unpublishTarget?.category_name}"?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                {isLoadingImpact ? (
                  <Loader size="sm" label="Checking impact..." />
                ) : (
                  <>
                    This will unpublish{' '}
                    <span className="font-semibold text-foreground">
                      {unpublishImpact?.vendorCount ?? 0} vendor{(unpublishImpact?.vendorCount ?? 0) === 1 ? '' : 's'}
                    </span>{' '}
                    selling in this category, and{' '}
                    <span className="font-semibold text-foreground">
                      {unpublishImpact?.productCount ?? 0} product{(unpublishImpact?.productCount ?? 0) === 1 ? '' : 's'}
                    </span>{' '}
                    belonging to those vendors (across all categories, not just this one). None of it will be visible on the storefront until republished individually.
                    {(unpublishImpact?.productCount ?? 0) > 0 && (
                      <div className="mt-3">
                        <CyberButton
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setIsImpactProductsOpen(true)}
                        >
                          Show Products
                        </CyberButton>
                      </div>
                    )}
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <CyberButton
              type="button"
              variant="outline"
              onClick={() => { setUnpublishTarget(null); setUnpublishImpact(null); }}
              disabled={isTogglingId === unpublishTarget?.id}
            >
              Cancel
            </CyberButton>
            <CyberButton
              type="button"
              onClick={handleConfirmUnpublish}
              disabled={isLoadingImpact || isTogglingId === unpublishTarget?.id}
            >
              {isTogglingId === unpublishTarget?.id ? (
                <Loader size="sm" label="Unpublishing..." />
              ) : (
                'Unpublish Category'
              )}
            </CyberButton>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {unpublishTarget && (
        <ImpactProductsModal
          open={isImpactProductsOpen}
          onOpenChange={setIsImpactProductsOpen}
          title={`Products to be unpublished — ${unpublishTarget.category_name}`}
          fetchPage={({ limit, offset }) => getCategoryUnpublishImpactProducts(unpublishTarget.id, { limit, offset })}
        />
      )}
    </AdminLayout>
  );
};

export default AdminCategoriesPage;
