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
    // Everything the proxy sets, minus the framing rule, which /api/media
    // needs a different answer to.
    const common = [
      { key: "Cache-Control", value: "no-store, must-revalidate" },
      // Duplicated from proxy.ts on purpose: these must hold even for
      // responses the proxy does not run on, such as static assets.
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
      },
    ];

    return [
      {
        // Every path but the media stream, which is excluded rather than
        // overridden: two matching entries setting the same key is a rule
        // about ordering nobody should have to remember.
        source: "/((?!api/media/).*)",
        headers: [...common, { key: "X-Frame-Options", value: "DENY" }],
      },
      {
        // A PDF lesson is displayed in a same-origin <iframe>, and DENY
        // refuses every parent including this app's own pages — which is what
        // made the viewer show a browser block page instead of the document.
        // SAMEORIGIN keeps the stream unframeable by anyone else. See the
        // matching branch in proxy.ts, which sets frame-ancestors to suit.
        source: "/api/media/:path*",
        headers: [...common, { key: "X-Frame-Options", value: "SAMEORIGIN" }],
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
