/**
 * SDK Configuration adapted for Next.js
 * Converts Vite's import.meta.env to Next.js process.env
 */

type RequiredString = string;

export interface BlockchainConfig {
  rpcUrl: string;
  network: string;
  programId: string;
  commitment: "confirmed" | "finalized" | "processed";
  confirmTimeout: number;
}

export interface ApiConfig {
  baseUrl: string;
  apiKey?: string;
  timeout: number;
  retryAttempts: number;
}

export interface WebSocketConfig {
  enabled: boolean;
  reconnectAttempts: number;
  reconnectDelay: number;
  connectionTimeout: number;
}

export interface AtomikConfig {
  api: ApiConfig;
  blockchain: BlockchainConfig;
  websocket: WebSocketConfig;
}

export type AtomikUiEnv = {
  apiBaseUrl: RequiredString;
  settlementApiKey?: string;
  solanaRpcUrl: RequiredString;
  solanaNetwork: RequiredString;
  vaultProgramId: RequiredString;
};

function required(name: string, value: unknown): string {
  if (typeof value === "string" && value.trim().length > 0) return value;

  // During build time, return empty string for required vault program ID if not set
  if (name === "NEXT_PUBLIC_VAULT_PROGRAM_ID" && !value) {
    console.warn(`Missing env var: ${name} - using placeholder for build`);
    return "11111111111111111111111111111111"; // Placeholder program ID
  }

  throw new Error(`Missing required env var: ${name}`);
}

/**
 * Next.js environment adapter
 * Reads from process.env instead of import.meta.env
 */
export function getAtomikUiEnv(): AtomikUiEnv {
  return {
    apiBaseUrl: required(
      "NEXT_PUBLIC_API_BASE_URL",
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080",
    ),
    settlementApiKey: process.env.NEXT_PUBLIC_SETTLEMENT_API_KEY,
    solanaRpcUrl: required(
      "NEXT_PUBLIC_SOLANA_RPC_URL",
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com",
    ),
    solanaNetwork: process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet",
    vaultProgramId: required(
      "NEXT_PUBLIC_VAULT_PROGRAM_ID",
      process.env.NEXT_PUBLIC_VAULT_PROGRAM_ID || "",
    ),
  };
}

/**
 * Creates a complete Atomik configuration from environment variables.
 */
export function createAtomikConfig(
  overrides: Partial<AtomikConfig> = {},
): AtomikConfig {
  const env = getAtomikUiEnv();

  const defaultConfig: AtomikConfig = {
    api: {
      baseUrl: env.apiBaseUrl,
      apiKey: env.settlementApiKey,
      timeout: 30000, // 30 seconds
      retryAttempts: 3,
    },
    blockchain: {
      rpcUrl: env.solanaRpcUrl,
      network: env.solanaNetwork,
      programId: env.vaultProgramId,
      commitment: "confirmed",
      confirmTimeout: 60000, // 60 seconds
    },
    websocket: {
      enabled: true,
      reconnectAttempts: 10,
      reconnectDelay: 1000, // Start with 1 second
      connectionTimeout: 10000, // 10 seconds
    },
  };

  return mergeConfig(defaultConfig, overrides);
}

function mergeConfig(
  base: AtomikConfig,
  overrides: Partial<AtomikConfig>,
): AtomikConfig {
  return {
    api: { ...base.api, ...overrides.api },
    blockchain: { ...base.blockchain, ...overrides.blockchain },
    websocket: { ...base.websocket, ...overrides.websocket },
  };
}

/**
 * Extract blockchain configuration
 */
export function getBlockchainConfig(config: AtomikConfig): BlockchainConfig {
  return config.blockchain;
}

/**
 * Extract API configuration
 */
export function getApiConfig(config: AtomikConfig): ApiConfig {
  return config.api;
}

/**
 * Extract WebSocket configuration
 */
export function getWebSocketConfig(config: AtomikConfig): WebSocketConfig {
  return config.websocket;
}
