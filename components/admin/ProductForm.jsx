'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API } from '@/lib/api';
import { Card, Button, Field, Input, TextArea, Select, Toggle } from '@/components/admin/AdminUI';
import { Icon } from '@/components/ui/Icons';

const FACET_GROUP_ORDER = ['area', 'application', 'size', 'design', 'type', 'finish', 'color', 'surface'];

export default function ProductForm({ initial, onSubmit, submitLabel }) {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [collections, setCollections] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: initial?.product?.name || '',
    brand_id: initial?.product?.brand_id || '',
    collection_id: initial?.product?.collection_id || '',
    price: initial?.product?.price || '',
    offer_price: initial?.product?.offer_price || '',
    dealer_price: initial?.product?.dealer_price || '',
    stock: initial?.product?.stock ?? 100,
    description: initial?.product?.description || '',
    is_featured: !!initial?.product?.is_featured,
    is_trending: !!initial?.product?.is_trending,
    published: initial?.product?.published !== 0,
    seo_title: initial?.product?.seo_title || '',
    seo_description: initial?.product?.seo_description || ''
  });
  const [mainCategoryId, setMainCategoryId] = useState('');
  const [facetSelections, setFacetSelections] = useState({});
  const [images, setImages] = useState(initial?.images?.length ? initial.images.map(i => ({ url: i.image_url, alt: i.alt_text || '', is_primary: !!i.is_primary })) : [{ url: '', alt: '', is_primary: true }]);
  const [attributeAnswers, setAttributeAnswers] = useState({});

  // Load categories + brands + collections once.
  useEffect(() => {
    (async () => {
      const [catRes, brandRes, colRes] = await Promise.all([API.getCategories(), API.getBrands(), API.getCollections()]);
      if (catRes.success) setCategories(catRes.categories);
      if (brandRes.success) setBrands(brandRes.brands);
      if (colRes.success) setCollections(colRes.collections);
    })();
  }, []);

  // Once categories are loaded, resolve the product's main category + facet
  // selections (multi-select) from its tagged category_ids (edit mode only).
  useEffect(() => {
    if (!categories.length || !initial?.category_ids?.length) return;
    const tagged = categories.filter(c => initial.category_ids.includes(c.id));
    const main = tagged.find(c => !c.parent_id);
    if (main) setMainCategoryId(String(main.id));
    const selections = {};
    tagged.filter(c => c.parent_id).forEach(c => {
      if (!selections[c.group_key]) selections[c.group_key] = [];
      selections[c.group_key].push(c.id);
    });
    setFacetSelections(selections);
  }, [categories, initial]);

  useEffect(() => {
    if (!initial?.attribute_assignments) return;
    const answers = {};
    initial.attribute_assignments.forEach(a => {
      answers[a.attribute_id] = a.attribute_value_id ? { attribute_value_id: a.attribute_value_id } : { custom_value: a.custom_value };
    });
    setAttributeAnswers(answers);
  }, [initial]);

  // Load spec attributes whenever the main category changes.
  useEffect(() => {
    if (!mainCategoryId) { setAttributes([]); return; }
    API.getCategoryAttributes(mainCategoryId).then(res => { if (res.success) setAttributes(res.attributes); });
  }, [mainCategoryId]);

  const mainCategories = useMemo(() => categories.filter(c => !c.parent_id), [categories]);
  const facetGroups = useMemo(() => {
    if (!mainCategoryId) return [];
    const children = categories.filter(c => String(c.parent_id) === String(mainCategoryId));
    const byGroup = {};
    children.forEach(c => {
      if (!byGroup[c.group_key]) byGroup[c.group_key] = { key: c.group_key, name: c.group_name, items: [] };
      byGroup[c.group_key].items.push(c);
    });
    // Room mains (Bedroom / Hallway / Pooja / Drawing / Dining) are linked to
    // this main via parent_main_id — surface them in the "area" facet group so
    // one product can be tagged into multiple rooms without duplication.
    const linkedRooms = categories.filter(c => !c.parent_id && String(c.parent_main_id || '') === String(mainCategoryId));
    if (linkedRooms.length) {
      const area = byGroup['area'] || { key: 'area', name: 'By Area', items: [] };
      area.items.push(...linkedRooms);
      byGroup['area'] = area;
    }
    return FACET_GROUP_ORDER.filter(k => byGroup[k]).map(k => byGroup[k]);
  }, [categories, mainCategoryId]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleFacet = (key, id) => setFacetSelections(s => {
    const current = s[key] || [];
    const next = current.includes(id) ? current.filter(x => x !== id) : [...current, id];
    return { ...s, [key]: next.length ? next : null };
  });

  const addImage = () => setImages(list => [...list, { url: '', alt: '', is_primary: false }]);
  const removeImage = (i) => setImages(list => list.filter((_, idx) => idx !== i));
  const updateImage = (i, patch) => setImages(list => list.map((img, idx) => idx === i ? { ...img, ...patch } : img));
  const setPrimary = (i) => setImages(list => list.map((img, idx) => ({ ...img, is_primary: idx === i })));

  const setAttributeAnswer = (attrId, answer) => setAttributeAnswers(a => ({ ...a, [attrId]: answer }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!mainCategoryId) { setError('Select a main category.'); return; }

    const category_ids = [parseInt(mainCategoryId), ...Object.values(facetSelections).filter(Boolean).flat()];
    const validImages = images.filter(img => img.url.trim());
    const attributesPayload = Object.entries(attributeAnswers)
      .filter(([, ans]) => ans && (ans.attribute_value_id || ans.custom_value))
      .map(([attribute_id, ans]) => ({ attribute_id: parseInt(attribute_id), ...ans }));

    setSaving(true);
    const res = await onSubmit({
      ...form,
      price: parseFloat(form.price),
      offer_price: form.offer_price ? parseFloat(form.offer_price) : null,
      dealer_price: form.dealer_price ? parseFloat(form.dealer_price) : null,
      stock: parseInt(form.stock) || 0,
      brand_id: form.brand_id || null,
      collection_id: form.collection_id || null,
      category_ids,
      images: validImages.length ? validImages : undefined,
      attributes: attributesPayload
    });
    setSaving(false);
    if (!res.success) { setError(res.message || 'Failed to save product'); return; }
    router.push('/admin/products');
  };

  return (
    <form onSubmit={submit} className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <div className="flex flex-col gap-5 lg:col-span-2">
        <Card>
          <h3 className="mb-4 font-heading text-sm font-bold text-ink dark:text-white">Basic Details</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Product name" required className="sm:col-span-2">
              <Input value={form.name} onChange={e => set('name', e.target.value)} required autoFocus />
            </Field>
            <Field label="Brand">
              <Select value={form.brand_id} onChange={e => set('brand_id', e.target.value)}>
                <option value="">— None —</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </Select>
            </Field>
            <Field label="Collection">
              <Select value={form.collection_id} onChange={e => set('collection_id', e.target.value)}>
                <option value="">— None —</option>
                {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
            <Field label="Description" className="sm:col-span-2">
              <TextArea rows={3} value={form.description} onChange={e => set('description', e.target.value)} />
            </Field>
          </div>
        </Card>

        <Card>
          <h3 className="mb-1 font-heading text-sm font-bold text-ink dark:text-white">Category & Taxonomy</h3>
          <p className="mb-4 text-xs text-slate-400">Pick the main category, then one or more values per facet group — exactly what drives the mega menu, filters and this product's URL tags.</p>
          <Field label="Main category" required>
            <Select value={mainCategoryId} onChange={e => { setMainCategoryId(e.target.value); setFacetSelections({}); }} required>
              <option value="">— Select —</option>
              {mainCategories.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </Select>
          </Field>

          {facetGroups.length > 0 && (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {facetGroups.map(g => (
                <Field key={g.key} label={`${g.name} (multi)`}>
                  <div className="flex flex-wrap gap-1.5">
                    {g.items.map(item => {
                      const active = (facetSelections[g.key] || []).includes(item.id);
                      return (
                        <button
                          type="button"
                          key={item.id}
                          onClick={() => toggleFacet(g.key, item.id)}
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                            active
                              ? 'bg-brand-blue text-white shadow-sm'
                              : 'bg-brand-light text-slate-500 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-400'
                          }`}
                        >
                          {item.name}
                        </button>
                      );
                    })}
                  </div>
                </Field>
              ))}
            </div>
          )}
        </Card>

        {attributes.length > 0 && (
          <Card>
            <h3 className="mb-4 font-heading text-sm font-bold text-ink dark:text-white">Technical Specifications</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {attributes.map(attr => (
                <Field key={attr.id} label={attr.unit ? `${attr.name} (${attr.unit})` : attr.name}>
                  {attr.input_type === 'select' ? (
                    <Select
                      value={attributeAnswers[attr.id]?.attribute_value_id || ''}
                      onChange={e => setAttributeAnswer(attr.id, e.target.value ? { attribute_value_id: parseInt(e.target.value) } : null)}
                    >
                      <option value="">— None —</option>
                      {attr.values.map(v => <option key={v.id} value={v.id}>{v.value}</option>)}
                    </Select>
                  ) : (
                    <Input
                      value={attributeAnswers[attr.id]?.custom_value || ''}
                      onChange={e => setAttributeAnswer(attr.id, e.target.value ? { custom_value: e.target.value } : null)}
                    />
                  )}
                </Field>
              ))}
            </div>
          </Card>
        )}

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-heading text-sm font-bold text-ink dark:text-white">Images</h3>
            <Button type="button" variant="outline" onClick={addImage}><Icon.grid className="h-3.5 w-3.5" /> Add Image</Button>
          </div>
          <div className="flex flex-col gap-3">
            {images.map((img, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input value={img.url} onChange={e => updateImage(i, { url: e.target.value })} placeholder="https://…" className="flex-1" />
                <Input value={img.alt} onChange={e => updateImage(i, { alt: e.target.value })} placeholder="Alt text" className="w-40" />
                <button type="button" onClick={() => setPrimary(i)} className={`shrink-0 rounded-lg px-2.5 py-2 text-[11px] font-bold ${img.is_primary ? 'bg-brand-blue text-white' : 'bg-brand-light text-slate-500 dark:bg-white/5'}`}>
                  Primary
                </button>
                <button type="button" onClick={() => removeImage(i)} className="shrink-0 text-slate-400 hover:text-rose-500" aria-label="Remove image">
                  <Icon.close className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 font-heading text-sm font-bold text-ink dark:text-white">SEO</h3>
          <div className="grid grid-cols-1 gap-4">
            <Field label="SEO title"><Input value={form.seo_title} onChange={e => set('seo_title', e.target.value)} /></Field>
            <Field label="SEO description"><TextArea rows={2} value={form.seo_description} onChange={e => set('seo_description', e.target.value)} /></Field>
          </div>
        </Card>
      </div>

      <div className="flex flex-col gap-5">
        <Card>
          <h3 className="mb-4 font-heading text-sm font-bold text-ink dark:text-white">Pricing & Stock</h3>
          <div className="grid grid-cols-1 gap-4">
            <Field label="Price (₹/sq.ft)" required><Input type="number" step="0.01" value={form.price} onChange={e => set('price', e.target.value)} required /></Field>
            <Field label="Offer price"><Input type="number" step="0.01" value={form.offer_price} onChange={e => set('offer_price', e.target.value)} /></Field>
            <Field label="Dealer price"><Input type="number" step="0.01" value={form.dealer_price} onChange={e => set('dealer_price', e.target.value)} /></Field>
            <Field label="Stock (boxes)"><Input type="number" value={form.stock} onChange={e => set('stock', e.target.value)} /></Field>
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 font-heading text-sm font-bold text-ink dark:text-white">Visibility</h3>
          <div className="flex flex-col gap-3">
            <Toggle checked={form.published} onChange={v => set('published', v)} label="Published (visible on storefront)" />
            <Toggle checked={form.is_featured} onChange={v => set('is_featured', v)} label="Featured" />
            <Toggle checked={form.is_trending} onChange={v => set('is_trending', v)} label="Trending" />
          </div>
        </Card>

        {error && <div className="rounded-xl bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-600 dark:bg-rose-500/10">{error}</div>}

        <Button type="submit" disabled={saving} className="w-full">
          {saving ? 'Saving…' : (submitLabel || 'Save Product')}
        </Button>
      </div>
    </form>
  );
}
