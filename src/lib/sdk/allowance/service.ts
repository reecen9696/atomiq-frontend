import {
  Connection,
  PublicKey,
  Transaction,
  VersionedTransaction,
  type TransactionSignature,
} from "@solana/web3.js";
import type { SendTransactionOptions } from "@solana/wallet-adapter-base";
import { solanaService } from "@/services/solana";
import { u64ToLeBytes } from "@/services/solana/utils";
import type { AllowanceAccountState } from "@/services/solana/types";

type SendTransactionFn = (
  transaction: Transaction | VersionedTransaction,
  connection: Connection,
  options?: SendTransactionOptions,
) => Promise<TransactionSignature>;

type SignTransactionFn = (
  transaction: Transaction | VersionedTransaction,
) => Promise<Transaction | VersionedTransaction>;

export interface AllowanceOperations {
  // PDA derivation
  deriveAllowancePDA(params: {
    userPublicKey: string;
    spender: string;
    nonce: number;
  }): Promise<string>;

  deriveAllowanceNonceRegistryPDA(params: {
    userPublicKey: string;
    spender: string;
  }): Promise<string>;

  // Nonce management
  getNextAllowanceNonce(params: {
    userPublicKey: string;
    spender: string;
    connection?: Connection;
  }): Promise<number>;

  // Account operations
  getAllowanceInfo(
    allowancePda: string,
    connection?: Connection,
  ): Promise<{
    accountExists: boolean;
    allowanceData: AllowanceAccountState | null;
  }>;

  // Allowance transactions
  approveAllowance(params: {
    userPublicKey: string;
    spender: string;
    amount: number;
    duration?: number;
    sendTransaction: SendTransactionFn;
    signTransaction: SignTransactionFn;
    connection?: Connection;
  }): Promise<{
    signature: string;
    allowancePda: string;
  }>;

  revokeAllowance(params: {
    userPublicKey: string;
    allowancePda: string;
    sendTransaction: SendTransactionFn;
    signTransaction: SignTransactionFn;
    connection?: Connection;
  }): Promise<string>;

  // Allowance management
  extendAllowance(params: {
    userPublicKey: string;
    spender: string;
    additionalDuration: number;
    sendTransaction: SendTransactionFn;
    signTransaction: SignTransactionFn;
    connection?: Connection;
  }): Promise<{
    signature: string;
    allowancePda: string;
  }>;
}

/**
 * Service for managing SOL allowances on Solana
 * Handles allowance approval, revocation, and extension with nonce-based deterministic PDAs
 */
export class AtomikAllowanceService implements AllowanceOperations {
  private connection: Connection;

  constructor(connection?: Connection) {
    this.connection = connection || solanaService.getConnection();
  }

  /**
   * Derive allowance PDA with nonce using existing PDA derivation logic
   */
  async deriveAllowancePDA(params: {
    userPublicKey: string;
    spender: string;
    nonce: number;
  }): Promise<string> {
    const { userPublicKey, nonce } = params;
    const userPubkey = new PublicKey(userPublicKey);
    const casinoPda = await solanaService.deriveCasinoPDA();

    // Use the same PDA derivation as SolanaService with proper u64ToLeBytes
    const [allowancePda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("allowance"),
        userPubkey.toBuffer(),
        new PublicKey(casinoPda).toBuffer(),
        u64ToLeBytes(BigInt(nonce)),
      ],
      new PublicKey(solanaService.getProgramId()),
    );

    return allowancePda.toBase58();
  }

  /**
   * Derive allowance nonce registry PDA
   */
  async deriveAllowanceNonceRegistryPDA(params: {
    userPublicKey: string;
    spender: string;
  }): Promise<string> {
    const { userPublicKey } = params;
    const casinoPda = await solanaService.deriveCasinoPDA();

    return await solanaService.deriveAllowanceNonceRegistryPDA({
      userPublicKey,
      casinoPda,
    });
  }

  /**
   * Get the next available nonce for allowances
   */
  async getNextAllowanceNonce(params: {
    userPublicKey: string;
    spender: string;
    connection?: Connection;
  }): Promise<number> {
    const { userPublicKey } = params;
    const userPubkey = new PublicKey(userPublicKey);

    try {
      const nonce = await solanaService.getNextAllowanceNonce({
        user: userPubkey,
        connection: params.connection || this.connection,
      });
      return Number(nonce);
    } catch (error) {
      console.warn("Error fetching allowance nonce:", error);
      return 0;
    }
  }

  /**
   * Get allowance account information
   */
  async getAllowanceInfo(allowancePda: string, connection?: Connection) {
    const conn = connection || this.connection;

    try {
      const info = await solanaService.getAllowanceInfoByAddress(
        allowancePda,
        conn,
      );

      return {
        accountExists: info.exists,
        allowanceData: info.state,
      };
    } catch (error) {
      return {
        accountExists: false,
        allowanceData: null,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Approve an allowance for a spender
   */
  async approveAllowance(params: {
    userPublicKey: string;
    spender: string;
    amount: number;
    duration?: number;
    sendTransaction: SendTransactionFn;
    signTransaction: SignTransactionFn;
    connection?: Connection;
  }): Promise<{
    signature: string;
    allowancePda: string;
  }> {
    const { userPublicKey, amount, duration = 10000 } = params;
    const userPubkey = new PublicKey(userPublicKey);

    console.log("🔐 Approving allowance with params:", {
      user: userPublicKey,
      amount,
      duration,
      amountLamports: Math.floor(amount * 1_000_000_000),
    });

    // Use the existing SolanaService.approveAllowanceSol method
    const result = await solanaService.approveAllowanceSol({
      user: userPubkey,
      amountLamports: BigInt(Math.floor(amount * 1_000_000_000)),
      durationSeconds: BigInt(duration),
      sendTransaction: params.sendTransaction,
      signTransaction: params.signTransaction,
      connection: params.connection || this.connection,
    });

    console.log("✅ Allowance approval result from solanaService:", {
      signature: result.signature,
      allowancePda: result.allowancePda,
      usedNonce: result.usedNonce,
    });

    // Verify the allowance was actually created on-chain
    const conn = params.connection || this.connection;
    try {
      const allowanceInfo = await solanaService.getAllowanceInfoByAddress(
        result.allowancePda,
        conn,
      );
      console.log("📊 On-chain allowance verification:", {
        exists: allowanceInfo.exists,
        state: allowanceInfo.state,
      });

      if (!allowanceInfo.exists) {
        console.warn(
          "⚠️ WARNING: Allowance transaction confirmed but account not found on-chain!",
        );
      }
    } catch (error) {
      console.error("❌ Failed to verify allowance on-chain:", error);
    }

    return {
      signature: result.signature,
      allowancePda: result.allowancePda,
    };
  }

  /**
   * Revoke an existing allowance (placeholder - not implemented in SolanaService)
   */
  async revokeAllowance(params: {
    userPublicKey: string;
    allowancePda: string;
    sendTransaction: SendTransactionFn;
    signTransaction: SignTransactionFn;
    connection?: Connection;
  }): Promise<string> {
    // TODO: Implement revokeAllowance in SolanaService if needed
    throw new Error("Revoke allowance not implemented yet");
  }

  /**
   * Extend an existing allowance duration
   */
  async extendAllowance(params: {
    userPublicKey: string;
    spender: string;
    additionalDuration: number;
    sendTransaction: SendTransactionFn;
    signTransaction: SignTransactionFn;
    connection?: Connection;
  }): Promise<{
    signature: string;
    allowancePda: string;
  }> {
    // For now, create a new allowance with extended duration
    // This is the same as approveAllowance with the additional duration
    const {
      userPublicKey,
      additionalDuration,
      sendTransaction,
      signTransaction,
    } = params;

    return await this.approveAllowance({
      userPublicKey,
      spender: params.spender,
      amount: 5, // Default 5 SOL allowance
      duration: additionalDuration,
      sendTransaction,
      signTransaction,
      connection: params.connection,
    });
  }

  /**
   * Find active allowances for a user/spender pair
   */
  async findActiveAllowances(params: {
    userPublicKey: string;
    spender: string;
    connection?: Connection;
  }): Promise<
    Array<{
      allowancePda: string;
      nonce: number;
      data: AllowanceAccountState;
    }>
  > {
    const { userPublicKey, spender, connection = this.connection } = params;

    const maxNonce = await this.getNextAllowanceNonce({
      userPublicKey,
      spender,
      connection,
    });
    const activeAllowances = [];

    // Check each possible nonce up to the current max
    for (let nonce = 0; nonce < maxNonce; nonce++) {
      try {
        const allowancePda = await this.deriveAllowancePDA({
          userPublicKey,
          spender,
          nonce,
        });

        const info = await this.getAllowanceInfo(allowancePda, connection);

        if (info.accountExists && info.allowanceData) {
          activeAllowances.push({
            allowancePda,
            nonce,
            data: info.allowanceData,
          });
        }
      } catch (error) {
        // Skip failed lookups
        continue;
      }
    }

    return activeAllowances;
  }

  /**
   * Find the most recent active allowance for a user/spender pair
   */
  async findMostRecentActiveAllowance(params: {
    userPublicKey: string;
    spender: string;
    connection?: Connection;
  }): Promise<{
    allowancePda: string;
    nonce: number;
    data: AllowanceAccountState;
  } | null> {
    const allowances = await this.findActiveAllowances(params);

    if (allowances.length === 0) {
      return null;
    }

    // Return the allowance with the highest nonce (most recent)
    return allowances.reduce((latest, current) =>
      current.nonce > latest.nonce ? current : latest,
    );
  }
}

/**
 * Factory function to create an allowance service
 */
export function createAllowanceService(
  connection?: Connection,
): AtomikAllowanceService {
  return new AtomikAllowanceService(connection);
}
