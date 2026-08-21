// Central business identity/contact configuration for Meenakshi Build World.
// Single source of truth consumed by the seed defaults, the Express settings
// API and the Next.js SEO metadata so nothing is duplicated in components.
// Components always read from the DB-backed API (see lib/business.jsx) with
// these values as fallback while loading or if the request fails.

const BUSINESS_DEFAULTS = {
    id: 1,
    business_name: 'Meenakshi Build World',
    logo: '/images/logo.png',
    tagline: 'Building Trust Since 1996',
    description:
        'Meenakshi Build World is a one-stop destination for construction and building materials in Bangalore, specializing in tiles, sanitary ware, steel, cement, plumbing, kitchen products and building materials.',
    corporate_address:
        'Site #1 & #2,\nOpp. Puma Showroom,\nByrathi Cross,\nHennur Road,\nBangalore – 560077,\nKarnataka, India',
    store_address:
        '#2,\nSy No. 53/8 & 53/9,\nAduru Village,\nRampura Avalahalli Main Road,\nBangalore – 560049,\nKarnataka, India',
    primary_phone: '+91 99000 27700',
    secondary_phone: '+91 95359 99050',
    additional_phone: '+91 95359 99042',
    landline: '+91 080 25443220, +91 080 28445898',
    email: 'info@meenakshibuildworld.com',
    whatsapp_number: '919900027700',
    google_maps_url:
        'https://www.google.com/maps/search/?api=1&query=Meenakshi%20Build%20World%2C%20Byrathi%20Cross%2C%20Hennur%20Road%2C%20Bangalore%20560077',
    website_url: 'https://meenakshibuildworld.com/',
    facebook_url: 'https://www.facebook.com/share/184321xYpU/',
    instagram_url: 'https://www.instagram.com/meenakshibuildworld?igsi=NGFlNWhjb2JrZm92',
    twitter_url: 'https://x.com/BuildMeenakshi',
    linkedin_url: 'https://www.linkedin.com/company/meenakshi-build-world/',
    youtube_url: 'https://youtube.com/@meenakshibuildworld9842?si=41HAOfsafzToheim',
    business_hours: 'Mon–Sat: 9:30 AM – 7:30 PM, Sun: 10:00 AM – 6:00 PM',
    copyright_text: `© ${new Date().getFullYear()} Meenakshi Build World. All Rights Reserved.`,
    updated_at: null
};

module.exports = { BUSINESS_DEFAULTS };
