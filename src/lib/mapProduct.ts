import { Product } from '@/data/products';
import { type Product as ApiProduct } from '@/services/api';

// The API nests vendor info as `vendors: [{ id, vendor_name }]` (a product can technically have
// more than one vendor link, though in practice today it's always exactly one). It does NOT send
// flat `vendor_id`/`vendor_name` fields on the product object — those only exist as legacy/back-
// compat fields on the type. Every consumer should resolve through this helper (or the `vendors`
// array directly) rather than reading `product.vendor_id`/`product.vendor_name` off the API
// response, which will always be undefined.
export const resolveApiProductVendor = (
  apiProduct: Pick<ApiProduct, 'vendor_id' | 'vendor_name' | 'vendors'>
): { id?: string; name?: string } => {
  const firstVendor = apiProduct.vendors?.[0];
  return {
    id: firstVendor?.id ?? apiProduct.vendor_id,
    name: firstVendor?.vendor_name ?? apiProduct.vendor_name,
  };
};

export const mapApiProductToLocal = (
  apiProduct: ApiProduct,
  overrides?: Partial<Product>
): Product => {
  const vendor = resolveApiProductVendor(apiProduct);
  return {
    id: apiProduct.id,
    name: apiProduct.name,
    slug: apiProduct.slug,
    category: apiProduct.category_name || apiProduct.category_id || '',
    price: Number(apiProduct.price),
    originalPrice: apiProduct.original_price ? Number(apiProduct.original_price) : undefined,
    image: apiProduct.image,
    description: apiProduct.description,
    specs: apiProduct.specs?.map((s) => s.spec_text) || [],
    keyFeatures: apiProduct.key_features?.map((f) => ({ key: f.feature_key, value: f.feature_value })) || [],
    rating: apiProduct.rating || 0,
    reviews: apiProduct.reviews_count || 0,
    stock: apiProduct.stock,
    in_stock: apiProduct.in_stock,
    vendor_id: vendor.id,
    vendorName: vendor.name,
    status: apiProduct.status || 'published',
    featured: apiProduct.featured,
    new: apiProduct.new_product,
    media: apiProduct.media?.map((m) => ({ url: m.url, type: m.type })) || [],
    ...overrides,
  };
};
