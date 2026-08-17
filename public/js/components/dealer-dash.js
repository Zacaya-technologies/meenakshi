/* Dealer B2B Wholesale Portal & Credit Line Dashboard */

async function renderDealerDashboardPage(mountPoint) {
    if (!AppState.user || (AppState.user.role !== 'dealer' && AppState.user.role !== 'admin')) {
        mountPoint.innerHTML = `<div class="container py-5 text-center"><h2>Authorized Dealer Sign-In Required</h2><button onclick="openAuthModal('login')" class="btn btn-gold mt-3">Dealer Login</button></div>`;
        return;
    }

    const productsRes = await API.getProducts('?limit=50');
    const products = productsRes.success ? productsRes.products : [];

    const html = `
    <div class="container py-5">
        <div class="dashboard-wrapper">
            <!-- Sidebar -->
            <div class="dash-sidebar">
                <div class="text-center mb-4">
                    <div class="badge bg-gold text-dark font-bold mb-2">B2B VERIFIED DEALER</div>
                    <h3 class="font-heading fs-5 text-white mb-1">${AppState.user.company_name || AppState.user.name}</h3>
                    <div class="text-secondary extra-small">GSTIN: ${AppState.user.gstin || '27AABCU9632M1ZP'}</div>
                </div>

                <div class="p-3 rounded bg-dark border border-secondary border-opacity-25 mb-4 text-center">
                    <div class="text-muted extra-small">Approved Credit Line Balance</div>
                    <div class="fs-4 font-heading text-gold fw-bold">₹${(AppState.user.credit_limit || 250000).toLocaleString('en-IN')}</div>
                    <div class="text-success extra-small">0% Interest 45-Day Term</div>
                </div>

                <ul class="dash-nav">
                    <li><a href="#" class="active"><i class="ri-price-tag-3-line"></i> Wholesale Rates Sheet</a></li>
                    <li><a href="#" onclick="event.preventDefault(); navigateTo('/architect-zone');"><i class="ri-file-text-line"></i> Project Credit Request</a></li>
                    <li><a href="#" onclick="AppState.logout()"><i class="ri-logout-box-r-line"></i> Sign Out</a></li>
                </ul>
            </div>

            <!-- Main Content -->
            <div class="dash-main">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h2 class="font-heading text-gold mb-0"><i class="ri-store-2-line"></i> Dealer Tiered Wholesale Pricing Catalog</h2>
                    <button class="btn btn-gold btn-sm" onclick="alert('Exporting B2B Dealer Price List PDF...')"><i class="ri-download-line"></i> Download Price Sheet PDF</button>
                </div>

                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Tile Name</th>
                                <th>Size</th>
                                <th>Retail MRP</th>
                                <th>Dealer Rate</th>
                                <th>Margin</th>
                                <th>Stock Status</th>
                                <th>Quick Order</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${products.map(p => {
                                const retail = p.price;
                                const dealerRate = p.dealer_price || (retail * 0.75);
                                const marginPercent = Math.round(((retail - dealerRate) / retail) * 100);

                                return `
                                    <tr>
                                        <td class="fw-bold text-white">${p.name}</td>
                                        <td>${p.tile_size}</td>
                                        <td class="text-muted">₹${retail}/sq.ft</td>
                                        <td class="text-gold fw-bold">₹${dealerRate}/sq.ft</td>
                                        <td><span class="badge bg-success">+${marginPercent}% Margin</span></td>
                                        <td>${p.stock > 100 ? '<span class="text-success small">In Stock</span>' : '<span class="text-warning small">Limited</span>'}</td>
                                        <td>
                                            <button class="btn btn-outline-gold btn-sm" onclick="AppState.addToCart(${JSON.stringify(p).replace(/"/g, '&quot;')}, 20)">Order Pallet (20 Boxes)</button>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
    `;

    mountPoint.innerHTML = html;
}
