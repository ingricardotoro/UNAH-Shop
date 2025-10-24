/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    CUSTOMERS_SERVICE_URL:
      process.env.CUSTOMERS_SERVICE_URL || 'http://localhost:3001',
    PRODUCTS_SERVICE_URL:
      process.env.PRODUCTS_SERVICE_URL || 'http://localhost:3002',
    CART_SERVICE_URL: process.env.CART_SERVICE_URL || 'http://localhost:3003',
    ORDERS_SERVICE_URL:
      process.env.ORDERS_SERVICE_URL || 'http://localhost:3004',
  },
  images: {
    domains: ['fakestoreapi.com', 'via.placeholder.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fakestoreapi.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;
