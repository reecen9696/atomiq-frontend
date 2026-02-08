/**
 * Configuration
 * Consolidated application configuration, environment variables, and constants
 */

// ============================================================================
// Environment Variables
// ============================================================================

function getOptionalEnvVar(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

export const env = {
  // API Configuration
  apiUrl: getOptionalEnvVar(
    "NEXT_PUBLIC_API_BASE_URL",
    "http://localhost:8080",
  ),
  wsUrl: getOptionalEnvVar("NEXT_PUBLIC_WS_URL", "ws://localhost:8080"),

  // Blockchain Configuration
  rpcUrl: getOptionalEnvVar("NEXT_PUBLIC_RPC_URL", ""),
  chainId: getOptionalEnvVar("NEXT_PUBLIC_CHAIN_ID", ""),

  // Feature Flags
  enableWebSocket:
    getOptionalEnvVar("NEXT_PUBLIC_ENABLE_WS", "false") === "true",
  enableAnalytics:
    getOptionalEnvVar("NEXT_PUBLIC_ENABLE_ANALYTICS", "false") === "true",

  // Build Info
  nodeEnv: getOptionalEnvVar("NODE_ENV", "development"),
  isProd: process.env.NODE_ENV === "production",
  isDev: process.env.NODE_ENV === "development",
} as const;

// ============================================================================
// Application Configuration
// ============================================================================

export const config = {
  // Application Info
  app: {
    name: "Atomiq Casino",
    description: "Provably fair blockchain casino",
  },

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
      stats: 30000, // 30s
      winners: 30000, // 30s
      blocks: 15000, // 15s
      games: 60000, // 60s
    },
  },

  // UI Configuration
  ui: {
    toastDuration: 4000, // 4 seconds
    skeletonDelay: 200, // 200ms before showing skeleton
    debounceDelay: 300, // 300ms for search/input debounce
    mobileBreakpoint: 768, // px
    navbarHeight: 64, // px (h-16)
  },

  // Animation Configuration
  animation: {
    fast: 150, // ms
    normal: 300, // ms
    slow: 500, // ms
  },

  // Feature Flags
  features: {
    enableAnalytics: env.nodeEnv === "production",
    enableDevtools: env.nodeEnv === "development",
    enableMockData: false, // Use real API data
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

// ============================================================================
// WebSocket Events
// ============================================================================

export const WS_EVENTS = {
  CONNECT: "connect",
  DISCONNECT: "disconnect",
  NEW_WIN: "new_win",
  STATS_UPDATE: "stats_update",
  NEW_BLOCK: "new_block",
  ERROR: "error",
} as const;

// ============================================================================
// Game Categories
// ============================================================================

export const GAME_CATEGORIES = {
  SLOTS: "slots",
  DICE: "dice",
  ROULETTE: "roulette",
  BLACKJACK: "blackjack",
  POKER: "poker",
} as const;

// ============================================================================
// Transaction Status
// ============================================================================

export const TX_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  FAILED: "failed",
} as const;

// ============================================================================
// Local Storage Keys
// ============================================================================

export const STORAGE_KEYS = {
  WALLET_ADDRESS: "atomiq_wallet_address",
  THEME_PREFERENCE: "atomiq_theme",
  LANGUAGE: "atomiq_language",
} as const;

// ============================================================================
// Legacy Exports (for backward compatibility)
// ============================================================================

/** @deprecated Use config.app.name instead */
export const APP_NAME = config.app.name;

/** @deprecated Use config.app.description instead */
export const APP_DESCRIPTION = config.app.description;

/** @deprecated Use config.api.baseUrl instead */
export const API_BASE_URL = config.api.baseUrl;

/** @deprecated Use env.wsUrl instead */
export const WS_BASE_URL = env.wsUrl;

/** @deprecated Use env.enableWebSocket instead */
export const WS_ENABLED = env.enableWebSocket;

/** @deprecated Use config.pagination.limits.winners instead */
export const MAX_RECENT_WINS = config.pagination.limits.winners;

/** @deprecated Use config.pagination.limits.blocks instead */
export const MAX_RECENT_BLOCKS = config.pagination.limits.blocks;

/** @deprecated Use config.pagination.limits.games instead */
export const MAX_GAMES = config.pagination.limits.games;

/** @deprecated Use config.pagination.limits.stats instead */
export const MAX_STATS = config.pagination.limits.stats;

/** @deprecated Use config.pagination.defaultLimit instead */
export const DEFAULT_PAGE_SIZE = config.pagination.defaultLimit;

/** @deprecated Use config.polling.intervals instead */
export const POLLING_INTERVALS = config.polling.intervals;

/** @deprecated Use config.polling.intervals.stats instead */
export const STATS_POLL_INTERVAL = config.polling.intervals.stats;

/** @deprecated Use config.polling.intervals.blocks instead */
export const BLOCKS_POLL_INTERVAL = config.polling.intervals.blocks;

/** @deprecated Use config.polling.intervals.winners instead */
export const WINS_POLL_INTERVAL = config.polling.intervals.winners;

/** @deprecated Use config.ui.mobileBreakpoint instead */
export const MOBILE_BREAKPOINT = config.ui.mobileBreakpoint;

/** @deprecated Use config.ui.navbarHeight instead */
export const NAVBAR_HEIGHT = config.ui.navbarHeight;

/** @deprecated Use config.ui.toastDuration instead */
export const TOAST_DURATION = config.ui.toastDuration;

/** @deprecated Use config.ui.skeletonDelay instead */
export const SKELETON_DELAY = config.ui.skeletonDelay;

/** @deprecated Use config.ui.debounceDelay instead */
export const DEBOUNCE_DELAY = config.ui.debounceDelay;

/** @deprecated Use config.animation instead */
export const ANIMATION_DURATION = config.animation;

// ============================================================================
// Type Exports
// ============================================================================

export type Config = typeof config;
export type Env = typeof env;
