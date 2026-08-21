'use client';

import { useEffect, useMemo, useState } from 'react';
import { API } from '@/lib/api';
import { PageHeader, Card, Button, Field, Input, TextArea, Select, Toggle, Modal, Badge, EmptyState } from '@/components/admin/AdminUI';
import { AnyIcon, Icon } from '@/components/ui/Icons';

const emptyForm = {
  id: null, name: '', slug: '', parent_id: '', group_id: '', description: '', image: '', banner_url: '', icon: 'grid',
  seo_title: '', seo_description: '', status: 'active', display_order: 0, parent_main_id: '', composite_filters: {}
};

export default function AdminCategoriesPage() {
  const [tree, setTree] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedMain, setExpandedMain] = useState(null);
  const [activeGroup, setActiveGroup] = useState(null);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // { mode: 'main'|'sub', form }

  const load = async () => {
    setLoading(true);
    const [treeRes, groupsRes] = await Promise.all([API.getCategoryTree(), API.getCategoryGroups()]);
    if (treeRes.success) setTree(treeRes.tree);
    if (groupsRes.success) setGroups(groupsRes.groups);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const mainCategories = tree;
  const currentMain = mainCategories.find(m => m.id === expandedMain);
  const currentGroup = currentMain?.groups.find(g => g.id === activeGroup);

  const filteredChildren = useMemo(() => {
    if (!currentGroup) return [];
    if (!search) return currentGroup.children;
    return currentGroup.children.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  }, [currentGroup, search]);

  const openCreateMain = () => setModal({ mode: 'main', form: { ...emptyForm } });
  const openCreateSub = () => setModal({
    mode: 'sub',
    form: { ...emptyForm, parent_id: currentMain.id, group_id: currentGroup.id }
  });
  const openEdit = (cat, mode) => setModal({
    mode,
    form: {
      id: cat.id, name: cat.name, slug: cat.slug || '', parent_id: cat.parent_id || '', group_id: cat.group_id || '',
      description: cat.description || '', image: cat.image || '', banner_url: cat.banner_url || '', icon: cat.icon || 'grid',
      seo_title: cat.seo_title || '', seo_description: cat.seo_description || '',
      status: cat.status || 'active', display_order: cat.display_order || 0, parent_main_id: cat.parent_main_id || '',
      composite_filters: cat.composite_filters ? (() => { try { return JSON.parse(cat.composite_filters); } catch { return {}; } })() : {}
    }
  });

  const save = async (form) => {
    const payload = {
      name: form.name, parent_id: form.parent_id || null, group_id: form.group_id || null,
      description: form.description, image: form.image, banner_url: form.banner_url, icon: form.icon,
      seo_title: form.seo_title, seo_description: form.seo_description,
      status: form.status, display_order: parseInt(form.display_order) || 0,
      parent_main_id: form.parent_main_id || null,
      composite_filters: form.composite_filters && Object.keys(form.composite_filters).length ? form.composite_filters : null
    };
    if (form.slug && form.slug !== '') payload.slug = form.slug;
    const res = form.id ? await API.updateCategory(form.id, payload) : await API.createCategory(payload);
    if (!res.success) { alert(res.message || 'Failed to save category'); return; }
    setModal(null);
    await load();
  };

  const remove = async (cat) => {
    if (!confirm(`Delete "${cat.name}"? ${cat.parent_id ? '' : 'This also deletes every subcategory under it.'}`)) return;
    const res = await API.deleteCategory(cat.id);
    if (!res.success) { alert(res.message); return; }
    if (expandedMain === cat.id) setExpandedMain(null);
    await load();
  };

  const toggleStatus = async (cat) => {
    await API.updateCategory(cat.id, { status: cat.status === 'active' ? 'inactive' : 'active' });
    await load();
  };

  if (loading) return <EmptyState label="Loading category tree…" />;

  return (
    <div>
      <PageHeader
        title="Categories"
        subtitle="Main categories, plus every Area/Size/Design/Type/Finish/Color value beneath them — fully database-driven."
        action={<Button onClick={openCreateMain}><Icon.grid className="h-4 w-4" /> Add Main Category</Button>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {mainCategories.map(main => (
          <Card key={main.id} className={`cursor-pointer transition ${expandedMain === main.id ? 'border-brand-blue' : ''}`}>
            <div onClick={() => { setExpandedMain(main.id); setActiveGroup(main.groups.find(g => g.children.length)?.id || main.groups[0]?.id); setSearch(''); }}>
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue">
                  <AnyIcon id={main.icon} className="h-5 w-5" />
                </span>
                <Badge tone={main.status === 'active' ? 'green' : 'red'}>{main.status}</Badge>
              </div>
              <h3 className="mt-3 font-heading text-sm font-bold text-ink dark:text-white">{main.name}</h3>
              <p className="text-xs text-slate-400">/{main.slug}</p>
              <p className="mt-1 text-[11px] text-slate-400">
                {main.groups.reduce((n, g) => n + g.children.length, 0)} subcategories
                {main.rooms?.length ? ` · ${main.rooms.length} room${main.rooms.length > 1 ? 's' : ''}: ${main.rooms.map(r => r.name).join(', ')}` : ''}
              </p>
            </div>
            <div className="mt-3 flex gap-2 border-t border-border pt-3 dark:border-white/10">
              <button onClick={() => openEdit(main, 'main')} className="text-xs font-bold text-brand-blue hover:underline">Edit</button>
              <button onClick={() => toggleStatus(main)} className="text-xs font-bold text-slate-400 hover:underline">
                {main.status === 'active' ? 'Disable' : 'Enable'}
              </button>
              <button onClick={() => remove(main)} className="ml-auto text-xs font-bold text-rose-500 hover:underline">Delete</button>
            </div>
          </Card>
        ))}
      </div>

      {currentMain && (
        <div className="mt-6">
          <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-border pb-3 dark:border-white/10">
            {currentMain.groups.map(g => (
              <button
                key={g.id}
                onClick={() => { setActiveGroup(g.id); setSearch(''); }}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold transition ${
                  activeGroup === g.id ? 'bg-brand-blue text-white' : 'bg-brand-light text-slate-500 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-400'
                }`}
              >
                <AnyIcon id={g.icon} className="h-3.5 w-3.5" />
                {g.name} <span className="opacity-70">({g.children.length})</span>
              </button>
            ))}
          </div>

          {currentGroup && (
            <Card>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={`Search ${currentGroup.name.toLowerCase()}…`}
                  className="max-w-xs"
                />
                <Button variant="outline" onClick={openCreateSub}>
                  <Icon.grid className="h-4 w-4" /> Add {currentGroup.name.replace('By ', '')} Category
                </Button>
              </div>

              {filteredChildren.length === 0 ? (
                <EmptyState label="No categories yet — add the first one above." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs uppercase text-slate-400 dark:border-white/10">
                        <th className="py-2 pr-3">Name</th>
                        <th className="py-2 pr-3">URL</th>
                        <th className="py-2 pr-3">Products</th>
                        <th className="py-2 pr-3">Status</th>
                        <th className="py-2 pr-3">Order</th>
                        <th className="py-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredChildren.map(c => (
                        <tr key={c.id} className="border-b border-border last:border-0 dark:border-white/5">
                          <td className="py-2.5 pr-3 font-semibold text-ink dark:text-white">{c.name}</td>
                          <td className="py-2.5 pr-3 text-xs text-slate-400">/{currentMain.slug}/{c.slug}</td>
                          <td className="py-2.5 pr-3 text-xs text-slate-400">{c.product_count || 0}</td>
                          <td className="py-2.5 pr-3"><Badge tone={c.status === 'active' ? 'green' : 'red'}>{c.status}</Badge></td>
                          <td className="py-2.5 pr-3 text-xs text-slate-400">{c.display_order}</td>
                          <td className="py-2.5 text-right">
                            <button onClick={() => openEdit(c, 'sub')} className="mr-3 text-xs font-bold text-brand-blue hover:underline">Edit</button>
                            <button onClick={() => toggleStatus(c)} className="mr-3 text-xs font-bold text-slate-400 hover:underline">
                              {c.status === 'active' ? 'Disable' : 'Enable'}
                            </button>
                            <button onClick={() => remove(c)} className="text-xs font-bold text-rose-500 hover:underline">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}
        </div>
      )}

      {modal && (
        <CategoryFormModal
          mode={modal.mode}
          form={modal.form}
          groups={groups}
          mainCategories={mainCategories}
          currentMain={currentMain}
          onClose={() => setModal(null)}
          onSave={save}
        />
      )}
    </div>
  );
}

function CategoryFormModal({ mode, form: initial, groups, mainCategories, currentMain, onClose, onSave }) {
  const [form, setForm] = useState(initial);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Every sibling value under the current main, grouped by facet — the pool a
  // composite category (e.g. "Anti Skid Terrace Tiles") can combine with.
  const siblingsByGroup = useMemo(() => {
    if (mode !== 'sub' || !currentMain) return {};
    const out = {};
    currentMain.groups.forEach(g => { out[g.group_key] = { name: g.name, items: g.children }; });
    return out;
  }, [mode, currentMain]);

  const compositeEntries = Object.entries(form.composite_filters || {});
  const addCompositeFilter = () => {
    const firstKey = Object.keys(siblingsByGroup).find(k => !form.composite_filters?.[k]);
    if (!firstKey) return;
    const firstSlug = siblingsByGroup[firstKey].items[0]?.slug;
    if (!firstSlug) return;
    setForm(f => ({ ...f, composite_filters: { ...f.composite_filters, [firstKey]: firstSlug } }));
  };
  const removeCompositeFilter = (key) => setForm(f => {
    const next = { ...f.composite_filters };
    delete next[key];
    return { ...f, composite_filters: next };
  });
  const setCompositeGroup = (oldKey, newKey) => setForm(f => {
    const next = { ...f.composite_filters };
    delete next[oldKey];
    next[newKey] = siblingsByGroup[newKey]?.items[0]?.slug || '';
    return { ...f, composite_filters: next };
  });
  const setCompositeValue = (key, slug) => setForm(f => ({ ...f, composite_filters: { ...f.composite_filters, [key]: slug } }));

  return (
    <Modal open onClose={onClose} title={form.id ? `Edit ${mode === 'main' ? 'Main Category' : 'Category'}` : `Add ${mode === 'main' ? 'Main Category' : 'Category'}`} wide>
      <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Name" required>
          <Input value={form.name} onChange={e => set('name', e.target.value)} required autoFocus />
        </Field>
        <Field label="Icon key" hint="e.g. mapPin, ruler, palette, stack, brush, contrast, layout, drop, restaurant">
          <Input value={form.icon} onChange={e => set('icon', e.target.value)} />
        </Field>

        {mode === 'sub' && (
          <>
            <Field label="Parent (main category)" required>
              <Select value={form.parent_id} onChange={e => set('parent_id', e.target.value)} required>
                <option value="">— Select —</option>
                {mainCategories.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </Select>
            </Field>
            <Field label="Facet group" required>
              <Select value={form.group_id} onChange={e => set('group_id', e.target.value)} required>
                <option value="">— Select —</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </Select>
            </Field>

            <Field
              label="Composite of (optional)"
              hint="Combine this value with one or more other filters instead of tagging products to it directly — e.g. 'Anti Skid Terrace Tiles' = Area: Terrace + Finish: Anti Skid. The page always shows the live, matching products; nothing is duplicated."
              className="sm:col-span-2"
            >
              <div className="flex flex-col gap-2">
                {compositeEntries.map(([key, slug]) => (
                  <div key={key} className="flex items-center gap-2">
                    <Select value={key} onChange={e => setCompositeGroup(key, e.target.value)} className="w-40">
                      {Object.keys(siblingsByGroup).map(gk => (
                        <option key={gk} value={gk} disabled={gk !== key && !!form.composite_filters?.[gk]}>
                          {siblingsByGroup[gk].name}
                        </option>
                      ))}
                    </Select>
                    <Select value={slug} onChange={e => setCompositeValue(key, e.target.value)} className="flex-1">
                      {(siblingsByGroup[key]?.items || []).map(item => (
                        <option key={item.slug} value={item.slug}>{item.name}</option>
                      ))}
                    </Select>
                    <button type="button" onClick={() => removeCompositeFilter(key)} className="shrink-0 text-slate-400 hover:text-rose-500">
                      <Icon.close className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {compositeEntries.length < Object.keys(siblingsByGroup).length && (
                  <button type="button" onClick={addCompositeFilter} className="self-start text-xs font-bold text-brand-blue hover:underline">
                    + Add filter
                  </button>
                )}
              </div>
            </Field>
          </>
        )}

        {mode === 'main' && (
          <Field label="Room of (parent main)" hint="Leave blank for a standalone main. Linking a main to Living Room Tiles surfaces it in that main's BY AREA menu column.">
            <Select value={form.parent_main_id} onChange={e => set('parent_main_id', e.target.value)}>
              <option value="">— None (standalone) —</option>
              {mainCategories.filter(m => String(m.id) !== String(form.id)).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </Select>
          </Field>
        )}

        <Field label="Image URL" className="sm:col-span-2">
          <Input value={form.image} onChange={e => set('image', e.target.value)} placeholder="https://…" />
        </Field>
        <Field label="Banner URL" hint="Optional wide banner shown at the top of the category page" className="sm:col-span-2">
          <Input value={form.banner_url} onChange={e => set('banner_url', e.target.value)} placeholder="https://…" />
        </Field>
        <Field label="URL slug (optional)" hint="Leave blank to auto-generate from the name; must be unique among siblings">
          <Input value={form.slug} onChange={e => set('slug', e.target.value)} placeholder={form.name ? form.name.toLowerCase().replace(/\s+/g, '-') : 'auto'} />
        </Field>
        <Field label="Description" hint="Shown on the category landing page">
          <TextArea rows={2} value={form.description} onChange={e => set('description', e.target.value)} />
        </Field>
        <Field label="Display order">
          <Input type="number" value={form.display_order} onChange={e => set('display_order', e.target.value)} />
        </Field>

        <Field label="SEO title">
          <Input value={form.seo_title} onChange={e => set('seo_title', e.target.value)} />
        </Field>
        <Field label="SEO description">
          <Input value={form.seo_description} onChange={e => set('seo_description', e.target.value)} />
        </Field>

        <div className="flex items-center justify-between sm:col-span-2">
          <Toggle checked={form.status === 'active'} onChange={v => set('status', v ? 'active' : 'inactive')} label="Active (visible on storefront)" />
        </div>

        <div className="flex justify-end gap-2 sm:col-span-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit">{form.id ? 'Save Changes' : 'Create Category'}</Button>
        </div>
      </form>
    </Modal>
  );
}
