import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CivicLens - AI Civic Intelligence",
  description: "Report potholes, garbage, waterlogging, broken lights. AI triages for city authorities.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "CivicLens" },
  icons: { icon: "/icon-192.png", apple: "/apple-touch-icon.png" },
  openGraph: { title: "CivicLens", description: "AI-powered civic issue reporting platform", images: ["/icon-512.png"] }
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
      <body className="bg-[#F2F5FA] antialiased">
        {children}
      </body>
    </html>
  );
}