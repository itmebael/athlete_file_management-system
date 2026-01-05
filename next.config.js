/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'tiykqhfutsspfkbradvr.supabase.co'],
  },
  // Fix for chunk loading errors
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      }
    }
    return config
  },
}

module.exports = nextConfig


