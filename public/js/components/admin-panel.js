/* Complete Enterprise Admin Panel Component (Category & Product CRUD, Inventory, Orders, CMS) */

let currentAdminTab = 'dashboard';

async function renderAdminPanelPage(mountPoint) {
    if (!AppState.user || AppState.user.role !== 'admin') {
        mountPoint.innerHTML = `
            <div class="container py-5 text-center">
                <h2>Master Admin Authorization Required</h2>
                <p class="text-secondary">Please sign in with administrator credentials (admin@meenakshibuildworld.com / Password123!).</p>
                <button onclick="openAuthModal('login')" class="btn btn-gold mt-3">Sign In as Admin</button>
            </div>
        `;
        return;
    }

    const categoriesRes = await API.getCategories();
    const categories = categoriesRes.success ? categoriesRes.categories : [];

    const productsRes = await API.getProducts('?limit=100');
    const products = productsRes.success ? productsRes.products : [];

    const ordersRes = await API.getOrders();
    const orders = ordersRes.success ? ordersRes.orders : [];

    const inquiriesRes = await API.getInquiries();
    const inquiries = inquiriesRes.success ? inquiriesRes.inquiries : [];

    const totalRevenue = orders.reduce((acc, o) => acc + parseFloat(o.net_payable || 0), 0);

    const html = `
    <div class="container py-5">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
                <h1 class="font-heading text-gold mb-1"><i class="ri-admin-line"></i> Meenakshi Build World Admin Control Panel</h1>
                <p class="text-secondary small mb-0">Database-Driven Dynamic CMS Engine & Catalog Operations</p>
            </div>
            <span class="badge bg-gold text-dark font-bold px-3 py-2 fs-6">ENTERPRISE ADMIN LIVE</span>
        </div>

        <div class="dashboard-wrapper">
            <!-- Admin Navigation Sidebar -->
            <div class="dash-sidebar">
                <ul class="dash-nav">
                    <li><a href="#" class="${currentAdminTab === 'dashboard' ? 'active' : ''}" onclick="switchAdminTab('dashboard')"><i class="ri-dashboard-line"></i> Overview & Metrics</a></li>
                    <li><a href="#" class="${currentAdminTab === 'categories' ? 'active' : ''}" onclick="switchAdminTab('categories')"><i class="ri-node-tree"></i> Categories (${categories.length})</a></li>
                    <li><a href="#" class="${currentAdminTab === 'products' ? 'active' : ''}" onclick="switchAdminTab('products')"><i class="ri-box-3-line"></i> Products Catalog (${products.length})</a></li>
                    <li><a href="#" class="${currentAdminTab === 'orders' ? 'active' : ''}" onclick="switchAdminTab('orders')"><i class="ri-shopping-cart-2-line"></i> Orders (${orders.length})</a></li>
                    <li><a href="#" class="${currentAdminTab === 'inquiries' ? 'active' : ''}" onclick="switchAdminTab('inquiries')"><i class="ri-whatsapp-line"></i> Leads & Quotes (${inquiries.length})</a></li>
                    <li><a href="#" onclick="AppState.logout()"><i class="ri-logout-box-r-line"></i> Logout Admin</a></li>
                </ul>
            </div>

            <!-- Admin Main Workspace -->
            <div class="dash-main">
                ${currentAdminTab === 'dashboard' ? renderAdminOverviewHtml(totalRevenue, products.length, categories.length, orders.length) : ''}
                ${currentAdminTab === 'categories' ? renderAdminCategoriesHtml(categories) : ''}
                ${currentAdminTab === 'products' ? renderAdminProductsHtml(products, categories) : ''}
                ${currentAdminTab === 'orders' ? renderAdminOrdersHtml(orders) : ''}
                ${currentAdminTab === 'inquiries' ? renderAdminInquiriesHtml(inquiries) : ''}
            </div>
        </div>
    </div>
    `;

    mountPoint.innerHTML = html;
}

function switchAdminTab(tab) {
    currentAdminTab = tab;
    renderAdminPanelPage(document.getElementById('app-main-content'));
}

/* 1. Overview Tab */
function renderAdminOverviewHtml(revenue, totalProducts, totalCategories, totalOrders) {
    return `
        <h2 class="font-heading text-gold mb-4">Marketplace Metrics Overview</h2>
        <div class="row g-4 mb-5">
            <div class="col-md-3">
                <div class="p-3 rounded-3 bg-dark border border-secondary border-opacity-25 text-center">
                    <div class="text-secondary extra-small">Total Marketplace Revenue</div>
                    <div class="fs-3 font-heading text-gold fw-bold">₹${Math.round(revenue).toLocaleString('en-IN')}</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="p-3 rounded-3 bg-dark border border-secondary border-opacity-25 text-center">
                    <div class="text-secondary extra-small">Published Tile Products</div>
                    <div class="fs-3 font-heading text-white fw-bold">${totalProducts}</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="p-3 rounded-3 bg-dark border border-secondary border-opacity-25 text-center">
                    <div class="text-secondary extra-small">Dynamic DB Categories</div>
                    <div class="fs-3 font-heading text-white fw-bold">${totalCategories}</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="p-3 rounded-3 bg-dark border border-secondary border-opacity-25 text-center">
                    <div class="text-secondary extra-small">Customer Orders</div>
                    <div class="fs-3 font-heading text-gold fw-bold">${totalOrders}</div>
                </div>
            </div>
        </div>
    `;
}

/* 2. Categories CRUD Tab */
function renderAdminCategoriesHtml(categories) {
    return `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="font-heading text-gold mb-0">Dynamic Category Builder</h2>
            <button class="btn btn-gold btn-sm" onclick="toggleAddCategoryModal()"><i class="ri-add-line"></i> Add New Category</button>
        </div>

        <!-- Add Category Form Modal / Card -->
        <div id="add-category-form-card" class="p-4 rounded-4 bg-dark border border-secondary border-opacity-25 mb-4 d-none">
            <h4 class="font-heading text-gold mb-3">Create Dynamic Category</h4>
            <form onsubmit="handleCreateCategorySubmit(event)">
                <div class="row g-3 mb-3">
                    <div class="col-md-6">
                        <label class="form-label text-white small">Category Name *</label>
                        <input type="text" id="cat-name-input" class="form-control bg-dark text-white border-secondary" placeholder="e.g. Royal Mosaic Tiles" required>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label text-white small">Mega Menu Section</label>
                        <select id="cat-section-input" class="form-control bg-dark text-white border-secondary">
                            <option value="room">Tiles by Room</option>
                            <option value="type">Category Type</option>
                            <option value="material">Material</option>
                            <option value="finish">Surface Finish</option>
                        </select>
                    </div>
                </div>
                <div class="mb-3">
                    <label class="form-label text-white small">Description & SEO Text</label>
                    <textarea id="cat-desc-input" class="form-control bg-dark text-white border-secondary" rows="2" placeholder="Rich porcelain mosaic wall tiles..."></textarea>
                </div>
                <div class="d-flex gap-2">
                    <button type="submit" class="btn btn-gold btn-sm">Publish Category & Generate Route</button>
                    <button type="button" class="btn btn-dark btn-sm" onclick="toggleAddCategoryModal()">Cancel</button>
                </div>
            </form>
        </div>

        <div class="table-responsive">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Category Name</th>
                        <th>Generated Slug Route</th>
                        <th>Mega Menu Section</th>
                        <th>In Navigation</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${categories.map(c => `
                        <tr>
                            <td class="fw-bold text-white">${c.name}</td>
                            <td><span class="text-gold font-monospace">/category/${c.slug}</span></td>
                            <td class="text-uppercase small">${c.mega_menu_section}</td>
                            <td><span class="badge bg-success">Active</span></td>
                            <td>
                                <button class="btn btn-link text-danger p-0" onclick="handleDeleteCategory(${c.id})"><i class="ri-delete-bin-line"></i> Delete</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function toggleAddCategoryModal() {
    const card = document.getElementById('add-category-form-card');
    if (card) card.classList.toggle('d-none');
}

async function handleCreateCategorySubmit(e) {
    e.preventDefault();
    const name = document.getElementById('cat-name-input').value;
    const mega_menu_section = document.getElementById('cat-section-input').value;
    const description = document.getElementById('cat-desc-input').value;

    const res = await API.createCategory({ name, mega_menu_section, description, in_mega_menu: true });
    if (res.success) {
        alert(res.message);
        renderNavbar(); // Instant refresh mega menu in header!
        switchAdminTab('categories');
    } else {
        alert('Error: ' + res.message);
    }
}

async function handleDeleteCategory(id) {
    if (confirm('Delete this category?')) {
        await API.deleteCategory(id);
        renderNavbar();
        switchAdminTab('categories');
    }
}

/* 3. Products CRUD Tab */
function renderAdminProductsHtml(products, categories) {
    return `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="font-heading text-gold mb-0">Products Catalog Management</h2>
            <button class="btn btn-gold btn-sm" onclick="toggleAddProductModal()"><i class="ri-add-line"></i> Add New Product Tile</button>
        </div>

        <!-- Add Product Card -->
        <div id="add-product-form-card" class="p-4 rounded-4 bg-dark border border-secondary border-opacity-25 mb-4 d-none">
            <h4 class="font-heading text-gold mb-3">Publish New Tile Product</h4>
            <form onsubmit="handleCreateProductSubmit(event)">
                <div class="row g-3 mb-3">
                    <div class="col-md-6">
                        <label class="form-label text-white small">Product Name *</label>
                        <input type="text" id="prd-name-input" class="form-control bg-dark text-white border-secondary" placeholder="e.g. Imperial Gold Calacatta Slab" required>
                    </div>
                    <div class="col-md-3">
                        <label class="form-label text-white small">Price (₹ / sq.ft) *</label>
                        <input type="number" id="prd-price-input" class="form-control bg-dark text-white border-secondary" placeholder="140" required>
                    </div>
                    <div class="col-md-3">
                        <label class="form-label text-white small">Tile Size *</label>
                        <input type="text" id="prd-size-input" class="form-control bg-dark text-white border-secondary" placeholder="600x1200 mm" required>
                    </div>
                </div>

                <div class="row g-3 mb-3">
                    <div class="col-md-4">
                        <label class="form-label text-white small">Material *</label>
                        <input type="text" id="prd-material-input" class="form-control bg-dark text-white border-secondary" placeholder="PGVT Vitrified" required>
                    </div>
                    <div class="col-md-4">
                        <label class="form-label text-white small">Finish *</label>
                        <input type="text" id="prd-finish-input" class="form-control bg-dark text-white border-secondary" placeholder="Hi Gloss" required>
                    </div>
                    <div class="col-md-4">
                        <label class="form-label text-white small">Stock Quantity (Boxes)</label>
                        <input type="number" id="prd-stock-input" class="form-control bg-dark text-white border-secondary" value="150">
                    </div>
                </div>

                <div class="mb-3">
                    <label class="form-label text-white small">Primary Image URL</label>
                    <input type="url" id="prd-img-input" class="form-control bg-dark text-white border-secondary" placeholder="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6">
                </div>

                <div class="d-flex gap-2">
                    <button type="submit" class="btn btn-gold btn-sm">Publish Product & Generate /product/slug</button>
                    <button type="button" class="btn btn-dark btn-sm" onclick="toggleAddProductModal()">Cancel</button>
                </div>
            </form>
        </div>

        <div class="table-responsive">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Tile Product Name</th>
                        <th>SKU</th>
                        <th>Price / sq.ft</th>
                        <th>Stock</th>
                        <th>Material</th>
                        <th>Route</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${products.map(p => `
                        <tr>
                            <td class="fw-bold text-white">${p.name}</td>
                            <td class="font-monospace small text-muted">${p.sku}</td>
                            <td class="text-gold fw-bold">₹${p.offer_price || p.price}</td>
                            <td>${p.stock} Boxes</td>
                            <td>${p.material}</td>
                            <td><a href="/product/${p.slug}" onclick="event.preventDefault(); navigateTo('/product/${p.slug}');" class="text-gold extra-small">View Live Page</a></td>
                            <td>
                                <button class="btn btn-link text-danger p-0" onclick="handleDeleteProduct(${p.id})"><i class="ri-delete-bin-line"></i> Delete</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function toggleAddProductModal() {
    const card = document.getElementById('add-product-form-card');
    if (card) card.classList.toggle('d-none');
}

async function handleCreateProductSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('prd-name-input').value;
    const price = document.getElementById('prd-price-input').value;
    const tile_size = document.getElementById('prd-size-input').value;
    const material = document.getElementById('prd-material-input').value;
    const finish = document.getElementById('prd-finish-input').value;
    const stock = document.getElementById('prd-stock-input').value;
    const imgUrl = document.getElementById('prd-img-input').value;

    const res = await API.createProduct({
        name, price, tile_size, material, finish, stock,
        image_urls: imgUrl ? [imgUrl] : undefined
    });

    if (res.success) {
        alert(res.message);
        switchAdminTab('products');
    } else {
        alert('Error: ' + res.message);
    }
}

async function handleDeleteProduct(id) {
    if (confirm('Delete this product tile from database?')) {
        await API.deleteProduct(id);
        switchAdminTab('products');
    }
}

/* 4. Orders Management Tab */
function renderAdminOrdersHtml(orders) {
    return `
        <h2 class="font-heading text-gold mb-4">Customer Orders Workflow</h2>
        <div class="table-responsive">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Order #</th>
                        <th>Customer</th>
                        <th>Net Amount</th>
                        <th>Payment</th>
                        <th>Status</th>
                        <th>Update Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${orders.map(o => `
                        <tr>
                            <td class="fw-bold text-white">${o.order_number}</td>
                            <td>${o.customer_name}<br><span class="extra-small text-muted">${o.customer_phone}</span></td>
                            <td class="text-gold fw-bold">₹${Math.round(o.net_payable).toLocaleString('en-IN')}</td>
                            <td><span class="status-badge delivered">${o.payment_status}</span></td>
                            <td><span class="status-badge processing">${o.order_status}</span></td>
                            <td>
                                <select class="bg-dark text-white border-secondary rounded p-1 extra-small" onchange="handleAdminUpdateOrderStatus(${o.id}, this.value)">
                                    <option value="Processing" ${o.order_status === 'Processing' ? 'selected' : ''}>Processing</option>
                                    <option value="Shipped" ${o.order_status === 'Shipped' ? 'selected' : ''}>Shipped</option>
                                    <option value="Delivered" ${o.order_status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                                </select>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

async function handleAdminUpdateOrderStatus(id, newStatus) {
    await API.updateOrderStatus(id, newStatus);
    alert(`Order #${id} updated to ${newStatus}`);
}

/* 5. Inquiries & Leads Tab */
function renderAdminInquiriesHtml(inquiries) {
    return `
        <h2 class="font-heading text-gold mb-4">WhatsApp & Sample Quote Leads</h2>
        <div class="table-responsive">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Lead Type</th>
                        <th>Customer Name</th>
                        <th>Phone Number</th>
                        <th>Product / Sq.Ft</th>
                        <th>Timestamp</th>
                    </tr>
                </thead>
                <tbody>
                    ${inquiries.map(iq => `
                        <tr>
                            <td><span class="badge bg-gold text-dark font-bold text-uppercase">${iq.type}</span></td>
                            <td class="fw-bold text-white">${iq.name}</td>
                            <td class="text-gold">${iq.phone}</td>
                            <td>${iq.product_name || 'General Inquiry'}</td>
                            <td class="text-muted extra-small">${new Date(iq.created_at || Date.now()).toLocaleString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}
