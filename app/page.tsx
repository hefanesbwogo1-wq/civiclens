import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://civiclens.vercel.app"),
  title: {
    default: "CivicLens - Public Conversation Intelligence | 47 Counties Kenya",
    template: "%s | CivicLens",
  },
  description: "CivicLens turns WhatsApp, Facebook, X & News noise into accountability. Live AI tracks 47 Governors, Ruto, Raila + trending issues (roads, water, ufisadi) with Swahili/Sheng AI. Built in Siongiroi, Bomet.",
  keywords: ["CivicLens", "Kenya accountability", "Bomet", "Siongiroi", "47 counties", "governors tracking", "ufisadi", "Swahili AI", "public conversation", "civic tech Kenya"],
  authors: [{ name: "CivicLens", url: "https://civiclens.vercel.app" }],
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "CivicLens" },
  icons: { 
    icon: "/icon-192.png", 
    apple: "/apple-touch-icon.png",
    shortcut: "/icon-192.png"
  },
  openGraph: { 
    type: "website",
    locale: "en_KE",
    url: "https://civiclens.vercel.app",
    title: "CivicLens — We turn WhatsApp noise into accountability | 47 Counties LIVE",
    description: "Live AI tracking 60+ leaders (Ruto, 47 Governors) + trending #ufisadi #roads. Swahili/Sheng sentiment. WhatsApp share + PDF reports. Built in Siongiroi.",
    siteName: "CivicLens",
    images: [
      {
        url: "/icon-512.png",
        width: 512,
        height: 512,
        alt: "CivicLens - Kenya Accountability",
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "CivicLens — 47 Counties Accountability LIVE",
    description: "AI tracks 47 Governors + trending issues. Swahili/Sheng. WhatsApp + PDF. Built in Bomet.",
    images: ["/icon-512.png"],
  },
  formatDetection: { telephone: false },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0A1931",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="google-site-verification" content="pending" />
      </head>
      <body className="bg-[#F2F5FA] antialiased">
        {children}
      </body>
    </html>
  );
}