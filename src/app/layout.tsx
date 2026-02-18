import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { WalletSync } from "@/components/providers/wallet-sync";
import { LoadingProvider } from "@/components/providers/loading-provider";
import { LayoutContent } from "@/components/layout/layout-content";
import Script from "next/script";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "Atomiq Casino",
  description: "Premium casino UI",
  icons: {
    icon: [
      {
        url: "/favicon-light.svg",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/favicon-dark.svg",
        media: "(prefers-color-scheme: dark)",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://unpkg.com/@dotlottie/player-component@latest/dist/dotlottie-player.mjs"
          type="module"
          strategy="beforeInteractive"
        />
      </head>
      <body className={dmSans.className}>
        <Providers>
          <WalletSync />
          <LoadingProvider>
            <LayoutContent>{children}</LayoutContent>
          </LoadingProvider>
        </Providers>
      </body>
    </html>
  );
}
