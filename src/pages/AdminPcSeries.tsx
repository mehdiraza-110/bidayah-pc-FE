import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { ChevronDown, ChevronUp, ImageIcon, Layers, Plus, Save, Settings, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import AdminLayout from '@/components/layout/AdminLayout';
import { CyberButton } from '@/components/ui/CyberButton';
import { Loader } from '@/components/ui/Loader';
import { NeonCard } from '@/components/ui/NeonCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  getPcSeriesList,
  createPcSeries,
  deletePcSeries,
  reorderPcSeries,
  type PcSeries,
  type PcSeriesBadgeStatus,
} from '@/services/api';

interface FormState {
  name: string;
  actionButtonText: string;
  badgeStatus: PcSeriesBadgeStatus;
  isActive: boolean;
  cardDescription: string;
  startingPrice: string;
  endingPrice: string;
  isCustomBuild: boolean;
  heroVideoUrl: string;
}

const emptyForm: FormState = {
  name: '',
  actionButtonText: 'Configurations and prices',
  badgeStatus: 'in_stock',
  isActive: true,
  cardDescription: '',
  startingPrice: '',
  endingPrice: '',
  isCustomBuild: false,
  heroVideoUrl: '',
};

const AdminPcSeriesPage: React.FC = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  const [seriesList, setSeriesList] = useState<PcSeries[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReordering, setIsReordering] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [cardImageFile, setCardImageFile] = useState<File | null>(null);
  const [cardImagePreview, setCardImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(containerRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' });
    });
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    return () => {
      if (cardImagePreview) URL.revokeObjectURL(cardImagePreview);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSeries = async () => {
    setIsLoading(true);
    const response = await getPcSeriesList();
    if (response.success && response.data) {
      setSeriesList([...response.data].sort((a, b) => a.display_order - b.display_order));
    } else {
      toast.error(response.message || 'Failed to load PC series');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadSeries();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    if (cardImagePreview) URL.revokeObjectURL(cardImagePreview);
    setCardImageFile(null);
    setCardImagePreview(null);
  };

  const handleNewSeries = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleCardImageSelect = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error(`"${file.name}" isn't an image`);
      return;
    }
    if (cardImagePreview) URL.revokeObjectURL(cardImagePreview);
    setCardImageFile(file);
    setCardImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error('Please enter a name');
      return;
    }

    setIsSubmitting(true);

    const response = await createPcSeries({
      name: form.name.trim(),
      action_button_text: form.actionButtonText.trim() || undefined,
      badge_status: form.badgeStatus,
      is_active: form.isActive,
      card_image: cardImageFile || undefined,
      hero_video: form.heroVideoUrl.trim() || undefined,
      card_description: form.cardDescription.trim() || undefined,
      starting_price: form.startingPrice.trim() ? Number(form.startingPrice) : undefined,
      ending_price: form.endingPrice.trim() ? Number(form.endingPrice) : undefined,
      is_custom_build: form.isCustomBuild,
    });

    setIsSubmitting(false);

    if (response.success && response.data) {
      toast.success(response.message || 'PC series created');
      setIsFormOpen(false);
      resetForm();
      navigate(`/admin/pc-series/${response.data.id}`);
    } else {
      toast.error(response.message || 'Failed to create PC series');
    }
  };

  const handleDelete = async (series: PcSeries) => {
    if (!confirm(`Delete "${series.name}"? This removes every type, spec tier, and color under it. This can't be undone.`)) return;

    setDeletingId(series.id);
    const response = await deletePcSeries(series.id);
    if (response.success) {
      setSeriesList((prev) => prev.filter((s) => s.id !== series.id));
      toast.success(response.message || 'PC series deleted');
    } else {
      toast.error(response.message || 'Failed to delete PC series');
    }
    setDeletingId(null);
  };

  const moveRow = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= seriesList.length) return;

    const reordered = [...seriesList];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    setSeriesList(reordered);
    setIsReordering(true);

    const response = await reorderPcSeries(reordered.map((s, i) => ({ id: s.id, display_order: i })));
    if (response.success && response.data) {
      setSeriesList([...response.data].sort((a, b) => a.display_order - b.display_order));
    } else {
      toast.error(response.message || 'Failed to reorder');
    }
    setIsReordering(false);
  };

  const formatPriceRange = (series: PcSeries) => {
    if (series.starting_price != null) {
      const from = Number(series.starting_price).toLocaleString();
      return series.ending_price != null ? `from AED ${from} to AED ${Number(series.ending_price).toLocaleString()}` : `from AED ${from}`;
    }
    if (series.price_from == null || series.price_to == null) return 'No colors priced yet';
    const from = Number(series.price_from).toLocaleString();
    const to = Number(series.price_to).toLocaleString();
    return from === to ? `AED ${from}` : `AED ${from} – ${to}`;
  };

  return (
    <AdminLayout>
      <div className="p-6" ref={containerRef}>
        <div className="mb-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="font-orbitron text-3xl font-bold mb-2">
                PC <span className="text-primary">SERIES</span>
              </h1>
              <p className="text-muted-foreground">
                Prebuilt PC lines shown on the homepage (e.g. "PLAY", "LUMEN") — each has its own landing page with
                types, spec tiers, and colors. Create the series here, then manage its types/tiers/colors in its workbench.
              </p>
            </div>
            {!isFormOpen && (
              <CyberButton size="md" glowColor="cyan" onClick={handleNewSeries}>
                <Plus className="w-4 h-4 mr-2" />
                NEW SERIES
              </CyberButton>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isFormOpen ? (
            <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <NeonCard className="p-6 sm:p-8" glowColor="cyan" hover={false}>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <h2 className="font-orbitron text-xl font-bold">CREATE NEW SERIES</h2>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="ps-name">Name *</Label>
                      <Input
                        id="ps-name"
                        value={form.name}
                        onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g. PLAY"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="ps-badge">Availability badge</Label>
                      <Select
                        value={form.badgeStatus}
                        onValueChange={(value) => setForm((prev) => ({ ...prev, badgeStatus: value as PcSeriesBadgeStatus }))}
                      >
                        <SelectTrigger id="ps-badge" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="in_stock">In stock</SelectItem>
                          <SelectItem value="made_to_order">Made to order</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="ps-cta">Action button text</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Shown on the homepage card's button, e.g. "Configurations and prices" or "Configurator".
                    </p>
                    <Input
                      id="ps-cta"
                      value={form.actionButtonText}
                      onChange={(e) => setForm((prev) => ({ ...prev, actionButtonText: e.target.value }))}
                      placeholder="Configurations and prices"
                    />
                  </div>

                  <div>
                    <Label htmlFor="ps-description">Card description</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      One or two short lines shown under the name on the homepage card — put each line on its own row.
                    </p>
                    <Textarea
                      id="ps-description"
                      value={form.cardDescription}
                      onChange={(e) => setForm((prev) => ({ ...prev, cardDescription: e.target.value }))}
                      placeholder={'Any configuration to your specs\nCustom gaming PC'}
                      rows={2}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="ps-starting-price">Starting price (AED)</Label>
                      <p className="text-xs text-muted-foreground mb-2">
                        Shown as "from AED X" on the card. Overrides the computed price range — required for the
                        "Build your own" card below, since it has no real colors to compute a price from.
                      </p>
                      <Input
                        id="ps-starting-price"
                        type="number"
                        min={0}
                        step="0.01"
                        value={form.startingPrice}
                        onChange={(e) => setForm((prev) => ({ ...prev, startingPrice: e.target.value }))}
                        placeholder="8635.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="ps-ending-price">Ending price (AED)</Label>
                      <p className="text-xs text-muted-foreground mb-2">
                        Optional — pairs with starting price to show "from AED X to AED Y" instead of a single price.
                        Ignored unless a starting price is set above.
                      </p>
                      <Input
                        id="ps-ending-price"
                        type="number"
                        min={0}
                        step="0.01"
                        value={form.endingPrice}
                        onChange={(e) => setForm((prev) => ({ ...prev, endingPrice: e.target.value }))}
                        placeholder="17775.00"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="ps-custom-build"
                      checked={form.isCustomBuild}
                      onCheckedChange={(checked) => setForm((prev) => ({ ...prev, isCustomBuild: Boolean(checked) }))}
                    />
                    <Label htmlFor="ps-custom-build" className="cursor-pointer">
                      This is the "Build your own" card
                    </Label>
                  </div>
                  {form.isCustomBuild && (
                    <p className="-mt-2 text-xs text-muted-foreground">
                      Pinned last on the homepage regardless of order below, and links straight to the PC Builder
                      instead of a series landing page. Only one series can have this on at a time.
                    </p>
                  )}

                  <div>
                    <Label>Homepage card photo</Label>
                    <p className="text-xs text-muted-foreground mb-2">Shown behind the series name on the homepage card.</p>
                    <div className="flex flex-wrap gap-3">
                      {cardImagePreview ? (
                        <div className="relative h-24 w-24 overflow-hidden rounded-md border border-border">
                          <img src={cardImagePreview} alt="" className="h-full w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => {
                              URL.revokeObjectURL(cardImagePreview);
                              setCardImageFile(null);
                              setCardImagePreview(null);
                            }}
                            className="absolute top-1 right-1 rounded-full bg-black/70 p-1 text-white hover:bg-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors">
                          <ImageIcon className="h-5 w-5" />
                          <span className="text-[10px]">Add photo</span>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleCardImageSelect(e.target.files)} />
                        </label>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="ps-video">Landing page video URL</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Plays at the top of the series landing page — a link to the video (e.g. YouTube, Vimeo, or your own CDN).
                    </p>
                    <Input
                      id="ps-video"
                      type="url"
                      value={form.heroVideoUrl}
                      onChange={(e) => setForm((prev) => ({ ...prev, heroVideoUrl: e.target.value }))}
                      placeholder="https://..."
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="ps-active"
                      checked={form.isActive}
                      onCheckedChange={(checked) => setForm((prev) => ({ ...prev, isActive: Boolean(checked) }))}
                    />
                    <Label htmlFor="ps-active" className="cursor-pointer">
                      Active (visible on the homepage)
                    </Label>
                  </div>

                  <div className="flex gap-4 pt-4 border-t border-border">
                    <CyberButton type="submit" size="lg" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <Loader size="sm" label="Creating..." />
                      ) : (
                        <span className="flex items-center gap-2">
                          <Save className="w-4 h-4" />
                          CREATE & CONTINUE
                        </span>
                      )}
                    </CyberButton>
                    <CyberButton type="button" variant="outline" size="lg" onClick={() => { setIsFormOpen(false); resetForm(); }}>
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
                  <Loader label="Loading PC series..." />
                </NeonCard>
              ) : seriesList.length === 0 ? (
                <NeonCard className="p-12 text-center" glowColor="cyan" hover={false}>
                  <Layers className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-orbitron text-xl font-bold mb-2">No PC Series</h3>
                  <p className="text-muted-foreground mb-6">Create a series to group your prebuilt PCs on the homepage</p>
                  <CyberButton onClick={handleNewSeries} glowColor="cyan">
                    <Plus className="w-4 h-4 mr-2" />
                    CREATE FIRST SERIES
                  </CyberButton>
                </NeonCard>
              ) : (
                <div className="space-y-3">
                  {seriesList.map((series, index) => (
                    <motion.div key={series.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
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
                              disabled={index === seriesList.length - 1 || isReordering}
                              className="p-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                            >
                              <ChevronDown className="w-4 h-4" />
                            </button>
                          </div>

                          {series.card_image ? (
                            <img src={series.card_image} alt={series.name} className="h-14 w-14 rounded-lg object-cover border border-border shrink-0" />
                          ) : (
                            <div className="h-14 w-14 rounded-lg border border-border bg-muted flex items-center justify-center shrink-0">
                              <Layers className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <p className="font-rajdhani font-semibold truncate flex items-center gap-2">
                              {series.name}
                              {series.is_custom_build && (
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full border border-primary/40 text-primary normal-case">
                                  Build your own
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {formatPriceRange(series)} · "{series.action_button_text}" ·{' '}
                              {series.badge_status === 'made_to_order' ? 'Made to order' : 'In stock'}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {!series.is_active && (
                              <span className="hidden sm:inline text-xs text-muted-foreground border border-border rounded-full px-2 py-0.5">
                                Inactive
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <CyberButton size="sm" variant="outline" onClick={() => navigate(`/admin/pc-series/${series.id}`)}>
                              <Settings className="w-3.5 h-3.5 mr-1.5" />
                              Manage
                            </CyberButton>
                            <motion.button
                              onClick={() => handleDelete(series)}
                              disabled={deletingId === series.id}
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

export default AdminPcSeriesPage;
