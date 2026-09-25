/**
 * next.config.js
 */
module.exports = {
  reactStrictMode: true,
  swcMinify: true,
  // Allow images from Supabase storage domains
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // will be refined via env var in production
      },
    ],
  },
};
