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
  LayoutGrid,
  List,
  ChevronUp,
  ChevronDown,
  Star,
} from 'lucide-react';
import { toast } from 'sonner';
import AdminLayout from '@/components/layout/AdminLayout';
import { CyberButton } from '@/components/ui/CyberButton';
import { NeonCard } from '@/components/ui/NeonCard';
import { Loader } from '@/components/ui/Loader';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { Product } from '@/data/products';
import { mapApiProductToLocal as mapApiProductToLocalBase } from '@/lib/mapProduct';
import { 
  getVendors, 
  getCategories, 
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkDeleteProducts,
  getKeyFeatures,
  type Vendor, 
  type Category,
  type Product as ApiProduct,
  type KeyFeature,
  type ProductKeyFeatureInput,
  type ProductMediaSlotInput
} from '@/services/api';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

type KeyFeatureFormRow = {
  key_feature_id: string;
  feature_key: string;
  value: string;
};

// One cover/gallery slot in the admin form — either an already-uploaded
// image/video kept in place (no re-upload needed) or a brand-new file just
// picked. `previewUrl` is what actually renders (an objectURL for a new
// file, the real URL for an existing one); `key` is stable across reorders.
type MediaSlotState = {
  key: string;
  source: 'existing' | 'new';
  url?: string;
  file?: File;
  previewUrl: string;
  type: 'image' | 'video';
};

type ApiProductVendorFallback = ApiProduct & {
  vendorId?: string | null;
  vendor?: string | { id?: string | null; vendor_id?: string | null; vendor_name?: string | null; name?: string | null } | null;
  vendors?: Array<{ id?: string | null; vendor_id?: string | null; vendor_name?: string | null; name?: string | null }>;
};

const ProductListLoader = () => (
  <NeonCard className="p-6" glowColor="cyan" hover={false}>
    <div className="border-b border-border pb-4">
      <Loader label="Loading products..." />
    </div>
    <div className="mt-4 overflow-hidden">
      <div className="grid grid-cols-[72px_1.4fr_0.8fr_0.7fr_0.8fr_120px] gap-4 px-2 py-3 text-xs font-orbitron text-muted-foreground max-lg:hidden">
        <span>Image</span>
        <span>Product</span>
        <span>Category</span>
        <span>Price</span>
        <span>Stock</span>
        <span>Actions</span>
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="grid grid-cols-[72px_1.4fr_0.8fr_0.7fr_0.8fr_120px] gap-4 px-2 py-4 max-lg:grid-cols-[72px_1fr] max-lg:items-center"
          >
            <Skeleton className="h-14 w-14 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-4 w-24 max-lg:hidden" />
            <Skeleton className="h-4 w-20 max-lg:hidden" />
            <Skeleton className="h-6 w-24 max-lg:hidden" />
            <div className="flex gap-2 max-lg:hidden">
              <Skeleton className="h-9 flex-1" />
              <Skeleton className="h-9 w-9" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </NeonCard>
);

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

  // View mode + bulk selection/edit (list view only)
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [bulkCategoryId, setBulkCategoryId] = useState('');
  const [bulkVendorId, setBulkVendorId] = useState('');
  const [isBulkSaving, setIsBulkSaving] = useState(false);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

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

  // One image/video slot — either an already-uploaded file kept in place (no
  // re-upload needed) or a brand-new file just picked. `previewUrl` is what
  // actually renders (an objectURL for a new file, the real URL for an
  // existing one); `key` is stable across reorders for React's sake.
  const [coverSlot, setCoverSlot] = useState<MediaSlotState | null>(null);
  const [gallerySlots, setGallerySlots] = useState<MediaSlotState[]>([]);
  const nextSlotKeyRef = useRef(0);
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
  const resolveProductVendorId = (apiProduct: ApiProduct, vendors: Vendor[] = []): string | undefined => {
    const product = apiProduct as ApiProductVendorFallback;
    const directVendorId =
      apiProduct.vendor_id ||
      product.vendorId ||
      product.vendors?.[0]?.id ||
      product.vendors?.[0]?.vendor_id ||
      (typeof product.vendor === 'string' ? product.vendor : product.vendor?.id || product.vendor?.vendor_id);

    if (directVendorId) {
      return directVendorId;
    }

    const vendorName =
      apiProduct.vendor_name ||
      product.vendors?.[0]?.vendor_name ||
      product.vendors?.[0]?.name ||
      (typeof product.vendor === 'object' ? product.vendor?.vendor_name || product.vendor?.name : undefined);

    if (!vendorName) {
      return undefined;
    }

    return vendors.find(vendor => vendor.vendor_name === vendorName)?.id;
  };

  const mapApiProductToLocal = (apiProduct: ApiProduct): Product =>
    mapApiProductToLocalBase(apiProduct, { vendor_id: resolveProductVendorId(apiProduct, vendorList) });

  // Load products, vendors and categories from API
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      // Load vendors
      const vendorsResponse = await getVendors();
      const loadedVendors = vendorsResponse.success && vendorsResponse.data ? vendorsResponse.data : [];
      if (vendorsResponse.success && vendorsResponse.data) {
        setVendorList(loadedVendors);
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
        const mappedProducts = productsResponse.data.map(product => ({
          ...mapApiProductToLocal(product),
          vendor_id: resolveProductVendorId(product, loadedVendors),
        }));
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
            vendor_id: resolveProductVendorId(response.data, vendorList),
          });
          // Cover and gallery are independent on the backend (main `image`
          // column vs. the `product_media` table) — load them as such,
          // instead of conflating "gallery slot 0" with "the cover image"
          // the way the old single 5-slot array used to (that's what made
          // the cover silently vanish from the form whenever a product also
          // had gallery media: slot 0 showed a gallery photo instead).
          setCoverSlot(
            product.image
              ? { key: `existing-cover-${product.image}`, source: 'existing', url: product.image, previewUrl: product.image, type: 'image' }
              : null
          );
          setGallerySlots(
            (product.media || []).slice(0, 5).map((media) => ({
              key: `existing-${media.url}`,
              source: 'existing',
              url: media.url,
              previewUrl: media.url,
              type: media.type,
            }))
          );
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
  }, [id, isEditing, navigate, vendorList]);

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


  const makeSlotFromFile = (file: File): MediaSlotState | null => {
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    if (!isImage && !isVideo) {
      toast.error('Please upload an image or video file');
      return null;
    }
    return {
      key: `new-${nextSlotKeyRef.current++}`,
      source: 'new',
      file,
      previewUrl: URL.createObjectURL(file),
      type: isImage ? 'image' : 'video',
    };
  };

  const handleCoverFileSelect = (file: File | null) => {
    if (!file) return;
    const slot = makeSlotFromFile(file);
    if (!slot) return;
    if (coverSlot?.source === 'new') URL.revokeObjectURL(coverSlot.previewUrl);
    setCoverSlot(slot);
  };

  const handleAddGallerySlot = (file: File | null) => {
    if (!file) return;
    if (gallerySlots.length >= 5) {
      toast.error('You can only add up to 5 gallery photos/videos');
      return;
    }
    const slot = makeSlotFromFile(file);
    if (!slot) return;
    setGallerySlots(prev => [...prev, slot]);
  };

  const handleReplaceGallerySlot = (index: number, file: File | null) => {
    if (!file) return;
    const slot = makeSlotFromFile(file);
    if (!slot) return;
    setGallerySlots(prev => {
      const removed = prev[index];
      if (removed?.source === 'new') URL.revokeObjectURL(removed.previewUrl);
      return prev.map((s, i) => (i === index ? slot : s));
    });
  };

  const handleRemoveGallerySlot = (index: number) => {
    setGallerySlots(prev => {
      const removed = prev[index];
      if (removed?.source === 'new') URL.revokeObjectURL(removed.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleMoveGallerySlot = (index: number, direction: -1 | 1) => {
    setGallerySlots(prev => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  };

  // Revokes any objectURLs from newly-picked (not-yet-uploaded) files before
  // clearing the form's media state, so they don't leak.
  const resetMediaState = () => {
    if (coverSlot?.source === 'new') URL.revokeObjectURL(coverSlot.previewUrl);
    gallerySlots.forEach(slot => {
      if (slot.source === 'new') URL.revokeObjectURL(slot.previewUrl);
    });
    setCoverSlot(null);
    setGallerySlots([]);
  };

  // Swaps a gallery photo into the cover slot, and the previous cover (if
  // any) back into that same gallery position — so promoting an existing
  // gallery image to the cover never needs a re-upload.
  const handlePromoteToCover = (index: number) => {
    const promoted = gallerySlots[index];
    if (!promoted) return;
    if (promoted.type !== 'image') {
      toast.error('Only an image can be the cover — pick a photo, not a video');
      return;
    }

    const previousCover = coverSlot;
    setCoverSlot(promoted);
    setGallerySlots(prev => {
      const next = [...prev];
      if (previousCover) {
        next[index] = previousCover;
      } else {
        next.splice(index, 1);
      }
      return next;
    });
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

    // For create, a cover image is required
    if (!isEditing && !coverSlot) {
      toast.error('Please upload a main product image');
      return;
    }

    setIsSubmitting(true);

    // Use API
    (async () => {
      try {
        // Cover — a new file to upload, or an existing URL kept/promoted from the gallery.
        const mainImage: File | string | undefined =
          coverSlot?.source === 'new' ? coverSlot.file : coverSlot?.source === 'existing' ? coverSlot.url : undefined;

        // Gallery — full desired order, mixing kept-existing slots and new uploads
        // (see ProductMediaSlotInput; lets reordering/replacing/removing a single
        // slot skip re-uploading every other image).
        const mediaManifest: ProductMediaSlotInput[] = gallerySlots.map(slot => ({
          source: slot.source,
          url: slot.source === 'existing' ? slot.url : undefined,
          file: slot.source === 'new' ? slot.file : undefined,
          type: slot.type,
        }));
        const newGalleryFiles = gallerySlots.filter(slot => slot.source === 'new' && slot.file).map(slot => slot.file!);

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

          // Always sent (even as []) — the form is always fully hydrated with
          // the product's current gallery on load, so its current state IS
          // the desired final state, whether or not anything actually changed.
          updateData.media = mediaManifest;

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
            resetMediaState();
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

          if (newGalleryFiles.length > 0) {
            createData.media = newGalleryFiles;
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
            resetMediaState();
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
    resetMediaState();
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
    setSelectedIds(new Set());
  }, [searchQuery, filterCategory, filterStatus, filterVendor, filterStock]);

  // Selection is scoped to the current page — clear it whenever the page changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [currentPage, viewMode]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setFilterCategory('');
    setFilterStatus('');
    setFilterVendor('');
    setFilterStock('');
    setCurrentPage(1);
  };

  const toggleSelectAllOnPage = () => {
    setSelectedIds(prev => {
      const allSelected = paginatedProducts.length > 0 && paginatedProducts.every(p => prev.has(p.id));
      if (allSelected) return new Set();
      return new Set(paginatedProducts.map(p => p.id));
    });
  };

  const toggleSelectOne = (productId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const handleOpenBulkEdit = () => {
    setBulkCategoryId('');
    setBulkVendorId('');
    setIsBulkEditOpen(true);
  };

  const handleBulkApply = async () => {
    if (!bulkCategoryId && !bulkVendorId) {
      toast.error('Choose a category or vendor to apply');
      return;
    }

    setIsBulkSaving(true);
    const ids = [...selectedIds];
    const updatePayload: { category_id?: string; vendor_id?: string } = {};
    if (bulkCategoryId) updatePayload.category_id = bulkCategoryId;
    if (bulkVendorId) updatePayload.vendor_id = bulkVendorId;

    const results = await Promise.all(ids.map(productId => updateProduct(productId, updatePayload)));

    const updatedById = new Map<string, Product>();
    results.forEach((res, i) => {
      if (res.success && res.data) {
        updatedById.set(ids[i], mapApiProductToLocal(res.data));
      }
    });
    setProductList(prev => prev.map(p => updatedById.get(p.id) || p));

    const successCount = updatedById.size;
    const failedCount = ids.length - successCount;
    if (successCount > 0) {
      toast.success(`Updated ${successCount} product${successCount === 1 ? '' : 's'}`);
    }
    if (failedCount > 0) {
      toast.error(`Failed to update ${failedCount} product${failedCount === 1 ? '' : 's'}`);
    }

    setIsBulkSaving(false);
    setIsBulkEditOpen(false);
    setBulkCategoryId('');
    setBulkVendorId('');
    setSelectedIds(new Set());
  };

  const handleBulkDeleteConfirm = async () => {
    setIsBulkDeleting(true);
    const ids = [...selectedIds];

    const response = await bulkDeleteProducts(ids);

    if (response.success && response.data) {
      const { deletedIds, deletedCount, notFound } = response.data;
      setProductList(prev => prev.filter(p => !deletedIds.includes(p.id)));

      if (deletedCount > 0) {
        toast.success(`Deleted ${deletedCount} product${deletedCount === 1 ? '' : 's'}`);
      }
      if (notFound.length > 0) {
        toast.error(`${notFound.length} product${notFound.length === 1 ? '' : 's'} could not be found`);
      }
    } else {
      toast.error(response.message || 'Failed to delete products');
    }

    setIsBulkDeleting(false);
    setIsBulkDeleteOpen(false);
    setSelectedIds(new Set());
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
              <div className="flex items-center gap-3">
                <div className="flex rounded-lg border border-border overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setViewMode('card')}
                    aria-label="Card view"
                    className={cn(
                      "p-2.5 transition-colors",
                      viewMode === 'card' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    aria-label="List view"
                    className={cn(
                      "p-2.5 border-l border-border transition-colors",
                      viewMode === 'list' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
                <CyberButton size="md" glowColor="cyan" onClick={handleNewProduct}>
                  <Plus className="w-4 h-4 mr-2" />
                  NEW PRODUCT
                </CyberButton>
              </div>
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
                        <SearchableSelect
                          id="category_id"
                          value={formData.category_id || ''}
                          onChange={(newValue) => {
                            setFormData(prev => ({
                              ...prev,
                              category_id: newValue || undefined,
                              category: categoryList.find(c => c.id === newValue)?.category_name || ''
                            }));
                            setKeyFeatureRows([]);
                          }}
                          options={categoryList.map(cat => ({ value: cat.id, label: cat.category_name }))}
                          placeholder="Select a category"
                          searchPlaceholder="Search categories..."
                          clearLabel="No category"
                        />
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
                        <SearchableSelect
                          id="vendor_id"
                          value={formData.vendor_id || ''}
                          onChange={(newValue) => setFormData(prev => ({ ...prev, vendor_id: newValue || undefined }))}
                          options={vendorList.map(vendor => ({ value: vendor.id, label: vendor.vendor_name }))}
                          placeholder="Select a vendor"
                          searchPlaceholder="Search vendors..."
                          clearLabel="No vendor"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Cover Image */}
                  <div>
                    <h2 className="font-orbitron text-xl font-bold mb-1">COVER IMAGE *</h2>
                    <p className="text-xs text-muted-foreground mb-4">
                      Shown as the main product photo everywhere on the storefront.
                    </p>
                    <div className="w-40">
                      <div className="relative aspect-square border-2 border-dashed border-border rounded-lg overflow-hidden group">
                        {coverSlot ? (
                          <>
                            <img src={coverSlot.previewUrl} alt="Cover" className="w-full h-full object-cover" />
                            <label className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 cursor-pointer">
                              <Upload className="w-6 h-6 text-foreground" />
                              <span className="text-[10px] text-foreground">Replace</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleCoverFileSelect(e.target.files?.[0] || null)}
                              />
                            </label>
                          </>
                        ) : (
                          <label className="flex flex-col items-center justify-center h-full cursor-pointer hover:bg-muted/50 transition-colors">
                            <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                            <span className="text-xs text-muted-foreground text-center px-2">Upload Cover</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleCoverFileSelect(e.target.files?.[0] || null)}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Gallery */}
                  <div>
                    <h2 className="font-orbitron text-xl font-bold mb-1">GALLERY (5 max — Images/Videos)</h2>
                    <p className="text-xs text-muted-foreground mb-4">
                      Use the arrows to reorder, or "Set as cover" to promote a photo to the main image — no re-upload needed either way.
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {gallerySlots.map((slot, index) => (
                        <div key={slot.key} className="space-y-2">
                          <div className="relative aspect-square border-2 border-dashed border-border rounded-lg overflow-hidden group">
                            {slot.type === 'image' ? (
                              <img src={slot.previewUrl} alt={`Gallery ${index + 1}`} className="w-full h-full object-cover" />
                            ) : (
                              <video src={slot.previewUrl} className="w-full h-full object-cover" controls={false} />
                            )}
                            <div className="absolute top-1 right-1">
                              {slot.type === 'image' ? (
                                <ImageIcon className="w-4 h-4 text-primary" />
                              ) : (
                                <Video className="w-4 h-4 text-primary" />
                              )}
                            </div>
                            <div className="absolute inset-0 bg-background/85 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-1">
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleMoveGallerySlot(index, -1)}
                                  disabled={index === 0}
                                  className="p-1 rounded-md bg-muted text-foreground disabled:opacity-30 disabled:pointer-events-none"
                                  title="Move earlier"
                                >
                                  <ChevronUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMoveGallerySlot(index, 1)}
                                  disabled={index === gallerySlots.length - 1}
                                  className="p-1 rounded-md bg-muted text-foreground disabled:opacity-30 disabled:pointer-events-none"
                                  title="Move later"
                                >
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              {slot.type === 'image' && (
                                <button
                                  type="button"
                                  onClick={() => handlePromoteToCover(index)}
                                  className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-primary text-primary-foreground"
                                  title="Set as cover image"
                                >
                                  <Star className="w-3 h-3" />
                                  Set as cover
                                </button>
                              )}
                              <div className="flex gap-1">
                                <label className="p-1.5 bg-muted text-foreground rounded cursor-pointer" title="Replace">
                                  <Upload className="w-3.5 h-3.5" />
                                  <input
                                    type="file"
                                    accept="image/*,video/*"
                                    className="hidden"
                                    onChange={(e) => handleReplaceGallerySlot(index, e.target.files?.[0] || null)}
                                  />
                                </label>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveGallerySlot(index)}
                                  className="p-1.5 bg-destructive text-destructive-foreground rounded"
                                  title="Remove"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {gallerySlots.length < 5 && (
                        <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                          <Plus className="w-8 h-8 text-muted-foreground mb-2" />
                          <span className="text-xs text-muted-foreground text-center px-2">Add Image/Video</span>
                          <input
                            type="file"
                            accept="image/*,video/*"
                            className="hidden"
                            onChange={(e) => handleAddGallerySlot(e.target.files?.[0] || null)}
                          />
                        </label>
                      )}
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
                          <Loader label="Loading key features..." size="sm" />
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
                        <Loader size="sm" label="SAVING..." />
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
                      <SearchableSelect
                        value={filterCategory}
                        onChange={setFilterCategory}
                        options={categoryList.map(cat => ({ value: cat.category_name, label: cat.category_name }))}
                        placeholder="All Categories"
                        searchPlaceholder="Search categories..."
                        clearLabel="All Categories"
                      />
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
                      <SearchableSelect
                        value={filterVendor}
                        onChange={setFilterVendor}
                        options={vendorList.map(vendor => ({ value: vendor.id, label: vendor.vendor_name }))}
                        placeholder="All Vendors"
                        searchPlaceholder="Search vendors..."
                        clearLabel="All Vendors"
                      />
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
                      {isLoading
                        ? 'Loading products...'
                        : `Showing ${filteredProducts.length === 0 ? 0 : startIndex + 1}-${Math.min(endIndex, filteredProducts.length)} of ${filteredProducts.length} products`}
                    </span>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">Items per page:</Label>
                      <select
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        disabled={isLoading}
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

              {/* Bulk actions bar (list view only) */}
              {viewMode === 'list' && selectedIds.size > 0 && (
                <div className="mb-4 flex items-center justify-between gap-4 rounded-lg border border-primary/40 bg-primary/5 px-4 py-3">
                  <span className="text-sm font-semibold">
                    {selectedIds.size} product{selectedIds.size === 1 ? '' : 's'} selected
                  </span>
                  <div className="flex items-center gap-2">
                    <CyberButton size="sm" variant="outline" onClick={() => setSelectedIds(new Set())}>
                      Clear
                    </CyberButton>
                    <CyberButton size="sm" onClick={handleOpenBulkEdit}>
                      Bulk Edit
                    </CyberButton>
                    <CyberButton
                      size="sm"
                      variant="outline"
                      className="border-destructive text-destructive hover:bg-destructive/10"
                      onClick={() => setIsBulkDeleteOpen(true)}
                    >
                      Bulk Delete
                    </CyberButton>
                  </div>
                </div>
              )}

              {/* Products Grid */}
              {isLoading ? (
                <ProductListLoader />
              ) : paginatedProducts.length === 0 ? (
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
                  {viewMode === 'list' ? (
                  <NeonCard className="p-0 overflow-hidden" glowColor="cyan" hover={false}>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border text-left text-xs font-orbitron text-muted-foreground">
                            <th className="w-10 px-4 py-3">
                              <input
                                type="checkbox"
                                checked={paginatedProducts.length > 0 && paginatedProducts.every(p => selectedIds.has(p.id))}
                                onChange={toggleSelectAllOnPage}
                                className="h-4 w-4 rounded border-input accent-primary"
                              />
                            </th>
                            <th className="px-2 py-3">Image</th>
                            <th className="px-2 py-3">Product</th>
                            <th className="px-2 py-3">Category</th>
                            <th className="px-2 py-3">Vendor</th>
                            <th className="px-2 py-3">Price</th>
                            <th className="px-2 py-3">Stock</th>
                            <th className="px-2 py-3">Status</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {paginatedProducts.map((product) => (
                            <tr
                              key={product.id}
                              className={cn("transition-colors", selectedIds.has(product.id) && "bg-primary/5")}
                            >
                              <td className="px-4 py-3">
                                <input
                                  type="checkbox"
                                  checked={selectedIds.has(product.id)}
                                  onChange={() => toggleSelectOne(product.id)}
                                  className="h-4 w-4 rounded border-input accent-primary"
                                />
                              </td>
                              <td className="px-2 py-3">
                                <img
                                  src={product.image || (product.media && product.media[0]?.url) || ''}
                                  alt={product.name}
                                  className="h-12 w-12 rounded-lg object-cover bg-muted"
                                />
                              </td>
                              <td className="px-2 py-3 max-w-xs">
                                <p className="font-rajdhani font-semibold truncate">{product.name}</p>
                              </td>
                              <td className="px-2 py-3 text-muted-foreground whitespace-nowrap">
                                {product.category || '—'}
                              </td>
                              <td className="px-2 py-3 text-muted-foreground whitespace-nowrap">
                                {vendorList.find(v => v.id === product.vendor_id)?.vendor_name || '—'}
                              </td>
                              <td className="px-2 py-3 font-orbitron text-primary whitespace-nowrap">
                                AED {product.price.toLocaleString()}
                              </td>
                              <td className="px-2 py-3 whitespace-nowrap">
                                {product.in_stock ? (
                                  product.stock
                                ) : (
                                  <span className="text-destructive">Out</span>
                                )}
                              </td>
                              <td className="px-2 py-3">
                                <span className={cn(
                                  "px-2 py-1 text-xs rounded whitespace-nowrap",
                                  product.status === 'published'
                                    ? "bg-green-500/10 text-green-500"
                                    : "bg-muted text-muted-foreground"
                                )}>
                                  {product.status === 'published' ? 'Published' : 'Draft'}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleEdit(product)}
                                    className="p-2 rounded-lg border border-border text-foreground hover:bg-muted transition-colors"
                                    aria-label="Edit product"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(product.id)}
                                    className="p-2 rounded-lg border border-destructive text-destructive hover:bg-destructive/10 transition-colors"
                                    aria-label="Delete product"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </NeonCard>
                  ) : (
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
                  )}

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

      <Dialog open={isBulkEditOpen} onOpenChange={setIsBulkEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk Edit {selectedIds.size} Product{selectedIds.size === 1 ? '' : 's'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Leave a field on "No change" to keep it as-is for the selected products.
            </p>
            <div>
              <Label htmlFor="bulk-category">Category</Label>
              <SearchableSelect
                id="bulk-category"
                value={bulkCategoryId}
                onChange={setBulkCategoryId}
                options={categoryList.map(cat => ({ value: cat.id, label: cat.category_name }))}
                placeholder="No change"
                searchPlaceholder="Search categories..."
                clearLabel="No change"
              />
            </div>
            <div>
              <Label htmlFor="bulk-vendor">Vendor</Label>
              <SearchableSelect
                id="bulk-vendor"
                value={bulkVendorId}
                onChange={setBulkVendorId}
                options={vendorList.map(vendor => ({ value: vendor.id, label: vendor.vendor_name }))}
                placeholder="No change"
                searchPlaceholder="Search vendors..."
                clearLabel="No change"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <CyberButton
              type="button"
              variant="outline"
              onClick={() => setIsBulkEditOpen(false)}
              disabled={isBulkSaving}
            >
              Cancel
            </CyberButton>
            <CyberButton
              type="button"
              onClick={handleBulkApply}
              disabled={isBulkSaving || (!bulkCategoryId && !bulkVendorId)}
            >
              {isBulkSaving ? <Loader size="sm" label="Applying..." /> : `Apply to ${selectedIds.size}`}
            </CyberButton>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete {selectedIds.size} Product{selectedIds.size === 1 ? '' : 's'}?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              This will permanently delete the selected product{selectedIds.size === 1 ? '' : 's'}, including their
              images. This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <CyberButton
              type="button"
              variant="outline"
              onClick={() => setIsBulkDeleteOpen(false)}
              disabled={isBulkDeleting}
            >
              Cancel
            </CyberButton>
            <CyberButton
              type="button"
              className="border-destructive bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleBulkDeleteConfirm}
              disabled={isBulkDeleting}
            >
              {isBulkDeleting ? <Loader size="sm" label="Deleting..." /> : `Delete ${selectedIds.size}`}
            </CyberButton>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminProductsPage;
