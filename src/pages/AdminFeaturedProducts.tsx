import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import {
  Star,
  StarOff,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import AdminLayout from '@/components/layout/AdminLayout';
import { NeonCard } from '@/components/ui/NeonCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Product } from '@/data/products';
import { 
  getProducts,
  updateProduct,
  getCategories,
  getVendors,
  type Category,
  type Vendor,
  type Product as ApiProduct
} from '@/services/api';
import { cn } from '@/lib/utils';

const AdminFeaturedProductsPage: React.FC = () => {
  const [productList, setProductList] = useState<Product[]>([]);
  const [categoryList, setCategoryList] = useState<Category[]>([]);
  const [vendorList, setVendorList] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterVendor, setFilterVendor] = useState<string>('');
  const [filterFeatured, setFilterFeatured] = useState<string>('');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Helper function to convert API Product to local Product format
  const mapApiProductToLocal = (apiProduct: ApiProduct): Product => {
    return {
      id: apiProduct.id,
      name: apiProduct.name,
      category: apiProduct.category_name || apiProduct.category_id || '',
      price: Number(apiProduct.price),
      originalPrice: apiProduct.original_price ? Number(apiProduct.original_price) : undefined,
      image: apiProduct.image,
      description: apiProduct.description,
      specs: apiProduct.specs?.map(s => s.spec_text) || [],
      rating: apiProduct.rating || 0,
      reviews: apiProduct.reviews_count || 0,
      stock: apiProduct.stock,
      in_stock: apiProduct.in_stock,
      vendor_id: apiProduct.vendor_id,
      status: apiProduct.status || 'published',
      featured: apiProduct.featured,
      new: apiProduct.new_product,
      media: apiProduct.media?.map(m => ({ url: m.url, type: m.type })) || [],
    };
  };

  useEffect(() => {
    if (containerRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(containerRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }
        );
      });

      return () => ctx.revert();
    }
  }, []);

  // Load products, categories and vendors from API
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      // Load categories
      const categoriesResponse = await getCategories();
      if (categoriesResponse.success && categoriesResponse.data) {
        setCategoryList(categoriesResponse.data);
      }

      // Load vendors
      const vendorsResponse = await getVendors();
      if (vendorsResponse.success && vendorsResponse.data) {
        setVendorList(vendorsResponse.data);
      }

      // Load all products
      const productsResponse = await getProducts();
      if (productsResponse.success && productsResponse.data) {
        const mappedProducts = productsResponse.data.map(mapApiProductToLocal);
        setProductList(mappedProducts);
      } else {
        toast.error(productsResponse.message || 'Failed to load products');
      }

      setIsLoading(false);
    };

    loadData();
  }, []);

  const handleToggleFeatured = async (productId: string, currentFeatured: boolean) => {
    const response = await updateProduct(productId, { featured: !currentFeatured });
    if (response.success && response.data) {
      const updatedProduct = mapApiProductToLocal(response.data);
      setProductList(prev =>
        prev.map(p => (p.id === productId ? updatedProduct : p))
      );
      toast.success(
        updatedProduct.featured 
          ? 'Product featured successfully' 
          : 'Product unfeatured successfully'
      );
    } else {
      toast.error(response.message || 'Failed to update product');
    }
  };

  // Filter and search products
  const filteredProducts = productList.filter(product => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        (product.description?.toLowerCase().includes(query));
      if (!matchesSearch) return false;
    }

    // Category filter
    if (filterCategory && product.category !== filterCategory) return false;

    // Status filter
    if (filterStatus) {
      if (filterStatus === 'published' && product.status !== 'published') return false;
      if (filterStatus === 'draft' && product.status !== 'draft') return false;
    }

    // Vendor filter
    if (filterVendor && product.vendor_id !== filterVendor) return false;

    // Featured filter
    if (filterFeatured) {
      if (filterFeatured === 'featured' && !product.featured) return false;
      if (filterFeatured === 'unfeatured' && product.featured) return false;
    }

    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterCategory, filterStatus, filterVendor, filterFeatured]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setFilterCategory('');
    setFilterStatus('');
    setFilterVendor('');
    setFilterFeatured('');
    setCurrentPage(1);
  };

  return (
    <AdminLayout>
      <div className="p-6" ref={containerRef}>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-orbitron text-3xl font-bold mb-2">
                FEATURED <span className="text-primary">PRODUCTS</span>
              </h1>
              <p className="text-muted-foreground">
                Manage which products appear on the homepage
              </p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <NeonCard className="p-6 mb-6" glowColor="cyan" hover={false}>
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search products by name, category, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <Label className="text-xs mb-2 block">Category</Label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">All Categories</option>
                  {categoryList.map(cat => (
                    <option key={cat.id} value={cat.category_name}>{cat.category_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-xs mb-2 block">Status</Label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">All Status</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </div>

              <div>
                <Label className="text-xs mb-2 block">Vendor</Label>
                <select
                  value={filterVendor}
                  onChange={(e) => setFilterVendor(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">All Vendors</option>
                  {vendorList.map(vendor => (
                    <option key={vendor.id} value={vendor.id}>{vendor.vendor_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-xs mb-2 block">Featured</Label>
                <select
                  value={filterFeatured}
                  onChange={(e) => setFilterFeatured(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">All</option>
                  <option value="featured">Featured</option>
                  <option value="unfeatured">Not Featured</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleClearFilters}
                  className="w-full px-4 py-2 text-sm bg-muted hover:bg-muted/80 rounded-md transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        </NeonCard>

        {/* Products List */}
        {isLoading ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">Loading products...</p>
          </div>
        ) : paginatedProducts.length === 0 ? (
          <NeonCard className="p-12 text-center" glowColor="cyan" hover={false}>
            <p className="text-muted-foreground text-lg">No products found</p>
          </NeonCard>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {paginatedProducts.map((product) => (
                <NeonCard
                  key={product.id}
                  className="p-6"
                  glowColor={product.featured ? 'cyan' : 'purple'}
                  hover={false}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-orbitron text-lg font-bold mb-2">
                        {product.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {product.category}
                      </p>
                      <p className="text-xl font-bold text-primary">
                        AED {product.price.toLocaleString()}
                      </p>
                    </div>
                    {product.image && (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-20 h-20 object-cover rounded-lg ml-4"
                      />
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex items-center gap-2">
                      {product.featured ? (
                        <span className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                          <Star className="w-3 h-3 fill-current" />
                          Featured
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not Featured</span>
                      )}
                      <span className={cn(
                        "text-xs px-2 py-1 rounded",
                        product.status === 'published'
                          ? "bg-green-500/10 text-green-500"
                          : "bg-yellow-500/10 text-yellow-500"
                      )}>
                        {product.status}
                      </span>
                    </div>
                    <motion.button
                      onClick={() => handleToggleFeatured(product.id, product.featured || false)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg transition-all",
                        product.featured
                          ? "bg-muted hover:bg-muted/80 text-foreground"
                          : "bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30"
                      )}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {product.featured ? (
                        <>
                          <StarOff className="w-4 h-4" />
                          Unfeature
                        </>
                      ) : (
                        <>
                          <Star className="w-4 h-4" />
                          Feature
                        </>
                      )}
                    </motion.button>
                  </div>
                </NeonCard>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredProducts.length)} of {filteredProducts.length} products
                </p>
                <div className="flex items-center gap-2">
                  <motion.button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={cn(
                      "p-2 rounded-lg border transition-all",
                      currentPage === 1
                        ? "border-border text-muted-foreground cursor-not-allowed"
                        : "border-border hover:border-primary hover:text-primary"
                    )}
                    whileHover={currentPage !== 1 ? { scale: 1.05 } : {}}
                    whileTap={currentPage !== 1 ? { scale: 0.95 } : {}}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </motion.button>
                  <span className="text-sm font-mono-tech px-4">
                    Page {currentPage} of {totalPages}
                  </span>
                  <motion.button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className={cn(
                      "p-2 rounded-lg border transition-all",
                      currentPage === totalPages
                        ? "border-border text-muted-foreground cursor-not-allowed"
                        : "border-border hover:border-primary hover:text-primary"
                    )}
                    whileHover={currentPage !== totalPages ? { scale: 1.05 } : {}}
                    whileTap={currentPage !== totalPages ? { scale: 0.95 } : {}}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminFeaturedProductsPage;
