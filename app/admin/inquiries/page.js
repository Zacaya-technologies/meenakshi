'use client';

import { useEffect, useState } from 'react';
import { API } from '@/lib/api';
import { PageHeader, Card, Badge, EmptyState } from '@/components/admin/AdminUI';

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.getInquiries().then(res => {
      if (res.success) setInquiries(res.inquiries);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <PageHeader title="Inquiries" subtitle="WhatsApp quotes, sample requests and bulk RFQs submitted by shoppers." />
      <Card className="p-0">
        {loading ? (
          <EmptyState label="Loading inquiries…" />
        ) : inquiries.length === 0 ? (
          <EmptyState label="No inquiries yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-slate-400 dark:border-white/10">
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Name / Phone</th>
                  <th className="p-3.5">Product</th>
                  <th className="p-3.5">Received</th>
                </tr>
              </thead>
              <tbody>
                {inquiries.map(i => (
                  <tr key={i.id} className="border-b border-border last:border-0 dark:border-white/5">
                    <td className="p-3.5"><Badge tone="blue">{i.type}</Badge></td>
                    <td className="p-3.5 text-xs text-slate-500 dark:text-slate-300">{i.name || '—'}{i.phone ? ` • ${i.phone}` : ''}</td>
                    <td className="p-3.5 text-xs text-slate-400">{i.product_name || 'General inquiry'}</td>
                    <td className="p-3.5 text-xs text-slate-400">{i.created_at ? new Date(i.created_at).toLocaleString('en-IN') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
