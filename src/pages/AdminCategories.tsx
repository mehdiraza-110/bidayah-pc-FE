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
} from 'lucide-react';
import { toast } from 'sonner';
import AdminLayout from '@/components/layout/AdminLayout';
import { CyberButton } from '@/components/ui/CyberButton';
import { NeonCard } from '@/components/ui/NeonCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  getCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory, 
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
  });
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);

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
        });

        if (response.success && response.data) {
          setCategoryList(prev =>
            prev.map(c => (c.id === id ? response.data! : c))
          );
          toast.success(response.message || 'Category updated successfully');
          setIsFormOpen(false);
          setFormData({ category_name: '', image: '' });
          setImagePreview('');
          setImageFile(null);
          navigate('/admin/categories');
        } else {
          toast.error(response.message || 'Failed to update category');
        }
      } else {
        // Create new category
        const response = await createCategory({
          category_name: formData.category_name!.trim(),
          image: imageFile || (imagePreview || undefined), // Use file if available, otherwise use URL
        });

        if (response.success && response.data) {
          setCategoryList(prev => [...prev, response.data!]);
          toast.success(response.message || 'Category created successfully');
          setIsFormOpen(false);
          setFormData({ category_name: '', image: '' });
          setImagePreview('');
          setImageFile(null);
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
    });
    setImagePreview('');
    setImageFile(null);
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
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"
                  />
                  <p className="text-muted-foreground mt-4">Loading categories...</p>
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
    </AdminLayout>
  );
};

export default AdminCategoriesPage;
