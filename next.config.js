/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable the app directory (App Router)
  experimental: {
    appDir: true,
  },
  // You can add image domains here if you plan to load remote images
  images: {
    domains: [],
  },
};

module.exports = nextConfig;