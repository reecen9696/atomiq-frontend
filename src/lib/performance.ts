/**
 * Performance Optimization Utilities
 * Tools for improving app performance
 */

import React, { memo, useMemo, useCallback, type ComponentType } from "react";
import { config } from "@/config";

/**
 * Enhanced memo with debugging support
 */
export function createMemoComponent<P extends object>(
  Component: ComponentType<P>,
  displayName?: string,
): ComponentType<P> {
  const MemoizedComponent = memo(Component);

  if (displayName) {
    MemoizedComponent.displayName = displayName;
  }

  if (config.features.enableDevtools) {
    // Add performance monitoring in development
    return (props: P) => {
      const startTime = performance.now();
      const result = MemoizedComponent(props);
      const endTime = performance.now();

      if (endTime - startTime > 16) {
        // More than one frame
        console.warn(
          `Slow render detected for ${displayName || "Component"}: ${endTime - startTime}ms`,
        );
      }

      return result;
    };
  }

  return MemoizedComponent;
}

/**
 * Debounce hook with cleanup
 */
export function useDebounce<T extends (...args: unknown[]) => void>(
  callback: T,
  delay = config.ui.debounceDelay,
): (...args: Parameters<T>) => void {
  return useCallback(
    (...args: Parameters<T>) => {
      setTimeout(() => callback(...args), delay);
    },
    [callback, delay],
  );
}

/**
 * Memoized selector for complex data transformations
 */
export function useSelector<T, R>(
  data: T,
  selector: (data: T) => R,
  deps: unknown[] = [],
): R {
  return useMemo(() => selector(data), [data, ...deps]);
}

/**
 * Lazy loading utilities
 */
export const LazyLoading = {
  /**
   * Create intersection observer for lazy loading
   */
  createObserver: (
    callback: (entries: IntersectionObserverEntry[]) => void,
    options?: IntersectionObserverInit,
  ) => {
    const defaultOptions: IntersectionObserverInit = {
      rootMargin: config.performance.lazyLoadThreshold,
      threshold: 0.1,
      ...options,
    };

    return new IntersectionObserver(callback, defaultOptions);
  },

  /**
   * Preload critical resources
   */
  preloadImage: (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = src;
    });
  },

  /**
   * Preload multiple images
   */
  preloadImages: (sources: string[]): Promise<void[]> => {
    return Promise.all(sources.map((src) => LazyLoading.preloadImage(src)));
  },
};

/**
 * Virtual scrolling utilities for large lists
 */
export const VirtualScrolling = {
  /**
   * Calculate visible items for virtual scrolling
   */
  calculateVisibleItems: (
    containerHeight: number,
    itemHeight: number,
    scrollTop: number,
    overscan = 5,
  ) => {
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const startIndex = Math.max(
      0,
      Math.floor(scrollTop / itemHeight) - overscan,
    );
    const endIndex = Math.min(
      startIndex + visibleCount + overscan * 2,
      Number.MAX_SAFE_INTEGER,
    );

    return { startIndex, endIndex, visibleCount };
  },
};

/**
 * Bundle splitting utilities
 */
export const BundleSplitting = {
  /**
   * Dynamic import with error handling
   */
  loadModule: async <T extends object>(
    importFn: () => Promise<{ default: T } | T>,
    fallback?: T,
  ): Promise<T> => {
    try {
      const module = await importFn();
      return "default" in (module as object)
        ? (module as { default: T }).default
        : (module as T);
    } catch (error) {
      console.error("Failed to load module:", error);
      if (fallback) {
        return fallback;
      }
      throw error;
    }
  },

  /**
   * Preload route components
   */
  preloadRoute: (routeImport: () => Promise<unknown>) => {
    if (config.performance.enablePreload) {
      requestIdleCallback(() => {
        routeImport().catch(console.error);
      });
    }
  },
};

/**
 * Memory management utilities
 */
export const MemoryManagement = {
  /**
   * Cleanup function registry
   */
  cleanupRegistry: new Set<() => void>(),

  /**
   * Register cleanup function
   */
  registerCleanup: (cleanup: () => void) => {
    MemoryManagement.cleanupRegistry.add(cleanup);
    return () => MemoryManagement.cleanupRegistry.delete(cleanup);
  },

  /**
   * Run all cleanup functions
   */
  runCleanup: () => {
    MemoryManagement.cleanupRegistry.forEach((cleanup) => {
      try {
        cleanup();
      } catch (error) {
        console.error("Cleanup function failed:", error);
      }
    });
    MemoryManagement.cleanupRegistry.clear();
  },

  /**
   * Memory usage monitoring (development only)
   */
  monitorMemory: () => {
    if (config.features.enableDevtools && "memory" in performance) {
      const memory = (performance as any).memory;
      console.log("Memory usage:", {
        used: Math.round(memory.usedJSHeapSize / 1048576),
        total: Math.round(memory.totalJSHeapSize / 1048576),
        limit: Math.round(memory.jsHeapSizeLimit / 1048576),
      });
    }
  },
};

/**
 * Performance monitoring
 */
export const PerformanceMonitoring = {
  /**
   * Measure component render time
   */
  measureRender: <P extends object>(
    Component: ComponentType<P>,
    name: string,
  ): ComponentType<P> => {
    if (!config.features.enableDevtools) {
      return Component;
    }

    return (props: P) => {
      const startTime = performance.now();
      const Component_ = Component as React.ComponentType<P>;
      const result = React.createElement(Component_, props);
      const endTime = performance.now();

      console.log(`Render time for ${name}: ${endTime - startTime}ms`);
      return result;
    };
  },

  /**
   * Performance observer for Core Web Vitals
   */
  observeWebVitals: () => {
    if (typeof window === "undefined" || !config.features.enableAnalytics) {
      return;
    }

    // Observe LCP
    new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        console.log("LCP:", entry.startTime);
      });
    }).observe({ entryTypes: ["largest-contentful-paint"] });

    // Observe FID
    new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        console.log("FID:", (entry as any).processingStart - entry.startTime);
      });
    }).observe({ entryTypes: ["first-input"] });
  },
};
