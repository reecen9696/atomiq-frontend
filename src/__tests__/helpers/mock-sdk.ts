/**
 * Mock SDK Helpers
 * Provides mock implementations of SDK services for testing
 */

import { vi } from 'vitest'
import type { CoinflipResult, Settlement } from '@/lib/sdk/api/client'
import type { BettingOperations } from '@/lib/sdk/betting/service'

/**
 * Create a mock coinflip result
 */
export function createMockCoinflipResult(
  won: boolean,
  amount: number,
  overrides?: Partial<CoinflipResult>
): CoinflipResult {
  return {
    game_id: 'test-game-' + Math.random().toString(36).substr(2, 9),
    result: won ? 'win' : 'loss',
    player_choice: 'heads',
    coin_result: won ? 'heads' : 'tails',
    bet_amount: amount,
    payout: won ? amount * 2 : 0,
    player_id: 'TestWa11etAddress1111111111111111111111111',
    timestamp: new Date().toISOString(),
    vrf_proof: 'mock-vrf-proof',
    status: 'completed',
    ...overrides,
  }
}

/**
 * Create a mock settlement
 */
export function createMockSettlement(
  status: string,
  overrides?: Partial<Settlement>
): Settlement {
  return {
    settlement_id: 'test-settlement-' + Math.random().toString(36).substr(2, 9),
    game_id: 'test-game-' + Math.random().toString(36).substr(2, 9),
    status,
    player_id: 'TestWa11etAddress1111111111111111111111111',
    amount: 0.1,
    timestamp: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Create a mock betting service
 */
export function createMockBettingService(): BettingOperations {
  return {
    placeCoinflipBet: vi.fn().mockResolvedValue(
      createMockCoinflipResult(true, 0.1)
    ),
    getGameResult: vi.fn().mockResolvedValue(null),
    getPendingSettlements: vi.fn().mockResolvedValue([]),
    getSettlement: vi.fn().mockResolvedValue(null),
    waitForGameSettlement: vi.fn().mockResolvedValue(
      createMockCoinflipResult(true, 0.1)
    ),
  }
}

/**
 * Create a mock API client
 */
export function createMockApiClient() {
  return {
    playCoinflip: vi.fn().mockResolvedValue({
      success: true,
      data: createMockCoinflipResult(true, 0.1),
    }),
    getGameResult: vi.fn().mockResolvedValue({
      success: true,
      data: createMockCoinflipResult(true, 0.1),
    }),
    getRecentGames: vi.fn().mockResolvedValue({
      success: true,
      data: {
        games: [],
        cursor: null,
      },
    }),
    getPendingSettlements: vi.fn().mockResolvedValue({
      success: true,
      data: [],
    }),
    getSettlement: vi.fn().mockResolvedValue({
      success: true,
      data: createMockSettlement('completed'),
    }),
  }
}
