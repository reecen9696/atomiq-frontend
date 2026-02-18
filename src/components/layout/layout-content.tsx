"use client";

import { ErrorBoundary } from "@/components/error-boundary";
import { TopNavbar } from "@/components/layout/top-navbar";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { WalletModal } from "@/components/wallet/wallet-modal";
import { Toaster } from "@/components/ui/toaster";
import { PageLoadingOverlay } from "@/components/ui/page-loading-overlay";
import { usePageLoading } from "@/components/providers/loading-provider";

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isInitialLoading } = usePageLoading();

  return (
    <>
      <PageLoadingOverlay isLoading={isInitialLoading} />
      <ErrorBoundary level="page">
        <TopNavbar />
        <div className="pb-20 sm:pb-0">{children}</div>
        <MobileBottomNav />
        <WalletModal />
        <Toaster />
      </ErrorBoundary>
    </>
  );
}
