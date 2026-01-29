/**
 * Library Utilities
 * All utility functions and helpers
 */

// Core utilities
export { cn, formatSOL, formatAddress, formatTimestamp, sleep } from "./utils";

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
