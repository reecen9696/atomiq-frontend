/**
 * Transaction Replay Protection
 * Prevent duplicate bet submissions
 */

interface PendingBet {
  betId: string;
  timestamp: number;
}

interface CompletedBet {
  betId: string;
  timestamp: number;
}

export class TransactionGuard {
  private pendingBets: Map<string, PendingBet> = new Map();
  private completedBets: Map<string, CompletedBet> = new Map();
  
  // Configuration
  private readonly MAX_COMPLETED_HISTORY = 100; // Track last 100 completed bets
  private readonly AUTO_CLEANUP_MS = 5 * 60 * 1000; // 5 minutes
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start auto-cleanup interval
    this.startAutoCleanup();
  }

  /**
   * Check if a bet ID is currently pending
   */
  isPending(betId: string): boolean {
    return this.pendingBets.has(betId);
  }

  /**
   * Check if a bet ID was recently completed (replay protection)
   */
  isCompleted(betId: string): boolean {
    return this.completedBets.has(betId);
  }

  /**
   * Mark a bet as pending (in-flight)
   * Returns false if the bet is already pending or completed (replay attempt)
   */
  markPending(betId: string): boolean {
    // Check if already pending
    if (this.isPending(betId)) {
      console.warn('Replay attempt detected: Bet already pending', betId);
      return false;
    }

    // Check if recently completed
    if (this.isCompleted(betId)) {
      console.warn('Replay attempt detected: Bet already completed', betId);
      return false;
    }

    // Mark as pending
    this.pendingBets.set(betId, {
      betId,
      timestamp: Date.now(),
    });

    return true;
  }

  /**
   * Mark a bet as completed successfully
   */
  markCompleted(betId: string): void {
    // Remove from pending
    this.pendingBets.delete(betId);

    // Add to completed history
    this.completedBets.set(betId, {
      betId,
      timestamp: Date.now(),
    });

    // Trim completed history if needed
    this.trimCompletedHistory();
  }

  /**
   * Mark a bet as failed (remove from pending, don't add to completed)
   */
  markFailed(betId: string): void {
    this.pendingBets.delete(betId);
  }

  /**
   * Clear all pending and completed bets
   */
  clear(): void {
    this.pendingBets.clear();
    this.completedBets.clear();
  }

  /**
   * Get status for debugging
   */
  getStatus() {
    return {
      pendingBets: this.pendingBets.size,
      completedBets: this.completedBets.size,
      oldestPending: this.getOldestPendingAge(),
      oldestCompleted: this.getOldestCompletedAge(),
    };
  }

  /**
   * Trim completed bet history to MAX_COMPLETED_HISTORY
   */
  private trimCompletedHistory(): void {
    if (this.completedBets.size <= this.MAX_COMPLETED_HISTORY) {
      return;
    }

    // Convert to array, sort by timestamp, keep newest
    const bets = Array.from(this.completedBets.values());
    bets.sort((a, b) => b.timestamp - a.timestamp);
    
    // Keep only the newest MAX_COMPLETED_HISTORY bets
    const toKeep = bets.slice(0, this.MAX_COMPLETED_HISTORY);
    
    // Rebuild the map
    this.completedBets.clear();
    toKeep.forEach(bet => {
      this.completedBets.set(bet.betId, bet);
    });
  }

  /**
   * Auto-cleanup old bets
   */
  private startAutoCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000); // Run cleanup every minute
  }

  /**
   * Cleanup bets older than AUTO_CLEANUP_MS
   */
  private cleanup(): void {
    const now = Date.now();
    const cutoffTime = now - this.AUTO_CLEANUP_MS;

    // Cleanup pending bets
    for (const [betId, bet] of this.pendingBets.entries()) {
      if (bet.timestamp < cutoffTime) {
        console.warn('Auto-cleanup: Removing stale pending bet', betId);
        this.pendingBets.delete(betId);
      }
    }

    // Cleanup completed bets
    for (const [betId, bet] of this.completedBets.entries()) {
      if (bet.timestamp < cutoffTime) {
        this.completedBets.delete(betId);
      }
    }
  }

  /**
   * Stop auto-cleanup (for cleanup on unmount)
   */
  stopAutoCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Get age of oldest pending bet in ms
   */
  private getOldestPendingAge(): number | null {
    if (this.pendingBets.size === 0) return null;
    
    const now = Date.now();
    let oldest = Infinity;
    
    for (const bet of this.pendingBets.values()) {
      const age = now - bet.timestamp;
      if (age < oldest) {
        oldest = age;
      }
    }
    
    return oldest === Infinity ? null : oldest;
  }

  /**
   * Get age of oldest completed bet in ms
   */
  private getOldestCompletedAge(): number | null {
    if (this.completedBets.size === 0) return null;
    
    const now = Date.now();
    let oldest = Infinity;
    
    for (const bet of this.completedBets.values()) {
      const age = now - bet.timestamp;
      if (age < oldest) {
        oldest = age;
      }
    }
    
    return oldest === Infinity ? null : oldest;
  }
}

// Singleton instance for global use
let transactionGuardInstance: TransactionGuard | null = null;

/**
 * Get the global transaction guard instance
 */
export function getTransactionGuard(): TransactionGuard {
  if (!transactionGuardInstance) {
    transactionGuardInstance = new TransactionGuard();
  }
  return transactionGuardInstance;
}

/**
 * Reset the global transaction guard (useful for testing)
 */
export function resetTransactionGuard(): void {
  if (transactionGuardInstance) {
    transactionGuardInstance.stopAutoCleanup();
  }
  transactionGuardInstance = null;
}
