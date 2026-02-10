/**
 * Community Game Security Configuration
 * Defines security constraints and policies for community-submitted games
 */

/**
 * Security configuration for community games
 */
export const COMMUNITY_GAME_SECURITY = {
  /**
   * Iframe sandbox attributes
   * Restricts what the iframe can do
   */
  SANDBOX_ATTRS: 'allow-scripts',

  /**
   * Content Security Policy for game iframes
   * ${API_BASE_URL} would be replaced at runtime
   */
  CSP_POLICY:
    "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src ${API_BASE_URL}; media-src 'self' blob:",

  /**
   * Allowed API endpoints that games can call
   * Games must use SDK wrappers, not direct calls
   */
  ALLOWED_ENDPOINTS: [
    '/api/vrf/generate',
    '/api/game/*/play',
    '/api/game/*/settle',
    '/api/game/*/result',
  ],

  /**
   * Math verification thresholds
   */
  MATH_VERIFICATION: {
    /** Minimum number of simulation rounds */
    MIN_SIMULATION_ROUNDS: 1_000_000,
    
    /** Maximum allowed RTP deviation (2% tolerance) */
    MAX_RTP_DEVIATION: 0.02,
    
    /** Minimum allowed RTP (90%) */
    MIN_ALLOWED_RTP: 0.90,
    
    /** Maximum allowed RTP (99.5%) */
    MAX_ALLOWED_RTP: 0.995,
    
    /** Maximum payout multiplier cap */
    MAX_MULTIPLIER_CAP: 1000,
  },

  /**
   * Rate limits for community games
   */
  RATE_LIMITS: {
    /** Maximum bets per second per player */
    MAX_BETS_PER_SECOND: 2,
    
    /** Maximum VRF requests per minute per player */
    MAX_VRF_REQUESTS_PER_MINUTE: 120,
    
    /** Maximum submission file size in MB */
    MAX_SUBMISSION_SIZE_MB: 50,
  },

  /**
   * Revenue sharing configuration
   */
  REVENUE: {
    /** Default developer revenue share (10%) */
    DEFAULT_DEVELOPER_REVENUE_SHARE: 0.10,
    
    /** Days to hold earnings in escrow */
    EARNINGS_ESCROW_DAYS: 30,
  },

  /**
   * Banned code patterns in static analysis
   * These patterns indicate security violations
   */
  BANNED_PATTERNS: [
    'Math.random',
    'crypto.getRandomValues',
    'eval(',
    'Function(',
    'localStorage',
    'sessionStorage',
    'document.cookie',
    'indexedDB',
    'WebSocket',
    'XMLHttpRequest',
    'window.open',
    'window.parent',
    'window.top',
  ],
} as const;
