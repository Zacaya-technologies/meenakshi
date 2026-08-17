/* Meenakshi Build World - Product Catalog, Filter Sidebar & Premium Cards
   Shop listing is rendered below the (push-down) mega menu, never immediately
   under the navbar. Sidebar = sticky, collapsible accordions with per-group
   search. Product cards = premium cards with quick view / wishlist / compare /
   rating / MRP strike / discount badge / add to cart / buy now. */

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=400&q=80';

const MBW_SHOP = {
    products: {},
    register(list) {
        (list || []).forEach(p => { this.products[p.slug] = p; });
    },
    escAttr(s) {
        return String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    },
    toggleFac(head) {
        const body = head.nextElementSibling;
        head.classList.toggle('mbw-fac-open');
        body.classList.toggle('mbw-fac-open');
    },
    filterFacet(input, param) {
        const q = input.value.trim().toLowerCase();
        const list = document.getElementById('fac-' + param);
        if (!list) return;
        list.querySelectorAll('li').forEach(li => {
            li.style.display = li.textContent.toLowerCase().includes(q) ? '' : 'none';
        });
    },
    toggleFilterValue(param, value, checked) {
        const sp = new URLSearchParams(window.location.search);
        let values = sp.getAll(param).filter(v => v !== value);
        if (checked) values.push(value);
        sp.delete(param);
        values.forEach(v => sp.append(param, v));
        navigateTo('/shop?' + sp.toString());
    },
    wish(slug) {
        const p = this.products[slug];
        if (!p) return;
        AppState.toggleWishlist(p);
        const btn = document.querySelector(`[data-wish="${slug}"]`);
        btn?.classList.toggle('mbw-icon-on');
    },
    compare(slug) {
        const p = this.products[slug];
        if (!p) return;
        AppState.toggleCompare(p);
        const btn = document.querySelector(`[data-compare="${slug}"]`);
        btn?.classList.toggle('mbw-icon-on');
    },
    addCart(slug) {
        const p = this.products[slug];
        if (!p) return;
        AppState.addToCart(p, 1);
        AppState.updateBadgeCounts();
    },
    buyNow(slug) {
        const p = this.products[slug];
        if (!p) return;
        AppState.addToCart(p, 1);
        AppState.updateBadgeCounts();
        navigateTo('/cart');
    },
    quickView(slug) {
        const wrap = document.getElementById('mbw-qv-root');
        if (!wrap) {
            const div = document.createElement('div');
            div.id = 'mbw-qv-root';
            document.body.appendChild(div);
        }
        const root = document.getElementById('mbw-qv-root');
        root.innerHTML = `
            <div class="mbw-modal-backdrop" onclick="MBW_SHOP.closeQuickView()">
                <div class="mbw-modal" onclick="event.stopPropagation()">
                    <button class="mbw-modal-close" onclick="MBW_SHOP.closeQuickView()"><i class="ri-close-fill"></i></button>
                    <div class="mbw-modal-loading">Loading product…</div>
                </div>
            </div>`;
        API.getProductBySlug(slug).then(res => {
            if (!res.success || !res.product) {
                root.querySelector('.mbw-modal-loading').innerHTML = 'Product unavailable.';
                return;
            }
            const p = res.product;
            const img = (res.images && res.images[0]?.image_url) || p.primary_image || FALLBACK_IMG;
            const rating = p.rating_avg || 4.8;
            root.querySelector('.mbw-modal').innerHTML = `
                <button class="mbw-modal-close" onclick="MBW_SHOP.closeQuickView()"><i class="ri-close-fill"></i></button>
                <div class="mbw-modal-grid">
                    <div class="mbw-modal-img">
                        <img src="${this.escAttr(img)}" alt="${this.escAttr(p.name)}">
                    </div>
                    <div class="mbw-modal-info">
                        <div class="mbw-card-meta"><span>${this.escAttr(p.material || 'Vitrified')}</span><span>${this.escAttr(p.tile_size)}</span></div>
                        <h3 class="mbw-modal-title">${this.escAttr(p.name)}</h3>
                        <div class="mbw-rating">${MBW_SHOP.stars(rating)}<em>(${rating})</em></div>
                        <p class="mbw-modal-desc">${this.escAttr((p.description || '').slice(0, 220))}…</p>
                        <div class="mbw-price-row">
                            <span class="mbw-price">₹${p.offer_price || p.price}</span>
                            ${p.offer_price ? `<span class="mbw-mrp">₹${p.price}</span>` : ''}
                            <span class="mbw-unit">/ sq.ft</span>
                        </div>
                        ${p.stock > 0 ? '<span class="mbw-stock"><i class="ri-checkbox-circle-fill"></i> In Stock</span>' : '<span class="mbw-stock mbw-stock-out">Out of Stock</span>'}
                        <div class="mbw-modal-btns">
                            <button class="btn btn-blue" onclick="MBW_SHOP.addCart('${p.slug}')"><i class="ri-shopping-bag-line"></i> Add to Cart</button>
                            <button class="btn btn-outline-blue" onclick="MBW_SHOP.buyNow('${p.slug}')">Buy Now</button>
                            <button class="btn btn-outline-blue" onclick="event.preventDefault(); MBW_SHOP.closeQuickView(); navigateTo('/product/${p.slug}')">Full Details</button>
                        </div>
                    </div>
                </div>`;
        });
    },
    closeQuickView() {
        document.getElementById('mbw-qv-root')?.remove();
    },
    stars(r) {
        const val = Math.max(0, Math.min(5, Math.round(Number(r) || 0)));
        return '<span class="mbw-stars">' + '★'.repeat(val) + '☆'.repeat(5 - val) + '</span>';
    }
};

function esc(s) { return MBW_SHOP.escAttr(s); }

function breadcrumbHtml(categoryName, isWishlist) {
    return `
    <nav class="mbw-crumb" aria-label="breadcrumb">
        <a href="/" onclick="event.preventDefault(); navigateTo('/');">Home</a>
        <i class="ri-arrow-right-s-line"></i>
        ${categoryName && categoryName !== 'All Products' ? `
            <a href="/shop" onclick="event.preventDefault(); navigateTo('/shop');">Shop</a>
            <i class="ri-arrow-right-s-line"></i>
            <span>${esc(categoryName)}</span>
        ` : `<span>${isWishlist ? 'Wishlist' : 'All Products'}</span>`}
    </nav>`;
}

function filterGroup(title, icon, param, items, activeValues, opts = {}) {
    if (!items || !items.length) return '';
    const checked = v => activeValues.includes(v);
    const defaultOpen = opts.defaultOpen !== false;
    return `
        <div class="mbw-fac-group">
            <button class="mbw-fac-head ${defaultOpen ? 'mbw-fac-open' : ''}" onclick="MBW_SHOP.toggleFac(this)">
                <span><i class="${icon}"></i> ${title}</span><i class="ri-arrow-down-s-line"></i>
            </button>
            <div class="mbw-fac-body ${defaultOpen ? 'mbw-fac-open' : ''}">
                ${opts.searchable !== false ? `
                    <input class="mbw-fac-search" placeholder="Search ${title.toLowerCase()}…" oninput="MBW_SHOP.filterFacet(this, '${param}')">
                ` : ''}
                <ul class="mbw-fac-list" id="fac-${param}">
                    ${items.map(v => {
                        const safe = esc(v);
                        return `<li>
                            <label class="filter-checkbox">
                                <input type="checkbox" ${checked(v) ? 'checked' : ''} onchange="MBW_SHOP.toggleFilterValue('${param}', '${encodeURIComponent(v)}', this.checked)">
                                <span>${safe}</span>
                            </label>
                        </li>`;
                    }).join('')}
                </ul>
            </div>
        </div>`;
}

function productCard(p) {
    const discount = (p.offer_price && p.price > p.offer_price)
        ? Math.round((1 - p.offer_price / Math.max(p.price, 0.01)) * 100) : 0;
    const img = p.primary_image || FALLBACK_IMG;
    return `
    <div class="mbw-card">
        <div class="mbw-card-media">
            <a class="mbw-card-img" href="/product/${p.slug}" onclick="event.preventDefault(); navigateTo('/product/${p.slug}');">
                <img src="${esc(img)}" alt="${esc(p.name)}" loading="lazy">
            </a>
            ${discount ? `<span class="mbw-discount">-${discount}%</span>` : ''}
            ${p.is_featured ? '<span class="mbw-badge">MEENAKSHI SELECT</span>' : ''}
            <div class="mbw-card-actions">
                <button title="Quick View" onclick="MBW_SHOP.quickView('${p.slug}')"><i class="ri-eye-line"></i></button>
                <button title="Compare" data-compare="${p.slug}" onclick="MBW_SHOP.compare('${p.slug}')"><i class="ri-scales-line"></i></button>
                <button title="Wishlist" data-wish="${p.slug}" onclick="MBW_SHOP.wish('${p.slug}')"><i class="ri-heart-line"></i></button>
            </div>
        </div>
        <div class="mbw-card-body">
            <div class="mbw-card-meta"><span>${esc(p.material || 'Vitrified')}</span><span>${esc(p.tile_size)}</span></div>
            <a class="mbw-card-title" href="/product/${p.slug}" onclick="event.preventDefault(); navigateTo('/product/${p.slug}');">${esc(p.name)}</a>
            <div class="mbw-rating">${MBW_SHOP.stars(p.rating_avg)}<em>${p.rating_avg || ''}</em></div>
            <div class="mbw-price-row">
                <span class="mbw-price">₹${p.offer_price || p.price}</span>
                ${p.offer_price ? `<span class="mbw-mrp">₹${p.price}</span>` : ''}
                <span class="mbw-unit">/ sq.ft</span>
            </div>
            <div class="mbw-card-btns">
                <button class="mbw-btn-add" onclick="MBW_SHOP.addCart('${p.slug}')"><i class="ri-shopping-bag-line"></i> Add</button>
                <button class="mbw-btn-buy" onclick="MBW_SHOP.buyNow('${p.slug}')">Buy Now</button>
            </div>
        </div>
    </div>`;
}

async function renderShopPage(mountPoint, queryString = '') {
    const searchParams = new URLSearchParams(queryString);
    const activeCategory = searchParams.get('category') || '';
    const isWishlist = searchParams.get('wishlist') === '1';

    const [productsRes, facetsRes] = await Promise.all([
        API.getProducts(queryString),
        API.getFacets(activeCategory)
    ]);

    const products = productsRes.success ? productsRes.products : [];
    const pagination = productsRes.pagination || { total: 0, page: 1, pages: 1 };
    const facets = facetsRes.success ? facetsRes : null;
    MBW_SHOP.register(products);

    const activeMaterials = searchParams.getAll('material');
    const activeFinishes = searchParams.getAll('finish');
    const activeColors = searchParams.getAll('color');
    const activePatterns = searchParams.getAll('pattern');
    const activeSizes = searchParams.getAll('size');
    const activeAreas = searchParams.getAll('area');
    const activeBrands = searchParams.getAll('brand');
    const activeMaxPrice = searchParams.get('max_price');
    const activeInStock = searchParams.get('in_stock');

    const activeFilterCount = [activeCategory, ...activeMaterials, ...activeFinishes, ...activeColors, ...activePatterns, ...activeSizes, ...activeAreas, ...activeBrands, activeMaxPrice, activeInStock].filter(Boolean).length;

    const categoryName = activeCategory
        ? (facets?.categories?.find(c => c.slug === activeCategory)?.name || 'Building Materials')
        : 'All Products';

    const priceRange = facets?.priceRange || { min: 0, max: 500 };
    const activePrice = activeMaxPrice || priceRange.max;

    const html = `
    <div class="mbw-shop container py-4">
        ${breadcrumbHtml(categoryName, isWishlist)}

        <div class="mbw-shop-head">
            <div>
                <h1 class="mbw-shop-title">${isWishlist ? 'My Wishlist' : esc(categoryName)}</h1>
                <p class="mbw-shop-count">${isWishlist ? '' : `<strong>${pagination.total}</strong> products found`}</p>
            </div>
            <div class="mbw-shop-sort">
                <label>Sort By:</label>
                <select class="mbw-sort-select" onchange="updateCatalogSort(this.value)">
                    <option value="">Featured</option>
                    <option value="price_asc" ${searchParams.get('sort') === 'price_asc' ? 'selected' : ''}>Price: Low to High</option>
                    <option value="price_desc" ${searchParams.get('sort') === 'price_desc' ? 'selected' : ''}>Price: High to Low</option>
                    <option value="rating" ${searchParams.get('sort') === 'rating' ? 'selected' : ''}>Customer Rating</option>
                    <option value="popular" ${searchParams.get('sort') === 'popular' ? 'selected' : ''}>Most Popular</option>
                </select>
            </div>
        </div>

        <div class="mbw-shop-layout">
            <!-- Sticky filter sidebar -->
            <aside class="mbw-sidebar">
                <div class="mbw-sidebar-card">
                    <div class="mbw-sidebar-top">
                        <h4><i class="ri-filter-3-line"></i> Filters ${activeFilterCount ? `<span class="mbw-fcount">${activeFilterCount}</span>` : ''}</h4>
                        <a href="#" onclick="event.preventDefault(); navigateTo('/shop');">Reset All</a>
                    </div>

                    <div class="mbw-fac-group">
                        <button class="mbw-fac-head mbw-fac-open" onclick="MBW_SHOP.toggleFac(this)">
                            <span><i class="ri-shapes-line"></i> Category</span><i class="ri-arrow-down-s-line"></i>
                        </button>
                        <div class="mbw-fac-body mbw-fac-open">
                            <ul class="mbw-fac-list">
                                ${(facets?.categories || []).map(c => `
                                    <li><label class="filter-checkbox">
                                        <input type="radio" name="mbw-cat" ${activeCategory === c.slug ? 'checked' : ''} onchange="applyShopFilter('category', '${c.slug}')">
                                        <span>${esc(c.name)}</span>
                                    </label></li>
                                `).join('') || '<li class="mbw-fac-empty">No categories</li>'}
                            </ul>
                        </div>
                    </div>

                    ${filterGroup('Material / Type', 'ri-stack-line', 'material', facets?.materials, activeMaterials)}
                    ${filterGroup('Surface Finish', 'ri-sparkles-line', 'finish', facets?.finishes, activeFinishes)}
                    ${filterGroup('Design', 'ri-palette-line', 'pattern', facets?.patterns, activePatterns)}
                    ${filterGroup('Color', 'ri-contrast-2-line', 'color', facets?.colors, activeColors)}
                    ${filterGroup('Tile Size', 'ri-ruler-line', 'size', facets?.sizes, activeSizes)}
                    ${filterGroup('Application', 'ri-map-pin-line', 'area', facets?.applications, activeAreas)}

                    ${(facets?.brands || []).length ? `
                    <div class="mbw-fac-group">
                        <button class="mbw-fac-head" onclick="MBW_SHOP.toggleFac(this)">
                            <span><i class="ri-award-line"></i> Brand</span><i class="ri-arrow-down-s-line"></i>
                        </button>
                        <div class="mbw-fac-body">
                            <input class="mbw-fac-search" placeholder="Search brands…" oninput="MBW_SHOP.filterFacet(this, 'brand')">
                            <ul class="mbw-fac-list" id="fac-brand">
                                ${(facets?.brands || []).map(b => `
                                    <li><label class="filter-checkbox">
                                        <input type="checkbox" ${activeBrands.includes(b.slug) ? 'checked' : ''} onchange="MBW_SHOP.toggleFilterValue('brand', '${b.slug}', this.checked)">
                                        <span>${esc(b.name)}</span>
                                    </label></li>
                                `).join('')}
                            </ul>
                        </div>
                    </div>` : ''}

                    <div class="mbw-fac-group">
                        <button class="mbw-fac-head mbw-fac-open" onclick="MBW_SHOP.toggleFac(this)">
                            <span><i class="ri-check-double-line"></i> Availability</span><i class="ri-arrow-down-s-line"></i>
                        </button>
                        <div class="mbw-fac-body mbw-fac-open">
                            <ul class="mbw-fac-list">
                                <li><label class="filter-checkbox">
                                    <input type="radio" name="mbw-avail" ${activeInStock ? 'checked' : ''} onchange="applyShopFilter('in_stock', '1')">
                                    <span>In Stock Only</span>
                                </label></li>
                            </ul>
                        </div>
                    </div>

                    <div class="mbw-fac-group">
                        <button class="mbw-fac-head mbw-fac-open" onclick="MBW_SHOP.toggleFac(this)">
                            <span><i class="ri-price-tag-3-line"></i> Price (₹/sq.ft)</span><i class="ri-arrow-down-s-line"></i>
                        </button>
                        <div class="mbw-fac-body mbw-fac-open">
                            <input type="range" min="${priceRange.min}" max="${priceRange.max}" step="5"
                                   value="${activePrice}" class="w-100 mbw-range"
                                   oninput="this.nextElementSibling.innerText = '₹' + this.value"
                                   onchange="applyShopFilter('max_price', this.value)">
                            <div class="mbw-range-val">₹${activePrice}</div>
                        </div>
                    </div>
                </div>
            </aside>

            <!-- Products grid -->
            <section class="mbw-products">
                ${isWishlist && !products.length ? `
                    <div class="mbw-empty">
                        <i class="ri-heart-line"></i>
                        <h3>Your wishlist is empty</h3>
                        <button class="btn btn-blue" onclick="navigateTo('/shop')">Browse Tiles</button>
                    </div>` : products.length ? `
                    <div class="mbw-grid">
                        ${products.map(productCard).join('')}
                    </div>
                    <div class="mbw-pagination">
                        ${pagination.pages > 1 ? `
                            <button class="btn btn-outline-blue btn-sm" ${pagination.page <= 1 ? 'disabled' : ''} onclick="goToPage(${pagination.page - 1})"><i class="ri-arrow-left-line"></i> Prev</button>
                            <span>Page ${pagination.page} of ${pagination.pages}</span>
                            <button class="btn btn-outline-blue btn-sm" ${pagination.page >= pagination.pages ? 'disabled' : ''} onclick="goToPage(${pagination.page + 1})">Next <i class="ri-arrow-right-line"></i></button>
                        ` : ''}
                    </div>` : `
                    <div class="mbw-empty">
                        <i class="ri-search-line"></i>
                        <h3>No products match the selected filters</h3>
                        <button class="btn btn-blue" onclick="navigateTo('/shop')">Clear Filters</button>
                    </div>`}
            </section>
        </div>
    </div>
    `;

    mountPoint.innerHTML = html;
}

function goToPage(page) {
    const sp = new URLSearchParams(window.location.search);
    sp.set('page', page);
    navigateTo('/shop?' + sp.toString());
}

function applyShopFilter(param, value) {
    const sp = new URLSearchParams(window.location.search);
    if (value) sp.set(param, value);
    else sp.delete(param);
    navigateTo('/shop?' + sp.toString());
}

function updateCatalogSort(val) {
    applyShopFilter('sort', val);
}