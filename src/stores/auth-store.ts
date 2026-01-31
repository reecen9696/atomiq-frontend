import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  publicKey: string;
  balance?: number;
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
      setConnecting: (isConnecting: boolean) => set({ isConnecting }),
      openWalletModal: () => set({ isWalletModalOpen: true }),
      closeWalletModal: () => set({ isWalletModalOpen: false }),
    }),
    {
      name: "auth-storage",
      // Skip hydration from localStorage to always start logged out
      skipHydration: true,
      partialize: (state) => ({
        isConnected: false, // Never persist connected state
        user: null, // Never persist user
      }),
    },
  ),
);
