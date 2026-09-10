import type { Metadata, Viewport } from "next";
import { Baskervville, Baskervville_SC, Inter, Judson } from "next/font/google";
import { CartDialog } from "@/components/commerce/CartDialog";
import { CartProvider } from "@/components/commerce/CartProvider";
import { CustomerProvider } from "@/components/commerce/CustomerProvider";
import { JsonLd } from "@/components/layout/JsonLd";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { HeroReturnHomeSync } from "@/components/layout/HeroReturnHomeSync";
import { SmoothScrollProvider } from "@/components/motion/SmoothScrollProvider";
import "./globals.css";
import { buildOnlineStoreJsonLd } from "@/lib/json-ld";
import { siteConfig } from "@/lib/site";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const baskervville = Baskervville({
  variable: "--font-baskervville",
  subsets: ["latin"],
  weight: "400",
});

const baskervvilleSc = Baskervville_SC({
  variable: "--font-baskervville-sc",
  subsets: ["latin"],
  weight: "400",
});

const judson = Judson({
  variable: "--font-judson",
  subsets: ["latin"],
  weight: "400",
});

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml", sizes: "any" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/site.webmanifest",
  appleWebApp: {
    title: siteConfig.name,
  },
  ...(siteConfig.allowSearchIndexing
    ? {}
    : {
        robots: {
          index: false,
          follow: false,
          googleBot: {
            index: false,
            follow: false,
          },
        },
      }),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${baskervville.variable} ${baskervvilleSc.variable} ${judson.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <JsonLd data={buildOnlineStoreJsonLd()} />
        <CustomerProvider>
          <CartProvider>
            <SmoothScrollProvider>
              <HeroReturnHomeSync />
              <Header />
              <div className="flex-1">{children}</div>
              <Footer />
              <CartDialog />
            </SmoothScrollProvider>
          </CartProvider>
        </CustomerProvider>
      </body>
    </html>
  );
}
