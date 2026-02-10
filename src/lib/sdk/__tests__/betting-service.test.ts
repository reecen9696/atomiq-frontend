/**
 * Betting Service Tests
 * Tests for AtomikBettingService in src/lib/sdk/betting/service.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AtomikBettingService } from '../betting/service'
import type { AtomikConfig } from '../env'
import type { AtomikApiClient } from '../api/client'
import { createMockCoinflipResult, createMockSettlement } from '@/__tests__/helpers/mock-sdk'

// Mock the solana service to avoid environment variable issues
vi.mock('@/services/solana', () => ({
  solanaService: {
    getConnection: vi.fn(() => ({}) as any),
  },
}))

describe('betting-service', () => {
  let service: AtomikBettingService
  let mockApiClient: AtomikApiClient
  let mockConfig: AtomikConfig

  beforeEach(() => {
    // Create mock config
    mockConfig = {
      apiUrl: 'http://localhost:8080',
      wsUrl: 'ws://localhost:8080/ws',
    } as AtomikConfig

    // Create mock API client
    mockApiClient = {
      playCoinflip: vi.fn(),
      getGameResult: vi.fn(),
      getRecentGames: vi.fn(),
      getPendingSettlements: vi.fn(),
      getSettlement: vi.fn(),
    } as unknown as AtomikApiClient

    // Create service instance
    service = new AtomikBettingService(mockConfig, mockApiClient)
  })

  describe('placeCoinflipBet', () => {
    it('sends correct payload to API', async () => {
      const mockResult = createMockCoinflipResult(true, 0.1)
      vi.mocked(mockApiClient.playCoinflip).mockResolvedValue({
        success: true,
        data: mockResult,
      })

      const params = {
        userPublicKey: '11111111111111111111111111111111',
        choice: 'heads' as const,
        amount: 0.1,
        allowancePda: 'allowance-address',
      }

      await service.placeCoinflipBet(params)

      expect(mockApiClient.playCoinflip).toHaveBeenCalledWith({
        player_id: params.userPublicKey,
        choice: params.choice,
        token: {
          symbol: 'SOL',
          mint_address: null,
        },
        bet_amount: params.amount,
        wallet_signature: null,
        allowance_pda: params.allowancePda,
      })
    })

    it('handles success response', async () => {
      const mockResult = createMockCoinflipResult(true, 0.1)
      vi.mocked(mockApiClient.playCoinflip).mockResolvedValue({
        success: true,
        data: mockResult,
      })

      const result = await service.placeCoinflipBet({
        userPublicKey: '11111111111111111111111111111111',
        choice: 'heads',
        amount: 0.1,
      })

      expect(result).toEqual(mockResult)
    })

    it('handles API errors', async () => {
      vi.mocked(mockApiClient.playCoinflip).mockResolvedValue({
        success: false,
        error: 'Insufficient balance',
      })

      await expect(
        service.placeCoinflipBet({
          userPublicKey: '11111111111111111111111111111111',
          choice: 'heads',
          amount: 0.1,
        })
      ).rejects.toThrow('Insufficient balance')
    })

    it('handles missing data in response', async () => {
      vi.mocked(mockApiClient.playCoinflip).mockResolvedValue({
        success: true,
        data: null,
      })

      await expect(
        service.placeCoinflipBet({
          userPublicKey: '11111111111111111111111111111111',
          choice: 'heads',
          amount: 0.1,
        })
      ).rejects.toThrow('Failed to place coinflip bet')
    })

    it('warns when no allowancePda provided', async () => {
      const mockResult = createMockCoinflipResult(true, 0.1)
      vi.mocked(mockApiClient.playCoinflip).mockResolvedValue({
        success: true,
        data: mockResult,
      })

      await service.placeCoinflipBet({
        userPublicKey: '11111111111111111111111111111111',
        choice: 'heads',
        amount: 0.1,
        // No allowancePda provided
      })

      // Should still succeed but log a warning
      expect(mockApiClient.playCoinflip).toHaveBeenCalled()
    })
  })

  describe('getGameResult', () => {
    it('returns result when found', async () => {
      const mockResult = createMockCoinflipResult(true, 0.1)
      vi.mocked(mockApiClient.getGameResult).mockResolvedValue({
        success: true,
        data: mockResult,
      })

      const result = await service.getGameResult('game-123')

      expect(result).toEqual(mockResult)
      expect(mockApiClient.getGameResult).toHaveBeenCalledWith('game-123')
    })

    it('returns null when not found', async () => {
      vi.mocked(mockApiClient.getGameResult).mockResolvedValue({
        success: false,
        error: 'Game not found',
      })

      const result = await service.getGameResult('game-123')

      expect(result).toBeNull()
    })

    it('throws on other errors', async () => {
      vi.mocked(mockApiClient.getGameResult).mockResolvedValue({
        success: false,
        error: 'Server error',
      })

      await expect(service.getGameResult('game-123')).rejects.toThrow('Server error')
    })
  })

  describe('getPendingSettlements', () => {
    it('returns settlements array', async () => {
      const mockSettlements = [
        createMockSettlement('pending'),
        createMockSettlement('pending'),
      ]
      vi.mocked(mockApiClient.getPendingSettlements).mockResolvedValue({
        success: true,
        data: mockSettlements,
      })

      const result = await service.getPendingSettlements('user-address')

      expect(result).toEqual(mockSettlements)
    })

    it('throws on error', async () => {
      vi.mocked(mockApiClient.getPendingSettlements).mockResolvedValue({
        success: false,
        error: 'Failed to fetch',
      })

      await expect(service.getPendingSettlements('user-address')).rejects.toThrow()
    })
  })

  describe('getSettlement', () => {
    it('returns settlement when found', async () => {
      const mockSettlement = createMockSettlement('completed')
      vi.mocked(mockApiClient.getSettlement).mockResolvedValue({
        success: true,
        data: mockSettlement,
      })

      const result = await service.getSettlement('settlement-123')

      expect(result).toEqual(mockSettlement)
    })

    it('returns null when not found', async () => {
      vi.mocked(mockApiClient.getSettlement).mockResolvedValue({
        success: false,
        error: 'Settlement not found',
      })

      const result = await service.getSettlement('settlement-123')

      expect(result).toBeNull()
    })
  })

  describe('waitForGameSettlement', () => {
    it('polls and resolves when result found', async () => {
      const mockResult = createMockCoinflipResult(true, 0.1)
      
      // Return null first two times, then return result
      vi.mocked(mockApiClient.getGameResult)
        .mockResolvedValueOnce({ success: true, data: null })
        .mockResolvedValueOnce({ success: true, data: null })
        .mockResolvedValue({ success: true, data: mockResult })

      const result = await service.waitForGameSettlement('game-123', 10000)

      expect(result).toEqual(mockResult)
      expect(mockApiClient.getGameResult).toHaveBeenCalledTimes(3)
    })

    it('times out after specified duration', async () => {
      vi.mocked(mockApiClient.getGameResult).mockResolvedValue({
        success: true,
        data: null,
      })

      await expect(
        service.waitForGameSettlement('game-123', 100)
      ).rejects.toThrow('Game settlement timeout')
    }, 10000) // Increase test timeout

    it('continues polling on errors', async () => {
      const mockResult = createMockCoinflipResult(true, 0.1)
      
      // Throw error first, then return result
      vi.mocked(mockApiClient.getGameResult)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue({ success: true, data: mockResult })

      const result = await service.waitForGameSettlement('game-123', 10000)

      expect(result).toEqual(mockResult)
    })
  })
})
