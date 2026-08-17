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
          <Button type="submit" variant="outline"><Icon.search className="h-4 w-4" /></Button>
        </form>
      </div>

      <Card className="p-0">
        {loading ? (
          <EmptyState label="Loading products…" />
        ) : products.length === 0 ? (
          <EmptyState label="No products found." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-slate-400 dark:border-white/10">
                  <th className="p-3.5">Product</th>
                  <th className="p-3.5">SKU</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Price</th>
                  <th className="p-3.5">Stock</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id} className="border-b border-border last:border-0 dark:border-white/5">
                    <td className="flex items-center gap-3 p-3.5">
                      <img src={p.primary_image} alt="" className="h-10 w-10 rounded-lg object-cover" />
                      <span className="line-clamp-1 max-w-[220px] font-semibold text-ink dark:text-white">{p.name}</span>
                    </td>
                    <td className="p-3.5 text-xs text-slate-400">{p.sku}</td>
                    <td className="p-3.5 text-xs text-slate-400">{p.category_name}</td>
                    <td className="p-3.5 font-bold text-brand-blue">{formatPrice(p)}</td>
                    <td className="p-3.5 text-xs text-slate-400">{p.stock}</td>
                    <td className="p-3.5"><Badge tone={p.published ? 'green' : 'slate'}>{p.published ? 'Published' : 'Draft'}</Badge></td>
                    <td className="p-3.5 text-right">
                      <Link href={`/admin/products/${p.id}/edit`} className="mr-3 text-xs font-bold text-brand-blue hover:underline">Edit</Link>
                      <button onClick={() => duplicate(p)} className="mr-3 text-xs font-bold text-slate-400 hover:underline">Duplicate</button>
                      <button onClick={() => remove(p)} className="text-xs font-bold text-rose-500 hover:underline">Delete</button>
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
          <span className="text-sm text-slate-400">Page {pagination.page} of {pagination.pages}</span>
          <Button variant="outline" disabled={pagination.page >= pagination.pages} onClick={() => load(pagination.page + 1)}>Next →</Button>
        </div>
      )}
    </div>
  );
}
