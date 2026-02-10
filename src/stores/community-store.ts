/**
 * Community Game Store
 * Zustand store for managing community game state
 */

import { create } from 'zustand';
import type {
  CommunityGameConfig,
  GameDeveloper,
  GameSubmission,
  GameSortOption,
  GameFilterStatus,
  DEFAULT_POPULARITY_WEIGHTS,
} from '@/types/community-games';
import { communityGamesApi } from '@/services/community-games-api';
import { logger } from '@/lib/logger';

interface CommunityState {
  // Game list state
  games: CommunityGameConfig[];
  filteredGames: CommunityGameConfig[];
  totalGames: number;
  currentPage: number;
  gamesPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;

  // Filters & sorting
  sortBy: GameSortOption;
  filterStatus: GameFilterStatus;
  searchQuery: string;

  // Selected game
  selectedGame: CommunityGameConfig | null;

  // Developer profile
  selectedDeveloper: GameDeveloper | null;

  // Loading & error states
  loading: boolean;
  error: string | null;
  submitting: boolean;

  // Actions
  fetchGames: (page?: number) => Promise<void>;
  searchGames: (query: string) => Promise<void>;
  setSortBy: (sort: GameSortOption) => void;
  setFilterStatus: (filter: GameFilterStatus) => void;
  setSearchQuery: (query: string) => void;
  fetchGameDetails: (gameId: string) => Promise<void>;
  fetchDeveloperProfile: (walletAddress: string) => Promise<void>;
  submitGame: (submission: GameSubmission) => Promise<boolean>;
  rateGame: (gameId: string, rating: number) => Promise<boolean>;
  computePopularityScore: (game: CommunityGameConfig) => number;
  nextPage: () => void;
  previousPage: () => void;
  reset: () => void;
}

const INITIAL_STATE = {
  games: [],
  filteredGames: [],
  totalGames: 0,
  currentPage: 1,
  gamesPerPage: 12,
  hasNextPage: false,
  hasPreviousPage: false,
  sortBy: 'popular' as GameSortOption,
  filterStatus: 'all' as GameFilterStatus,
  searchQuery: '',
  selectedGame: null,
  selectedDeveloper: null,
  loading: false,
  error: null,
  submitting: false,
};

/**
 * Community Store
 */
export const useCommunityStore = create<CommunityState>((set, get) => ({
  ...INITIAL_STATE,

  /**
   * Fetch games with current filters/sort
   */
  fetchGames: async (page?: number) => {
    const state = get();
    const currentPage = page !== undefined ? page : state.currentPage;

    set({ loading: true, error: null });

    try {
      const response = await communityGamesApi.fetchGames(
        state.sortBy,
        state.filterStatus,
        currentPage,
        state.gamesPerPage,
      );

      set({
        games: response.data,
        filteredGames: response.data,
        totalGames: response.total,
        currentPage: response.page,
        hasNextPage: response.hasNext,
        hasPreviousPage: response.hasPrevious,
        loading: false,
      });
    } catch (error) {
      logger.error('Failed to fetch community games:', error);
      set({
        error: 'Failed to load games. Please try again.',
        loading: false,
      });
    }
  },

  /**
   * Search games by query
   */
  searchGames: async (query: string) => {
    set({ loading: true, error: null, searchQuery: query });

    try {
      if (!query.trim()) {
        // If query is empty, fetch all games
        await get().fetchGames(1);
        return;
      }

      const response = await communityGamesApi.searchGames(
        query,
        1,
        get().gamesPerPage,
      );

      set({
        filteredGames: response.data,
        totalGames: response.total,
        currentPage: response.page,
        hasNextPage: response.hasNext,
        hasPreviousPage: response.hasPrevious,
        loading: false,
      });
    } catch (error) {
      logger.error('Failed to search games:', error);
      set({
        error: 'Failed to search games. Please try again.',
        loading: false,
      });
    }
  },

  /**
   * Set sort option and refetch
   */
  setSortBy: (sort: GameSortOption) => {
    set({ sortBy: sort, currentPage: 1 });
    get().fetchGames(1);
  },

  /**
   * Set filter status and refetch
   */
  setFilterStatus: (filter: GameFilterStatus) => {
    set({ filterStatus: filter, currentPage: 1 });
    get().fetchGames(1);
  },

  /**
   * Set search query (without fetching)
   */
  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  /**
   * Fetch game details by ID
   */
  fetchGameDetails: async (gameId: string) => {
    set({ loading: true, error: null });

    try {
      const response = await communityGamesApi.fetchGameDetails(gameId);

      if (!response.success) {
        throw new Error(response.message);
      }

      set({
        selectedGame: response.data,
        loading: false,
      });
    } catch (error) {
      logger.error('Failed to fetch game details:', error);
      set({
        error: 'Failed to load game details. Please try again.',
        loading: false,
      });
    }
  },

  /**
   * Fetch developer profile
   */
  fetchDeveloperProfile: async (walletAddress: string) => {
    set({ loading: true, error: null });

    try {
      const response = await communityGamesApi.fetchDeveloperProfile(
        walletAddress,
      );

      if (!response.success) {
        throw new Error(response.message);
      }

      set({
        selectedDeveloper: response.data,
        loading: false,
      });
    } catch (error) {
      logger.error('Failed to fetch developer profile:', error);
      set({
        error: 'Failed to load developer profile. Please try again.',
        loading: false,
      });
    }
  },

  /**
   * Submit a new game
   */
  submitGame: async (submission: GameSubmission): Promise<boolean> => {
    set({ submitting: true, error: null });

    try {
      const response = await communityGamesApi.submitGame(submission);

      if (!response.success) {
        throw new Error(response.message);
      }

      set({ submitting: false });
      return true;
    } catch (error) {
      logger.error('Failed to submit game:', error);
      set({
        error: 'Failed to submit game. Please try again.',
        submitting: false,
      });
      return false;
    }
  },

  /**
   * Rate a game
   */
  rateGame: async (gameId: string, rating: number): Promise<boolean> => {
    try {
      const response = await communityGamesApi.rateGame(gameId, rating);

      if (!response.success) {
        throw new Error(response.message);
      }

      // Update the game in the local state
      const state = get();
      if (state.selectedGame?.id === gameId) {
        const updatedGame = { ...state.selectedGame };
        updatedGame.playerRating =
          (updatedGame.playerRating * updatedGame.ratingCount + rating) /
          (updatedGame.ratingCount + 1);
        updatedGame.ratingCount += 1;
        set({ selectedGame: updatedGame });
      }

      return true;
    } catch (error) {
      logger.error('Failed to rate game:', error);
      set({ error: 'Failed to submit rating. Please try again.' });
      return false;
    }
  },

  /**
   * Compute popularity score for a game
   */
  computePopularityScore: (game: CommunityGameConfig): number => {
    const weights = {
      totalBets: 0.30,
      uniquePlayers7d: 0.25,
      avgSessionLength: 0.15,
      playerRating: 0.15,
      returnPlayerRate: 0.10,
      recencyBoost: 0.05,
    };

    // Normalize each metric (0-100 scale)
    const normalizedBets = Math.min((game.totalBets / 30000) * 100, 100);
    const normalizedPlayers = Math.min(
      (game.uniquePlayers7d / 2000) * 100,
      100,
    );
    const normalizedSession = Math.min(
      (game.averageSessionSeconds / 600) * 100,
      100,
    );
    const normalizedRating = (game.playerRating / 5) * 100;
    const normalizedReturn = game.returnPlayerRate * 100;

    // Recency boost (more recent = higher score)
    const daysSincePublished = game.publishedAt
      ? (Date.now() - new Date(game.publishedAt).getTime()) /
        (1000 * 60 * 60 * 24)
      : 999;
    const recencyScore = Math.max(100 - daysSincePublished, 0);

    // Weighted sum
    const popularityScore =
      normalizedBets * weights.totalBets +
      normalizedPlayers * weights.uniquePlayers7d +
      normalizedSession * weights.avgSessionLength +
      normalizedRating * weights.playerRating +
      normalizedReturn * weights.returnPlayerRate +
      recencyScore * weights.recencyBoost;

    return Math.round(popularityScore * 10) / 10;
  },

  /**
   * Go to next page
   */
  nextPage: () => {
    const state = get();
    if (state.hasNextPage) {
      get().fetchGames(state.currentPage + 1);
    }
  },

  /**
   * Go to previous page
   */
  previousPage: () => {
    const state = get();
    if (state.hasPreviousPage) {
      get().fetchGames(state.currentPage - 1);
    }
  },

  /**
   * Reset store to initial state
   */
  reset: () => {
    set(INITIAL_STATE);
  },
}));
