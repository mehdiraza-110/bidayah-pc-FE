import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import {
  ChevronDown,
  ChevronUp,
  ImageIcon,
  LayoutGrid,
  Plus,
  Save,
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  getCategories,
  getHomepageSections,
  createHomepageSection,
  updateHomepageSection,
  deleteHomepageSection,
  reorderHomepageSections,
  type Category,
  type HomepageSection,
} from '@/services/api';

// Shown next to the image control so admins know what to upload without
// trial and error. The tile is a tall, narrow "shop by category" card — see
// CategoryShowcaseSection's pinned tile (w-[110px] sm:w-[150px], height
// stretches to match the product row beside it, roughly 250-320px tall
// depending on screen size). object-cover crops to fill that box, so exact
// pixel match isn't required, but a portrait photo at this resolution keeps
// it sharp on retina screens without excessive upload size.
const IMAGE_GUIDANCE = 'Recommended: portrait photo, at least 600×800px (3:4). It will be cropped to fill the tile — avoid wide/landscape images.';
const MAX_IMAGE_MB = 8;

// A row's editable fields, kept local until that row's own "Save" is clicked —
// avoids firing a network request on every keystroke.
type DraftFields = Pick<HomepageSection, 'title' | 'product_limit' | 'is_active' | 'bg_color_light' | 'bg_color_dark'>;

const toDraft = (section: HomepageSection): DraftFields => ({
  title: section.title,
  product_limit: section.product_limit,
  is_active: section.is_active,
  bg_color_light: section.bg_color_light,
  bg_color_dark: section.bg_color_dark,
});

const AdminHomepageSectionsPage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [drafts, setDrafts] = useState<Record<string, DraftFields>>({});
  // Pending image changes, kept separate from `drafts` since they hold Files/blob
  // previews rather than plain form values. A row id present in `removedImageIds`
  // means "clear the image on save" even though `imageFiles` has nothing for it.
  const [imageFiles, setImageFiles] = useState<Record<string, File>>({});
  const [imagePreviews, setImagePreviews] = useState<Record<string, string>>({});
  const [removedImageIds, setRemovedImageIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);

  const [isCreating, setIsCreating] = useState(false);
  const [newCategoryId, setNewCategoryId] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }
      );
    });
    return () => ctx.revert();
  }, []);

  // Revoke the object URLs we hand out for previews so they don't leak.
  useEffect(() => {
    return () => {
      Object.values(imagePreviews).forEach((url) => URL.revokeObjectURL(url));
      if (newImagePreview) URL.revokeObjectURL(newImagePreview);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [sectionsRes, categoriesRes] = await Promise.all([getHomepageSections(), getCategories()]);

    if (sectionsRes.success && sectionsRes.data) {
      const sorted = [...sectionsRes.data].sort((a, b) => a.display_order - b.display_order);
      setSections(sorted);
      setDrafts(Object.fromEntries(sorted.map((s) => [s.id, toDraft(s)])));
    } else {
      toast.error(sectionsRes.message || 'Failed to load homepage sections');
    }

    if (categoriesRes.success && categoriesRes.data) {
      setCategories(categoriesRes.data);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const usedCategoryIds = new Set(sections.map((s) => s.category_id));
  const availableCategories = categories.filter((c) => !usedCategoryIds.has(c.id));

  const updateDraft = (id: string, patch: Partial<DraftFields>) => {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  };

  const validateImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file');
      return false;
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      toast.error(`Image must be under ${MAX_IMAGE_MB}MB`);
      return false;
    }
    return true;
  };

  const handleImageSelect = (id: string, file: File | null) => {
    if (!file) return;
    if (!validateImageFile(file)) return;

    setImageFiles((prev) => ({ ...prev, [id]: file }));
    setImagePreviews((prev) => {
      if (prev[id]) URL.revokeObjectURL(prev[id]);
      return { ...prev, [id]: URL.createObjectURL(file) };
    });
    setRemovedImageIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleImageClear = (id: string) => {
    setImageFiles((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setImagePreviews((prev) => {
      if (prev[id]) URL.revokeObjectURL(prev[id]);
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setRemovedImageIds((prev) => new Set(prev).add(id));
  };

  const isDirty = (section: HomepageSection) => {
    const draft = drafts[section.id];
    if (!draft) return false;
    return (
      draft.title !== section.title ||
      draft.product_limit !== section.product_limit ||
      draft.is_active !== section.is_active ||
      (draft.bg_color_light || '') !== (section.bg_color_light || '') ||
      (draft.bg_color_dark || '') !== (section.bg_color_dark || '') ||
      Boolean(imageFiles[section.id]) ||
      removedImageIds.has(section.id)
    );
  };

  const handleSaveRow = async (section: HomepageSection) => {
    const draft = drafts[section.id];
    if (!draft) return;

    if (!draft.title.trim()) {
      toast.error('Title is required');
      return;
    }

    setSavingId(section.id);

    const pendingFile = imageFiles[section.id];
    const imagePayload = pendingFile ? pendingFile : (removedImageIds.has(section.id) ? '' : undefined);

    const response = await updateHomepageSection(section.id, {
      title: draft.title.trim(),
      product_limit: draft.product_limit,
      is_active: draft.is_active,
      bg_color_light: draft.bg_color_light || null,
      bg_color_dark: draft.bg_color_dark || null,
      image: imagePayload,
    });

    if (response.success && response.data) {
      setSections((prev) => prev.map((s) => (s.id === section.id ? response.data! : s)));
      setDrafts((prev) => ({ ...prev, [section.id]: toDraft(response.data!) }));
      setImageFiles((prev) => {
        const next = { ...prev };
        delete next[section.id];
        return next;
      });
      setImagePreviews((prev) => {
        if (prev[section.id]) URL.revokeObjectURL(prev[section.id]);
        const next = { ...prev };
        delete next[section.id];
        return next;
      });
      setRemovedImageIds((prev) => {
        const next = new Set(prev);
        next.delete(section.id);
        return next;
      });
      toast.success(response.message || 'Section updated');
    } else {
      toast.error(response.message || 'Failed to update section');
    }
    setSavingId(null);
  };

  const handleDelete = async (section: HomepageSection) => {
    if (!confirm(`Remove "${section.title}" from the homepage?`)) return;

    setDeletingId(section.id);
    const response = await deleteHomepageSection(section.id);

    if (response.success) {
      setSections((prev) => prev.filter((s) => s.id !== section.id));
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[section.id];
        return next;
      });
      toast.success(response.message || 'Section removed');
    } else {
      toast.error(response.message || 'Failed to remove section');
    }
    setDeletingId(null);
  };

  // Reorders instantly — the whole ordered list is persisted in one transactional
  // call, so there's no separate "unsaved order" state to track or lose.
  const moveRow = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const reordered = [...sections];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    setSections(reordered);
    setIsReordering(true);

    const payload = reordered.map((s, i) => ({ id: s.id, display_order: i }));
    const response = await reorderHomepageSections(payload);

    if (response.success && response.data) {
      const sorted = [...response.data].sort((a, b) => a.display_order - b.display_order);
      setSections(sorted);
      setDrafts((prev) => {
        const next = { ...prev };
        sorted.forEach((s) => { next[s.id] = toDraft(s); });
        return next;
      });
    } else {
      toast.error(response.message || 'Failed to reorder sections');
    }
    setIsReordering(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newCategoryId) {
      toast.error('Choose a category');
      return;
    }
    if (!newTitle.trim()) {
      toast.error('Enter a title for the section');
      return;
    }

    setIsSubmittingNew(true);
    const response = await createHomepageSection({
      category_id: newCategoryId,
      title: newTitle.trim(),
      image: newImageFile || undefined,
    });

    if (response.success && response.data) {
      setSections((prev) => [...prev, response.data!].sort((a, b) => a.display_order - b.display_order));
      setDrafts((prev) => ({ ...prev, [response.data!.id]: toDraft(response.data!) }));
      toast.success(response.message || 'Homepage section created');
      setIsCreating(false);
      setNewCategoryId('');
      setNewTitle('');
      if (newImagePreview) URL.revokeObjectURL(newImagePreview);
      setNewImageFile(null);
      setNewImagePreview(null);
    } else {
      toast.error(response.message || 'Failed to create homepage section');
    }
    setIsSubmittingNew(false);
  };

  const handleNewImageSelect = (file: File | null) => {
    if (!file || !validateImageFile(file)) return;
    if (newImagePreview) URL.revokeObjectURL(newImagePreview);
    setNewImageFile(file);
    setNewImagePreview(URL.createObjectURL(file));
  };

  return (
    <AdminLayout>
      <div className="p-6" ref={containerRef}>
        <div className="mb-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="font-orbitron text-3xl font-bold mb-2">
                HOMEPAGE <span className="text-primary">SECTIONS</span>
              </h1>
              <p className="text-muted-foreground">
                Choose which category showcase rows appear on the homepage, their order, product count, tile photo, and background color.
              </p>
            </div>
            {!isCreating && (
              <CyberButton size="md" glowColor="cyan" onClick={() => setIsCreating(true)}>
                <Plus className="w-4 h-4 mr-2" />
                ADD SECTION
              </CyberButton>
            )}
          </div>
        </div>

        {isCreating && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <NeonCard className="p-6" glowColor="purple" hover={false}>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
                  <div>
                    <Label>Category</Label>
                    <Select value={newCategoryId} onValueChange={setNewCategoryId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCategories.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-muted-foreground">
                            Every category already has a section
                          </div>
                        ) : (
                          availableCategories.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.category_name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="new-title">Section title</Label>
                    <Input
                      id="new-title"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="e.g. Graphics Cards"
                    />
                  </div>
                  <CyberButton type="submit" size="md" disabled={isSubmittingNew}>
                    {isSubmittingNew ? <Loader size="sm" /> : <Save className="w-4 h-4 mr-2" />}
                    CREATE
                  </CyberButton>
                  <CyberButton
                    type="button"
                    variant="outline"
                    size="md"
                    onClick={() => {
                      setIsCreating(false);
                      setNewCategoryId('');
                      setNewTitle('');
                      if (newImagePreview) URL.revokeObjectURL(newImagePreview);
                      setNewImageFile(null);
                      setNewImagePreview(null);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </CyberButton>
                </div>

                <div>
                  <Label>Tile photo (optional)</Label>
                  <div className="flex items-start gap-3">
                    <div className="flex h-24 w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted/30">
                      {newImagePreview ? (
                        <img src={newImagePreview} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-foreground hover:border-primary/50 transition-colors">
                        <Upload className="h-4 w-4" />
                        {newImagePreview ? 'Change photo' : 'Upload photo'}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleNewImageSelect(e.target.files?.[0] || null)}
                        />
                      </label>
                      <p className="text-xs text-muted-foreground">{IMAGE_GUIDANCE}</p>
                    </div>
                  </div>
                </div>
              </form>
            </NeonCard>
          </motion.div>
        )}

        {isLoading ? (
          <NeonCard className="p-12 text-center" glowColor="cyan" hover={false}>
            <Loader label="Loading homepage sections..." />
          </NeonCard>
        ) : sections.length === 0 ? (
          <NeonCard className="p-12 text-center" glowColor="cyan" hover={false}>
            <LayoutGrid className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-orbitron text-xl font-bold mb-2">No Homepage Sections</h3>
            <p className="text-muted-foreground mb-6">
              Add a category to show it as a product showcase row on the homepage
            </p>
            <CyberButton onClick={() => setIsCreating(true)} glowColor="cyan">
              <Plus className="w-4 h-4 mr-2" />
              ADD FIRST SECTION
            </CyberButton>
          </NeonCard>
        ) : (
          <div className="space-y-3">
            {sections.map((section, index) => {
              const draft = drafts[section.id] ?? toDraft(section);
              const dirty = isDirty(section);
              const previewUrl = imagePreviews[section.id];
              const showImage = previewUrl || (!removedImageIds.has(section.id) && section.image);

              return (
                <motion.div
                  key={section.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <NeonCard className="p-4 sm:p-5" glowColor="cyan" hover={false}>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                      {/* Order controls */}
                      <div className="flex shrink-0 items-center gap-1 lg:flex-col">
                        <button
                          type="button"
                          onClick={() => moveRow(index, -1)}
                          disabled={index === 0 || isReordering}
                          className="p-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <span className="w-7 text-center font-orbitron text-xs font-bold text-primary">{index + 1}</span>
                        <button
                          type="button"
                          onClick={() => moveRow(index, 1)}
                          disabled={index === sections.length - 1 || isReordering}
                          className="p-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Tile photo */}
                      <div className="flex shrink-0 flex-col items-center gap-2">
                        <div className="flex h-24 w-[72px] items-center justify-center overflow-hidden rounded-md border border-border bg-muted/30">
                          {showImage ? (
                            <img src={previewUrl || section.image || ''} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <ImageIcon className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex gap-1">
                          <label className="inline-flex cursor-pointer items-center rounded-md border border-border p-1.5 text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors" title="Upload photo">
                            <Upload className="h-3.5 w-3.5" />
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleImageSelect(section.id, e.target.files?.[0] || null)}
                            />
                          </label>
                          {showImage && (
                            <button
                              type="button"
                              onClick={() => handleImageClear(section.id)}
                              className="p-1.5 rounded-md border border-border text-muted-foreground hover:text-destructive hover:border-destructive/50 transition-colors"
                              title="Remove photo"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Fields */}
                      <div className="grid flex-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                          <Label htmlFor={`title-${section.id}`}>Title</Label>
                          <Input
                            id={`title-${section.id}`}
                            value={draft.title}
                            onChange={(e) => updateDraft(section.id, { title: e.target.value })}
                          />
                          <p className="mt-1 text-xs text-muted-foreground truncate">Category: {section.category_name}</p>
                        </div>

                        <div>
                          <Label htmlFor={`limit-${section.id}`}>Product limit</Label>
                          <Input
                            id={`limit-${section.id}`}
                            type="number"
                            min={1}
                            max={50}
                            value={draft.product_limit}
                            onChange={(e) => updateDraft(section.id, { product_limit: Math.max(1, Math.min(50, Number(e.target.value) || 1)) })}
                          />
                        </div>

                        <div>
                          <Label htmlFor={`bg-light-${section.id}`}>Background (light mode)</Label>
                          <div className="flex items-center gap-2">
                            <input
                              id={`bg-light-${section.id}`}
                              type="color"
                              value={/^#[0-9a-f]{6}$/i.test(draft.bg_color_light || '') ? draft.bg_color_light! : '#ffffff'}
                              onChange={(e) => updateDraft(section.id, { bg_color_light: e.target.value })}
                              className="h-10 w-10 shrink-0 cursor-pointer rounded-md border border-input bg-background"
                            />
                            <Input
                              value={draft.bg_color_light || ''}
                              onChange={(e) => updateDraft(section.id, { bg_color_light: e.target.value })}
                              placeholder="Default"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor={`bg-dark-${section.id}`}>Background (dark mode)</Label>
                          <div className="flex items-center gap-2">
                            <input
                              id={`bg-dark-${section.id}`}
                              type="color"
                              value={/^#[0-9a-f]{6}$/i.test(draft.bg_color_dark || '') ? draft.bg_color_dark! : '#000000'}
                              onChange={(e) => updateDraft(section.id, { bg_color_dark: e.target.value })}
                              className="h-10 w-10 shrink-0 cursor-pointer rounded-md border border-input bg-background"
                            />
                            <Input
                              value={draft.bg_color_dark || ''}
                              onChange={(e) => updateDraft(section.id, { bg_color_dark: e.target.value })}
                              placeholder="Default"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex shrink-0 items-center gap-3 lg:flex-col lg:items-stretch">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`active-${section.id}`}
                            checked={draft.is_active}
                            onCheckedChange={(checked) => updateDraft(section.id, { is_active: Boolean(checked) })}
                          />
                          <Label htmlFor={`active-${section.id}`} className="cursor-pointer text-sm">
                            Active
                          </Label>
                        </div>
                        <div className="flex gap-2">
                          <CyberButton
                            size="sm"
                            onClick={() => handleSaveRow(section)}
                            disabled={!dirty || savingId === section.id}
                          >
                            {savingId === section.id ? <Loader size="sm" /> : <Save className="w-4 h-4" />}
                          </CyberButton>
                          <motion.button
                            onClick={() => handleDelete(section)}
                            disabled={deletingId === section.id}
                            className="p-2 rounded-lg border border-destructive text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </NeonCard>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminHomepageSectionsPage;
