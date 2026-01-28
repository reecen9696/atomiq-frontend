import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { TopNavbar } from "@/components/layout/top-navbar";

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
      <body>
        <Providers>
          <TopNavbar />
          <div className="pb-20 sm:pb-0">{children}</div>
          <MobileBottomNav />
        </Providers>
      </body>
    </html>
  );
}
