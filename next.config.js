/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Prisma generated client location
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/generated/prisma': require('path').join(__dirname, 'src/generated/prisma'),
    };
    return config;
  },

  // Enable experimental features if needed
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

module.exports = nextConfig;
