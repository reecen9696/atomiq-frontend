import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { TopNavbar } from "@/components/layout/top-navbar";
import { WalletModal } from "@/components/wallet/wallet-modal";
import { Toaster } from "@/components/ui/toaster";

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
      <body className={dmSans.className}>
        <Providers>
          <TopNavbar />
          <div className="pb-20 sm:pb-0">{children}</div>
          <MobileBottomNav />
          <WalletModal />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
