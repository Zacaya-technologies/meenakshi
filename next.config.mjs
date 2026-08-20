/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Keep native/CommonJS server deps out of the webpack client/server bundles.
    serverComponentsExternalPackages: [
      'express',
      'sqlite3',
      'pg',
      'multer',
      'bcryptjs',
      'jsonwebtoken',
      'cors',
      'nodemailer',
      'dotenv'
    ],
    // Ensure the SQLite DB file ships inside the serverless functions that
    // serve the API (app/api/[...path]) and the SEO routes. Bracket segments
    // in the keys must be escaped (picomatch treats [ ] as character classes).
    outputFileTracingIncludes: {
      '/api/\\[\\.\\.\\.path\\]': ['./tile_marketplace.sqlite'],
      '/sitemap.xml': ['./tile_marketplace.sqlite'],
      '/robots.txt': ['./tile_marketplace.sqlite']
    }
  },
  async rewrites() {
    // If an external API host is configured, proxy to it (standalone Express).
    // Otherwise /api/*, /sitemap.xml and /robots.txt are served directly by
    // Next.js route handlers (app/api/[...path]/route.js, app/sitemap.xml,
    // app/robots.txt) which run the Express app in-process — this is what makes
    // the site work on Vercel where no separate server process exists.
    const apiTarget = process.env.API_PROXY_TARGET;
    if (!apiTarget) {
      return [];
    }
    return [
      {
        source: '/api/:path*',
        destination: `${apiTarget}/api/:path*`
      },
      { source: '/sitemap.xml', destination: `${apiTarget}/sitemap.xml` },
      { source: '/robots.txt', destination: `${apiTarget}/robots.txt` }
    ];
  }
};

export default nextConfig;
