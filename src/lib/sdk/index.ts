/**
 * Atomik SDK - Main Entry Point
 * Adapted for Next.js from the test-ui Vite implementation
 */

// Core configuration
export {
  createAtomikConfig,
  getAtomikUiEnv,
  getBlockchainConfig,
  getApiConfig,
  getWebSocketConfig,
  type AtomikConfig,
  type BlockchainConfig,
  type ApiConfig,
  type WebSocketConfig,
  type AtomikUiEnv,
} from "./env";

// Memo utilities for transaction descriptions
export {
  createMemoInstruction,
  MemoMessages,
  MEMO_PROGRAM_ID,
  truncateMemo,
} from "./utils/memo";

// API client
export {
  AtomikApiClient,
  createApiClient,
  type ApiResponse,
  type CoinflipRequest,
  type CoinflipResult,
  type Settlement,
  type RecentGame,
  type PaginatedGames,
} from "./api/client";

// WebSocket management
export {
  AtomikWebSocketManager,
  WebSocketConnection,
  createWebSocketManager,
  type WebSocketMessage,
  type CasinoStatsMessage,
  type RecentWinMessage,
  type BlockUpdateMessage,
  type AtomikWebSocketMessage,
} from "./websocket/manager";

// Betting service
export {
  AtomikBettingService,
  createBettingService,
  type BettingOperations,
} from "./betting/service";

/**
 * Main SDK factory that creates all services with shared configuration
 */
import type { AtomikConfig } from "./env";
import type { AtomikApiClient } from "./api/client";
import type { AtomikBettingService } from "./betting/service";
import type { AtomikWebSocketManager } from "./websocket/manager";

export interface AtomikSDK {
  config: AtomikConfig;
  api: AtomikApiClient;
  betting: AtomikBettingService;
  websocket: AtomikWebSocketManager;
}

/**
 * Create a complete SDK instance with all services
 */
import { createAtomikConfig } from "./env";
import { createApiClient } from "./api/client";
import { createBettingService } from "./betting/service";
import { createWebSocketManager } from "./websocket/manager";

export function createAtomikSDK(
  configOrOverrides?: AtomikConfig | Partial<AtomikConfig>,
): AtomikSDK {
  // If config looks like a complete config object, use it directly
  const config =
    configOrOverrides && "api" in configOrOverrides
      ? (configOrOverrides as AtomikConfig)
      : createAtomikConfig((configOrOverrides as Partial<AtomikConfig>) || {});

  const api = createApiClient(config);
  const betting = createBettingService(config, api);
  const websocket = createWebSocketManager(config);

  return {
    config,
    api,
    betting,
    websocket,
  };
}

/**
 * Convenience functions for creating individual services
 */
export const AtomikSDKFactory = {
  /**
   * Create just the API client
   */
  createApiOnly: (configOrOverrides?: AtomikConfig | Partial<AtomikConfig>) => {
    const config =
      configOrOverrides && "api" in configOrOverrides
        ? (configOrOverrides as AtomikConfig)
        : createAtomikConfig(
            (configOrOverrides as Partial<AtomikConfig>) || {},
          );
    return createApiClient(config);
  },

  /**
   * Create betting service only
   */
  createBettingOnly: (
    configOrOverrides?: AtomikConfig | Partial<AtomikConfig>,
  ) => {
    const config =
      configOrOverrides && "api" in configOrOverrides
        ? (configOrOverrides as AtomikConfig)
        : createAtomikConfig(
            (configOrOverrides as Partial<AtomikConfig>) || {},
          );
    const api = createApiClient(config);
    return createBettingService(config, api);
  },

  /**
   * Create WebSocket manager only
   */
  createWebSocketOnly: (
    configOrOverrides?: AtomikConfig | Partial<AtomikConfig>,
  ) => {
    const config =
      configOrOverrides && "api" in configOrOverrides
        ? (configOrOverrides as AtomikConfig)
        : createAtomikConfig(
            (configOrOverrides as Partial<AtomikConfig>) || {},
          );
    return createWebSocketManager(config);
  },
};
