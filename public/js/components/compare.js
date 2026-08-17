/* Meenakshi Build World - Tile Comparison Matrix */

function renderComparePage(mountPoint) {
    const list = AppState.compare;

    if (!list.length) {
        mountPoint.innerHTML = `
            <div class="container py-5 text-center">
                <i class="ri-scales-line fs-1 text-blue"></i>
                <h2 class="font-heading mt-3">Tile Comparison Matrix Empty</h2>
                <p class="text-secondary">Click the scale icon on tile cards to compare up to 4 tiles side-by-side.</p>
                <button onclick="navigateTo('/shop')" class="btn btn-blue btn-lg mt-3">Browse Catalog</button>
            </div>
        `;
        return;
    }

    const html = `
    <div class="container py-5">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h1 class="font-heading text-dark"><i class="ri-scales-line text-blue"></i> Building Materials Comparison</h1>
            <button class="btn btn-outline-blue btn-sm" onclick="AppState.compare = []; AppState.save(); renderComparePage(document.getElementById('app-main-content'));">Clear Comparison</button>
        </div>

        <div class="table-responsive">
            <table class="data-table">
                <thead>
                    <tr>
                        <th style="width: 200px;">Attribute</th>
                        ${list.map(p => `
                            <th class="text-center" style="min-width: 220px;">
                                <img src="${p.primary_image || 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=300&q=80'}" class="rounded-3 mb-2" style="width: 100px; height: 100px; object-fit: cover;" alt="tile"><br>
                                <a href="/product/${p.slug}" onclick="event.preventDefault(); navigateTo('/product/${p.slug}');" class="text-blue text-decoration-none fw-bold">${p.name}</a>
                            </th>
                        `).join('')}
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td class="fw-bold text-dark">Price / sq.ft</td>
                        ${list.map(p => `<td class="text-center text-blue font-bold fs-5">₹${p.offer_price || p.price}</td>`).join('')}
                    </tr>
                    <tr>
                        <td class="fw-bold text-dark">Material</td>
                        ${list.map(p => `<td class="text-center">${p.material || 'Vitrified'}</td>`).join('')}
                    </tr>
                    <tr>
                        <td class="fw-bold text-dark">Surface Finish</td>
                        ${list.map(p => `<td class="text-center">${p.finish}</td>`).join('')}
                    </tr>
                    <tr>
                        <td class="fw-bold text-dark">Tile Dimensions</td>
                        ${list.map(p => `<td class="text-center">${p.tile_size}</td>`).join('')}
                    </tr>
                    <tr>
                        <td class="fw-bold text-dark">Thickness</td>
                        ${list.map(p => `<td class="text-center">${p.thickness_mm || 9.0} mm</td>`).join('')}
                    </tr>
                    <tr>
                        <td class="fw-bold text-dark">Coverage per Box</td>
                        ${list.map(p => `<td class="text-center">${p.coverage_sqft_per_box || 15.5} sq.ft</td>`).join('')}
                    </tr>
                    <tr>
                        <td class="fw-bold text-dark">Pieces per Box</td>
                        ${list.map(p => `<td class="text-center">${p.pieces_per_box || 4} Pcs</td>`).join('')}
                    </tr>
                    <tr>
                        <td class="fw-bold text-dark">Warranty</td>
                        ${list.map(p => `<td class="text-center text-success fw-bold">10 Years Factory Certified</td>`).join('')}
                    </tr>
                    <tr>
                        <td class="fw-bold text-dark">Action</td>
                        ${list.map(p => `
                            <td class="text-center">
                                <button class="btn btn-blue btn-sm" onclick="AppState.addToCart(${JSON.stringify(p).replace(/"/g, '&quot;')}, 1)">Add to Cart</button>
                            </td>
                        `).join('')}
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
    `;

    mountPoint.innerHTML = html;
}
