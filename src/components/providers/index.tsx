"use client";

import { type ReactNode } from "react";
import dynamic from "next/dynamic";
import { SDKProvider } from "./sdk-provider";

// Import WalletProvider dynamically with SSR disabled
const WalletProvider = dynamic(
  () => import("./wallet-provider").then((mod) => mod.WalletProvider),
  { ssr: false },
);

interface ProvidersProps {
  children: ReactNode;
}

/**
 * Combined Providers Component
 * Wraps the app with SDK, Wallet, and other providers
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <SDKProvider>
      <WalletProvider>{children}</WalletProvider>
    </SDKProvider>
  );
}
