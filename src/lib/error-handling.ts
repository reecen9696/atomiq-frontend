/**
 * Enhanced Error Handling Utilities
 * Comprehensive error management for the application
 */

import { env } from "@/config";

// Error types
export enum ErrorCode {
  NETWORK_ERROR = "NETWORK_ERROR",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  AUTH_ERROR = "AUTH_ERROR",
  NOT_FOUND = "NOT_FOUND",
  SERVER_ERROR = "SERVER_ERROR",
  TIMEOUT_ERROR = "TIMEOUT_ERROR",
  WEBSOCKET_ERROR = "WEBSOCKET_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

export enum ErrorSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

// Enhanced error class
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly severity: ErrorSeverity;
  public readonly timestamp: Date;
  public readonly context?: Record<string, unknown>;
  public readonly userMessage?: string;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context?: Record<string, unknown>,
    userMessage?: string,
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.severity = severity;
    this.timestamp = new Date();
    this.context = context;
    this.userMessage = userMessage;

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, AppError.prototype);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      severity: this.severity,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
      stack: this.stack,
    };
  }
}

// Error factories for common scenarios
export const ErrorFactory = {
  network: (message: string, context?: Record<string, unknown>) =>
    new AppError(
      message,
      ErrorCode.NETWORK_ERROR,
      ErrorSeverity.HIGH,
      context,
      "Network connection failed. Please check your internet connection.",
    ),

  validation: (message: string, context?: Record<string, unknown>) =>
    new AppError(
      message,
      ErrorCode.VALIDATION_ERROR,
      ErrorSeverity.LOW,
      context,
      "Please check your input and try again.",
    ),

  auth: (message: string, context?: Record<string, unknown>) =>
    new AppError(
      message,
      ErrorCode.AUTH_ERROR,
      ErrorSeverity.HIGH,
      context,
      "Authentication failed. Please log in again.",
    ),

  notFound: (resource: string, context?: Record<string, unknown>) =>
    new AppError(
      `${resource} not found`,
      ErrorCode.NOT_FOUND,
      ErrorSeverity.MEDIUM,
      context,
      "The requested resource could not be found.",
    ),

  server: (message: string, context?: Record<string, unknown>) =>
    new AppError(
      message,
      ErrorCode.SERVER_ERROR,
      ErrorSeverity.HIGH,
      context,
      "Server error occurred. Please try again later.",
    ),

  timeout: (message: string, context?: Record<string, unknown>) =>
    new AppError(
      message,
      ErrorCode.TIMEOUT_ERROR,
      ErrorSeverity.MEDIUM,
      context,
      "Request timed out. Please try again.",
    ),

  websocket: (message: string, context?: Record<string, unknown>) =>
    new AppError(
      message,
      ErrorCode.WEBSOCKET_ERROR,
      ErrorSeverity.MEDIUM,
      context,
      "Connection lost. Attempting to reconnect...",
    ),
};

// Error handler utility
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorReporter?: (error: AppError) => void;

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  setErrorReporter(reporter: (error: AppError) => void) {
    this.errorReporter = reporter;
  }

  handle(error: unknown, context?: Record<string, unknown>): AppError {
    let appError: AppError;

    if (error instanceof AppError) {
      appError = error;
    } else if (error instanceof Error) {
      appError = new AppError(
        error.message,
        ErrorCode.UNKNOWN_ERROR,
        ErrorSeverity.MEDIUM,
        { originalError: error.name, stack: error.stack, ...context },
      );
    } else {
      appError = new AppError(
        String(error),
        ErrorCode.UNKNOWN_ERROR,
        ErrorSeverity.MEDIUM,
        { originalError: error, ...context },
      );
    }

    // Log error in development
    if (env.nodeEnv === "development") {
      console.error("Error handled:", {
        error: appError.toJSON(),
        context,
      });
    }

    // Report error if reporter is set
    if (this.errorReporter && appError.severity !== ErrorSeverity.LOW) {
      try {
        this.errorReporter(appError);
      } catch (reportError) {
        console.error("Error reporting failed:", reportError);
      }
    }

    return appError;
  }

  // Async error boundary for promises
  async safely<T>(
    promise: Promise<T>,
    context?: Record<string, unknown>,
  ): Promise<[T | null, AppError | null]> {
    try {
      const result = await promise;
      return [result, null];
    } catch (error) {
      return [null, this.handle(error, context)];
    }
  }

  // Synchronous error boundary
  safeSync<T>(
    fn: () => T,
    context?: Record<string, unknown>,
  ): [T | null, AppError | null] {
    try {
      const result = fn();
      return [result, null];
    } catch (error) {
      return [null, this.handle(error, context)];
    }
  }
}

// Global error handler instance
export const errorHandler = ErrorHandler.getInstance();

// React Query error handler
export function handleQueryError(error: unknown): AppError {
  if (error instanceof Response) {
    return ErrorFactory.network(`HTTP ${error.status}: ${error.statusText}`, {
      status: error.status,
      url: error.url,
    });
  }

  return errorHandler.handle(error, { source: "react-query" });
}

// Retry utility with exponential backoff
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelay = 1000,
  context?: Record<string, unknown>,
): Promise<T> {
  let attempt = 1;

  while (attempt <= maxAttempts) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) {
        throw errorHandler.handle(error, {
          ...context,
          attempts: attempt,
          operation: "retry-with-backoff",
        });
      }

      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
      attempt++;
    }
  }

  // This should never be reached, but TypeScript doesn't know that
  throw ErrorFactory.server("Maximum retry attempts exceeded");
}
