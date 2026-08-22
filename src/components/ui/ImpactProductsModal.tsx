import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CyberButton } from '@/components/ui/CyberButton';
import { Loader } from '@/components/ui/Loader';
import type { ApiResponse, UnpublishImpactProduct } from '@/services/api';

const PAGE_SIZE = 7;

interface ImpactProductsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Re-fetched every time `open` becomes true or the page changes. */
  fetchPage: (opts: { limit: number; offset: number }) => Promise<ApiResponse<UnpublishImpactProduct[]>>;
}

export const ImpactProductsModal: React.FC<ImpactProductsModalProps> = ({ open, onOpenChange, title, fetchPage }) => {
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState<UnpublishImpactProduct[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Start back at page 1 every time the modal is opened for a (possibly new) target.
  useEffect(() => {
    if (open) {
      setPage(1);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      const response = await fetchPage({ limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE });
      if (cancelled) return;
      if (response.success && response.data) {
        setProducts(response.data);
        setHasMore(!!response.has_more);
      } else {
        setProducts([]);
        setHasMore(false);
      }
      setIsLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, page]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8">
            <Loader size="sm" label="Loading products..." />
          </div>
        ) : products.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">No products to show.</div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-orbitron text-muted-foreground">
                  <th className="px-3 py-2">Product</th>
                  <th className="px-3 py-2 whitespace-nowrap">Category</th>
                  <th className="px-3 py-2 whitespace-nowrap">Vendor</th>
                  <th className="px-3 py-2 text-right whitespace-nowrap">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className="px-3 py-2 max-w-[220px] truncate">{product.name}</td>
                    <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{product.category_name || '—'}</td>
                    <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{product.vendor_name || '—'}</td>
                    <td className="px-3 py-2 text-right font-orbitron text-primary whitespace-nowrap">
                      AED {Number(product.price).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-muted-foreground">Page {page}</span>
          <div className="flex items-center gap-2">
            <CyberButton
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || isLoading}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </CyberButton>
            <CyberButton
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasMore || isLoading}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </CyberButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
