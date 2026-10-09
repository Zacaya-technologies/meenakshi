'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { API, formatPrice } from '@/lib/api';
import { PageHeader, Card, Button, Input, Badge, EmptyState } from '@/components/admin/AdminUI';
import { Icon } from '@/components/ui/Icons';

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (page = 1, query = q) => {
    setLoading(true);
    const qs = new URLSearchParams({ limit: 20, page, ...(query ? { q: query } : {}) }).toString();
    const res = await API.getProducts(`?${qs}`);
    if (res.success) { setProducts(res.products); setPagination(res.pagination); }
    setLoading(false);
  }, [q]);

  useEffect(() => { load(1); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const remove = async (p) => {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    await API.deleteProduct(p.id);
    load(pagination.page);
  };

  const duplicate = async (p) => {
    const res = await API.duplicateProduct(p.id);
    if (!res.success) { alert(res.message); return; }
    load(pagination.page);
  };

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle={`${pagination.total} products in the catalog`}
        action={<Link href="/admin/products/new"><Button><Icon.grid className="h-4 w-4" /> Add Product</Button></Link>}
      />

      <div className="mb-4 max-w-sm">
        <form onSubmit={e => { e.preventDefault(); load(1); }} className="flex gap-2">
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name, SKU…" />
          <Button type="submit" variant="outline" aria-label="Search products"><Icon.search className="h-4 w-4" /></Button>
        </form>
      </div>

      <Card className="p-0">
        {loading ? (
          <EmptyState label="Loading products…" />
        ) : products.length === 0 ? (
          <EmptyState label="No products found." />
        ) : (
          <div className="overflow-x-auto">
            {/* Secondary columns drop away on narrow screens (SKU moves under the
                name) so the table fits a phone without sideways scrolling. */}
            <table className="w-full border-collapse text-sm lg:min-w-[820px]">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-slate-500 dark:border-white/10">
                  <th className="p-3.5">Product</th>
                  <th className="hidden p-3.5 lg:table-cell">SKU</th>
                  <th className="hidden p-3.5 xl:table-cell">Category</th>
                  <th className="hidden p-3.5 md:table-cell">Price</th>
                  <th className="hidden p-3.5 xl:table-cell">Stock</th>
                  <th className="hidden p-3.5 sm:table-cell">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id} className="border-b border-border last:border-0 dark:border-white/5">
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <img src={p.primary_image} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                        <div className="min-w-0">
                          <span className="line-clamp-2 max-w-[260px] font-semibold text-ink dark:text-white">{p.name}</span>
                          <span className="block text-[11px] text-slate-500 lg:hidden">{p.sku}</span>
                        </div>
                      </div>
                    </td>
                    <td className="hidden p-3.5 text-xs text-slate-500 lg:table-cell">{p.sku}</td>
                    <td className="hidden p-3.5 text-xs text-slate-500 xl:table-cell">{p.category_name}</td>
                    <td className="hidden p-3.5 font-bold text-brand-blue md:table-cell">{formatPrice(p)}</td>
                    <td className="hidden p-3.5 text-xs text-slate-500 xl:table-cell">{p.stock}</td>
                    <td className="hidden p-3.5 sm:table-cell"><Badge tone={p.published ? 'green' : 'slate'}>{p.published ? 'Published' : 'Draft'}</Badge></td>
                    <td className="p-3.5 text-right">
                      <div className="flex flex-col items-end gap-1.5 sm:flex-row sm:justify-end sm:gap-3">
                        <Link href={`/admin/products/${p.id}/edit`} className="text-xs font-bold text-brand-blue hover:underline">Edit</Link>
                        <button onClick={() => duplicate(p)} className="text-xs font-bold text-slate-500 hover:underline dark:text-slate-400">Duplicate</button>
                        <button onClick={() => remove(p)} className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {pagination.pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <Button variant="outline" disabled={pagination.page <= 1} onClick={() => load(pagination.page - 1)}>← Prev</Button>
          <span className="text-sm text-slate-500 dark:text-slate-400">Page {pagination.page} of {pagination.pages}</span>
          <Button variant="outline" disabled={pagination.page >= pagination.pages} onClick={() => load(pagination.page + 1)}>Next →</Button>
        </div>
      )}
    </div>
  );
}
