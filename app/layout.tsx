import type { Metadata } from "next";
import { Baskervville, Inter } from "next/font/google";
import { CartDialog } from "@/components/commerce/CartDialog";
import { CartProvider } from "@/components/commerce/CartProvider";
import { CustomerProvider } from "@/components/commerce/CustomerProvider";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { HeroReturnHomeSync } from "@/components/layout/HeroReturnHomeSync";
import { SiteLoader } from "@/components/layout/SiteLoader";
import { SmoothScrollProvider } from "@/components/motion/SmoothScrollProvider";
import "./globals.css";
import { siteConfig } from "@/lib/site";
import { SITE_LOADER_BOOTSTRAP } from "@/lib/site-loader";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const baskervville = Baskervville({
  variable: "--font-baskervville",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
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
      className={`${baskervville.variable} ${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <script dangerouslySetInnerHTML={{ __html: SITE_LOADER_BOOTSTRAP }} />
        <CustomerProvider>
          <CartProvider>
            <SmoothScrollProvider>
              <SiteLoader />
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
