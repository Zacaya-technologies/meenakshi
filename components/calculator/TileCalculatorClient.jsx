'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { API } from '@/lib/api';
import { useBusiness, waLink } from '@/lib/business';
import { Icon } from '@/components/ui/Icons';
import {
  ROOM_UNITS,
  TILE_UNITS,
  runCalculation,
  round2
} from '@/lib/calculator';
import { CALCULATOR_DEFAULTS } from '@/lib/calculatorDefaults';

let nextId = 1;
const newId = () => nextId++;

const CALC_TYPES = [
  { value: 'floor', label: 'Floor', icon: 'grid' },
  { value: 'wall', label: 'Wall', icon: 'building' },
  { value: 'multiple', label: 'Multiple Areas', icon: 'layers' }
];

function blankArea(label = '') {
  return { id: newId(), label, length: '', width: '', unit: 'ft' };
}
function blankOpening() {
  return { id: newId(), type: 'Door', width: '', height: '', quantity: 1, unit: 'ft' };
}

export default function TileCalculatorClient() {
  const business = useBusiness();
  const searchParams = useSearchParams();

  const [settings, setSettings] = useState(CALCULATOR_DEFAULTS);
  const [product, setProduct] = useState(null);

  const [calcType, setCalcType] = useState('floor');
  const [areas, setAreas] = useState([blankArea()]);
  const [openings, setOpenings] = useState([]);

  const [tileLength, setTileLength] = useState('');
  const [tileWidth, setTileWidth] = useState('');
  const [tileUnit, setTileUnit] = useState('mm');
  const [presetKey, setPresetKey] = useState('');
  const [tileLocked, setTileLocked] = useState(false);

  const [wastagePercent, setWastagePercent] = useState(CALCULATOR_DEFAULTS.default_wastage);
  const [customWastage, setCustomWastage] = useState('');
  const [attempted, setAttempted] = useState(false);

  const resultRef = useRef(null);

  useEffect(() => {
    API.getCalculatorSettings().then(res => {
      if (res?.success && res.settings) {
        setSettings(res.settings);
        setWastagePercent(res.settings.default_wastage ?? CALCULATOR_DEFAULTS.default_wastage);
      }
    });
  }, []);

  // Product-page / category-page prefill via query params — never hardcoded.
  useEffect(() => {
    const tl = searchParams.get('tileLength');
    const tw = searchParams.get('tileWidth');
    const tu = searchParams.get('tileUnit');
    if (tl && tw && Number(tl) > 0 && Number(tw) > 0) {
      setTileLength(tl);
      setTileWidth(tw);
      setTileUnit(tu || 'mm');
      setTileLocked(true);
    }
    const name = searchParams.get('productName');
    if (name) {
      setProduct({
        name,
        sku: searchParams.get('sku') || '',
        pricePerTile: searchParams.get('pricePerTile') || '',
        pricePerSqFt: searchParams.get('pricePerSqFt') || '',
        tilesPerBox: searchParams.get('tilesPerBox') || '',
        coveragePerBox: searchParams.get('coveragePerBox') || ''
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tileSizePresets = settings.tile_size_presets?.length ? settings.tile_size_presets : CALCULATOR_DEFAULTS.tile_size_presets;
  const wastageOptions = settings.wastage_options?.length ? settings.wastage_options : CALCULATOR_DEFAULTS.wastage_options;
  const areaPresets = settings.area_presets?.length ? settings.area_presets : CALCULATOR_DEFAULTS.area_presets;
  const maxWastage = settings.max_wastage ?? CALCULATOR_DEFAULTS.max_wastage;

  const setCalcTypeAndReset = (type) => {
    setCalcType(type);
    setAttempted(false);
    if (type === 'multiple') {
      setAreas([blankArea('Living Room'), blankArea('Kitchen')]);
      setOpenings([]);
    } else if (type === 'wall') {
      setAreas([blankArea()]);
    } else {
      setAreas([blankArea()]);
      setOpenings([]);
    }
  };

  const updateArea = (id, patch) => setAreas(prev => prev.map(a => (a.id === id ? { ...a, ...patch } : a)));
  const addArea = () => setAreas(prev => [...prev, blankArea()]);
  const removeArea = (id) => setAreas(prev => (prev.length > 1 ? prev.filter(a => a.id !== id) : prev));

  const updateOpening = (id, patch) => setOpenings(prev => prev.map(o => (o.id === id ? { ...o, ...patch } : o)));
  const addOpening = () => setOpenings(prev => [...prev, blankOpening()]);
  const removeOpening = (id) => setOpenings(prev => prev.filter(o => o.id !== id));

  const applyPreset = (index) => {
    if (index === '') {
      setPresetKey('');
      return;
    }
    const p = tileSizePresets[Number(index)];
    if (!p) return;
    setTileLength(String(p.length));
    setTileWidth(String(p.width));
    setTileUnit(p.unit);
    setPresetKey(index);
    setTileLocked(false);
  };

  const clearProductLock = () => {
    setTileLocked(false);
    setProduct(null);
  };

  // ---- Validation ----
  const errors = useMemo(() => {
    const e = {};
    areas.forEach((a, i) => {
      if (a.length === '' || a.length === null) e[`area-${a.id}-length`] = 'Please enter the length.';
      else if (Number(a.length) <= 0) e[`area-${a.id}-length`] = 'Must be greater than zero.';
      if (a.width === '' || a.width === null) e[`area-${a.id}-width`] = calcType === 'wall' ? 'Please enter the height.' : 'Please enter the width.';
      else if (Number(a.width) <= 0) e[`area-${a.id}-width`] = 'Must be greater than zero.';
    });
    if (tileLength === '' || tileLength === null) e.tileLength = 'Please enter the tile length.';
    else if (Number(tileLength) <= 0) e.tileLength = 'Must be greater than zero.';
    if (tileWidth === '' || tileWidth === null) e.tileWidth = 'Please enter the tile width.';
    else if (Number(tileWidth) <= 0) e.tileWidth = 'Must be greater than zero.';
    return e;
  }, [areas, tileLength, tileWidth, calcType]);

  const isValid = Object.keys(errors).length === 0;

  // ---- Live calculation ----
  const result = useMemo(() => {
    if (!isValid) return null;
    return runCalculation({
      areas: areas.map(a => ({ length: Number(a.length), width: Number(a.width), unit: a.unit })),
      openings: calcType === 'wall' ? openings.map(o => ({ width: Number(o.width) || 0, height: Number(o.height) || 0, quantity: Number(o.quantity) || 0, unit: o.unit })) : [],
      tileLength: Number(tileLength),
      tileWidth: Number(tileWidth),
      tileUnit,
      wastagePercent: Number(wastagePercent) || 0,
      pricing: product
        ? {
            pricePerTile: Number(product.pricePerTile) || 0,
            pricePerSqFt: Number(product.pricePerSqFt) || 0,
            tilesPerBox: Number(product.tilesPerBox) || 0,
            coveragePerBox: Number(product.coveragePerBox) || 0
          }
        : {}
    });
  }, [areas, openings, calcType, tileLength, tileWidth, tileUnit, wastagePercent, product, isValid]);

  const handleCalculate = () => {
    setAttempted(true);
    if (isValid) {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleReset = () => {
    setCalcType('floor');
    setAreas([blankArea()]);
    setOpenings([]);
    setTileLength('');
    setTileWidth('');
    setTileUnit('mm');
    setPresetKey('');
    setTileLocked(false);
    setProduct(null);
    setWastagePercent(settings.default_wastage ?? CALCULATOR_DEFAULTS.default_wastage);
    setCustomWastage('');
    setAttempted(false);
  };

  const enquireMessage = useMemo(() => {
    if (!result) return '';
    const lines = [
      'Hello, I need this tile.',
      '',
      product?.name ? `Tile:\n${product.name}` : null,
      product?.sku ? `SKU: ${product.sku}` : null,
      `Size:\n${round2(tileLength)} x ${round2(tileWidth)} ${TILE_UNITS.find(u => u.value === tileUnit)?.label || tileUnit}`,
      `Area:\n${round2(result.netAreaSqft)} sq.ft`,
      `Recommended Quantity:\n${result.finalTiles} tiles`,
      result.boxes != null ? `Boxes Required:\n${result.boxes}` : null,
      `Wastage:\n${result.wastagePercent}%`,
      '',
      'Please provide a quotation.'
    ].filter(Boolean);
    return lines.join('\n');
  }, [result, product, tileLength, tileWidth, tileUnit]);

  if (settings.enabled === false) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <Icon.ruler className="mx-auto h-12 w-12 text-slate-300" />
        <h1 className="mt-4 font-heading text-2xl font-bold text-ink dark:text-white">Calculator temporarily unavailable</h1>
        <p className="mt-2 text-sm text-slate-400">Please contact us directly for a tile quantity estimate.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
      <nav className="mb-4 flex items-center gap-1.5 text-xs text-slate-400">
        <a href="/" className="transition hover:text-brand-blue">Home</a>
        <Icon.arrowRight className="h-3.5 w-3.5" />
        <span className="font-semibold text-ink dark:text-white">Tile Calculator</span>
      </nav>

      <div className="mb-6">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-blue">Plan Your Order</span>
        <h1 className="mt-2 font-heading text-3xl font-extrabold text-ink dark:text-white sm:text-4xl">Tile Calculator</h1>
        <p className="mt-2 max-w-xl text-sm text-slate-500 dark:text-slate-400">
          Calculate how many tiles you need for your space — enter your dimensions and tile size below.
        </p>
      </div>

      {product && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border-[1.5px] border-brand-blue/30 bg-brand-blue/5 px-5 py-3.5">
          <div className="flex items-center gap-2 text-sm">
            <Icon.grid className="h-4 w-4 shrink-0 text-brand-blue" />
            <span className="text-slate-500 dark:text-slate-400">Calculating for:</span>
            <span className="font-bold text-ink dark:text-white">{product.name}</span>
          </div>
          <button onClick={clearProductLock} className="text-xs font-bold text-brand-blue hover:underline">
            Use a different tile size
          </button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        {/* ---- LEFT: Inputs ---- */}
        <div className="flex flex-col gap-5">
          {/* Calculation type */}
          <Card>
            <SectionLabel>Calculation Type</SectionLabel>
            <div className="grid grid-cols-3 gap-2">
              {CALC_TYPES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setCalcTypeAndReset(t.value)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border-[1.5px] py-3 text-xs font-bold transition ${
                    calcType === t.value
                      ? 'border-brand-blue bg-brand-blue/10 text-brand-blue'
                      : 'border-border text-slate-500 hover:border-brand-blue/40 dark:border-white/10 dark:text-slate-300'
                  }`}
                >
                  <Icon.grid className="h-4 w-4" />
                  {t.label}
                </button>
              ))}
            </div>
          </Card>

          {/* Areas */}
          <Card>
            <SectionLabel>{calcType === 'wall' ? 'Wall Dimensions' : calcType === 'multiple' ? 'Areas' : 'Area Dimensions'}</SectionLabel>
            <div className="flex flex-col gap-4">
              {areas.map((a, i) => (
                <div key={a.id} className={areas.length > 1 ? 'rounded-xl border border-border p-3.5 dark:border-white/10' : ''}>
                  {calcType === 'multiple' && (
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <select
                        value={areaPresets.includes(a.label) ? a.label : (a.label ? 'Custom' : '')}
                        onChange={e => updateArea(a.id, { label: e.target.value === 'Custom' ? '' : e.target.value })}
                        className={selectClass}
                      >
                        <option value="">Area {i + 1}</option>
                        {areaPresets.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                        <option value="Custom">Custom name…</option>
                      </select>
                      {areas.length > 1 && (
                        <button onClick={() => removeArea(a.id)} aria-label="Remove area" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10">
                          <Icon.close className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  )}
                  {calcType === 'multiple' && !areaPresets.includes(a.label) && (
                    <input
                      value={a.label}
                      onChange={e => updateArea(a.id, { label: e.target.value })}
                      placeholder="Area name (optional)"
                      className={`${inputClass} mb-3`}
                    />
                  )}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-[1fr_1fr_auto]">
                    <Field label={calcType === 'wall' ? 'Wall Length' : 'Length'} error={attempted && errors[`area-${a.id}-length`]}>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min="0"
                        value={a.length}
                        onChange={e => updateArea(a.id, { length: e.target.value })}
                        placeholder="e.g. 10"
                        className={inputClass}
                        aria-label={calcType === 'wall' ? 'Wall length' : 'Room length'}
                      />
                    </Field>
                    <Field label={calcType === 'wall' ? 'Wall Height' : 'Width'} error={attempted && errors[`area-${a.id}-width`]}>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min="0"
                        value={a.width}
                        onChange={e => updateArea(a.id, { width: e.target.value })}
                        placeholder={calcType === 'wall' ? 'e.g. 8' : 'e.g. 12'}
                        className={inputClass}
                        aria-label={calcType === 'wall' ? 'Wall height' : 'Room width'}
                      />
                    </Field>
                    <Field label="Unit">
                      <select value={a.unit} onChange={e => updateArea(a.id, { unit: e.target.value })} className={selectClass} aria-label="Dimension unit">
                        {ROOM_UNITS.map(u => (
                          <option key={u.value} value={u.value}>{u.label}</option>
                        ))}
                      </select>
                    </Field>
                  </div>
                </div>
              ))}
              {calcType === 'multiple' && (
                <button onClick={addArea} className="flex items-center justify-center gap-2 rounded-xl border-[1.5px] border-dashed border-border py-2.5 text-sm font-bold text-brand-blue transition hover:border-brand-blue dark:border-white/15">
                  + Add Another Area
                </button>
              )}
            </div>
          </Card>

          {/* Doors & windows (wall only) */}
          {calcType === 'wall' && (
            <Card>
              <SectionLabel>Doors &amp; Windows (optional)</SectionLabel>
              <div className="flex flex-col gap-3">
                {openings.map(o => (
                  <div key={o.id} className="grid grid-cols-2 gap-2.5 rounded-xl border border-border p-3 dark:border-white/10 sm:grid-cols-[1fr_1fr_1fr_0.7fr_auto]">
                    <select value={o.type} onChange={e => updateOpening(o.id, { type: e.target.value })} className={selectClass}>
                      <option>Door</option>
                      <option>Window</option>
                      <option>Other</option>
                    </select>
                    <input type="number" inputMode="decimal" min="0" placeholder="Width" value={o.width} onChange={e => updateOpening(o.id, { width: e.target.value })} className={inputClass} aria-label="Opening width" />
                    <input type="number" inputMode="decimal" min="0" placeholder="Height" value={o.height} onChange={e => updateOpening(o.id, { height: e.target.value })} className={inputClass} aria-label="Opening height" />
                    <input type="number" inputMode="numeric" min="1" placeholder="Qty" value={o.quantity} onChange={e => updateOpening(o.id, { quantity: e.target.value })} className={inputClass} aria-label="Opening quantity" />
                    <button onClick={() => removeOpening(o.id)} aria-label="Remove opening" className="flex h-full items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10">
                      <Icon.close className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button onClick={addOpening} className="flex items-center justify-center gap-2 rounded-xl border-[1.5px] border-dashed border-border py-2.5 text-sm font-bold text-brand-blue transition hover:border-brand-blue dark:border-white/15">
                  + Add Opening
                </button>
              </div>
            </Card>
          )}

          {/* Tile size */}
          <Card>
            <SectionLabel>Tile Size</SectionLabel>
            {tileLocked ? (
              <div className="rounded-xl border-[1.5px] border-border bg-brand-light px-4 py-3 text-sm dark:bg-navy dark:border-white/10">
                <span className="font-bold text-ink dark:text-white">{tileLength} × {tileWidth} {tileUnit}</span>
                <span className="ml-2 text-xs text-slate-400">(from selected product)</span>
              </div>
            ) : (
              <>
                <select value={presetKey} onChange={e => applyPreset(e.target.value)} className={`${selectClass} mb-3`}>
                  <option value="">Choose a preset size…</option>
                  {tileSizePresets.map((p, i) => (
                    <option key={i} value={i}>{p.length} × {p.width} {p.unit}</option>
                  ))}
                  <option value="">Custom Size</option>
                </select>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Tile Length" error={attempted && errors.tileLength}>
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      value={tileLength}
                      onChange={e => { setTileLength(e.target.value); setPresetKey(''); }}
                      placeholder="600"
                      className={inputClass}
                      aria-label="Tile length"
                    />
                  </Field>
                  <Field label="Tile Width" error={attempted && errors.tileWidth}>
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      value={tileWidth}
                      onChange={e => { setTileWidth(e.target.value); setPresetKey(''); }}
                      placeholder="600"
                      className={inputClass}
                      aria-label="Tile width"
                    />
                  </Field>
                  <Field label="Tile Unit">
                    <select value={tileUnit} onChange={e => setTileUnit(e.target.value)} className={selectClass} aria-label="Tile unit">
                      {TILE_UNITS.map(u => (
                        <option key={u.value} value={u.value}>{u.label}</option>
                      ))}
                    </select>
                  </Field>
                </div>
              </>
            )}
          </Card>

          {/* Wastage */}
          <Card>
            <SectionLabel>Wastage</SectionLabel>
            <div className="flex flex-wrap items-center gap-2">
              {wastageOptions.map(w => (
                <button
                  key={w}
                  type="button"
                  onClick={() => { setWastagePercent(w); setCustomWastage(''); }}
                  className={`rounded-full border-[1.5px] px-4 py-2 text-sm font-bold transition ${
                    Number(wastagePercent) === w && customWastage === ''
                      ? 'border-brand-blue bg-brand-blue text-white'
                      : 'border-border text-slate-500 hover:border-brand-blue/40 dark:border-white/10 dark:text-slate-300'
                  }`}
                >
                  {w}%
                </button>
              ))}
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  max={maxWastage}
                  placeholder="Custom"
                  value={customWastage}
                  onChange={e => {
                    const v = e.target.value;
                    setCustomWastage(v);
                    if (v !== '') setWastagePercent(Math.min(Number(v), maxWastage));
                  }}
                  className="w-24 rounded-full border-[1.5px] border-border bg-white px-3.5 py-2 text-sm text-ink outline-none transition focus:border-brand-blue dark:bg-navy2 dark:text-white dark:border-white/10"
                />
                <span className="text-sm text-slate-400">%</span>
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-400">Recommended: {settings.default_wastage ?? 10}% for straight laying. Maximum: {maxWastage}%.</p>
          </Card>

          <div className="flex gap-3">
            <button
              onClick={handleCalculate}
              className="flex-1 rounded-2xl bg-gradient-to-r from-brand-blue to-brand-deep py-4 text-sm font-bold text-white shadow-glow transition hover:-translate-y-0.5"
            >
              Calculate Tiles
            </button>
            <button
              onClick={handleReset}
              className="rounded-2xl border-[1.5px] border-border px-6 py-4 text-sm font-bold text-ink transition hover:border-brand-blue hover:text-brand-blue dark:border-white/10 dark:text-white"
            >
              Reset
            </button>
          </div>
        </div>

        {/* ---- RIGHT: Result ---- */}
        <div ref={resultRef} className="lg:sticky lg:top-[calc(var(--header-h)+16px)]">
          <ResultCard
            result={result}
            attempted={attempted}
            tileLength={tileLength}
            tileWidth={tileWidth}
            tileUnit={tileUnit}
            settings={settings}
            product={product}
            business={business}
            enquireMessage={enquireMessage}
          />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------- *
 * Sub-components
 * -------------------------------------------------------------------- */

const inputClass = 'w-full rounded-xl border-[1.5px] border-border bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-brand-blue dark:bg-navy2 dark:text-white dark:border-white/10';
const selectClass = 'w-full cursor-pointer rounded-xl border-[1.5px] border-border bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-brand-blue dark:bg-navy2 dark:text-white dark:border-white/10';

function Card({ children }) {
  return (
    <div className="rounded-[20px] border-[1.5px] border-border bg-white p-5 dark:bg-navy2 dark:border-white/10">
      {children}
    </div>
  );
}

function SectionLabel({ children }) {
  return <h2 className="mb-3.5 font-heading text-sm font-extrabold uppercase tracking-wide text-brand-blue">{children}</h2>;
}

function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</span>
      {children}
      {error && <span className="mt-1 block text-[11px] font-semibold text-rose-500">{error}</span>}
    </label>
  );
}

function ResultCard({ result, attempted, tileLength, tileWidth, tileUnit, settings, product, business, enquireMessage }) {
  if (!result) {
    return (
      <div className="rounded-[20px] border-[1.5px] border-dashed border-border bg-brand-light p-10 text-center dark:bg-navy dark:border-white/10">
        <Icon.ruler className="mx-auto h-10 w-10 text-slate-300" />
        <h3 className="mt-3 font-heading text-base font-bold text-ink dark:text-white">Your Tile Requirement</h3>
        <p className="mt-1.5 text-sm text-slate-400">
          {attempted ? 'Please fix the highlighted fields to see your result.' : 'Fill in your area and tile size to see the calculation.'}
        </p>
      </div>
    );
  }

  const showPrice = settings.enable_price !== false;
  const showBox = settings.enable_box !== false;
  const showWhatsapp = settings.enable_whatsapp !== false;

  return (
    <div className="rounded-[20px] border-[1.5px] border-brand-blue/25 bg-white shadow-card dark:bg-navy2">
      <div className="border-b border-border px-6 py-4 dark:border-white/10">
        <h3 className="font-heading text-base font-extrabold uppercase tracking-wide text-ink dark:text-white">Your Tile Requirement</h3>
      </div>

      <div className="flex flex-col gap-3.5 px-6 py-5">
        <Row label="Total Area" value={`${round2(result.netAreaSqft)} sq.ft`} sub={`${round2(result.netAreaSqm)} sq.m`} />
        {result.deductionSqft > 0 && (
          <Row label="Deducted (openings)" value={`${round2(result.deductionSqft)} sq.ft`} />
        )}
        <Row label="Tile Size" value={`${round2(tileLength)} × ${round2(tileWidth)} ${TILE_UNITS_LABEL[tileUnit] || tileUnit}`} />
        <Row label="Tile Coverage" value={`${round2(result.tileAreaSqft)} sq.ft / tile`} />
        <Row label="Base Requirement" value={`${result.baseTiles} tiles`} />
        <Row label={`Wastage (${result.wastagePercent}%)`} value={`${result.wastageTiles} tiles`} />

        <div className="my-1 rounded-2xl bg-gradient-to-r from-brand-blue to-brand-deep px-5 py-4 text-white shadow-glow">
          <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/80">Recommended Quantity</div>
          <div className="mt-1 font-heading text-3xl font-extrabold">{result.finalTiles} <span className="text-base font-bold">tiles</span></div>
        </div>

        <Row label="Estimated Coverage" value={`${round2(result.coverageSqft)} sq.ft`} sub={`${round2(result.coverageSqm)} sq.m`} />

        {showBox && result.boxes != null && (
          <>
            <Row label="Boxes Required" value={`${result.boxes} boxes`} />
            {result.tilesFromBoxes != null && (
              <Row label="Total Tiles From Boxes" value={`${result.tilesFromBoxes} tiles`} />
            )}
          </>
        )}

        {showPrice && (
          <Row
            label="Estimated Cost"
            value={result.estimatedCost != null ? `₹${Math.round(result.estimatedCost).toLocaleString('en-IN')}` : 'Price available on enquiry'}
          />
        )}
      </div>

      {showWhatsapp && (
        <div className="border-t border-border px-6 py-4 dark:border-white/10">
          <a
            href={waLink(business.whatsapp_number, enquireMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0E7A6E] hover:bg-[#0B655B] py-3.5 text-sm font-bold text-white transition hover:brightness-95"
          >
            <Icon.whatsapp className="h-4 w-4" /> Enquire For These Tiles
          </a>
        </div>
      )}
    </div>
  );
}

const TILE_UNITS_LABEL = { mm: 'mm', cm: 'cm', inch: 'inch', ft: 'ft', m: 'm' };

function Row({ label, value, sub }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-dashed border-border pb-3 last:border-none last:pb-0 dark:border-white/10">
      <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-right">
        <span className="block text-sm font-bold text-ink dark:text-white">{value}</span>
        {sub && <span className="block text-[11px] text-slate-400">{sub}</span>}
      </span>
    </div>
  );
}
