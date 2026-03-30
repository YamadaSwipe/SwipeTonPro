/** @type {import('next').NextConfig} */ 
module.exports = { 
  reactStrictMode: true,
  
  // Performance optimizations
  swcMinify: true,
  
  // Disable ESLint during builds for speed
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Disable TypeScript checking during builds for speed
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Optimized webpack configuration for Next.js 14
  webpack: (config, { dev, isServer }) => {
    // Development optimizations
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ['**/node_modules/**', '**/.git/**', '**/.next/**'],
      };
      
      // Reduce bundle size in development
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              maxSize: 244000, // 244KB chunks
            },
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              enforce: true,
              maxSize: 244000,
            },
          },
        },
      };
      
      // Memory optimizations
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
      
      // Reduce memory usage
      config.resolve.alias = {
        ...config.resolve.alias,
        '@supabase': '@supabase/supabase-js/dist/module/index.js',
      };
    }
    
    // Production optimizations
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            framework: {
              chunks: 'all',
              name: 'framework',
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
              priority: 40,
              enforce: true,
            },
            commons: {
              name: 'commons',
              minChunks: 2,
              priority: 20,
            },
            shared: {
              name: 'shared',
              priority: 10,
              enforce: true,
            },
          },
        },
      };
    }
    
    // Reduce memory usage
    config.optimization = {
      ...config.optimization,
      usedExports: true,
      sideEffects: false,
    };
    
    return config;
  },
  
  // Experimental features for performance (Next.js 14 compatible)
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  
  // Compiler optimizations (Next.js 14 compatible)
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
} 
