/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compiler: {
    styledComponents: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    config.ignoreWarnings = [
      { module: /node_modules/, message: /cz-shortcut-listen/ },
    ];
    return config;
  },
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/:path*`,
      },
    ]
  },
  output: 'standalone',
  poweredByHeader: false,
  experimental: {
    // L'option middleware a été supprimée car elle est obsolète
  }
}

module.exports = nextConfig 