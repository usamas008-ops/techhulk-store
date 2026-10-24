/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Pictures from any https link may be shown, at the shop's request.
    // Trade-off: anyone can run images through this site's optimizer, and
    // that counts against the Vercel plan's monthly image allowance. To lock
    // it down again, list hosts here instead (e.g. "**.supabase.co").
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

module.exports = nextConfig;
