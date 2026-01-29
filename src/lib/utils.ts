import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS classes
 * Combines clsx for conditional logic and tailwind-merge for deduplication
 *
 * @param inputs - Array of class values (strings, objects, arrays)
 * @returns Merged and deduplicated class string
 *
 * @example
 * cn('p-4', 'text-red-500', { 'bg-blue-500': isActive })
 * cn('p-4 p-2') // Returns 'p-2' (tailwind-merge deduplicates)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as currency with SOL symbol
 */
export function formatSOL(amount: number, decimals = 3): string {
  return `${amount.toFixed(decimals)} SOL`;
}

/**
 * Format an address for display (truncated)
 */
export function formatAddress(address: string, chars = 6): string {
  if (address.length <= chars * 2) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/**
 * Format timestamp to localized time string
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleTimeString();
}

/**
 * Sleep utility for delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
