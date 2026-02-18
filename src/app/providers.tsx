"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

// Import both providers dynamically with SSR disabled to prevent hydration errors
const SDKProvider = dynamic(
  () =>
    import("@/components/providers/sdk-provider").then(
      (mod) => mod.SDKProvider,
    ),
  { ssr: false },
);

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
      default: "#0F0E11",
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

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {mounted ? (
          <SDKProvider>
            <WalletProvider>
              {children}
              <ReactQueryDevtools initialIsOpen={false} />
            </WalletProvider>
          </SDKProvider>
        ) : null}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
