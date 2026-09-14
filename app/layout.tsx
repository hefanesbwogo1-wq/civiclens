import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://civiclens-six-psi.vercel.app"),
  title: {
    default: "CivicLens - Public Conversation Intelligence | 47 Counties Kenya",
    template: "%s | CivicLens",
  },
  description: "CivicLens turns WhatsApp, Facebook, X & News noise into accountability. Live AI tracks 47 Governors, Ruto, Raila + trending issues with Swahili/Sheng AI. Built in Siongiroi, Bomet.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "CivicLens" },
  icons: { icon: "/icon-192.png", apple: "/apple-touch-icon.png" },
  openGraph: {
    type: "website",
    url: "https://civiclens-six-psi.vercel.app",
    title: "CivicLens — We turn WhatsApp noise into accountability | 47 Counties LIVE",
    description: "Live AI tracking 60+ leaders (Ruto, 47 Governors) + trending #ufisadi #roads. Swahili/Sheng + WhatsApp + PDF. Built in Siongiroi.",
    images: [{ url: "/icon-512.png", width: 512, height: 512 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "CivicLens — 47 Counties Accountability LIVE",
    description: "AI tracks 47 Governors + trending. WhatsApp + PDF. Bomet pilot.",
    images: ["/icon-512.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0A1931",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#F2F5FA] antialiased">{children}</body>
    </html>
  );
}
