/**
 * Application Constants
 * All app-wide constants and configuration values
 */

// Application Info
export const APP_NAME = "Atomiq Casino";
export const APP_DESCRIPTION = "Provably fair blockchain casino";

// API Configuration
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
export const WS_BASE_URL =
  process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001";
export const WS_ENABLED = process.env.NEXT_PUBLIC_ENABLE_WS === "true";

// Display Limits
export const MAX_RECENT_WINS = 8;
export const MAX_RECENT_BLOCKS = 5;
export const MAX_GAMES = 7;
export const MAX_STATS = 4;
export const DEFAULT_PAGE_SIZE = 20;

// Polling Intervals (in milliseconds)
export const POLLING_INTERVALS = {
  STATS: 5000,
  WINNERS: 5000,
  BLOCKS: 3000,
  GAMES: 10000,
} as const;

// Legacy exports (deprecated - use POLLING_INTERVALS)
export const STATS_POLL_INTERVAL = POLLING_INTERVALS.STATS;
export const BLOCKS_POLL_INTERVAL = POLLING_INTERVALS.BLOCKS;
export const WINS_POLL_INTERVAL = POLLING_INTERVALS.WINNERS;

// UI Constants
export const MOBILE_BREAKPOINT = 768;
export const NAVBAR_HEIGHT = 64; // h-16 = 64px
export const TOAST_DURATION = 4000;
export const SKELETON_DELAY = 200;
export const DEBOUNCE_DELAY = 300;

// Animation Durations
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const;

// WebSocket Events
export const WS_EVENTS = {
  CONNECT: "connect",
  DISCONNECT: "disconnect",
  NEW_WIN: "new_win",
  STATS_UPDATE: "stats_update",
  NEW_BLOCK: "new_block",
  ERROR: "error",
} as const;

// Game Categories
export const GAME_CATEGORIES = {
  SLOTS: "slots",
  DICE: "dice",
  ROULETTE: "roulette",
  BLACKJACK: "blackjack",
  POKER: "poker",
} as const;

// Transaction Status
export const TX_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  FAILED: "failed",
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  WALLET_ADDRESS: "atomiq_wallet_address",
  THEME_PREFERENCE: "atomiq_theme",
  LANGUAGE: "atomiq_language",
} as const;

// Re-export configuration
export { config } from "@/config/app";
