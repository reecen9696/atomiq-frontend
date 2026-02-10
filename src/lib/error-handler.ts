/**
 * Sanitized Error Handling
 * Prevent leaking internal state to users
 */

export enum ErrorCategory {
  NETWORK = 'NETWORK',
  WALLET = 'WALLET',
  BET_INVALID = 'BET_INVALID',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  RATE_LIMITED = 'RATE_LIMITED',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  UNKNOWN = 'UNKNOWN',
}

export interface UserFacingError {
  code: string;
  message: string; // Safe for display
  retryable: boolean;
}

/**
 * Sanitize errors to prevent leaking internal state
 * - Map internal errors to user-friendly messages
 * - Strip stack traces, internal paths, wallet keys
 * - Log full error internally (console in dev, structured in prod)
 */
export function sanitizeError(error: unknown): UserFacingError {
  // Log full error internally for debugging
  if (process.env.NODE_ENV === 'development') {
    console.error('Full error details:', error);
  }

  // Default error
  const defaultError: UserFacingError = {
    code: ErrorCategory.UNKNOWN,
    message: 'An unexpected error occurred. Please try again.',
    retryable: true,
  };

  // Handle null/undefined
  if (!error) {
    return defaultError;
  }

  // Extract error message safely
  let errorMessage = '';
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else if (typeof error === 'object' && 'message' in error) {
    errorMessage = String(error.message);
  }

  const lowerMessage = errorMessage.toLowerCase();

  // Network errors
  if (
    lowerMessage.includes('network') ||
    lowerMessage.includes('fetch') ||
    lowerMessage.includes('timeout') ||
    lowerMessage.includes('connection')
  ) {
    return {
      code: ErrorCategory.NETWORK,
      message: 'Network error. Please check your connection and try again.',
      retryable: true,
    };
  }

  // Wallet errors
  if (
    lowerMessage.includes('wallet') ||
    lowerMessage.includes('not connected') ||
    lowerMessage.includes('user rejected') ||
    lowerMessage.includes('user denied')
  ) {
    return {
      code: ErrorCategory.WALLET,
      message: 'Wallet error. Please reconnect your wallet and try again.',
      retryable: true,
    };
  }

  // Insufficient funds
  if (
    lowerMessage.includes('insufficient') ||
    lowerMessage.includes('balance') ||
    lowerMessage.includes('funds')
  ) {
    return {
      code: ErrorCategory.INSUFFICIENT_FUNDS,
      message: 'Insufficient funds. Please check your balance.',
      retryable: false,
    };
  }

  // Rate limiting
  if (
    lowerMessage.includes('rate limit') ||
    lowerMessage.includes('too many') ||
    lowerMessage.includes('slow down')
  ) {
    return {
      code: ErrorCategory.RATE_LIMITED,
      message: 'Too many requests. Please wait a moment and try again.',
      retryable: true,
    };
  }

  // Bet validation errors
  if (
    lowerMessage.includes('invalid bet') ||
    lowerMessage.includes('minimum') ||
    lowerMessage.includes('maximum') ||
    lowerMessage.includes('validation')
  ) {
    return {
      code: ErrorCategory.BET_INVALID,
      message: sanitizeBetValidationMessage(errorMessage),
      retryable: false,
    };
  }

  // Transaction errors
  if (
    lowerMessage.includes('transaction') ||
    lowerMessage.includes('blockhash') ||
    lowerMessage.includes('simulation failed')
  ) {
    return {
      code: ErrorCategory.TRANSACTION_FAILED,
      message: 'Transaction failed. Please try again.',
      retryable: true,
    };
  }

  // Return sanitized message if it's safe
  if (isSafeMessage(errorMessage)) {
    return {
      code: ErrorCategory.UNKNOWN,
      message: errorMessage,
      retryable: true,
    };
  }

  // Default fallback
  return defaultError;
}

/**
 * Sanitize bet validation messages (keep them as-is if they're user-friendly)
 */
function sanitizeBetValidationMessage(message: string): string {
  // List of safe validation messages
  const safePatterns = [
    /minimum bet/i,
    /maximum bet/i,
    /insufficient balance/i,
    /invalid amount/i,
    /must be greater than/i,
    /must be less than/i,
    /decimal places/i,
    /select heads or tails/i,
    /target must be/i,
  ];

  // If message matches safe patterns, return as-is
  if (safePatterns.some((pattern) => pattern.test(message))) {
    return message;
  }

  // Otherwise, return generic message
  return 'Invalid bet. Please check your input and try again.';
}

/**
 * Check if an error message is safe to display
 * - No file paths
 * - No wallet addresses/keys
 * - No stack traces
 * - No internal variable names
 */
function isSafeMessage(message: string): boolean {
  // Patterns that indicate unsafe content
  const unsafePatterns = [
    /[\/\\].*\.(ts|tsx|js|jsx)/i, // File paths
    /at\s+\w+\s+\(/i, // Stack trace
    /[A-HJ-NP-Z1-9]{32,44}/, // Solana addresses
    /0x[0-9a-f]{40}/i, // Ethereum-style addresses
    /\w+Error:/i, // Error type names
    /node_modules/i,
    /src[\/\\]/i,
    /localhost:\d+/i,
    /127\.0\.0\.1/i,
  ];

  // Check for unsafe patterns
  if (unsafePatterns.some((pattern) => pattern.test(message))) {
    return false;
  }

  // Check message length (too long = probably internal error)
  if (message.length > 200) {
    return false;
  }

  return true;
}

/**
 * Format error for display in toast/UI
 */
export function formatErrorForDisplay(error: UserFacingError): string {
  return error.message;
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: UserFacingError): boolean {
  return error.retryable;
}

/**
 * Log error to monitoring service (placeholder for future implementation)
 */
export function logErrorToMonitoring(
  error: unknown,
  context?: Record<string, unknown>
): void {
  // In production, this would send to a monitoring service like Sentry
  if (process.env.NODE_ENV === 'production') {
    console.error('Error logged to monitoring:', {
      error,
      context,
      timestamp: new Date().toISOString(),
    });
  }
}
