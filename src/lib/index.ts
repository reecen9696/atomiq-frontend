/**
 * Library Utilities
 * All utility functions and helpers
 */

// Core utilities
export {
  cn,
  formatSOL,
  formatSOLWithSymbol,
  formatAddress,
  formatHash,
  formatNumber,
  formatPercentage,
  formatTimeAgo,
  formatTimestamp,
  sleep,
  slugify,
  unslugify,
  clamp,
  debounce,
} from "./utils";

// Validation utilities
export {
  emailSchema,
  passwordSchema,
  walletAddressSchema,
  amountSchema,
  isValidEmail,
  isValidWalletAddress,
  isValidAmount,
  validateForm,
  sanitizeHtml,
  sanitizeInput,
  type ValidationResult,
} from "./validation";

// Error handling
export {
  AppError,
  ErrorCode,
  ErrorSeverity,
  ErrorFactory,
  errorHandler,
  handleQueryError,
  retryWithBackoff,
} from "./error-handling";

// Logging
export { logger, type LogContext, type LogLevel, type LogOptions } from "./logger";

// Performance utilities
export {
  createMemoComponent,
  useDebounce,
  useSelector,
  LazyLoading,
  VirtualScrolling,
  BundleSplitting,
  MemoryManagement,
  PerformanceMonitoring,
} from "./performance";

// WebSocket utilities (to be implemented)
// export type { WSMessage, WSConfig } from "./ws/ws-client";

// Re-export commonly used utilities
export { default as clsx } from "clsx";
export { twMerge } from "tailwind-merge";
