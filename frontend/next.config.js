// next.config.js

<<<<<<< Updated upstream

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
  
=======
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
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
>>>>>>> Stashed changes
