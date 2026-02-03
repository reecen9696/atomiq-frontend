import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export interface PendingBet {
  gameId: string;
  transactionId?: number;
  amount: number;
  choice: "heads" | "tails";
  timestamp: number;
  playerAddress: string;
}

interface BetTrackingState {
  pendingBets: Map<string, PendingBet>;
  addPendingBet: (bet: PendingBet) => void;
  updateBetTransactionId: (gameId: string, transactionId: number) => void;
  removePendingBet: (gameId: string) => void;
  getPendingBetByTransactionId: (transactionId: number) => PendingBet | undefined;
  cleanupOldBets: () => void;
}

export const useBetTrackingStore = create<BetTrackingState>()(
  subscribeWithSelector((set, get) => ({
    pendingBets: new Map(),

    addPendingBet: (bet) =>
      set((state) => {
        const newPendingBets = new Map(state.pendingBets);
        newPendingBets.set(bet.gameId, bet);
        return { pendingBets: newPendingBets };
      }),

    updateBetTransactionId: (gameId, transactionId) =>
      set((state) => {
        const newPendingBets = new Map(state.pendingBets);
        const bet = newPendingBets.get(gameId);
        if (bet) {
          newPendingBets.set(gameId, { ...bet, transactionId });
        }
        return { pendingBets: newPendingBets };
      }),

    removePendingBet: (gameId) =>
      set((state) => {
        const newPendingBets = new Map(state.pendingBets);
        newPendingBets.delete(gameId);
        return { pendingBets: newPendingBets };
      }),

    getPendingBetByTransactionId: (transactionId) => {
      const bets = get().pendingBets;
      for (const bet of bets.values()) {
        if (bet.transactionId === transactionId) {
          return bet;
        }
      }
      return undefined;
    },

    cleanupOldBets: () =>
      set((state) => {
        const newPendingBets = new Map(state.pendingBets);
        const now = Date.now();
        const maxAge = 5 * 60 * 1000; // 5 minutes

        for (const [gameId, bet] of newPendingBets.entries()) {
          if (now - bet.timestamp > maxAge) {
            newPendingBets.delete(gameId);
          }
        }
        return { pendingBets: newPendingBets };
      }),
  })),
);