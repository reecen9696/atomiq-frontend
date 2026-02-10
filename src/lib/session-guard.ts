/**
 * Wallet Session Timeout Guard
 * Auto-disconnect wallet after period of inactivity
 */

export interface SessionGuardConfig {
  timeoutMs: number; // Auto-disconnect after this many ms of inactivity
  warningMs: number; // Show warning this many ms before timeout
  activityThrottleMs: number; // Throttle activity resets to this interval
}

export class SessionGuard {
  private lastActivityTime: number = Date.now();
  private timeoutTimer: NodeJS.Timeout | null = null;
  private warningTimer: NodeJS.Timeout | null = null;
  private isMonitoring = false;
  
  // Callbacks
  private onTimeoutCallback: (() => void) | null = null;
  private onWarningCallback: (() => void) | null = null;

  // Configuration (30 min default timeout, 25 min warning, 1s throttle)
  private config: SessionGuardConfig = {
    timeoutMs: 30 * 60 * 1000, // 30 minutes
    warningMs: 25 * 60 * 1000, // 25 minutes
    activityThrottleMs: 1000, // 1 second
  };

  constructor(config?: Partial<SessionGuardConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  /**
   * Start monitoring user activity
   */
  startMonitoring(): void {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    this.lastActivityTime = Date.now();
    this.scheduleTimers();

    // Add activity listeners if in browser
    if (typeof window !== 'undefined') {
      window.addEventListener('click', this.handleActivity);
      window.addEventListener('keydown', this.handleActivity);
      window.addEventListener('scroll', this.handleActivity);
      window.addEventListener('mousemove', this.handleActivity);
      window.addEventListener('touchstart', this.handleActivity);
    }
  }

  /**
   * Stop monitoring (cleanup)
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;
    this.clearTimers();

    // Remove activity listeners
    if (typeof window !== 'undefined') {
      window.removeEventListener('click', this.handleActivity);
      window.removeEventListener('keydown', this.handleActivity);
      window.removeEventListener('scroll', this.handleActivity);
      window.removeEventListener('mousemove', this.handleActivity);
      window.removeEventListener('touchstart', this.handleActivity);
    }
  }

  /**
   * Reset activity timer (called on bet placement or any interaction)
   */
  resetActivity(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.lastActivityTime = Date.now();
    this.clearTimers();
    this.scheduleTimers();
  }

  /**
   * Set callback for timeout event
   */
  onTimeout(callback: () => void): void {
    this.onTimeoutCallback = callback;
  }

  /**
   * Set callback for warning event
   */
  onWarning(callback: () => void): void {
    this.onWarningCallback = callback;
  }

  /**
   * Get time until timeout in ms
   */
  getTimeUntilTimeout(): number {
    const elapsed = Date.now() - this.lastActivityTime;
    const remaining = this.config.timeoutMs - elapsed;
    return Math.max(0, remaining);
  }

  /**
   * Get time until warning in ms
   */
  getTimeUntilWarning(): number {
    const elapsed = Date.now() - this.lastActivityTime;
    const remaining = this.config.warningMs - elapsed;
    return Math.max(0, remaining);
  }

  /**
   * Check if session is still active
   */
  isActive(): boolean {
    return this.isMonitoring && this.getTimeUntilTimeout() > 0;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<SessionGuardConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (this.isMonitoring) {
      this.clearTimers();
      this.scheduleTimers();
    }
  }

  /**
   * Handle user activity
   */
  private handleActivity = (): void => {
    // Throttle activity resets (max once per config interval)
    const now = Date.now();
    if (now - this.lastActivityTime < this.config.activityThrottleMs) {
      return;
    }

    this.resetActivity();
  };

  /**
   * Schedule warning and timeout timers
   */
  private scheduleTimers(): void {
    // Schedule warning timer
    const timeUntilWarning = this.getTimeUntilWarning();
    if (timeUntilWarning > 0) {
      this.warningTimer = setTimeout(() => {
        if (this.onWarningCallback) {
          this.onWarningCallback();
        }
      }, timeUntilWarning);
    }

    // Schedule timeout timer
    const timeUntilTimeout = this.getTimeUntilTimeout();
    if (timeUntilTimeout > 0) {
      this.timeoutTimer = setTimeout(() => {
        if (this.onTimeoutCallback) {
          this.onTimeoutCallback();
        }
        this.stopMonitoring();
      }, timeUntilTimeout);
    }
  }

  /**
   * Clear all timers
   */
  private clearTimers(): void {
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }
  }
}

// Singleton instance for global use
let sessionGuardInstance: SessionGuard | null = null;

/**
 * Get the global session guard instance
 */
export function getSessionGuard(): SessionGuard {
  if (!sessionGuardInstance) {
    sessionGuardInstance = new SessionGuard();
  }
  return sessionGuardInstance;
}

/**
 * Reset the global session guard (useful for testing)
 */
export function resetSessionGuard(): void {
  if (sessionGuardInstance) {
    sessionGuardInstance.stopMonitoring();
  }
  sessionGuardInstance = null;
}
