/**
 * next.config.js
 */

// `next dev` and `next build` write INCOMPATIBLE layouts into the same output
// directory. Running a production build while the dev server is up replaces the
// dev server's route manifests, which makes the running server return 404 for
// pages that exist and, before that, serve stale chunk references such as
// "Cannot find module './682.js'".
//
// Giving development its own output directory makes the two unable to collide:
// `next dev` -> .next-dev, `next build` / `next start` -> .next (unchanged, so
// Vercel and `next start` are unaffected).
const distDir =
  process.env.NODE_ENV === 'development' ? '.next-dev' : '.next';

module.exports = {
  reactStrictMode: true,
  swcMinify: true,
  distDir,
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
