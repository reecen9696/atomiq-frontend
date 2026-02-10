import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getSessionGuard } from "@/lib/session-guard";
import { toast } from "@/lib/toast";

interface User {
  publicKey: string;
  balance?: number;
  vaultAddress?: string;
  vaultBalance?: number;
  hasVault?: boolean;
  // Add other user properties as needed
}

interface AuthState {
  isConnected: boolean;
  user: User | null;
  isConnecting: boolean;
  isWalletModalOpen: boolean;
  connect: (publicKey: string) => void;
  disconnect: () => void;
  updateBalance: (balance: number) => void;
  updateVaultInfo: (vaultAddress: string, vaultBalance: number) => void;
  revertBetAmount: (amount: number) => void;
  setConnecting: (connecting: boolean) => void;
  openWalletModal: () => void;
  closeWalletModal: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isConnected: false,
      user: null,
      isConnecting: false,
      isWalletModalOpen: false,
      connect: (publicKey: string) => {
        // Start session monitoring on connect
        const sessionGuard = getSessionGuard();
        
        // Setup session timeout handler
        sessionGuard.onTimeout(() => {
          console.log('Session timeout - disconnecting wallet');
          toast.warning('Session expired', 'Your wallet has been disconnected due to inactivity');
          get().disconnect();
        });
        
        // Setup warning handler (5 minutes before timeout)
        sessionGuard.onWarning(() => {
          toast.warning('Session expiring soon', 'Your session will expire in 5 minutes due to inactivity');
        });
        
        sessionGuard.startMonitoring();
        
        set({
          isConnected: true,
          user: { publicKey },
          isConnecting: false,
          // Don't close modal on connect - let onboarding flow handle it
        });
      },
      disconnect: () => {
        // Stop session monitoring on disconnect
        const sessionGuard = getSessionGuard();
        sessionGuard.stopMonitoring();
        
        set({
          isConnected: false,
          user: null,
          isConnecting: false,
          isWalletModalOpen: false,
        });
      },
      updateBalance: (balance: number) => {
        // Reset activity on balance update (indicates user action)
        const sessionGuard = getSessionGuard();
        if (get().isConnected) {
          sessionGuard.resetActivity();
        }
        
        set((state) => ({
          user: state.user ? { ...state.user, balance } : null,
        }));
      },
      updateVaultInfo: (vaultAddress: string, vaultBalance: number) => {
        // Reset activity on vault update (indicates user action)
        const sessionGuard = getSessionGuard();
        if (get().isConnected) {
          sessionGuard.resetActivity();
        }
        
        // Negative balance protection
        const safeBalance = Math.max(0, vaultBalance);
        if (vaultBalance < 0) {
          console.warn('Negative balance detected, clamping to 0');
        }
        
        set((state) => ({
          user: state.user
            ? {
                ...state.user,
                vaultAddress,
                vaultBalance: safeBalance,
                hasVault: true,
              }
            : null,
        }));
      },
      revertBetAmount: (amount: number) => {
        // Reset activity on bet revert (indicates user action)
        const sessionGuard = getSessionGuard();
        if (get().isConnected) {
          sessionGuard.resetActivity();
        }
        
        // Revert means adding back the amount that was deducted
        set((state) => ({
          user: state.user
            ? {
                ...state.user,
                vaultBalance: Math.max(0, (state.user.vaultBalance || 0) + amount),
              }
            : null,
        }));
      },
      setConnecting: (isConnecting: boolean) => set({ isConnecting }),
      openWalletModal: () => set({ isWalletModalOpen: true }),
      closeWalletModal: () => set({ isWalletModalOpen: false }),
    }),
    {
      name: "auth-storage",
      // Persist user session across page refreshes
      partialize: (state) => ({
        isConnected: state.isConnected,
        user: state.user,
      }),
    },
  ),
);
