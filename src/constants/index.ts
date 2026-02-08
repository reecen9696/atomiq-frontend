/**
 * @deprecated This file is deprecated. Import from @/config instead.
 * 
 * Application Constants
 * All app-wide constants and configuration values
 * 
 * Migration guide:
 * - Replace `import { X } from "@/constants"` with `import { X } from "@/config"`
 * - Or use the new structured config: `import { config } from "@/config"`
 * 
 * Examples:
 * - MAX_RECENT_WINS → config.pagination.limits.winners
 * - POLLING_INTERVALS.STATS → config.polling.intervals.stats
 * - MOBILE_BREAKPOINT → config.ui.mobileBreakpoint
 */

export {
  // Legacy re-exports for backward compatibility
  config,
  env,
  APP_NAME,
  APP_DESCRIPTION,
  API_BASE_URL,
  WS_BASE_URL,
  WS_ENABLED,
  MAX_RECENT_WINS,
  MAX_RECENT_BLOCKS,
  MAX_GAMES,
  MAX_STATS,
  DEFAULT_PAGE_SIZE,
  POLLING_INTERVALS,
  STATS_POLL_INTERVAL,
  BLOCKS_POLL_INTERVAL,
  WINS_POLL_INTERVAL,
  MOBILE_BREAKPOINT,
  NAVBAR_HEIGHT,
  TOAST_DURATION,
  SKELETON_DELAY,
  DEBOUNCE_DELAY,
  ANIMATION_DURATION,
  WS_EVENTS,
  GAME_CATEGORIES,
  TX_STATUS,
  STORAGE_KEYS,
} from "@/config";
