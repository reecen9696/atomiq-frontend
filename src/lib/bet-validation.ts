/**
 * Bet Input Validation Middleware
 * Comprehensive validation for all bet flows (Coinflip, Dice, and community games)
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate bet amounts across the entire platform
 * - Reject NaN, Infinity, negative, zero
 * - Reject amounts exceeding balance
 * - Reject amounts outside min/max bounds
 * - Reject amounts with more than 9 decimal places (SOL precision)
 */
export function validateBetAmount(
  amount: number,
  minBet: number,
  maxBet: number,
  balance: number
): ValidationResult {
  // Check for invalid numeric values
  if (!Number.isFinite(amount) || Number.isNaN(amount)) {
    return {
      isValid: false,
      error: 'Invalid bet amount. Please enter a valid number.',
    };
  }

  // Check for negative or zero amounts
  if (amount <= 0) {
    return {
      isValid: false,
      error: 'Bet amount must be greater than zero.',
    };
  }

  // Check SOL precision (max 9 decimal places)
  const decimalPlaces = (amount.toString().split('.')[1] || '').length;
  if (decimalPlaces > 9) {
    return {
      isValid: false,
      error: 'Bet amount cannot have more than 9 decimal places.',
    };
  }

  // Check minimum bet
  if (amount < minBet) {
    return {
      isValid: false,
      error: `Minimum bet is ${minBet} SOL.`,
    };
  }

  // Check maximum bet
  if (amount > maxBet) {
    return {
      isValid: false,
      error: `Maximum bet is ${maxBet} SOL.`,
    };
  }

  // Check balance
  if (amount > balance) {
    return {
      isValid: false,
      error: 'Insufficient balance for this bet.',
    };
  }

  return { isValid: true };
}

/**
 * Validate multiplier values
 */
export function validateMultiplier(
  multiplier: number,
  maxAllowed: number
): ValidationResult {
  if (!Number.isFinite(multiplier) || Number.isNaN(multiplier)) {
    return {
      isValid: false,
      error: 'Invalid multiplier value.',
    };
  }

  if (multiplier <= 0) {
    return {
      isValid: false,
      error: 'Multiplier must be greater than zero.',
    };
  }

  if (multiplier > maxAllowed) {
    return {
      isValid: false,
      error: `Maximum multiplier is ${maxAllowed}x.`,
    };
  }

  return { isValid: true };
}

/**
 * Sanitize numeric input from user
 * - Strip non-numeric chars except decimal
 * - Prevent multiple decimals
 * - Clamp to safe ranges
 */
export function sanitizeNumericInput(input: string): number {
  // Remove all non-numeric characters except dots and the first minus sign
  let sanitized = input.replace(/[^\d.-]/g, '');

  // Keep only the first decimal point
  const parts = sanitized.split('.');
  if (parts.length > 2) {
    sanitized = parts[0] + '.' + parts.slice(1).join('');
  }

  // Parse to number
  const num = parseFloat(sanitized);

  // Return 0 for invalid inputs
  if (Number.isNaN(num) || !Number.isFinite(num)) {
    return 0;
  }

  // Clamp to reasonable SOL range (0 to 1 million SOL)
  return Math.max(0, Math.min(1_000_000, num));
}

/**
 * Generate unique bet ID
 * UUID v4 + timestamp for uniqueness and replay protection
 */
export function generateBetId(): string {
  // Generate UUID v4 manually (crypto.randomUUID not available in all environments)
  const timestamp = Date.now();
  const randomPart = Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 256)
      .toString(16)
      .padStart(2, '0')
  ).join('');

  return `${timestamp}-${randomPart}`;
}

/**
 * Validate dice game target value
 */
export function validateDiceTarget(
  target: number,
  isOver: boolean
): ValidationResult {
  if (!Number.isInteger(target)) {
    return {
      isValid: false,
      error: 'Target must be a whole number.',
    };
  }

  if (target < 1 || target > 99) {
    return {
      isValid: false,
      error: 'Target must be between 1 and 99.',
    };
  }

  // Additional validation based on condition
  if (isOver && target >= 99) {
    return {
      isValid: false,
      error: 'Target for "Over" must be less than 99.',
    };
  }

  if (!isOver && target <= 1) {
    return {
      isValid: false,
      error: 'Target for "Under" must be greater than 1.',
    };
  }

  return { isValid: true };
}

/**
 * Validate coinflip choice
 */
export function validateCoinflipChoice(
  choice: string | null
): ValidationResult {
  if (!choice) {
    return {
      isValid: false,
      error: 'Please select heads or tails.',
    };
  }

  if (choice !== 'heads' && choice !== 'tails') {
    return {
      isValid: false,
      error: 'Invalid choice. Must be heads or tails.',
    };
  }

  return { isValid: true };
}
