"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRecentWins } from "@/hooks/use-recent-wins";
import { useRecentBlocks } from "@/hooks/use-recent-blocks";
import { useStats } from "@/hooks/use-stats";
import { useAuthStore } from "@/stores/auth-store";

interface LoadingContextValue {
  isInitialLoading: boolean;
}

const LoadingContext = createContext<LoadingContextValue>({
  isInitialLoading: false,
});

export function usePageLoading() {
  return useContext(LoadingContext);
}

export function LoadingProvider({ children }: { children: ReactNode }) {
  const { isOnboarding, hasCompletedInitialLoad } = useAuthStore();
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const { isLoading: winsLoading } = useRecentWins();
  const { isLoading: blocksLoading } = useRecentBlocks();
  const { isLoading: statsLoading } = useStats();

  useEffect(() => {
    // Wait for:
    // 1. All data to load (wins, blocks, stats)
    // 2. Initial wallet check and onboarding to complete
    const allDataLoaded = !winsLoading && !blocksLoading && !statsLoading;
    const walletSetupComplete = hasCompletedInitialLoad && !isOnboarding;

    if (allDataLoaded && walletSetupComplete) {
      // Add a slight delay to ensure smooth transition
      const timer = setTimeout(() => {
        setIsInitialLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [
    winsLoading,
    blocksLoading,
    statsLoading,
    hasCompletedInitialLoad,
    isOnboarding,
  ]);

  return (
    <LoadingContext.Provider value={{ isInitialLoading }}>
      {children}
    </LoadingContext.Provider>
  );
}
