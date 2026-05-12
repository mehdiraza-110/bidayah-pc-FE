import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Upload,
  Image as ImageIcon,
  Video,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import AdminLayout from '@/components/layout/AdminLayout';
import { CyberButton } from '@/components/ui/CyberButton';
import { NeonCard } from '@/components/ui/NeonCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Product, ProductMedia } from '@/data/products';
import { 
  getVendors, 
  getCategories, 
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getKeyFeatures,
  type Vendor, 
  type Category,
  type Product as ApiProduct,
  type KeyFeature,
  type ProductKeyFeatureInput
} from '@/services/api';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { cn } from '@/lib/utils';

type KeyFeatureFormRow = {
  key_feature_id: string;
  feature_key: string;
  value: string;
};

const AdminProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditing = Boolean(id);
  const [productList, setProductList] = useState<Product[]>([]);
  const [vendorList, setVendorList] = useState<Vendor[]>([]);
  const [categoryList, setCategoryList] = useState<Category[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterVendor, setFilterVendor] = useState<string>('');
  const [filterStock, setFilterStock] = useState<string>('');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  
  const [formData, setFormData] = useState<Partial<Product & { category_id?: string }>>({
    name: '',
    category: '',
    category_id: '',
    price: 0,
    image: '',
    media: [],
    description: '',
    specs: [],
    status: 'published',
    stock: 0,
    in_stock: true,
    vendor_id: '',
    originalPrice: 0,
    featured: false,
    new: false,
  });

  const [mediaFiles, setMediaFiles] = useState<(File | null)[]>(Array(5).fill(null));
  const [mediaPreviews, setMediaPreviews] = useState<(ProductMedia | null)[]>(Array(5).fill(null));
  const [specInput, setSpecInput] = useState('');
  const [keyFeatureOptions, setKeyFeatureOptions] = useState<KeyFeature[]>([]);
  const [keyFeatureRows, setKeyFeatureRows] = useState<KeyFeatureFormRow[]>([]);
  const [isKeyFeaturesLoading, setIsKeyFeaturesLoading] = useState(false);
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

  // Helper function to convert API Product to local Product format
  const mapApiProductToLocal = (apiProduct: ApiProduct): Product => {
    return {
      id: apiProduct.id,
      name: apiProduct.name,
      category: apiProduct.category_name || apiProduct.category_id || '',
      price: Number(apiProduct.price),
      originalPrice: apiProduct.original_price ? Number(apiProduct.original_price) : undefined,
      image: apiProduct.image,
      description: apiProduct.description,
      specs: apiProduct.specs?.map(s => s.spec_text) || [],
      rating: apiProduct.rating || 0,
      reviews: apiProduct.reviews_count || 0,
      stock: apiProduct.stock,
      in_stock: apiProduct.in_stock,
      vendor_id: apiProduct.vendor_id,
      status: apiProduct.status || 'published',
      featured: apiProduct.featured,
      new: apiProduct.new_product,
      media: apiProduct.media?.map(m => ({ url: m.url, type: m.type })) || [],
    };
  };

  // Load products, vendors and categories from API
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      // Load vendors
      const vendorsResponse = await getVendors();
      if (vendorsResponse.success && vendorsResponse.data) {
        setVendorList(vendorsResponse.data);
      } else {
        console.error('Failed to load vendors:', vendorsResponse.message);
      }

      // Load categories
      const categoriesResponse = await getCategories();
      if (categoriesResponse.success && categoriesResponse.data) {
        setCategoryList(categoriesResponse.data);
      } else {
        console.error('Failed to load categories:', categoriesResponse.message);
      }

      // Load all products (filtering is done client-side)
      const productsResponse = await getProducts();
      if (productsResponse.success && productsResponse.data) {
        const mappedProducts = productsResponse.data.map(mapApiProductToLocal);
        setProductList(mappedProducts);
      } else {
        console.error('Failed to load products:', productsResponse.message);
        toast.error(productsResponse.message || 'Failed to load products');
      }

      setIsLoading(false);
    };

    loadData();
  }, []); // Load once on mount

  // Load product for editing
  useEffect(() => {
    if (isEditing && id) {
      const loadProduct = async () => {
        const response = await getProductById(id);
        if (response.success && response.data) {
          const product = mapApiProductToLocal(response.data);
          setFormData({
            ...product,
            category_id: product.category_id || response.data.category_id,
          });
          // Set media previews
          const mediaArray = product.media || [];
          const previews: (ProductMedia | null)[] = Array(5).fill(null);
          mediaArray.forEach((media, index) => {
            if (index < 5) previews[index] = media;
          });
          // If no media array but has image, use image as first media
          if (mediaArray.length === 0 && product.image) {
            previews[0] = { url: product.image, type: 'image' };
          }
          setMediaPreviews(previews);
          // Set specs
          setSpecInput(product.specs.join(', '));
          setKeyFeatureRows(
            (response.data.key_features || []).map((feature) => ({
              key_feature_id: feature.key_feature_id || '',
              feature_key: feature.feature_key || '',
              value: feature.feature_value || '',
            }))
          );
        } else {
          toast.error(response.message || 'Product not found');
          navigate('/admin/products');
        }
      };
      loadProduct();
    }
  }, [id, isEditing, navigate]);

  useEffect(() => {
    const loadKeyFeatures = async () => {
      if (!formData.category_id) {
        setKeyFeatureOptions([]);
        return;
      }

      setIsKeyFeaturesLoading(true);
      const response = await getKeyFeatures({
        category_id: formData.category_id,
        is_active: true,
      });

      if (response.success && response.data) {
        setKeyFeatureOptions(response.data);
      } else {
        setKeyFeatureOptions([]);
        toast.error(response.message || 'Failed to load key features');
      }

      setIsKeyFeaturesLoading(false);
    };

    loadKeyFeatures();
  }, [formData.category_id]);


  const handleMediaUpload = (index: number, file: File | null) => {
    if (!file) return;

    // Check if file is image or video
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      toast.error('Please upload an image or video file');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const newFiles = [...mediaFiles];
      newFiles[index] = file;
      setMediaFiles(newFiles);

      const newPreviews = [...mediaPreviews];
      newPreviews[index] = {
        url: reader.result as string,
        type: isImage ? 'image' : 'video',
      };
      setMediaPreviews(newPreviews);

      // Set first media as main image
      if (index === 0 && isImage) {
        setFormData(prev => ({ ...prev, image: reader.result as string }));
      }

      // Update media array in formData
      const mediaArray: ProductMedia[] = newPreviews
        .filter((m): m is ProductMedia => m !== null)
        .map((m, i) => ({
          url: m.url,
          type: m.type,
        }));
      setFormData(prev => ({ ...prev, media: mediaArray }));
    };
    reader.readAsDataURL(file);
  };

  const handleMediaUrlChange = (index: number, url: string, type: 'image' | 'video' = 'image') => {
    const newPreviews = [...mediaPreviews];
    newPreviews[index] = url ? { url, type } : null;
    setMediaPreviews(newPreviews);

    if (index === 0 && type === 'image') {
      setFormData(prev => ({ ...prev, image: url }));
    }

    // Update media array in formData
    const mediaArray: ProductMedia[] = newPreviews
      .filter((m): m is ProductMedia => m !== null)
      .map((m) => ({
        url: m.url,
        type: m.type,
      }));
    setFormData(prev => ({ ...prev, media: mediaArray }));
  };

  const handleRemoveMedia = (index: number) => {
    const newFiles = [...mediaFiles];
    newFiles[index] = null;
    setMediaFiles(newFiles);

    const newPreviews = [...mediaPreviews];
    newPreviews[index] = null;
    setMediaPreviews(newPreviews);

    if (index === 0) {
      setFormData(prev => ({ ...prev, image: '' }));
    }

    // Update media array in formData
    const mediaArray: ProductMedia[] = newPreviews
      .filter((m): m is ProductMedia => m !== null)
      .map((m) => ({
        url: m.url,
        type: m.type,
      }));
    setFormData(prev => ({ ...prev, media: mediaArray }));
  };

  const handleAddSpec = () => {
    if (specInput.trim()) {
      const specs = specInput.split(',').map(s => s.trim()).filter(Boolean);
      setFormData(prev => ({
        ...prev,
        specs: [...(prev.specs || []), ...specs],
      }));
      setSpecInput('');
    }
  };

  const handleRemoveSpec = (index: number) => {
    setFormData(prev => ({
      ...prev,
      specs: prev.specs?.filter((_, i) => i !== index) || [],
    }));
  };

  const handleAddKeyFeatureRow = () => {
    setKeyFeatureRows(prev => [...prev, { key_feature_id: '', feature_key: '', value: '' }]);
  };

  const handleKeyFeatureChange = (index: number, updates: Partial<KeyFeatureFormRow>) => {
    setKeyFeatureRows(prev =>
      prev.map((row, rowIndex) => (rowIndex === index ? { ...row, ...updates } : row))
    );
  };

  const handleSelectKeyFeature = (index: number, keyFeatureId: string) => {
    const selectedFeature = keyFeatureOptions.find(feature => feature.id === keyFeatureId);

    handleKeyFeatureChange(index, {
      key_feature_id: keyFeatureId,
      feature_key: selectedFeature?.feature_key || '',
    });
  };

  const handleRemoveKeyFeatureRow = (index: number) => {
    setKeyFeatureRows(prev => prev.filter((_, rowIndex) => rowIndex !== index));
  };

  const buildKeyFeaturesPayload = (): ProductKeyFeatureInput[] => {
    return keyFeatureRows
      .map(row => ({
        key_feature_id: row.key_feature_id || undefined,
        feature_key: row.key_feature_id ? undefined : row.feature_key.trim(),
        value: row.value.trim(),
      }))
      .filter(feature => feature.value && (feature.key_feature_id || feature.feature_key));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price) {
      toast.error('Please fill in all required fields (name and price)');
      return;
    }

    // For create, main_image is required
    if (!isEditing && !mediaFiles[0] && !formData.image) {
      toast.error('Please upload a main product image');
      return;
    }

    setIsSubmitting(true);

    // Use API
    (async () => {
      try {
        // Get main image (file or URL)
        const mainImage: File | string | undefined = mediaFiles[0] || formData.image || undefined;

        // Get media files (excluding first one which is main image)
        const additionalMediaFiles = mediaFiles.slice(1).filter((f): f is File => f !== null);

        // Get specs as array
        const specsArray = formData.specs || [];
        const keyFeaturesPayload = buildKeyFeaturesPayload();

        if (isEditing && id) {
          // Update existing product
          const updateData: any = {
            name: formData.name,
            price: formData.price,
            category_id: formData.category_id || undefined,
            vendor_id: formData.vendor_id || undefined,
            description: formData.description || undefined,
            stock: formData.stock || 0,
            status: formData.status || 'published',
            featured: formData.featured || false,
            new_product: formData.new || false,
            original_price: formData.originalPrice || undefined,
          };

          if (mainImage) {
            updateData.main_image = mainImage;
          }

          if (additionalMediaFiles.length > 0) {
            updateData.media = additionalMediaFiles;
          }

          if (specsArray.length > 0) {
            updateData.specs = specsArray;
          }

          updateData.key_features = keyFeaturesPayload;

          const response = await updateProduct(id, updateData);
          
          if (response.success && response.data) {
            const updatedProduct = mapApiProductToLocal(response.data);
            setProductList(prev =>
              prev.map(p => (p.id === id ? updatedProduct : p))
            );
            toast.success(response.message || 'Product updated successfully');
            setIsFormOpen(false);
            setFormData({
              name: '',
              category: '',
              category_id: '',
              price: 0,
              image: '',
              media: [],
              description: '',
              specs: [],
              status: 'published',
              stock: 0,
              in_stock: true,
              vendor_id: '',
              originalPrice: 0,
              featured: false,
              new: false,
            });
            setMediaFiles(Array(5).fill(null));
            setMediaPreviews(Array(5).fill(null));
            setSpecInput('');
            setKeyFeatureRows([]);
            navigate('/admin/products');
          } else {
            toast.error(response.message || 'Failed to update product');
          }
        } else {
          // Create new product
          if (!mainImage) {
            toast.error('Main product image is required');
            setIsSubmitting(false);
            return;
          }

          const createData: any = {
            name: formData.name!,
            price: formData.price!,
            main_image: mainImage,
            category_id: formData.category_id || undefined,
            vendor_id: formData.vendor_id || undefined,
            description: formData.description || undefined,
            stock: formData.stock || 0,
            status: formData.status || 'published',
            featured: formData.featured || false,
            new_product: formData.new || false,
            original_price: formData.originalPrice || undefined,
          };

          if (additionalMediaFiles.length > 0) {
            createData.media = additionalMediaFiles;
          }

          if (specsArray.length > 0) {
            createData.specs = specsArray;
          }

          if (keyFeaturesPayload.length > 0) {
            createData.key_features = keyFeaturesPayload;
          }

          const response = await createProduct(createData);
          
          if (response.success && response.data) {
            const newProduct = mapApiProductToLocal(response.data);
            setProductList(prev => [...prev, newProduct]);
            toast.success(response.message || 'Product created successfully');
            setIsFormOpen(false);
            setFormData({
              name: '',
              category: '',
              category_id: '',
              price: 0,
              image: '',
              media: [],
              description: '',
              specs: [],
              status: 'published',
              stock: 0,
              in_stock: true,
              vendor_id: '',
              originalPrice: 0,
              featured: false,
              new: false,
            });
            setMediaFiles(Array(5).fill(null));
            setMediaPreviews(Array(5).fill(null));
            setSpecInput('');
            setKeyFeatureRows([]);
            navigate('/admin/products');
          } else {
            toast.error(response.message || 'Failed to create product');
          }
        }
      } catch (error) {
        toast.error('An unexpected error occurred');
        console.error('Error submitting product:', error);
      } finally {
        setIsSubmitting(false);
      }
    })();
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    const response = await deleteProduct(productId);
    if (response.success) {
      setProductList(prev => prev.filter(p => p.id !== productId));
      toast.success(response.message || 'Product deleted successfully');
    } else {
      toast.error(response.message || 'Failed to delete product');
    }
  };

  const handleEdit = (product: Product) => {
    navigate(`/admin/products/${product.id}`);
    setIsFormOpen(true);
  };

  const handleNewProduct = () => {
    navigate('/admin/products');
    setIsFormOpen(true);
    setFormData({
      name: '',
      category: 'Gaming PC',
      price: 0,
      image: '',
      media: [],
      description: '',
      specs: [],
      status: 'published',
      stock: 0,
      in_stock: true,
      vendor_id: '',
    });
    setMediaFiles(Array(5).fill(null));
    setMediaPreviews(Array(5).fill(null));
    setSpecInput('');
    setKeyFeatureRows([]);
  };

  const handleStatusToggle = async (productId: string, currentStatus: 'published' | 'draft' | undefined) => {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';
    
    const response = await updateProduct(productId, { status: newStatus });
    if (response.success && response.data) {
      const updatedProduct = mapApiProductToLocal(response.data);
      setProductList(prev =>
        prev.map(p => (p.id === productId ? updatedProduct : p))
      );
      toast.success(response.message || `Product status changed to ${newStatus}`);
      setCurrentPage(1); // Reset to first page after status change
    } else {
      toast.error(response.message || 'Failed to update product status');
    }
  };

  // Filter and search products
  const filteredProducts = productList.filter(product => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        (product.description?.toLowerCase().includes(query));
      if (!matchesSearch) return false;
    }

    // Category filter
    if (filterCategory && product.category !== filterCategory) return false;

    // Status filter
    if (filterStatus) {
      if (filterStatus === 'published' && product.status !== 'published') return false;
      if (filterStatus === 'draft' && product.status !== 'draft') return false;
    }

    // Vendor filter
    if (filterVendor && product.vendor_id !== filterVendor) return false;

    // Stock filter (using in_stock boolean)
    if (filterStock) {
      if (filterStock === 'in_stock' && !product.in_stock) return false;
      if (filterStock === 'out_of_stock' && product.in_stock) return false;
    }

    return true;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterCategory, filterStatus, filterVendor, filterStock]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setFilterCategory('');
    setFilterStatus('');
    setFilterVendor('');
    setFilterStock('');
    setCurrentPage(1);
  };

  return (
    <AdminLayout>
      <div className="p-6" ref={containerRef}>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-orbitron text-3xl font-bold mb-2">
                PRODUCT <span className="text-primary">MANAGEMENT</span>
              </h1>
              <p className="text-muted-foreground">
                {isFormOpen ? (isEditing ? 'Edit Product' : 'Create New Product') : 'Manage your product catalog'}
              </p>
            </div>
            {!isFormOpen && (
              <CyberButton size="md" glowColor="cyan" onClick={handleNewProduct}>
                <Plus className="w-4 h-4 mr-2" />
                NEW PRODUCT
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
                  {/* Basic Information */}
                  <div>
                    <h2 className="font-orbitron text-xl font-bold mb-4">BASIC INFORMATION</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Product Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="VORTEX RTX 4090 EXTREME"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="category_id">Product Category</Label>
                        <select
                          id="category_id"
                          value={formData.category_id || ''}
                          onChange={(e) => {
                            setFormData(prev => ({
                              ...prev,
                              category_id: e.target.value || undefined,
                              category: categoryList.find(c => c.id === e.target.value)?.category_name || ''
                            }));
                            setKeyFeatureRows([]);
                          }}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          <option value="">Select a category</option>
                          {categoryList.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.category_name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="price">Price (AED) *</Label>
                        <Input
                          id="price"
                          type="number"
                          value={formData.price || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                          placeholder="4299"
                          required
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <Label htmlFor="vendor_id">Vendor</Label>
                        <select
                          id="vendor_id"
                          value={formData.vendor_id || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, vendor_id: e.target.value || undefined }))}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          <option value="">Select a vendor</option>
                          {vendorList.map(vendor => (
                            <option key={vendor.id} value={vendor.id}>{vendor.vendor_name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Product Media */}
                  <div>
                    <h2 className="font-orbitron text-xl font-bold mb-4">PRODUCT MEDIA (5 max - Images/Videos)</h2>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {mediaPreviews.map((preview, index) => (
                        <div key={index} className="space-y-2">
                          <Label className="text-xs">
                            {index === 0 ? 'Main Media *' : `Media ${index + 1}`}
                          </Label>
                          <div className="relative aspect-square border-2 border-dashed border-border rounded-lg overflow-hidden group">
                            {preview ? (
                              <>
                                {preview.type === 'image' ? (
                                  <img
                                    src={preview.url}
                                    alt={`Preview ${index + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <video
                                    src={preview.url}
                                    className="w-full h-full object-cover"
                                    controls={false}
                                  />
                                )}
                                <div className="absolute top-1 right-1">
                                  {preview.type === 'image' ? (
                                    <ImageIcon className="w-4 h-4 text-primary" />
                                  ) : (
                                    <Video className="w-4 h-4 text-primary" />
                                  )}
                                </div>
                                <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                  <motion.button
                                    type="button"
                                    onClick={() => handleRemoveMedia(index)}
                                    className="p-2 bg-destructive text-destructive-foreground rounded-lg"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                  >
                                    <X className="w-4 h-4" />
                                  </motion.button>
                                </div>
                              </>
                            ) : (
                              <label className="flex flex-col items-center justify-center h-full cursor-pointer hover:bg-muted/50 transition-colors">
                                <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                                <span className="text-xs text-muted-foreground text-center px-2">Upload Image/Video</span>
                                <input
                                  type="file"
                                  accept="image/*,video/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleMediaUpload(index, file);
                                  }}
                                />
                              </label>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Input
                              type="url"
                              placeholder="Or enter URL"
                              value={preview?.url || ''}
                              onChange={(e) => {
                                const url = e.target.value;
                                if (url) {
                                  const type = url.match(/\.(mp4|webm|ogg)$/i) ? 'video' : 'image';
                                  handleMediaUrlChange(index, url, type);
                                } else {
                                  handleRemoveMedia(index);
                                }
                              }}
                              className="text-xs flex-1"
                            />
                            {preview && (
                              <select
                                value={preview.type}
                                onChange={(e) => {
                                  const newPreviews = [...mediaPreviews];
                                  if (newPreviews[index]) {
                                    newPreviews[index] = {
                                      ...newPreviews[index]!,
                                      type: e.target.value as 'image' | 'video',
                                    };
                                    setMediaPreviews(newPreviews);
                                  }
                                }}
                                className="text-xs border border-input rounded px-2 bg-background"
                              >
                                <option value="image">Image</option>
                                <option value="video">Video</option>
                              </select>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Product Description */}
                  <div>
                    <h2 className="font-orbitron text-xl font-bold mb-4">PRODUCT DESCRIPTION</h2>
                    <RichTextEditor
                      value={formData.description || ''}
                      onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                      placeholder="Enter product description..."
                    />
                  </div>

                  {/* Specifications */}
                  <div>
                    <h2 className="font-orbitron text-xl font-bold mb-4">SPECIFICATIONS</h2>
                    <div className="flex gap-2 mb-4">
                      <Input
                        value={specInput}
                        onChange={(e) => setSpecInput(e.target.value)}
                        placeholder="Enter specs (comma-separated)"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddSpec();
                          }
                        }}
                      />
                      <CyberButton type="button" onClick={handleAddSpec} size="md">
                        <Plus className="w-4 h-4" />
                      </CyberButton>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.specs?.map((spec, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/30 rounded-lg"
                        >
                          <span className="text-sm">{spec}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSpec(index)}
                            className="text-destructive hover:text-destructive/80"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Key Features */}
                  {formData.category_id && (
                    <div>
                      <div className="mb-4 flex items-center justify-between gap-4">
                        <div>
                          <h2 className="font-orbitron text-xl font-bold">KEY FEATURES</h2>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Select reusable category keys or add new keys, then enter product-specific values.
                          </p>
                        </div>
                        <CyberButton type="button" onClick={handleAddKeyFeatureRow} size="md" variant="outline">
                          <Plus className="w-4 h-4 mr-2" />
                          ADD FEATURE
                        </CyberButton>
                      </div>

                      {isKeyFeaturesLoading ? (
                        <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
                          Loading key features...
                        </div>
                      ) : keyFeatureRows.length === 0 ? (
                        <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
                          No key features added yet. Add a feature to create filterable product details.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {keyFeatureRows.map((row, index) => {
                            const isCustomKey = !row.key_feature_id;

                            return (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="grid gap-3 rounded-lg border border-border bg-muted/20 p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]"
                              >
                                <div>
                                  <Label>Feature Key</Label>
                                  <select
                                    value={row.key_feature_id || ''}
                                    onChange={(event) => handleSelectKeyFeature(index, event.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                  >
                                    <option value="">New custom key</option>
                                    {keyFeatureOptions.map((feature) => (
                                      <option key={feature.id} value={feature.id}>
                                        {feature.feature_key}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div>
                                  <Label>{isCustomKey ? 'New Key Name' : 'Selected Key'}</Label>
                                  <Input
                                    value={row.feature_key}
                                    onChange={(event) => handleKeyFeatureChange(index, { feature_key: event.target.value })}
                                    placeholder="Ram Speed"
                                    disabled={!isCustomKey}
                                  />
                                </div>

                                <div>
                                  <Label>Value</Label>
                                  <Input
                                    value={row.value}
                                    onChange={(event) => handleKeyFeatureChange(index, { value: event.target.value })}
                                    placeholder="3200MHz"
                                  />
                                </div>

                                <div className="flex items-end">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveKeyFeatureRow(index)}
                                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-destructive text-destructive transition-colors hover:bg-destructive/10"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Stock */}
                  <div>
                    <h2 className="font-orbitron text-xl font-bold mb-4">STOCK</h2>
                    <div>
                      <Label htmlFor="stock">Stock Quantity *</Label>
                      <Input
                        id="stock"
                        type="number"
                        value={formData.stock || ''}
                        onChange={(e) => {
                          const stockValue = parseInt(e.target.value) || 0;
                          setFormData(prev => ({ 
                            ...prev, 
                            stock: stockValue,
                            in_stock: stockValue > 0 // Auto-update in_stock based on stock
                          }));
                        }}
                        placeholder="0"
                        required
                        min="0"
                        step="1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Enter the number of items available in stock
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
                          {isEditing ? 'UPDATE PRODUCT' : 'CREATE PRODUCT'}
                        </span>
                      )}
                    </CyberButton>
                    <CyberButton
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={() => {
                        setIsFormOpen(false);
                        navigate('/admin/products');
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
              {/* Search and Filters */}
              <NeonCard className="p-6 mb-6" glowColor="cyan" hover={false}>
                <div className="space-y-4">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search products by name, category, or description..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Filters */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div>
                      <Label className="text-xs mb-2 block">Category</Label>
                      <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <option value="">All Categories</option>
                        {categoryList.map(cat => (
                          <option key={cat.id} value={cat.category_name}>{cat.category_name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label className="text-xs mb-2 block">Status</Label>
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <option value="">All Status</option>
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                      </select>
                    </div>

                    <div>
                      <Label className="text-xs mb-2 block">Vendor</Label>
                      <select
                        value={filterVendor}
                        onChange={(e) => setFilterVendor(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <option value="">All Vendors</option>
                        {vendorList.map(vendor => (
                          <option key={vendor.id} value={vendor.id}>{vendor.vendor_name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label className="text-xs mb-2 block">Stock</Label>
                      <select
                        value={filterStock}
                        onChange={(e) => setFilterStock(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <option value="">All Stock</option>
                        <option value="in_stock">In Stock</option>
                        <option value="out_of_stock">Out of Stock</option>
                      </select>
                    </div>

                    <div className="flex items-end">
                      <CyberButton
                        variant="outline"
                        size="sm"
                        onClick={handleClearFilters}
                        className="w-full"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Clear Filters
                      </CyberButton>
                    </div>
                  </div>

                  {/* Results count */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                      Showing {startIndex + 1}-{Math.min(endIndex, filteredProducts.length)} of {filteredProducts.length} products
                    </span>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">Items per page:</Label>
                      <select
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                      >
                        <option value="6">6</option>
                        <option value="12">12</option>
                        <option value="24">24</option>
                        <option value="48">48</option>
                      </select>
                    </div>
                  </div>
                </div>
              </NeonCard>

              {/* Products Grid */}
              {paginatedProducts.length === 0 ? (
                <NeonCard className="p-12 text-center" glowColor="cyan" hover={false}>
                  <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-orbitron text-xl font-bold mb-2">No Products Found</h3>
                  <p className="text-muted-foreground mb-6">
                    {filteredProducts.length === 0 && productList.length > 0
                      ? 'Try adjusting your search or filters'
                      : 'Get started by creating your first product'}
                  </p>
                  {productList.length === 0 && (
                    <CyberButton onClick={handleNewProduct} glowColor="cyan">
                      <Plus className="w-4 h-4 mr-2" />
                      CREATE FIRST PRODUCT
                    </CyberButton>
                  )}
                </NeonCard>
              ) : (
                <>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paginatedProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <NeonCard className="p-4" glowColor="cyan" hover={false}>
                      <div className="aspect-square overflow-hidden rounded-lg bg-muted mb-4">
                        {product.media && product.media.length > 0 && product.media[0].type === 'video' ? (
                          <video
                            src={product.media[0].url}
                            className="w-full h-full object-cover"
                            controls={false}
                            muted
                          />
                        ) : (
                          <img
                            src={product.image || (product.media && product.media[0]?.url) || ''}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <h3 className="font-rajdhani font-semibold text-lg mb-2">{product.name}</h3>
                        <p className="text-primary font-orbitron text-xl mb-2">
                          AED {product.price.toLocaleString()}
                        </p>
                      <div className="flex items-center gap-2 mb-4 flex-wrap">
                        <span className={cn(
                          "px-2 py-1 text-xs rounded flex items-center gap-1",
                          product.in_stock
                            ? "bg-green-500/10 text-green-500"
                            : "bg-destructive/10 text-destructive"
                        )}>
                          {product.in_stock ? (
                            <>
                              <Check className="w-3 h-3" />
                              Stock: {product.stock}
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3 h-3" />
                              Out of Stock
                            </>
                          )}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <CyberButton
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleStatusToggle(product.id, product.status)}
                        >
                          {product.status === 'published' ? (
                            <>
                              <EyeOff className="w-4 h-4 mr-2" />
                              UNPUBLISH
                            </>
                          ) : (
                            <>
                              <Eye className="w-4 h-4 mr-2" />
                              PUBLISH
                            </>
                          )}
                        </CyberButton>
                        <motion.button
                          onClick={() => handleEdit(product)}
                          className="p-2 rounded-lg border border-border text-foreground hover:bg-muted transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Edit className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          onClick={() => handleDelete(product.id)}
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

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-8 flex items-center justify-center gap-2">
                      <CyberButton
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </CyberButton>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                          // Show first page, last page, current page, and pages around current
                          if (
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 1 && page <= currentPage + 1)
                          ) {
                            return (
                              <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={cn(
                                  "w-10 h-10 rounded-lg border transition-colors",
                                  currentPage === page
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "border-border hover:bg-muted"
                                )}
                              >
                                {page}
                              </button>
                            );
                          } else if (
                            page === currentPage - 2 ||
                            page === currentPage + 2
                          ) {
                            return (
                              <span key={page} className="px-2 text-muted-foreground">
                                ...
                              </span>
                            );
                          }
                          return null;
                        })}
                      </div>

                      <CyberButton
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </CyberButton>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  );
};

export default AdminProductsPage;
