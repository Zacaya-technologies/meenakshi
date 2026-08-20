import { headers } from 'next/headers';

// Resolves the API origin for server-side fetches. When API_PROXY_TARGET is
// set (standalone Express host) it is used as-is; otherwise the current
// request's own origin is used so /api/* is served in-process by the Express
// adapter (app/api/[...path]/route.js). This is what makes SSR pages work on
// Vercel, where no localhost:3000 server process exists.
export function apiBase() {
  if (process.env.API_PROXY_TARGET) return process.env.API_PROXY_TARGET.replace(/\/$/, '');
  const h = headers();
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3001';
  const proto = h.get('x-forwarded-proto') || 'http';
  return `${proto}://${host}`;
}

export async function serverFetch(path) {
  return fetch(`${apiBase()}${path}`, { cache: 'no-store' });
}