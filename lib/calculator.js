// Tile quantity calculator — pure calculation logic, no UI/DOM dependencies.
// Everything is computed in meters internally, then converted to sq.ft / sq.m
// for display, so mixed room/tile units never get combined incorrectly.

// ---- Conversion constants (length, in meters) ----
export const LENGTH_TO_M = {
  mm: 0.001,
  cm: 0.01,
  m: 1,
  inch: 0.0254,
  ft: 0.3048
};

export const SQFT_PER_SQM = 10.7639;

export const ROOM_UNITS = [
  { value: 'ft', label: 'Feet' },
  { value: 'inch', label: 'Inches' },
  { value: 'm', label: 'Meters' },
  { value: 'cm', label: 'Centimeters' },
  { value: 'mm', label: 'Millimeters' }
];

export const TILE_UNITS = [
  { value: 'mm', label: 'mm' },
  { value: 'cm', label: 'cm' },
  { value: 'inch', label: 'inch' },
  { value: 'ft', label: 'feet' },
  { value: 'm', label: 'meter' }
];

export const WASTAGE_OPTIONS = [5, 7, 10, 12, 15];

export const TILE_SIZE_PRESETS = [
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
];

export const AREA_PRESETS = ['Living Room', 'Bedroom', 'Kitchen', 'Bathroom', 'Balcony', 'Hall', 'Office', 'Custom'];

/** Convert a length value from one unit to another. */
export function convertLength(value, fromUnit, toUnit) {
  const meters = Number(value) * (LENGTH_TO_M[fromUnit] ?? 1);
  return meters / (LENGTH_TO_M[toUnit] ?? 1);
}

/** Convert an area (already in square units of `fromUnit`) to square units of `toUnit`. */
export function convertArea(value, fromUnit, toUnit) {
  const factor = (LENGTH_TO_M[fromUnit] ?? 1) / (LENGTH_TO_M[toUnit] ?? 1);
  return Number(value) * factor * factor;
}

/** Room/wall area in square meters, given length+width in `unit`. */
export function calculateRoomArea(length, width, unit) {
  const lM = convertLength(length, unit, 'm');
  const wM = convertLength(width, unit, 'm');
  return lM * wM; // sq.m
}

/** Wall area is the same formula as room area — kept distinct for readability/API symmetry. */
export function calculateWallArea(length, height, unit) {
  return calculateRoomArea(length, height, unit);
}

/** Total sq.m to deduct for a list of door/window openings. */
export function calculateOpeningDeduction(openings, unit) {
  return (openings || []).reduce((sum, o) => {
    const w = Number(o.width) || 0;
    const h = Number(o.height) || 0;
    const qty = Number(o.quantity) || 0;
    if (w <= 0 || h <= 0 || qty <= 0) return sum;
    return sum + calculateRoomArea(w, h, unit) * qty;
  }, 0);
}

/** Tile face area in square meters, given tile length+width in `unit`. */
export function calculateTileArea(tileLength, tileWidth, tileUnit) {
  const lM = convertLength(tileLength, tileUnit, 'm');
  const wM = convertLength(tileWidth, tileUnit, 'm');
  return lM * wM; // sq.m
}

/** Base tile count (no wastage), always rounded up. Both areas in the same unit (sq.m). */
export function calculateBaseTiles(areaSqm, tileAreaSqm) {
  if (!tileAreaSqm || tileAreaSqm <= 0) return 0;
  return Math.ceil(areaSqm / tileAreaSqm);
}

/** Wastage tile count, rounded up. */
export function calculateWastage(baseTiles, wastagePercent) {
  return Math.ceil(baseTiles * (Number(wastagePercent) || 0) / 100);
}

export function calculateFinalTiles(baseTiles, wastageTiles) {
  return baseTiles + wastageTiles;
}

/** Actual sq.m covered by the final (rounded-up) tile count. */
export function calculateCoverage(finalTiles, tileAreaSqm) {
  return finalTiles * tileAreaSqm;
}

/**
 * Boxes required, rounded up. Tiles-per-box is preferred when available —
 * deriving boxes from it keeps "boxes × tilesPerBox" always ≥ the tile count
 * the customer was just told to buy, so the two figures never contradict
 * each other even if a product's cached coverage-per-box happens to assume a
 * different tile size than the one actually being calculated here.
 * Coverage-per-box is used only as a fallback when tiles-per-box isn't set.
 */
export function calculateBoxes({ finalTiles, tilesPerBox, requiredAreaSqm, coveragePerBoxSqm }) {
  if (tilesPerBox > 0) {
    return Math.ceil(finalTiles / tilesPerBox);
  }
  if (coveragePerBoxSqm > 0) {
    return Math.ceil(requiredAreaSqm / coveragePerBoxSqm);
  }
  return null;
}

/** Estimated cost from either a per-tile or per-sq.ft price. Returns null if neither is available. */
export function calculateEstimatedCost({ finalTiles, areaSqft, pricePerTile, pricePerSqFt }) {
  if (pricePerTile > 0) return finalTiles * pricePerTile;
  if (pricePerSqFt > 0) return areaSqft * pricePerSqFt;
  return null;
}

/**
 * Runs the full pipeline for one or more areas (room/wall combinations) against
 * one tile size, and returns every figure the result card needs. Areas and
 * openings can each carry their own unit since real projects mix rooms
 * measured differently.
 *
 * @param {Object} input
 * @param {Array<{length:number,width:number,unit:string}>} input.areas
 * @param {Array<{width:number,height:number,quantity:number,unit:string}>} [input.openings]
 * @param {number} input.tileLength
 * @param {number} input.tileWidth
 * @param {string} input.tileUnit
 * @param {number} input.wastagePercent
 * @param {Object} [input.pricing] { tilesPerBox, coveragePerBox, coveragePerBoxUnit, pricePerTile, pricePerSqFt }
 */
export function runCalculation(input) {
  const { areas, openings = [], tileLength, tileWidth, tileUnit, wastagePercent, pricing = {} } = input;

  const grossAreaSqm = (areas || []).reduce((sum, a) => sum + calculateRoomArea(a.length, a.width, a.unit), 0);
  const deductionSqm = (openings || []).reduce((sum, o) => sum + calculateOpeningDeduction([o], o.unit), 0);
  const netAreaSqm = Math.max(0, grossAreaSqm - deductionSqm);

  const tileAreaSqm = calculateTileArea(tileLength, tileWidth, tileUnit);
  const baseTiles = calculateBaseTiles(netAreaSqm, tileAreaSqm);
  const wastageTiles = calculateWastage(baseTiles, wastagePercent);
  const finalTiles = calculateFinalTiles(baseTiles, wastageTiles);
  const coverageSqm = calculateCoverage(finalTiles, tileAreaSqm);

  const netAreaSqft = convertArea(netAreaSqm, 'm', 'ft');
  const tileAreaSqft = convertArea(tileAreaSqm, 'm', 'ft');
  const coverageSqft = convertArea(coverageSqm, 'm', 'ft');

  const tilesPerBox = Number(pricing.tilesPerBox) || 0;
  // coveragePerBox is given as an area in sq.ft (matches product data), not a length.
  const coveragePerBoxSqm = pricing.coveragePerBox ? convertArea(pricing.coveragePerBox, 'ft', 'm') : 0;
  const boxes = calculateBoxes({ finalTiles, tilesPerBox, requiredAreaSqm: netAreaSqm, coveragePerBoxSqm });
  const tilesFromBoxes = boxes != null && tilesPerBox > 0 ? boxes * tilesPerBox : null;

  const estimatedCost = calculateEstimatedCost({
    finalTiles,
    areaSqft: netAreaSqft,
    pricePerTile: Number(pricing.pricePerTile) || 0,
    pricePerSqFt: Number(pricing.pricePerSqFt) || 0
  });

  return {
    grossAreaSqft: convertArea(grossAreaSqm, 'm', 'ft'),
    grossAreaSqm,
    deductionSqft: convertArea(deductionSqm, 'm', 'ft'),
    netAreaSqft,
    netAreaSqm,
    tileAreaSqft,
    tileAreaSqm,
    baseTiles,
    wastageTiles,
    wastagePercent: Number(wastagePercent) || 0,
    finalTiles,
    coverageSqft,
    coverageSqm,
    boxes,
    tilesPerBox: tilesPerBox || null,
    tilesFromBoxes,
    estimatedCost
  };
}

/** Round for display only — never used on intermediate values. */
export function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

/**
 * Parses a flattened product size string like "600x600 mm" (the shape
 * products.size comes back in from GET /api/v1/products) into
 * { length, width, unit }, or null if it doesn't match. Never throws.
 */
export function parseSizeString(size) {
  if (!size || typeof size !== 'string') return null;
  const m = size.trim().match(/^(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)\s*([a-zA-Z]*)$/i);
  if (!m) return null;
  const [, length, width, rawUnit] = m;
  const unit = (rawUnit || 'mm').toLowerCase();
  const known = Object.keys(LENGTH_TO_M);
  return { length: Number(length), width: Number(width), unit: known.includes(unit) ? unit : 'mm' };
}

/** Builds a /calculator query string prefilled from a product record. */
export function buildCalculatorLink(product) {
  const parsed = parseSizeString(product?.size);
  if (!parsed) return '/calculator';
  const params = new URLSearchParams({
    tileLength: String(parsed.length),
    tileWidth: String(parsed.width),
    tileUnit: parsed.unit,
    productName: product.name || '',
    sku: product.sku || ''
  });
  const pricePerSqFt = product.offer_price || product.price;
  if (pricePerSqFt) params.set('pricePerSqFt', String(pricePerSqFt));
  if (product.pieces_per_box) params.set('tilesPerBox', String(product.pieces_per_box));
  if (product.coverage_sqft_per_box) params.set('coveragePerBox', String(product.coverage_sqft_per_box));
  return `/calculator?${params.toString()}`;
}
