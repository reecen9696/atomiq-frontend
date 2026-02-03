/**
 * Application Configuration
 * Runtime configuration and feature flags
 */

import { env } from "./env";

export const config = {
  // API Configuration
  api: {
    baseUrl: env.apiUrl,
    timeout: 10000, // 10 seconds
    retries: 3,
  },

  // WebSocket Configuration
  websocket: {
    enabled: env.enableWebSocket,
    reconnectInterval: 5000, // 5 seconds
    maxReconnectAttempts: 10,
    heartbeatInterval: 30000, // 30 seconds
  },

  // Polling Configuration
  polling: {
    defaultInterval: 5000, // 5 seconds
    intervals: {
      stats: 30000,     // 30s - reduced from 8s to match test-ui behavior
      winners: 30000,   // 30s - reduced from 8s to match test-ui behavior  
      blocks: 15000,    // 15s - reduced from 5s
      games: 60000,     // 60s - reduced from 15s for less frequent polling
    },
  },

  // UI Configuration
  ui: {
    toastDuration: 4000, // 4 seconds
    skeletonDelay: 200, // 200ms before showing skeleton
    debounceDelay: 300, // 300ms for search/input debounce
  },

  // Feature Flags
  features: {
    enableAnalytics: env.nodeEnv === "production",
    enableDevtools: env.nodeEnv === "development",
    enableMockData: !env.apiUrl || env.nodeEnv === "development",
    enableErrorBoundary: true,
  },

  // Pagination
  pagination: {
    defaultLimit: 20,
    maxLimit: 100,
    limits: {
      winners: 8,
      blocks: 5,
      games: 7,
      stats: 4,
    },
  },

  // Performance
  performance: {
    imageOptimization: true,
    lazyLoadThreshold: "200px",
    enablePreload: true,
  },
} as const;

export type Config = typeof config;
