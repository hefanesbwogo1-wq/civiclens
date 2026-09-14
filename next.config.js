/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['res.cloudinary.com'],
  },
};

let config = nextConfig;

// Enable PWA only in production
if (process.env.NODE_ENV === 'production') {
  const withPWA = require('next-pwa').default({
    dest: 'public',
    register: true,
    skipWaiting: true,
    disable: false,
  });
  config = withPWA(nextConfig);
}

module.exports = config;