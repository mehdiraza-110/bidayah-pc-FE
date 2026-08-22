import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Cpu, HardDrive, Keyboard, Laptop, Monitor, Mouse, Settings, Zap } from 'lucide-react';
import { getPublicCategories, getPublicProducts } from '@/services/api';
import { Product } from '@/data/products';
import { ProductCarousel } from '@/components/products/ProductCarousel';
import { CyberButton } from '@/components/ui/CyberButton';
import { GSAPScrollReveal } from '@/components/effects/GSAPScrollReveal';
import { mapApiProductToLocal } from '@/lib/mapProduct';
import { cn } from '@/lib/utils';

interface CategoryShowcaseSectionProps {
  title: string;
  /** Lowercase substrings matched against category_name to find the right category. */
  matchTerms: string[];
  limit?: number;
  /** Tints the section bg-muted so consecutive showcases don't blend together. */
  tinted?: boolean;
}

const getCategoryIcon = (matchTerms: string[]) => {
  const terms = matchTerms.join(' ');
  if (terms.includes('cpu') || terms.includes('processor')) return Cpu;
  if (terms.includes('gpu') || terms.includes('graphic')) return Monitor;
  if (terms.includes('monitor')) return Monitor;
  if (terms.includes('laptop')) return Laptop;
  if (terms.includes('keyboard')) return Keyboard;
  if (terms.includes('mouse')) return Mouse;
  if (terms.includes('ram') || terms.includes('memory')) return Zap;
  if (terms.includes('storage') || terms.includes('ssd')) return HardDrive;
  return Settings;
};

const PAGE_SIZE_FALLBACK = 6;

const CategoryShowcaseSection: React.FC<CategoryShowcaseSectionProps> = ({ title, matchTerms, limit = PAGE_SIZE_FALLBACK, tinted = false }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryId, setCategoryId] = useState<string | null>(null);
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
        const categoriesResponse = await getPublicCategories();
        const match = categoriesResponse.success && categoriesResponse.data
          ? categoriesResponse.data.find((category) => {
              const name = category.category_name.toLowerCase();
              return matchTerms.some((term) => name.includes(term));
            })
          : undefined;

        if (!match) {
          if (!cancelled) setIsLoading(false);
          return;
        }

        if (!cancelled) setCategoryId(match.id);

        const productsResponse = await getPublicProducts({
          category_id: match.id,
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
  }, []);

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

  const Icon = getCategoryIcon(matchTerms);

  const categoryTile = categoryId && (
    <Link
      to={`/products?category_id=${categoryId}`}
      className="group flex h-full w-[130px] sm:w-[180px] flex-col items-center justify-center gap-2 sm:gap-3 rounded-xl border border-border bg-card px-3 py-4 sm:px-4 sm:py-6 text-center transition-colors duration-300 hover:border-primary"
    >
      <div className="flex h-10 w-10 sm:h-14 sm:w-14 items-center justify-center rounded-full border border-border bg-background transition-colors duration-300 group-hover:border-primary">
        <Icon className="h-5 w-5 sm:h-7 sm:w-7 text-primary" />
      </div>
      <span className="font-orbitron text-xs sm:text-sm font-bold text-foreground">{title}</span>
      <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-primary">
        Shop All
        <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
      </span>
    </Link>
  );

  return (
    <section className={cn('py-10 sm:py-16 md:py-20', tinted && 'bg-muted')}>
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
              <div key={i} className="aspect-[3/4] w-[150px] sm:w-[300px] flex-shrink-0 animate-pulse rounded-xl bg-card" />
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
