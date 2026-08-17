/* Meenakshi Build World - Homepage Showcase & Hero Section */

async function renderHomePage(mountPoint) {
    const [productsRes, categoriesRes, brandsRes, collectionsRes] = await Promise.all([
        API.getProducts('?featured=1&limit=8'),
        API.getCategories(),
        API.getBrands(),
        API.getCollections()
    ]);

    const featuredProducts = productsRes.success ? productsRes.products : [];
    const categories = categoriesRes.success ? categoriesRes.categories.filter(c => !c.parent_id) : [];
    const brands = brandsRes.success ? brandsRes.brands : [];
    const collections = collectionsRes.success ? collectionsRes.collections : [];

    const html = `
    <!-- Luxury Hero Section -->
    <section class="hero-section">
        <div class="container">
            <div class="hero-content">
                <div class="hero-tag">
                    <i class="ri-building-4-line"></i> MEENAKSHI BUILD WORLD • ENTERPRISE SHOWROOM
                </div>
                <h1 class="hero-title">Premier Vitrified Slabs, Tiles & Sanitaryware</h1>
                <p class="hero-subtitle">Discover handcrafted marble porcelain slabs, R11 anti-skid pool pavers, Scandinavian wood planks, and designer sanitaryware for luxury residences & commercial projects.</p>

                <div class="d-flex gap-3 flex-wrap">
                    <button onclick="navigateTo('/shop')" class="btn btn-blue btn-lg">
                        <i class="ri-compass-3-line"></i> Explore Building Materials
                    </button>
                    <button onclick="navigateTo('/visualizer')" class="btn btn-outline-blue btn-lg">
                        <i class="ri-camera-lens-line"></i> 3D AR Room Visualizer
                    </button>
                </div>

                <div class="hero-stats">
                    <div>
                        <div class="stat-number">15,000+</div>
                        <div class="stat-label">Architectural Designs</div>
                    </div>
                    <div>
                        <div class="stat-number">100%</div>
                        <div class="stat-label">Certified Quality</div>
                    </div>
                    <div>
                        <div class="stat-number">48 Hr</div>
                        <div class="stat-label">Sample Box Dispatch</div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Trusted Brands Strip -->
    ${brands.length ? `
    <section class="py-4 bg-white border-top border-bottom border-secondary border-opacity-10">
        <div class="container">
            <div class="d-flex align-items-center justify-content-between flex-wrap gap-4">
                <span class="text-secondary small fw-bold text-uppercase" style="letter-spacing: 1px;">Trusted Brands</span>
                <div class="d-flex align-items-center gap-4 flex-wrap">
                    ${brands.slice(0, 6).map(b => `
                        <a href="#" onclick="event.preventDefault(); navigateTo('/brand/${b.slug}');" class="d-flex align-items-center gap-2 text-decoration-none" title="${b.name}">
                            <img src="${b.logo_url}" alt="${b.name}" style="width: 32px; height: 32px; object-fit: cover; border-radius: 8px;">
                            <span class="text-dark small fw-semibold">${b.name}</span>
                        </a>
                    `).join('')}
                </div>
                <a href="#" onclick="event.preventDefault(); navigateTo('/brands');" class="text-blue small fw-bold text-decoration-none">All Brands <i class="ri-arrow-right-line"></i></a>
            </div>
        </div>
    </section>
    ` : ''}

    <!-- Categories Grid Showcase — pulled straight from the categories table.
         Add a category in the admin panel and it appears here automatically. -->
    <section class="py-5">
        <div class="container">
            <div class="section-header">
                <span class="section-subtitle">BUILDING MATERIALS CATALOG</span>
                <h2 class="section-title">Shop by Category</h2>
            </div>

            <div class="row g-4">
                ${categories.slice(0, 8).map(c => `
                    <div class="col-md-3 col-6">
                        <div class="position-relative rounded-4 overflow-hidden border border-secondary border-opacity-25 cursor-pointer product-card" onclick="navigateTo('/category/${c.slug}')" style="height: 200px;">
                            <img src="${c.banner_url || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80'}" class="w-100 h-100" style="object-fit: cover;" alt="${c.name}">
                            <div class="position-absolute inset-0 p-3 d-flex flex-column justify-content-end" style="background: linear-gradient(180deg, transparent 0%, rgba(30,41,59,0.85) 100%);">
                                <h3 class="font-heading text-white fs-6 mb-0">${c.name}</h3>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>

            ${categories.length > 8 ? `
                <div class="text-center mt-4">
                    <button onclick="navigateTo('/shop')" class="btn btn-outline-blue">View All ${categories.length} Categories</button>
                </div>
            ` : ''}
        </div>
    </section>

    <!-- Curated Collections -->
    ${collections.length ? `
    <section class="py-5">
        <div class="container">
            <div class="section-header">
                <span class="section-subtitle">CURATED RANGES</span>
                <h2 class="section-title">Shop by Collection</h2>
            </div>
            <div class="row g-4">
                ${collections.slice(0, 3).map(c => `
                    <div class="col-md-4">
                        <a href="#" onclick="event.preventDefault(); navigateTo('/collection/${c.slug}');" class="d-block rounded-4 overflow-hidden text-decoration-none position-relative" style="height: 220px;">
                            <img src="${c.banner_url}" alt="${c.name}" class="w-100 h-100" style="object-fit: cover;">
                            <div class="position-absolute bottom-0 start-0 w-100 p-3" style="background: linear-gradient(0deg, rgba(0,0,0,0.75), transparent);">
                                <h3 class="font-heading fs-5 text-white mb-0">${c.name}</h3>
                                <span class="text-white-50 small">${c.tagline || ''}</span>
                            </div>
                        </a>
                    </div>
                `).join('')}
            </div>
        </div>
    </section>
    ` : ''}

    <!-- Featured Products Section -->
    <section class="py-5 bg-white">
        <div class="container">
            <div class="section-header">
                <span class="section-subtitle">FEATURED COLLECTION</span>
                <h2 class="section-title">Italian Vitrified Slabs & Designer Tiles</h2>
            </div>

            <div class="product-grid">
                ${featuredProducts.map(p => `
                    <div class="product-card">
                        <span class="product-badge">MEENAKSHI SELECT</span>
                        <div class="product-img-wrapper cursor-pointer" onclick="navigateTo('/product/${p.slug}')">
                            <img src="${p.primary_image || 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80'}" alt="${p.name}">
                        </div>
                        <div class="product-info">
                            <div class="product-meta">
                                <span>${p.material || 'Vitrified'}</span>
                                <span>${p.tile_size}</span>
                            </div>
                            <a href="/product/${p.slug}" onclick="event.preventDefault(); navigateTo('/product/${p.slug}');" class="product-title">${p.name}</a>
                            
                            <div class="product-price-row">
                                <div>
                                    <span class="price-current">₹${p.offer_price || p.price}</span>
                                    ${p.offer_price ? `<span class="price-original">₹${p.price}</span>` : ''}
                                    <span class="unit-label">/ sq.ft</span>
                                </div>
                                <button class="btn btn-blue btn-sm" onclick="AppState.addToCart(${JSON.stringify(p).replace(/"/g, '&quot;')}, 1)">
                                    + Add Box
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    </section>

    <!-- Interactive Room Visualizer Banner CTA -->
    <section class="py-5 container">
        <div class="p-5 rounded-4 border border-secondary border-opacity-25 bg-white" style="background: linear-gradient(135deg, rgba(39, 181, 247, 0.08) 0%, rgba(22, 159, 239, 0.15) 100%);">
            <div class="row align-items-center">
                <div class="col-lg-7">
                    <span class="badge bg-blue text-white font-bold mb-3">3D AR ROOM VISUALIZER</span>
                    <h2 class="font-heading fs-1 text-dark mb-3">Visualize Tiles Live in Real Room Settings</h2>
                    <p class="text-secondary fs-5 mb-4">Select living foyers, spa bathrooms, or kitchen backsplashes and test tile patterns instantly with high-definition lighting.</p>
                    <button onclick="navigateTo('/visualizer')" class="btn btn-blue btn-lg"><i class="ri-camera-lens-line"></i> Launch Room Visualizer Studio</button>
                </div>
                <div class="col-lg-5 text-center mt-4 mt-lg-0">
                    <img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80" class="img-fluid rounded-4 shadow-lg border border-blue" alt="AR studio">
                </div>
            </div>
        </div>
    </section>
    `;

    mountPoint.innerHTML = html;
}
