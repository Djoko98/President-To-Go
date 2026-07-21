import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { OfflineNotice } from "@/components/shared/offline-notice";
import { ServiceWorker } from "@/components/shared/service-worker";

export const metadata: Metadata = {
  title: { default: "President To Go", template: "%s · President To Go" },
  description: "Poruči koktele, kafe i voćne napitke za brzo preuzimanje u restoranu President.",
  applicationName: "President To Go",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "President To Go" },
  icons: {
    icon: [
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/icons/favicon-32x32.png",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#ffffff", colorScheme: "light" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="sr-Latn">
      <body>
        {children}
        <OfflineNotice />
        <ServiceWorker />
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
