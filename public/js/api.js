/* Central API Client & Local State Management for Meenakshi Build World */

const API_BASE = '/api/v1';

const AppState = {
    user: JSON.parse(localStorage.getItem('meenakshi_user') || 'null'),
    token: localStorage.getItem('meenakshi_token') || '',
    cart: JSON.parse(localStorage.getItem('meenakshi_cart') || '[]'),
    wishlist: JSON.parse(localStorage.getItem('meenakshi_wishlist') || '[]'),
    compare: JSON.parse(localStorage.getItem('meenakshi_compare') || '[]'),
    
    save() {
        localStorage.setItem('meenakshi_user', JSON.stringify(this.user));
        localStorage.setItem('meenakshi_token', this.token);
        localStorage.setItem('meenakshi_cart', JSON.stringify(this.cart));
        localStorage.setItem('meenakshi_wishlist', JSON.stringify(this.wishlist));
        localStorage.setItem('meenakshi_compare', JSON.stringify(this.compare));
        this.updateBadgeCounts();
    },

    setUser(user, token) {
        this.user = user;
        this.token = token;
        this.save();
    },

    logout() {
        this.user = null;
        this.token = '';
        this.save();
        window.location.reload();
    },

    addToCart(product, quantityBoxes = 1) {
        const existing = this.cart.find(item => item.product.id === product.id);
        if (existing) {
            existing.quantityBoxes += quantityBoxes;
        } else {
            this.cart.push({ product, quantityBoxes });
        }
        this.save();
        alert(`Added ${quantityBoxes} box(es) of ${product.name} to cart!`);
    },

    toggleWishlist(product) {
        const idx = this.wishlist.findIndex(p => p.id === product.id);
        if (idx > -1) {
            this.wishlist.splice(idx, 1);
            alert(`Removed ${product.name} from Wishlist`);
        } else {
            this.wishlist.push(product);
            alert(`Added ${product.name} to Wishlist`);
        }
        this.save();
    },

    toggleCompare(product) {
        const idx = this.compare.findIndex(p => p.id === product.id);
        if (idx > -1) {
            this.compare.splice(idx, 1);
        } else {
            if (this.compare.length >= 4) {
                alert('You can compare up to 4 tiles side-by-side.');
                return;
            }
            this.compare.push(product);
        }
        this.save();
    },

    updateBadgeCounts() {
        const cartBadge = document.getElementById('cart-count-badge');
        const wishBadge = document.getElementById('wishlist-count-badge');
        if (cartBadge) cartBadge.innerText = this.cart.reduce((acc, i) => acc + i.quantityBoxes, 0);
        if (wishBadge) wishBadge.innerText = this.wishlist.length;
    }
};

async function apiRequest(endpoint, method = 'GET', data = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (AppState.token) {
        headers['Authorization'] = `Bearer ${AppState.token}`;
    }

    const config = { method, headers };
    if (data) config.body = JSON.stringify(data);

    try {
        const res = await fetch(`${API_BASE}${endpoint}`, config);
        const json = await res.json();
        return json;
    } catch (err) {
        console.error(`API Request Error [${endpoint}]:`, err);
        return { success: false, message: err.message };
    }
}

// API Methods
const API = {
    getMenu: () => apiRequest('/menu'),
    getCategoryMenu: (slug) => apiRequest(`/menu/${slug}`),
    getProducts: (params = '') => apiRequest(`/products${params}`),
    getFacets: (category = '') => apiRequest(`/products/facets${category ? `?category=${category}` : ''}`),
    getProductBySlug: (slug) => apiRequest(`/products/${slug}`),
    getSuggestions: (q) => apiRequest(`/products/suggest?q=${encodeURIComponent(q)}`),
    getCategories: () => apiRequest('/categories'),
    getBrands: () => apiRequest('/brands'),
    getCollections: () => apiRequest('/collections'),
    getBlogs: () => apiRequest('/blogs'),
    getBlogBySlug: (slug) => apiRequest(`/blogs/${slug}`),
    login: (email, password) => apiRequest('/auth/login', 'POST', { email, password }),
    register: (data) => apiRequest('/auth/register', 'POST', data),
    getUserProfile: () => apiRequest('/auth/me'),
    checkout: (orderData) => apiRequest('/orders/checkout', 'POST', orderData),
    getOrders: () => apiRequest('/orders'),
    updateOrderStatus: (id, status) => apiRequest(`/orders/${id}/status`, 'PUT', { order_status: status }),
    submitInquiry: (inquiryData) => apiRequest('/inquiries', 'POST', inquiryData),
    getInquiries: () => apiRequest('/inquiries'),
    
    // Admin CRUD
    createCategory: (catData) => apiRequest('/categories', 'POST', catData),
    deleteCategory: (id) => apiRequest(`/categories/${id}`, 'DELETE'),
    createProduct: (productData) => apiRequest('/products', 'POST', productData),
    deleteProduct: (id) => apiRequest(`/products/${id}`, 'DELETE'),
    createBrand: (brandData) => apiRequest('/brands', 'POST', brandData),
    createCollection: (colData) => apiRequest('/collections', 'POST', colData)
};
