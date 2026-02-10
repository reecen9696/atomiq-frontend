/**
 * Community Game Detail Page
 * View and play a specific community game
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Star, TrendingUp, Clock, Users } from 'lucide-react';
import { SandboxedGameRunner } from '@/components/community/sandboxed-game-runner';
import { DeveloperProfile } from '@/components/community/developer-profile';
import { VerificationBadge } from '@/components/community/verification-badge';
import { VerificationReportModal } from '@/components/community/verification-report-modal';
import { useCommunityStore } from '@/stores/community-store';
import { toast } from 'sonner';

export default function GameDetailPage() {
  const params = useParams();
  const gameId = params.gameId as string;
  const { selectedGame, loading, error, fetchGameDetails, rateGame } = useCommunityStore();
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);

  useEffect(() => {
    if (gameId) {
      fetchGameDetails(gameId);
    }
  }, [gameId, fetchGameDetails]);

  const handleRating = async (rating: number) => {
    if (!selectedGame) return;
    
    const success = await rateGame(selectedGame.id, rating);
    if (success) {
      setUserRating(rating);
      toast.success('Thanks for your rating!');
    } else {
      toast.error('Failed to submit rating');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-casino-bg">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary-purple border-r-transparent" />
          <p className="text-white/60">Loading game...</p>
        </div>
      </div>
    );
  }

  if (error || !selectedGame) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-casino-bg">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-bold text-white">Game Not Found</h2>
          <p className="mb-6 text-white/60">{error || 'The requested game could not be found'}</p>
          <Link
            href="/community"
            className="inline-flex items-center gap-2 rounded-sm bg-primary-purple px-6 py-3 text-white transition-colors hover:bg-primary-purple-hover"
          >
            <ArrowLeft size={18} />
            <span>Back to Store</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-casino-bg px-4 py-8 sm:px-6 lg:px-10 2xl:px-12">
      <div className="mx-auto max-w-7xl">
        {/* Back Button */}
        <Link
          href="/community"
          className="mb-6 inline-flex items-center gap-2 text-white/70 transition-colors hover:text-white"
        >
          <ArrowLeft size={18} />
          <span>Back to Store</span>
        </Link>

        {/* Game Info Header */}
        <div className="mb-8 rounded-lg border border-casino-border bg-casino-card p-6">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex-1">
              <div className="mb-3 flex items-center gap-3">
                <h1 className="text-3xl font-bold text-white">{selectedGame.title}</h1>
                <VerificationBadge
                  status={selectedGame.verificationStatus}
                  size="md"
                  onClick={() =>
                    selectedGame.verificationReport && setShowVerificationModal(true)
                  }
                  showLabel
                />
              </div>

              <p className="mb-4 text-white/70">{selectedGame.description}</p>

              <div className="flex flex-wrap items-center gap-6">
                {/* Developer */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white/60">By</span>
                  <span className="font-medium text-white">
                    {selectedGame.developer.displayName}
                  </span>
                </div>

                {/* Category */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white/60">Category:</span>
                  <span className="rounded-sm bg-primary-purple/20 px-2 py-0.5 text-xs font-medium text-primary-purple">
                    {selectedGame.category}
                  </span>
                </div>

                {/* Version */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white/60">Version:</span>
                  <span className="font-medium text-white">{selectedGame.version}</span>
                </div>
              </div>
            </div>

            {/* Stats Card */}
            <div className="w-full sm:w-auto">
              <div className="grid grid-cols-2 gap-4 rounded-sm border border-casino-border bg-casino-bg p-4 sm:grid-cols-1">
                <div>
                  <div className="mb-1 flex items-center gap-1.5 text-white/60">
                    <Star size={14} />
                    <span className="text-xs">Rating</span>
                  </div>
                  <p className="text-lg font-bold text-white">
                    {selectedGame.playerRating.toFixed(1)} / 5
                  </p>
                </div>
                <div>
                  <div className="mb-1 flex items-center gap-1.5 text-white/60">
                    <TrendingUp size={14} />
                    <span className="text-xs">Plays</span>
                  </div>
                  <p className="text-lg font-bold text-white">
                    {selectedGame.totalBets.toLocaleString()}
                  </p>
                </div>
                <div>
                  <div className="mb-1 flex items-center gap-1.5 text-white/60">
                    <Users size={14} />
                    <span className="text-xs">Players (7d)</span>
                  </div>
                  <p className="text-lg font-bold text-white">
                    {selectedGame.uniquePlayers7d.toLocaleString()}
                  </p>
                </div>
                <div>
                  <div className="mb-1 flex items-center gap-1.5 text-white/60">
                    <Clock size={14} />
                    <span className="text-xs">Avg Session</span>
                  </div>
                  <p className="text-lg font-bold text-white">
                    {Math.floor(selectedGame.averageSessionSeconds / 60)}m
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Content - Game Runner */}
          <div className="lg:col-span-2">
            <SandboxedGameRunner game={selectedGame} />

            {/* Game Details */}
            <div className="mt-8 rounded-lg border border-casino-border bg-casino-card p-6">
              <h2 className="mb-4 text-xl font-bold text-white">Game Details</h2>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="mb-1 text-white/60">RTP</dt>
                  <dd className="font-semibold text-green-400">
                    {(selectedGame.declaredRTP * 100).toFixed(1)}%
                  </dd>
                </div>
                <div>
                  <dt className="mb-1 text-white/60">Max Multiplier</dt>
                  <dd className="font-semibold text-white">{selectedGame.maxMultiplier}x</dd>
                </div>
                <div>
                  <dt className="mb-1 text-white/60">Min Bet</dt>
                  <dd className="font-semibold text-white">{selectedGame.minBet} SOL</dd>
                </div>
                <div>
                  <dt className="mb-1 text-white/60">Max Bet</dt>
                  <dd className="font-semibold text-white">{selectedGame.maxBet} SOL</dd>
                </div>
                <div>
                  <dt className="mb-1 text-white/60">Published</dt>
                  <dd className="font-semibold text-white">
                    {selectedGame.publishedAt
                      ? new Date(selectedGame.publishedAt).toLocaleDateString()
                      : 'Pending'}
                  </dd>
                </div>
                <div>
                  <dt className="mb-1 text-white/60">Last Updated</dt>
                  <dd className="font-semibold text-white">
                    {new Date(selectedGame.lastUpdatedAt).toLocaleDateString()}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Rating Widget */}
            <div className="mt-8 rounded-lg border border-casino-border bg-casino-card p-6">
              <h2 className="mb-4 text-xl font-bold text-white">Rate This Game</h2>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => handleRating(rating)}
                    onMouseEnter={() => setHoveredRating(rating)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      size={32}
                      className={
                        rating <= (hoveredRating || userRating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-white/20'
                      }
                    />
                  </button>
                ))}
              </div>
              {userRating > 0 && (
                <p className="mt-2 text-sm text-green-400">Thanks for rating!</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Developer Profile */}
            <DeveloperProfile developer={selectedGame.developer} />

            {/* Verification Section */}
            {selectedGame.verificationReport && (
              <div className="rounded-lg border border-casino-border bg-casino-card p-6">
                <h3 className="mb-4 text-lg font-semibold text-white">
                  Verification
                </h3>
                <p className="mb-4 text-sm text-white/70">
                  This game has been verified for mathematical fairness through{' '}
                  {selectedGame.verificationReport.simulationRounds.toLocaleString()}{' '}
                  simulation rounds.
                </p>
                <button
                  onClick={() => setShowVerificationModal(true)}
                  className="w-full rounded-sm bg-primary-purple px-4 py-2 font-semibold text-white transition-colors hover:bg-primary-purple-hover"
                >
                  View Full Report
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Verification Modal */}
        {selectedGame.verificationReport && (
          <VerificationReportModal
            isOpen={showVerificationModal}
            onClose={() => setShowVerificationModal(false)}
            report={selectedGame.verificationReport}
            gameName={selectedGame.title}
          />
        )}
      </div>
    </div>
  );
}
