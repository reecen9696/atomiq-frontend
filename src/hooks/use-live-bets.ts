"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { env, config } from "@/config";

export interface BetVRFData {
  vrfOutput: string;
  vrfProof: string;
  publicKey: string;
  inputMessage: string;
}

export interface LiveBet {
  id: string;
  txId: string;
  playerAddress: string;
  userDisplay: string;
  gameType: string;
  gameImage: string;
  betAmount: string;
  betAmountRaw: number;
  multiplier: string;
  payout: string;
  payoutRaw: number;
  isWin: boolean;
  timestamp: number;
  blockHeight: number;
  blockHash: string;
  vrf: BetVRFData;
  playerChoice: string;
  coinResult: string;
  allowanceNonce: string;
  token: string;
  solanaExplorerUrl: string | null;
}

function shortenAddress(addr: string): string {
  if (!addr || addr.length < 12) return addr;
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

function lamportsToSol(lamports: number): number {
  return lamports / 1_000_000_000;
}

function calcMultiplier(bet: number, payout: number): string {
  if (bet === 0) return "–";
  return `${(payout / bet).toFixed(2)}x`;
}

function gameTypeToMeta(t: string): { name: string; image: string } {
  switch (t?.toLowerCase()) {
    case "coinflip":
    case "coin_flip":
      return { name: "Coin Flip", image: "/games/coinflip.png" };
    case "dice":
      return { name: "Dice", image: "/games/dice.png" };
    case "plinko":
      return { name: "Plinko", image: "/games/plinko.png" };
    case "slot":
    case "slots":
      return { name: "Slots", image: "/games/slot.png" };
    default:
      return { name: t || "Unknown", image: "/games/coinflip.png" };
  }
}

function transformRecentGame(game: any): LiveBet {
  const meta = gameTypeToMeta(game.game_type);
  const betL: number = game.bet_amount ?? 0;
  const payL: number = game.payout ?? 0;

  return {
    id: game.game_id ?? `tx-${game.tx_id}`,
    txId: String(game.tx_id ?? ""),
    playerAddress: game.player_id ?? "",
    userDisplay: shortenAddress(game.player_id ?? ""),
    gameType: meta.name,
    gameImage: meta.image,
    betAmountRaw: lamportsToSol(betL),
    betAmount: lamportsToSol(betL).toFixed(4),
    multiplier: calcMultiplier(betL, payL),
    payoutRaw: lamportsToSol(payL),
    payout: lamportsToSol(payL).toFixed(4),
    isWin: (game.outcome ?? "").toLowerCase() === "win",
    timestamp: game.timestamp ?? 0,
    blockHeight: game.block_height ?? 0,
    blockHash: game.block_hash ?? "",
    vrf: {
      vrfOutput: game.vrf_output ?? "",
      vrfProof: game.vrf_proof ?? "",
      publicKey: game.vrf_public_key ?? "",
      inputMessage: game.vrf_input_message ?? "",
    },
    playerChoice:
      typeof game.player_choice === "string"
        ? game.player_choice
        : JSON.stringify(game.player_choice ?? ""),
    coinResult: game.coin_result ?? "",
    allowanceNonce: String(game.allowance_nonce ?? ""),
    token: game.token?.symbol ?? "SOL",
    solanaExplorerUrl: game.solana_tx_id
      ? `https://solscan.io/tx/${game.solana_tx_id}?cluster=devnet`
      : null,
  };
}

function transformWsWin(data: any): LiveBet {
  const meta = gameTypeToMeta(data.game_type);
  const amountWon: number = data.amount_won ?? 0;
  return {
    id: `ws-${data.tx_id ?? crypto.randomUUID()}`,
    txId: String(data.tx_id ?? ""),
    playerAddress: data.wallet ?? "",
    userDisplay: shortenAddress(data.wallet ?? ""),
    gameType: meta.name,
    gameImage: meta.image,
    betAmountRaw: 0,
    betAmount: "–",
    multiplier: "–",
    payoutRaw: amountWon,
    payout: amountWon.toFixed(4),
    isWin: true,
    timestamp: data.timestamp ?? Math.floor(Date.now() / 1000),
    blockHeight: data.block_height ?? 0,
    blockHash: "",
    vrf: { vrfOutput: "", vrfProof: "", publicKey: "", inputMessage: "" },
    playerChoice: "",
    coinResult: "",
    allowanceNonce: "",
    token: data.currency ?? "SOL",
    solanaExplorerUrl: null,
  };
}

export function useLiveBets(limit = 20) {
  const [bets, setBets] = useState<LiveBet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const seenIds = useRef<Set<string>>(new Set());

  const addBets = useCallback(
    (incoming: LiveBet[]) => {
      setBets((prev) => {
        const next: LiveBet[] = [];
        for (const bet of incoming) {
          if (!seenIds.current.has(bet.id)) {
            seenIds.current.add(bet.id);
            next.push(bet);
          }
        }
        return [...next, ...prev].slice(0, limit);
      });
    },
    [limit],
  );

  // Initial REST fetch — over-fetch since we filter to on-chain wins only
  useEffect(() => {
    setIsLoading(true);
    seenIds.current.clear();
    fetch(`${config.api.baseUrl}/api/games/recent?limit=${limit * 5}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data) => {
        const transformed: LiveBet[] = (data.games ?? [])
          .map(transformRecentGame)
          .filter((b: LiveBet) => b.isWin && b.solanaExplorerUrl !== null)
          .slice(0, limit);
        transformed.forEach((b) => seenIds.current.add(b.id));
        setBets(transformed);
      })
      .catch(() => {
        // silently degrade — table shows empty state until WS data arrives
      })
      .finally(() => setIsLoading(false));
  }, [limit]);

  // WebSocket subscription for live casino wins
  useEffect(() => {
    if (!env.enableWebSocket) return;

    const wsUrl = config.api.baseUrl
      .replace("http://", "ws://")
      .replace("https://", "wss://");

    const ws = new WebSocket(`${wsUrl}/ws?casino=true`);
    ws.onopen = () => setIsLive(true);
    ws.onclose = () => setIsLive(false);
    ws.onerror = () => setIsLive(false);
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string);
        if (msg.type === "casino_win") {
          const bet = transformWsWin(msg);
          // Only surface once it has an on-chain tx
          if (bet.solanaExplorerUrl) addBets([bet]);
        }
      } catch {
        // ignore malformed messages
      }
    };
    return () => ws.close();
  }, [addBets]);

  return { bets, isLoading, isLive };
}
