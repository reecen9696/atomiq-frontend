import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionMessage,
  TransactionInstruction,
  type TransactionSignature,
  VersionedTransaction,
} from "@solana/web3.js";
import type { SendTransactionOptions } from "@solana/wallet-adapter-base";
import {
  parseVaultAccount,
  parseCasinoAccount,
  parseAllowanceAccount,
  parseAllowanceNonceRegistryAccount,
  buildIxData,
  createUniqueMemoInstruction,
  withRateLimitRetry,
  sleep,
  i64ToLeBytes,
  u64ToLeBytes,
  addPriorityFeeInstructions,
  waitForConfirmation,
} from "./solana/utils";
import { PDADerivation } from "./solana/pda";
import { createMemoInstruction, MemoMessages } from "../sdk/utils/memo";
import type {
  VaultAccountState,
  CasinoAccountState,
  AllowanceAccountState,
} from "./solana/types";
import { logger } from "@/lib/logger";

const RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";
const VAULT_PROGRAM_ID = process.env.NEXT_PUBLIC_VAULT_PROGRAM_ID;
const SOLANA_NETWORK = (process.env.NEXT_PUBLIC_SOLANA_NETWORK ||
  "devnet") as string;

type SendTransactionFn = (
  transaction: Transaction | VersionedTransaction,
  connection: Connection,
  options?: SendTransactionOptions,
) => Promise<TransactionSignature>;

type SignTransactionFn = (
  transaction: Transaction | VersionedTransaction,
) => Promise<Transaction | VersionedTransaction>;

type SignAllTransactionsFn = (
  transactions: (Transaction | VersionedTransaction)[],
) => Promise<(Transaction | VersionedTransaction)[]>;

// Re-export types from modules
export type {
  VaultAccountState,
  CasinoAccountState,
  AllowanceAccountState,
  AllowanceNonceRegistryState,
} from "./solana/types";

function isUserRejectedError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.toLowerCase().includes("user rejected") ||
    msg.toLowerCase().includes("user declined") ||
    msg.toLowerCase().includes("rejected the request") ||
    msg.toLowerCase().includes("request rejected") ||
    msg.toLowerCase().includes("denied")
  );
}

function extractCustomProgramErrorCode(err: unknown): number | null {
  const anyErr = err as any;

  // Prefer structured fields we attach.
  const structuredCandidates: unknown[] = [
    anyErr?.statusErr,
    anyErr?.status?.err,
    anyErr?.simErr,
  ].filter(Boolean);
  for (const candidate of structuredCandidates) {
    const c: any = candidate as any;

    // Shape: { InstructionError: [ixIndex, { Custom: n }] }
    if (c && typeof c === "object" && "InstructionError" in c) {
      const ie = (c as any).InstructionError;
      if (Array.isArray(ie) && ie.length >= 2) {
        const detail = ie[1];
        if (
          detail &&
          typeof detail === "object" &&
          "Custom" in (detail as any)
        ) {
          const code = (detail as any).Custom;
          if (typeof code === "number" && Number.isFinite(code)) return code;
        }
      }
    }

    // Some RPCs return InstructionError as a tuple-like array at the top-level.
    if (Array.isArray(c) && c.length >= 2) {
      const detail = c[1];
      if (detail && typeof detail === "object" && "Custom" in (detail as any)) {
        const code = (detail as any).Custom;
        if (typeof code === "number" && Number.isFinite(code)) return code;
      }
    }
  }

  // Fallback: parse from message text.
  const msg = err instanceof Error ? err.message : String(err);
  const hexMatch = msg.match(/custom program error:\s*0x([0-9a-fA-F]+)/);
  if (hexMatch?.[1]) {
    const parsed = Number.parseInt(hexMatch[1], 16);
    if (Number.isFinite(parsed)) return parsed;
  }
  const decMatch = msg.match(/"Custom"\s*:\s*(\d+)/);
  if (decMatch?.[1]) {
    const parsed = Number.parseInt(decMatch[1], 10);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

async function confirmSignatureRobust(
  connection: Connection,
  args: { signature: string; blockhash: string; lastValidBlockHeight: number },
  commitment: "processed" | "confirmed" | "finalized" = "confirmed",
  opts?: { timeoutMs?: number; pollIntervalMs?: number },
): Promise<void> {
  // NOTE: Using confirmTransaction with lastValidBlockHeight can produce
  // TransactionExpiredBlockheightExceededError under slow RPC / backoff.
  // For UX, polling signature statuses is more reliable.
  const timeoutMs = opts?.timeoutMs ?? 60_000;
  const pollIntervalMs = opts?.pollIntervalMs ?? 2_500; // Increased from 1_250ms to 2_500ms for better performance

  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const statuses = await withRateLimitRetry(() =>
      connection.getSignatureStatuses([args.signature], {
        searchTransactionHistory: true,
      }),
    );
    const status = statuses.value[0];
    if (status) {
      if (status.err) {
        const wrapped = new Error(
          `Transaction failed: ${JSON.stringify(status.err)}`,
        );
        (wrapped as any).signature = args.signature;
        (wrapped as any).status = status;
        (wrapped as any).statusErr = status.err;
        (wrapped as any).customErrorCode =
          extractCustomProgramErrorCode(wrapped);
        throw wrapped;
      }

      if (commitment === "processed") return;
      if (commitment === "confirmed") {
        if (
          status.confirmationStatus === "confirmed" ||
          status.confirmationStatus === "finalized"
        )
          return;
      } else {
        if (status.confirmationStatus === "finalized") return;
      }
    }

    await sleep(pollIntervalMs);
  }

  const timeoutErr = new Error(
    `Confirmation timed out after ${Math.round(timeoutMs / 1000)}s for signature ${args.signature}`,
  );
  (timeoutErr as any).signature = args.signature;
  throw timeoutErr;
}

async function signSendAndConfirm(
  connection: Connection,
  signTransaction: SignTransactionFn,
  tx: Transaction | VersionedTransaction,
): Promise<string> {
  const latest = await withRateLimitRetry(() =>
    connection.getLatestBlockhash("confirmed"),
  );
  if (tx instanceof Transaction) {
    tx.recentBlockhash = latest.blockhash;
  }

  const signed = await signTransaction(tx);
  const raw = signed.serialize();
  const sig = await withRateLimitRetry(() =>
    connection.sendRawTransaction(raw, {
      skipPreflight: false,
      preflightCommitment: "confirmed",
      maxRetries: 3,
    }),
  );

  await confirmSignatureRobust(
    connection,
    {
      signature: sig,
      blockhash: latest.blockhash,
      lastValidBlockHeight: latest.lastValidBlockHeight,
    },
    "confirmed",
  );

  return sig;
}

async function sendAndConfirm(
  connection: Connection,
  sendTransaction: SendTransactionFn,
  tx: Transaction | VersionedTransaction,
  opts?: { signTransaction?: SignTransactionFn },
): Promise<string> {
  const latest = await withRateLimitRetry(() =>
    connection.getLatestBlockhash("confirmed"),
  );
  if (tx instanceof Transaction) {
    tx.recentBlockhash = latest.blockhash;
  }
  try {
    const sig = await sendTransaction(tx, connection, {
      skipPreflight: false,
      preflightCommitment: "confirmed",
      maxRetries: 3,
    });

    await confirmSignatureRobust(
      connection,
      {
        signature: sig,
        blockhash: latest.blockhash,
        lastValidBlockHeight: latest.lastValidBlockHeight,
      },
      "confirmed",
    );
    return sig;
  } catch (err) {
    // Some wallets (or browser extensions) occasionally throw a generic
    // WalletSendTransactionError: Unexpected error. If we have a signTransaction
    // function available, fall back to signing + sending the raw transaction
    // ourselves to get a more actionable RPC error.
    if (opts?.signTransaction) {
      try {
        return await signSendAndConfirm(connection, opts.signTransaction, tx);
      } catch (fallbackErr) {
        // Keep original error as the primary cause, but attach fallback failure.
        const wrapped = new Error(
          `Wallet send failed, and raw-send fallback also failed: ${fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr)}`,
        );
        (wrapped as any).cause = err;
        (wrapped as any).fallbackCause = fallbackErr;
        throw wrapped;
      }
    }

    // Attempt to surface useful program logs by simulating the transaction.
    try {
      const simLatest = await withRateLimitRetry(() =>
        connection.getLatestBlockhash("confirmed"),
      );
      // We do not verify signatures here; we only want logs.
      // web3.js has separate overloads for Transaction vs VersionedTransaction.
      // To consistently force sigVerify=false, simulate a VersionedTransaction.
      let simTx: VersionedTransaction;
      if (tx instanceof VersionedTransaction) {
        simTx = tx;
      } else {
        if (!tx.feePayer) {
          throw new Error(
            "Cannot simulate legacy transaction without feePayer",
          );
        }
        const msg = new TransactionMessage({
          payerKey: tx.feePayer,
          recentBlockhash: simLatest.blockhash,
          instructions: tx.instructions,
        }).compileToV0Message();
        simTx = new VersionedTransaction(msg);
      }

      const sim = await withRateLimitRetry(() =>
        connection.simulateTransaction(simTx, {
          commitment: "confirmed",
          sigVerify: false,
          replaceRecentBlockhash: true,
        }),
      );
      const logs = sim.value.logs || [];
      const errMsg =
        (sim.value.err ? JSON.stringify(sim.value.err) : null) ||
        (err instanceof Error ? err.message : String(err));
      const wrapped = new Error(
        `Transaction failed during simulation: ${errMsg}${logs.length ? `\n\nProgram logs:\n${logs.join("\n")}` : ""}`,
      );
      (wrapped as any).cause = err;
      (wrapped as any).logs = logs;
      (wrapped as any).simErr = sim.value.err;
      throw wrapped;
    } catch (simErr) {
      // Fall back to original error if simulation also fails.
      throw err instanceof Error ? err : new Error(String(err));
    }
  }
}

export class SolanaService {
  private connection: Connection;
  private programId: PublicKey;
  private pdaDerivation: PDADerivation;

  constructor() {
    this.connection = new Connection(RPC_URL, "confirmed");
    if (!VAULT_PROGRAM_ID) {
      throw new Error("Missing NEXT_PUBLIC_VAULT_PROGRAM_ID");
    }
    this.programId = new PublicKey(VAULT_PROGRAM_ID);
    this.pdaDerivation = new PDADerivation(this.programId);
  }

  getProgramId(): string {
    return this.programId.toBase58();
  }

  getCluster(): string {
    return SOLANA_NETWORK;
  }

  getConnection(): Connection {
    return this.connection;
  }

  getRpcUrl(): string {
    return RPC_URL;
  }

  async getBalance(
    publicKey: string,
    connection?: Connection,
  ): Promise<number> {
    const conn = connection ?? this.connection;
    const pubKey = new PublicKey(publicKey);
    const balance = await withRateLimitRetry(() => conn.getBalance(pubKey));
    return balance / 1_000_000_000; // Convert to SOL
  }

  async deriveVaultPDA(userPublicKey: string): Promise<string> {
    try {
      const userPubKey = new PublicKey(userPublicKey);
      const vaultPDA = this.pdaDerivation.deriveVaultPDA(userPubKey);
      return vaultPDA.toBase58();
    } catch (error) {
      logger.error("Failed to derive vault PDA", error);
      throw error;
    }
  }

  async deriveCasinoPDA(): Promise<string> {
    const casinoPda = this.pdaDerivation.deriveCasinoPDA();
    return casinoPda.toBase58();
  }

  async deriveVaultAuthorityPDA(): Promise<string> {
    const vaultAuthority = this.pdaDerivation.deriveVaultAuthorityPDA();
    return vaultAuthority.toBase58();
  }

  async deriveCasinoVaultPDA(): Promise<string> {
    const casinoVault = this.pdaDerivation.deriveCasinoVaultPDA();
    return casinoVault.toBase58();
  }

  async deriveRateLimiterPDA(userPublicKey: string): Promise<string> {
    const user = new PublicKey(userPublicKey);
    const rateLimiter = this.pdaDerivation.deriveRateLimiterPDA(user);
    return rateLimiter.toBase58();
  }

  async deriveAllowanceNonceRegistryPDA(params: {
    userPublicKey: string;
    casinoPda?: string;
  }): Promise<string> {
    const user = new PublicKey(params.userPublicKey);
    const casino = params.casinoPda
      ? new PublicKey(params.casinoPda)
      : undefined;
    const registry = this.pdaDerivation.deriveAllowanceNonceRegistryPDA(
      user,
      casino,
    );
    return registry.toBase58();
  }

  async getNextAllowanceNonce(params: {
    user: PublicKey;
    casinoPda?: string;
    connection?: Connection;
  }): Promise<bigint> {
    const conn = params.connection ?? this.connection;
    const casinoPda = params.casinoPda ?? (await this.deriveCasinoPDA());
    const registryPda = await this.deriveAllowanceNonceRegistryPDA({
      userPublicKey: params.user.toBase58(),
      casinoPda,
    });

    const info = await withRateLimitRetry(() =>
      conn.getAccountInfo(new PublicKey(registryPda), "confirmed"),
    );
    if (!info) return 0n;
    const data = Buffer.from(info.data);
    const state = parseAllowanceNonceRegistryAccount(data);
    return state.nextNonce;
  }

  async getAccountExists(
    address: string,
    connection?: Connection,
  ): Promise<boolean> {
    const conn = connection ?? this.connection;
    const info = await withRateLimitRetry(() =>
      conn.getAccountInfo(new PublicKey(address), "confirmed"),
    );
    return info !== null;
  }

  async getVaultInfoByAddress(
    address: string,
    connection?: Connection,
  ): Promise<{
    exists: boolean;
    address: string;
    lamports: number | null;
    state: VaultAccountState | null;
  }> {
    const conn = connection ?? this.connection;
    const info = await withRateLimitRetry(() =>
      conn.getAccountInfo(new PublicKey(address), "confirmed"),
    );
    if (!info) {
      return { exists: false, address, lamports: null, state: null };
    }

    const data = Buffer.from(info.data);
    const state = parseVaultAccount(data);
    return {
      exists: true,
      address,
      lamports: info.lamports,
      state,
    };
  }

  async getUserVaultInfo(params: {
    user: PublicKey;
    connection?: Connection;
  }): Promise<{
    exists: boolean;
    address: string;
    lamports: number | null;
    state: VaultAccountState | null;
  }> {
    const vaultPda = await this.deriveVaultPDA(params.user.toBase58());
    return this.getVaultInfoByAddress(vaultPda, params.connection);
  }

  async getAllowanceInfoByAddress(
    address: string,
    connection?: Connection,
  ): Promise<{
    exists: boolean;
    address: string;
    lamports: number | null;
    state: AllowanceAccountState | null;
  }> {
    const conn = connection ?? this.connection;
    const info = await withRateLimitRetry(() =>
      conn.getAccountInfo(new PublicKey(address), "confirmed"),
    );
    if (!info) {
      return { exists: false, address, lamports: null, state: null };
    }

    const data = Buffer.from(info.data);
    const state = parseAllowanceAccount(data);
    return {
      exists: true,
      address,
      lamports: info.lamports,
      state,
    };
  }

  async getCasinoInfoByAddress(
    address: string,
    connection?: Connection,
  ): Promise<{
    exists: boolean;
    address: string;
    lamports: number | null;
    state: CasinoAccountState | null;
  }> {
    const conn = connection ?? this.connection;
    const info = await withRateLimitRetry(() =>
      conn.getAccountInfo(new PublicKey(address), "confirmed"),
    );
    if (!info) {
      return { exists: false, address, lamports: null, state: null };
    }

    const data = Buffer.from(info.data);
    const state = parseCasinoAccount(data);
    return {
      exists: true,
      address,
      lamports: info.lamports,
      state,
    };
  }

  async getCasinoInfo(connection?: Connection): Promise<{
    exists: boolean;
    address: string;
    lamports: number | null;
    state: CasinoAccountState | null;
  }> {
    const casinoPda = await this.deriveCasinoPDA();
    return this.getCasinoInfoByAddress(casinoPda, connection);
  }

  async initializeUserVault(params: {
    user: PublicKey;
    sendTransaction: SendTransactionFn;
    signTransaction?: SignTransactionFn;
    connection?: Connection;
  }): Promise<{ signature: string; vaultPda: string; casinoPda: string }> {
    const connection = params.connection ?? this.connection;
    const casinoPda = await this.deriveCasinoPDA();
    const vaultPda = await this.deriveVaultPDA(params.user.toBase58());

    const data = await buildIxData("initialize_vault");

    const ix = new TransactionInstruction({
      programId: this.programId,
      keys: [
        { pubkey: new PublicKey(vaultPda), isSigner: false, isWritable: true },
        {
          pubkey: new PublicKey(casinoPda),
          isSigner: false,
          isWritable: false,
        },
        { pubkey: params.user, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data,
    });

    // Add unique memo to prevent transaction deduplication errors
    const memoIx = createUniqueMemoInstruction();
    const tx = new Transaction().add(memoIx).add(ix);

    // Add priority fees for vault initialization
    addPriorityFeeInstructions(tx, 25000);
    tx.feePayer = params.user;

    const signature = params.signTransaction
      ? await signSendAndConfirm(connection, params.signTransaction, tx)
      : await sendAndConfirm(connection, params.sendTransaction, tx);
    return { signature, vaultPda, casinoPda };
  }

  async depositSol(params: {
    user: PublicKey;
    amountLamports: bigint;
    sendTransaction: SendTransactionFn;
    signTransaction?: SignTransactionFn;
    connection?: Connection;
  }): Promise<{ signature: string; vaultPda: string }> {
    const connection = params.connection ?? this.connection;
    const casinoPda = await this.deriveCasinoPDA();
    const vaultPda = await this.deriveVaultPDA(params.user.toBase58());

    const data = await buildIxData("deposit_sol", [
      u64ToLeBytes(params.amountLamports),
    ]);

    const ix = new TransactionInstruction({
      programId: this.programId,
      keys: [
        { pubkey: new PublicKey(vaultPda), isSigner: false, isWritable: true },
        {
          pubkey: new PublicKey(casinoPda),
          isSigner: false,
          isWritable: false,
        },
        { pubkey: params.user, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data,
    });

    // Add descriptive memo instruction first (so it's prominent in wallet)
    const amountSol = Number(params.amountLamports) / 1e9;
    const memoInstruction = createMemoInstruction(
      MemoMessages.depositSol(amountSol),
    );

    // Create transaction with memo first, then main instruction
    const tx = new Transaction().add(memoInstruction).add(ix);
    addPriorityFeeInstructions(tx, 15000);
    tx.feePayer = params.user;
    const signature = params.signTransaction
      ? await signSendAndConfirm(connection, params.signTransaction, tx)
      : await sendAndConfirm(connection, params.sendTransaction, tx);
    return { signature, vaultPda };
  }

  async withdrawSol(params: {
    user: PublicKey;
    amountLamports: bigint;
    sendTransaction: SendTransactionFn;
    signTransaction?: SignTransactionFn;
    connection?: Connection;
  }): Promise<{ signature: string; vaultPda: string }> {
    const connection = params.connection ?? this.connection;
    const casinoPda = await this.deriveCasinoPDA();
    const vaultPda = await this.deriveVaultPDA(params.user.toBase58());

    const data = await buildIxData("withdraw_sol", [
      u64ToLeBytes(params.amountLamports),
    ]);

    const ix = new TransactionInstruction({
      programId: this.programId,
      keys: [
        { pubkey: new PublicKey(vaultPda), isSigner: false, isWritable: true },
        {
          pubkey: new PublicKey(casinoPda),
          isSigner: false,
          isWritable: false,
        },
        { pubkey: params.user, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data,
    });

    // Add descriptive memo instruction first (so it's prominent in wallet)
    const amountSol = Number(params.amountLamports) / 1e9;
    const memoInstruction = createMemoInstruction(
      MemoMessages.withdrawSol(amountSol),
    );

    const tx = new Transaction().add(memoInstruction).add(ix);
    addPriorityFeeInstructions(tx, 15000);
    tx.feePayer = params.user;
    const signature = params.signTransaction
      ? await signSendAndConfirm(connection, params.signTransaction, tx)
      : await sendAndConfirm(connection, params.sendTransaction, tx);
    return { signature, vaultPda };
  }

  async approveAllowanceSol(params: {
    user: PublicKey;
    amountLamports: bigint;
    durationSeconds: bigint;
    sendTransaction: SendTransactionFn;
    signTransaction?: SignTransactionFn;
    signAllTransactions?: SignAllTransactionsFn;
    connection?: Connection;
  }): Promise<{ signature: string; allowancePda: string; usedNonce: bigint }> {
    const connection = params.connection ?? this.connection;

    const casinoPda = await this.deriveCasinoPDA();
    const vaultPda = await this.deriveVaultPDA(params.user.toBase58());
    const rateLimiterPda = await this.deriveRateLimiterPDA(
      params.user.toBase58(),
    );

    // Auto-initialize the user vault if it doesn't exist yet.
    // The Anchor program requires the vault account to already be initialized
    // before approve_allowance_v2 can run (it reads vault.bump and vault.owner).
    const vaultExists = await this.getAccountExists(vaultPda, connection);
    if (!vaultExists) {
      logger.info("🏗️ User vault not found — initializing automatically", {
        vaultPda,
        user: params.user.toBase58(),
      });
      try {
        const initResult = await this.initializeUserVault({
          user: params.user,
          sendTransaction: params.sendTransaction,
          signTransaction: params.signTransaction,
          connection,
        });
        logger.transaction("vault_initialized", {
          signature: initResult.signature,
          vaultPda: initResult.vaultPda,
        });
        // Small delay for RPC propagation
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (vaultErr) {
        if (isUserRejectedError(vaultErr))
          throw new Error("User cancelled vault initialization");
        // If vault was already initialized concurrently, that's fine
        const vaultErrMsg = vaultErr instanceof Error ? vaultErr.message : String(vaultErr);
        if (vaultErrMsg.includes("already in use")) {
          logger.info("Vault already exists (concurrent init) — continuing");
        } else {
          logger.error("❌ Failed to initialize user vault", { error: vaultErrMsg });
          throw new Error(`Failed to initialize vault: ${vaultErrMsg}`);
        }
      }
    }

    // Nonce-based deterministic allowance PDA (v2):
    // - Read `next_nonce` from AllowanceNonceRegistry PDA (or 0 if missing)
    // - Derive Allowance PDA using that nonce
    // - Call `approve_allowance_v2` with the nonce

    const casinoPk = new PublicKey(casinoPda);
    const nonce = await this.getNextAllowanceNonce({
      user: params.user,
      casinoPda,
      connection,
    });
    const [registryPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("allowance-nonce"),
        params.user.toBuffer(),
        casinoPk.toBuffer(),
      ],
      this.programId,
    );
    const [allowancePda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("allowance"),
        params.user.toBuffer(),
        casinoPk.toBuffer(),
        u64ToLeBytes(nonce),
      ],
      this.programId,
    );

    logger.transaction("approve_allowance_details", {
      nonce: nonce.toString(),
      allowancePda: allowancePda.toBase58(),
      vaultPda: vaultPda,
      amount: `${(Number(params.amountLamports) / 1e9).toFixed(9)} SOL`,
      duration: `${params.durationSeconds.toString()} seconds`,
    });

    const data = await buildIxData("approve_allowance_v2", [
      u64ToLeBytes(params.amountLamports),
      i64ToLeBytes(params.durationSeconds),
      SystemProgram.programId.toBuffer(),
      u64ToLeBytes(nonce),
    ]);

    const ix = new TransactionInstruction({
      programId: this.programId,
      keys: [
        { pubkey: new PublicKey(vaultPda), isSigner: false, isWritable: true },
        { pubkey: casinoPk, isSigner: false, isWritable: false },
        { pubkey: registryPda, isSigner: false, isWritable: true },
        { pubkey: allowancePda, isSigner: false, isWritable: true },
        {
          pubkey: new PublicKey(rateLimiterPda),
          isSigner: false,
          isWritable: true,
        },
        { pubkey: params.user, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data,
    });

    // Add unique memo to prevent transaction deduplication
    const memoIx = createUniqueMemoInstruction();
    logger.transaction("memo_instruction", {
      data: memoIx.data.toString("utf-8"),
    });

    const tx = new Transaction().add(memoIx).add(ix);

    // Add priority fees for faster processing on devnet
    addPriorityFeeInstructions(tx, 50000); // Higher priority fee for allowance transactions
    tx.feePayer = params.user;

    // Explicitly set blockhash — wallet adapters sometimes fail to do this,
    // causing "Unexpected error" from sendTransaction on devnet.
    const latestBlockhash = await withRateLimitRetry(() =>
      connection.getLatestBlockhash("confirmed"),
    );
    tx.recentBlockhash = latestBlockhash.blockhash;

    // Simulate first to get the actual Solana program error (instead of opaque
    // "WalletSendTransactionError: Unexpected error" from wallet adapters).
    // Note: simulateTransaction on an unsigned tx requires sigVerify: false.
    try {
      const simResult = await connection.simulateTransaction(tx, {
        sigVerify: false,
        commitment: "confirmed",
      } as any);
      if (simResult.value.err) {
        const simLogs = simResult.value.logs ?? [];
        const errStr = typeof simResult.value.err === "string"
          ? simResult.value.err
          : JSON.stringify(simResult.value.err, null, 2);
        const errorCode = extractCustomProgramErrorCode({ simErr: simResult.value.err });
        const logSnippet = simLogs.slice(-10).join("\n");
        logger.error("❌ Transaction simulation failed", {
          err: errStr,
          errorCode,
          logs: logSnippet,
        });
        throw new Error(
          `Transaction simulation failed: ${errStr}` +
          (errorCode != null ? ` (program error code: ${errorCode})` : "") +
          `\nLogs:\n${logSnippet}`
        );
      }
      logger.debug("✅ Simulation passed", { unitsConsumed: simResult.value.unitsConsumed });
    } catch (simErr) {
      // If it's already our formatted error, re-throw
      if (simErr instanceof Error && simErr.message.startsWith("Transaction simulation failed"))
        throw simErr;
      // If user cancelled, propagate
      if (isUserRejectedError(simErr))
        throw new Error("User cancelled allowance approval");
      // Log full error details for debugging
      const simErrMsg = simErr instanceof Error ? simErr.message : String(simErr);
      const simErrLogs = (simErr as any)?.logs ?? (simErr as any)?.simulationResponse?.logs;
      if (simErrLogs) {
        const logSnippet = Array.isArray(simErrLogs) ? simErrLogs.slice(-10).join("\n") : String(simErrLogs);
        const errorCode = extractCustomProgramErrorCode(simErr);
        logger.error("❌ Simulation threw an exception with logs", {
          error: simErrMsg,
          errorCode,
          logs: logSnippet,
        });
        throw new Error(
          `Transaction simulation failed: ${simErrMsg}` +
          (errorCode != null ? ` (program error code: ${errorCode})` : "") +
          `\nLogs:\n${logSnippet}`
        );
      }
      // If no logs, this might just be an unsigned-tx issue — let it proceed
      logger.warn("⚠️ Pre-flight simulation error (may be expected for unsigned tx)", {
        error: simErrMsg,
      });
    }

    // If signTransaction is available, use the more reliable sign-then-send path
    if (params.signTransaction) {
      try {
        const signature = await signSendAndConfirm(
          connection,
          params.signTransaction,
          tx,
        );
        logger.transaction("allowance_approved", { signature, emoji: "✅" });
        return {
          signature,
          allowancePda: allowancePda.toBase58(),
          usedNonce: nonce,
        };
      } catch (signErr) {
        // If user rejected, propagate immediately
        if (isUserRejectedError(signErr))
          throw new Error("User cancelled allowance approval");
        // If it's a real program/simulation error, propagate it — don't hide
        // it behind the wallet adapter's opaque "Unexpected error"
        const signErrMsg = signErr instanceof Error ? signErr.message : String(signErr);
        if (
          signErrMsg.includes("Transaction simulation failed") ||
          signErrMsg.includes("custom program error") ||
          signErrMsg.includes("InstructionError") ||
          signErrMsg.includes("already in use") ||
          signErrMsg.includes("insufficient funds")
        ) {
          logger.error("❌ signTransaction failed with program error — not retrying via sendTransaction", { error: signErrMsg });
          throw signErr;
        }
        // For transient/network errors, fall through to sendTransaction path
        logger.warn("signTransaction path failed, trying sendTransaction", { error: signErrMsg });
      }
    }

    logger.transaction("transaction_prepared", {
      totalInstructions: tx.instructions.length,
      feePayer: params.user.toBase58(),
    });

    try {
      // First try with preflight to get detailed error, then retry without if needed
      const signature = await params.sendTransaction(tx, connection, {
        skipPreflight: false,
        preflightCommitment: "confirmed",
        maxRetries: 3,
      });

      // Use more robust confirmation with polling and longer timeout
      logger.debug("⏳ Confirming transaction", { signature });
      await waitForConfirmation(
        {
          connection,
          signature,
          commitment: "confirmed",
        },
        { timeoutMs: 90_000 },
      ); // 90 second timeout for devnet

      logger.transaction("allowance_approved", { signature, emoji: "✅" });
      return {
        signature,
        allowancePda: allowancePda.toBase58(),
        usedNonce: nonce,
      };
    } catch (err) {
      logger.error("❌ Allowance approval failed", err);

      // If it's "already processed", try again with skipPreflight
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.toLowerCase().includes("already been processed")) {
        logger.debug("🔄 Retrying with skipPreflight: true");
        try {
          const signature = await params.sendTransaction(tx, connection, {
            skipPreflight: true,
            preflightCommitment: "confirmed",
            maxRetries: 3,
          });
          await waitForConfirmation(
            {
              connection,
              signature,
              commitment: "confirmed",
            },
            { timeoutMs: 90_000 },
          );
          logger.transaction("allowance_approved_retry", { signature });
          return {
            signature,
            allowancePda: allowancePda.toBase58(),
            usedNonce: nonce,
          };
        } catch (retryErr) {
          logger.error("❌ Retry also failed", retryErr);
          throw retryErr;
        }
      }

      if (isUserRejectedError(err))
        throw new Error("User cancelled allowance approval");
      throw err;
    }
  }

  async requestAirdrop(
    publicKey: string,
    amount: number = 1,
    connection?: Connection,
  ): Promise<string> {
    const conn = connection ?? this.connection;
    const pubKey = new PublicKey(publicKey);
    const signature = await withRateLimitRetry(() =>
      conn.requestAirdrop(
        pubKey,
        amount * 1_000_000_000, // Convert SOL to lamports
      ),
    );

    // Wait for confirmation
    await withRateLimitRetry(() => conn.confirmTransaction(signature));
    return signature;
  }

  getExplorerUrl(signature: string, cluster?: string): string {
    const c = cluster ?? SOLANA_NETWORK;
    return `https://explorer.solana.com/tx/${signature}?cluster=${c}`;
  }

  getAccountExplorerUrl(address: string, cluster?: string): string {
    const c = cluster ?? SOLANA_NETWORK;
    return `https://explorer.solana.com/address/${address}?cluster=${c}`;
  }
}

export const solanaService = new SolanaService();
