/* Meenakshi Build World - Redesigned Desktop Navigation & Mega Menu
   Matches the MyTyles interaction pattern:
   - A full-width dark mega menu that PUSHES the page content downward
     (position: relative + animated height, NOT an absolute overlay).
   - Hovering a nav item swaps the panel content in place without closing it.
   - The panel stays sticky, is always below the nav, and never overlaps.
   All data is database-driven via /api/v1/menu and /api/v1/menu/:slug. */

const CATEGORY_ICONS = {
    'all-products': 'ri-grid-2-line',
    'floor-tiles': 'ri-layout-grid-line',
    'wall-tiles': 'ri-brush-4-line',
    'bathroom': 'ri-drop-line',
    'kitchen': 'ri-restaurant-2-line',
    'outdoor': 'ri-plant-line',
    'parking': 'ri-parking-box-line',
    'elevation': 'ri-building-4-line',
    'marble': 'ri-gem-line',
    'granite': 'ri-landscape-line',
    'sanitaryware': 'ri-water-flash-line',
    'bath-fittings': 'ri-showers-line'
};
function iconForCategory(slug) {
    return CATEGORY_ICONS[slug] || 'ri-shapes-line';
}

const MEGA = {
    cache: {},       // slug -> { category, columns, latestProducts, recommendedProducts }
    activeSlug: null,
    isOpen: false
};

const ALL_PRODUCTS_SLUG = 'all-products';
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=400&q=80';

function megaNode() {
    return {
        panel: document.getElementById('mbPanel'),
        inner: document.getElementById('mbPanelInner'),
        grid: document.getElementById('mbGrid'),
        row: document.getElementById('mbRow')
    };
}

async function preloadMegaMenus(items) {
    await Promise.all(items.map(async it => {
        if (MEGA.cache[it.slug]) return;
        const r = await API.getCategoryMenu(it.slug);
        if (r.success) MEGA.cache[it.slug] = r;
    }));
}

/* ------------------------------------------------------------------ *
 *  Navigation actions (SPA, no reload). 
 * ------------------------------------------------------------------ */
function megaNav(path) {
    closeMega();
    navigateTo(path);
}

function megaFilter(slug, param, value) {
    const q = new URLSearchParams();
    if (slug !== ALL_PRODUCTS_SLUG) q.set('category', slug);
    q.append(param, value);
    closeMega();
    navigateTo('/shop?' + q.toString());
}

function megaViewAll(slug, catName) {
    closeMega();
    if (slug === ALL_PRODUCTS_SLUG) navigateTo('/shop');
    else navigateTo('/category/' + slug);
}

/* ------------------------------------------------------------------ *
 *  Mega menu open / close with in-flow height animation.
 *  Open:  opacity + translateY(-10px) -> 0, 250ms ease-out.
 *  Close: 0 -> translateY(-10px), 180ms.
 * ------------------------------------------------------------------ */
let closeTimer = null;

function setPanelHeight() {
    const n = megaNode();
    if (n.panel && n.inner) n.panel.style.height = n.inner.scrollHeight + 'px';
}

function openMega(slug, catName) {
    cancelMegaClose();
    renderMegaContent(slug, catName);
    MEGA.activeSlug = slug;
    MEGA.isOpen = true;

    const n = megaNode();
    if (!n.panel) return;
    // Re-time the swap-in fade even when the panel is already open.
    n.panel.dataset.open = 'true';
    n.inner.classList.remove('mb-panel-swap');
    void n.inner.offsetWidth;
    n.inner.classList.add('mb-panel-swap');

    setPanelHeight();
}

function renderMegaContent(slug, catName) {
    const node = megaNode();
    const grid = node.grid;
    if (!grid) return;

    const data = MEGA.cache[slug];
    if (!data) {
        grid.innerHTML = `<div class="mb-panel-loading"><span class="mb-spinner"></span> Loading ${catName}…</div>`;
        API.getCategoryMenu(slug).then(r => {
            if (r.success) {
                MEGA.cache[slug] = r;
                if (MEGA.activeSlug === slug) {
                    renderMegaContent(slug, catName);
                    setPanelHeight();
                }
            }
        });
        return;
    }

    const label = MEGA.cache[slug]?.category?.name || catName || slug;
    const columns = data.columns || {};

    const columnDefs = [
        { title: 'Tiles By Space',  icon: 'ri-map-pin-line',     items: columns.bySpace,  param: 'area' },
        { title: 'Tiles By Size',   icon: 'ri-ruler-line',      items: columns.bySize,     param: 'size' },
        { title: 'Tiles By Design', icon: 'ri-palette-line',    items: columns.byDesign,    param: 'pattern' },
        { title: 'Tiles By Type',   icon: 'ri-stack-line',      items: columns.byType,      param: 'material' },
        { title: 'Tiles By Color',  icon: 'ri-contrast-2-line', items: columns.byColor,     param: 'color' }
    ];

    const facetColumns = columnDefs.map((col, idx) => `
        <div class="mb-facet-col">
            ${idx === 0 ? `
                <a href="#" class="mb-view-all" onclick="event.preventDefault(); megaViewAll('${slug}', '${label.replace(/'/g, "\\'")}');">
                    <i class="ri-apps-2-line"></i> View All <span>${label.replace(/'/g, "\\'")}</span>
                </a>
            ` : ''}
            <h4 class="mb-col-title"><i class="${col.icon}"></i> ${col.title}</h4>
            <ul class="mb-links">
                ${(col.items || []).map(v => {
                    const safe = String(v).replace(/'/g, "\\'");
                    return `<li><a href="#" onclick="event.preventDefault(); megaFilter('${slug}', '${col.param}', '${safe}');">${v}</a></li>`;
                }).join('') || `<li class="mb-link-empty">Coming soon</li>`}
            </ul>
        </div>
    `).join('');

    grid.innerHTML = facetColumns;
}

function closeMega() {
    cancelMegaClose();
    if (!MEGA.isOpen) return;
    MEGA.isOpen = false;

    const node = megaNode();
    if (!node.panel) return;
    node.panel.dataset.open = 'false';
    node.panel.style.height = node.inner.scrollHeight + 'px';
    void node.panel.offsetHeight;
    node.panel.style.height = '0px';
}

function scheduleMegaClose() {
    cancelMegaClose();
    closeTimer = setTimeout(closeMega, 180);
}

function cancelMegaClose() {
    clearTimeout(closeTimer);
    closeTimer = null;
}

/* ------------------------------------------------------------------ *
 *  Mobile full-screen drawer (replaces the mega menu on small screens).
 * ------------------------------------------------------------------ */
function openMobileMenu() {
    preloadMegaMenus([]);
    buildDrawer();
    document.getElementById('mbDrawer')?.classList.add('mb-drawer-open');
    document.body.classList.add('mb-drawer-locked');
}

function closeMobileMenu() {
    document.getElementById('mbDrawer')?.classList.remove('mb-drawer-open');
    document.body.classList.remove('mb-drawer-locked');
}

function buildDrawer() {
    const list = document.getElementById('mbDrawerCats');
    if (!list || list.dataset.built) return;
    list.dataset.built = '1';
    list.innerHTML = `
        <div class="mb-drawer-cat">
            <button class="mb-drawer-cat-head" onclick="toggleDrawerAccum(this,'all-products')">
                <span><i class="${iconForCategory(ALL_PRODUCTS_SLUG)}"></i> All Products</span>
                <i class="ri-arrow-down-s-line"></i>
            </button>
            <div class="mb-drawer-cat-body"></div>
        </div>
        ${(window.__mbMenu || []).map(c => `
            <div class="mb-drawer-cat">
                <button class="mb-drawer-cat-head" onclick="toggleDrawerAccum(this,'${c.slug}')">
                    <span><i class="${iconForCategory(c.slug)}"></i> ${c.name}</span>
                    <i class="ri-arrow-down-s-line"></i>
                </button>
                <div class="mb-drawer-cat-body"></div>
            </div>
        `).join('')}
    `;
}

function toggleDrawerAccum(btn, slug) {
    const catBody = btn.nextElementSibling;
    const isOpen = btn.classList.contains('mb-drawer-cat-open');
    // Close siblings
    btn.closest('#mbDrawerCats').querySelectorAll('.mb-drawer-cat').forEach(c => {
        c.querySelector('.mb-drawer-cat-head')?.classList.remove('mb-drawer-cat-open');
        c.querySelector('.mb-drawer-cat-body')?.classList.remove('mb-drawer-cat-open');
    });
    if (isOpen) return;

    btn.classList.add('mb-drawer-cat-open');
    catBody.classList.add('mb-drawer-cat-open');

    const data = MEGA.cache[slug];
    if (data && !catBody.dataset.built) {
        catBody.dataset.built = '1';
        catBody.innerHTML = drawerFacets(slug);
    } else if (!data && !catBody.dataset.built) {
        catBody.innerHTML = `<div class="mb-panel-loading">Loading…</div>`;
        API.getCategoryMenu(slug).then(r => {
            if (r.success) {
                MEGA.cache[slug] = r;
                if (!catBody.dataset.built) {
                    catBody.dataset.built = '1';
                    catBody.innerHTML = drawerFacets(slug);
                }
            }
        });
    } else if (catBody.dataset.built) {
        catBody.innerHTML = drawerFacets(slug);
    }
}

function drawerFacets(slug) {
    const data = MEGA.cache[slug];
    if (!data) return '<div class="mb-panel-loading">Loading…</div>';
    const name = data.category?.name || 'All Products';
    const cols = data.columns || {};
    const groups = [
        { title: 'Space', param: 'area',        items: cols.bySpace },
        { title: 'Size',  param: 'size',       items: cols.bySize },
        { title: 'Design',param: 'pattern',    items: cols.byDesign },
        { title: 'Type',  param: 'material',   items: cols.byType },
        { title: 'Color', param: 'color',      items: cols.byColor }
    ];
    return `
        <a class="mb-drawer-viewall" href="#" onclick="event.preventDefault(); closeMobileMenu(); megaViewAll('${slug}', '${name}');">View All ${name}</a>
        ${groups.filter(g => (g.items || []).length).map(g => `
            <div class="mb-drawer-group">
                <div class="mb-drawer-group-title">${g.title}</div>
                ${(g.items || []).map(it => `
                    <a class="mb-drawer-link" href="#" onclick="event.preventDefault(); closeMobileMenu(); megaFilter('${slug}', '${g.param}', '${String(it).replace(/'/g, "\\'")}');">${it}</a>
                `).join('')}
            </div>
        `).join('')}
    `;
}

/* ------------------------------------------------------------------ *
 *  Render the full header.
 * ------------------------------------------------------------------ */
async function renderNavbar() {
    const navContainer = document.getElementById('main-header-mount');
    if (!navContainer) return;

    const res = await API.getMenu();
    const topNav = res.success ? res.topNav : [];
    window.__mbMenu = topNav;
    const user = AppState.user;

    const navHtml = `
    <!-- Top Utility Bar (scrolls away) -->
    <div class="top-bar">
        <div class="container top-bar-inner">
            <div class="top-contacts">
                <span><i class="ri-whatsapp-fill text-blue"></i> WhatsApp: <strong>+91 98765 43210</strong></span>
                <span class="d-none d-md-inline"><i class="ri-phone-fill text-blue"></i> Sales: <strong>+91 98765 43210</strong></span>
                <span class="d-none d-lg-inline"><i class="ri-mail-fill text-blue"></i> <strong>sales@meenakshibuildworld.com</strong></span>
            </div>
            <div class="top-links">
                ${user ? `
                    <span class="text-blue">Hi, <strong>${user.name}</strong></span>
                    <a href="#" onclick="navigateTo('${user.role === 'admin' ? '/admin' : user.role === 'dealer' ? '/dealer-dash' : '/customer-dash'}')" class="top-link ms-3">Dashboard</a>
                    <a href="#" onclick="AppState.logout()" class="top-link ms-2"><i class="ri-logout-box-r-line"></i> Logout</a>
                ` : `
                    <a href="#" onclick="openAuthModal('login')" class="top-link"><i class="ri-user-line"></i> Dealer Login</a>
                `}
            </div>
        </div>
    </div>

    <!-- Sticky Header Unit (header row + second nav row + mega panel) -->
    <div class="mb-sticky">
        <div class="mb-header-row">
            <button class="mb-hamburger" onclick="openMobileMenu()" aria-label="Open menu"><i class="ri-menu-3-fill"></i></button>

            <a href="/" class="brand-logo" onclick="event.preventDefault(); navigateTo('/');">
                <div class="logo-icon">M</div>
                <div class="logo-text">
                    MEENAKSHI
                    <span class="logo-subtext">BUILD WORLD</span>
                </div>
            </a>

            <div class="header-search d-none d-lg-flex">
                <input type="text" placeholder="Search tiles, marble, sanitaryware, SKU..." onclick="toggleSearchModal()" readonly>
                <button class="header-search-btn" onclick="toggleSearchModal()"><i class="ri-search-line"></i></button>
            </div>

            <div class="mb-actions">
                <button class="action-btn d-lg-none" onclick="toggleSearchModal()" title="Search"><i class="ri-search-line fs-5"></i></button>
                <button class="action-btn" onclick="navigateTo('/compare')" title="Compare"><i class="ri-scales-line fs-5"></i></button>
                <button class="action-btn" onclick="navigateTo('/wishlist')" title="Wishlist">
                    <i class="ri-heart-line fs-5"></i>
                    <span class="badge-count" id="wishlist-count-badge">0</span>
                </button>
                <button class="action-btn" onclick="navigateTo('/cart')" title="Cart">
                    <i class="ri-shopping-bag-line fs-5"></i>
                    <span class="badge-count" id="cart-count-badge">0</span>
                </button>
                <button class="action-btn" id="dark-mode-toggle" onclick="toggleDarkMode()" title="Dark Mode"><i class="ri-moon-line fs-5"></i></button>
            </div>
        </div>

        <!-- Second navigation row — every item is a mega-menu trigger -->
        <nav class="mb-nav" id="mbNavRow" aria-label="Primary">
            ${topNav.map(item => `
                <a href="#" class="mb-nav-link ${item.slug === ALL_PRODUCTS_SLUG ? 'mb-nav-first' : ''}"
                   data-slug="${item.slug}"
                   data-name="${item.name.replace(/"/g, '&quot;')}"
                   onmouseenter="hoverItem('${item.slug}')"
                   onclick="clickItem(event, '${item.slug}')"
                   aria-haspopup="true">
                    <i class="${iconForCategory(item.slug)}"></i> ${item.name}
                    <i class="ri-arrow-down-s-line mb-arrow"></i>
                </a>
            `).join('')}
        </nav>

        <!-- Shared mega panel — in normal flow, so it pushes content down -->
        <section class="mb-panel" id="mbPanel" data-open="false" aria-hidden="true">
            <div class="mb-panel-inner" id="mbPanelInner">
                <div class="mb-grid" id="mbGrid"><div class="mb-panel-loading">Loading…</div></div>
            </div>
        </section>
    </div>

    <!-- Mobile full-screen drawer -->
    <div class="mb-drawer" id="mbDrawer" aria-label="Mobile menu">
        <div class="mb-drawer-top">
            <div class="brand-logo">
                <div class="logo-icon">M</div>
                <div class="logo-text">MEENAKSHI<span class="logo-subtext">BUILD WORLD</span></div>
            </div>
            <button class="mb-drawer-close" onclick="closeMobileMenu()" aria-label="Close menu"><i class="ri-close-fill"></i></button>
        </div>
        <div class="mb-drawer-cats" id="mbDrawerCats"></div>
    </div>
    `;

    navContainer.innerHTML = navHtml;

    AppState.updateBadgeCounts();

    // Preload every category's mega data so hovering feels instant.
    preloadMegaMenus(topNav);

    // Sticky unit hover handling (keeps panel open while traversing to it).
    const sticky = navContainer.querySelector('.mb-sticky');
    sticky.addEventListener('mouseenter', cancelMegaClose);
    sticky.addEventListener('mouseleave', scheduleMegaClose);

    const onResize = () => { if (MEGA.isOpen) setPanelHeight(); };
    window.addEventListener('resize', onResize);
    window.addEventListener('routechange', closeMega);

    // Close when the user clicks anywhere outside the header or presses Escape.
    document.addEventListener('click', e => {
        if (MEGA.isOpen && !e.target.closest('.mb-sticky')) closeMega();
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeMega();
    });

    if (localStorage.getItem('meenakshi_dark_mode') === '1') {
        document.body.classList.add('dark-mode');
    }
}

/* Item hover/click glue */
function hoverItem(slug) {
    const name = window.__mbMenu.find(m => m.slug === slug)?.name || slug;
    cancelMegaClose();
    // Highlight active link
    document.querySelectorAll('.mb-nav-link').forEach(el => {
        el.classList.toggle('mb-nav-active', el.dataset.slug === slug);
    });
    openMega(slug, name);
}

function clickItem(e, slug) {
    e.preventDefault();
    const coarse = window.matchMedia('(hover: none)').matches;
    if (coarse || window.innerWidth <= 1024) {
        // Tablet/click: open panel if closed, close if it's the active one.
        if (MEGA.isOpen && MEGA.activeSlug === slug) {
            closeMega();
        } else {
            hoverItem(slug);
        }
        return;
    }
    // Desktop: hovering already opens; click keeps it open (no navigation).
    hoverItem(slug);
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('meenakshi_dark_mode', document.body.classList.contains('dark-mode') ? '1' : '0');
}