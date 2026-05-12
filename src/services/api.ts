// API Service for making HTTP requests
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface User {
  id: number;
  first_name?: string;
  last_name?: string;
  email: string;
  phone: string;
  profile_image?: string;
  is_verified: boolean;
  is_admin_user: boolean;
  created_at?: string;
  updated_at?: string;
  roles: Array<{ id: number; name: string }>;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface SignupRequest {
  first_name?: string;
  last_name?: string;
  email: string;
  phone: string;
  password: string;
  profile_image?: string;
  is_verified?: boolean;
  is_admin_user?: boolean;
}

export interface SignupResponse extends User {
  created_at: string;
  updated_at: string;
}

export interface UpdateProfileRequest {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
}

// Vendor interfaces
export interface Vendor {
  id: string;
  vendor_name: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateVendorRequest {
  vendor_name: string;
}

export interface UpdateVendorRequest {
  vendor_name: string;
}

// Category interfaces
export interface Category {
  id: string;
  category_name: string;
  image?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateCategoryRequest {
  category_name: string;
  image?: File | string;
}

export interface UpdateCategoryRequest {
  category_name?: string;
  image?: File | string;
}

// Billing Information interfaces
export interface BillingInfo {
  id?: string;
  bank_account_name: string;
  bank_account_number: string;
  bank_name: string;
  bank_branch?: string;
  bank_address?: string;
  account_type: 'checking' | 'savings' | 'current' | 'business';
  currency: 'AED' | 'USD' | 'EUR' | 'GBP' | 'SAR' | 'INR';
  beneficiary_name: string;
  contact_email: string;
  contact_phone?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateBillingInfoRequest {
  bank_account_name: string;
  bank_account_number: string;
  bank_name: string;
  bank_branch?: string;
  bank_address?: string;
  account_type: 'checking' | 'savings' | 'current' | 'business';
  currency: 'AED' | 'USD' | 'EUR' | 'GBP' | 'SAR' | 'INR';
  beneficiary_name: string;
  contact_email: string;
  contact_phone?: string;
  notes?: string;
}

// Product Media interfaces
export interface ProductMedia {
  id?: string;
  url: string;
  type: 'image' | 'video';
  display_order?: number;
}

export interface ProductSpec {
  id?: string;
  spec_text: string;
  display_order?: number;
}

export interface KeyFeature {
  id: string;
  category_id: string;
  category_name?: string;
  feature_key: string;
  display_order?: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProductKeyFeature {
  id?: string;
  key_feature_id?: string;
  feature_key: string;
  feature_value: string;
  display_order?: number;
}

export interface ProductKeyFeatureInput {
  key_feature_id?: string;
  feature_key?: string;
  value: string;
}

export interface CreateKeyFeatureRequest {
  category_id: string;
  feature_key: string;
  display_order?: number;
  is_active?: boolean;
}

export interface UpdateKeyFeatureRequest {
  feature_key?: string;
  display_order?: number;
  is_active?: boolean;
}

export interface KeyFeatureFilters {
  category_id?: string;
  is_active?: boolean;
}

// Product interfaces
export interface Product {
  id: string;
  name: string;
  category_id?: string;
  category_name?: string; // Populated from join
  price: number;
  original_price?: number;
  image: string; // Main image URL
  description?: string;
  stock: number;
  in_stock: boolean;
  vendor_id?: string;
  vendor_name?: string; // Populated from join
  status: 'published' | 'draft';
  featured?: boolean;
  new_product?: boolean; // API uses new_product instead of new
  rating?: number;
  reviews_count?: number;
  media?: ProductMedia[];
  specs?: ProductSpec[];
  key_features?: ProductKeyFeature[];
  created_at?: string;
  updated_at?: string;
}

export interface CreateProductRequest {
  name: string;
  price: number;
  main_image: File | string;
  category_id?: string;
  original_price?: number;
  description?: string;
  stock?: number;
  vendor_id?: string;
  status?: 'published' | 'draft';
  featured?: boolean;
  new_product?: boolean;
  rating?: number;
  reviews_count?: number;
  media?: File[]; // Up to 5 files
  specs?: string | string[]; // Comma-separated string or array
  key_features?: ProductKeyFeatureInput[];
}

export interface UpdateProductRequest {
  name?: string;
  category_id?: string;
  price?: number;
  original_price?: number;
  description?: string;
  stock?: number;
  vendor_id?: string;
  status?: 'published' | 'draft';
  featured?: boolean;
  new_product?: boolean;
  rating?: number;
  reviews_count?: number;
  main_image?: File | string; // New main image
  media?: File[]; // Up to 5 files (replaces all existing)
  specs?: string | string[]; // Comma-separated string or array (replaces all existing)
  key_features?: ProductKeyFeatureInput[];
}

// PC Builder Filter Rule interfaces
export type SpecMatchMode = 'any' | 'all';

export interface PCBuilderFilterRule {
  id: string;
  rule_name: string;
  selected_category_id: string;
  selected_vendor_id?: string | null;
  result_category_id: string;
  result_vendor_id?: string | null;
  spec_match_terms?: string[];
  spec_match_mode: SpecMatchMode;
  priority: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreatePCBuilderFilterRuleRequest {
  rule_name: string;
  selected_category_id: string;
  selected_vendor_id?: string | null;
  result_category_id: string;
  result_vendor_id?: string | null;
  spec_match_terms?: string[];
  spec_match_mode?: SpecMatchMode;
  priority?: number;
  is_active?: boolean;
}

export type UpdatePCBuilderFilterRuleRequest = Partial<CreatePCBuilderFilterRuleRequest>;

export interface PCBuilderFilterRuleFilters {
  selected_category_id?: string;
  selected_vendor_id?: string;
  result_category_id?: string;
  result_vendor_id?: string;
  is_active?: boolean;
}

export interface PreviewPCBuilderFilterRuleFilters {
  selected_category_id?: string;
  selected_vendor_id?: string;
  result_category_id?: string;
  status?: 'published' | 'draft';
  in_stock?: boolean;
}

export interface PCBuilderOptions {
  categories: Category[];
  vendors: Vendor[];
}

export interface PublicPCBuilderProductFilters {
  selected_category_id?: string;
  category_id?: string;
  selected_vendor_id?: string;
  vendor_id?: string;
  result_category_id?: string;
  in_stock?: boolean;
}

// Get JWT token from localStorage
export const getToken = (): string | null => {
  return localStorage.getItem('jwt_token');
};

// Set JWT token in localStorage
export const setToken = (token: string): void => {
  localStorage.setItem('jwt_token', token);
};

// Remove JWT token from localStorage
export const removeToken = (): void => {
  localStorage.removeItem('jwt_token');
};

// Make API request with error handling
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  skipJsonContentType: boolean = false
): Promise<ApiResponse<T>> {
  const token = getToken();
  
  const headers: HeadersInit = {
    ...options.headers,
  };

  // Only set Content-Type to JSON if not multipart/form-data
  if (!skipJsonContentType && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include', // Include cookies in the request (if backend sets them)
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'An error occurred',
        error: data.error || data.message,
      };
    }

    return {
      success: true,
      message: data.message || 'Success',
      data: data.data,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Network error. Please check your connection.',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Login API
export const login = async (credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
  const response = await apiRequest<LoginResponse>('/users/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

  if (response.success && response.data?.token) {
    setToken(response.data.token);
  }

  return response;
};

// Signup API
export const signup = async (userData: SignupRequest): Promise<ApiResponse<SignupResponse>> => {
  return apiRequest<SignupResponse>('/users', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
};

// Logout (just removes token from localStorage)
export const logout = (): void => {
  removeToken();
};

// Update User Profile (Authenticated)
export const updateProfile = async (
  profileData: UpdateProfileRequest
): Promise<ApiResponse<User>> => {
  return apiRequest<User>('/users/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData),
  });
};

// Update User Avatar (Authenticated)
export const updateAvatar = async (avatarFile: File): Promise<ApiResponse<User>> => {
  const formData = new FormData();
  formData.append('avatar', avatarFile);

  return apiRequest<User>(
    '/users/avatar',
    {
      method: 'PUT',
      body: formData,
    },
    true // Skip JSON Content-Type for multipart/form-data
  );
};

// Vendor APIs

// Get all vendors
export const getVendors = async (): Promise<ApiResponse<Vendor[]>> => {
  return apiRequest<Vendor[]>('/vendors', {
    method: 'GET',
  });
};

// Get vendor by ID
export const getVendorById = async (id: string): Promise<ApiResponse<Vendor>> => {
  return apiRequest<Vendor>(`/vendors/${id}`, {
    method: 'GET',
  });
};

// Create vendor
export const createVendor = async (vendorData: CreateVendorRequest): Promise<ApiResponse<Vendor>> => {
  return apiRequest<Vendor>('/vendors', {
    method: 'POST',
    body: JSON.stringify(vendorData),
  });
};

// Update vendor
export const updateVendor = async (id: string, vendorData: UpdateVendorRequest): Promise<ApiResponse<Vendor>> => {
  return apiRequest<Vendor>(`/vendors/${id}`, {
    method: 'PUT',
    body: JSON.stringify(vendorData),
  });
};

// Delete vendor
export const deleteVendor = async (id: string): Promise<ApiResponse<Vendor>> => {
  return apiRequest<Vendor>(`/vendors/${id}`, {
    method: 'DELETE',
  });
};

// Category APIs

// Get all categories
export const getCategories = async (): Promise<ApiResponse<Category[]>> => {
  return apiRequest<Category[]>('/categories', {
    method: 'GET',
  });
};

// Get category by ID
export const getCategoryById = async (id: string): Promise<ApiResponse<Category>> => {
  return apiRequest<Category>(`/categories/${id}`, {
    method: 'GET',
  });
};

// Create category
export const createCategory = async (categoryData: CreateCategoryRequest): Promise<ApiResponse<Category>> => {
  // Check if image is a File (for upload) or string/undefined (for URL or no image)
  if (categoryData.image instanceof File) {
    const formData = new FormData();
    formData.append('category_name', categoryData.category_name);
    formData.append('image', categoryData.image);

    return apiRequest<Category>(
      '/categories',
      {
        method: 'POST',
        body: formData,
      },
      true // Skip JSON Content-Type for multipart/form-data
    );
  } else {
    // No image or image is a URL - send as JSON
    const body: { category_name: string; image?: string } = {
      category_name: categoryData.category_name,
    };
    if (categoryData.image && typeof categoryData.image === 'string') {
      body.image = categoryData.image;
    }

    return apiRequest<Category>('/categories', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }
};

// Update category
export const updateCategory = async (id: string, categoryData: UpdateCategoryRequest): Promise<ApiResponse<Category>> => {
  // Check if image is a File (for upload)
  if (categoryData.image instanceof File) {
    const formData = new FormData();
    if (categoryData.category_name) {
      formData.append('category_name', categoryData.category_name);
    }
    formData.append('image', categoryData.image);

    return apiRequest<Category>(
      `/categories/${id}`,
      {
        method: 'PUT',
        body: formData,
      },
      true // Skip JSON Content-Type for multipart/form-data
    );
  } else {
    // No image file - send as JSON
    const body: { category_name?: string; image?: string } = {};
    if (categoryData.category_name) {
      body.category_name = categoryData.category_name;
    }
    if (categoryData.image && typeof categoryData.image === 'string') {
      body.image = categoryData.image;
    }

    return apiRequest<Category>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }
};

// Delete category
export const deleteCategory = async (id: string): Promise<ApiResponse<Category>> => {
  return apiRequest<Category>(`/categories/${id}`, {
    method: 'DELETE',
  });
};

// Key Feature APIs
const buildKeyFeatureQuery = (filters?: KeyFeatureFilters): string => {
  const params = new URLSearchParams();
  if (filters?.category_id) params.append('category_id', filters.category_id);
  if (filters?.is_active !== undefined) params.append('is_active', String(filters.is_active));

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
};

export const getKeyFeatures = async (filters?: KeyFeatureFilters): Promise<ApiResponse<KeyFeature[]>> => {
  return apiRequest<KeyFeature[]>(`/key-features${buildKeyFeatureQuery(filters)}`, {
    method: 'GET',
  });
};

export const getKeyFeatureById = async (id: string): Promise<ApiResponse<KeyFeature>> => {
  return apiRequest<KeyFeature>(`/key-features/${id}`, {
    method: 'GET',
  });
};

export const createKeyFeature = async (featureData: CreateKeyFeatureRequest): Promise<ApiResponse<KeyFeature>> => {
  return apiRequest<KeyFeature>('/key-features', {
    method: 'POST',
    body: JSON.stringify(featureData),
  });
};

export const updateKeyFeature = async (
  id: string,
  featureData: UpdateKeyFeatureRequest
): Promise<ApiResponse<KeyFeature>> => {
  return apiRequest<KeyFeature>(`/key-features/${id}`, {
    method: 'PUT',
    body: JSON.stringify(featureData),
  });
};

export const deleteKeyFeature = async (id: string): Promise<ApiResponse<KeyFeature>> => {
  return apiRequest<KeyFeature>(`/key-features/${id}`, {
    method: 'DELETE',
  });
};

// Product APIs

// Get all products
export const getProducts = async (filters?: {
  status?: 'published' | 'draft';
  category_id?: string;
  vendor_id?: string;
  featured?: boolean;
  in_stock?: boolean;
  search?: string;
}): Promise<ApiResponse<Product[]>> => {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.category_id) params.append('category_id', filters.category_id);
  if (filters?.vendor_id) params.append('vendor_id', filters.vendor_id);
  if (filters?.featured !== undefined) params.append('featured', String(filters.featured));
  if (filters?.in_stock !== undefined) params.append('in_stock', String(filters.in_stock));
  if (filters?.search) params.append('search', filters.search);

  const queryString = params.toString();
  const endpoint = queryString ? `/products?${queryString}` : '/products';

  return apiRequest<Product[]>(endpoint, {
    method: 'GET',
  });
};

// Get product by ID
export const getProductById = async (id: string): Promise<ApiResponse<Product>> => {
  return apiRequest<Product>(`/products/${id}`, {
    method: 'GET',
  });
};

// Create product
export const createProduct = async (productData: CreateProductRequest): Promise<ApiResponse<Product>> => {
  const formData = new FormData();
  
  // Required fields
  formData.append('name', productData.name);
  formData.append('price', String(productData.price));
  
  // Handle main_image (File or URL string)
  if (productData.main_image instanceof File) {
    formData.append('main_image', productData.main_image);
  } else if (productData.main_image) {
    formData.append('main_image', productData.main_image);
  }

  // Optional fields
  if (productData.category_id) formData.append('category_id', productData.category_id);
  if (productData.original_price !== undefined) formData.append('original_price', String(productData.original_price));
  if (productData.description) formData.append('description', productData.description);
  if (productData.stock !== undefined) formData.append('stock', String(productData.stock));
  if (productData.vendor_id) formData.append('vendor_id', productData.vendor_id);
  if (productData.status) formData.append('status', productData.status);
  if (productData.featured !== undefined) formData.append('featured', String(productData.featured));
  if (productData.new_product !== undefined) formData.append('new_product', String(productData.new_product));
  if (productData.rating !== undefined) formData.append('rating', String(productData.rating));
  if (productData.reviews_count !== undefined) formData.append('reviews_count', String(productData.reviews_count));

  // Handle media files (up to 5)
  if (productData.media && productData.media.length > 0) {
    productData.media.forEach(file => {
      formData.append('media', file);
    });
  }

  // Handle specs (comma-separated string or array)
  if (productData.specs) {
    if (Array.isArray(productData.specs)) {
      formData.append('specs', productData.specs.join(', '));
    } else {
      formData.append('specs', productData.specs);
    }
  }

  if (productData.key_features) {
    formData.append('key_features', JSON.stringify(productData.key_features));
  }

  return apiRequest<Product>(
    '/products',
    {
      method: 'POST',
      body: formData,
    },
    true // Skip JSON Content-Type for multipart/form-data
  );
};

// Update product
export const updateProduct = async (id: string, productData: UpdateProductRequest): Promise<ApiResponse<Product>> => {
  const formData = new FormData();

  // All fields are optional for update
  if (productData.name) formData.append('name', productData.name);
  if (productData.category_id) formData.append('category_id', productData.category_id);
  if (productData.price !== undefined) formData.append('price', String(productData.price));
  if (productData.original_price !== undefined) formData.append('original_price', String(productData.original_price));
  if (productData.description !== undefined) formData.append('description', productData.description || '');
  if (productData.stock !== undefined) formData.append('stock', String(productData.stock));
  if (productData.vendor_id !== undefined) formData.append('vendor_id', productData.vendor_id || '');
  if (productData.status) formData.append('status', productData.status);
  if (productData.featured !== undefined) formData.append('featured', String(productData.featured));
  if (productData.new_product !== undefined) formData.append('new_product', String(productData.new_product));
  if (productData.rating !== undefined) formData.append('rating', String(productData.rating));
  if (productData.reviews_count !== undefined) formData.append('reviews_count', String(productData.reviews_count));

  // Handle main_image (File or URL string)
  if (productData.main_image) {
    if (productData.main_image instanceof File) {
      formData.append('main_image', productData.main_image);
    } else {
      formData.append('main_image', productData.main_image);
    }
  }

  // Handle media files (replaces all existing media)
  if (productData.media && productData.media.length > 0) {
    productData.media.forEach(file => {
      formData.append('media', file);
    });
  }

  // Handle specs (replaces all existing specs)
  if (productData.specs) {
    if (Array.isArray(productData.specs)) {
      formData.append('specs', productData.specs.join(', '));
    } else {
      formData.append('specs', productData.specs);
    }
  }

  if (productData.key_features) {
    formData.append('key_features', JSON.stringify(productData.key_features));
  }

  return apiRequest<Product>(
    `/products/${id}`,
    {
      method: 'PUT',
      body: formData,
    },
    true // Skip JSON Content-Type for multipart/form-data
  );
};

// Delete product
export const deleteProduct = async (id: string): Promise<ApiResponse<Product>> => {
  return apiRequest<Product>(`/products/${id}`, {
    method: 'DELETE',
  });
};

// PC Builder Filter Rule APIs
const buildFilterRuleQuery = (
  filters?: PCBuilderFilterRuleFilters | PreviewPCBuilderFilterRuleFilters
): string => {
  const params = new URLSearchParams();

  if (filters?.selected_category_id) params.append('selected_category_id', filters.selected_category_id);
  if (filters?.selected_vendor_id) params.append('selected_vendor_id', filters.selected_vendor_id);
  if (filters?.result_category_id) params.append('result_category_id', filters.result_category_id);

  if ('result_vendor_id' in (filters || {}) && filters?.result_vendor_id) {
    params.append('result_vendor_id', filters.result_vendor_id);
  }
  if ('is_active' in (filters || {}) && filters?.is_active !== undefined) {
    params.append('is_active', String(filters.is_active));
  }
  if ('status' in (filters || {}) && filters?.status) {
    params.append('status', filters.status);
  }
  if ('in_stock' in (filters || {}) && filters?.in_stock !== undefined) {
    params.append('in_stock', String(filters.in_stock));
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
};

export const getPCBuilderFilterRules = async (
  filters?: PCBuilderFilterRuleFilters
): Promise<ApiResponse<PCBuilderFilterRule[]>> => {
  return apiRequest<PCBuilderFilterRule[]>(`/pc-builder-filter-rules${buildFilterRuleQuery(filters)}`, {
    method: 'GET',
  });
};

export const getPCBuilderFilterRuleById = async (id: string): Promise<ApiResponse<PCBuilderFilterRule>> => {
  return apiRequest<PCBuilderFilterRule>(`/pc-builder-filter-rules/${id}`, {
    method: 'GET',
  });
};

export const createPCBuilderFilterRule = async (
  ruleData: CreatePCBuilderFilterRuleRequest
): Promise<ApiResponse<PCBuilderFilterRule>> => {
  return apiRequest<PCBuilderFilterRule>('/pc-builder-filter-rules', {
    method: 'POST',
    body: JSON.stringify(ruleData),
  });
};

export const updatePCBuilderFilterRule = async (
  id: string,
  ruleData: UpdatePCBuilderFilterRuleRequest
): Promise<ApiResponse<PCBuilderFilterRule>> => {
  return apiRequest<PCBuilderFilterRule>(`/pc-builder-filter-rules/${id}`, {
    method: 'PUT',
    body: JSON.stringify(ruleData),
  });
};

export const deletePCBuilderFilterRule = async (id: string): Promise<ApiResponse<PCBuilderFilterRule>> => {
  return apiRequest<PCBuilderFilterRule>(`/pc-builder-filter-rules/${id}`, {
    method: 'DELETE',
  });
};

export const previewPCBuilderFilterRule = async (
  id: string,
  filters?: Pick<PreviewPCBuilderFilterRuleFilters, 'status' | 'in_stock'>
): Promise<ApiResponse<Product[]>> => {
  return apiRequest<Product[]>(`/pc-builder-filter-rules/${id}/preview${buildFilterRuleQuery(filters)}`, {
    method: 'GET',
  });
};

export const previewPCBuilderFilterRules = async (
  filters: PreviewPCBuilderFilterRuleFilters
): Promise<ApiResponse<Product[]>> => {
  return apiRequest<Product[]>(`/pc-builder-filter-rules/preview${buildFilterRuleQuery(filters)}`, {
    method: 'GET',
  });
};

// Public API functions (no authentication required)
// These functions use a separate helper that doesn't require auth

async function publicApiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  skipJsonContentType: boolean = false
): Promise<ApiResponse<T>> {
  const headers: HeadersInit = {
    ...options.headers,
  };

  // Only set Content-Type to JSON if not multipart/form-data
  // If body is FormData, browser will set Content-Type automatically with boundary
  if (!skipJsonContentType && !headers['Content-Type'] && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // Note: No Authorization header for public APIs

  try {
    const response = await fetch(`${API_BASE_URL}/public${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'An error occurred',
        error: data.error || data.message,
      };
    }

    return {
      success: true,
      message: data.message || 'Success',
      data: data.data,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Network error. Please check your connection.',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Public Product APIs
export const getPublicProducts = async (filters?: {
  category_id?: string;
  vendor_id?: string;
  featured?: boolean;
  in_stock?: boolean;
  search?: string;
}): Promise<ApiResponse<Product[]>> => {
  const params = new URLSearchParams();
  if (filters?.category_id) params.append('category_id', filters.category_id);
  if (filters?.vendor_id) params.append('vendor_id', filters.vendor_id);
  if (filters?.featured !== undefined) params.append('featured', String(filters.featured));
  if (filters?.in_stock !== undefined) params.append('in_stock', String(filters.in_stock));
  if (filters?.search) params.append('search', filters.search);

  const queryString = params.toString();
  const endpoint = queryString ? `/products?${queryString}` : '/products';

  return publicApiRequest<Product[]>(endpoint, {
    method: 'GET',
  });
};

export const getPublicFeaturedProducts = async (): Promise<ApiResponse<Product[]>> => {
  return publicApiRequest<Product[]>('/products?featured=true', {
    method: 'GET',
  });
};

export const getPublicProductById = async (id: string): Promise<ApiResponse<Product>> => {
  return publicApiRequest<Product>(`/products/${id}`, {
    method: 'GET',
  });
};

// Public Vendor APIs
export const getPublicVendors = async (): Promise<ApiResponse<Vendor[]>> => {
  return publicApiRequest<Vendor[]>('/vendors', {
    method: 'GET',
  });
};

export const getPublicVendorById = async (id: string): Promise<ApiResponse<Vendor>> => {
  return publicApiRequest<Vendor>(`/vendors/${id}`, {
    method: 'GET',
  });
};

// Public Category APIs
export const getPublicCategories = async (): Promise<ApiResponse<Category[]>> => {
  return publicApiRequest<Category[]>('/categories', {
    method: 'GET',
  });
};

export const getPublicCategoryById = async (id: string): Promise<ApiResponse<Category>> => {
  return publicApiRequest<Category>(`/categories/${id}`, {
    method: 'GET',
  });
};

// Public PC Builder APIs
export const getPublicPCBuilderOptions = async (): Promise<ApiResponse<PCBuilderOptions>> => {
  return publicApiRequest<PCBuilderOptions>('/pc-builder/options', {
    method: 'GET',
  });
};

export const getPublicPCBuilderProducts = async (
  filters: PublicPCBuilderProductFilters
): Promise<ApiResponse<Product[]>> => {
  const params = new URLSearchParams();
  const categoryId = filters.selected_category_id || filters.category_id;
  const vendorId = filters.selected_vendor_id || filters.vendor_id;

  if (categoryId) params.append('selected_category_id', categoryId);
  if (vendorId) params.append('selected_vendor_id', vendorId);
  if (filters.result_category_id) params.append('result_category_id', filters.result_category_id);
  if (filters.in_stock !== undefined) params.append('in_stock', String(filters.in_stock));

  return publicApiRequest<Product[]>(`/pc-builder/products?${params.toString()}`, {
    method: 'GET',
  });
};

// Billing Information APIs

// Set/Update billing information (Admin)
export const setBillingInfo = async (billingData: CreateBillingInfoRequest): Promise<ApiResponse<BillingInfo>> => {
  return apiRequest<BillingInfo>('/billing', {
    method: 'POST',
    body: JSON.stringify(billingData),
  });
};

// Get billing information (Admin)
export const getBillingInfo = async (): Promise<ApiResponse<BillingInfo>> => {
  return apiRequest<BillingInfo>('/billing', {
    method: 'GET',
  });
};

// Get billing information (Public - for checkout page)
export const getPublicBillingInfo = async (): Promise<ApiResponse<BillingInfo>> => {
  return publicApiRequest<BillingInfo>('/billing', {
    method: 'GET',
  });
};

// Order interfaces
export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category?: string;
  vendor_id?: string;
  image?: string;
}

export interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_method: 'bank-transfer' | 'agent';
  shipping_info: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
  };
  billing_info: {
    first_name: string;
    last_name: string;
    email: string;
    address: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
  };
  items: Array<OrderItem & { subtotal: number }>;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  payment_screenshot_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface BankTransferCheckoutRequest {
  shipping_first_name: string;
  shipping_last_name: string;
  shipping_email: string;
  shipping_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_zip_code: string;
  shipping_country: string;
  billing_first_name: string;
  billing_last_name: string;
  billing_email: string;
  billing_address: string;
  billing_city: string;
  billing_state: string;
  billing_zip_code: string;
  billing_country: string;
  items: OrderItem[];
  shipping?: number;
  tax?: number;
  payment_screenshot: File;
}

export interface AgentCheckoutRequest {
  shipping_first_name: string;
  shipping_last_name: string;
  shipping_email: string;
  shipping_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_zip_code: string;
  shipping_country: string;
  billing_first_name: string;
  billing_last_name: string;
  billing_email: string;
  billing_address: string;
  billing_city: string;
  billing_state: string;
  billing_zip_code: string;
  billing_country: string;
  items: OrderItem[];
  shipping?: number;
  tax?: number;
}

// Helper function for public order endpoints (without /public prefix)
async function publicOrderRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  skipJsonContentType: boolean = false
): Promise<ApiResponse<T>> {
  const headers: HeadersInit = {
    ...options.headers,
  };

  // Only set Content-Type to JSON if not multipart/form-data
  // If body is FormData, browser will set Content-Type automatically with boundary
  if (!skipJsonContentType && !headers['Content-Type'] && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'An error occurred',
        error: data.error || data.message,
      };
    }

    return {
      success: true,
      message: data.message || 'Success',
      data: data.data,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Network error. Please check your connection.',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Bank Transfer Checkout (multipart/form-data)
export const createBankTransferOrder = async (
  orderData: BankTransferCheckoutRequest
): Promise<ApiResponse<Order>> => {
  const formData = new FormData();

  // Shipping Information
  formData.append('shipping_first_name', orderData.shipping_first_name);
  formData.append('shipping_last_name', orderData.shipping_last_name);
  formData.append('shipping_email', orderData.shipping_email);
  formData.append('shipping_phone', orderData.shipping_phone);
  formData.append('shipping_address', orderData.shipping_address);
  formData.append('shipping_city', orderData.shipping_city);
  formData.append('shipping_state', orderData.shipping_state);
  formData.append('shipping_zip_code', orderData.shipping_zip_code);
  formData.append('shipping_country', orderData.shipping_country);

  // Billing Information
  formData.append('billing_first_name', orderData.billing_first_name);
  formData.append('billing_last_name', orderData.billing_last_name);
  formData.append('billing_email', orderData.billing_email);
  formData.append('billing_address', orderData.billing_address);
  formData.append('billing_city', orderData.billing_city);
  formData.append('billing_state', orderData.billing_state);
  formData.append('billing_zip_code', orderData.billing_zip_code);
  formData.append('billing_country', orderData.billing_country);

  // Order Information
  formData.append('items', JSON.stringify(orderData.items));
  // Note: shipping and tax are automatically calculated by backend
  // shipping is always 0, tax is 5% VAT of subtotal
  // Do not send shipping or tax - they will be ignored

  // Payment Screenshot
  formData.append('payment_screenshot', orderData.payment_screenshot);

  return publicOrderRequest<Order>('/orders/bank-transfer', {
    method: 'POST',
    body: formData,
  }, true); // Skip JSON content type for FormData
};

// Agent Payment Checkout (application/json)
export const createAgentOrder = async (
  orderData: AgentCheckoutRequest
): Promise<ApiResponse<Order>> => {
  // Remove shipping and tax as they're automatically calculated by backend
  const { shipping, tax, ...orderPayload } = orderData;
  
  return publicOrderRequest<Order>('/orders/agent', {
    method: 'POST',
    body: JSON.stringify(orderPayload),
  });
};

// Order Management APIs (Admin)

export interface GetOrdersFilters {
  status?: 'pending' | 'pending_payment' | 'agent_review' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_method?: 'bank-transfer' | 'agent';
  order_number?: string;
  shipping_email?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}

export interface GetOrdersResponse {
  data: Order[];
  count: number;
}

// Get all orders (Admin)
export const getOrders = async (filters?: GetOrdersFilters): Promise<ApiResponse<Order[]>> => {
  const params = new URLSearchParams();
  
  if (filters?.status) params.append('status', filters.status);
  if (filters?.payment_method) params.append('payment_method', filters.payment_method);
  if (filters?.order_number) params.append('order_number', filters.order_number);
  if (filters?.shipping_email) params.append('shipping_email', filters.shipping_email);
  if (filters?.date_from) params.append('date_from', filters.date_from);
  if (filters?.date_to) params.append('date_to', filters.date_to);
  if (filters?.limit) params.append('limit', String(filters.limit));
  if (filters?.offset) params.append('offset', String(filters.offset));
  
  const queryString = params.toString();
  const endpoint = queryString ? `/orders?${queryString}` : '/orders';
  
  return apiRequest<Order[]>(endpoint, {
    method: 'GET',
  });
};

// Get order by ID (Admin)
export const getOrderById = async (id: string): Promise<ApiResponse<Order>> => {
  return apiRequest<Order>(`/orders/${id}`, {
    method: 'GET',
  });
};

// Update order status (Admin)
export const updateOrderStatus = async (id: string, status: string): Promise<ApiResponse<Order>> => {
  return apiRequest<Order>(`/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
};

// Statistics APIs

export interface DashboardStatistics {
  total_published_products: number;
  total_revenue_this_month: number;
  total_orders_this_month: number;
  month: string;
}

// Get dashboard statistics
export const getDashboardStatistics = async (): Promise<ApiResponse<DashboardStatistics>> => {
  return apiRequest<DashboardStatistics>('/statistics/dashboard', {
    method: 'GET',
  });
};

export interface TopProduct {
  product_id: string;
  product_name: string;
  total_quantity_sold: number;
  total_revenue: number;
  order_count: number;
  product_image?: string;
  category?: string;
  vendor_id?: string;
}

export interface TopProductsResponse {
  data: TopProduct[];
  count: number;
}

// Get top products by sales
export const getTopProducts = async (limit: number = 5): Promise<ApiResponse<TopProduct[]>> => {
  return apiRequest<TopProduct[]>(`/statistics/top-products?limit=${limit}`, {
    method: 'GET',
  });
};

export interface MonthlyProduct {
  product_id: string;
  product_name: string;
  sales_count: number;
  revenue: number;
  order_count: number;
  product_image?: string;
  category?: string;
  vendor_id?: string;
}

export interface MonthlySalesData {
  month: string;
  month_name: string;
  products: MonthlyProduct[];
}

// Get monthly sales (last 12 months)
export const getMonthlySales = async (): Promise<ApiResponse<MonthlySalesData[]>> => {
  return apiRequest<MonthlySalesData[]>('/statistics/monthly-sales', {
    method: 'GET',
  });
};

// Hero Media APIs

export interface HeroMediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  index: number;
  created_at?: string;
  updated_at?: string;
}

// Update hero media (Admin)
export const updateHeroMedia = async (
  media: Array<{ url?: string | null; type: 'image' | 'video'; index: number }>,
  files?: Record<string, File>
): Promise<ApiResponse<HeroMediaItem[]>> => {
  const formData = new FormData();

  // Add media array as JSON string
  formData.append('media', JSON.stringify(media));

  // Add files if provided (media_0, media_1, etc.)
  if (files) {
    Object.keys(files).forEach((key) => {
      if (files[key]) {
        formData.append(key, files[key]);
      }
    });
  }

  return apiRequest<HeroMediaItem[]>('/customization/hero-media', {
    method: 'POST',
    body: formData,
  }, true); // Skip JSON content type for FormData
};

// Get hero media (Public)
export const getPublicHeroMedia = async (): Promise<ApiResponse<HeroMediaItem[]>> => {
  return publicApiRequest<HeroMediaItem[]>('/hero-media', {
    method: 'GET',
  });
};

// Get hero media (Admin - can use public endpoint or admin endpoint if available)
export const getHeroMedia = async (): Promise<ApiResponse<HeroMediaItem[]>> => {
  // Using public endpoint for now - you can switch to admin endpoint if available
  return getPublicHeroMedia();
};
