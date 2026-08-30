import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import {
  ChevronDown,
  ChevronUp,
  Gamepad2,
  ImageIcon,
  Minus,
  Plus,
  Save,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import AdminLayout from '@/components/layout/AdminLayout';
import { CyberButton } from '@/components/ui/CyberButton';
import { Loader } from '@/components/ui/Loader';
import { NeonCard } from '@/components/ui/NeonCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  getFeaturedGamingPcs,
  createFeaturedGamingPc,
  updateFeaturedGamingPc,
  deleteFeaturedGamingPc,
  reorderFeaturedGamingPcs,
  getProducts,
  getPcSeriesTypesFlat,
  type FeaturedGamingPc,
  type Product,
  type PcSeriesTypeFlat,
} from '@/services/api';

const MAX_IMAGES = 5;
const MAX_IMAGE_MB = 8;
// Shown next to the photo uploader — object-cover crops the gallery to fill
// its box on the homepage card, so exact pixel match isn't required, but a
// consistent, reasonably high-res set keeps every build looking equally sharp.
const IMAGE_GUIDANCE = `Upload 1-${MAX_IMAGES} photos, at least 800×600px. The first photo is the cover image.`;

// One product selected for this build, plus how many units of it — lets the
// same product appear more than once (e.g. 2x RAM sticks) instead of only
// being selectable a single time.
interface SelectedProductEntry {
  product: Product;
  quantity: number;
}

interface FormState {
  name: string;
  description: string;
  price: string;
  isActive: boolean;
  keyFeatures: string[];
  selectedProducts: SelectedProductEntry[];
  // Optional PC Series placement — see the "Series placement" section of the
  // form for what each of these does.
  seriesTypeId: string;
  tierName: string;
  colorName: string;
  colorSwatchHex: string;
  fpsScore: string;
  fpsSettingsLabel: string;
}

const emptyForm: FormState = {
  name: '',
  description: '',
  price: '',
  isActive: true,
  keyFeatures: [],
  selectedProducts: [],
  seriesTypeId: '',
  tierName: '',
  colorName: '',
  colorSwatchHex: '#1a1a1a',
  fpsScore: '',
  fpsSettingsLabel: '',
};

const AdminFeaturedGamingPcsPage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const [gamingPcs, setGamingPcs] = useState<FeaturedGamingPc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReordering, setIsReordering] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [newFeatureInput, setNewFeatureInput] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState<Product[]>([]);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);

  const [seriesTypes, setSeriesTypes] = useState<PcSeriesTypeFlat[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(containerRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' });
    });
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    return () => {
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadGamingPcs = async () => {
    setIsLoading(true);
    const response = await getFeaturedGamingPcs();
    if (response.success && response.data) {
      setGamingPcs([...response.data].sort((a, b) => a.display_order - b.display_order));
    } else {
      toast.error(response.message || 'Failed to load featured gaming PCs');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadGamingPcs();

    getPcSeriesTypesFlat().then((response) => {
      if (response.success && response.data) setSeriesTypes(response.data);
    });
  }, []);

  // Debounced product search — same pattern as the PC Builder's own search box.
  useEffect(() => {
    const handle = setTimeout(async () => {
      if (!productSearch.trim()) {
        setProductResults([]);
        return;
      }
      setIsSearchingProducts(true);
      const response = await getProducts({ search: productSearch.trim() });
      if (response.success && response.data) {
        setProductResults(response.data.slice(0, 20));
      }
      setIsSearchingProducts(false);
    }, 300);

    return () => clearTimeout(handle);
  }, [productSearch]);

  const resetForm = () => {
    setForm(emptyForm);
    setNewFeatureInput('');
    imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    setImageFiles([]);
    setImagePreviews([]);
    setExistingImages([]);
    setProductSearch('');
    setProductResults([]);
    setEditingId(null);
  };

  const handleNewGamingPc = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleEdit = (gamingPc: FeaturedGamingPc) => {
    setForm({
      name: gamingPc.name,
      description: gamingPc.description || '',
      price: String(gamingPc.price),
      isActive: gamingPc.is_active,
      keyFeatures: [...gamingPc.key_features],
      selectedProducts: gamingPc.products.map((p) => ({
        product: {
          id: p.id,
          name: p.name,
          image: p.image || '',
          price: p.price,
          category_id: p.category_id || undefined,
          category_name: p.category_name || undefined,
          stock: 0,
          in_stock: true,
          status: 'published' as const,
        },
        quantity: p.quantity,
      })),
      seriesTypeId: gamingPc.series_type_id || '',
      tierName: gamingPc.tier_name || '',
      colorName: gamingPc.color_name || '',
      colorSwatchHex: gamingPc.color_swatch_hex || '#1a1a1a',
      fpsScore: gamingPc.fps_score != null ? String(gamingPc.fps_score) : '',
      fpsSettingsLabel: gamingPc.fps_settings_label || '',
    });
    setImageFiles([]);
    setImagePreviews([]);
    setExistingImages(gamingPc.images);
    setEditingId(gamingPc.id);
    setIsFormOpen(true);
  };

  const handleImageSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const validFiles: File[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) {
        toast.error(`"${file.name}" isn't an image`);
        continue;
      }
      if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
        toast.error(`"${file.name}" is over ${MAX_IMAGE_MB}MB`);
        continue;
      }
      validFiles.push(file);
    }

    const combined = [...imageFiles, ...validFiles].slice(0, MAX_IMAGES);
    if (imageFiles.length + validFiles.length > MAX_IMAGES) {
      toast.error(`Only the first ${MAX_IMAGES} photos were kept`);
    }

    imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    setImageFiles(combined);
    setImagePreviews(combined.map((file) => URL.createObjectURL(file)));
    // New uploads always fully replace the existing gallery on save.
    setExistingImages([]);
  };

  const handleRemoveNewImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddFeature = () => {
    const trimmed = newFeatureInput.trim();
    if (!trimmed) return;
    setForm((prev) => ({ ...prev, keyFeatures: [...prev.keyFeatures, trimmed] }));
    setNewFeatureInput('');
  };

  const handleRemoveFeature = (index: number) => {
    setForm((prev) => ({ ...prev, keyFeatures: prev.keyFeatures.filter((_, i) => i !== index) }));
  };

  const handleToggleProduct = (product: Product) => {
    setForm((prev) => {
      const isSelected = prev.selectedProducts.some((entry) => entry.product.id === product.id);
      if (isSelected) {
        return {
          ...prev,
          selectedProducts: prev.selectedProducts.filter((entry) => entry.product.id !== product.id),
        };
      }
      return {
        ...prev,
        selectedProducts: [...prev.selectedProducts, { product, quantity: 1 }],
      };
    });
  };

  // +/- stepper for an already-selected product — dropping to 0 removes it entirely.
  const handleChangeProductQuantity = (productId: string, delta: 1 | -1) => {
    setForm((prev) => {
      const index = prev.selectedProducts.findIndex((entry) => entry.product.id === productId);
      if (index === -1) return prev;

      const nextQuantity = prev.selectedProducts[index].quantity + delta;
      if (nextQuantity <= 0) {
        return { ...prev, selectedProducts: prev.selectedProducts.filter((_, i) => i !== index) };
      }

      return {
        ...prev,
        selectedProducts: prev.selectedProducts.map((entry, i) =>
          i === index ? { ...entry, quantity: nextQuantity } : entry
        ),
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error('Please enter a name');
      return;
    }
    const price = parseFloat(form.price);
    if (isNaN(price) || price < 0) {
      toast.error('Please enter a valid price');
      return;
    }
    const hasImages = imageFiles.length > 0 || existingImages.length > 0;
    if (!hasImages) {
      toast.error('At least 1 photo is required');
      return;
    }

    setIsSubmitting(true);

    const products = form.selectedProducts.map(({ product, quantity }) => ({
      product_id: product.id,
      quantity,
    }));

    // Empty string clears the field on the backend (unassigns series
    // placement) — sent as-is either way, never omitted.
    const seriesFields = {
      series_type_id: form.seriesTypeId,
      tier_name: form.tierName.trim(),
      color_name: form.colorName.trim(),
      color_swatch_hex: form.colorName.trim() ? form.colorSwatchHex : '',
      fps_score: form.fpsScore.trim() ? Number(form.fpsScore) : null,
      fps_settings_label: form.fpsSettingsLabel.trim(),
    };

    if (editingId) {
      const response = await updateFeaturedGamingPc(editingId, {
        name: form.name.trim(),
        description: form.description.trim() || null,
        price,
        key_features: form.keyFeatures,
        is_active: form.isActive,
        products,
        images: imageFiles.length > 0 ? imageFiles : undefined,
        ...seriesFields,
      });

      if (response.success) {
        toast.success(response.message || 'Featured gaming PC updated');
        setIsFormOpen(false);
        resetForm();
        loadGamingPcs();
      } else {
        toast.error(response.message || 'Failed to update featured gaming PC');
      }
    } else {
      const response = await createFeaturedGamingPc({
        name: form.name.trim(),
        description: form.description.trim() || null,
        price,
        key_features: form.keyFeatures,
        is_active: form.isActive,
        products,
        images: imageFiles,
        ...seriesFields,
      });

      if (response.success) {
        toast.success(response.message || 'Featured gaming PC published');
        setIsFormOpen(false);
        resetForm();
        loadGamingPcs();
      } else {
        toast.error(response.message || 'Failed to create featured gaming PC');
      }
    }

    setIsSubmitting(false);
  };

  const handleDelete = async (gamingPc: FeaturedGamingPc) => {
    if (!confirm(`Delete "${gamingPc.name}"? This can't be undone.`)) return;

    setDeletingId(gamingPc.id);
    const response = await deleteFeaturedGamingPc(gamingPc.id);
    if (response.success) {
      setGamingPcs((prev) => prev.filter((pc) => pc.id !== gamingPc.id));
      toast.success(response.message || 'Featured gaming PC deleted');
    } else {
      toast.error(response.message || 'Failed to delete featured gaming PC');
    }
    setDeletingId(null);
  };

  const handleToggleActive = async (gamingPc: FeaturedGamingPc, isActive: boolean) => {
    setGamingPcs((prev) => prev.map((pc) => (pc.id === gamingPc.id ? { ...pc, is_active: isActive } : pc)));
    const response = await updateFeaturedGamingPc(gamingPc.id, { is_active: isActive });
    if (!response.success) {
      toast.error(response.message || 'Failed to update status');
      setGamingPcs((prev) => prev.map((pc) => (pc.id === gamingPc.id ? { ...pc, is_active: !isActive } : pc)));
    }
  };

  const moveRow = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= gamingPcs.length) return;

    const reordered = [...gamingPcs];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    setGamingPcs(reordered);
    setIsReordering(true);

    const response = await reorderFeaturedGamingPcs(reordered.map((pc, i) => ({ id: pc.id, display_order: i })));
    if (response.success && response.data) {
      setGamingPcs([...response.data].sort((a, b) => a.display_order - b.display_order));
    } else {
      toast.error(response.message || 'Failed to reorder');
    }
    setIsReordering(false);
  };

  return (
    <AdminLayout>
      <div className="p-6" ref={containerRef}>
        <div className="mb-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="font-orbitron text-3xl font-bold mb-2">
                FEATURED <span className="text-primary">GAMING PCS</span>
              </h1>
              <p className="text-muted-foreground">
                Curated builds shown on the homepage before "Shop By Category" — name, photos, included products, description, and key features.
              </p>
            </div>
            {!isFormOpen && (
              <CyberButton size="md" glowColor="cyan" onClick={handleNewGamingPc}>
                <Plus className="w-4 h-4 mr-2" />
                NEW GAMING PC
              </CyberButton>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isFormOpen ? (
            <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <NeonCard className="p-6 sm:p-8" glowColor="cyan" hover={false}>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <h2 className="font-orbitron text-xl font-bold">
                    {editingId ? 'EDIT GAMING PC' : 'CREATE NEW GAMING PC'}
                  </h2>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="gp-name">Name *</Label>
                      <Input
                        id="gp-name"
                        value={form.name}
                        onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g. Vortex Elite RTX 4080"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="gp-price">Bundle Price (AED) *</Label>
                      <Input
                        id="gp-price"
                        type="number"
                        min={0}
                        step="0.01"
                        value={form.price}
                        onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="gp-description">Description</Label>
                    <Textarea
                      id="gp-description"
                      value={form.description}
                      onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="A short, compelling description of this build..."
                      rows={4}
                    />
                  </div>

                  {/* Key features */}
                  <div>
                    <Label>Key Features</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {form.keyFeatures.map((feature, index) => (
                        <Badge key={index} variant="secondary" className="gap-1.5 pr-1.5">
                          {feature}
                          <button type="button" onClick={() => handleRemoveFeature(index)} className="hover:text-destructive">
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                      {form.keyFeatures.length === 0 && (
                        <p className="text-xs text-muted-foreground">No key features added yet.</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={newFeatureInput}
                        onChange={(e) => setNewFeatureInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddFeature();
                          }
                        }}
                        placeholder="e.g. Liquid-cooled, RGB lighting, 1TB NVMe SSD"
                      />
                      <CyberButton type="button" size="md" variant="outline" onClick={handleAddFeature}>
                        <Plus className="w-4 h-4" />
                      </CyberButton>
                    </div>
                  </div>

                  {/* Photos */}
                  <div>
                    <Label>Photos *</Label>
                    <p className="text-xs text-muted-foreground mb-2">{IMAGE_GUIDANCE}</p>
                    <div className="flex flex-wrap gap-3">
                      {existingImages.map((url, index) => (
                        <div key={url} className="relative h-24 w-24 overflow-hidden rounded-md border border-border">
                          <img src={url} alt="" className="h-full w-full object-cover" />
                          {index === 0 && (
                            <span className="absolute bottom-0 left-0 right-0 bg-black/70 text-center text-[10px] text-white py-0.5">
                              COVER
                            </span>
                          )}
                        </div>
                      ))}
                      {imagePreviews.map((url, index) => (
                        <div key={url} className="relative h-24 w-24 overflow-hidden rounded-md border border-border">
                          <img src={url} alt="" className="h-full w-full object-cover" />
                          {index === 0 && existingImages.length === 0 && (
                            <span className="absolute bottom-0 left-0 right-0 bg-black/70 text-center text-[10px] text-white py-0.5">
                              COVER
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveNewImage(index)}
                            className="absolute top-1 right-1 rounded-full bg-black/70 p-1 text-white hover:bg-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      {existingImages.length + imagePreviews.length < MAX_IMAGES && (
                        <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors">
                          <Upload className="h-5 w-5" />
                          <span className="text-[10px]">Add photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={(e) => handleImageSelect(e.target.files)}
                          />
                        </label>
                      )}
                      {existingImages.length + imagePreviews.length === 0 && (
                        <div className="flex h-24 w-24 items-center justify-center rounded-md border border-border bg-muted/30">
                          <ImageIcon className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    {existingImages.length > 0 && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Uploading new photos replaces this entire gallery.
                      </p>
                    )}
                  </div>

                  {/* Products included in the build */}
                  <div>
                    <Label>Products in this build</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Search and select the real products this build is made of, and how many of each — shown on the card and inside the cart bundle.
                    </p>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {form.selectedProducts.map(({ product, quantity }) => (
                        <Badge key={product.id} variant="secondary" className="gap-1.5 pl-2.5 pr-1.5">
                          {product.name}
                          <div className="flex items-center gap-0.5 ml-1">
                            <button
                              type="button"
                              onClick={() => handleChangeProductQuantity(product.id, -1)}
                              className="rounded p-0.5 hover:bg-background/60"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-4 text-center font-mono-tech text-[11px]">{quantity}</span>
                            <button
                              type="button"
                              onClick={() => handleChangeProductQuantity(product.id, 1)}
                              className="rounded p-0.5 hover:bg-background/60"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <button type="button" onClick={() => handleToggleProduct(product)} className="hover:text-destructive">
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                      {form.selectedProducts.length === 0 && (
                        <p className="text-xs text-muted-foreground">No products selected yet.</p>
                      )}
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        placeholder="Search products by name..."
                        className="pl-9"
                      />
                    </div>
                    {isSearchingProducts ? (
                      <div className="mt-2"><Loader size="sm" label="Searching..." /></div>
                    ) : productResults.length > 0 ? (
                      <div className="mt-2 max-h-56 overflow-y-auto rounded-md border border-border divide-y divide-border">
                        {productResults.map((product) => {
                          const isSelected = form.selectedProducts.some((entry) => entry.product.id === product.id);
                          return (
                            <label
                              key={product.id}
                              className="flex items-center gap-3 p-2.5 cursor-pointer hover:bg-muted/30 transition-colors"
                            >
                              <Checkbox checked={isSelected} onCheckedChange={() => handleToggleProduct(product)} />
                              {product.image ? (
                                <img src={product.image} alt="" className="h-9 w-9 rounded-md object-cover shrink-0" />
                              ) : (
                                <div className="h-9 w-9 rounded-md bg-muted shrink-0" />
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate">{product.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  AED {Number(product.price).toLocaleString()}
                                  {product.category_name ? ` · ${product.category_name}` : ''}
                                </p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    ) : productSearch.trim() ? (
                      <p className="mt-2 text-xs text-muted-foreground">No products found.</p>
                    ) : null}
                  </div>

                  {/* PC Series placement */}
                  <div className="rounded-lg border border-border p-4 space-y-4">
                    <div>
                      <Label htmlFor="gp-series-type">Series placement</Label>
                      <p className="text-xs text-muted-foreground mb-2">
                        Optional — assign this build to a Series Type (e.g. "PLAY 1") to show it as a card on that
                        series' landing page. Manage the series itself under PC Series in the sidebar.
                      </p>
                      <Select
                        value={form.seriesTypeId || 'none'}
                        onValueChange={(value) => setForm((prev) => ({ ...prev, seriesTypeId: value === 'none' ? '' : value }))}
                      >
                        <SelectTrigger id="gp-series-type" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Not part of a series</SelectItem>
                          {seriesTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.series_name} — {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {form.seriesTypeId && (
                      <>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <Label htmlFor="gp-tier-name">Tier name</Label>
                            <p className="text-xs text-muted-foreground mb-2">
                              Groups color siblings of the "same" build together (e.g. "PLUS"). Leave blank if this
                              build has no color variants.
                            </p>
                            <Input
                              id="gp-tier-name"
                              value={form.tierName}
                              onChange={(e) => setForm((prev) => ({ ...prev, tierName: e.target.value }))}
                              placeholder="e.g. PLUS"
                            />
                          </div>
                          <div className="grid grid-cols-[1fr_auto] gap-3">
                            <div>
                              <Label htmlFor="gp-color-name">Color name</Label>
                              <Input
                                id="gp-color-name"
                                value={form.colorName}
                                onChange={(e) => setForm((prev) => ({ ...prev, colorName: e.target.value }))}
                                placeholder="e.g. Black"
                              />
                            </div>
                            <div>
                              <Label htmlFor="gp-color-swatch">Swatch</Label>
                              <input
                                id="gp-color-swatch"
                                type="color"
                                value={form.colorSwatchHex}
                                onChange={(e) => setForm((prev) => ({ ...prev, colorSwatchHex: e.target.value }))}
                                className="h-10 w-14 rounded-md border border-border bg-transparent p-1"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <Label htmlFor="gp-fps-score">FPS score</Label>
                            <p className="text-xs text-muted-foreground mb-2">Manually entered — no automated benchmarking.</p>
                            <Input
                              id="gp-fps-score"
                              type="number"
                              min={0}
                              value={form.fpsScore}
                              onChange={(e) => setForm((prev) => ({ ...prev, fpsScore: e.target.value }))}
                              placeholder="84"
                            />
                          </div>
                          <div>
                            <Label htmlFor="gp-fps-label">Settings label</Label>
                            <p className="text-xs text-muted-foreground mb-2">e.g. "Ultra settings".</p>
                            <Input
                              id="gp-fps-label"
                              value={form.fpsSettingsLabel}
                              onChange={(e) => setForm((prev) => ({ ...prev, fpsSettingsLabel: e.target.value }))}
                              placeholder="Ultra settings"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="gp-active"
                      checked={form.isActive}
                      onCheckedChange={(checked) => setForm((prev) => ({ ...prev, isActive: Boolean(checked) }))}
                    />
                    <Label htmlFor="gp-active" className="cursor-pointer">
                      Active (visible on the homepage)
                    </Label>
                  </div>

                  <div className="flex gap-4 pt-4 border-t border-border">
                    <CyberButton type="submit" size="lg" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <Loader size="sm" label="Publishing..." />
                      ) : (
                        <span className="flex items-center gap-2">
                          <Save className="w-4 h-4" />
                          {editingId ? 'SAVE CHANGES' : 'PUBLISH'}
                        </span>
                      )}
                    </CyberButton>
                    <CyberButton
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={() => { setIsFormOpen(false); resetForm(); }}
                    >
                      <X className="w-4 h-4 mr-2" />
                      CANCEL
                    </CyberButton>
                  </div>
                </form>
              </NeonCard>
            </motion.div>
          ) : (
            <motion.div key="list" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              {isLoading ? (
                <NeonCard className="p-12 text-center" glowColor="cyan" hover={false}>
                  <Loader label="Loading featured gaming PCs..." />
                </NeonCard>
              ) : gamingPcs.length === 0 ? (
                <NeonCard className="p-12 text-center" glowColor="cyan" hover={false}>
                  <Gamepad2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-orbitron text-xl font-bold mb-2">No Featured Gaming PCs</h3>
                  <p className="text-muted-foreground mb-6">
                    Publish a curated build to show it on the homepage
                  </p>
                  <CyberButton onClick={handleNewGamingPc} glowColor="cyan">
                    <Plus className="w-4 h-4 mr-2" />
                    CREATE FIRST GAMING PC
                  </CyberButton>
                </NeonCard>
              ) : (
                <div className="space-y-3">
                  {gamingPcs.map((gamingPc, index) => (
                    <motion.div key={gamingPc.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <NeonCard className="p-4" glowColor="cyan" hover={false}>
                        <div className="flex items-center gap-4">
                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              type="button"
                              onClick={() => moveRow(index, -1)}
                              disabled={index === 0 || isReordering}
                              className="p-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                            >
                              <ChevronUp className="w-4 h-4" />
                            </button>
                            <span className="w-6 text-center font-orbitron text-xs font-bold text-primary">{index + 1}</span>
                            <button
                              type="button"
                              onClick={() => moveRow(index, 1)}
                              disabled={index === gamingPcs.length - 1 || isReordering}
                              className="p-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                            >
                              <ChevronDown className="w-4 h-4" />
                            </button>
                          </div>

                          {gamingPc.images[0] ? (
                            <img src={gamingPc.images[0]} alt={gamingPc.name} className="h-14 w-14 rounded-lg object-cover border border-border shrink-0" />
                          ) : (
                            <div className="h-14 w-14 rounded-lg border border-border bg-muted flex items-center justify-center shrink-0">
                              <Gamepad2 className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <p className="font-rajdhani font-semibold truncate">{gamingPc.name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              AED {Number(gamingPc.price).toLocaleString()} · {gamingPc.products.length} product{gamingPc.products.length === 1 ? '' : 's'} · {gamingPc.images.length} photo{gamingPc.images.length === 1 ? '' : 's'}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <Checkbox
                              checked={gamingPc.is_active}
                              onCheckedChange={(checked) => handleToggleActive(gamingPc, Boolean(checked))}
                            />
                            <span className="hidden sm:inline text-xs text-muted-foreground">Active</span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <CyberButton size="sm" variant="outline" onClick={() => handleEdit(gamingPc)}>
                              Edit
                            </CyberButton>
                            <motion.button
                              onClick={() => handleDelete(gamingPc)}
                              disabled={deletingId === gamingPc.id}
                              className="p-2 rounded-lg border border-destructive text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </motion.button>
                          </div>
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

export default AdminFeaturedGamingPcsPage;
