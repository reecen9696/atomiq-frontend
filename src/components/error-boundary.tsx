"use client";

import React, { type ErrorInfo, type ReactNode } from "react";
import {
  errorHandler,
  type AppError,
  ErrorSeverity,
} from "@/lib/error-handling";
import { config } from "@/config";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: AppError, errorInfo: ErrorInfo) => void;
  level?: "page" | "section" | "component";
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: AppError;
  errorInfo?: ErrorInfo;
}

/**
 * Enhanced Error Boundary Component
 * Catches errors in child components and provides graceful fallback UI
 * Integrates with the application's error handling system
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Convert to AppError for consistent handling
    const appError = errorHandler.handle(error, {
      source: "error-boundary",
      timestamp: Date.now(),
    });

    return {
      hasError: true,
      error: appError,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const appError = errorHandler.handle(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: this.props.level || "component",
      retryCount: this.retryCount,
    });

    this.setState({
      error: appError,
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(appError, errorInfo);
    }

    // Log additional context in development
    if (config.features.enableDevtools) {
      console.group("🚨 Error Boundary Caught Error");
      console.error("Error:", error);
      console.error("Error Info:", errorInfo);
      console.error("App Error:", appError.toJSON());
      console.groupEnd();
    }
  }

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
      });
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private renderErrorUI = () => {
    const { error } = this.state;
    const { level = "component" } = this.props;

    // Different UI based on error severity and boundary level
    if (error?.severity === ErrorSeverity.CRITICAL || level === "page") {
      return (
        <div className="flex items-center justify-center min-h-screen bg-casino-bg p-8">
          <div className="text-center max-w-md">
            <div className="mb-6">
              <div className="w-16 h-16 bg-red-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-white text-2xl">⚠️</span>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Something went wrong
              </h1>
              <p className="text-white/70 mb-6">
                {error?.userMessage ||
                  "We're sorry, but something unexpected happened."}
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={this.handleReload}
                className="w-full px-6 py-3 bg-primary-purple hover:bg-primary-purple-hover text-white rounded-lg transition-colors"
              >
                Reload Page
              </button>

              {config.features.enableDevtools && error && (
                <details className="text-left text-xs text-white/60">
                  <summary className="cursor-pointer hover:text-white/80">
                    Error Details (Dev)
                  </summary>
                  <pre className="mt-2 p-3 bg-black/30 rounded overflow-auto">
                    {JSON.stringify(error.toJSON(), null, 2)}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Inline error for sections/components
    return (
      <div className="border border-red-500/20 bg-red-500/5 rounded-lg p-4 m-2">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shrink-0">
            <span className="text-white text-sm">⚠️</span>
          </div>
          <div>
            <h3 className="text-red-400 font-medium text-sm">
              Component Error
            </h3>
            <p className="text-red-300/80 text-xs">
              {error?.userMessage || "This section couldn't load properly."}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {this.retryCount < this.maxRetries && (
            <button
              onClick={this.handleRetry}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
            >
              Retry ({this.maxRetries - this.retryCount} left)
            </button>
          )}

          <button
            onClick={this.handleReload}
            className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return this.renderErrorUI();
    }

    return this.props.children;
  }
}
