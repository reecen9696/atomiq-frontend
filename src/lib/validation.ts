/**
 * Validation Utilities
 * Common validation functions and schemas
 */

import { z } from "zod";

// Common validation schemas
export const emailSchema = z.string().email("Invalid email address");
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export const walletAddressSchema = z
  .string()
  .regex(/^[A-HJ-NP-Z1-9]{32,44}$/, "Invalid Solana wallet address");

export const amountSchema = z
  .number()
  .positive("Amount must be positive")
  .finite("Amount must be finite");

// Validation utility functions
export function isValidEmail(email: string): boolean {
  return emailSchema.safeParse(email).success;
}

export function isValidWalletAddress(address: string): boolean {
  return walletAddressSchema.safeParse(address).success;
}

export function isValidAmount(amount: number): boolean {
  return amountSchema.safeParse(amount).success;
}

// Form validation helpers
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateForm<T extends Record<string, unknown>>(
  data: T,
  schema: z.ZodSchema<T>,
): ValidationResult {
  const result = schema.safeParse(data);

  if (result.success) {
    return { isValid: true, errors: {} };
  }

  const errors: Record<string, string> = {};
  result.error.issues.forEach((issue) => {
    const path = issue.path.join(".");
    errors[path] = issue.message;
  });

  return { isValid: false, errors };
}

// Sanitization helpers
export function sanitizeHtml(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/\s+/g, " ");
}
