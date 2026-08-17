'use client';

import { useEffect, useState } from 'react';
import { API } from '@/lib/api';
import { PageHeader, EmptyState } from '@/components/admin/AdminUI';
import ProductForm from '@/components/admin/ProductForm';

export default function EditProductPage({ params }) {
  const [data, setData] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    API.getProductBySlug(params.id).then(res => {
      if (res.success) setData(res);
      else setNotFound(true);
    });
  }, [params.id]);

  if (notFound) return <EmptyState label="Product not found." />;
  if (!data) return <EmptyState label="Loading product…" />;

  return (
    <div>
      <PageHeader title={`Edit — ${data.product.name}`} subtitle={`SKU: ${data.product.sku}`} />
      <ProductForm
        initial={data}
        onSubmit={(payload) => API.updateProduct(data.product.id, payload)}
        submitLabel="Save Changes"
      />
    </div>
  );
}
