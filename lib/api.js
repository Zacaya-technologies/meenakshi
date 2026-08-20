// Meenakshi Build World — API client (talks to Express backend via /api/v1 proxy)
const API_BASE = '/api/v1';

async function apiRequest(endpoint, method = 'GET', data = null) {
  const headers = { 'Content-Type': 'application/json' };
  let token = '';
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('meenakshi_token') || '';
  }
  if (token) headers.Authorization = `Bearer ${token}`;

  const config = { method, headers, cache: 'no-store' };
  if (data) config.body = JSON.stringify(data);

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, config);
    return await res.json();
  } catch (err) {
    console.error(`API Request Error [${endpoint}]:`, err);
    return { success: false, message: err.message };
  }
}

export const API = {
  // Navigation & mega menu
  getMenu: () => apiRequest('/menu'),
  getCategoryMenu: (slug) => apiRequest(`/menu/${slug}`),

  // Catalog
  getProducts: (params = '') => apiRequest(`/products${params}`),
  getFacets: (category = '') => apiRequest(`/products/facets${category ? `?category=${category}` : ''}`),
  getProductBySlug: (slug) => apiRequest(`/products/${slug}`),
  getSuggestions: (q) => apiRequest(`/products/suggest?q=${encodeURIComponent(q)}`),

  // Content
  getCategories: () => apiRequest('/categories'),
  getMainCategory: (slug) => apiRequest(`/categories/${slug}`),
  getFacetCategory: (parentSlug, childSlug) => apiRequest(`/categories/${parentSlug}/${childSlug}`),
  getBrands: () => apiRequest('/brands'),
  getCollections: () => apiRequest('/collections'),
  getBlogs: () => apiRequest('/blogs'),

  // Auth & commerce
  login: (email, password) => apiRequest('/auth/login', 'POST', { email, password }),
  register: (data) => apiRequest('/auth/register', 'POST', data),
  checkout: (orderData) => apiRequest('/orders/checkout', 'POST', orderData),
  getOrders: () => apiRequest('/orders'),
  updateOrderStatus: (id, order_status) => apiRequest(`/orders/${id}/status`, 'PUT', { order_status }),
  submitInquiry: (inquiryData) => apiRequest('/inquiries', 'POST', inquiryData),

  // ---- Admin: category groups ----
  getCategoryGroups: () => apiRequest('/category-groups'),
  createCategoryGroup: (data) => apiRequest('/category-groups', 'POST', data),
  updateCategoryGroup: (id, data) => apiRequest(`/category-groups/${id}`, 'PUT', data),
  deleteCategoryGroup: (id) => apiRequest(`/category-groups/${id}`, 'DELETE'),

  // ---- Admin: categories ----
  getCategoryTree: () => apiRequest('/categories/tree'),
  createCategory: (data) => apiRequest('/categories', 'POST', data),
  updateCategory: (id, data) => apiRequest(`/categories/${id}`, 'PUT', data),
  deleteCategory: (id) => apiRequest(`/categories/${id}`, 'DELETE'),

  // ---- Admin: category attributes (spec sheet) ----
  getCategoryAttributes: (categoryId) => apiRequest(`/category-attributes${categoryId ? `?category_id=${categoryId}` : ''}`),
  createCategoryAttribute: (data) => apiRequest('/category-attributes', 'POST', data),
  updateCategoryAttribute: (id, data) => apiRequest(`/category-attributes/${id}`, 'PUT', data),
  deleteCategoryAttribute: (id) => apiRequest(`/category-attributes/${id}`, 'DELETE'),
  addAttributeValue: (attributeId, data) => apiRequest(`/category-attributes/${attributeId}/values`, 'POST', data),
  updateAttributeValue: (id, data) => apiRequest(`/category-attributes/values/${id}`, 'PUT', data),
  deleteAttributeValue: (id) => apiRequest(`/category-attributes/values/${id}`, 'DELETE'),

  // ---- Admin: products ----
  createProduct: (data) => apiRequest('/products', 'POST', data),
  updateProduct: (id, data) => apiRequest(`/products/${id}`, 'PUT', data),
  duplicateProduct: (id) => apiRequest(`/products/${id}/duplicate`, 'POST'),
  deleteProduct: (id) => apiRequest(`/products/${id}`, 'DELETE'),

  // ---- Admin: variants & inventory ----
  getVariants: (productId) => apiRequest(`/product-variants?product_id=${productId}`),
  createVariant: (data) => apiRequest('/product-variants', 'POST', data),
  updateVariant: (id, data) => apiRequest(`/product-variants/${id}`, 'PUT', data),
  updateVariantInventory: (id, data) => apiRequest(`/product-variants/${id}/inventory`, 'PUT', data),
  deleteVariant: (id) => apiRequest(`/product-variants/${id}`, 'DELETE'),

  // ---- Admin: brands & collections ----
  createBrand: (data) => apiRequest('/brands', 'POST', data),
  deleteBrand: (id) => apiRequest(`/brands/${id}`, 'DELETE'),
  createCollection: (data) => apiRequest('/collections', 'POST', data),
  deleteCollection: (id) => apiRequest(`/collections/${id}`, 'DELETE'),

  // ---- Admin: inquiries ----
  getInquiries: () => apiRequest('/inquiries'),

  // ---- Admin: analytics ----
  getAnalytics: () => apiRequest('/admin/analytics')
};

export function formatPrice(p) {
  const value = p?.offer_price || p?.price || 0;
  return `₹${Number(value).toLocaleString('en-IN')}`;
}

export function discountPct(p) {
  if (!p?.offer_price || !p?.price) return 0;
  return Math.round((1 - p.offer_price / Math.max(p.price, 0.01)) * 100);
}

export const FALLBACK_IMG =
  'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80';

