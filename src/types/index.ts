/**
 * Centralized Type Definitions
 * All application types exported from this barrel file
 */

// Re-export existing types
export type { Winner } from "./winner";
export type { StatCard } from "./stat-card";

// Common UI types
export interface BaseProps {
  className?: string;
  children?: React.ReactNode;
}

export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
}

// API Response types
export interface ApiResponse<T = unknown> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T = unknown> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Form types
export interface FormField<T = string> {
  value: T;
  error?: string;
  touched?: boolean;
  required?: boolean;
}

// Navigation types
export interface NavigationItem {
  key: string;
  label: string;
  href?: string;
  icon?: React.ComponentType;
  disabled?: boolean;
}

// Theme types
export type ThemeMode = "light" | "dark" | "system";
export type Size = "sm" | "md" | "lg" | "xl";
export type Variant =
  | "default"
  | "primary"
  | "secondary"
  | "danger"
  | "warning"
  | "success";

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
