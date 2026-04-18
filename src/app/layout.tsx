import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import Footer from "@/components/layout/Footer";
import { ThemeProvider } from "@/components/ThemeProvider";
import { GameProvider } from "@/context/GameContext";
import PWARegister from "@/components/PWARegister";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";

export const metadata: Metadata = {
  title: "Frag Naija — Tactical Command Interface",
  description: "Nigeria's premier esports platform. Compete, wager, and dominate.",
  applicationName: "Frag Naija",
  keywords: ["esports", "Nigeria", "PUBG", "gaming", "wager", "tournaments"],
  authors: [{ name: "Frag Naija" }],
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Frag Naija",
  },
  formatDetection: { telephone: false },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/logo-icon.jpeg", type: "image/jpeg",    sizes: "512x512" },
      { url: "/icons/icon.svg", type: "image/svg+xml"                   },
    ],
    shortcut: "/logo-icon.jpeg",
    apple:    "/logo-icon.jpeg",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)",  color: "#00ff41" },
    { media: "(prefers-color-scheme: light)", color: "#007a1a" },
  ],
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="bg-fn-black text-fn-text font-mono antialiased">
        <ThemeProvider>
          <GameProvider>
            <Navbar />
            <div className="flex min-h-screen pt-14">
              <Sidebar />
              <main className="flex-1 ml-12 lg:ml-14 overflow-hidden">
                {children}
              </main>
            </div>
            <Footer />
            <PWARegister />
            <PWAInstallPrompt />
          </GameProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
