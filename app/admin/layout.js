import AdminShell from '@/components/admin/AdminShell';

export const metadata = { title: 'Admin Console | Meenakshi Build World', robots: { index: false, follow: false } };

export default function AdminLayout({ children }) {
  return <AdminShell>{children}</AdminShell>;
}
