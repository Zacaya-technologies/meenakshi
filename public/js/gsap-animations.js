/* GSAP & Smooth UI Animations Engine */

function initGSAPAnimations() {
    if (typeof gsap === 'undefined') return;

    // Fade-in animation on section scroll
    gsap.from('.hero-content', {
        duration: 1.2,
        y: 40,
        opacity: 0,
        ease: 'power3.out'
    });

    gsap.from('.product-card', {
        duration: 0.8,
        y: 30,
        opacity: 0,
        stagger: 0.1,
        ease: 'power2.out'
    });
}

function toggleSearchModal() {
    const modal = document.getElementById('global-search-modal');
    if (!modal) return;

    modal.classList.toggle('active');
    if (modal.classList.contains('active')) {
        document.getElementById('global-search-input')?.focus();
    }
}

async function handleLiveSearchInput(query) {
    const suggestionsContainer = document.getElementById('search-suggestions-list');
    if (!suggestionsContainer) return;

    if (!query || query.length < 2) {
        suggestionsContainer.innerHTML = '';
        return;
    }

    const res = await API.getSuggestions(query);
    const list = res.success ? res.suggestions : [];

    if (!list.length) {
        suggestionsContainer.innerHTML = `<div class="p-3 text-secondary">No tiles matching "${query}"</div>`;
        return;
    }

    suggestionsContainer.innerHTML = list.map(item => `
        <div class="suggestion-item" onclick="toggleSearchModal(); navigateTo('/product/${item.slug}');">
            <img src="${item.image || 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=150&q=80'}" alt="${item.name}">
            <div>
                <div class="fw-bold text-white small">${item.name}</div>
                <div class="text-gold extra-small">₹${item.offer_price || item.price}/sq.ft • ${item.tile_size}</div>
            </div>
        </div>
    `).join('');
}
