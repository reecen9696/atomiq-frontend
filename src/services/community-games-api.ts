/**
 * Community Games API Service
 * Mock API service for community game store
 * Ready to be connected to real backend later
 */

import type {
  CommunityGameConfig,
  GameDeveloper,
  GameSubmission,
  GameSortOption,
  GameFilterStatus,
  MathVerificationReport,
} from '@/types/community-games';
import { COMMUNITY_GAME_SECURITY } from '@/config/community-security';

/**
 * Paginated API Response
 */
interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * API Response
 */
interface ApiResponse<T> {
  data: T;
  success: boolean;
  message: string;
}

/**
 * Mock delay to simulate network latency
 */
const mockDelay = (ms: number = 300) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Mock Developers
 */
const mockDevelopers: GameDeveloper[] = [
  {
    id: 'dev-1',
    walletAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    displayName: 'CryptoGamer',
    avatarUrl: '/brand/pfp.png',
    gamesPublished: 3,
    totalPlays: 15420,
    joinedAt: '2024-01-15T00:00:00Z',
    verified: true,
  },
  {
    id: 'dev-2',
    walletAddress: '9xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    displayName: 'BlockchainDev',
    avatarUrl: '/brand/pfp.png',
    gamesPublished: 2,
    totalPlays: 8932,
    joinedAt: '2024-02-20T00:00:00Z',
    verified: true,
  },
  {
    id: 'dev-3',
    walletAddress: '5xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    displayName: 'IndieGameMaker',
    avatarUrl: '/brand/pfp.png',
    gamesPublished: 1,
    totalPlays: 1245,
    joinedAt: '2025-01-05T00:00:00Z',
    verified: false,
  },
  {
    id: 'dev-4',
    walletAddress: '3xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    displayName: 'SolanaBuilder',
    avatarUrl: '/brand/pfp.png',
    gamesPublished: 4,
    totalPlays: 22103,
    joinedAt: '2023-11-10T00:00:00Z',
    verified: true,
  },
];

/**
 * Mock Verification Reports
 */
const mockVerificationReports: Record<string, MathVerificationReport> = {
  'comm-dice-001': {
    passed: true,
    simulationRounds: 1_000_000,
    declaredRTP: 0.97,
    actualRTP: 0.9695,
    deviation: 0.0005,
    maxPayoutObserved: 990,
    varianceAnalysis: {
      standardDeviation: 12.3,
      maxDrawdown: -156.2,
      profitDistribution: Array(100).fill(0).map((_, i) => Math.random() * 100),
    },
    securityChecks: {
      noLocalRNG: true,
      noExternalNetwork: true,
      noEvalUsage: true,
      noDOMAccess: true,
      cspCompliant: true,
      dependenciesAudited: true,
    },
    timestamp: '2025-01-10T12:00:00Z',
    verifierVersion: 'v1.2.0',
  },
  'comm-mines-001': {
    passed: true,
    simulationRounds: 2_000_000,
    declaredRTP: 0.96,
    actualRTP: 0.9598,
    deviation: 0.0002,
    maxPayoutObserved: 850,
    varianceAnalysis: {
      standardDeviation: 15.7,
      maxDrawdown: -189.4,
      profitDistribution: Array(100).fill(0).map((_, i) => Math.random() * 100),
    },
    securityChecks: {
      noLocalRNG: true,
      noExternalNetwork: true,
      noEvalUsage: true,
      noDOMAccess: true,
      cspCompliant: true,
      dependenciesAudited: true,
    },
    timestamp: '2025-01-08T14:30:00Z',
    verifierVersion: 'v1.2.0',
  },
};

/**
 * Mock Community Games
 */
const mockCommunityGames: CommunityGameConfig[] = [
  {
    id: 'comm-dice-001',
    slug: 'comm-dice-001',
    title: 'Hyper Dice',
    description: 'Roll the dice with customizable multipliers and instant payouts',
    image: '/games/game1.png',
    category: 'classic',
    minBet: 0.01,
    maxBet: 50,
    enabled: true,
    featured: true,
    route: '/community/comm-dice-001',
    developer: mockDevelopers[0],
    version: '1.2.0',
    bundleUrl: '/community/bundles/hyper-dice.js',
    bundleHash: 'sha256-abc123def456...',
    declaredRTP: 0.97,
    maxMultiplier: 100,
    verificationStatus: 'approved',
    verificationReport: mockVerificationReports['comm-dice-001'],
    totalBets: 15420,
    uniquePlayers7d: 892,
    averageSessionSeconds: 420,
    playerRating: 4.7,
    ratingCount: 234,
    returnPlayerRate: 0.68,
    popularityScore: 87.5,
    submittedAt: '2024-12-01T00:00:00Z',
    publishedAt: '2024-12-05T00:00:00Z',
    lastUpdatedAt: '2025-01-15T00:00:00Z',
    developerRevenueShare: 0.10,
    isCommunityGame: true,
  },
  {
    id: 'comm-mines-001',
    slug: 'comm-mines-001',
    title: 'Crypto Mines',
    description: 'Navigate the minefield and cash out before it\'s too late',
    image: '/games/game5.png',
    category: 'arcade',
    minBet: 0.05,
    maxBet: 100,
    enabled: true,
    featured: true,
    route: '/community/comm-mines-001',
    developer: mockDevelopers[1],
    version: '2.0.1',
    bundleUrl: '/community/bundles/crypto-mines.js',
    bundleHash: 'sha256-xyz789ghi012...',
    declaredRTP: 0.96,
    maxMultiplier: 85,
    verificationStatus: 'approved',
    verificationReport: mockVerificationReports['comm-mines-001'],
    totalBets: 8932,
    uniquePlayers7d: 564,
    averageSessionSeconds: 380,
    playerRating: 4.5,
    ratingCount: 178,
    returnPlayerRate: 0.62,
    popularityScore: 79.3,
    submittedAt: '2024-11-15T00:00:00Z',
    publishedAt: '2024-11-20T00:00:00Z',
    lastUpdatedAt: '2025-01-10T00:00:00Z',
    developerRevenueShare: 0.10,
    isCommunityGame: true,
  },
  {
    id: 'comm-limbo-001',
    slug: 'comm-limbo-001',
    title: 'Limbo Extreme',
    description: 'How low can you go? Set your target and test your luck',
    image: '/games/game6.png',
    category: 'arcade',
    minBet: 0.01,
    maxBet: 75,
    enabled: true,
    featured: false,
    route: '/community/comm-limbo-001',
    developer: mockDevelopers[3],
    version: '1.0.3',
    bundleUrl: '/community/bundles/limbo-extreme.js',
    bundleHash: 'sha256-mno345pqr678...',
    declaredRTP: 0.98,
    maxMultiplier: 1000,
    verificationStatus: 'approved',
    totalBets: 22103,
    uniquePlayers7d: 1245,
    averageSessionSeconds: 510,
    playerRating: 4.9,
    ratingCount: 456,
    returnPlayerRate: 0.75,
    popularityScore: 92.8,
    submittedAt: '2024-10-05T00:00:00Z',
    publishedAt: '2024-10-10T00:00:00Z',
    lastUpdatedAt: '2025-01-12T00:00:00Z',
    developerRevenueShare: 0.10,
    isCommunityGame: true,
  },
  {
    id: 'comm-wheel-001',
    slug: 'comm-wheel-001',
    title: 'Lucky Wheel',
    description: 'Spin the wheel of fortune for massive multipliers',
    image: '/games/game3.png',
    category: 'classic',
    minBet: 0.02,
    maxBet: 40,
    enabled: true,
    featured: false,
    route: '/community/comm-wheel-001',
    developer: mockDevelopers[1],
    version: '1.5.0',
    bundleUrl: '/community/bundles/lucky-wheel.js',
    bundleHash: 'sha256-stu901vwx234...',
    declaredRTP: 0.95,
    maxMultiplier: 50,
    verificationStatus: 'approved',
    totalBets: 6743,
    uniquePlayers7d: 421,
    averageSessionSeconds: 340,
    playerRating: 4.3,
    ratingCount: 145,
    returnPlayerRate: 0.58,
    popularityScore: 71.2,
    submittedAt: '2024-12-10T00:00:00Z',
    publishedAt: '2024-12-15T00:00:00Z',
    lastUpdatedAt: '2025-01-08T00:00:00Z',
    developerRevenueShare: 0.10,
    isCommunityGame: true,
  },
  {
    id: 'comm-keno-001',
    slug: 'comm-keno-001',
    title: 'Turbo Keno',
    description: 'Pick your numbers and watch the results roll in',
    image: '/games/game2.png',
    category: 'classic',
    minBet: 0.01,
    maxBet: 30,
    enabled: false,
    featured: false,
    route: '/community/comm-keno-001',
    developer: mockDevelopers[2],
    version: '0.9.0',
    bundleUrl: '/community/bundles/turbo-keno.js',
    bundleHash: 'sha256-yza567bcd890...',
    declaredRTP: 0.94,
    maxMultiplier: 75,
    verificationStatus: 'pending',
    totalBets: 1245,
    uniquePlayers7d: 89,
    averageSessionSeconds: 280,
    playerRating: 4.0,
    ratingCount: 23,
    returnPlayerRate: 0.45,
    popularityScore: 52.1,
    submittedAt: '2025-01-20T00:00:00Z',
    lastUpdatedAt: '2025-01-20T00:00:00Z',
    developerRevenueShare: 0.10,
    isCommunityGame: true,
  },
  {
    id: 'comm-tower-001',
    slug: 'comm-tower-001',
    title: 'Tower Challenge',
    description: 'Climb the tower level by level for increasing rewards',
    image: '/games/game4.png',
    category: 'arcade',
    minBet: 0.05,
    maxBet: 60,
    enabled: false,
    featured: false,
    route: '/community/comm-tower-001',
    developer: mockDevelopers[3],
    version: '1.1.0',
    bundleUrl: '/community/bundles/tower-challenge.js',
    bundleHash: 'sha256-efg123hij456...',
    declaredRTP: 0.97,
    maxMultiplier: 120,
    verificationStatus: 'analyzing',
    totalBets: 4821,
    uniquePlayers7d: 312,
    averageSessionSeconds: 450,
    playerRating: 4.6,
    ratingCount: 98,
    returnPlayerRate: 0.64,
    popularityScore: 68.4,
    submittedAt: '2025-01-18T00:00:00Z',
    lastUpdatedAt: '2025-01-22T00:00:00Z',
    developerRevenueShare: 0.10,
    isCommunityGame: true,
  },
  {
    id: 'comm-hilo-001',
    slug: 'comm-hilo-001',
    title: 'Hi-Lo Master',
    description: 'Guess higher or lower in this classic card game',
    image: '/games/game4.png',
    category: 'table',
    minBet: 0.02,
    maxBet: 45,
    enabled: false,
    featured: false,
    route: '/community/comm-hilo-001',
    developer: mockDevelopers[0],
    version: '1.0.0',
    bundleUrl: '/community/bundles/hilo-master.js',
    bundleHash: 'sha256-klm789nop012...',
    declaredRTP: 0.99,
    maxMultiplier: 45,
    verificationStatus: 'rejected',
    totalBets: 532,
    uniquePlayers7d: 45,
    averageSessionSeconds: 220,
    playerRating: 3.8,
    ratingCount: 12,
    returnPlayerRate: 0.38,
    popularityScore: 41.5,
    submittedAt: '2025-01-25T00:00:00Z',
    lastUpdatedAt: '2025-01-28T00:00:00Z',
    developerRevenueShare: 0.10,
    isCommunityGame: true,
  },
  {
    id: 'comm-crash-001',
    slug: 'comm-crash-001',
    title: 'Moon Crash',
    description: 'Watch the multiplier soar and cash out before the crash',
    image: '/games/game6.png',
    category: 'arcade',
    minBet: 0.01,
    maxBet: 80,
    enabled: true,
    featured: true,
    route: '/community/comm-crash-001',
    developer: mockDevelopers[3],
    version: '2.1.0',
    bundleUrl: '/community/bundles/moon-crash.js',
    bundleHash: 'sha256-qrs345tuv678...',
    declaredRTP: 0.97,
    maxMultiplier: 500,
    verificationStatus: 'approved',
    totalBets: 18654,
    uniquePlayers7d: 1089,
    averageSessionSeconds: 480,
    playerRating: 4.8,
    ratingCount: 367,
    returnPlayerRate: 0.71,
    popularityScore: 89.7,
    submittedAt: '2024-11-01T00:00:00Z',
    publishedAt: '2024-11-08T00:00:00Z',
    lastUpdatedAt: '2025-01-14T00:00:00Z',
    developerRevenueShare: 0.10,
    isCommunityGame: true,
  },
];

/**
 * Community Games API Service
 */
export const communityGamesApi = {
  /**
   * Fetch community games with sorting, filtering, and pagination
   */
  async fetchGames(
    sort: GameSortOption = 'popular',
    filter: GameFilterStatus = 'all',
    page: number = 1,
    limit: number = 12,
  ): Promise<PaginatedResponse<CommunityGameConfig>> {
    await mockDelay(400);

    let filteredGames = [...mockCommunityGames];

    // Apply filters
    if (filter === 'verified') {
      filteredGames = filteredGames.filter(
        (game) => game.verificationStatus === 'approved',
      );
    } else if (filter === 'new') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      filteredGames = filteredGames.filter(
        (game) => new Date(game.submittedAt) > thirtyDaysAgo,
      );
    }

    // Apply sorting
    switch (sort) {
      case 'popular':
        filteredGames.sort((a, b) => b.popularityScore - a.popularityScore);
        break;
      case 'newest':
        filteredGames.sort(
          (a, b) =>
            new Date(b.submittedAt).getTime() -
            new Date(a.submittedAt).getTime(),
        );
        break;
      case 'top-rated':
        filteredGames.sort((a, b) => b.playerRating - a.playerRating);
        break;
      case 'most-played':
        filteredGames.sort((a, b) => b.totalBets - a.totalBets);
        break;
      case 'highest-rtp':
        filteredGames.sort((a, b) => b.declaredRTP - a.declaredRTP);
        break;
    }

    // Pagination
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedGames = filteredGames.slice(start, end);

    return {
      data: paginatedGames,
      total: filteredGames.length,
      page,
      limit,
      hasNext: end < filteredGames.length,
      hasPrevious: page > 1,
    };
  },

  /**
   * Search games by title or description
   */
  async searchGames(
    query: string,
    page: number = 1,
    limit: number = 12,
  ): Promise<PaginatedResponse<CommunityGameConfig>> {
    await mockDelay(300);

    const lowerQuery = query.toLowerCase();
    const filteredGames = mockCommunityGames.filter(
      (game) =>
        game.title.toLowerCase().includes(lowerQuery) ||
        game.description.toLowerCase().includes(lowerQuery),
    );

    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedGames = filteredGames.slice(start, end);

    return {
      data: paginatedGames,
      total: filteredGames.length,
      page,
      limit,
      hasNext: end < filteredGames.length,
      hasPrevious: page > 1,
    };
  },

  /**
   * Fetch game details by ID
   */
  async fetchGameDetails(gameId: string): Promise<ApiResponse<CommunityGameConfig>> {
    await mockDelay(200);

    const game = mockCommunityGames.find((g) => g.id === gameId);

    if (!game) {
      return {
        data: null as any,
        success: false,
        message: 'Game not found',
      };
    }

    return {
      data: game,
      success: true,
      message: 'Game retrieved successfully',
    };
  },

  /**
   * Fetch verification report for a game
   */
  async fetchVerificationReport(
    gameId: string,
  ): Promise<ApiResponse<MathVerificationReport>> {
    await mockDelay(250);

    const report = mockVerificationReports[gameId];

    if (!report) {
      return {
        data: null as any,
        success: false,
        message: 'Verification report not found',
      };
    }

    return {
      data: report,
      success: true,
      message: 'Verification report retrieved successfully',
    };
  },

  /**
   * Submit a new game
   */
  async submitGame(submission: GameSubmission): Promise<ApiResponse<string>> {
    await mockDelay(1000);

    // In a real implementation, this would upload files and create the game
    console.log('Game submission:', submission);

    return {
      data: 'comm-new-game-' + Date.now(),
      success: true,
      message: 'Game submitted successfully and is now pending verification',
    };
  },

  /**
   * Rate a game
   */
  async rateGame(
    gameId: string,
    rating: number,
  ): Promise<ApiResponse<boolean>> {
    await mockDelay(200);

    // In a real implementation, this would save the rating
    const game = mockCommunityGames.find((g) => g.id === gameId);

    if (!game) {
      return {
        data: false,
        success: false,
        message: 'Game not found',
      };
    }

    // Update mock rating (in-memory only)
    game.playerRating =
      (game.playerRating * game.ratingCount + rating) / (game.ratingCount + 1);
    game.ratingCount += 1;

    return {
      data: true,
      success: true,
      message: 'Rating submitted successfully',
    };
  },

  /**
   * Fetch developer profile
   */
  async fetchDeveloperProfile(
    walletAddress: string,
  ): Promise<ApiResponse<GameDeveloper>> {
    await mockDelay(200);

    const developer = mockDevelopers.find(
      (dev) => dev.walletAddress === walletAddress,
    );

    if (!developer) {
      return {
        data: null as any,
        success: false,
        message: 'Developer not found',
      };
    }

    return {
      data: developer,
      success: true,
      message: 'Developer profile retrieved successfully',
    };
  },

  /**
   * Get SDK endpoints information
   */
  async fetchSDKEndpoints(): Promise<ApiResponse<any>> {
    await mockDelay(100);

    return {
      data: {
        endpoints: COMMUNITY_GAME_SECURITY.ALLOWED_ENDPOINTS,
        version: 'v1.0.0',
        documentation: '/community/developers',
      },
      success: true,
      message: 'SDK endpoints retrieved successfully',
    };
  },
};
