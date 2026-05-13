import type { NextConfig } from "next";

// Get API origin from environment variables (production-ready)
const apiOrigin = process.env.INTERNAL_API_URL || process.env.API_ORIGIN || "";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: process.env.NODE_ENV !== "production",
  
  // Optimize images for performance
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      // Allow API origin domain for images in production
      ...(apiOrigin.startsWith("http") || apiOrigin.startsWith("https")
        ? [
            {
              protocol: new URL(apiOrigin).protocol.replace(":", "") as "http" | "https",
              hostname: new URL(apiOrigin).hostname,
              port: new URL(apiOrigin).port || "",
              pathname: "/uploads/**",
            },
          ]
        : []),
    ],
  },

  // Enable SWR cache for static pages
  swrDelta: 60,

  // Compression middleware
  compress: true,

  // Production optimizations
  productionBrowserSourceMaps: true,
  onDemandEntries: {
    maxInactiveAge: 30_000, // keep entries alive for 30 seconds
    pagesBufferLength: 5,
  },

  async rewrites() {
    const origin = apiOrigin.replace(/\/$/, "");
    return [
      { source: "/api/:path*", destination: `${origin}/api/:path*` },
      { source: "/uploads/:path*", destination: `${origin}/uploads/:path*` },
    ];
  },

  // Headers for security and performance
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "geolocation=(), microphone=(), camera=()",
          },
          // Content Security Policy (CSP) - prevents XSS and injection attacks
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none'; base-uri 'self'; form-action 'self';",
          },
          // HSTS (HTTP Strict Transport Security) - forces HTTPS in production
          ...(process.env.NODE_ENV === "production"
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=31536000; includeSubDomains; preload",
                },
              ]
            : []),
          // Cross-Origin-Opener-Policy (COOP) - origin isolation for security
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          // Cross-Origin-Resource-Policy (CORP) - limits who can load resources
          {
            key: "Cross-Origin-Resource-Policy",
            value: "cross-origin",
          },
          // Trusted Types (mitigates DOM XSS)
          {
            key: "Require-Trusted-Types-For",
            value: "'script'",
          },
        ],
      },
      // Cache static assets aggressively
      {
        source: "/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // Cache images
      {
        source: "/_next/image/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  // Redirect HTTP to HTTPS in production
  async redirects() {
    if (process.env.NODE_ENV !== "production") {
      return [];
    }
    return [
      {
        source: "/:path*",
        destination: "https://:host/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
