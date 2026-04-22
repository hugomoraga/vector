/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@vector/types', '@vector/utils', '@vector/config'],
};

module.exports = nextConfig;