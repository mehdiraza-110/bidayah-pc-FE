import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import {
  ArrowRight,
  Check,
  ChevronsUpDown,
  Cpu,
  Layers,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import AdminLayout from '@/components/layout/AdminLayout';
import { CyberButton } from '@/components/ui/CyberButton';
import { NeonCard } from '@/components/ui/NeonCard';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  createPCBuilderFilterRule,
  deletePCBuilderFilterRule,
  getPCBuilderCategoryConfig,
  getPCBuilderCategoryVendorConfig,
  getPCBuilderFilterRules,
  updatePCBuilderCategoryVendors,
  updatePCBuilderFilterRule,
  type PCBuilderCategoryConfig,
  type PCBuilderCategoryVendorAssociation,
  type PCBuilderFilterRule,
  type Vendor,
} from '@/services/api';
import { cn } from '@/lib/utils';

const selectClassName =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

type RuleFormState = {
  selected_category_id: string;
  selected_vendor_id: string;
  result_category_id: string;
  result_vendor_id: string;
  keywords: string;
  symmetric: boolean;
  is_active: boolean;
};

const emptyRuleForm: RuleFormState = {
  selected_category_id: '',
  selected_vendor_id: '',
  result_category_id: '',
  result_vendor_id: '',
  keywords: '',
  symmetric: true,
  is_active: true,
};

const AdminBuilderRulesPage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const [categories, setCategories] = useState<PCBuilderCategoryConfig[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [associations, setAssociations] = useState<PCBuilderCategoryVendorAssociation[]>([]);
  const [rules, setRules] = useState<PCBuilderFilterRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openPopoverCategoryId, setOpenPopoverCategoryId] = useState<string | null>(null);
  const [ruleForm, setRuleForm] = useState<RuleFormState>(emptyRuleForm);
  const [isSubmittingRule, setIsSubmittingRule] = useState(false);

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

      const [categoryConfigResponse, categoryVendorResponse, rulesResponse] = await Promise.all([
        getPCBuilderCategoryConfig(),
        getPCBuilderCategoryVendorConfig(),
        getPCBuilderFilterRules(),
      ]);

      if (categoryConfigResponse.success && categoryConfigResponse.data) {
        setCategories(categoryConfigResponse.data);
      } else {
        toast.error(categoryConfigResponse.message || 'Failed to load builder categories');
      }

      if (categoryVendorResponse.success && categoryVendorResponse.data) {
        setVendors(categoryVendorResponse.data.vendors);
        setAssociations(categoryVendorResponse.data.associations);
      } else {
        toast.error(categoryVendorResponse.message || 'Failed to load category vendors');
      }

      if (rulesResponse.success && rulesResponse.data) {
        setRules(rulesResponse.data);
      } else {
        toast.error(rulesResponse.message || 'Failed to load builder rules');
      }

      setIsLoading(false);
    };

    loadData();
  }, []);

  const builderCategories = useMemo(
    () =>
      categories
        .filter(category => category.is_active)
        .sort((a, b) => a.display_order - b.display_order),
    [categories]
  );

  const vendorNameById = useMemo(() => new Map(vendors.map(vendor => [vendor.id, vendor.vendor_name])), [vendors]);
  const categoryNameById = useMemo(
    () => new Map(categories.map(category => [category.category_id, category.category_name])),
    [categories]
  );

  const vendorIdsForCategory = (categoryId: string) =>
    associations.filter(item => item.category_id === categoryId).map(item => item.vendor_id);

  const vendorsForCategory = (categoryId: string): Vendor[] => {
    const configuredIds = vendorIdsForCategory(categoryId);
    if (configuredIds.length === 0) return vendors;
    return configuredIds
      .map(id => vendors.find(vendor => vendor.id === id))
      .filter((vendor): vendor is Vendor => Boolean(vendor));
  };

  const handleAddVendor = async (categoryId: string, vendorId: string) => {
    const nextIds = [...vendorIdsForCategory(categoryId), vendorId];
    const previous = associations;

    setAssociations(prev => [...prev, { category_id: categoryId, vendor_id: vendorId, display_order: nextIds.length - 1 }]);
    setOpenPopoverCategoryId(null);

    const response = await updatePCBuilderCategoryVendors(categoryId, nextIds);
    if (!response.success) {
      setAssociations(previous);
      toast.error(response.message || 'Failed to update category vendors');
    }
  };

  const handleRemoveVendor = async (categoryId: string, vendorId: string) => {
    const nextIds = vendorIdsForCategory(categoryId).filter(id => id !== vendorId);
    const previous = associations;

    setAssociations(prev => prev.filter(item => !(item.category_id === categoryId && item.vendor_id === vendorId)));

    const response = await updatePCBuilderCategoryVendors(categoryId, nextIds);
    if (!response.success) {
      setAssociations(previous);
      toast.error(response.message || 'Failed to update category vendors');
    }
  };

  const findMirror = (rule: PCBuilderFilterRule, allRules: PCBuilderFilterRule[]) =>
    allRules.find(
      other =>
        other.id !== rule.id &&
        other.selected_category_id === rule.result_category_id &&
        (other.selected_vendor_id || null) === (rule.result_vendor_id || null) &&
        other.result_category_id === rule.selected_category_id &&
        (other.result_vendor_id || null) === (rule.selected_vendor_id || null)
    );

  const handleCreateRule = async (event: React.FormEvent) => {
    event.preventDefault();

    const { selected_category_id, selected_vendor_id, result_category_id, result_vendor_id } = ruleForm;

    if (!selected_category_id || !selected_vendor_id || !result_category_id) {
      toast.error('Choose a trigger category, vendor, and a result category');
      return;
    }

    if (selected_category_id === result_category_id) {
      toast.error('The trigger category and result category must be different');
      return;
    }

    setIsSubmittingRule(true);

    const selectedCategoryName = categoryNameById.get(selected_category_id) || 'Category';
    const selectedVendorName = vendorNameById.get(selected_vendor_id) || 'Vendor';
    const resultCategoryName = categoryNameById.get(result_category_id) || 'Category';
    const resultVendorName = result_vendor_id ? vendorNameById.get(result_vendor_id) : undefined;

    const keywords = ruleForm.keywords
      .split(',')
      .map(term => term.trim())
      .filter(Boolean);

    const forwardPayload = {
      rule_name: `${selectedCategoryName}: ${selectedVendorName} → ${resultCategoryName}${resultVendorName ? `: ${resultVendorName}` : ''}`,
      selected_category_id,
      selected_vendor_id,
      result_category_id,
      result_vendor_id: result_vendor_id || null,
      spec_match_terms: keywords,
      spec_match_mode: 'any' as const,
      is_active: ruleForm.is_active,
    };

    try {
      const created: PCBuilderFilterRule[] = [];

      const forwardResponse = await createPCBuilderFilterRule(forwardPayload);
      if (!forwardResponse.success || !forwardResponse.data) {
        toast.error(forwardResponse.message || 'Failed to create rule');
        return;
      }
      created.push(forwardResponse.data);

      if (ruleForm.symmetric && result_vendor_id) {
        const reversePayload = {
          rule_name: `${resultCategoryName}: ${resultVendorName} → ${selectedCategoryName}: ${selectedVendorName}`,
          selected_category_id: result_category_id,
          selected_vendor_id: result_vendor_id,
          result_category_id: selected_category_id,
          result_vendor_id: selected_vendor_id,
          spec_match_terms: [],
          spec_match_mode: 'any' as const,
          is_active: ruleForm.is_active,
        };

        const reverseResponse = await createPCBuilderFilterRule(reversePayload);
        if (reverseResponse.success && reverseResponse.data) {
          created.push(reverseResponse.data);
        } else {
          toast.error(reverseResponse.message || 'Forward rule created, but the reverse rule failed');
        }
      }

      setRules(prev => [...created, ...prev]);
      toast.success(created.length > 1 ? 'Compatibility link created (both directions)' : 'Compatibility rule created');
      setRuleForm(emptyRuleForm);
    } finally {
      setIsSubmittingRule(false);
    }
  };

  const handleDeleteRule = async (rule: PCBuilderFilterRule) => {
    const mirror = findMirror(rule, rules);
    const label = mirror ? `${rule.rule_name} (both directions)` : rule.rule_name;

    if (!confirm(`Remove "${label}"?`)) return;

    const idsToDelete = mirror ? [rule.id, mirror.id] : [rule.id];

    for (const id of idsToDelete) {
      const response = await deletePCBuilderFilterRule(id);
      if (!response.success) {
        toast.error(response.message || 'Failed to delete rule');
        return;
      }
    }

    setRules(prev => prev.filter(item => !idsToDelete.includes(item.id)));
    toast.success('Compatibility rule removed');
  };

  const handleToggleRuleActive = async (rule: PCBuilderFilterRule, checked: boolean) => {
    const mirror = findMirror(rule, rules);
    const idsToUpdate = mirror ? [rule.id, mirror.id] : [rule.id];

    const responses = await Promise.all(idsToUpdate.map(id => updatePCBuilderFilterRule(id, { is_active: checked })));

    if (responses.some(response => !response.success)) {
      toast.error('Failed to update rule status');
      return;
    }

    setRules(prev => prev.map(item => (idsToUpdate.includes(item.id) ? { ...item, is_active: checked } : item)));
  };

  const renderedRuleIds = new Set<string>();
  const ruleCards = rules
    .map(rule => {
      if (renderedRuleIds.has(rule.id)) return null;

      const mirror = findMirror(rule, rules);
      if (mirror) {
        renderedRuleIds.add(mirror.id);
      }
      renderedRuleIds.add(rule.id);

      return { rule, mirror };
    })
    .filter((entry): entry is { rule: PCBuilderFilterRule; mirror: PCBuilderFilterRule | undefined } => Boolean(entry));

  const selectedCategoryVendors = ruleForm.selected_category_id ? vendorsForCategory(ruleForm.selected_category_id) : [];
  const resultCategoryVendors = ruleForm.result_category_id ? vendorsForCategory(ruleForm.result_category_id) : [];

  return (
    <AdminLayout>
      <div className="p-6" ref={containerRef}>
        <div className="mb-8">
          <h1 className="font-orbitron text-3xl font-bold mb-2">
            BUILDER <span className="text-primary">RULES</span>
          </h1>
          <p className="text-muted-foreground">
            Control which vendors show for each build step, and which vendor picks are compatible with each other.
          </p>
        </div>

        {isLoading ? (
          <NeonCard className="p-12 text-center" glowColor="cyan" hover={false}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"
            />
            <p className="text-muted-foreground mt-4">Loading builder rules...</p>
          </NeonCard>
        ) : builderCategories.length === 0 ? (
          <NeonCard className="p-12 text-center" glowColor="cyan" hover={false}>
            <Layers className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-orbitron text-xl font-bold mb-2">No Build Steps Yet</h3>
            <p className="text-muted-foreground">
              Add categories to the builder from Builder Categories first, then come back here.
            </p>
          </NeonCard>
        ) : (
          <div className="space-y-8">
            {/* Section 1: category vendors */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Cpu className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-orbitron text-lg font-bold">STEP VENDORS</h2>
                  <p className="text-xs text-muted-foreground">
                    Which vendors show for each category. Leave a category empty to show every vendor.
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {builderCategories.map(category => {
                  const selectedVendorIds = vendorIdsForCategory(category.category_id);
                  const availableVendors = vendors.filter(vendor => !selectedVendorIds.includes(vendor.id));

                  return (
                    <NeonCard key={category.category_id} className="p-5" glowColor="cyan" hover={false}>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-orbitron font-bold">{category.category_name}</h3>
                        <Popover
                          open={openPopoverCategoryId === category.category_id}
                          onOpenChange={open => setOpenPopoverCategoryId(open ? category.category_id : null)}
                        >
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Add vendor
                              <ChevronsUpDown className="w-3 h-3 opacity-50" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="p-0 w-64" align="end">
                            <Command>
                              <CommandInput placeholder="Search vendors..." />
                              <CommandList>
                                <CommandEmpty>No vendors found.</CommandEmpty>
                                <CommandGroup>
                                  {availableVendors.map(vendor => (
                                    <CommandItem
                                      key={vendor.id}
                                      value={vendor.vendor_name}
                                      onSelect={() => handleAddVendor(category.category_id, vendor.id)}
                                    >
                                      {vendor.vendor_name}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>

                      {selectedVendorIds.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">
                          Unrestricted &mdash; every vendor is shown for this step.
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {selectedVendorIds.map(vendorId => (
                            <Badge key={vendorId} variant="secondary" className="gap-1 pr-1">
                              {vendorNameById.get(vendorId) || vendorId}
                              <button
                                type="button"
                                onClick={() => handleRemoveVendor(category.category_id, vendorId)}
                                className="ml-1 rounded-full hover:bg-destructive/20 hover:text-destructive p-0.5 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </NeonCard>
                  );
                })}
              </div>
            </div>

            {/* Section 2: compatibility rules */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <ArrowRight className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h2 className="font-orbitron text-lg font-bold">COMPATIBILITY LINKS</h2>
                  <p className="text-xs text-muted-foreground">
                    When a vendor is picked for one step, restrict what's compatible in another.
                  </p>
                </div>
              </div>

              <NeonCard className="p-6 mb-6" glowColor="purple" hover={false}>
                <form onSubmit={handleCreateRule} className="space-y-5">
                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_auto_1fr_1fr] gap-3 items-end">
                    <div>
                      <Label htmlFor="selected_category_id">When customer picks category</Label>
                      <select
                        id="selected_category_id"
                        value={ruleForm.selected_category_id}
                        onChange={event =>
                          setRuleForm(prev => ({ ...prev, selected_category_id: event.target.value, selected_vendor_id: '' }))
                        }
                        className={selectClassName}
                        required
                      >
                        <option value="">Choose category</option>
                        {builderCategories.map(category => (
                          <option key={category.category_id} value={category.category_id}>
                            {category.category_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="selected_vendor_id">And vendor</Label>
                      <select
                        id="selected_vendor_id"
                        value={ruleForm.selected_vendor_id}
                        onChange={event => setRuleForm(prev => ({ ...prev, selected_vendor_id: event.target.value }))}
                        className={selectClassName}
                        required
                        disabled={!ruleForm.selected_category_id}
                      >
                        <option value="">Choose vendor</option>
                        {selectedCategoryVendors.map(vendor => (
                          <option key={vendor.id} value={vendor.id}>
                            {vendor.vendor_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="hidden lg:flex items-center justify-center pb-2">
                      <ArrowRight className="w-5 h-5 text-muted-foreground" />
                    </div>

                    <div>
                      <Label htmlFor="result_category_id">Only show in category</Label>
                      <select
                        id="result_category_id"
                        value={ruleForm.result_category_id}
                        onChange={event =>
                          setRuleForm(prev => ({ ...prev, result_category_id: event.target.value, result_vendor_id: '' }))
                        }
                        className={selectClassName}
                        required
                      >
                        <option value="">Choose category</option>
                        {builderCategories
                          .filter(category => category.category_id !== ruleForm.selected_category_id)
                          .map(category => (
                            <option key={category.category_id} value={category.category_id}>
                              {category.category_name}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="result_vendor_id">Vendor (optional)</Label>
                      <select
                        id="result_vendor_id"
                        value={ruleForm.result_vendor_id}
                        onChange={event => setRuleForm(prev => ({ ...prev, result_vendor_id: event.target.value }))}
                        className={selectClassName}
                        disabled={!ruleForm.result_category_id}
                      >
                        <option value="">Any vendor</option>
                        {resultCategoryVendors.map(vendor => (
                          <option key={vendor.id} value={vendor.id}>
                            {vendor.vendor_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="keywords">Additionally require these spec keywords (optional)</Label>
                    <Input
                      id="keywords"
                      value={ruleForm.keywords}
                      onChange={event => setRuleForm(prev => ({ ...prev, keywords: event.target.value }))}
                      placeholder="LGA1700, DDR5"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Use this when a vendor alone doesn't guarantee compatibility (e.g. an ASUS board that comes in both
                      Intel and AMD versions).
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 pt-1">
                    <div className="flex items-center gap-3">
                      <Switch
                        id="symmetric"
                        checked={ruleForm.symmetric}
                        onCheckedChange={checked => setRuleForm(prev => ({ ...prev, symmetric: checked }))}
                        disabled={!ruleForm.result_vendor_id}
                      />
                      <Label htmlFor="symmetric" className="cursor-pointer">
                        Apply in both directions
                      </Label>
                    </div>

                    <div className="flex items-center gap-3">
                      <Switch
                        id="rule_is_active"
                        checked={ruleForm.is_active}
                        onCheckedChange={checked => setRuleForm(prev => ({ ...prev, is_active: checked }))}
                      />
                      <Label htmlFor="rule_is_active" className="cursor-pointer">
                        Active
                      </Label>
                    </div>

                    <CyberButton type="submit" size="md" glowColor="cyan" disabled={isSubmittingRule} className="ml-auto">
                      {isSubmittingRule ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                        />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                      ADD RULE
                    </CyberButton>
                  </div>
                </form>
              </NeonCard>

              {ruleCards.length === 0 ? (
                <div className="rounded-lg border border-border bg-muted/20 p-6 text-sm text-muted-foreground text-center">
                  No compatibility links yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {ruleCards.map(({ rule, mirror }) => (
                    <motion.div
                      key={rule.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <NeonCard className="p-4" glowColor={rule.is_active ? 'cyan' : 'purple'} hover={false}>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-2 text-sm">
                            <span className="font-rajdhani font-semibold">
                              {categoryNameById.get(rule.selected_category_id) || rule.selected_category_name}
                            </span>
                            <Badge variant="outline">{rule.selected_vendor_name || 'Any vendor'}</Badge>
                            <ArrowRight className={cn('w-4 h-4 text-muted-foreground', mirror && 'hidden')} />
                            {mirror && <Check className="w-4 h-4 text-accent" title="Applies both directions" />}
                            <span className="font-rajdhani font-semibold">
                              {categoryNameById.get(rule.result_category_id) || rule.result_category_name}
                            </span>
                            <Badge variant="outline">{rule.result_vendor_name || 'Any vendor'}</Badge>
                            {(rule.spec_match_terms || []).length > 0 && (
                              <span className="text-xs text-muted-foreground">
                                + keywords: {(rule.spec_match_terms || []).join(', ')}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <Switch
                              checked={rule.is_active}
                              onCheckedChange={checked => handleToggleRuleActive(rule, checked)}
                            />
                            <button
                              type="button"
                              onClick={() => handleDeleteRule(rule)}
                              className="p-1.5 rounded-md border border-destructive/40 text-destructive hover:bg-destructive/10 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </NeonCard>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminBuilderRulesPage;
