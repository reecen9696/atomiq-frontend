/**
 * Program Derived Address (PDA) derivation functions
 *
 * All PDAs use the same seed patterns as the smart contract to ensure consistency.
 */
import { PublicKey } from "@solana/web3.js";

export class PDADerivation {
  constructor(private programId: PublicKey) {}

  /**
   * Derive casino PDA
   * Seeds: ["casino"]
   */
  deriveCasinoPDA(): PublicKey {
    const [casinoPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("casino")],
      this.programId,
    );
    return casinoPda;
  }

  /**
   * Derive user vault PDA
   * Seeds: ["vault", casino_pubkey, user_pubkey]
   */
  deriveVaultPDA(userPublicKey: PublicKey, casinoPda?: PublicKey): PublicKey {
    const casino = casinoPda ?? this.deriveCasinoPDA();
    const [vaultPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), casino.toBuffer(), userPublicKey.toBuffer()],
      this.programId,
    );
    return vaultPDA;
  }

  /**
   * Derive vault authority PDA (for signing SPL transfers)
   * Seeds: ["vault-authority", casino_pubkey]
   */
  deriveVaultAuthorityPDA(casinoPda?: PublicKey): PublicKey {
    const casino = casinoPda ?? this.deriveCasinoPDA();
    const [vaultAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault-authority"), casino.toBuffer()],
      this.programId,
    );
    return vaultAuthority;
  }

  /**
   * Derive casino vault PDA (program-owned account holding casino funds)
   * Seeds: ["casino-vault", casino_pubkey]
   */
  deriveCasinoVaultPDA(casinoPda?: PublicKey): PublicKey {
    const casino = casinoPda ?? this.deriveCasinoPDA();
    const [casinoVault] = PublicKey.findProgramAddressSync(
      [Buffer.from("casino-vault"), casino.toBuffer()],
      this.programId,
    );
    return casinoVault;
  }

  /**
   * Derive rate limiter PDA
   * Seeds: ["rate-limiter", user_pubkey]
   */
  deriveRateLimiterPDA(userPublicKey: PublicKey): PublicKey {
    const [rateLimiter] = PublicKey.findProgramAddressSync(
      [Buffer.from("rate-limiter"), userPublicKey.toBuffer()],
      this.programId,
    );
    return rateLimiter;
  }

  /**
   * Derive allowance nonce registry PDA
   * Seeds: ["allowance-nonce", user_pubkey, casino_pubkey]
   */
  deriveAllowanceNonceRegistryPDA(
    userPublicKey: PublicKey,
    casinoPda?: PublicKey,
  ): PublicKey {
    const casino = casinoPda ?? this.deriveCasinoPDA();
    const [registry] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("allowance-nonce"),
        userPublicKey.toBuffer(),
        casino.toBuffer(),
      ],
      this.programId,
    );
    return registry;
  }

  /**
   * Derive allowance PDA
   * Seeds: ["allowance", user_pubkey, casino_pubkey, nonce (u64 LE)]
   */
  deriveAllowancePDA(
    userPublicKey: PublicKey,
    nonce: bigint,
    casinoPda?: PublicKey,
  ): PublicKey {
    const casino = casinoPda ?? this.deriveCasinoPDA();
    const nonceBuffer = new ArrayBuffer(8);
    const view = new DataView(nonceBuffer);
    view.setBigUint64(0, nonce, true); // true = little endian

    const [allowancePda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("allowance"),
        userPublicKey.toBuffer(),
        casino.toBuffer(),
        Buffer.from(nonceBuffer),
      ],
      this.programId,
    );
    return allowancePda;
  }
}
