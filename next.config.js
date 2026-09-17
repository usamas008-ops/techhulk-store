/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "techhulk.store" },
      { protocol: "https", hostname: "cdn.shopify.com" },
      // Placeholder banner and portrait photos until real ones are added.
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

module.exports = nextConfig;
