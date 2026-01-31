"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { createAtomikSDK, type AtomikSDK } from "@/lib/sdk";

interface SDKProviderProps {
  children: ReactNode;
}

const SDKContext = createContext<AtomikSDK | null>(null);

/**
 * SDK Provider Component
 * Initializes and provides the Atomik SDK to all child components
 */
export function SDKProvider({ children }: SDKProviderProps) {
  const sdk = useMemo(() => {
    try {
      return createAtomikSDK();
    } catch (error) {
      console.error("Failed to initialize Atomik SDK:", error);
      return null;
    }
  }, []);

  return <SDKContext.Provider value={sdk}>{children}</SDKContext.Provider>;
}

/**
 * Hook to access the Atomik SDK
 */
export function useAtomikSDK() {
  const sdk = useContext(SDKContext);
  if (!sdk) {
    throw new Error("useAtomikSDK must be used within SDKProvider");
  }
  return sdk;
}

/**
 * Hook to access individual SDK services
 */
export function useAtomikAPI() {
  const sdk = useAtomikSDK();
  return sdk.api;
}

export function useAtomikBetting() {
  const sdk = useAtomikSDK();
  return sdk.betting;
}

export function useAtomikWebSocket() {
  const sdk = useAtomikSDK();
  return sdk.websocket;
}
