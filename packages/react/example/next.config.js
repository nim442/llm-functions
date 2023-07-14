/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { externalDir: true },
  webpack: (config) => {
    config.externals = [...config.externals, 'canvas'];
    return config;
  },
};

module.exports = nextConfig;
