import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import Footer from "@/components/layout/Footer";
import { ThemeProvider } from "@/components/ThemeProvider";
import { GameProvider } from "@/context/GameContext";

export const metadata: Metadata = {
  title: "Frag Naija — Tactical Command Interface",
  description: "Nigeria's premier esports platform. Compete, wager, and dominate.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head />
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
          </GameProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
