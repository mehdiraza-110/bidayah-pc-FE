import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import gsap from 'gsap';
import {
  AlertCircle,
  Check,
  Edit,
  Eye,
  Filter,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import AdminLayout from '@/components/layout/AdminLayout';
import { CyberButton } from '@/components/ui/CyberButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NeonCard } from '@/components/ui/NeonCard';
import { Switch } from '@/components/ui/switch';
import {
  createPCBuilderFilterRule,
  deletePCBuilderFilterRule,
  getCategories,
  getPCBuilderFilterRules,
  getVendors,
  previewPCBuilderFilterRule,
  updatePCBuilderFilterRule,
  type Category,
  type PCBuilderFilterRule,
  type Product,
  type SpecMatchMode,
  type Vendor,
} from '@/services/api';
import { cn } from '@/lib/utils';

type RuleFormData = {
  rule_name: string;
  selected_category_id: string;
  selected_vendor_id: string;
  result_category_id: string;
  result_vendor_id: string;
  spec_match_mode: SpecMatchMode;
  priority: number;
  is_active: boolean;
};

const emptyForm: RuleFormData = {
  rule_name: '',
  selected_category_id: '',
  selected_vendor_id: '',
  result_category_id: '',
  result_vendor_id: '',
  spec_match_mode: 'any',
  priority: 10,
  is_active: true,
};

const selectClassName =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

const AdminFilterRulesPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditing = Boolean(id);
  const containerRef = useRef<HTMLDivElement>(null);

  const [rules, setRules] = useState<PCBuilderFilterRule[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [formData, setFormData] = useState<RuleFormData>(emptyForm);
  const [specTermsInput, setSpecTermsInput] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(isEditing);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewRuleId, setPreviewRuleId] = useState<string | null>(null);
  const [previewProducts, setPreviewProducts] = useState<Product[]>([]);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

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
    const loadData = async () => {
      setIsLoading(true);
      const [rulesResponse, categoriesResponse, vendorsResponse] = await Promise.all([
        getPCBuilderFilterRules(),
        getCategories(),
        getVendors(),
      ]);

      if (rulesResponse.success && rulesResponse.data) {
        setRules(rulesResponse.data);
      } else {
        toast.error(rulesResponse.message || 'Failed to load filter rules');
      }

      if (categoriesResponse.success && categoriesResponse.data) {
        setCategories(categoriesResponse.data);
      } else {
        toast.error(categoriesResponse.message || 'Failed to load categories');
      }

      if (vendorsResponse.success && vendorsResponse.data) {
        setVendors(vendorsResponse.data);
      } else {
        toast.error(vendorsResponse.message || 'Failed to load vendors');
      }

      setIsLoading(false);
    };

    loadData();
  }, []);

  useEffect(() => {
    if (!isEditing || !id) return;

    const rule = rules.find(item => item.id === id);
    if (rule) {
      setFormData({
        rule_name: rule.rule_name,
        selected_category_id: rule.selected_category_id,
        selected_vendor_id: rule.selected_vendor_id || '',
        result_category_id: rule.result_category_id,
        result_vendor_id: rule.result_vendor_id || '',
        spec_match_mode: rule.spec_match_mode || 'any',
        priority: rule.priority ?? 10,
        is_active: rule.is_active ?? true,
      });
      setSpecTermsInput((rule.spec_match_terms || []).join(', '));
      setIsFormOpen(true);
    } else if (!isLoading && rules.length > 0) {
      toast.error('Filter rule not found');
      navigate('/admin/filter-rules');
    }
  }, [id, isEditing, isLoading, navigate, rules]);

  const categoryNameById = useMemo(
    () => new Map(categories.map(category => [category.id, category.category_name])),
    [categories]
  );

  const vendorNameById = useMemo(
    () => new Map(vendors.map(vendor => [vendor.id, vendor.vendor_name])),
    [vendors]
  );

  const getCategoryName = (categoryId?: string | null) =>
    categoryId ? categoryNameById.get(categoryId) || categoryId : 'Any category';

  const getVendorName = (vendorId?: string | null) =>
    vendorId ? vendorNameById.get(vendorId) || vendorId : 'Any vendor';

  const handleNewRule = () => {
    navigate('/admin/filter-rules');
    setFormData(emptyForm);
    setSpecTermsInput('');
    setPreviewRuleId(null);
    setPreviewProducts([]);
    setIsFormOpen(true);
  };

  const handleEdit = (rule: PCBuilderFilterRule) => {
    navigate(`/admin/filter-rules/${rule.id}`);
    setIsFormOpen(true);
  };

  const buildPayload = () => ({
    rule_name: formData.rule_name.trim(),
    selected_category_id: formData.selected_category_id,
    selected_vendor_id: formData.selected_vendor_id || null,
    result_category_id: formData.result_category_id,
    result_vendor_id: formData.result_vendor_id || null,
    spec_match_terms: specTermsInput
      .split(',')
      .map(term => term.trim())
      .filter(Boolean),
    spec_match_mode: formData.spec_match_mode,
    priority: Number(formData.priority) || 0,
    is_active: formData.is_active,
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!formData.rule_name.trim()) {
      toast.error('Please enter a rule name');
      return;
    }
    if (!formData.selected_category_id || !formData.result_category_id) {
      toast.error('Please choose both selected and result categories');
      return;
    }

    setIsSubmitting(true);
    const payload = buildPayload();

    try {
      const response = isEditing && id
        ? await updatePCBuilderFilterRule(id, payload)
        : await createPCBuilderFilterRule(payload);

      if (response.success && response.data) {
        setRules(prev => {
          if (isEditing && id) {
            return prev.map(rule => (rule.id === id ? response.data! : rule));
          }
          return [response.data!, ...prev];
        });
        toast.success(response.message || (isEditing ? 'Filter rule updated' : 'Filter rule created'));
        setIsFormOpen(false);
        setFormData(emptyForm);
        setSpecTermsInput('');
        navigate('/admin/filter-rules');
      } else {
        toast.error(response.message || 'Failed to save filter rule');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (ruleId: string) => {
    const rule = rules.find(item => item.id === ruleId);
    if (!confirm(`Are you sure you want to delete "${rule?.rule_name}"?`)) return;

    const response = await deletePCBuilderFilterRule(ruleId);
    if (response.success) {
      setRules(prev => prev.filter(item => item.id !== ruleId));
      toast.success(response.message || 'Filter rule deleted');
    } else {
      toast.error(response.message || 'Failed to delete filter rule');
    }
  };

  const handlePreview = async (rule: PCBuilderFilterRule) => {
    setPreviewRuleId(rule.id);
    setPreviewProducts([]);
    setIsPreviewLoading(true);

    const response = await previewPCBuilderFilterRule(rule.id, {
      status: 'published',
      in_stock: true,
    });

    if (response.success && response.data) {
      setPreviewProducts(response.data);
    } else {
      toast.error(response.message || 'Failed to preview rule');
    }

    setIsPreviewLoading(false);
  };

  const renderCategoryOptions = () => categories.map(category => (
    <option key={category.id} value={category.id}>
      {category.category_name}
    </option>
  ));

  const renderVendorOptions = () => vendors.map(vendor => (
    <option key={vendor.id} value={vendor.id}>
      {vendor.vendor_name}
    </option>
  ));

  return (
    <AdminLayout>
      <div className="p-6" ref={containerRef}>
        <div className="mb-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="font-orbitron text-3xl font-bold mb-2">
                FILTER <span className="text-primary">RULES</span>
              </h1>
              <p className="text-muted-foreground">
                {isFormOpen ? (isEditing ? 'Edit PC builder filter rule' : 'Create a PC builder filter rule') : 'Control which products appear in the Build Your PC flow'}
              </p>
            </div>
            {!isFormOpen && (
              <CyberButton size="md" glowColor="cyan" onClick={handleNewRule}>
                <Plus className="w-4 h-4" />
                NEW RULE
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
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div>
                    <h2 className="font-orbitron text-xl font-bold mb-4">RULE SETUP</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="lg:col-span-2">
                        <Label htmlFor="rule_name">Rule Name *</Label>
                        <Input
                          id="rule_name"
                          value={formData.rule_name}
                          onChange={(event) => setFormData(prev => ({ ...prev, rule_name: event.target.value }))}
                          placeholder="AMD CPU shows AM5 motherboards"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="selected_category_id">When Selected Category *</Label>
                        <select
                          id="selected_category_id"
                          value={formData.selected_category_id}
                          onChange={(event) => setFormData(prev => ({ ...prev, selected_category_id: event.target.value }))}
                          className={selectClassName}
                          required
                        >
                          <option value="">Choose category</option>
                          {renderCategoryOptions()}
                        </select>
                      </div>

                      <div>
                        <Label htmlFor="selected_vendor_id">And Selected Vendor</Label>
                        <select
                          id="selected_vendor_id"
                          value={formData.selected_vendor_id}
                          onChange={(event) => setFormData(prev => ({ ...prev, selected_vendor_id: event.target.value }))}
                          className={selectClassName}
                        >
                          <option value="">Any vendor</option>
                          {renderVendorOptions()}
                        </select>
                      </div>

                      <div>
                        <Label htmlFor="result_category_id">Show Products From Category *</Label>
                        <select
                          id="result_category_id"
                          value={formData.result_category_id}
                          onChange={(event) => setFormData(prev => ({ ...prev, result_category_id: event.target.value }))}
                          className={selectClassName}
                          required
                        >
                          <option value="">Choose category</option>
                          {renderCategoryOptions()}
                        </select>
                      </div>

                      <div>
                        <Label htmlFor="result_vendor_id">Limited To Vendor</Label>
                        <select
                          id="result_vendor_id"
                          value={formData.result_vendor_id}
                          onChange={(event) => setFormData(prev => ({ ...prev, result_vendor_id: event.target.value }))}
                          className={selectClassName}
                        >
                          <option value="">Any vendor</option>
                          {renderVendorOptions()}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h2 className="font-orbitron text-xl font-bold mb-4">MATCHING</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <div className="lg:col-span-2">
                        <Label htmlFor="spec_match_terms">Spec Match Terms</Label>
                        <Input
                          id="spec_match_terms"
                          value={specTermsInput}
                          onChange={(event) => setSpecTermsInput(event.target.value)}
                          placeholder="AM5, DDR5, Intel LGA1700"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Separate terms with commas. Leave empty to match by category/vendor only.
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="spec_match_mode">Match Mode</Label>
                        <select
                          id="spec_match_mode"
                          value={formData.spec_match_mode}
                          onChange={(event) => setFormData(prev => ({ ...prev, spec_match_mode: event.target.value as SpecMatchMode }))}
                          className={selectClassName}
                        >
                          <option value="any">Any term</option>
                          <option value="all">All terms</option>
                        </select>
                      </div>

                      <div>
                        <Label htmlFor="priority">Priority</Label>
                        <Input
                          id="priority"
                          type="number"
                          value={formData.priority}
                          onChange={(event) => setFormData(prev => ({ ...prev, priority: Number(event.target.value) }))}
                        />
                      </div>

                      <div className="flex items-center gap-3 pt-7">
                        <Switch
                          id="is_active"
                          checked={formData.is_active}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                        />
                        <Label htmlFor="is_active" className="cursor-pointer">Active rule</Label>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 pt-4 border-t border-border">
                    <CyberButton type="submit" size="lg" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                          />
                          SAVING...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          {isEditing ? 'UPDATE RULE' : 'CREATE RULE'}
                        </>
                      )}
                    </CyberButton>
                    <CyberButton
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={() => {
                        setIsFormOpen(false);
                        navigate('/admin/filter-rules');
                      }}
                    >
                      <X className="w-4 h-4" />
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
                  <p className="text-muted-foreground mt-4">Loading filter rules...</p>
                </NeonCard>
              ) : rules.length === 0 ? (
                <NeonCard className="p-12 text-center" glowColor="cyan" hover={false}>
                  <Filter className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-orbitron text-xl font-bold mb-2">No Filter Rules</h3>
                  <p className="text-muted-foreground mb-6">
                    Create rules to control PC builder product compatibility.
                  </p>
                  <CyberButton onClick={handleNewRule} glowColor="cyan">
                    <Plus className="w-4 h-4" />
                    CREATE FIRST RULE
                  </CyberButton>
                </NeonCard>
              ) : (
                <div className="space-y-6">
                  {rules.map((rule, index) => (
                    <motion.div
                      key={rule.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04 }}
                    >
                      <NeonCard className="p-6" glowColor={rule.is_active ? 'cyan' : 'purple'} hover={false}>
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-3 mb-3">
                              <h3 className="font-orbitron text-xl font-bold truncate">{rule.rule_name}</h3>
                              <span className={cn(
                                'inline-flex items-center gap-1 px-2 py-1 text-xs rounded border',
                                rule.is_active
                                  ? 'text-accent border-accent/30 bg-accent/10'
                                  : 'text-muted-foreground border-border bg-muted/30'
                              )}>
                                {rule.is_active ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                                {rule.is_active ? 'Active' : 'Inactive'}
                              </span>
                              <span className="px-2 py-1 text-xs rounded bg-primary/10 text-primary border border-primary/30">
                                Priority {rule.priority}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 text-sm">
                              <div className="p-3 rounded-lg bg-muted/30 border border-border">
                                <p className="text-xs text-muted-foreground mb-1">Selected Category</p>
                                <p className="font-semibold">{getCategoryName(rule.selected_category_id)}</p>
                              </div>
                              <div className="p-3 rounded-lg bg-muted/30 border border-border">
                                <p className="text-xs text-muted-foreground mb-1">Selected Vendor</p>
                                <p className="font-semibold">{getVendorName(rule.selected_vendor_id)}</p>
                              </div>
                              <div className="p-3 rounded-lg bg-muted/30 border border-border">
                                <p className="text-xs text-muted-foreground mb-1">Result Category</p>
                                <p className="font-semibold">{getCategoryName(rule.result_category_id)}</p>
                              </div>
                              <div className="p-3 rounded-lg bg-muted/30 border border-border">
                                <p className="text-xs text-muted-foreground mb-1">Result Vendor</p>
                                <p className="font-semibold">{getVendorName(rule.result_vendor_id)}</p>
                              </div>
                            </div>

                            {(rule.spec_match_terms || []).length > 0 && (
                              <div className="flex flex-wrap items-center gap-2 mt-4">
                                <span className="text-xs text-muted-foreground uppercase">
                                  Match {rule.spec_match_mode || 'any'}:
                                </span>
                                {(rule.spec_match_terms || []).map(term => (
                                  <span key={term} className="px-2 py-1 text-xs rounded bg-secondary/10 text-secondary border border-secondary/30">
                                    {term}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2 xl:justify-end">
                            <CyberButton size="sm" variant="outline" onClick={() => handlePreview(rule)}>
                              <Eye className="w-4 h-4" />
                              PREVIEW
                            </CyberButton>
                            <CyberButton size="sm" variant="outline" onClick={() => handleEdit(rule)}>
                              <Edit className="w-4 h-4" />
                              EDIT
                            </CyberButton>
                            <motion.button
                              onClick={() => handleDelete(rule.id)}
                              className="p-2 rounded-lg border border-destructive text-destructive hover:bg-destructive/10 transition-colors"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </div>

                        {previewRuleId === rule.id && (
                          <div className="mt-5 pt-5 border-t border-border">
                            <h4 className="font-orbitron text-sm font-bold mb-3">PUBLISHED IN-STOCK PREVIEW</h4>
                            {isPreviewLoading ? (
                              <p className="text-muted-foreground text-sm">Loading matching products...</p>
                            ) : previewProducts.length === 0 ? (
                              <p className="text-muted-foreground text-sm">No matching products found.</p>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                {previewProducts.slice(0, 6).map(product => (
                                  <div key={product.id} className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
                                    {product.image && (
                                      <img src={product.image} alt={product.name} className="w-12 h-12 rounded object-cover" />
                                    )}
                                    <div className="min-w-0">
                                      <p className="font-semibold truncate">{product.name}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {product.category_name || getCategoryName(product.category_id)}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
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

export default AdminFilterRulesPage;
