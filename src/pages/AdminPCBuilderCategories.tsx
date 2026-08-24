import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import {
  ChevronDown,
  ChevronUp,
  Folder,
  ListOrdered,
  Minus,
  Plus,
  Save,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import AdminLayout from '@/components/layout/AdminLayout';
import { CyberButton } from '@/components/ui/CyberButton';
import { Loader } from '@/components/ui/Loader';
import { NeonCard } from '@/components/ui/NeonCard';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import {
  getPCBuilderCategoryConfig,
  updatePCBuilderCategoryConfig,
  type PCBuilderCategoryConfig,
} from '@/services/api';

const AdminPCBuilderCategoriesPage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const [includedRows, setIncludedRows] = useState<PCBuilderCategoryConfig[]>([]);
  const [availableRows, setAvailableRows] = useState<PCBuilderCategoryConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

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

  useEffect(() => {
    const loadConfig = async () => {
      setIsLoading(true);
      const response = await getPCBuilderCategoryConfig();

      if (response.success && response.data) {
        const withDefaults = response.data.map(category => ({
          ...category,
          max_quantity: category.max_quantity ?? 1,
          allow_duplicate_products: category.allow_duplicate_products ?? false,
        }));
        const included = withDefaults
          .filter(category => category.is_active)
          .sort((a, b) => a.display_order - b.display_order);
        const available = withDefaults
          .filter(category => !category.is_active)
          .sort((a, b) => a.category_name.localeCompare(b.category_name));

        setIncludedRows(included);
        setAvailableRows(available);
      } else {
        toast.error(response.message || 'Failed to load PC builder categories');
      }

      setIsLoading(false);
    };

    loadConfig();
  }, []);

  const handleInclude = (category: PCBuilderCategoryConfig) => {
    setAvailableRows(prev => prev.filter(item => item.category_id !== category.category_id));
    setIncludedRows(prev => [...prev, { ...category, is_active: true }]);
    setIsDirty(true);
  };

  const handleMaxQuantityChange = (categoryId: string, delta: 1 | -1) => {
    setIncludedRows(prev =>
      prev.map(item => {
        if (item.category_id !== categoryId) return item;
        const nextMaxQuantity = Math.max(1, Math.min(20, item.max_quantity + delta));
        return {
          ...item,
          max_quantity: nextMaxQuantity,
          // A single-select step (max 1) has nothing to duplicate — drop the flag
          // rather than leave a stale "on" that re-appears if the qty goes back up.
          allow_duplicate_products: nextMaxQuantity > 1 ? item.allow_duplicate_products : false,
        };
      })
    );
    setIsDirty(true);
  };

  const handleAllowDuplicateChange = (categoryId: string, allow: boolean) => {
    setIncludedRows(prev =>
      prev.map(item =>
        item.category_id === categoryId ? { ...item, allow_duplicate_products: allow } : item
      )
    );
    setIsDirty(true);
  };

  const handleExclude = (category: PCBuilderCategoryConfig) => {
    setIncludedRows(prev => prev.filter(item => item.category_id !== category.category_id));
    setAvailableRows(prev =>
      [...prev, { ...category, is_active: false }].sort((a, b) =>
        a.category_name.localeCompare(b.category_name)
      )
    );
    setIsDirty(true);
  };

  const moveRow = (index: number, direction: -1 | 1) => {
    setIncludedRows(prev => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;

      const next = [...prev];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
    setIsDirty(true);
  };

  const handleSave = async () => {
    setIsSubmitting(true);

    const payload = [
      ...includedRows.map((row, index) => ({
        category_id: row.category_id,
        display_order: index,
        is_active: true,
        max_quantity: row.max_quantity,
        allow_duplicate_products: row.allow_duplicate_products,
      })),
      ...availableRows.map(row => ({
        category_id: row.category_id,
        display_order: 0,
        is_active: false,
        max_quantity: row.max_quantity,
        allow_duplicate_products: row.allow_duplicate_products,
      })),
    ];

    const response = await updatePCBuilderCategoryConfig(payload);

    if (response.success) {
      toast.success(response.message || 'PC builder steps updated');
      setIsDirty(false);
    } else {
      toast.error(response.message || 'Failed to save PC builder steps');
    }

    setIsSubmitting(false);
  };

  const renderThumb = (category: PCBuilderCategoryConfig) => (
    category.image ? (
      <img src={category.image} alt={category.category_name} className="w-9 h-9 rounded-lg object-cover shrink-0" />
    ) : (
      <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
        <Folder className="w-4 h-4 text-muted-foreground" />
      </div>
    )
  );

  return (
    <AdminLayout>
      <div className="p-6" ref={containerRef}>
        <div className="mb-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="font-orbitron text-3xl font-bold mb-2">
                PC BUILDER <span className="text-primary">CATEGORIES</span>
              </h1>
              <p className="text-muted-foreground">
                Choose which categories appear as steps in "Build From Scratch", and the order customers see them in.
              </p>
            </div>
            <CyberButton size="md" glowColor="cyan" onClick={handleSave} disabled={!isDirty || isSubmitting}>
              {isSubmitting ? (
                <Loader size="sm" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              SAVE CHANGES
            </CyberButton>
          </div>
        </div>

        {isLoading ? (
          <NeonCard className="p-12 text-center" glowColor="cyan" hover={false}>
            <Loader label="Loading PC builder categories..." />
          </NeonCard>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Included steps, in order */}
            <NeonCard className="p-6" glowColor="cyan" hover={false}>
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <ListOrdered className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-orbitron text-lg font-bold">BUILD STEPS</h2>
                  <p className="text-xs text-muted-foreground">Shown to customers in this order</p>
                </div>
              </div>

              {includedRows.length === 0 ? (
                <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
                  No categories included yet. Add categories from the right.
                </div>
              ) : (
                <div className="space-y-2">
                  {includedRows.map((category, index) => (
                    <motion.div
                      key={category.category_id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 rounded-lg border border-border bg-muted/20 p-3"
                    >
                      <div className="w-7 h-7 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center font-orbitron font-bold text-xs">
                        {index + 1}
                      </div>
                      {renderThumb(category)}
                      <span className="flex-1 min-w-0 font-rajdhani font-semibold truncate">
                        {category.category_name}
                      </span>
                      <div className="hidden sm:flex items-center gap-1.5 shrink-0 mr-1" title="Max quantity a customer can add for this step">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground mr-0.5">Max Qty</span>
                        <button
                          type="button"
                          onClick={() => handleMaxQuantityChange(category.category_id, -1)}
                          disabled={category.max_quantity <= 1}
                          className="p-1 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center font-mono-tech text-xs">
                          {category.max_quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleMaxQuantityChange(category.category_id, 1)}
                          disabled={category.max_quantity >= 20}
                          className="p-1 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <label
                        className={cn(
                          'hidden sm:flex items-center gap-1.5 shrink-0 mr-1 select-none',
                          category.max_quantity > 1 ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'
                        )}
                        title={
                          category.max_quantity > 1
                            ? 'Let a customer add the same product to this step more than once (e.g. 2x of one fan), instead of only different products'
                            : 'Raise Max Qty above 1 first — with only 1 slot, there\'s nothing to duplicate'
                        }
                      >
                        <Checkbox
                          checked={category.allow_duplicate_products}
                          disabled={category.max_quantity <= 1}
                          onCheckedChange={(checked) => handleAllowDuplicateChange(category.category_id, Boolean(checked))}
                        />
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                          Allow same product ×2+
                        </span>
                      </label>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => moveRow(index, -1)}
                          disabled={index === 0}
                          className="p-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveRow(index, 1)}
                          disabled={index === includedRows.length - 1}
                          className="p-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExclude(category)}
                          className="p-1.5 rounded-md border border-destructive/40 text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </NeonCard>

            {/* Available categories, not included */}
            <NeonCard className="p-6" glowColor="purple" hover={false}>
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <Folder className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h2 className="font-orbitron text-lg font-bold">AVAILABLE CATEGORIES</h2>
                  <p className="text-xs text-muted-foreground">Not shown in the builder</p>
                </div>
              </div>

              {availableRows.length === 0 ? (
                <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
                  Every category is included in the builder.
                </div>
              ) : (
                <div className="space-y-2">
                  {availableRows.map((category) => (
                    <motion.div
                      key={category.category_id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 rounded-lg border border-border bg-muted/10 p-3"
                    >
                      {renderThumb(category)}
                      <span className="flex-1 min-w-0 font-rajdhani font-semibold truncate text-muted-foreground">
                        {category.category_name}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleInclude(category)}
                        className="p-1.5 rounded-md border border-accent/40 text-accent hover:bg-accent/10 transition-colors shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </NeonCard>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminPCBuilderCategoriesPage;
