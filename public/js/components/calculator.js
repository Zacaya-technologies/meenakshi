/* Meenakshi Build World - Standalone & Embedded Tile Coverage & Box Calculator */

function renderTileCalculatorPage(mountPoint) {
    const html = `
    <div class="container py-5">
        <div class="section-header">
            <span class="section-subtitle">QUANTITY & FREIGHT ESTIMATOR</span>
            <h1 class="section-title">Tile & Box Area Calculator</h1>
            <p class="text-secondary">Calculate exact room square footage, box requirements, cutting wastage safety margins, and total cost including 18% GST.</p>
        </div>

        <div class="calculator-card">
            <div class="calc-grid">
                <div class="calc-field">
                    <label><i class="ri-ruler-2-line text-blue"></i> Room Length</label>
                    <input type="number" id="calc-length" value="15" step="0.5" oninput="calculateTileRequirements()">
                </div>

                <div class="calc-field">
                    <label><i class="ri-ruler-2-line text-blue"></i> Room Width</label>
                    <input type="number" id="calc-width" value="12" step="0.5" oninput="calculateTileRequirements()">
                </div>

                <div class="calc-field">
                    <label><i class="ri-drag-move-line text-blue"></i> Unit</label>
                    <select id="calc-unit" onchange="calculateTileRequirements()">
                        <option value="ft">Feet (ft)</option>
                        <option value="mt">Meters (m)</option>
                    </select>
                </div>

                <div class="calc-field">
                    <label><i class="ri-layout-grid-line text-blue"></i> Select Tile Size</label>
                    <select id="calc-tile-size" onchange="calculateTileRequirements()">
                        <option value="15.5">600x1200 mm (15.50 sq ft / box - 2 pcs)</option>
                        <option value="15.5" selected>600x600 mm (15.50 sq ft / box - 4 pcs)</option>
                        <option value="13.78">800x1600 mm (13.78 sq ft / box - 1 pc)</option>
                        <option value="9.68">300x600 mm (9.68 sq ft / box - 5 pcs)</option>
                        <option value="12.91">200x1200 mm Planks (12.91 sq ft / box)</option>
                    </select>
                </div>

                <div class="calc-field">
                    <label><i class="ri-percent-line text-blue"></i> Cutting Wastage Margin</label>
                    <select id="calc-wastage" onchange="calculateTileRequirements()">
                        <option value="5">5% (Straight Laying)</option>
                        <option value="10" selected>10% (Recommended Cuts Allowance)</option>
                        <option value="15">15% (Diagonal / Pattern Laying)</option>
                    </select>
                </div>

                <div class="calc-field">
                    <label><i class="ri-money-rupee-circle-line text-blue"></i> Tile Price (₹ per sq. ft)</label>
                    <input type="number" id="calc-unit-price" value="118" step="1" oninput="calculateTileRequirements()">
                </div>
            </div>

            <div class="calc-result-box" id="calc-output-box"></div>

            <div class="mt-4 text-center">
                <button class="btn btn-blue btn-lg" onclick="navigateTo('/shop')">
                    <i class="ri-shopping-bag-line"></i> Order Calculated Boxes Now
                </button>
            </div>
        </div>
    </div>
    `;

    mountPoint.innerHTML = html;
    calculateTileRequirements();
}

function calculateTileRequirements() {
    const length = parseFloat(document.getElementById('calc-length')?.value || 0);
    const width = parseFloat(document.getElementById('calc-width')?.value || 0);
    const unit = document.getElementById('calc-unit')?.value || 'ft';
    const coveragePerBox = parseFloat(document.getElementById('calc-tile-size')?.value || 15.5);
    const wastagePercent = parseFloat(document.getElementById('calc-wastage')?.value || 10);
    const unitPrice = parseFloat(document.getElementById('calc-unit-price')?.value || 118);

    let rawSqft = length * width;
    if (unit === 'mt') rawSqft = rawSqft * 10.7639;

    const totalSqft = rawSqft * (1 + (wastagePercent / 100));
    const boxesRequired = Math.ceil(totalSqft / coveragePerBox);
    const actualCoveredSqft = boxesRequired * coveragePerBox;

    const subtotal = actualCoveredSqft * unitPrice;
    const gstAmount = subtotal * 0.18;
    const totalEstimate = subtotal + gstAmount;

    const outputBox = document.getElementById('calc-output-box');
    if (outputBox) {
        outputBox.innerHTML = `
            <div>
                <div class="text-secondary small font-bold">Total Net Area</div>
                <div class="result-val">${rawSqft.toFixed(1)} <span class="fs-6 text-dark">sq.ft</span></div>
                <div class="extra-small text-muted">(${ (rawSqft / 10.7639).toFixed(1) } sq.m)</div>
            </div>

            <div class="border-start border-secondary border-opacity-25 ps-4">
                <div class="text-secondary small font-bold">Boxes Required (+${wastagePercent}% waste)</div>
                <div class="result-val text-blue">${boxesRequired} <span class="fs-6 text-dark">Boxes</span></div>
                <div class="extra-small text-muted">(${actualCoveredSqft.toFixed(1)} total sq.ft)</div>
            </div>

            <div class="border-start border-secondary border-opacity-25 ps-4">
                <div class="text-secondary small font-bold">Estimated Cost (+18% GST)</div>
                <div class="result-val">₹${Math.round(totalEstimate).toLocaleString('en-IN')}</div>
                <div class="extra-small text-blue fw-semibold">Includes ₹${Math.round(gstAmount).toLocaleString('en-IN')} GST</div>
            </div>
        `;
    }
}
