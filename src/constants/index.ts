/**
 * Application-wide constants
 * Centralized location for magic numbers, strings, and configuration values
 */

export const APP_NAME = "Atomik Casino";
export const APP_DESCRIPTION = "Provably fair blockchain casino";

// API Configuration (to be updated with actual endpoints)
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
export const WS_BASE_URL =
  process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001";

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_RECENT_WINS = 8;
export const MAX_RECENT_BLOCKS = 5;

// Polling Intervals (milliseconds)
export const STATS_POLL_INTERVAL = 5000;
export const BLOCKS_POLL_INTERVAL = 3000;
export const WINS_POLL_INTERVAL = 2000;

// WebSocket Events (to be defined based on backend)
export const WS_EVENTS = {
  CONNECT: "connect",
  DISCONNECT: "disconnect",
  NEW_WIN: "new_win",
  STATS_UPDATE: "stats_update",
  NEW_BLOCK: "new_block",
} as const;

// UI Constants
export const MOBILE_BREAKPOINT = 768;
export const NAVBAR_HEIGHT = 80; // 20 * 4 = 80px (h-20)

// Game Categories (to be expanded)
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
  WALLET_ADDRESS: "atomik_wallet_address",
  THEME_PREFERENCE: "atomik_theme",
  LANGUAGE: "atomik_language",
} as const;
