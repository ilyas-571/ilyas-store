import type { Metadata, Viewport } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { JsonLd } from "@/components/json-ld";
import { PageTransition } from "@/components/animations";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
  adjustFontFallback: true,
  preload: true,
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  adjustFontFallback: true,
  preload: true,
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3100";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Ilyas Store — Luxury Perfumes, Watches & Cosmetics",
    template: "%s | Ilyas Store",
  },
  description:
    "Discover curated luxury perfumes, timepieces, and cosmetics at Ilyas Store. Fast delivery and a refined shopping experience.",
  robots: { index: true, follow: true },
  alternates: { canonical: siteUrl },
  openGraph: {
    type: "website",
    locale: "en_PK",
    url: siteUrl,
    siteName: "Ilyas Store",
    title: "Ilyas Store — Luxury Perfumes, Watches & Cosmetics",
    description:
      "Discover curated luxury perfumes, timepieces, and cosmetics at Ilyas Store.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ilyas Store — Luxury Perfumes, Watches & Cosmetics",
    description:
      "Discover curated luxury perfumes, timepieces, and cosmetics at Ilyas Store.",
  },
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#1a1a1a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${playfair.variable}`}>
      <head>
        {/* Preload critical fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* DNS prefetch for API */}
        {process.env.NEXT_PUBLIC_API_URL && (
          <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_API_URL} />
        )}
        {/* Prefetch unsplash images */}
        <link rel="prefetch" href="https://images.unsplash.com" />
      </head>
      <body className="min-h-screen antialiased font-sans">
        <JsonLd
          data={[
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Ilyas Store",
              url: siteUrl,
            },
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Ilyas Store",
              url: siteUrl,
              potentialAction: {
                "@type": "SearchAction",
                target: `${siteUrl}/products?search={search_term_string}`,
                "query-input": "required name=search_term_string",
              },
            },
          ]}
        />
        <Providers>
          <PageTransition>{children}</PageTransition>
        </Providers>
      </body>
    </html>
  );
}
