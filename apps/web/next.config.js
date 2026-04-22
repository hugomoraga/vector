const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Next 14: top-level outputFileTracingRoot is invalid; use experimental (monorepo Docker tracing)
  experimental: {
    outputFileTracingRoot: path.join(__dirname, '../..'),
  },
  // next build runs ESLint internally; eslint-config-next + hoisted eslint majors can break CI
  eslint: {
    ignoreDuringBuilds: true,
  },
  transpilePackages: ['@vector/types', '@vector/utils', '@vector/config'],
};

module.exports = nextConfig;