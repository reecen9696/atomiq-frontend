/**
 * Game Submission Page
 * Form for submitting new community games
 */

'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { GameSubmissionForm } from '@/components/community/game-submission-form';
import { COMMUNITY_GAME_SECURITY } from '@/config/community-security';

export default function SubmitGamePage() {
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

        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-white">Submit Your Game</h1>
          <p className="text-lg text-white/70">
            Share your game with the Atomiq community. All submissions are reviewed for
            mathematical fairness and security.
          </p>
        </div>

        {/* Security Requirements */}
        <div className="mb-8 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-6">
          <h2 className="mb-4 text-lg font-semibold text-yellow-400">
            Security Requirements
          </h2>
          <ul className="space-y-2 text-sm text-white/70">
            <li className="flex items-start gap-2">
              <span className="text-yellow-400">•</span>
              <span>
                <strong>Use Platform VRF Only:</strong> All randomness must come from the
                platform's Verifiable Random Function. No local RNG allowed.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-400">•</span>
              <span>
                <strong>No External Network Access:</strong> Games cannot make external
                API calls. Use the provided SDK methods only.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-400">•</span>
              <span>
                <strong>RTP Requirements:</strong> Declared RTP must be between{' '}
                {COMMUNITY_GAME_SECURITY.MATH_VERIFICATION.MIN_ALLOWED_RTP * 100}% and{' '}
                {COMMUNITY_GAME_SECURITY.MATH_VERIFICATION.MAX_ALLOWED_RTP * 100}%
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-400">•</span>
              <span>
                <strong>Max Multiplier:</strong> Cannot exceed{' '}
                {COMMUNITY_GAME_SECURITY.MATH_VERIFICATION.MAX_MULTIPLIER_CAP}x
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-400">•</span>
              <span>
                <strong>File Size:</strong> Bundle must be under{' '}
                {COMMUNITY_GAME_SECURITY.RATE_LIMITS.MAX_SUBMISSION_SIZE_MB}MB
              </span>
            </li>
          </ul>
        </div>

        {/* Submission Form */}
        <GameSubmissionForm />
      </div>
    </div>
  );
}
