export const slugify = (text: string): string =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

// A raw UUID (v1-v5, case-insensitive) — used to tell an old-style
// `/product/<id>/...` link apart from the newer `/product/<category>/<slug>`
// one when both shapes hit the same route.
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isUuid = (value: string): boolean => UUID_PATTERN.test(value);

/**
 * Canonical, SEO-friendly product URL: `/product/<category>/<product-slug>` — no id in
 * sight. `slug` is the server-generated, unique lookup key (falls back to a client-side
 * slugified name for a product the backend hasn't attached one to yet); the category
 * segment is decorative only, never used for lookup, so it's fine if it drifts.
 */
export const productUrl = (product: { id: string; name: string; slug?: string; category?: string }): string => {
  const productSlug = product.slug || slugify(product.name);
  const categorySlug = slugify(product.category || '');

  if (!productSlug) {
    // No name/slug to build a clean path from — fall back to the old id-based link.
    return `/product/${product.id}`;
  }

  return `/product/${categorySlug || 'product'}/${productSlug}`;
};
