/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  pageExtensions: ['tsx', 'ts'],
  // 🚀 PERFORMANCE: Optimizations
  compress: true, // Gzip compression pour les responses
  swcMinify: true, // SWC minification (plus rapide que Terser)
  productionBrowserSourceMaps: false, // Désactiver les source maps en prod
  
  // 🖼️ Optimisation des images
  images: {
    formats: ['image/avif', 'image/webp'], // Formats modernes
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 an de cache
  },

  // 📦 Optimisation du bundling
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,
        // Isoler les grandes dépendances
        radixUI: {
          test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
          name: 'radix-ui',
          priority: 10,
        },
        supabase: {
          test: /[\\/]node_modules[\\/]@supabase[\\/]/,
          name: 'supabase',
          priority: 10,
        },
      };
    }
    return config;
  },

  // Configuration pour le développement réseau
  async rewrites() {
    return [
      // Pas de rewrites nécessaires pour le test local
    ];
  },

  // Autoriser les requêtes depuis n'importe quelle origine pour le développement
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,POST,PUT,DELETE,OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
      // 💾 Cache headers pour les assets statiques
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable', // 1 an
          },
        ],
      },
      // Cache pour les images optimisées
      {
        source: '/_next/image:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};
