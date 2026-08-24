import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { ArrowRight, Cpu, HardDrive, Keyboard, Laptop, Monitor, Mouse, Settings, Zap, CircuitBoard } from 'lucide-react';
import { getPublicProducts } from '@/services/api';
import { Product } from '@/data/products';
import { ProductCarousel } from '@/components/products/ProductCarousel';
import { CyberButton } from '@/components/ui/CyberButton';
import { GSAPScrollReveal } from '@/components/effects/GSAPScrollReveal';
import { mapApiProductToLocal } from '@/lib/mapProduct';
import { cn } from '@/lib/utils';

interface CategoryShowcaseSectionProps {
  title: string;
  /** Real category id — resolved server-side now (admin picks the category directly). */
  categoryId: string;
  /** Lowercase category name, used only to pick a matching icon. */
  categoryName: string;
  limit?: number;
  /** Admin-set background colors, one per theme; undefined/null means "use the page default". */
  bgColorLight?: string | null;
  bgColorDark?: string | null;
  /** Optional admin-uploaded photo for the pinned tile; null/undefined falls back to the icon tile. */
  image?: string | null;
}

const getCategoryIcon = (categoryName: string) => {
  const name = categoryName.toLowerCase();
  if (name.includes('cpu') || name.includes('processor')) return Cpu;
  if (name.includes('gpu') || name.includes('graphic')) return Monitor;
  if (name.includes('monitor')) return Monitor;
  if (name.includes('laptop')) return Laptop;
  if (name.includes('keyboard')) return Keyboard;
  if (name.includes('mouse')) return Mouse;
  if (name.includes('ram') || name.includes('memory')) return Zap;
  if (name.includes('motherboard') || name.includes('mobo')) return CircuitBoard;
  if (name.includes('storage') || name.includes('ssd')) return HardDrive;
  return Settings;
};

const PAGE_SIZE_FALLBACK = 6;

const CategoryShowcaseSection: React.FC<CategoryShowcaseSectionProps> = ({
  title,
  categoryId,
  categoryName,
  limit = PAGE_SIZE_FALLBACK,
  bgColorLight,
  bgColorDark,
  image,
}) => {
  const { resolvedTheme } = useTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const loadingMoreRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      try {
        const productsResponse = await getPublicProducts({
          category_id: categoryId,
          in_stock: true,
          page: 1,
          limit,
        });

        if (!cancelled && productsResponse.success && productsResponse.data) {
          setProducts(productsResponse.data.map(mapApiProductToLocal));
          setHasMore(!!productsResponse.pagination && productsResponse.pagination.page < productsResponse.pagination.totalPages);
        }
      } catch (error) {
        console.error(`Error loading "${title}" showcase:`, error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || !hasMore || !categoryId) return;
    loadingMoreRef.current = true;
    setIsLoadingMore(true);

    try {
      const nextPage = page + 1;
      const response = await getPublicProducts({
        category_id: categoryId,
        in_stock: true,
        page: nextPage,
        limit,
      });

      if (response.success && response.data) {
        setProducts((prev) => [...prev, ...response.data!.map(mapApiProductToLocal)]);
        setPage(nextPage);
        setHasMore(!!response.pagination && response.pagination.page < response.pagination.totalPages);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error(`Error loading more "${title}" products:`, error);
    } finally {
      loadingMoreRef.current = false;
      setIsLoadingMore(false);
    }
  }, [categoryId, hasMore, limit, page, title]);

  // Nothing to show — don't render an empty section.
  if (!isLoading && products.length === 0) {
    return null;
  }

  const Icon = getCategoryIcon(categoryName);
  // resolvedTheme is undefined for a brief instant on first mount (next-themes
  // hasn't read the stored preference yet) — fall back to the dark color, since
  // dark is this site's default theme (see ThemeProvider defaultTheme="dark").
  const sectionBgColor = resolvedTheme === 'light' ? bgColorLight : (bgColorDark ?? bgColorLight);

  const categoryTile = categoryId && (
    <Link
      to={`/products?category_id=${categoryId}`}
      className={cn(
        'group relative flex h-full w-[110px] sm:w-[150px] flex-col items-center gap-2 sm:gap-3 overflow-hidden rounded-xl border border-border bg-card px-3 py-4 sm:px-4 sm:py-5 text-center transition-colors duration-300 hover:border-primary',
        image ? 'justify-end' : 'justify-center'
      )}
    >
      {image ? (
        <>
          {/* object-cover: the photo just needs to be portrait-ish and high-res
              enough to fill this box — see IMAGE_GUIDANCE in the admin page for
              the recommended upload size. */}
          <img
            src={image}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {/* Gradient keeps the title/CTA legible over any photo without a separate scrim toggle. */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/5" />
        </>
      ) : (
        <div className="relative flex h-10 w-10 sm:h-14 sm:w-14 items-center justify-center rounded-full border border-border bg-background transition-colors duration-300 group-hover:border-primary">
          <Icon className="h-5 w-5 sm:h-7 sm:w-7 text-primary" />
        </div>
      )}
      <span className={cn('relative z-10 font-orbitron text-xs sm:text-sm font-bold', image ? 'text-white' : 'text-foreground')}>
        {title}
      </span>
      <span className={cn('relative z-10 inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold', image ? 'text-white' : 'text-primary')}>
        Shop All
        <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
      </span>
    </Link>
  );

  return (
    <section
      className="py-6 sm:py-8 md:py-10"
      style={sectionBgColor ? { backgroundColor: sectionBgColor } : undefined}
    >
      <div className="container mx-auto px-4">
        <GSAPScrollReveal animation="fadeUp">
          <div className="flex items-center justify-between gap-3 mb-4 sm:mb-8">
            <h2 className="font-orbitron text-xl sm:text-3xl md:text-4xl font-bold text-foreground">
              {title}
            </h2>
            {categoryId && (
              <Link to={`/products?category_id=${categoryId}`} className="shrink-0">
                <CyberButton variant="outline" size="sm" className="inline-flex items-center gap-1.5 sm:gap-2 whitespace-nowrap px-3 py-2 text-xs sm:px-4 sm:text-sm">
                  More Products
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </CyberButton>
              </Link>
            )}
          </div>
        </GSAPScrollReveal>

        {isLoading ? (
          <div className="flex gap-3 sm:gap-6 overflow-hidden">
            {Array.from({ length: limit }).map((_, i) => (
              <div key={i} className="aspect-[3/4] w-[120px] sm:w-[190px] flex-shrink-0 animate-pulse rounded-xl bg-card" />
            ))}
          </div>
        ) : (
          <ProductCarousel
            products={products}
            leadingContent={categoryTile}
            onNearEnd={loadMore}
            isLoadingMore={isLoadingMore}
          />
        )}
      </div>
    </section>
  );
};

export default CategoryShowcaseSection;
