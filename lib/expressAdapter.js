// Bridges the Express API into Next.js route handlers so the storefront works
// on serverless platforms (Vercel) where no long-running Express server exists.
// Usage: import { runExpress } from '@/lib/expressAdapter' and call it with the
// Web Request object from any app/api/[...]/route.js handler.
import http from 'http';
import { Duplex } from 'stream';

let expressServerPromise;

// Must be a real stream: when Node auto-destroys the IncomingMessage it runs
// end-of-stream checks on its socket, and a plain EventEmitter there throws
// ERR_INVALID_ARG_TYPE after every request.
function mockSocket() {
  const s = new Duplex({ read() {}, write(chunk, enc, cb) { cb(); } });
  s.remoteAddress = '::1';
  s.remotePort = 80;
  s.encrypted = false;
  s.setTimeout = () => s;
  s.setNoDelay = () => s;
  s.setKeepAlive = () => s;
  s.address = () => ({ address: '::1', port: 80 });
  s.destroy = () => {};
  return s;
}

async function getExpressServer() {
  if (!expressServerPromise) {
    expressServerPromise = (async () => {
      const { default: app } = await import('../server/app');
      return http.createServer(app);
    })();
  }
  return expressServerPromise;
}

function headersToObj(headers) {
  const out = {};
  headers.forEach((value, key) => {
    out[key.toLowerCase()] = value;
  });
  return out;
}

/**
 * Runs the Express app against a Web Request and returns a Web Response.
 */
export async function runExpress(request) {
  const server = await getExpressServer();
  const url = new URL(request.url);
  const body = Buffer.from(await request.arrayBuffer());

  const socket = mockSocket();
  const req = new http.IncomingMessage(socket);
  req.method = request.method;
  req.url = url.pathname + url.search;
  req.httpVersion = '1.1';
  req.headers = headersToObj(request.headers);
  if (body.length) req.push(body);
  req.push(null);

  const res = new http.ServerResponse(req);
  res.socket = mockSocket();

  const chunks = [];
  res.write = (chunk, enc, cb) => {
    if (chunk != null) chunks.push(Buffer.from(chunk));
    if (typeof cb === 'function') cb();
    return true;
  };
  res.end = (chunk, enc, cb) => {
    if (chunk != null) chunks.push(Buffer.from(chunk));
    if (typeof cb === 'function') cb();
    res.emit('finish');
    return res;
  };

  await new Promise((resolve, reject) => {
    res.once('finish', resolve);
    res.once('error', reject);
    server.emit('request', req, res);
  });

  const status = res.statusCode || 200;
  // 204/205/304 must not carry a body: Express answers conditional GETs
  // (If-None-Match) with 304, and passing even an empty Buffer made the
  // Response constructor throw — the client then got a 500.
  const nullBody = status === 204 || status === 205 || status === 304;
  return new Response(nullBody ? null : Buffer.concat(chunks), {
    status,
    headers: res.getHeaders()
  });
}
