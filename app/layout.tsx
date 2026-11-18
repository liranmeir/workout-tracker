import type { Metadata, Viewport } from "next";
import "@fontsource/heebo/hebrew-400.css";
import "@fontsource/heebo/hebrew-500.css";
import "@fontsource/heebo/hebrew-700.css";
import "@fontsource/heebo/latin-400.css";
import "@fontsource/heebo/latin-700.css";
import "@fontsource/rubik/hebrew-700.css";
import "@fontsource/rubik/hebrew-800.css";
import "@fontsource/rubik/latin-700.css";
import "@fontsource/rubik/latin-800.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "יומן אימונים",
  description: "מעקב אימוני כוח",
  appleWebApp: { capable: true, title: "אימונים", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#05070d",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
