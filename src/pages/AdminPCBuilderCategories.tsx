import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import {
  ChevronDown,
  ChevronUp,
  Folder,
  ListOrdered,
  Plus,
  Save,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import AdminLayout from '@/components/layout/AdminLayout';
import { CyberButton } from '@/components/ui/CyberButton';
import { NeonCard } from '@/components/ui/NeonCard';
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
        const included = response.data
          .filter(category => category.is_active)
          .sort((a, b) => a.display_order - b.display_order);
        const available = response.data
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
      })),
      ...availableRows.map(row => ({
        category_id: row.category_id,
        display_order: 0,
        is_active: false,
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
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                />
              ) : (
                <Save className="w-4 h-4" />
              )}
              SAVE CHANGES
            </CyberButton>
          </div>
        </div>

        {isLoading ? (
          <NeonCard className="p-12 text-center" glowColor="cyan" hover={false}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"
            />
            <p className="text-muted-foreground mt-4">Loading PC builder categories...</p>
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
