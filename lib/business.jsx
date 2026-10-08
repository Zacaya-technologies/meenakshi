'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { API } from '@/lib/api';
import { BUSINESS_DEFAULTS } from '@/lib/businessDefaults';

const BusinessContext = createContext(BUSINESS_DEFAULTS);

/**
 * Central business configuration provider. Every component that needs the
 * company identity/contact details (Header, Footer, Contact, About, WhatsApp,
 * Call buttons) reads from here instead of hardcoding values.
 */
export function BusinessProvider({ children }) {
  const [business, setBusiness] = useState(BUSINESS_DEFAULTS);

  useEffect(() => {
    let cancelled = false;
    API.getBusinessSettings()
      .then(res => {
        if (cancelled || !res?.success || !res.business) return;
        setBusiness(prev => ({ ...prev, ...res.business }));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const value = useMemo(() => business, [business]);
  return <BusinessContext.Provider value={value}>{children}</BusinessContext.Provider>;
}

export function useBusiness() {
  return useContext(BusinessContext);
}

/* ---- Formatting helpers derived from the settings record ---- */

export function telHref(phone) {
  return `tel:${String(phone || '').replace(/[^\d+]/g, '')}`;
}

export function waLink(whatsappNumber, message) {
  const base = `https://wa.me/${String(whatsappNumber || '').replace(/\D/g, '')}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function waGreeting(business) {
  return `Hello ${business?.business_name || 'Meenakshi Build World'}, I would like to know more about your products.`;
}

// WhatsApp quote request listing every cart line — the site has no online
// payment, so this is how a cart is "checked out".
export function cartQuoteLink(business, cart) {
  const waNumber = business?.whatsapp_number || '919900027700';
  const lines = cart.map((i, n) => {
    const p = i.product;
    const bits = [p.sku && `SKU ${p.sku}`, p.size].filter(Boolean).join(', ');
    return `${n + 1}. ${p.name}${bits ? ` (${bits})` : ''} — ${i.quantityBoxes} box${i.quantityBoxes > 1 ? 'es' : ''}`;
  });
  const message = [
    `Hello ${business?.business_name || 'Meenakshi Build World'}, I'd like a quote for:`,
    ...lines,
    'Please share pricing, availability and delivery details.'
  ].join('\n');
  return waLink(waNumber, message);
}
