'use client';

import { API } from '@/lib/api';
import { PageHeader } from '@/components/admin/AdminUI';
import ProductForm from '@/components/admin/ProductForm';

export default function NewProductPage() {
  return (
    <div>
      <PageHeader title="Add Product" subtitle="Publish a new SKU into the catalog." />
      <ProductForm initial={null} onSubmit={(payload) => API.createProduct(payload)} submitLabel="Publish Product" />
    </div>
  );
}
