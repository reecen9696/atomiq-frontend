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
 * Format SOL amount for display with proper decimals and commas
 * @example formatSOL(1.23456789) => "1.235"
 * @example formatSOL(0.001) => "0.001"
 * @example formatSOL(1234.56) => "1,234.560"
 * @example formatSOL(1.5, 2) => "1.50"
 */
export function formatSOL(amount: number | string, decimals = 3): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;

  if (isNaN(num)) return "0.000";

  // For very small amounts, show more precision
  if (num > 0 && num < 0.001) {
    return num.toFixed(6).replace(/\.?0+$/, "");
  }

  // Use Intl for proper number formatting with commas
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * Format SOL amount with symbol
 * @example formatSOLWithSymbol(1.23) => "1.230 SOL"
 */
export function formatSOLWithSymbol(
  amount: number | string,
  decimals = 3,
): string {
  return `${formatSOL(amount, decimals)} SOL`;
}

/**
 * Format an address or hash for display (truncated)
 * @example formatAddress("5Gv8c2R3AbCdEf...") => "5Gv8...EfGh"
 * @example formatAddress("abc123", 6, 4) => "abc123" (no truncation if short)
 */
export function formatAddress(
  address: string,
  startChars = 4,
  endChars = 4,
): string {
  if (!address || address.length <= startChars + endChars) {
    return address || "";
  }
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Format hash for display (blockchain hashes)
 * @example formatHash("abcd1234...") => "abcd1234....4321dcba"
 */
export function formatHash(hash: string, startChars = 8, endChars = 8): string {
  if (!hash || hash.length <= startChars + endChars) {
    return hash || "";
  }
  return `${hash.slice(0, startChars)}....${hash.slice(-endChars)}`;
}

/**
 * Format number with commas for thousands
 * @example formatNumber(1234567) => "1,234,567"
 * @example formatNumber(1234.56, 2) => "1,234.56"
 */
export function formatNumber(value: number | string, decimals = 0): string {
  const num = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(num)) return "0";

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * Format percentage
 * @example formatPercentage(95.6789) => "95.68%"
 */
export function formatPercentage(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format timestamp to relative time
 * @example formatTimeAgo(Date.now() - 5000) => "5 seconds ago"
 * @example formatTimeAgo(Date.now() - 60000) => "1 minute ago"
 */
export function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return `${seconds} second${seconds !== 1 ? "s" : ""} ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? "s" : ""} ago`;
}

/**
 * Format timestamp to localized time string
 * @deprecated Use formatTimeAgo for relative time or Date methods for absolute time
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleTimeString();
}

/**
 * Sleep utility for delays
 * @example await sleep(1000) // Wait 1 second
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Converts a string to a URL-friendly slug
 * @example slugify("Coin Flip Game") => "coin-flip-game"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");
}

/**
 * Converts a slug to a formatted title
 * @example unslugify("coin-flip-game") => "Coin Flip Game"
 */
export function unslugify(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Clamp a number between min and max values
 * @example clamp(5, 0, 10) => 5
 * @example clamp(-5, 0, 10) => 0
 * @example clamp(15, 0, 10) => 10
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Debounce a function call
 * @example const debouncedSearch = debounce(search, 300)
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
