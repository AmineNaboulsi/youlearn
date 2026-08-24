import type { Metadata, Viewport } from "next";
import { env } from "@/lib/env";
import { Inter, JetBrains_Mono, Noto_Sans_Arabic } from "next/font/google";

import { direction } from "@/lib/i18n/config";
import { getTranslation } from "@/lib/i18n/server";

import "./globals.css";

/**
 * Fonts are self-hosted by next/font: no request to Google at runtime, no
 * third-party origin to allow in the CSP, and no flash of fallback text.
 */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
  weight: ["400", "500"],
});

/**
 * Inter has no Arabic coverage, so Arabic text would otherwise fall through to
 * whatever the OS happens to provide — a different face on every device, and
 * on Windows one that sits noticeably lower on the line than the Latin around
 * it. Loading this alongside costs nothing when it is not used: next/font
 * subsets per family, and only the Arabic face carries the arabic subset.
 */
const notoArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  variable: "--font-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  // Without this, Next resolves opengraph-image.png against
  // http://localhost:3000 — so every shared link points at a host nobody else
  // can reach, and the preview silently never loads.
  metadataBase: new URL(env.appUrl),
  title: {
    default: "YouLearn",
    template: "%s · YouLearn",
  },
  description:
    "Courses taught by practitioners. Learn at your own pace, on one account, across every device.",
  applicationName: "YouLearn",
  // Every page is per-user and server-rendered; none of it belongs in a search
  // index or a shared cache.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { locale, t } = await getTranslation();

  return (
    <html
      lang={locale}
      dir={direction(locale)}
      className={`${inter.variable} ${jetbrains.variable} ${notoArabic.variable}`}
    >
      <body className="min-h-dvh bg-surface text-ink antialiased">
        {/* First stop for a keyboard user on every page. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-50 focus:rounded-lg focus:border focus:border-ink focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-medium"
        >
          {t.common.skipToContent}
        </a>
        {children}
      </body>
    </html>
  );
}
