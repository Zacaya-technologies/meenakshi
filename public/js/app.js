/* Central Client-Side Router & SPA Page Controller */

async function navigateTo(path) {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new Event('routechange'));
    await routePage();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.addEventListener('popstate', routePage);

async function routePage() {
    const mainMount = document.getElementById('app-main-content');
    if (!mainMount) return;

    const path = window.location.pathname;
    const search = window.location.search;

    // Render header/navbar if not rendered yet
    if (!document.getElementById('main-header-mount').children.length) {
        await renderNavbar();
    }

    if (path === '/' || path === '/index.html') {
        await renderHomePage(mainMount);
    } else if (path === '/shop') {
        await renderShopPage(mainMount, search);
    } else if (path.startsWith('/product/')) {
        const slug = path.replace('/product/', '');
        await renderProductDetailPage(mainMount, slug);
    } else if (path.startsWith('/category/')) {
        const slug = path.replace('/category/', '');
        await renderShopPage(mainMount, `?category=${slug}`);
    } else if (path.startsWith('/brand/')) {
        const slug = path.replace('/brand/', '');
        await renderShopPage(mainMount, `?brand=${slug}`);
    } else if (path.startsWith('/collection/')) {
        const slug = path.replace('/collection/', '');
        await renderShopPage(mainMount, `?collection=${slug}`);
    } else if (path === '/visualizer') {
        await renderRoomVisualizerPage(mainMount);
    } else if (path === '/calculator') {
        renderTileCalculatorPage(mainMount);
    } else if (path === '/compare') {
        renderComparePage(mainMount);
    } else if (path === '/cart') {
        renderCartPage(mainMount);
    } else if (path === '/wishlist') {
        await renderShopPage(mainMount, '?wishlist=1');
    } else if (path === '/customer-dash') {
        await renderCustomerDashboardPage(mainMount);
    } else if (path === '/dealer-dash') {
        await renderDealerDashboardPage(mainMount);
    } else if (path === '/admin') {
        await renderAdminPanelPage(mainMount);
    } else if (path === '/architect-zone' || path === '/bulk-orders') {
        renderArchitectZonePage(mainMount);
    } else if (path === '/blogs') {
        await renderBlogsPage(mainMount);
    } else if (path === '/brands') {
        await renderBrandsListPage(mainMount);
    } else if (path === '/collections') {
        await renderCollectionsListPage(mainMount);
    } else if (path === '/contact') {
        renderContactPage(mainMount);
    } else {
        await renderHomePage(mainMount);
    }

    initGSAPAnimations();
}

function renderArchitectZonePage(mountPoint) {
    mountPoint.innerHTML = `
        <div class="container py-5">
            <div class="p-5 rounded-4 border border-secondary border-opacity-25 bg-dark text-center" style="max-width: 800px; margin: 0 auto;">
                <span class="badge bg-gold text-dark font-bold mb-3">ARCHITECT & COMMERCIAL ZONE</span>
                <h1 class="font-heading text-gold mb-3">Bulk Quotations & Sample Spec Sheets</h1>
                <p class="text-secondary mb-4">Are you designing a villa, hotel lobby, or commercial complex? Get direct wholesale factory pricing, technical CAD drawings, and 48-hour sample box dispatch.</p>

                <form onsubmit="handleArchitectFormSubmit(event)" class="text-start">
                    <div class="row g-3 mb-3">
                        <div class="col-md-6">
                            <label class="form-label text-white small">Your Name *</label>
                            <input type="text" id="arch-name" class="form-control bg-dark text-white border-secondary" required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label text-white small">Firm / Practice Name</label>
                            <input type="text" id="arch-firm" class="form-control bg-dark text-white border-secondary">
                        </div>
                    </div>

                    <div class="row g-3 mb-3">
                        <div class="col-md-6">
                            <label class="form-label text-white small">Phone / WhatsApp *</label>
                            <input type="tel" id="arch-phone" class="form-control bg-dark text-white border-secondary" required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label text-white small">Estimated Coverage (Sq.Ft)</label>
                            <input type="number" id="arch-sqft" class="form-control bg-dark text-white border-secondary" placeholder="5000">
                        </div>
                    </div>

                    <button type="submit" class="btn btn-gold w-100 btn-lg">Submit Commercial RFQ Quote Request</button>
                </form>
            </div>
        </div>
    `;
}

async function handleArchitectFormSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('arch-name').value;
    const phone = document.getElementById('arch-phone').value;
    const sqft = document.getElementById('arch-sqft').value;

    const res = await API.submitInquiry({ type: 'bulk_quote', name, phone, estimated_sqft: sqft });
    if (res.success) {
        alert(res.message);
        navigateTo('/');
    }
}

async function renderBlogsPage(mountPoint) {
    const res = await API.getBlogs();
    const blogs = res.success ? res.blogs : [];

    mountPoint.innerHTML = `
        <div class="container py-5">
            <div class="section-header">
                <span class="section-subtitle">EDITORIAL & TRENDS</span>
                <h1 class="section-title">Meenakshi Build World Journal</h1>
            </div>

            <div class="row g-4">
                ${blogs.map(b => `
                    <div class="col-md-6">
                        <div class="p-4 rounded-4 bg-secondary bg-opacity-10 border border-secondary border-opacity-25 h-100">
                            <img src="${b.banner_url || 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80'}" class="w-100 rounded-3 mb-3" style="height: 220px; object-fit: cover;" alt="blog">
                            <span class="badge bg-gold text-dark font-bold mb-2">${b.category}</span>
                            <h3 class="font-heading text-white fs-4 mb-2">${b.title}</h3>
                            <p class="text-secondary small mb-3">${b.excerpt}</p>
                            <span class="text-gold extra-small">${b.read_time} • ${b.author}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

async function renderBrandsListPage(mountPoint) {
    const res = await API.getBrands();
    const brands = res.success ? res.brands : [];

    mountPoint.innerHTML = `
        <div class="container py-5">
            <div class="section-header">
                <span class="section-subtitle">OUR PARTNERS</span>
                <h1 class="section-title">Shop by Brand</h1>
            </div>
            <div class="row g-4">
                ${brands.map(b => `
                    <div class="col-md-4">
                        <a href="#" onclick="event.preventDefault(); navigateTo('/brand/${b.slug}');"
                           class="d-block p-4 rounded-4 bg-white border border-secondary border-opacity-25 shadow-sm text-decoration-none h-100">
                            <img src="${b.logo_url}" alt="${b.name}" class="w-100 rounded-3 mb-3" style="height: 160px; object-fit: cover;">
                            <h3 class="font-heading fs-5 text-dark mb-2">${b.name}</h3>
                            <p class="text-secondary small mb-0">${b.description || ''}</p>
                        </a>
                    </div>
                `).join('') || '<p class="text-secondary">No brands published yet.</p>'}
            </div>
        </div>
    `;
}

async function renderCollectionsListPage(mountPoint) {
    const res = await API.getCollections();
    const collections = res.success ? res.collections : [];

    mountPoint.innerHTML = `
        <div class="container py-5">
            <div class="section-header">
                <span class="section-subtitle">CURATED RANGES</span>
                <h1 class="section-title">Shop by Collection</h1>
            </div>
            <div class="row g-4">
                ${collections.map(c => `
                    <div class="col-md-6">
                        <a href="#" onclick="event.preventDefault(); navigateTo('/collection/${c.slug}');"
                           class="d-block rounded-4 overflow-hidden text-decoration-none position-relative" style="height: 280px;">
                            <img src="${c.banner_url}" alt="${c.name}" class="w-100 h-100" style="object-fit: cover;">
                            <div class="position-absolute bottom-0 start-0 w-100 p-4" style="background: linear-gradient(0deg, rgba(0,0,0,0.7), transparent);">
                                <h3 class="font-heading fs-4 text-white mb-1">${c.name}</h3>
                                <p class="text-white-50 small mb-0">${c.tagline || ''}</p>
                            </div>
                        </a>
                    </div>
                `).join('') || '<p class="text-secondary">No collections published yet.</p>'}
            </div>
        </div>
    `;
}

function renderContactPage(mountPoint) {
    mountPoint.innerHTML = `
        <div class="container py-5">
            <div class="row g-5">
                <div class="col-lg-5">
                    <span class="section-subtitle">GET IN TOUCH</span>
                    <h1 class="section-title mb-4">Contact Meenakshi Build World</h1>
                    <div class="d-flex flex-column gap-3">
                        <div class="d-flex align-items-center gap-3">
                            <div class="action-btn"><i class="ri-whatsapp-line fs-5"></i></div>
                            <div><strong>WhatsApp / Call</strong><br><span class="text-secondary">+91 98765 43210</span></div>
                        </div>
                        <div class="d-flex align-items-center gap-3">
                            <div class="action-btn"><i class="ri-mail-line fs-5"></i></div>
                            <div><strong>Sales Desk</strong><br><span class="text-secondary">sales@meenakshibuildworld.com</span></div>
                        </div>
                        <div class="d-flex align-items-center gap-3">
                            <div class="action-btn"><i class="ri-map-pin-line fs-5"></i></div>
                            <div><strong>Showroom</strong><br><span class="text-secondary">Coimbatore, Tamil Nadu, India</span></div>
                        </div>
                    </div>
                </div>
                <div class="col-lg-7">
                    <div class="p-4 rounded-4 bg-white border border-secondary border-opacity-25 shadow-sm">
                        <form onsubmit="handleArchitectFormSubmit(event)">
                            <div class="row g-3 mb-3">
                                <div class="col-md-6">
                                    <label class="form-label small fw-bold">Your Name *</label>
                                    <input type="text" id="arch-name" class="form-control" required>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label small fw-bold">Phone / WhatsApp *</label>
                                    <input type="tel" id="arch-phone" class="form-control" required>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label small fw-bold">Firm / Requirement</label>
                                <input type="text" id="arch-firm" class="form-control" placeholder="e.g. Villa flooring, 2000 sq ft">
                            </div>
                            <input type="hidden" id="arch-sqft" value="">
                            <button type="submit" class="btn btn-blue w-100">Send Enquiry</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Authentication Modal Handler
function openAuthModal(mode = 'login') {
    const email = prompt(`Sign In to Meenakshi Build World\n\nEnter Email Address:\n(Test Admin: admin@meenakshibuildworld.com | Dealer: dealer@meenakshibuildworld.com | Customer: customer@meenakshibuildworld.com)`);
    if (!email) return;

    const password = prompt('Enter Password:\n(Default Password: Password123!)');
    if (!password) return;

    API.login(email, password).then(res => {
        if (res.success) {
            AppState.setUser(res.user, res.token);
            alert(`Signed in successfully as ${res.user.name} (${res.user.role.toUpperCase()})`);
            renderNavbar();
            if (res.user.role === 'admin') navigateTo('/admin');
            else if (res.user.role === 'dealer') navigateTo('/dealer-dash');
            else navigateTo('/customer-dash');
        } else {
            alert('Authentication Failed: ' + res.message);
        }
    });
}

// Initialize application on DOM load
document.addEventListener('DOMContentLoaded', () => {
    routePage();
});
