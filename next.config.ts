import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  // Enable standalone output for Docker deployment
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: process.env.NEXT_PUBLIC_PLACEHOLD_CO_DOMAIN || 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: process.env.NEXT_PUBLIC_UNSPLASH_DOMAIN || 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: process.env.NEXT_PUBLIC_PICSUM_DOMAIN || 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Disable static optimization for all pages to avoid Firebase initialization during build
  trailingSlash: false,
  // Generate a unique build ID
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },
};

export default nextConfig;