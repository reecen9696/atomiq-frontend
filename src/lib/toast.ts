import { toast as sonnerToast } from "sonner";

/**
 * Toast helper utilities
 * Wraps Sonner toast with consistent styling and behavior
 */

export const toast = {
  /**
   * Show a success toast
   */
  success: (message: string, description?: string) => {
    return sonnerToast.success(message, {
      description,
      duration: 4000,
    });
  },

  /**
   * Show an error toast
   */
  error: (message: string, description?: string) => {
    return sonnerToast.error(message, {
      description,
      duration: 5000,
    });
  },

  /**
   * Show an info toast
   */
  info: (message: string, description?: string) => {
    return sonnerToast.info(message, {
      description,
      duration: 4000,
    });
  },

  /**
   * Show a warning toast
   */
  warning: (message: string, description?: string) => {
    return sonnerToast.warning(message, {
      description,
      duration: 4000,
    });
  },

  /**
   * Show a loading toast
   * Returns a function to dismiss the toast
   */
  loading: (message: string, description?: string) => {
    return sonnerToast.loading(message, {
      description,
    });
  },

  /**
   * Show a promise toast that updates based on promise state
   */
  promise: <T>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: Error) => string);
    },
  ) => {
    return sonnerToast.promise(promise, {
      loading,
      success,
      error,
    });
  },

  /**
   * Dismiss a specific toast or all toasts
   */
  dismiss: (toastId?: string | number) => {
    sonnerToast.dismiss(toastId);
  },
};

/**
 * Betting-specific toast helpers
 */
export const bettingToast = {
  /**
   * Show toast when placing a bet
   */
  placingBet: (choice: "heads" | "tails", amount: number) => {
    return toast.loading(
      `Placing ${amount} SOL bet on ${choice}...`,
      "Waiting for game result",
    );
  },

  /**
   * Show toast when bet wins
   */
  betWon: (amount: number, outcome: string) => {
    return toast.success(`🎉 You won ${amount} SOL!`, `Outcome: ${outcome}`);
  },

  /**
   * Show toast when bet loses
   */
  betLost: (amount: number, outcome: string) => {
    return toast.error(`You lost ${amount} SOL`, `Outcome: ${outcome}`);
  },

  /**
   * Show toast when settlement is pending
   */
  settlementPending: () => {
    return toast.info(
      "Settlement in progress",
      "Your balance will update shortly (~13s)",
    );
  },

  /**
   * Show toast when settlement completes
   */
  settlementComplete: () => {
    return toast.success(
      "Settlement complete",
      "Your balance has been updated",
    );
  },

  /**
   * Show toast when settlement fails
   */
  settlementFailed: (amount: number, errorMessage: string, isPermanent: boolean) => {
    const title = isPermanent 
      ? "❌ Settlement failed permanently" 
      : "⚠️ Settlement failed (retrying)";
    const description = `Reverted ${amount} SOL bet. ${errorMessage}`;
    
    if (isPermanent) {
      return toast.error(title, description);
    } else {
      return toast.warning(title, description);
    }
  },

  /**
   * Show toast when settlement error is resolved
   */
  settlementRetrySucceeded: (amount: number) => {
    return toast.success(
      "✅ Settlement retry succeeded",
      `${amount} SOL bet processed successfully`
    );
  },
};

/**
 * Wallet-specific toast helpers
 */
export const walletToast = {
  /**
   * Show toast when wallet connects
   */
  connected: (walletName: string) => {
    return toast.success("Wallet connected", `Connected to ${walletName}`);
  },

  /**
   * Show toast when wallet disconnects
   */
  disconnected: () => {
    return toast.info("Wallet disconnected");
  },

  /**
   * Show toast for transaction confirmation
   */
  transactionSent: (signature: string) => {
    return toast.success(
      "Transaction sent",
      `Signature: ${signature.slice(0, 8)}...`,
    );
  },

  /**
   * Show toast for transaction error
   */
  transactionError: (error: string) => {
    return toast.error("Transaction failed", error);
  },

  /**
   * Show toast for insufficient balance
   */
  insufficientBalance: () => {
    return toast.warning(
      "Insufficient balance",
      "Please deposit more SOL to continue",
    );
  },
};
