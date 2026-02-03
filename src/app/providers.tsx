"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";
import dynamic from "next/dynamic";
import { SDKProvider } from "@/components/providers/sdk-provider";

// Import WalletProvider dynamically with SSR disabled
const WalletProvider = dynamic(
  () =>
    import("@/components/providers/wallet-provider").then(
      (mod) => mod.WalletProvider,
    ),
  { ssr: false },
);

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 15_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SDKProvider>
        <WalletProvider>
          {children}
          <ReactQueryDevtools initialIsOpen={false} />
        </WalletProvider>
      </SDKProvider>
    </QueryClientProvider>
  );
}
