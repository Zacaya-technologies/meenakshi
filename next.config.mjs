/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        // Proxy all API calls to the Express backend (port 3000)
        source: '/api/:path*',
        destination: `${process.env.API_PROXY_TARGET || 'http://localhost:3000'}/api/:path*`
      }
    ];
  }
};

export default nextConfig;

