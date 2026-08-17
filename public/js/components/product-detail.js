/* Meenakshi Build World - Product Detail Page with 360 Rotation Viewer & Inquiry Modals */

let current360Angle = 0;

async function renderProductDetailPage(mountPoint, slug) {
    const res = await API.getProductBySlug(slug);
    if (!res.success || !res.product) {
        mountPoint.innerHTML = `<div class="container py-5 text-center"><h2>Product Not Found</h2><button onclick="navigateTo('/shop')" class="btn btn-blue mt-3">Back to Catalog</button></div>`;
        return;
    }

    const p = res.product;
    const images = res.images || [];
    const reviews = res.reviews || [];

    const primaryImg = images.find(i => i.is_primary)?.image_url || images[0]?.image_url || 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80';
    const whatsappMessage = encodeURIComponent(`Hi Meenakshi Build World Team, I am inquiring about "${p.name}" (SKU: ${p.sku}) priced at ₹${p.offer_price || p.price}/sq.ft. Please share availability & quotation.`);

    const html = `
    <div class="container py-4">
        <!-- Breadcrumb -->
        <nav class="mb-4">
            <ol class="breadcrumb text-secondary small">
                <li class="breadcrumb-item"><a href="/" onclick="event.preventDefault(); navigateTo('/');" class="text-secondary text-decoration-none">Home</a></li>
                <li class="breadcrumb-item"><a href="/shop" onclick="event.preventDefault(); navigateTo('/shop');" class="text-secondary text-decoration-none">Shop</a></li>
                <li class="breadcrumb-item"><a href="/shop?category=${p.category_slug}" onclick="event.preventDefault(); navigateTo('/shop?category=${p.category_slug}');" class="text-secondary text-decoration-none">${p.category_name || 'Building Materials'}</a></li>
                <li class="breadcrumb-item active text-blue">${p.name}</li>
            </ol>
        </nav>

        <div class="row g-5">
            <!-- Left Column: Gallery & 360 Viewer -->
            <div class="col-lg-6">
                <!-- Media Tabs -->
                <ul class="nav nav-pills mb-3" id="pdt-view-tabs">
                    <li class="nav-item">
                        <button class="nav-link active btn-sm" data-bs-toggle="pill" onclick="switchProductMediaTab('gallery')"><i class="ri-image-line"></i> Photo Gallery</button>
                    </li>
                    <li class="nav-item">
                        <button class="nav-link btn-sm text-blue ms-2" data-bs-toggle="pill" onclick="switchProductMediaTab('360')"><i class="ri-3d-rotation-line"></i> Interactive 360° View</button>
                    </li>
                </ul>

                <!-- Main Display Viewport -->
                <div class="position-relative border border-secondary border-opacity-25 rounded-4 overflow-hidden bg-white shadow-sm" style="height: 480px;">
                    <div id="pdt-media-gallery" class="w-100 h-100">
                        <img id="pdt-main-img" src="${primaryImg}" class="w-100 h-100" style="object-fit: cover;" alt="${p.name}">
                    </div>

                    <div id="pdt-media-360" class="w-100 h-100 d-none flex-column align-items-center justify-content-center text-center p-4">
                        <div class="badge bg-blue text-white mb-3"><i class="ri-drag-move-2-line"></i> Drag slider to rotate tile 360°</div>
                        <img id="pdt-360-img" src="${primaryImg}" class="rounded shadow-lg mb-3" style="max-height: 300px; transform: rotate(${current360Angle}deg); transition: transform 0.1s linear;" alt="360 view">
                        <input type="range" min="0" max="360" value="0" class="w-75" oninput="rotateTile360(this.value)">
                    </div>
                </div>

                <div class="d-flex gap-3 mt-3 overflow-x-auto pb-2">
                    ${images.map(img => `
                        <img src="${img.image_url}" class="rounded border border-secondary cursor-pointer" style="width: 75px; height: 75px; object-fit: cover;" onclick="document.getElementById('pdt-main-img').src = '${img.image_url}'" alt="thumb">
                    `).join('')}
                </div>
            </div>

            <!-- Right Column: Product Specs & Actions -->
            <div class="col-lg-6">
                <div class="d-flex align-items-center gap-2 mb-2">
                    <span class="badge bg-light text-blue border border-blue font-bold">${p.brand_name || 'Meenakshi Select'}</span>
                    <span class="badge bg-light text-dark border">${p.material}</span>
                    <span class="badge bg-blue text-white font-bold">${p.finish}</span>
                </div>

                <h1 class="font-heading fs-2 text-dark mb-3">${p.name}</h1>
                <div class="text-secondary small mb-3">SKU: <span class="text-dark fw-bold">${p.sku}</span> | Size: <span class="text-dark fw-bold">${p.tile_size}</span></div>

                <div class="d-flex align-items-center gap-2 mb-4">
                    <span class="text-warning fs-5">★ ${p.rating_avg}</span>
                    <span class="text-muted small">(${p.reviews_count} Verified Reviews)</span>
                </div>

                <!-- Pricing Card -->
                <div class="p-4 rounded-4 bg-light border border-secondary border-opacity-25 mb-4 shadow-sm">
                    <div class="d-flex align-items-baseline gap-3">
                        <span class="fs-2 font-heading text-blue font-bold">₹${p.offer_price || p.price}</span>
                        <span class="text-muted">/ sq. ft</span>
                        ${p.offer_price ? `<span class="text-decoration-line-through text-muted ms-2">₹${p.price}</span>` : ''}
                        <span class="badge bg-success ms-auto">+18% GST Applicable</span>
                    </div>
                    <div class="text-secondary extra-small mt-1">₹${Math.round((p.offer_price || p.price) * (p.coverage_sqft_per_box || 15.5))} per box (${p.coverage_sqft_per_box || 15.5} sq ft / ${p.pieces_per_box || 4} pcs)</div>
                </div>

                <!-- Quantity -->
                <div class="d-flex align-items-center gap-3 mb-4">
                    <label class="fw-bold text-dark">Quantity (Boxes):</label>
                    <div class="input-group" style="width: 140px;">
                        <button class="btn btn-outline-secondary btn-sm" onclick="adjustPdtQty(-1)">-</button>
                        <input type="number" id="pdt-box-qty" class="form-control text-center bg-white text-dark border-secondary" value="5" min="1">
                        <button class="btn btn-outline-secondary btn-sm" onclick="adjustPdtQty(1)">+</button>
                    </div>
                    <span class="text-blue small fw-bold" id="pdt-sqft-calc-label">= 77.5 sq.ft total</span>
                </div>

                <div class="d-flex flex-wrap gap-3 mb-4">
                    <button class="btn btn-blue btn-lg flex-grow-1" onclick="addCurrentProductToCart('${p.slug}')">
                        <i class="ri-shopping-bag-line"></i> Add Boxes to Cart
                    </button>

                    <a href="https://wa.me/919876543210?text=${whatsappMessage}" target="_blank" class="btn btn-whatsapp btn-lg">
                        <i class="ri-whatsapp-line"></i> WhatsApp Direct
                    </a>
                </div>

                <div class="d-flex gap-3 pt-3 border-top border-secondary border-opacity-25">
                    <button class="btn btn-outline-blue btn-sm" onclick="triggerSampleModal('${p.name}')"><i class="ri-box-3-line"></i> Order Sample Box</button>
                    <button class="btn btn-outline-blue btn-sm" onclick="triggerQuoteModal('${p.name}')"><i class="ri-file-text-line"></i> Request Commercial Quote</button>
                    <button class="btn btn-dark btn-sm" onclick="AppState.toggleWishlist(${JSON.stringify(p).replace(/"/g, '&quot;')})"><i class="ri-heart-line"></i> Wishlist</button>
                </div>
            </div>
        </div>

        <!-- Technical Specs Table -->
        <div class="mt-5 p-4 rounded-4 bg-white border border-secondary border-opacity-25 shadow-sm">
            <h3 class="font-heading text-blue mb-4"><i class="ri-draft-line"></i> Technical Specifications</h3>
            <div class="row g-4">
                <div class="col-md-6">
                    <table class="table table-borderless small">
                        <tbody>
                            <tr><td class="text-muted">Material:</td><td class="text-dark fw-bold">${p.material}</td></tr>
                            <tr><td class="text-muted">Surface Finish:</td><td class="text-dark fw-bold">${p.finish}</td></tr>
                            <tr><td class="text-muted">Tile Size:</td><td class="text-dark fw-bold">${p.tile_size}</td></tr>
                            <tr><td class="text-muted">Thickness:</td><td class="text-dark fw-bold">${p.thickness_mm} mm</td></tr>
                        </tbody>
                    </table>
                </div>
                <div class="col-md-6">
                    <table class="table table-borderless small">
                        <tbody>
                            <tr><td class="text-muted">Coverage per Box:</td><td class="text-dark fw-bold">${p.coverage_sqft_per_box} sq.ft (${p.coverage_sqmt_per_box} sq.m)</td></tr>
                            <tr><td class="text-muted">Pieces per Box:</td><td class="text-dark fw-bold">${p.pieces_per_box} Pcs</td></tr>
                            <tr><td class="text-muted">Box Weight:</td><td class="text-dark fw-bold">${p.weight_kg_per_box} kg</td></tr>
                            <tr><td class="text-muted">Quality Assurance:</td><td class="text-dark fw-bold">10-Year Factory Warranty</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
    `;

    mountPoint.innerHTML = html;
}

function switchProductMediaTab(tab) {
    const gallery = document.getElementById('pdt-media-gallery');
    const viewer = document.getElementById('pdt-media-360');
    if (tab === '360') {
        gallery.classList.add('d-none');
        viewer.classList.remove('d-none');
        viewer.classList.add('d-flex');
    } else {
        viewer.classList.add('d-none');
        viewer.classList.remove('d-flex');
        gallery.classList.remove('d-none');
    }
}

function rotateTile360(val) {
    current360Angle = val;
    const img = document.getElementById('pdt-360-img');
    if (img) img.style.transform = `rotate(${val}deg)`;
}

function adjustPdtQty(delta) {
    const input = document.getElementById('pdt-box-qty');
    const label = document.getElementById('pdt-sqft-calc-label');
    if (!input) return;

    let val = parseInt(input.value || 1) + delta;
    if (val < 1) val = 1;
    input.value = val;
    if (label) label.innerText = `= ${(val * 15.5).toFixed(1)} sq.ft total`;
}

async function addCurrentProductToCart(slug) {
    const res = await API.getProductBySlug(slug);
    const qty = parseInt(document.getElementById('pdt-box-qty')?.value || 1);
    if (res.success && res.product) {
        AppState.addToCart(res.product, qty);
    }
}

function triggerSampleModal(productName) {
    const phone = prompt(`Order sample box for "${productName}". Enter your Mobile Number:`);
    if (phone) {
        API.submitInquiry({ type: 'sample', name: 'Valued Client', phone, product_name: productName });
        alert('Sample Box request dispatched! Delivery expected within 48 hours.');
    }
}

function triggerQuoteModal(productName) {
    const phone = prompt(`Request Commercial Quotation for "${productName}". Enter your Mobile Number:`);
    if (phone) {
        API.submitInquiry({ type: 'bulk_quote', name: 'Architect Client', phone, product_name: productName });
        alert('Commercial Quote Request registered! Sales desk will call you shortly.');
    }
}
