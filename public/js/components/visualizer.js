/* Interactive Canvas & 3D AR Room Visualizer Component */

const VisualizerRooms = [
    {
        id: 'living_room',
        name: 'Luxury Living Foyer',
        bg: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
        defaultTile: 'Statuary Veneto Italian High-Gloss Vitrified Slab',
        patternImg: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80'
    },
    {
        id: 'master_bedroom',
        name: 'Master Suite Bedroom',
        bg: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1200&q=80',
        defaultTile: 'Nordic Smoked Oak Timber Porcelain Plank',
        patternImg: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80'
    },
    {
        id: 'kitchen_suite',
        name: 'Chef Kitchen & Dining',
        bg: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80',
        defaultTile: 'Belgian Concrete Slate Grey Matte Tile',
        patternImg: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80'
    },
    {
        id: 'spa_bathroom',
        name: 'Royal Spa Bathroom',
        bg: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80',
        defaultTile: 'Aquamarine Artisan Emerald Subway Wall Tile',
        patternImg: 'https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?auto=format&fit=crop&w=600&q=80'
    },
    {
        id: 'outdoor_terrace',
        name: 'Outdoor Pool Deck & Patio',
        bg: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
        defaultTile: 'Thermodyn 20mm Outdoor Pool Deck Paver R11',
        patternImg: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=600&q=80'
    }
];

let currentVisualizerRoom = VisualizerRooms[0];
let currentVisualizerPattern = VisualizerRooms[0].patternImg;
let currentVisualizerOpacity = 0.75;
let currentVisualizerScale = 40;

async function renderRoomVisualizerPage(mountPoint) {
    // Fetch products list to populate tile pattern selector
    const res = await API.getProducts('?limit=20');
    const products = res.success ? res.products : [];

    const html = `
    <div class="container py-5">
        <div class="section-header">
            <span class="section-subtitle">INTERACTIVE AR STUDIO</span>
            <h1 class="section-title">Tile Room Visualizer</h1>
            <p class="text-secondary">Preview how different vitrified slabs, Italian marbles, and wood planks will look inside actual luxury room environments before purchasing.</p>
        </div>

        <div class="visualizer-container">
            <!-- Left Viewport Canvas -->
            <div>
                <div class="canvas-viewport" id="visualizer-canvas-viewport">
                    <img src="${currentVisualizerRoom.bg}" class="room-bg" id="vis-room-bg-img" alt="${currentVisualizerRoom.name}">
                    <div class="tile-overlay-layer" id="vis-tile-overlay" style="
                        background-image: url('${currentVisualizerPattern}');
                        background-size: ${currentVisualizerScale}px ${currentVisualizerScale}px;
                        opacity: ${currentVisualizerOpacity};
                    "></div>
                </div>

                <div class="d-flex justify-content-between align-items-center mt-3 text-secondary small">
                    <span><i class="ri-information-line"></i> Drag sliders to adjust scale and blending. Real-time rendering active.</span>
                    <button class="btn btn-outline-gold btn-sm" onclick="downloadVisualizedSnapshot()"><i class="ri-download-cloud-line"></i> Export Snapshot</button>
                </div>
            </div>

            <!-- Right Controls Panel -->
            <div class="vis-controls-panel">
                <!-- 1. Select Room Environment -->
                <div>
                    <h4 class="control-group-title"><i class="ri-home-4-line"></i> 1. Select Room</h4>
                    <div class="room-selector-btns">
                        ${VisualizerRooms.map(room => `
                            <button class="selector-btn ${room.id === currentVisualizerRoom.id ? 'active' : ''}" onclick="switchVisualizerRoom('${room.id}')">
                                ${room.name}
                            </button>
                        `).join('')}
                    </div>
                </div>

                <!-- 2. Select Tile Texture -->
                <div>
                    <h4 class="control-group-title"><i class="ri-palette-line"></i> 2. Select Tile Texture</h4>
                    <div class="d-flex flex-column gap-2" style="max-height: 220px; overflow-y: auto;">
                        ${products.map(p => `
                            <div class="suggestion-item p-2 border border-secondary border-opacity-25 rounded cursor-pointer" onclick="switchVisualizerTilePattern('${p.primary_image}', '${p.name.replace(/'/g, "\\'")}')">
                                <img src="${p.primary_image}" alt="${p.name}" style="width: 45px; height: 45px; object-fit: cover;" class="rounded">
                                <div>
                                    <div class="fw-bold text-white small" style="line-height:1.2;">${p.name}</div>
                                    <div class="text-gold extra-small">₹${p.offer_price || p.price} / sq.ft • ${p.tile_size}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- 3. Fine-Tune Controls -->
                <div>
                    <h4 class="control-group-title"><i class="ri-sliders-line"></i> 3. Scale & Blending</h4>
                    <div class="calc-field mb-3">
                        <label>Tile Size Scale (${currentVisualizerScale}px)</label>
                        <input type="range" min="15" max="120" value="${currentVisualizerScale}" oninput="updateVisualizerScale(this.value)">
                    </div>

                    <div class="calc-field">
                        <label>Texture Opacity (${Math.round(currentVisualizerOpacity * 100)}%)</label>
                        <input type="range" min="0.2" max="0.95" step="0.05" value="${currentVisualizerOpacity}" oninput="updateVisualizerOpacity(this.value)">
                    </div>
                </div>

                <!-- Call to Action -->
                <button class="btn btn-gold w-100" onclick="alert('Visualized tiles saved to sample request!')">
                    <i class="ri-shopping-cart-2-line"></i> Order Sample Boxes of This Tile
                </button>
            </div>
        </div>
    </div>
    `;

    mountPoint.innerHTML = html;
}

function switchVisualizerRoom(roomId) {
    const room = VisualizerRooms.find(r => r.id === roomId);
    if (!room) return;
    currentVisualizerRoom = room;
    document.getElementById('vis-room-bg-img').src = room.bg;
    renderRoomVisualizerPage(document.getElementById('app-main-content'));
}

function switchVisualizerTilePattern(imgUrl, name) {
    currentVisualizerPattern = imgUrl;
    const overlay = document.getElementById('vis-tile-overlay');
    if (overlay) overlay.style.backgroundImage = `url('${imgUrl}')`;
}

function updateVisualizerScale(val) {
    currentVisualizerScale = val;
    const overlay = document.getElementById('vis-tile-overlay');
    if (overlay) overlay.style.backgroundSize = `${val}px ${val}px`;
}

function updateVisualizerOpacity(val) {
    currentVisualizerOpacity = val;
    const overlay = document.getElementById('vis-tile-overlay');
    if (overlay) overlay.style.opacity = val;
}

function downloadVisualizedSnapshot() {
    alert('Generating high-resolution AR snapshot for download...');
}
