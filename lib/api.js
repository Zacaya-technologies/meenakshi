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
  getBrands: () => apiRequest('/brands'),
  getCollections: () => apiRequest('/collections'),
  getBlogs: () => apiRequest('/blogs'),

  // Auth & commerce
  login: (email, password) => apiRequest('/auth/login', 'POST', { email, password }),
  register: (data) => apiRequest('/auth/register', 'POST', data),
  checkout: (orderData) => apiRequest('/orders/checkout', 'POST', orderData),
  getOrders: () => apiRequest('/orders'),
  submitInquiry: (inquiryData) => apiRequest('/inquiries', 'POST', inquiryData)
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

