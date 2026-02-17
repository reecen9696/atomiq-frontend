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
      version: 2, // Increment version to force migration from old storage format
      // Only persist connection status and publicKey, NOT balances
      // Balances must always be fetched fresh from blockchain
      partialize: (state) => ({
        isConnected: state.isConnected,
        user: state.user
          ? {
              publicKey: state.user.publicKey,
              // Do NOT persist balance, vaultBalance, vaultAddress, or hasVault
              // These must be fetched fresh on every page load
            }
          : null,
      }),
      // Merge function to control what gets loaded from localStorage
      // This prevents old balance data from being loaded into the store
      merge: (persistedState: any, currentState: AuthState) => {
        // Only restore connection status and publicKey
        // Never restore balance fields even if they exist in old storage
        if (persistedState && typeof persistedState === 'object') {
          return {
            ...currentState,
            isConnected: persistedState.isConnected ?? currentState.isConnected,
            user: persistedState.user
              ? {
                  publicKey: persistedState.user.publicKey,
                  // Explicitly exclude all balance-related fields
                  // Even if they exist in old localStorage, don't load them
                }
              : currentState.user,
          };
        }
        return currentState;
      },
      // Migration function to handle version updates
      migrate: (persistedState: any, version: number) => {
        // If migrating from version 0 or 1, remove balance fields
        if (version < 2) {
          if (persistedState?.user) {
            const { balance, vaultBalance, vaultAddress, hasVault, ...cleanUser } = persistedState.user;
            persistedState.user = cleanUser;
          }
        }
        return persistedState;
      },
    },
  ),
);
