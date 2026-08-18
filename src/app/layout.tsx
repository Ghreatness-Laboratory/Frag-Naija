import type { Metadata, Viewport } from "next";
import { Chakra_Petch, Exo_2, Orbitron, Oxanium, Rajdhani, Saira_Condensed, Space_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BottomNav from "@/components/layout/BottomNav";
import { ThemeProvider } from "@/components/ThemeProvider";
import { GameProvider } from "@/context/GameContext";
import PWARegister from "@/components/PWARegister";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import FontPreviewToggle from "@/components/common/FontPreviewToggle";
import NotificationsProvider from "@/components/notifications/NotificationsProvider";
import FCMRegistrar from "@/components/notifications/FCMRegistrar";


const chakraPetch = Chakra_Petch({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-chakra", display: "swap" });
const rajdhani = Rajdhani({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-rajdhani", display: "swap" });
const exo2 = Exo_2({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-exo2", display: "swap" });
const orbitron = Orbitron({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800", "900"], variable: "--font-orbitron", display: "swap" });
const oxanium = Oxanium({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-oxanium", display: "swap" });
const sairaCondensed = Saira_Condensed({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-saira-condensed", display: "swap" });
const spaceMono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-space-mono", display: "swap" });
const fontVariables = [chakraPetch, rajdhani, exo2, orbitron, oxanium, sairaCondensed, spaceMono].map((font) => font.variable).join(" ");

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
  // Get font preview mode from query params or localStorage
  // This allows testing different fonts by adding ?font=rajdhani, ?font=chakra, or ?font=exo2 to URL
  return (
    <html lang="en" className={`dark ${fontVariables}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('fn-theme')||'dark';var e=document.documentElement;e.classList.remove('dark','light');e.classList.add(t);var f=localStorage.getItem('fn-font-preview');if(f){e.classList.add('font-preview-'+f);}}catch(_){}})();`,
          }}
        />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="bg-fn-black text-fn-text font-sans antialiased">
        <ThemeProvider>
          <GameProvider>
            <NotificationsProvider>
            <Navbar />
            <div className="flex min-h-screen pt-14">
              <main className="flex-1 overflow-hidden pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
                {children}
              </main>
            </div>
            <Footer />
            <BottomNav />
            <PWARegister />
            <PWAInstallPrompt />
            <FCMRegistrar />
            <FontPreviewToggle />
            </NotificationsProvider>
          </GameProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
