import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emits .next/standalone — a self-contained server with only the modules it
  // actually imports, so the runtime image carries no build toolchain and no
  // dev dependencies.
  output: "standalone",

  // Nothing in this app is cached. Every page is per-user and server-rendered
  // on demand, so there is no ISR window, no fetch cache, and no shared cache
  // that could hand one signed-in user a page built for another.
  //
  // Individual routes also declare `export const dynamic = "force-dynamic"`,
  // and every fetch to the API passes `cache: "no-store"`. This is the
  // transport-level half of the same rule.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, must-revalidate" },
          // Duplicated from proxy.ts on purpose: these must hold even for
          // responses the proxy does not run on, such as static assets.
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
        ],
      },
    ];
  },

  // The API is the only backend this app talks to, and it is reached
  // server-side. No image host is allowlisted because course artwork is
  // rendered with a plain <img> — see components/courses/course-thumb.tsx for
  // why running instructor-supplied URLs through the image optimizer would be
  // a request-forgery primitive.
  images: {
    remotePatterns: [],
  },

  // Fail the production build on a type error rather than shipping one.
  typescript: {
    ignoreBuildErrors: false,
  },

  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
