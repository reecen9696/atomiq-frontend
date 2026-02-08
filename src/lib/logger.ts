/**
 * Centralized Logging System
 * 
 * Provides structured logging with debug mode control and production-ready error tracking.
 * 
 * Features:
 * - Debug mode: Only logs in development or when NEXT_PUBLIC_DEBUG=true
 * - Emoji support: Preserves existing emoji patterns
 * - Specialized methods: Transaction and WebSocket logging
 * - Sentry-ready: Hooks for future error tracking integration
 * 
 * @example
 * ```typescript
 * import { logger } from '@/lib/logger';
 * 
 * // Debug logs (only in dev/debug mode)
 * logger.debug('Processing data', { count: 10 });
 * 
 * // Warnings (logged in production)
 * logger.warn('API rate limit approaching', { remaining: 5 });
 * 
 * // Errors (logged + tracked in production)
 * logger.error('Transaction failed', error, { txId: '123' });
 * 
 * // Specialized logging
 * logger.transaction('deposit', { amount: '1.5 SOL', signature: 'abc...' });
 * logger.websocket('connected', { url: 'wss://...' });
 * ```
 */

import { env } from '@/config';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogOptions {
  emoji?: string;
  context?: Record<string, unknown>;
}

interface LogContext {
  [key: string]: unknown;
}

/**
 * Determines if debug logging is enabled
 * - Always enabled in development (NODE_ENV=development)
 * - Can be forced in production via NEXT_PUBLIC_DEBUG=true
 */
const isDebugEnabled = (): boolean => {
  if (env.isDev) return true;
  
  // Check for explicit debug flag in production
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_DEBUG === 'true';
  }
  
  return false;
};

/**
 * Logger Class
 * 
 * Centralized logging with environment-aware output.
 * Production logs are silent for debug/info levels unless DEBUG mode is enabled.
 */
class Logger {
  private readonly debugEnabled: boolean;

  constructor() {
    this.debugEnabled = isDebugEnabled();
  }

  /**
   * Debug-level logging
   * Only outputs in development or when NEXT_PUBLIC_DEBUG=true
   * 
   * @param message - Log message
   * @param context - Optional context object
   * @param emoji - Optional emoji (defaults to 🔍)
   */
  debug(message: string, context?: LogContext, emoji?: string): void {
    if (!this.debugEnabled) return;
    
    const prefix = emoji || '🔍';
    if (context) {
      console.log(`${prefix} ${message}`, context);
    } else {
      console.log(`${prefix} ${message}`);
    }
  }

  /**
   * Info-level logging
   * Only outputs in development or when NEXT_PUBLIC_DEBUG=true
   * 
   * @param message - Log message
   * @param context - Optional context object
   * @param emoji - Optional emoji (defaults to ℹ️)
   */
  info(message: string, context?: LogContext, emoji?: string): void {
    if (!this.debugEnabled) return;
    
    const prefix = emoji || 'ℹ️';
    if (context) {
      console.info(`${prefix} ${message}`, context);
    } else {
      console.info(`${prefix} ${message}`);
    }
  }

  /**
   * Warning-level logging
   * Always outputs, even in production
   * 
   * @param message - Warning message
   * @param context - Optional context object
   * @param emoji - Optional emoji (defaults to ⚠️)
   */
  warn(message: string, context?: LogContext, emoji?: string): void {
    const prefix = emoji || '⚠️';
    if (context) {
      console.warn(`${prefix} ${message}`, context);
    } else {
      console.warn(`${prefix} ${message}`);
    }

    // TODO: Send to Sentry in production
    // if (env.isProd && typeof Sentry !== 'undefined') {
    //   Sentry.captureMessage(message, {
    //     level: 'warning',
    //     extra: context,
    //   });
    // }
  }

  /**
   * Error-level logging
   * Always outputs, even in production
   * Should integrate with error tracking services
   * 
   * @param message - Error message
   * @param error - Error object or unknown error
   * @param context - Optional context object
   * @param emoji - Optional emoji (defaults to ❌)
   */
  error(
    message: string,
    error?: unknown,
    context?: LogContext,
    emoji?: string
  ): void {
    const prefix = emoji || '❌';
    
    if (error && context) {
      console.error(`${prefix} ${message}`, error, context);
    } else if (error) {
      console.error(`${prefix} ${message}`, error);
    } else if (context) {
      console.error(`${prefix} ${message}`, context);
    } else {
      console.error(`${prefix} ${message}`);
    }

    // TODO: Send to Sentry in production
    // if (env.isProd && typeof Sentry !== 'undefined') {
    //   Sentry.captureException(error || new Error(message), {
    //     extra: { message, ...context },
    //   });
    // }
  }

  /**
   * Transaction-specific logging
   * Specialized method for blockchain transaction debugging
   * Only outputs in debug mode
   * 
   * @param type - Transaction type (e.g., 'deposit', 'withdraw', 'bet')
   * @param details - Transaction details (signature, amount, etc.)
   */
  transaction(type: string, details: LogContext): void {
    if (!this.debugEnabled) return;
    console.log(`⛓️ [TX] ${type}`, details);
  }

  /**
   * WebSocket-specific logging
   * Specialized method for WebSocket event debugging
   * Only outputs in debug mode
   * 
   * @param event - Event type (e.g., 'connected', 'message', 'error')
   * @param data - Optional event data
   */
  websocket(event: string, data?: unknown): void {
    if (!this.debugEnabled) return;
    
    if (data !== undefined) {
      console.log(`🔌 [WS] ${event}`, data);
    } else {
      console.log(`🔌 [WS] ${event}`);
    }
  }

  /**
   * API-specific logging
   * Specialized method for API request/response debugging
   * Only outputs in debug mode
   * 
   * @param method - HTTP method
   * @param endpoint - API endpoint
   * @param data - Optional request/response data
   */
  api(method: string, endpoint: string, data?: unknown): void {
    if (!this.debugEnabled) return;
    
    if (data !== undefined) {
      console.log(`🌐 [API] ${method} ${endpoint}`, data);
    } else {
      console.log(`🌐 [API] ${method} ${endpoint}`);
    }
  }

  /**
   * Performance-specific logging
   * Specialized method for performance metrics
   * Only outputs in debug mode
   * 
   * @param metric - Performance metric name
   * @param value - Metric value
   * @param unit - Optional unit (ms, MB, etc.)
   */
  performance(metric: string, value: number, unit?: string): void {
    if (!this.debugEnabled) return;
    
    const formattedValue = unit ? `${value}${unit}` : value;
    console.log(`⚡ [PERF] ${metric}: ${formattedValue}`);
  }

  /**
   * Group-based logging
   * Creates collapsible log groups (useful for complex operations)
   * Only outputs in debug mode
   * 
   * @param label - Group label
   * @param fn - Function containing logs to group
   */
  group(label: string, fn: () => void): void {
    if (!this.debugEnabled) return;
    
    console.group(label);
    fn();
    console.groupEnd();
  }

  /**
   * Check if debug mode is currently enabled
   */
  isDebugMode(): boolean {
    return this.debugEnabled;
  }
}

/**
 * Singleton logger instance
 * Import and use throughout the application
 */
export const logger = new Logger();

/**
 * Type exports for convenience
 */
export type { LogContext, LogLevel, LogOptions };
