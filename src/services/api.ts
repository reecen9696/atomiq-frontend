import { env } from "@/config/env";
import type { Winner } from "@/types/winner";
import type { StatCard } from "@/types/stat-card";
import type { Block } from "@/mocks/blocks";

/**
 * API Client Configuration
 * Base setup for HTTP requests to the backend
 */

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Base fetch wrapper with error handling
 */
async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const url = `${env.apiUrl}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new ApiError(
        errorData?.message || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData,
      );
    }

    return response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : "Network request failed",
      0,
    );
  }
}

/**
 * API Service Layer
 * All backend API calls should be defined here
 */

export const api = {
  // Winners
  winners: {
    /**
     * Fetch recent winners
     * GET /api/winners/recent
     */
    getRecent: async (limit = 8): Promise<Winner[]> => {
      // TODO: Implement actual API call
      // return fetchApi<Winner[]>(`/api/winners/recent?limit=${limit}`);
      throw new Error("API endpoint not implemented");
    },
  },

  // Stats
  stats: {
    /**
     * Fetch current stats
     * GET /api/stats
     */
    getCurrent: async (): Promise<StatCard[]> => {
      // TODO: Implement actual API call
      // return fetchApi<StatCard[]>("/api/stats");
      throw new Error("API endpoint not implemented");
    },
  },

  // Blocks
  blocks: {
    /**
     * Fetch recent blocks
     * GET /api/blocks/recent
     */
    getRecent: async (limit = 5): Promise<Block[]> => {
      // TODO: Implement actual API call
      // return fetchApi<Block[]>(`/api/blocks/recent?limit=${limit}`);
      throw new Error("API endpoint not implemented");
    },

    /**
     * Fetch block by number
     * GET /api/blocks/:blockNumber
     */
    getByNumber: async (blockNumber: number): Promise<Block> => {
      // TODO: Implement actual API call
      // return fetchApi<Block>(`/api/blocks/${blockNumber}`);
      throw new Error("API endpoint not implemented");
    },
  },

  // Games (scaffold for future use)
  games: {
    /**
     * Fetch all games
     * GET /api/games
     */
    getAll: async () => {
      // TODO: Implement actual API call
      throw new Error("API endpoint not implemented");
    },

    /**
     * Fetch game by ID
     * GET /api/games/:id
     */
    getById: async (id: string) => {
      // TODO: Implement actual API call
      throw new Error("API endpoint not implemented");
    },
  },
};

export { ApiError };
export type { Winner, StatCard, Block };
