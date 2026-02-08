/**
 * Game Utilities
 * Helper functions for game-related operations
 */

/**
 * Converts a game title to a URL-friendly slug
 * @example slugify("Coin Flip") => "coin-flip"
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
 * @example unslugify("coin-flip") => "Coin Flip"
 */
export function unslugify(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Get the full route path for a game
 * @example getGameRoute("coinflip") => "/casino/coinflip"
 */
export function getGameRoute(slug: string): string {
  return `/casino/${slug}`;
}

/**
 * Format SOL amount for display
 * @example formatSOL(1.23456789) => "1.23"
 * @example formatSOL(0.001) => "0.001"
 * @example formatSOL(1234.56) => "1,234.56"
 */
export function formatSOL(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  
  if (isNaN(num)) return "0.00";
  
  // For small amounts, show more decimal places
  if (num < 0.01) {
    return num.toFixed(6).replace(/\.?0+$/, "");
  }
  
  // For normal amounts, show 2 decimal places with commas
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Truncate an address or hash for display
 * @example formatAddress("5Gv8...qwer") => "5Gv8...qwer" (no change if already short)
 * @example formatAddress("5Gv8c2R3...") => "5Gv8...R3..." (truncate long addresses)
 */
export function formatAddress(
  address: string,
  startChars: number = 4,
  endChars: number = 4
): string {
  if (address.length <= startChars + endChars) {
    return address;
  }
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
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
 * Validate bet amount is within acceptable range
 */
export function validateBetAmount(
  amount: number,
  min: number,
  max: number
): { valid: boolean; error?: string } {
  if (isNaN(amount) || amount <= 0) {
    return { valid: false, error: "Bet amount must be greater than 0" };
  }
  
  if (amount < min) {
    return { valid: false, error: `Minimum bet is ${min} SOL` };
  }
  
  if (amount > max) {
    return { valid: false, error: `Maximum bet is ${max} SOL` };
  }
  
  return { valid: true };
}
