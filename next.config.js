/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    // Handle porto module resolution issue
    config.resolve.alias = {
      ...config.resolve.alias,
      'porto/internal': false,
    };
    return config;
  },
};

module.exports = nextConfig;
