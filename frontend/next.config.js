// next.config.js
const nextConfig = {
    async rewrites() {
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:3001/:path*', // Proxy to NestJS backend
        },
      ];
    },
  };

  module.exports = {
    async redirects() {
      return [
        {
          source: '/login',
          destination: '/auth/login',
          permanent: true,
        },
        {
          source: '/signup',
          destination: '/auth/signup',
          permanent: true,
        },
      ];
    },
  };
  
  
  module.exports = nextConfig;
  