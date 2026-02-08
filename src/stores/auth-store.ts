import { create } from "zustand";
import { persist } from "zustand/middleware";

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
      connect: (publicKey: string) =>
        set({
          isConnected: true,
          user: { publicKey },
          isConnecting: false,
          // Don't close modal on connect - let onboarding flow handle it
        }),
      disconnect: () =>
        set({
          isConnected: false,
          user: null,
          isConnecting: false,
          isWalletModalOpen: false,
        }),
      updateBalance: (balance: number) =>
        set((state) => ({
          user: state.user ? { ...state.user, balance } : null,
        })),
      updateVaultInfo: (vaultAddress: string, vaultBalance: number) =>
        set((state) => ({
          user: state.user
            ? {
                ...state.user,
                vaultAddress,
                vaultBalance,
                hasVault: true,
              }
            : null,
        })),
      revertBetAmount: (amount: number) =>
        set((state) => ({
          user: state.user
            ? {
                ...state.user,
                vaultBalance: (state.user.vaultBalance || 0) - amount,
              }
            : null,
        })),
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
