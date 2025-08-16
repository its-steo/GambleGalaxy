import type { NextConfig } from "next"
import type { Configuration } from "webpack"

const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  runtimeCaching: [
    {
      urlPattern: /^https?.*\.(mp3|png|jpg|jpeg|gif|svg|woff2?|ttf|eot)$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "static-assets",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
    {
      urlPattern: /^https:\/\/gamblegalaxy\.onrender\.com\/api\/.*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "api-cache",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 24 * 60 * 60, // 1 day
        },
      },
    },
    {
      urlPattern: /^wss:\/\/gamblegalaxy\.onrender\.com\/ws\/aviator\/.*/i,
      handler: "NetworkOnly",
    },
  ],
})

const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
})

const nextConfig: NextConfig = {
  trailingSlash: true,

  // Image optimization
  images: {
    domains: ["gamblegalaxy.onrender.com", "gamble-galaxy.vercel.app"],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    unoptimized: true, // Added from updates
  },

  // Compression and optimization
  compress: true,
  poweredByHeader: false,

  // Bundle optimization
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-label",
      "@radix-ui/react-scroll-area",
      "@radix-ui/react-select",
      "@radix-ui/react-tabs",
      "framer-motion",
    ],
    turbo: {
      rules: {
        "*.svg": {
          loaders: ["@svgr/webpack"],
          as: "*.js",
        },
      },
    },
  },

  webpack: (config: Configuration, { dev, isServer }: { dev: boolean; isServer: boolean }) => {
    if (!dev && !isServer) {
      // Split chunks for better caching
      config.optimization = config.optimization || {}
      config.optimization.splitChunks = {
        chunks: "all",
        cacheGroups: {
          default: false,
          vendors: false,
          // Vendor chunk for stable dependencies
          vendor: {
            name: "vendor",
            chunks: "all",
            test: /node_modules/,
            priority: 20,
          },
          // UI components chunk
          ui: {
            name: "ui",
            chunks: "all",
            test: /[\\/]components[\\/]ui[\\/]/,
            priority: 30,
          },
          // Lucide icons chunk (heavy dependency)
          icons: {
            name: "icons",
            chunks: "all",
            test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
            priority: 40,
          },
          // Framer Motion chunk (heavy animation library)
          animations: {
            name: "animations",
            chunks: "all",
            test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
            priority: 40,
          },
          // Common chunk for shared code
          common: {
            name: "common",
            chunks: "all",
            minChunks: 2,
            priority: 10,
            reuseExistingChunk: true,
          },
        },
      }

      // Tree shaking optimization
      config.optimization.usedExports = true
      config.optimization.sideEffects = false
    }

    config.module = config.module || { rules: [] }
    if (!config.module.rules) {
      config.module.rules = []
    }
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    })

    return config
  },

  // Headers for better caching
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
      {
        source: "/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ]
  },

  // Added from updates
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

export default withBundleAnalyzer(withPWA(nextConfig))
