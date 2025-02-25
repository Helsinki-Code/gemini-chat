/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development practices
  reactStrictMode: true,
  
  // Optimize images from trusted domains
  images: {
    domains: [],
    // Modern image formats
    formats: ['image/avif', 'image/webp'],
  },
  
  // Production optimizations
  compiler: {
    // Remove console.logs in production
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Webpack configuration
  webpack: (config) => {
    config.module.rules.push({
      test: /\.css$/,
      use: ['style-loader', 'css-loader', 'postcss-loader'],
    });
    return config;
  },
  
  // Enable progressive web app features
  experimental: {
    optimizeCss: true, // Re-enable CSS optimization
  },
  
  // Configure headers for security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig; 