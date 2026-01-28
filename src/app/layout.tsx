import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { TopNavbar } from "@/components/layout/top-navbar";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "Atomik Casino",
  description: "Premium casino UI",
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
          <div className="pt-20 pb-20 sm:pb-0">{children}</div>
          <MobileBottomNav />
        </Providers>
      </body>
    </html>
  );
}
