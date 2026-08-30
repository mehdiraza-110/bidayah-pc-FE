import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ImageIcon,
  Layers,
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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  getPcSeriesById,
  updatePcSeries,
  createPcSeriesType,
  updatePcSeriesType,
  deletePcSeriesType,
  reorderPcSeriesTypes,
  type PcSeries,
  type PcSeriesType,
  type PcSeriesBadgeStatus,
} from '@/services/api';

// ==================== TYPE ROW ====================
// A type's actual purchasable builds are managed entirely in the Featured
// Gaming PCs module (assign a build to this type there) — this row only
// covers the type's own name/subtitle/order, plus a read-only preview of
// which builds are currently assigned.

const TypeRow: React.FC<{
  type: PcSeriesType;
  index: number;
  total: number;
  onMove: (direction: -1 | 1) => void;
  onChange: () => void;
}> = ({ type, index, total, onMove, onChange }) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [name, setName] = useState(type.name);
  const [subtitle, setSubtitle] = useState(type.subtitle || '');
  const [isActive, setIsActive] = useState(type.is_active);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const gamingPcs = type.gaming_pcs || [];

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Please enter a type name');
      return;
    }
    setIsSaving(true);
    const response = await updatePcSeriesType(type.id, { name: name.trim(), subtitle: subtitle.trim() || undefined, is_active: isActive });
    setIsSaving(false);
    if (response.success) {
      toast.success('Type saved');
      onChange();
    } else {
      toast.error(response.message || 'Failed to save type');
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${type.name}"? Its assigned Featured Gaming PCs stay in that module, just unassigned from this series.`)) return;
    setIsDeleting(true);
    const response = await deletePcSeriesType(type.id);
    if (response.success) {
      toast.success('Type deleted');
      onChange();
    } else {
      toast.error(response.message || 'Failed to delete type');
      setIsDeleting(false);
    }
  };

  return (
    <NeonCard className="p-0 overflow-hidden" hover={false}>
      <div className="flex items-center gap-3 p-4">
        <button type="button" onClick={() => setIsExpanded((v) => !v)} className="p-1 text-muted-foreground hover:text-foreground shrink-0">
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        <div className="flex shrink-0 items-center gap-0.5">
          <button type="button" onClick={() => onMove(-1)} disabled={index === 0} className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30">
            <ChevronUp className="w-4 h-4" />
          </button>
          <button type="button" onClick={() => onMove(1)} disabled={index === total - 1} className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30">
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 min-w-0" onClick={() => setIsExpanded((v) => !v)} role="button" tabIndex={-1}>
          <p className="font-orbitron font-bold truncate">{type.name}</p>
          <p className="text-xs text-muted-foreground truncate">
            {gamingPcs.length} build{gamingPcs.length === 1 ? '' : 's'}{!type.is_active && ' · Inactive'}
          </p>
        </div>
        <button type="button" onClick={handleDelete} disabled={isDeleting} className="p-2 rounded-md border border-destructive text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50 shrink-0">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {isExpanded && (
        <div className="border-t border-border p-4 space-y-4">
          <div>
            <Label>Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. PLAY 1" />
          </div>
          <div>
            <Label>Subtitle</Label>
            <Textarea value={subtitle} onChange={(e) => setSubtitle(e.target.value)} rows={2} placeholder="Compact and powerful. For work and entertainment without limits." />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id={`type-active-${type.id}`} checked={isActive} onCheckedChange={(c) => setIsActive(Boolean(c))} />
            <Label htmlFor={`type-active-${type.id}`} className="cursor-pointer">Active</Label>
          </div>
          <CyberButton size="sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader size="sm" label="Saving..." /> : (<span className="flex items-center gap-2"><Save className="w-3.5 h-3.5" />SAVE TYPE</span>)}
          </CyberButton>

          <div className="pt-4 border-t border-border space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" />Builds in this type</Label>
              <CyberButton size="sm" variant="outline" onClick={() => navigate('/admin/featured-gaming-pcs')}>
                Manage in Featured Gaming PCs
              </CyberButton>
            </div>
            <p className="text-xs text-muted-foreground">
              Assign a build to "{type.name}" from its own edit form in the Featured Gaming PCs module — set its
              Series Type there, plus an optional tier name (groups color siblings) and color.
            </p>

            <div className="space-y-2">
              {gamingPcs.map((pc) => (
                <div key={pc.id} className="flex items-center gap-3 rounded-md border border-border p-2.5">
                  {pc.images[0] ? (
                    <img src={pc.images[0]} alt={pc.name} className="h-10 w-10 rounded-md object-cover border border-border shrink-0" />
                  ) : (
                    <div className="h-10 w-10 rounded-md border border-border bg-muted flex items-center justify-center shrink-0">
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  {pc.color_swatch_hex && (
                    <span className="h-4 w-4 rounded-full border border-border shrink-0" style={{ backgroundColor: pc.color_swatch_hex }} title={pc.color_name || undefined} />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-rajdhani font-semibold truncate">{pc.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      AED {Number(pc.price).toLocaleString()}
                      {pc.tier_name && ` · Tier: ${pc.tier_name}`}
                      {pc.color_name && ` · ${pc.color_name}`}
                      {pc.fps_score != null && ` · ${pc.fps_score} FPS`}
                      {!pc.is_active && ' · Inactive'}
                    </p>
                  </div>
                </div>
              ))}
              {gamingPcs.length === 0 && (
                <p className="text-xs text-muted-foreground">No builds assigned to this type yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </NeonCard>
  );
};

// ==================== PAGE ====================

const AdminPcSeriesWorkbenchPage: React.FC = () => {
  const { seriesId } = useParams<{ seriesId: string }>();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  const [series, setSeries] = useState<PcSeries | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Series basic-fields form
  const [name, setName] = useState('');
  const [actionButtonText, setActionButtonText] = useState('');
  const [badgeStatus, setBadgeStatus] = useState<PcSeriesBadgeStatus>('in_stock');
  const [isActive, setIsActive] = useState(true);
  const [cardDescription, setCardDescription] = useState('');
  const [startingPrice, setStartingPrice] = useState('');
  const [endingPrice, setEndingPrice] = useState('');
  const [isCustomBuild, setIsCustomBuild] = useState(false);
  const [cardImageFile, setCardImageFile] = useState<File | null>(null);
  const [cardImagePreview, setCardImagePreview] = useState<string | null>(null);
  const [heroVideoUrl, setHeroVideoUrl] = useState('');
  const [isSavingSeries, setIsSavingSeries] = useState(false);

  const [isAddingType, setIsAddingType] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [isCreatingType, setIsCreatingType] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(containerRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' });
    });
    return () => ctx.revert();
  }, []);

  const loadSeries = async () => {
    if (!seriesId) return;
    setIsLoading(true);
    const response = await getPcSeriesById(seriesId);
    if (response.success && response.data) {
      setSeries(response.data);
      setName(response.data.name);
      setActionButtonText(response.data.action_button_text);
      setBadgeStatus(response.data.badge_status);
      setIsActive(response.data.is_active);
      setCardDescription(response.data.card_description || '');
      setStartingPrice(response.data.starting_price != null ? String(response.data.starting_price) : '');
      setEndingPrice(response.data.ending_price != null ? String(response.data.ending_price) : '');
      setIsCustomBuild(response.data.is_custom_build);
      setHeroVideoUrl(response.data.hero_video || '');
    } else {
      toast.error(response.message || 'Failed to load PC series');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadSeries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seriesId]);

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

  const handleSaveSeries = async () => {
    if (!seriesId) return;
    if (!name.trim()) {
      toast.error('Please enter a name');
      return;
    }
    setIsSavingSeries(true);
    const response = await updatePcSeries(seriesId, {
      name: name.trim(),
      action_button_text: actionButtonText.trim() || undefined,
      badge_status: badgeStatus,
      is_active: isActive,
      card_image: cardImageFile || undefined,
      hero_video: heroVideoUrl.trim(),
      card_description: cardDescription.trim() || undefined,
      starting_price: startingPrice.trim() ? Number(startingPrice) : null,
      ending_price: endingPrice.trim() ? Number(endingPrice) : null,
      is_custom_build: isCustomBuild,
    });
    setIsSavingSeries(false);
    if (response.success) {
      toast.success('Series saved');
      if (cardImagePreview) URL.revokeObjectURL(cardImagePreview);
      setCardImageFile(null);
      setCardImagePreview(null);
      loadSeries();
    } else {
      toast.error(response.message || 'Failed to save series');
    }
  };

  const handleAddType = async () => {
    if (!seriesId || !newTypeName.trim()) {
      toast.error('Please enter a type name');
      return;
    }
    setIsCreatingType(true);
    const response = await createPcSeriesType({ series_id: seriesId, name: newTypeName.trim() });
    setIsCreatingType(false);
    if (response.success) {
      toast.success('Type added');
      setNewTypeName('');
      setIsAddingType(false);
      loadSeries();
    } else {
      toast.error(response.message || 'Failed to add type');
    }
  };

  const moveType = async (typeIndex: number, direction: -1 | 1) => {
    if (!series) return;
    const types = series.types || [];
    const targetIndex = typeIndex + direction;
    if (targetIndex < 0 || targetIndex >= types.length) return;
    const reordered = [...types];
    [reordered[typeIndex], reordered[targetIndex]] = [reordered[targetIndex], reordered[typeIndex]];
    const response = await reorderPcSeriesTypes(reordered.map((t, i) => ({ id: t.id, display_order: i })));
    if (response.success) loadSeries();
    else toast.error(response.message || 'Failed to reorder types');
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-6">
          <NeonCard className="p-12 text-center" glowColor="cyan" hover={false}>
            <Loader label="Loading series..." />
          </NeonCard>
        </div>
      </AdminLayout>
    );
  }

  if (!series) {
    return (
      <AdminLayout>
        <div className="p-6">
          <NeonCard className="p-12 text-center" glowColor="cyan" hover={false}>
            <p className="text-muted-foreground mb-4">This PC series couldn't be found.</p>
            <CyberButton onClick={() => navigate('/admin/pc-series')}>Back to PC Series</CyberButton>
          </NeonCard>
        </div>
      </AdminLayout>
    );
  }

  const types = series.types || [];

  return (
    <AdminLayout>
      <div className="p-6" ref={containerRef}>
        <button
          type="button"
          onClick={() => navigate('/admin/pc-series')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to PC Series
        </button>

        <div className="mb-8">
          <h1 className="font-orbitron text-3xl font-bold mb-2">
            {series.name.toUpperCase()} <span className="text-primary">WORKBENCH</span>
          </h1>
          <p className="text-muted-foreground">
            Manage this series' details, its types (e.g. "PLAY 1"), each type's spec tiers, and each tier's colors.
          </p>
        </div>

        {/* Series basic fields */}
        <NeonCard className="p-6 mb-6" glowColor="cyan" hover={false}>
          <h2 className="font-orbitron text-lg font-bold mb-4">SERIES DETAILS</h2>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="wb-name">Name *</Label>
                <Input id="wb-name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="wb-badge">Availability badge</Label>
                <Select value={badgeStatus} onValueChange={(v) => setBadgeStatus(v as PcSeriesBadgeStatus)}>
                  <SelectTrigger id="wb-badge" className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_stock">In stock</SelectItem>
                    <SelectItem value="made_to_order">Made to order</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="wb-cta">Action button text</Label>
              <Input id="wb-cta" value={actionButtonText} onChange={(e) => setActionButtonText(e.target.value)} placeholder="Configurations and prices" />
            </div>

            <div>
              <Label htmlFor="wb-description">Card description</Label>
              <p className="text-xs text-muted-foreground mb-2">
                One or two short lines shown under the name on the homepage card — put each line on its own row.
              </p>
              <Textarea
                id="wb-description"
                value={cardDescription}
                onChange={(e) => setCardDescription(e.target.value)}
                placeholder={'Any configuration to your specs\nCustom gaming PC'}
                rows={2}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="wb-starting-price">Starting price (AED)</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Shown as "from AED X" on the card. Overrides the computed price range.
                </p>
                <Input
                  id="wb-starting-price"
                  type="number"
                  min={0}
                  step="0.01"
                  value={startingPrice}
                  onChange={(e) => setStartingPrice(e.target.value)}
                  placeholder="8635.00"
                />
              </div>
              <div>
                <Label htmlFor="wb-ending-price">Ending price (AED)</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Optional — pairs with starting price to show "from AED X to AED Y" instead of a single price.
                </p>
                <Input
                  id="wb-ending-price"
                  type="number"
                  min={0}
                  step="0.01"
                  value={endingPrice}
                  onChange={(e) => setEndingPrice(e.target.value)}
                  placeholder="17775.00"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="wb-custom-build" checked={isCustomBuild} onCheckedChange={(c) => setIsCustomBuild(Boolean(c))} />
              <Label htmlFor="wb-custom-build" className="cursor-pointer">This is the "Build your own" card</Label>
            </div>
            {isCustomBuild && (
              <p className="-mt-2 text-xs text-muted-foreground">
                Pinned last on the homepage regardless of order, and links straight to the PC Builder instead of a
                series landing page — its types/tiers/colors below are ignored on the storefront. Only one series can
                have this on at a time.
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Homepage card photo</Label>
                <div className="flex flex-wrap gap-3 mt-1">
                  {cardImagePreview || series.card_image ? (
                    <div className="relative h-20 w-20 overflow-hidden rounded-md border border-border">
                      <img src={cardImagePreview || series.card_image || ''} alt="" className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-md border border-border bg-muted/30">
                      <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors">
                    <Upload className="h-4 w-4" />
                    <span className="text-[9px]">Replace</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleCardImageSelect(e.target.files)} />
                  </label>
                </div>
              </div>
              <div>
                <Label htmlFor="wb-video">Landing page video URL</Label>
                <p className="text-xs text-muted-foreground mb-2">A link to the video (e.g. YouTube, Vimeo, or your own CDN).</p>
                <Input
                  id="wb-video"
                  type="url"
                  value={heroVideoUrl}
                  onChange={(e) => setHeroVideoUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox id="wb-active" checked={isActive} onCheckedChange={(c) => setIsActive(Boolean(c))} />
              <Label htmlFor="wb-active" className="cursor-pointer">Active (visible on the homepage)</Label>
            </div>

            <CyberButton size="md" onClick={handleSaveSeries} disabled={isSavingSeries}>
              {isSavingSeries ? <Loader size="sm" label="Saving..." /> : (<span className="flex items-center gap-2"><Save className="w-4 h-4" />SAVE SERIES</span>)}
            </CyberButton>
          </div>
        </NeonCard>

        {isCustomBuild ? (
          <NeonCard className="p-8 text-center" hover={false}>
            <p className="text-muted-foreground">
              This is the "Build your own" card — it links straight to the PC Builder, so it doesn't need types, spec
              tiers, or colors. Turn off "Build your own" above if you meant to make this a real series instead.
            </p>
          </NeonCard>
        ) : (
          <>
            {/* Series types */}
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-orbitron text-lg font-bold flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                SERIES TYPES
              </h2>
              {!isAddingType && (
                <CyberButton size="sm" onClick={() => setIsAddingType(true)}>
                  <Plus className="w-3.5 h-3.5 mr-1" />Add Type
                </CyberButton>
              )}
            </div>

            {isAddingType && (
              <NeonCard className="p-4 mb-3" hover={false}>
                <div className="flex gap-2">
                  <Input
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    placeholder="e.g. PLAY 1"
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddType(); } }}
                    autoFocus
                  />
                  <CyberButton size="sm" onClick={handleAddType} disabled={isCreatingType}>
                    {isCreatingType ? <Loader size="sm" /> : 'Add'}
                  </CyberButton>
                  <CyberButton size="sm" variant="outline" onClick={() => { setIsAddingType(false); setNewTypeName(''); }}>
                    <X className="w-3.5 h-3.5" />
                  </CyberButton>
                </div>
              </NeonCard>
            )}

            <div className="space-y-3">
              {types.map((type, index) => (
                <motion.div key={type.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <TypeRow type={type} index={index} total={types.length} onMove={(direction) => moveType(index, direction)} onChange={loadSeries} />
                </motion.div>
              ))}
              {types.length === 0 && (
                <NeonCard className="p-8 text-center" hover={false}>
                  <p className="text-muted-foreground">No types yet — add one (e.g. "PLAY 1") to start building this series.</p>
                </NeonCard>
              )}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminPcSeriesWorkbenchPage;
