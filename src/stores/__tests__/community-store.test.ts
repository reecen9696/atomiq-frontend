/**
 * Community Store Tests
 * Tests for community game store in src/stores/community-store.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useCommunityStore } from '../community-store'
import { communityGamesApi } from '@/services/community-games-api'

// Mock the API
vi.mock('@/services/community-games-api', () => ({
  communityGamesApi: {
    fetchGames: vi.fn(),
    searchGames: vi.fn(),
    fetchGameDetails: vi.fn(),
    fetchDeveloperProfile: vi.fn(),
    submitGame: vi.fn(),
    rateGame: vi.fn(),
  },
}))

describe('community-store', () => {
  beforeEach(() => {
    // Reset store before each test
    useCommunityStore.getState().reset()
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('has empty games list', () => {
      const state = useCommunityStore.getState()
      expect(state.games).toEqual([])
      expect(state.filteredGames).toEqual([])
      expect(state.totalGames).toBe(0)
    })

    it('starts at page 1', () => {
      const state = useCommunityStore.getState()
      expect(state.currentPage).toBe(1)
      expect(state.gamesPerPage).toBe(12)
    })

    it('has default sort and filter', () => {
      const state = useCommunityStore.getState()
      expect(state.sortBy).toBe('popular')
      expect(state.filterStatus).toBe('all')
      expect(state.searchQuery).toBe('')
    })

    it('has no loading or errors', () => {
      const state = useCommunityStore.getState()
      expect(state.loading).toBe(false)
      expect(state.error).toBeNull()
      expect(state.submitting).toBe(false)
    })
  })

  describe('fetchGames', () => {
    it('populates games from API', async () => {
      const mockResponse = {
        data: [
          { id: '1', name: 'Game 1' },
          { id: '2', name: 'Game 2' },
        ],
        total: 2,
        page: 1,
        hasNext: false,
        hasPrevious: false,
      }
      
      vi.mocked(communityGamesApi.fetchGames).mockResolvedValue(mockResponse)
      
      await useCommunityStore.getState().fetchGames()
      
      const state = useCommunityStore.getState()
      expect(state.games).toEqual(mockResponse.data)
      expect(state.totalGames).toBe(2)
      expect(state.loading).toBe(false)
    })

    it('handles fetch errors', async () => {
      vi.mocked(communityGamesApi.fetchGames).mockRejectedValue(new Error('API Error'))
      
      await useCommunityStore.getState().fetchGames()
      
      const state = useCommunityStore.getState()
      expect(state.error).toBeTruthy()
      expect(state.loading).toBe(false)
    })

    it('sets loading state during fetch', async () => {
      vi.mocked(communityGamesApi.fetchGames).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          data: [],
          total: 0,
          page: 1,
          hasNext: false,
          hasPrevious: false,
        }), 100))
      )
      
      const fetchPromise = useCommunityStore.getState().fetchGames()
      expect(useCommunityStore.getState().loading).toBe(true)
      await fetchPromise
    })
  })

  describe('searchGames', () => {
    it('filters games by query', async () => {
      const mockResponse = {
        data: [{ id: '1', name: 'Matching Game' }],
        total: 1,
        page: 1,
        hasNext: false,
        hasPrevious: false,
      }
      
      vi.mocked(communityGamesApi.searchGames).mockResolvedValue(mockResponse)
      
      await useCommunityStore.getState().searchGames('match')
      
      const state = useCommunityStore.getState()
      expect(state.searchQuery).toBe('match')
      expect(state.filteredGames).toEqual(mockResponse.data)
    })

    it('fetches all games when query is empty', async () => {
      const mockResponse = {
        data: [],
        total: 0,
        page: 1,
        hasNext: false,
        hasPrevious: false,
      }
      
      vi.mocked(communityGamesApi.fetchGames).mockResolvedValue(mockResponse)
      
      await useCommunityStore.getState().searchGames('')
      
      expect(communityGamesApi.fetchGames).toHaveBeenCalled()
      expect(communityGamesApi.searchGames).not.toHaveBeenCalled()
    })
  })

  describe('setSortBy', () => {
    it('changes sort option and refetches', async () => {
      vi.mocked(communityGamesApi.fetchGames).mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        hasNext: false,
        hasPrevious: false,
      })
      
      useCommunityStore.getState().setSortBy('newest')
      
      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 0))
      
      expect(useCommunityStore.getState().sortBy).toBe('newest')
      expect(communityGamesApi.fetchGames).toHaveBeenCalled()
    })
  })

  describe('setFilterStatus', () => {
    it('changes filter and refetches', async () => {
      vi.mocked(communityGamesApi.fetchGames).mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        hasNext: false,
        hasPrevious: false,
      })
      
      useCommunityStore.getState().setFilterStatus('verified')
      
      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 0))
      
      expect(useCommunityStore.getState().filterStatus).toBe('verified')
      expect(communityGamesApi.fetchGames).toHaveBeenCalled()
    })
  })

  describe('pagination', () => {
    beforeEach(() => {
      useCommunityStore.setState({
        hasNextPage: true,
        hasPreviousPage: true,
        currentPage: 2,
      })
      
      vi.mocked(communityGamesApi.fetchGames).mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        hasNext: false,
        hasPrevious: false,
      })
    })

    it('nextPage increments page', async () => {
      useCommunityStore.getState().nextPage()
      
      await new Promise(resolve => setTimeout(resolve, 0))
      
      expect(communityGamesApi.fetchGames).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        3,
        expect.anything()
      )
    })

    it('previousPage decrements page', async () => {
      useCommunityStore.getState().previousPage()
      
      await new Promise(resolve => setTimeout(resolve, 0))
      
      expect(communityGamesApi.fetchGames).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        1,
        expect.anything()
      )
    })

    it('nextPage does nothing when hasNextPage is false', () => {
      useCommunityStore.setState({ hasNextPage: false })
      useCommunityStore.getState().nextPage()
      
      expect(communityGamesApi.fetchGames).not.toHaveBeenCalled()
    })

    it('previousPage does nothing when hasPreviousPage is false', () => {
      useCommunityStore.setState({ hasPreviousPage: false })
      useCommunityStore.getState().previousPage()
      
      expect(communityGamesApi.fetchGames).not.toHaveBeenCalled()
    })
  })

  describe('reset', () => {
    it('restores initial state', () => {
      // Modify state
      useCommunityStore.setState({
        games: [{ id: '1' }] as any,
        currentPage: 5,
        searchQuery: 'test',
        loading: true,
        error: 'Some error',
      })
      
      // Reset
      useCommunityStore.getState().reset()
      
      const state = useCommunityStore.getState()
      expect(state.games).toEqual([])
      expect(state.currentPage).toBe(1)
      expect(state.searchQuery).toBe('')
      expect(state.loading).toBe(false)
      expect(state.error).toBeNull()
    })
  })
})
