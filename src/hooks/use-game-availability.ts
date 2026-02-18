"use client";

import { useMemo, useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useBalance } from "./useBalance";

interface PlaySessionData {
  allowancePda: string;
  expiresAt: number;
  nonce: number;
}

function getCachedPlaySession(
  publicKey: string | null,
): PlaySessionData | null {
  if (!publicKey) return null;

  try {
    const key = `atomik:playSession:${publicKey}`;
    const stored = localStorage.getItem(key);
    if (!stored) return null;

    const session = JSON.parse(stored) as PlaySessionData;

    // Check if session has expired
    const now = Math.floor(Date.now() / 1000);
    if (session.expiresAt <= now) {
      return null;
    }

    return session;
  } catch (error) {
    return null;
  }
}

export function useGameAvailability() {
  const { publicKey } = useWallet();
  const { balance } = useBalance();

  // Re-evaluate when a play session is created (custom event from wallet-modal / play-timer-modal)
  const [sessionVersion, setSessionVersion] = useState(0);
  useEffect(() => {
    const handler = () => setSessionVersion((v) => v + 1);
    window.addEventListener("playSessionCreated", handler);
    return () => window.removeEventListener("playSessionCreated", handler);
  }, []);

  const availability = useMemo(() => {
    // Check if wallet is connected
    if (!publicKey) {
      return {
        isAvailable: false,
        reason: "Connect wallet to play",
      };
    }

    // Check for play session
    const playSession = getCachedPlaySession(publicKey.toBase58());
    if (!playSession) {
      return {
        isAvailable: false,
        reason:
          "No active play sessions found. Approve allowance in the settings",
      };
    }

    // Check for sufficient balance (only check if we have a balance value)
    if (balance !== null && balance <= 0) {
      return {
        isAvailable: false,
        reason: "Fund wallet to wager",
      };
    }

    return {
      isAvailable: true,
      reason: null,
    };
  }, [publicKey, balance, sessionVersion]);

  return availability;
}
