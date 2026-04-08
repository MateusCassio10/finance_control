/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/finance_control',
  assetPrefix: '/finance_control',
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
