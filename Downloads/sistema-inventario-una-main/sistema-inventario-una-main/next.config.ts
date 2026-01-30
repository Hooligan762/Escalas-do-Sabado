import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Configurações para melhorar o carregamento de chunks
  experimental: {
    optimizePackageImports: ['@/components/ui', 'lucide-react'],
  },
  // Configurar output file tracing para resolver warning
  outputFileTracingRoot: __dirname,
  // Configuração para suprimir avisos de hidratação
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  webpack: (config) => {
    // Suprimir avisos específicos de hidratação e extensões
    config.ignoreWarnings = [
      {
        module: /node_modules/,
        message: /bis_skin_checked/,
      },
      // Suprimir avisos de hidratação do React
      {
        message: /Hydration failed/,
      },
      {
        message: /server rendered HTML/,
      },
      {
        message: /client properties/,
      },
      // Suprimir avisos de extensões do browser
      {
        message: /chrome-extension/,
      },
      {
        message: /Failed to fetch.*extension/,
      },
      {
        message: /eppiocemhmnlbhjplcgkofciiegomcon/,
      },
    ];
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
