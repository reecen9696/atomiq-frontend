"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
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
  const { isConnected } = useAuthStore();
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  const { isLoading: winsLoading, isFetching: winsFetching } = useRecentWins();
  const { isLoading: blocksLoading, isFetching: blocksFetching } = useRecentBlocks();
  const { isLoading: statsLoading, isFetching: statsFetching } = useStats();

  useEffect(() => {
    // Initial loading is done when all data has been fetched at least once
    const allDataLoaded = !winsLoading && !blocksLoading && !statsLoading;
    
    if (allDataLoaded) {
      // Add a slight delay to ensure smooth transition
      const timer = setTimeout(() => {
        setIsInitialLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [winsLoading, blocksLoading, statsLoading]);

  return (
    <LoadingContext.Provider value={{ isInitialLoading }}>
      {children}
    </LoadingContext.Provider>
  );
}
