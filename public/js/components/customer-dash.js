/* Customer Account Portal & Order Tracker */

async function renderCustomerDashboardPage(mountPoint) {
    if (!AppState.user) {
        mountPoint.innerHTML = `<div class="container py-5 text-center"><h2>Please sign in to access Customer Portal</h2><button onclick="openAuthModal('login')" class="btn btn-gold mt-3">Sign In</button></div>`;
        return;
    }

    const ordersRes = await API.getOrders();
    const orders = ordersRes.success ? ordersRes.orders : [];

    const html = `
    <div class="container py-5">
        <div class="dashboard-wrapper">
            <!-- Sidebar -->
            <div class="dash-sidebar">
                <div class="text-center mb-4">
                    <div class="logo-icon mx-auto mb-2" style="width: 50px; height: 50px; font-size: 1.8rem;">${AppState.user.name.charAt(0)}</div>
                    <h3 class="font-heading fs-5 text-white mb-0">${AppState.user.name}</h3>
                    <div class="text-gold extra-small">${AppState.user.email}</div>
                </div>

                <ul class="dash-nav">
                    <li><a href="#" class="active"><i class="ri-shopping-bag-3-line"></i> My Orders (${orders.length})</a></li>
                    <li><a href="#" onclick="event.preventDefault(); navigateTo('/wishlist');"><i class="ri-heart-line"></i> Saved Wishlist</a></li>
                    <li><a href="#" onclick="event.preventDefault(); navigateTo('/compare');"><i class="ri-scales-line"></i> Comparison List</a></li>
                    <li><a href="#" onclick="AppState.logout()"><i class="ri-logout-box-r-line"></i> Sign Out</a></li>
                </ul>
            </div>

            <!-- Main Content -->
            <div class="dash-main">
                <h2 class="font-heading text-gold mb-4"><i class="ri-truck-line"></i> Tracked Order History</h2>

                ${orders.length ? `
                    <div class="table-responsive">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Order #</th>
                                    <th>Date</th>
                                    <th>Payable</th>
                                    <th>Payment</th>
                                    <th>Status</th>
                                    <th>Tracking #</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${orders.map(o => `
                                    <tr>
                                        <td class="fw-bold text-white">${o.order_number}</td>
                                        <td>${new Date(o.created_at || Date.now()).toLocaleDateString()}</td>
                                        <td class="text-gold fw-bold">₹${Math.round(o.net_payable).toLocaleString('en-IN')}</td>
                                        <td><span class="status-badge delivered">${o.payment_status}</span></td>
                                        <td><span class="status-badge processing">${o.order_status}</span></td>
                                        <td class="font-monospace text-muted small">${o.tracking_number}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : `
                    <div class="text-center py-5">
                        <p class="text-secondary">No orders placed yet.</p>
                        <button onclick="navigateTo('/shop')" class="btn btn-gold btn-sm">Explore Tiles</button>
                    </div>
                `}
            </div>
        </div>
    </div>
    `;

    mountPoint.innerHTML = html;
}
