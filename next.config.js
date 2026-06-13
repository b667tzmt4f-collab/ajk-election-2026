/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Faster page loads via compression
  compress: true,
  // Cache static assets aggressively
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
      ],
    },
  ],
  // Reduce bundle size
  experimental: {
    optimizeCss: true,
  },
}
module.exports = nextConfig
