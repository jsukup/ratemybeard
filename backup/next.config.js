/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove static export as we're using API routes and server components
  // output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Enable image optimization (remove unoptimized setting)
  images: {
    domains: ['looxmaxx-storage.supabase.co'],
    formats: ['image/avif', 'image/webp'],
  },
  // Add support for experimental features
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb', // Increase limit for image uploads
    },
  },
};

module.exports = nextConfig;
