/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "techhulk.store" },
      { protocol: "https", hostname: "cdn.shopify.com" },
    ],
  },
};

module.exports = nextConfig;
