import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "@/components/Navbar";
import { NetworkGuard } from "@/components/NetworkGuard";
import { ToastProvider } from "@/components/Toast";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "B20 FUN - Base B20 Token Launchpad & DEX",
  description: "Create, swap, and explore B20 tokens on Base network",
  other: {
    'base:app_id': '6a4d9a6e19535d66792cfb74',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="base:app_id" content="6a4d9a6e19535d66792cfb74" />
      </head>
      <body className={inter.className}>
        <Providers>
          <ToastProvider>
            <NetworkGuard>
              <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-base)' }}>
                <Navbar />
                <main className="flex-1 overflow-y-auto" style={{ background: 'var(--bg-base)' }}>
                  {children}
                </main>
              </div>
            </NetworkGuard>
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
