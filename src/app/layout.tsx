import type { Metadata, Viewport } from "next";
import { Chakra_Petch, Exo_2, Orbitron, Oxanium, Rajdhani, Saira_Condensed, Space_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BottomNav from "@/components/layout/BottomNav";
import { ThemeProvider } from "@/components/ThemeProvider";
import { GameProvider } from "@/context/GameContext";
import GameAccessGate from "@/components/game/GameAccessGate";
import PWARegister from "@/components/PWARegister";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import NotificationsProvider from "@/components/notifications/NotificationsProvider";
import FCMRegistrar from "@/components/notifications/FCMRegistrar";
import LazySupportChatbot from "@/components/support/LazySupportChatbot";
import { APP_ICON_PATH, DEFAULT_DESCRIPTION, OG_IMAGE_PATH, SITE_NAME, SITE_TAGLINE, SITE_URL, absoluteUrl } from "@/lib/seo";


const chakraPetch = Chakra_Petch({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-chakra", display: "swap" });
const rajdhani = Rajdhani({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-rajdhani", display: "swap" });
const exo2 = Exo_2({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-exo2", display: "swap" });
const orbitron = Orbitron({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800", "900"], variable: "--font-orbitron", display: "swap" });
const oxanium = Oxanium({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-oxanium", display: "swap" });
const sairaCondensed = Saira_Condensed({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-saira-condensed", display: "swap" });
const spaceMono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-space-mono", display: "swap" });
const fontVariables = [chakraPetch, rajdhani, exo2, orbitron, oxanium, sairaCondensed, spaceMono].map((font) => font.variable).join(" ");

export const metadata: Metadata = {
  title: {
    template: '%s - FragNaija',
    default: 'FragNaija - Everything Esports - One Platform',
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  keywords: ['esports','Nigeria','PUBG Mobile','COD Mobile','Free Fire','gaming','wager','tournaments','athletes','teams','betting','predictions'],
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: { template: '%s - FragNaija', default: 'FragNaija - Everything Esports - One Platform' },
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    locale: 'en_US',
    images: [{ url: absoluteUrl(OG_IMAGE_PATH), width: 1200, height: 630, alt: `${SITE_NAME} | ${SITE_TAGLINE}`, type: 'image/svg+xml' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@fragnaija',
    creator: '@fragnaija',
    title: { template: '%s - FragNaija', default: 'FragNaija - Everything Esports - One Platform' },
    description: DEFAULT_DESCRIPTION,
    images: [absoluteUrl(OG_IMAGE_PATH)],
  },
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'FragNaija' },
  formatDetection: { telephone: false, address: false, email: false },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/fn-badge.svg', type: 'image/svg+xml', sizes: 'any' },
      { url: '/icons/fn-badge-192.svg', type: 'image/svg+xml', sizes: '192x192' },
      { url: '/icons/fn-badge-512.svg', type: 'image/svg+xml', sizes: '512x512' },
    ],
    shortcut: '/icons/fn-badge.svg',
    apple: '/icons/fn-badge-192.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#007a1a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Get font preview mode from query params or localStorage
  // This allows testing different fonts by adding ?font=rajdhani, ?font=chakra, or ?font=exo2 to URL
  
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": SITE_NAME,
    "alternateName": "Frag Naija",
    "url": SITE_URL,
    "logo": absoluteUrl(APP_ICON_PATH),
    "image": absoluteUrl(OG_IMAGE_PATH),
    "description": DEFAULT_DESCRIPTION,
    "sameAs": [
      "https://twitter.com/fragnaija",
      "https://facebook.com/fragnaija",
      "https://instagram.com/fragnaija",
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer support",
      "email": "support@fragnaija.com.ng",
    },
  };

  return (
    <html lang="en" className={`dark ${fontVariables}`} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('fn-theme')||'dark';var e=document.documentElement;e.classList.remove('dark','light');e.classList.add(t);var f=localStorage.getItem('fn-font-preview');if(f){e.classList.add('font-preview-'+f);}}catch(_){}})();`,
          }}
        />
        <meta name="mobile-web-app-capable" content="yes" />
        {/* Canonical URL - always point to production domain */}
        <link rel="canonical" href={SITE_URL} />
      </head>
      <body className="bg-fn-black text-fn-text font-sans antialiased">
        <ThemeProvider>
          <GameProvider>
            <GameAccessGate>
              <NotificationsProvider>
              <Navbar />
              <div className="flex min-h-screen" style={{ paddingTop: 'calc(3.5rem + env(safe-area-inset-top))' }}>
                <main className="flex-1 overflow-hidden pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
                  {children}
                </main>
              </div>
              <Footer />
              <BottomNav />
              <PWARegister />
              <PWAInstallPrompt />
              <FCMRegistrar />
              <LazySupportChatbot />
              </NotificationsProvider>
            </GameAccessGate>
          </GameProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
