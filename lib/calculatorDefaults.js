// Central Tile Calculator configuration — admin-editable, consumed by the
// calculator page and the settings API. Array fields are stored as JSON in
// the DB (see server/routes/calculatorSettingsRoutes.js) and parsed back out
// here as real arrays so components never have to JSON.parse themselves.

const CALCULATOR_DEFAULTS = {
    id: 1,
    enabled: true,
    default_wastage: 10,
    max_wastage: 25,
    wastage_options: [5, 7, 10, 12, 15],
    tile_size_presets: [
        { length: 300, width: 300, unit: 'mm' },
        { length: 300, width: 450, unit: 'mm' },
        { length: 300, width: 600, unit: 'mm' },
        { length: 400, width: 400, unit: 'mm' },
        { length: 500, width: 500, unit: 'mm' },
        { length: 600, width: 600, unit: 'mm' },
        { length: 600, width: 1200, unit: 'mm' },
        { length: 800, width: 800, unit: 'mm' },
        { length: 800, width: 1600, unit: 'mm' },
        { length: 800, width: 2400, unit: 'mm' },
        { length: 1200, width: 1800, unit: 'mm' },
        { length: 1200, width: 2400, unit: 'mm' }
    ],
    area_presets: ['Living Room', 'Bedroom', 'Kitchen', 'Bathroom', 'Balcony', 'Hall', 'Office'],
    enable_price: true,
    enable_box: true,
    enable_whatsapp: true,
    updated_at: null
};

module.exports = { CALCULATOR_DEFAULTS };
