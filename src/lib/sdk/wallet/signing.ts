/**
 * Wallet Signature Utilities for ATOMIQ Bet Authentication
 *
 * Implements Phase 4.2 - Frontend Integration
 * Signs bet messages with wallet private key for cryptographic authentication
 */

import type { WalletContextState } from "@solana/wallet-adapter-react";
import { logger } from "@/lib/logger";

/**
 * Bet message structure matching backend BetMessage
 */
export interface BetMessage {
  player_pubkey: string;
  allowance_nonce: number;
  timestamp: number;
  game_type: string;
  bet_amount: number; // In lamports
}

/**
 * Create canonical message string for signing
 * Must match backend format in wallet_auth.rs BetMessage::to_signable_string()
 */
export function createSignableMessage(message: BetMessage): string {
  return (
    `ATOMIQ Bet\n` +
    `Player: ${message.player_pubkey}\n` +
    `Nonce: ${message.allowance_nonce}\n` +
    `Timestamp: ${message.timestamp}\n` +
    `Game: ${message.game_type}\n` +
    `Amount: ${message.bet_amount}`
  );
}

/**
 * Sign a bet message with the connected wallet
 *
 * @param wallet - Wallet adapter from useWallet()
 * @param message - Bet message to sign
 * @returns Base58 encoded signature string
 * @throws Error if wallet doesn't support message signing or signing fails
 */
export async function signBetMessage(
  wallet: WalletContextState,
  message: BetMessage,
): Promise<string> {
  // Validate wallet is connected
  if (!wallet.connected || !wallet.publicKey) {
    throw new Error("Wallet not connected");
  }

  // Check if wallet supports message signing
  if (!wallet.signMessage) {
    throw new Error(
      `Wallet ${wallet.wallet?.adapter.name || "unknown"} does not support message signing`,
    );
  }

  try {
    // Create the canonical message string
    const messageString = createSignableMessage(message);

    // Convert to Uint8Array for signing
    const messageBytes = new TextEncoder().encode(messageString);

    // Sign the message
    const signatureBytes = await wallet.signMessage(messageBytes);

    // Convert to base58 (Solana standard)
    const bs58 = await import("bs58");
    const signatureBase58 = bs58.default.encode(signatureBytes);

    logger.info("Bet message signed successfully", {
      player: message.player_pubkey.substring(0, 8),
      nonce: message.allowance_nonce,
      game: message.game_type,
    });

    return signatureBase58;
  } catch (error) {
    logger.error("Failed to sign bet message", { error, message });
    throw new Error(
      `Failed to sign bet message: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Create and sign a bet message in one call
 * Convenience function for common use case
 *
 * @param wallet - Wallet adapter from useWallet()
 * @param params - Bet parameters
 * @returns Base58 encoded signature
 */
export async function createAndSignBet(
  wallet: WalletContextState,
  params: {
    allowanceNonce: number;
    gameType: "coinflip" | "dice" | "plinko" | "slot";
    betAmountSol: number;
  },
): Promise<{
  signature: string;
  timestamp: number;
  message: BetMessage;
}> {
  if (!wallet.publicKey) {
    throw new Error("Wallet not connected");
  }

  // Create bet message
  const timestamp = Math.floor(Date.now() / 1000);
  const betAmountLamports = Math.floor(params.betAmountSol * 1_000_000_000);

  const message: BetMessage = {
    player_pubkey: wallet.publicKey.toBase58(),
    allowance_nonce: params.allowanceNonce,
    timestamp,
    game_type: params.gameType,
    bet_amount: betAmountLamports,
  };

  // Sign the message
  const signature = await signBetMessage(wallet, message);

  return {
    signature,
    timestamp,
    message,
  };
}
