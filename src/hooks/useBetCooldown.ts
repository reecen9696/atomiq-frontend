import { useRef, useCallback, useState } from "react";

/**
 * Enforces a minimum interval between bet submissions to prevent
 * hitting backend rate limits when spamming the play button.
 *
 * @param minIntervalMs - Minimum milliseconds between bets (default 500ms)
 * @returns { canBet, recordBet, cooldownRemaining }
 */
export function useBetCooldown(minIntervalMs = 500) {
  const lastBetTimeRef = useRef<number>(0);
  const [cooldownActive, setCooldownActive] = useState(false);

  const canBet = useCallback((): boolean => {
    const now = Date.now();
    return now - lastBetTimeRef.current >= minIntervalMs;
  }, [minIntervalMs]);

  const recordBet = useCallback(() => {
    lastBetTimeRef.current = Date.now();
    setCooldownActive(true);
    setTimeout(() => setCooldownActive(false), minIntervalMs);
  }, [minIntervalMs]);

  const cooldownRemaining = useCallback((): number => {
    const elapsed = Date.now() - lastBetTimeRef.current;
    return Math.max(0, minIntervalMs - elapsed);
  }, [minIntervalMs]);

  return { canBet, recordBet, cooldownActive, cooldownRemaining };
}
