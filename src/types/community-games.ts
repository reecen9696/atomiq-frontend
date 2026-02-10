/**
 * Community Game Store Types
 * Comprehensive type definitions for the community game platform
 */

/**
 * Developer Profile
 */
export interface GameDeveloper {
  id: string;
  walletAddress: string;
  displayName: string;
  avatarUrl?: string;
  gamesPublished: number;
  totalPlays: number;
  joinedAt: string;
  verified: boolean;
}

/**
 * Math Verification Report
 */
export interface MathVerificationReport {
  passed: boolean;
  simulationRounds: number;
  declaredRTP: number;
  actualRTP: number;
  deviation: number;
  maxPayoutObserved: number;
  varianceAnalysis: {
    standardDeviation: number;
    maxDrawdown: number;
    profitDistribution: number[];
  };
  securityChecks: {
    noLocalRNG: boolean;
    noExternalNetwork: boolean;
    noEvalUsage: boolean;
    noDOMAccess: boolean;
    cspCompliant: boolean;
    dependenciesAudited: boolean;
  };
  timestamp: string;
  verifierVersion: string;
}

/**
 * Community Game Configuration
 * Extends the base GameConfig with community-specific fields
 */
export interface CommunityGameConfig {
  // Base fields (from GameConfig)
  id: string;
  slug: string;
  title: string;
  description: string;
  image: string;
  category: string;
  minBet: number;
  maxBet: number;
  enabled: boolean;
  featured: boolean;
  route: string;

  // Community-specific fields
  developer: GameDeveloper;
  version: string;
  bundleUrl: string;
  bundleHash: string;
  declaredRTP: number;
  maxMultiplier: number;

  // Verification status
  verificationStatus: 'pending' | 'analyzing' | 'approved' | 'rejected' | 'suspended';
  verificationReport?: MathVerificationReport;

  // Popularity metrics
  totalBets: number;
  uniquePlayers7d: number;
  averageSessionSeconds: number;
  playerRating: number;
  ratingCount: number;
  returnPlayerRate: number;
  popularityScore: number;

  // Timestamps
  submittedAt: string;
  publishedAt?: string;
  lastUpdatedAt: string;

  // Revenue
  developerRevenueShare: number;

  // Flags
  isCommunityGame: true;
}

/**
 * Game Submission Request
 */
export interface GameSubmission {
  title: string;
  description: string;
  category: string;
  thumbnailFile: File;
  bundleFile: File;
  declaredRTP: number;
  maxMultiplier: number;
  minBet: number;
  maxBet: number;
  sourceCodeUrl?: string;
}

/**
 * Sort Options for Community Games
 */
export type GameSortOption = 
  | 'popular' 
  | 'newest' 
  | 'top-rated' 
  | 'most-played' 
  | 'highest-rtp';

/**
 * Filter Status for Community Games
 */
export type GameFilterStatus = 'all' | 'verified' | 'new';

/**
 * Popularity Ranking Weights
 */
export interface PopularityWeights {
  totalBets: number;
  uniquePlayers7d: number;
  avgSessionLength: number;
  playerRating: number;
  returnPlayerRate: number;
  recencyBoost: number;
}

/**
 * Default Popularity Weights
 */
export const DEFAULT_POPULARITY_WEIGHTS: PopularityWeights = {
  totalBets: 0.30,
  uniquePlayers7d: 0.25,
  avgSessionLength: 0.15,
  playerRating: 0.15,
  returnPlayerRate: 0.10,
  recencyBoost: 0.05,
};
