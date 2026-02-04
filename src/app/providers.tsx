"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";
import dynamic from "next/dynamic";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { SDKProvider } from "@/components/providers/sdk-provider";

// Import WalletProvider dynamically with SSR disabled
const WalletProvider = dynamic(
  () =>
    import("@/components/providers/wallet-provider").then(
      (mod) => mod.WalletProvider,
    ),
  { ssr: false },
);

// Create a custom MUI theme for casino games
const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#9F60F1",
    },
    secondary: {
      main: "#FDF6CB",
    },
    background: {
      default: "#1a1a1a",
      paper: "#2a2a2a",
    },
  },
  typography: {
    fontFamily: "'Styrene A Web', sans-serif",
  },
});

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
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SDKProvider>
          <WalletProvider>
            {children}
            <ReactQueryDevtools initialIsOpen={false} />
          </WalletProvider>
        </SDKProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
