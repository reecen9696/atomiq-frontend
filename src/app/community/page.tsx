/**
 * Community Store Main Page
 * Browse and discover community games
 */

'use client';

import { useEffect, useState } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { CommunityStoreHeader } from '@/components/community/community-store-header';
import { GameCard } from '@/components/community/game-card';
import { PopularitySort } from '@/components/community/popularity-sort';
import { useCommunityStore } from '@/stores/community-store';
import type { GameFilterStatus } from '@/types/community-games';

export default function CommunityStorePage() {
  const {
    filteredGames,
    loading,
    error,
    sortBy,
    filterStatus,
    searchQuery,
    currentPage,
    hasNextPage,
    hasPreviousPage,
    fetchGames,
    searchGames,
    setSortBy,
    setFilterStatus,
    setSearchQuery,
    nextPage,
    previousPage,
  } = useCommunityStore();

  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (localSearchQuery.trim()) {
      searchGames(localSearchQuery);
    } else {
      fetchGames(1);
    }
  };

  const handleFilterChange = (filter: GameFilterStatus) => {
    setFilterStatus(filter);
  };

  return (
    <div className="min-h-screen bg-casino-bg px-4 py-8 sm:px-6 lg:px-10 2xl:px-12">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <CommunityStoreHeader />

        {/* Search and Filters */}
        <div className="mt-8 space-y-4" id="games">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative">
            <div className="relative">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
                size={20}
              />
              <input
                type="text"
                value={localSearchQuery}
                onChange={(e) => setLocalSearchQuery(e.target.value)}
                placeholder="Search games..."
                className="w-full rounded-sm border border-casino-border bg-casino-card py-3 pl-12 pr-4 text-white placeholder-white/40 focus:border-primary-purple focus:outline-none"
              />
            </div>
          </form>

          {/* Filters and Sort */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Filter Tabs */}
            <div className="flex gap-2">
              {(['all', 'verified', 'new'] as GameFilterStatus[]).map((filter) => (
                <button
                  key={filter}
                  onClick={() => handleFilterChange(filter)}
                  className={`rounded-sm px-4 py-2 text-sm font-medium transition-colors ${
                    filterStatus === filter
                      ? 'bg-primary-purple text-white'
                      : 'bg-casino-card text-white/70 hover:bg-white/5'
                  }`}
                >
                  {filter === 'all'
                    ? 'All Games'
                    : filter === 'verified'
                    ? 'Verified'
                    : 'New'}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <PopularitySort value={sortBy} onChange={setSortBy} />
          </div>
        </div>

        {/* Games Grid */}
        <div className="mt-8">
          {loading && (
            <div className="flex h-64 items-center justify-center">
              <div className="text-center">
                <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary-purple border-r-transparent" />
                <p className="text-white/60">Loading games...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex h-64 items-center justify-center">
              <div className="text-center">
                <p className="text-red-400">{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && filteredGames.length === 0 && (
            <div className="flex h-64 items-center justify-center">
              <div className="text-center">
                <p className="text-xl text-white/60">No games found</p>
                <p className="mt-2 text-sm text-white/40">
                  Try adjusting your filters or search query
                </p>
              </div>
            </div>
          )}

          {!loading && !error && filteredGames.length > 0 && (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredGames.map((game) => (
                  <GameCard key={game.id} game={game} />
                ))}
              </div>

              {/* Pagination */}
              {(hasNextPage || hasPreviousPage) && (
                <div className="mt-8 flex items-center justify-center gap-4">
                  <button
                    onClick={previousPage}
                    disabled={!hasPreviousPage}
                    className="flex items-center gap-2 rounded-sm border border-casino-border bg-casino-card px-4 py-2 text-white transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronLeft size={18} />
                    <span>Previous</span>
                  </button>

                  <span className="text-white/60">Page {currentPage}</span>

                  <button
                    onClick={nextPage}
                    disabled={!hasNextPage}
                    className="flex items-center gap-2 rounded-sm border border-casino-border bg-casino-card px-4 py-2 text-white transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span>Next</span>
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
