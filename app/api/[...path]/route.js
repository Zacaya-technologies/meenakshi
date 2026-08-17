// Catch-all API route: runs the Express app (server/app.js) inside Next.js so
// /api/* works on Vercel without a separate Express server process.
import { runExpress } from '@/lib/expressAdapter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  return runExpress(request);
}

export async function POST(request) {
  return runExpress(request);
}

export async function PUT(request) {
  return runExpress(request);
}

export async function PATCH(request) {
  return runExpress(request);
}

export async function DELETE(request) {
  return runExpress(request);
}

export async function OPTIONS(request) {
  return runExpress(request);
}

export async function HEAD(request) {
  return runExpress(request);
}
