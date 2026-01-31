/**
 * Utility functions for Solana program interactions
 */
import {
  PublicKey,
  TransactionInstruction,
  Transaction,
  Connection,
  ComputeBudgetProgram,
} from "@solana/web3.js";
import type {
  VaultAccountState,
  CasinoAccountState,
  AllowanceAccountState,
  AllowanceNonceRegistryState,
} from "./types";

export function readPubkey(buf: Buffer, offset: number): PublicKey {
  return new PublicKey(buf.subarray(offset, offset + 32));
}

export function parseVaultAccount(data: Buffer): VaultAccountState {
  // Anchor account layout: 8-byte discriminator + fields.
  // Vault fields: owner(32) casino(32) bump(u8) sol_balance(u64) created_at(i64) last_activity(i64)
  if (data.length < 8 + 32 + 32 + 1 + 8 + 8 + 8) {
    throw new Error(`Vault account data too small: ${data.length} bytes`);
  }

  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  let off = 8;

  const owner = readPubkey(data, off);
  off += 32;
  const casino = readPubkey(data, off);
  off += 32;
  const bump = view.getUint8(off);
  off += 1;
  const solBalanceLamports = view.getBigUint64(off, true); // true = little endian
  off += 8;
  const createdAt = view.getBigInt64(off, true);
  off += 8;
  const lastActivity = view.getBigInt64(off, true);

  return {
    owner: owner.toBase58(),
    casino: casino.toBase58(),
    bump,
    solBalanceLamports,
    createdAt,
    lastActivity,
  };
}

export function parseCasinoAccount(data: Buffer): CasinoAccountState {
  // Anchor account layout: 8-byte discriminator + fields.
  // Casino fields:
  // authority(32) processor(32) treasury(32) bump(u8) vault_authority_bump(u8)
  // paused(bool) total_bets(u64) total_volume(u64) created_at(i64)
  const minLen = 8 + 32 + 32 + 32 + 1 + 1 + 1 + 8 + 8 + 8;
  if (data.length < minLen) {
    throw new Error(`Casino account data too small: ${data.length} bytes`);
  }

  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  let off = 8;

  const authority = readPubkey(data, off);
  off += 32;
  const processor = readPubkey(data, off);
  off += 32;
  const treasury = readPubkey(data, off);
  off += 32;
  const bump = view.getUint8(off);
  off += 1;
  const vaultAuthorityBump = view.getUint8(off);
  off += 1;
  const paused = view.getUint8(off) !== 0;
  off += 1;
  const totalBets = view.getBigUint64(off, true);
  off += 8;
  const totalVolumeLamports = view.getBigUint64(off, true);
  off += 8;
  const createdAt = view.getBigInt64(off, true);

  return {
    authority: authority.toBase58(),
    processor: processor.toBase58(),
    treasury: treasury.toBase58(),
    bump,
    vaultAuthorityBump,
    paused,
    totalBets,
    totalVolumeLamports,
    createdAt,
  };
}

export function parseAllowanceAccount(data: Buffer): AllowanceAccountState {
  // Anchor account layout: 8-byte discriminator + fields.
  // Allowance fields:
  // user(32) casino(32) token_mint(32) amount(u64) spent(u64) expires_at(i64)
  // created_at(i64) nonce(u64) revoked(bool) bump(u8) last_spent_at(i64) spend_count(u32)
  const minLen = 8 + 32 + 32 + 32 + 8 + 8 + 8 + 8 + 8 + 1 + 1 + 8 + 4;
  if (data.length < minLen) {
    throw new Error(`Allowance account data too small: ${data.length} bytes`);
  }

  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  let off = 8;

  const user = readPubkey(data, off);
  off += 32;
  const casino = readPubkey(data, off);
  off += 32;
  const tokenMint = readPubkey(data, off);
  off += 32;
  const amountLamports = view.getBigUint64(off, true);
  off += 8;
  const spentLamports = view.getBigUint64(off, true);
  off += 8;
  const expiresAt = view.getBigInt64(off, true);
  off += 8;
  const createdAt = view.getBigInt64(off, true);
  off += 8;
  const nonce = view.getBigUint64(off, true);
  off += 8;
  const revoked = view.getUint8(off) !== 0;
  off += 1;
  const bump = view.getUint8(off);
  off += 1;
  const lastSpentAt = view.getBigInt64(off, true);
  off += 8;
  const spendCount = view.getUint32(off, true);

  const remainingLamports =
    amountLamports > spentLamports ? amountLamports - spentLamports : 0n;

  return {
    user: user.toBase58(),
    casino: casino.toBase58(),
    tokenMint: tokenMint.toBase58(),
    amountLamports,
    spentLamports,
    expiresAt,
    createdAt,
    nonce,
    revoked,
    bump,
    lastSpentAt,
    spendCount,
    remainingLamports,
  };
}

export function parseAllowanceNonceRegistryAccount(
  data: Buffer,
): AllowanceNonceRegistryState {
  // Anchor account layout: 8-byte discriminator + fields.
  // AllowanceNonceRegistry fields: user(32) casino(32) next_nonce(u64) bump(u8)
  const minLen = 8 + 32 + 32 + 8 + 1;
  if (data.length < minLen) {
    throw new Error(
      `AllowanceNonceRegistry account data too small: ${data.length} bytes`,
    );
  }

  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  let off = 8;

  const user = readPubkey(data, off);
  off += 32;
  const casino = readPubkey(data, off);
  off += 32;
  const nextNonce = view.getBigUint64(off, true);
  off += 8;
  const bump = view.getUint8(off);

  return {
    user: user.toBase58(),
    casino: casino.toBase58(),
    nextNonce,
    bump,
  };
}

export function i64ToLeBytes(value: bigint): Uint8Array {
  const buf = new ArrayBuffer(8);
  const view = new DataView(buf);
  view.setBigInt64(0, value, true); // true = little endian
  return new Uint8Array(buf);
}

export function u64ToLeBytes(value: bigint): Uint8Array {
  const buf = new ArrayBuffer(8);
  const view = new DataView(buf);
  view.setBigUint64(0, value, true); // true = little endian
  return new Uint8Array(buf);
}

export async function anchorDiscriminator(ixName: string): Promise<Buffer> {
  // Anchor: first 8 bytes of sha256("global:<ix_name>")
  const preimage = new TextEncoder().encode(`global:${ixName}`);
  if (!globalThis.crypto?.subtle?.digest) {
    throw new Error(
      "WebCrypto not available: cannot compute Anchor discriminator",
    );
  }
  const bytes: ArrayBuffer = preimage.buffer.slice(
    preimage.byteOffset,
    preimage.byteOffset + preimage.byteLength,
  ) as ArrayBuffer;
  const hash = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return Buffer.from(hash).subarray(0, 8);
}

export async function buildIxData(
  ixName: string,
  args?: (Buffer | Uint8Array)[],
): Promise<Buffer> {
  const disc = await anchorDiscriminator(ixName);
  const argBuffers = args?.map((arg) => Buffer.from(arg)) || [];
  return Buffer.concat([disc, ...argBuffers]);
}

export function createUniqueMemoInstruction(): TransactionInstruction {
  // Create a memo with timestamp to make each transaction unique
  // This prevents Solana's transaction deduplication from rejecting retries
  const memo = `atomik-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const memoData = Buffer.from(memo, "utf-8");

  // Memo program ID on Solana
  const MEMO_PROGRAM_ID = new PublicKey(
    "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
  );

  return new TransactionInstruction({
    keys: [],
    programId: MEMO_PROGRAM_ID,
    data: memoData,
  });
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Add priority fee and compute unit instructions for better transaction processing
export function addPriorityFeeInstructions(
  tx: Transaction,
  priorityFeeInMicroLamports: number = 10000,
): Transaction {
  // Set compute unit limit - most betting transactions need ~100k units
  const computeUnitInstruction = ComputeBudgetProgram.setComputeUnitLimit({
    units: 200_000,
  });

  // Set priority fee to ensure transaction gets processed quickly
  const priorityFeeInstruction = ComputeBudgetProgram.setComputeUnitPrice({
    microLamports: priorityFeeInMicroLamports,
  });

  // Add these instructions at the beginning, but preserve memo instructions at position 0
  const firstInstruction = tx.instructions[0];
  const isMemoInstruction = firstInstruction?.programId.equals(
    new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"),
  );

  if (isMemoInstruction) {
    // Insert priority fee instructions after the memo instruction (at positions 1 and 2)
    tx.instructions.splice(
      1,
      0,
      computeUnitInstruction,
      priorityFeeInstruction,
    );
  } else {
    // No memo instruction, add priority fees at the beginning as usual
    tx.instructions.unshift(computeUnitInstruction, priorityFeeInstruction);
  }
  return tx;
}

// Enhanced confirmation with polling and custom timeout
export async function waitForConfirmation(
  params: {
    connection: Connection;
    signature: string;
    commitment?: "processed" | "confirmed" | "finalized";
  },
  opts?: { timeoutMs?: number; pollIntervalMs?: number },
): Promise<void> {
  const { connection, signature, commitment = "confirmed" } = params;
  const timeoutMs = opts?.timeoutMs ?? 60_000;
  const pollIntervalMs = opts?.pollIntervalMs ?? 1000;

  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    try {
      const status = await connection.getSignatureStatus(signature);

      if (status.value?.err) {
        throw new Error(
          `Transaction failed: ${JSON.stringify(status.value.err)}`,
        );
      }

      if (status.value?.confirmationStatus) {
        if (commitment === "processed") return;
        if (
          commitment === "confirmed" &&
          (status.value.confirmationStatus === "confirmed" ||
            status.value.confirmationStatus === "finalized")
        )
          return;
        if (
          commitment === "finalized" &&
          status.value.confirmationStatus === "finalized"
        )
          return;
      }

      await sleep(pollIntervalMs);
    } catch (err) {
      if (Date.now() - start >= timeoutMs) {
        throw new Error(
          `Confirmation timed out after ${Math.round(timeoutMs / 1000)}s for signature ${signature}`,
        );
      }
      await sleep(pollIntervalMs);
    }
  }

  throw new Error(
    `Confirmation timed out after ${Math.round(timeoutMs / 1000)}s for signature ${signature}`,
  );
}

export function isRateLimitError(err: unknown): boolean {
  const anyErr = err as any;
  const msg = err instanceof Error ? err.message : String(err);
  return (
    anyErr?.code === 429 ||
    msg.includes(" 429") ||
    msg.includes('code": 429') ||
    msg.toLowerCase().includes("too many requests") ||
    msg.toLowerCase().includes("rate limit")
  );
}

// Public Solana RPC endpoints (especially devnet) are aggressively rate-limited.
// web3.js will also retry some 429s internally; if we *also* retry without
// coordination, we can create a thundering herd. This helper:
// - serializes our own RPC calls (concurrency=1)
// - applies a global cooldown when 429s occur
let rpcInFlight = 0;
const rpcQueue: Array<() => void> = [];
let rpcCooldownUntilMs = 0;

async function acquireRpcSlot(): Promise<void> {
  if (rpcInFlight === 0) {
    rpcInFlight = 1;
    return;
  }
  await new Promise<void>((resolve) => rpcQueue.push(resolve));
  rpcInFlight = 1;
}

function releaseRpcSlot(): void {
  rpcInFlight = 0;
  const next = rpcQueue.shift();
  if (next) next();
}

export async function withRateLimitRetry<T>(
  fn: () => Promise<T>,
  opts?: { retries?: number; baseDelayMs?: number },
): Promise<T> {
  const retries = opts?.retries ?? 2;
  const baseDelayMs = opts?.baseDelayMs ?? 1000;
  let attempt = 0;

  while (true) {
    const now = Date.now();
    if (rpcCooldownUntilMs > now) {
      await sleep(rpcCooldownUntilMs - now);
    }

    await acquireRpcSlot();
    try {
      return await fn();
    } catch (err) {
      if (!isRateLimitError(err) || attempt >= retries) throw err;

      const delay = baseDelayMs * Math.pow(2, attempt);
      // Global cooldown so other calls back off too.
      rpcCooldownUntilMs = Math.max(rpcCooldownUntilMs, Date.now() + delay);
      attempt += 1;
      // Small jitter to reduce synchronization.
      await sleep(delay + Math.floor(Math.random() * 250));
    } finally {
      releaseRpcSlot();
    }
  }
}
