const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Monorepo root so file tracing and standalone layout are correct in Docker/Linux
  outputFileTracingRoot: path.join(__dirname, '../..'),
  transpilePackages: ['@vector/types', '@vector/utils', '@vector/config'],
};

module.exports = nextConfig;