import type { NextConfig } from "next";
import type { Configuration } from "webpack";

const withPWA = require("next-pwa")({
  dest: "public",
  disable: false, // Revert to process.env.NODE_ENV === "development" after testing
  register: true,
  skipWaiting: true,
  swSrc: "app/sw.js",
  swDest: "sw.js",
});

const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  trailingSlash: true,
  images: {
    domains: ["gamblegalaxy.onrender.com", "gamble-galaxy.vercel.app"],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    unoptimized: true,
  },
  compress: true,
  poweredByHeader: false,
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
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config: Configuration, { dev, isServer }: { dev: boolean; isServer: boolean }) => {
    if (!dev && !isServer) {
      config.optimization = config.optimization || {};
      config.optimization.splitChunks = {
        chunks: "all",
        cacheGroups: {
          default: false,
          vendors: false,
          vendor: {
            name: "vendor",
            chunks: "all",
            test: /node_modules/,
            priority: 20,
          },
          ui: {
            name: "ui",
            chunks: "all",
            test: /[\\/]components[\\/]ui[\\/]/,
            priority: 30,
          },
          icons: {
            name: "icons",
            chunks: "all",
            test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
            priority: 40,
          },
          animations: {
            name: "animations",
            chunks: "all",
            test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
            priority: 40,
          },
          common: {
            name: "common",
            chunks: "all",
            minChunks: 2,
            priority: 10,
            reuseExistingChunk: true,
          },
        },
      };
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
    }

    config.module = config.module || { rules: [] };
    if (!config.module.rules) {
      config.module.rules = [];
    }
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });

    return config;
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
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
    ];
  },
};

export default withBundleAnalyzer(withPWA(nextConfig));