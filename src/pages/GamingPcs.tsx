import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, ChevronLeft, ChevronRight, Search, SlidersHorizontal, X } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import { GSAPScrollReveal } from '@/components/effects/GSAPScrollReveal';
import { Loader } from '@/components/ui/Loader';
import { ComingSoon } from '@/components/products/ComingSoon';
import { Slider } from '@/components/ui/slider';
import { gamingPcUrl } from '@/lib/slug';
import { cn } from '@/lib/utils';
import {
  getPublicFeaturedGamingPcs,
  getPublicPcSeriesList,
  type FeaturedGamingPc,
} from '@/services/api';

// Component groups we offer as spec filters. A build's components carry a
// category_name (e.g. "GPU", "CPU Cooler"), so each group is matched by
// regex and its options are the distinct component names found in that group.
const COMPONENT_GROUPS = [
  { key: 'gpu', label: 'Graphics Card', match: /gpu|graphic|video card/i },
  { key: 'cpu', label: 'Processor', match: /^cpu$|processor/i },
  { key: 'ram', label: 'Memory (RAM)', match: /\bram\b|memory/i },
  { key: 'storage', label: 'Storage', match: /storage|ssd|hdd|nvme/i },
  { key: 'motherboard', label: 'Motherboard', match: /motherboard/i },
] as const;

type GroupKey = (typeof COMPONENT_GROUPS)[number]['key'];

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'fps', label: 'Highest FPS' },
  { value: 'newest', label: 'Newest' },
] as const;

const PAGE_SIZE = 12;

// Page numbers to render: always first/last, a window around the current page,
// and null where a gap collapses into an ellipsis.
const pageWindow = (current: number, total: number): (number | null)[] => {
  const pages = new Set([1, total, current - 1, current, current + 1].filter((n) => n >= 1 && n <= total));
  const sorted = [...pages].sort((a, b) => a - b);
  const out: (number | null)[] = [];
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1] > 1) out.push(null);
    out.push(n);
  });
  return out;
};

const FPS_STEPS = [0, 60, 100, 144, 200];

const componentsInGroup = (pc: FeaturedGamingPc, key: GroupKey): string[] => {
  const group = COMPONENT_GROUPS.find((g) => g.key === key)!;
  return pc.products.filter((p) => p.category_name && group.match.test(p.category_name)).map((p) => p.name);
};

const FilterSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="border-b border-border pb-5">
    <h3 className="font-orbitron text-sm font-bold text-foreground mb-3">{title}</h3>
    {children}
  </div>
);

const CheckRow: React.FC<{ label: string; count: number; checked: boolean; onChange: () => void }> = ({
  label,
  count,
  checked,
  onChange,
}) => (
  <label className="flex cursor-pointer items-start gap-2 py-1 text-sm text-muted-foreground hover:text-foreground">
    <input type="checkbox" checked={checked} onChange={onChange} className="mt-1 accent-[hsl(var(--primary))]" />
    <span className="flex-1 leading-snug">{label}</span>
    <span className="text-xs opacity-60">{count}</span>
  </label>
);

const GamingPcsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [pcs, setPcs] = useState<FeaturedGamingPc[]>([]);
  // series_type_id -> series name, so builds can be filtered by series.
  const [seriesByType, setSeriesByType] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getPublicFeaturedGamingPcs({ all: true }), getPublicPcSeriesList()]).then(([pcRes, seriesRes]) => {
      if (cancelled) return;
      if (pcRes.success && pcRes.data) setPcs(pcRes.data);
      if (seriesRes.success && seriesRes.data) {
        const map: Record<string, string> = {};
        seriesRes.data.forEach((s) => s.types?.forEach((t) => (map[t.id] = s.name)));
        setSeriesByType(map);
      }
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // ---- Filter state lives in the URL so filtered views are shareable. ----
  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || 'featured';
  const minFps = Number(searchParams.get('min_fps') || 0);
  const selectedSeries = searchParams.getAll('series');
  const selectedColors = searchParams.getAll('color');
  const selectedComponents = (key: GroupKey) => searchParams.getAll(key);

  const seriesOf = (pc: FeaturedGamingPc) => (pc.series_type_id && seriesByType[pc.series_type_id]) || null;

  const priceBounds = useMemo(() => {
    if (pcs.length === 0) return { min: 0, max: 0 };
    const prices = pcs.map((p) => Number(p.price));
    return { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) };
  }, [pcs]);

  const priceMin = Math.max(Number(searchParams.get('price_min') ?? priceBounds.min), priceBounds.min);
  const priceMax = Math.min(Number(searchParams.get('price_max') ?? priceBounds.max), priceBounds.max);

  // Any filter/sort change goes back to page 1; goToPage is the only caller
  // that keeps (and sets) the page param.
  const update = (mutate: (p: URLSearchParams) => void, keepPage = false) => {
    const next = new URLSearchParams(searchParams);
    mutate(next);
    if (!keepPage) next.delete('page');
    setSearchParams(next, { replace: true });
  };

  const toggleMulti = (key: string, value: string) =>
    update((p) => {
      const current = p.getAll(key);
      p.delete(key);
      (current.includes(value) ? current.filter((v) => v !== value) : [...current, value]).forEach((v) =>
        p.append(key, v)
      );
    });

  const setSingle = (key: string, value: string | null) =>
    update((p) => {
      if (value) p.set(key, value);
      else p.delete(key);
    });

  const goToPage = (page: number) => {
    update((p) => {
      if (page > 1) p.set('page', String(page));
      else p.delete('page');
    }, true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearAll = () => setSearchParams({}, { replace: true });

  // ---- Option lists (with counts over the full, unfiltered set). ----
  const countBy = (values: (string | null)[]) => {
    const m = new Map<string, number>();
    values.forEach((v) => v && m.set(v, (m.get(v) || 0) + 1));
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }));
  };

  const seriesOptions = useMemo(() => countBy(pcs.map(seriesOf)), [pcs, seriesByType]);
  const colorOptions = useMemo(() => countBy(pcs.map((p) => p.color_name)), [pcs]);
  const componentOptions = useMemo(
    () =>
      COMPONENT_GROUPS.map((g) => ({
        ...g,
        options: countBy(pcs.map((pc) => [...new Set(componentsInGroup(pc, g.key))]).flat()),
      })).filter((g) => g.options.length > 0),
    [pcs]
  );

  // ---- Apply filters. ----
  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = pcs.filter((pc) => {
      const price = Number(pc.price);
      if (price < priceMin || price > priceMax) return false;
      if (q) {
        const haystack = [pc.name, pc.description, ...pc.key_features, ...pc.products.map((p) => p.name)]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (selectedSeries.length && !selectedSeries.includes(seriesOf(pc) || '')) return false;
      if (selectedColors.length && !selectedColors.includes(pc.color_name || '')) return false;
      if (minFps && (pc.fps_score ?? 0) < minFps) return false;
      return COMPONENT_GROUPS.every((g) => {
        const wanted = selectedComponents(g.key);
        if (!wanted.length) return true;
        const has = componentsInGroup(pc, g.key);
        return wanted.some((w) => has.includes(w));
      });
    });

    const sorted = [...filtered];
    if (sort === 'price-low') sorted.sort((a, b) => Number(a.price) - Number(b.price));
    else if (sort === 'price-high') sorted.sort((a, b) => Number(b.price) - Number(a.price));
    else if (sort === 'fps') sorted.sort((a, b) => (b.fps_score ?? 0) - (a.fps_score ?? 0));
    else if (sort === 'newest') sorted.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    else sorted.sort((a, b) => a.display_order - b.display_order);
    return sorted;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pcs, seriesByType, searchParams, priceMin, priceMax]);

  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, Number(searchParams.get('page')) || 1), totalPages);
  const pageResults = results.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const activeFilterCount =
    (search ? 1 : 0) +
    selectedSeries.length +
    selectedColors.length +
    (minFps ? 1 : 0) +
    (priceMin > priceBounds.min || priceMax < priceBounds.max ? 1 : 0) +
    COMPONENT_GROUPS.reduce((n, g) => n + selectedComponents(g.key).length, 0);

  const filters = (
    <div className="space-y-5">
      <FilterSection title="Search">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSingle('search', e.target.value || null)}
            placeholder="Name, GPU, CPU..."
            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none"
          />
        </div>
      </FilterSection>

      {priceBounds.max > priceBounds.min && (
        <FilterSection title="Price (AED)">
          <Slider
            min={priceBounds.min}
            max={priceBounds.max}
            step={50}
            value={[priceMin, priceMax]}
            onValueChange={([lo, hi]) =>
              update((p) => {
                if (lo > priceBounds.min) p.set('price_min', String(lo));
                else p.delete('price_min');
                if (hi < priceBounds.max) p.set('price_max', String(hi));
                else p.delete('price_max');
              })
            }
          />
          <div className="mt-3 flex justify-between text-xs text-muted-foreground">
            <span>{priceMin.toLocaleString()}</span>
            <span>{priceMax.toLocaleString()}</span>
          </div>
        </FilterSection>
      )}

      {seriesOptions.length > 0 && (
        <FilterSection title="Series">
          {seriesOptions.map(([name, count]) => (
            <CheckRow
              key={name}
              label={name}
              count={count}
              checked={selectedSeries.includes(name)}
              onChange={() => toggleMulti('series', name)}
            />
          ))}
        </FilterSection>
      )}

      {componentOptions.map((group) => (
        <FilterSection key={group.key} title={group.label}>
          <div className="max-h-48 overflow-y-auto pr-1">
            {group.options.map(([name, count]) => (
              <CheckRow
                key={name}
                label={name}
                count={count}
                checked={selectedComponents(group.key).includes(name)}
                onChange={() => toggleMulti(group.key, name)}
              />
            ))}
          </div>
        </FilterSection>
      ))}

      {pcs.some((p) => p.fps_score) && (
        <FilterSection title="Minimum FPS">
          <div className="flex flex-wrap gap-2">
            {FPS_STEPS.map((fps) => (
              <button
                key={fps}
                onClick={() => setSingle('min_fps', fps ? String(fps) : null)}
                className={cn(
                  'rounded-md border px-3 py-1 text-xs transition-colors',
                  minFps === fps
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/50'
                )}
              >
                {fps ? `${fps}+` : 'Any'}
              </button>
            ))}
          </div>
        </FilterSection>
      )}

      {colorOptions.length > 0 && (
        <FilterSection title="Color">
          {colorOptions.map(([name, count]) => (
            <CheckRow
              key={name}
              label={name}
              count={count}
              checked={selectedColors.includes(name)}
              onChange={() => toggleMulti('color', name)}
            />
          ))}
        </FilterSection>
      )}

      {activeFilterCount > 0 && (
        <button onClick={clearAll} className="flex items-center gap-1 text-sm text-primary hover:underline">
          <X className="h-4 w-4" /> Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-background">
      <Navbar />
      <CartDrawer />

      <main className="pt-12 pb-16">
        <div className="container mx-auto px-4">
          <GSAPScrollReveal animation="fadeUp">
            <div className="mb-8 text-center">
              <h1 className="font-orbitron text-4xl font-bold text-foreground md:text-5xl">
                Gaming <span className="text-primary">PCs</span>
              </h1>
              <p className="mt-3 text-muted-foreground">
                Ready-to-ship rigs — filter by price, series, GPU, CPU and more
              </p>
            </div>
          </GSAPScrollReveal>

          <div className="mb-6 flex items-center justify-between gap-3">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm lg:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters{activeFilterCount > 0 && ` (${activeFilterCount})`}
            </button>
            <p className="hidden text-sm text-muted-foreground lg:block">
              {results.length === 0
                ? '0 gaming PCs'
                : `Showing ${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, results.length)} of ${results.length} gaming PCs`}
            </p>
            <select
              value={sort}
              onChange={(e) => setSingle('sort', e.target.value === 'featured' ? null : e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-8 lg:flex-row">
            <aside className={cn('lg:block lg:w-72 lg:shrink-0', isFilterOpen ? 'block' : 'hidden')}>{filters}</aside>

            <div className="flex-1">
              {isLoading ? (
                <Loader label="Loading gaming PCs..." />
              ) : pcs.length === 0 ? (
                <ComingSoon />
              ) : results.length === 0 ? (
                <div className="rounded-2xl border border-border p-12 text-center">
                  <p className="mb-4 text-muted-foreground">No gaming PCs match these filters.</p>
                  <button onClick={clearAll} className="text-primary hover:underline">
                    Clear all filters
                  </button>
                </div>
              ) : (
                <>
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {pageResults.map((pc) => (
                    <Link
                      key={pc.id}
                      to={gamingPcUrl(pc)}
                      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:border-primary/50 hover:shadow-[0_0_30px_hsl(var(--primary)/0.15)]"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden bg-white">
                        {pc.images[0] && (
                          <img
                            src={pc.images[0]}
                            alt={pc.name}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        )}
                        {pc.fps_score ? (
                          <span className="absolute right-3 top-3 rounded bg-background/90 px-2 py-1 font-mono-tech text-xs text-primary">
                            {pc.fps_score} FPS
                          </span>
                        ) : null}
                      </div>
                      <div className="flex flex-1 flex-col p-5">
                        {seriesOf(pc) && (
                          <span className="mb-1 text-xs font-mono-tech text-primary">{seriesOf(pc)}</span>
                        )}
                        <h3 className="mb-2 font-orbitron text-lg font-bold text-foreground">{pc.name}</h3>
                        {pc.key_features.length > 0 && (
                          <ul className="mb-3 space-y-1">
                            {pc.key_features.slice(0, 4).map((f, i) => (
                              <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                                <Check className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                                <span className="truncate">{f}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                        <div className="mt-auto flex items-center justify-between pt-2">
                          <span className="font-orbitron text-xl font-bold text-primary">
                            AED {Number(pc.price).toLocaleString()}
                          </span>
                          {pc.color_swatch_hex && (
                            <span
                              title={pc.color_name || undefined}
                              className="h-4 w-4 rounded-full border border-border"
                              style={{ backgroundColor: pc.color_swatch_hex }}
                            />
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {totalPages > 1 && (
                  <nav aria-label="Pagination" className="mt-10 flex flex-wrap items-center justify-center gap-2">
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      aria-label="Previous page"
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary/50 disabled:pointer-events-none disabled:opacity-40"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    {pageWindow(currentPage, totalPages).map((n, i) =>
                      n === null ? (
                        <span key={`gap-${i}`} className="px-1 text-muted-foreground">
                          …
                        </span>
                      ) : (
                        <button
                          key={n}
                          onClick={() => goToPage(n)}
                          aria-current={n === currentPage ? 'page' : undefined}
                          className={cn(
                            'h-9 min-w-9 rounded-lg border px-3 text-sm transition-colors',
                            n === currentPage
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border text-muted-foreground hover:border-primary/50'
                          )}
                        >
                          {n}
                        </button>
                      )
                    )}
                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      aria-label="Next page"
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary/50 disabled:pointer-events-none disabled:opacity-40"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </nav>
                )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </motion.div>
  );
};

export default GamingPcsPage;
