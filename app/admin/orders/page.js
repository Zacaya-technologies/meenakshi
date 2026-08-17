'use client';

import { useEffect, useState } from 'react';
import { API } from '@/lib/api';
import { PageHeader, Card, Select, Badge, EmptyState } from '@/components/admin/AdminUI';

const STATUSES = ['Processing', 'Shipped', 'Delivered', 'Cancelled'];
const STATUS_TONE = { Processing: 'blue', Shipped: 'slate', Delivered: 'green', Cancelled: 'red' };

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await API.getOrders();
    if (res.success) setOrders(res.orders);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (order, status) => {
    setOrders(list => list.map(o => o.id === order.id ? { ...o, order_status: status } : o));
    await API.updateOrderStatus(order.id, status);
  };

  return (
    <div>
      <PageHeader title="Orders" subtitle={`${orders.length} orders placed`} />
      <Card className="p-0">
        {loading ? (
          <EmptyState label="Loading orders…" />
        ) : orders.length === 0 ? (
          <EmptyState label="No orders yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-slate-400 dark:border-white/10">
                  <th className="p-3.5">Order #</th>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">Amount</th>
                  <th className="p-3.5">Payment</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Update</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id} className="border-b border-border last:border-0 dark:border-white/5">
                    <td className="p-3.5 font-semibold text-ink dark:text-white">{o.order_number}</td>
                    <td className="p-3.5 text-xs text-slate-400">{o.customer_name}<br />{o.customer_phone}</td>
                    <td className="p-3.5 font-bold text-brand-blue">₹{Number(o.net_payable).toLocaleString('en-IN')}</td>
                    <td className="p-3.5"><Badge tone={o.payment_status === 'paid' ? 'green' : 'slate'}>{o.payment_status}</Badge></td>
                    <td className="p-3.5"><Badge tone={STATUS_TONE[o.order_status] || 'slate'}>{o.order_status}</Badge></td>
                    <td className="p-3.5">
                      <Select value={o.order_status} onChange={e => updateStatus(o, e.target.value)} className="w-40">
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </Select>
                    </td>
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
