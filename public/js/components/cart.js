/* Meenakshi Build World - Shopping Cart & GST Checkout Engine */

function renderCartPage(mountPoint) {
    const items = AppState.cart;

    if (!items.length) {
        mountPoint.innerHTML = `
            <div class="container py-5 text-center">
                <i class="ri-shopping-bag-line fs-1 text-blue"></i>
                <h2 class="font-heading mt-3">Your Shopping Cart is Empty</h2>
                <p class="text-secondary">Browse our building materials and vitrified slabs catalog.</p>
                <button onclick="navigateTo('/shop')" class="btn btn-blue btn-lg mt-3">Explore Catalog</button>
            </div>
        `;
        return;
    }

    let subtotal = 0;
    for (let item of items) {
        const price = parseFloat(item.product.offer_price || item.product.price);
        const sqft = item.quantityBoxes * parseFloat(item.product.coverage_sqft_per_box || 15.5);
        subtotal += price * sqft;
    }

    const gstAmount = subtotal * 0.18;
    const netPayable = subtotal + gstAmount;

    const html = `
    <div class="container py-5">
        <h1 class="font-heading text-dark mb-4"><i class="ri-shopping-bag-line text-blue"></i> Cart & GST Checkout</h1>

        <div class="row g-5">
            <div class="col-lg-7">
                <div class="d-flex flex-column gap-3">
                    ${items.map((item, idx) => {
                        const unitPrice = parseFloat(item.product.offer_price || item.product.price);
                        const sqft = item.quantityBoxes * parseFloat(item.product.coverage_sqft_per_box || 15.5);
                        const itemTotal = unitPrice * sqft;

                        return `
                            <div class="d-flex gap-3 p-3 rounded-4 bg-white border border-secondary border-opacity-25 shadow-sm align-items-center">
                                <img src="${item.product.primary_image || 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=300&q=80'}" class="rounded-3" style="width: 90px; height: 90px; object-fit: cover;" alt="tile">
                                
                                <div class="flex-grow-1">
                                    <h4 class="font-heading fs-6 text-dark mb-1">${item.product.name}</h4>
                                    <div class="text-muted extra-small">SKU: ${item.product.sku} • ${item.product.tile_size}</div>
                                    <div class="text-blue small font-bold mt-1">₹${unitPrice}/sq.ft</div>
                                </div>

                                <div class="text-end ms-3">
                                    <div class="fw-bold text-dark fs-5">₹${Math.round(itemTotal).toLocaleString('en-IN')}</div>
                                    <div class="text-muted extra-small">${item.quantityBoxes} Boxes (${sqft.toFixed(1)} sq.ft)</div>
                                    <button class="btn btn-link text-danger p-0 extra-small mt-1" onclick="removeCartItem(${idx})">Remove</button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <!-- GST Invoice Summary Card -->
            <div class="col-lg-5">
                <div class="p-4 rounded-4 bg-white border border-secondary border-opacity-25 shadow-sm">
                    <h3 class="font-heading text-dark fs-5 mb-3">Order Invoice Summary</h3>

                    <div class="d-flex justify-content-between text-secondary mb-2">
                        <span>Materials Subtotal:</span>
                        <span class="text-dark fw-bold">₹${Math.round(subtotal).toLocaleString('en-IN')}</span>
                    </div>

                    <div class="d-flex justify-content-between text-secondary mb-2">
                        <span>Statutory GST (18%):</span>
                        <span class="text-dark fw-bold">₹${Math.round(gstAmount).toLocaleString('en-IN')}</span>
                    </div>

                    <div class="d-flex justify-content-between text-secondary mb-3 pb-3 border-bottom border-secondary border-opacity-25">
                        <span>Logistics & Transport:</span>
                        <span class="text-success fw-bold">FREE Direct Dispatch</span>
                    </div>

                    <div class="d-flex justify-content-between fs-4 font-heading text-blue mb-4">
                        <span>Net Payable Amount:</span>
                        <span>₹${Math.round(netPayable).toLocaleString('en-IN')}</span>
                    </div>

                    <!-- Checkout Form -->
                    <form onsubmit="handleCheckoutFormSubmit(event)">
                        <div class="mb-3">
                            <label class="form-label text-dark small font-bold">Full Name *</label>
                            <input type="text" id="chk-name" class="form-control bg-light text-dark border-secondary" required value="${AppState.user?.name || ''}">
                        </div>

                        <div class="row g-2 mb-3">
                            <div class="col-6">
                                <label class="form-label text-dark small font-bold">Email *</label>
                                <input type="email" id="chk-email" class="form-control bg-light text-dark border-secondary" required value="${AppState.user?.email || ''}">
                            </div>
                            <div class="col-6">
                                <label class="form-label text-dark small font-bold">Phone *</label>
                                <input type="tel" id="chk-phone" class="form-control bg-light text-dark border-secondary" required value="+91 98765 43210">
                            </div>
                        </div>

                        <div class="mb-3">
                            <label class="form-label text-dark small font-bold">Delivery Address *</label>
                            <textarea id="chk-address" class="form-control bg-light text-dark border-secondary" rows="2" required>Meenakshi Build World Site 4, Industrial Park, Bangalore</textarea>
                        </div>

                        <div class="mb-3">
                            <label class="form-label text-dark small font-bold">GSTIN Number (Optional for Tax Invoice)</label>
                            <input type="text" id="chk-gstin" class="form-control bg-light text-dark border-secondary" placeholder="29AAACM1234H1Z5" value="${AppState.user?.gstin || ''}">
                        </div>

                        <button type="submit" class="btn btn-blue w-100 btn-lg">
                            <i class="ri-lock-check-line"></i> Confirm & Pay ₹${Math.round(netPayable).toLocaleString('en-IN')}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </div>
    `;

    mountPoint.innerHTML = html;
}

function removeCartItem(idx) {
    AppState.cart.splice(idx, 1);
    AppState.save();
    renderCartPage(document.getElementById('app-main-content'));
}

async function handleCheckoutFormSubmit(e) {
    e.preventDefault();

    const orderPayload = {
        customer_name: document.getElementById('chk-name').value,
        customer_email: document.getElementById('chk-email').value,
        customer_phone: document.getElementById('chk-phone').value,
        shipping_address: document.getElementById('chk-address').value,
        gstin: document.getElementById('chk-gstin').value,
        user_id: AppState.user?.id || null,
        items: AppState.cart.map(i => ({
            product_id: i.product.id,
            quantity_boxes: i.quantityBoxes
        }))
    };

    const res = await API.checkout(orderPayload);
    if (res.success) {
        AppState.cart = [];
        AppState.save();
        alert(`Order Placed Successfully!\n\nOrder #: ${res.order.order_number}\nTracking Number: ${res.order.tracking_number}\nAmount Paid: ₹${Math.round(res.order.net_payable).toLocaleString('en-IN')}`);
        navigateTo('/');
    } else {
        alert('Checkout error: ' + res.message);
    }
}
