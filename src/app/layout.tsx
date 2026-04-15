import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import Footer from "@/components/layout/Footer";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "Frag Naija — Tactical Command Interface",
  description: "Nigeria's premier esports platform. Compete, wager, and dominate.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Frag Naija",
  },
  icons: {
    icon: "/logo-icon-192.png",
    apple: "/logo-icon-192.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#00ff41" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="bg-fn-black text-fn-text font-mono antialiased">
        <ThemeProvider>
          <Navbar />
          <div className="flex min-h-screen pt-14">
            <Sidebar />
            <main className="flex-1 ml-12 lg:ml-14 overflow-hidden">
              {children}
            </main>
          </div>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
