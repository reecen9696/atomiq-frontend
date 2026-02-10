/**
 * Developer Portal Page
 * Documentation and resources for game developers
 */

'use client';

import { ArrowLeft, Download, Book, Shield, Code2, Zap } from 'lucide-react';
import Link from 'next/link';
import { SDKDocumentation } from '@/components/community/sdk-documentation';
import { COMMUNITY_GAME_SECURITY } from '@/config/community-security';

export default function DevelopersPage() {
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
          <h1 className="mb-2 text-4xl font-bold text-white">Developer Portal</h1>
          <p className="text-lg text-white/70">
            Build and publish your casino games on Atomiq. No KYC, wallet-only access.
          </p>
        </div>

        {/* Quick Start Cards */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-casino-border bg-casino-card p-6">
            <Code2 size={32} className="mb-4 text-primary-purple" />
            <h3 className="mb-2 text-lg font-semibold text-white">SDK Integration</h3>
            <p className="text-sm text-white/60">
              Use our SDK to integrate with VRF, bets, and settlements
            </p>
          </div>

          <div className="rounded-lg border border-casino-border bg-casino-card p-6">
            <Shield size={32} className="mb-4 text-green-400" />
            <h3 className="mb-2 text-lg font-semibold text-white">Auto Verification</h3>
            <p className="text-sm text-white/60">
              Games are automatically verified for mathematical fairness
            </p>
          </div>

          <div className="rounded-lg border border-casino-border bg-casino-card p-6">
            <Zap size={32} className="mb-4 text-yellow-400" />
            <h3 className="mb-2 text-lg font-semibold text-white">Fast Payouts</h3>
            <p className="text-sm text-white/60">
              Instant settlement via Solana with {COMMUNITY_GAME_SECURITY.REVENUE.DEFAULT_DEVELOPER_REVENUE_SHARE * 100}% revenue share
            </p>
          </div>

          <div className="rounded-lg border border-casino-border bg-casino-card p-6">
            <Book size={32} className="mb-4 text-blue-400" />
            <h3 className="mb-2 text-lg font-semibold text-white">Full Docs</h3>
            <p className="text-sm text-white/60">
              Comprehensive documentation and code examples
            </p>
          </div>
        </div>

        {/* Getting Started Guide */}
        <div className="mb-8 rounded-lg border border-casino-border bg-casino-card p-8">
          <h2 className="mb-6 text-2xl font-bold text-white">Getting Started</h2>

          <div className="space-y-6">
            <div>
              <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold text-white">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-purple text-sm">
                  1
                </span>
                Download Game Template
              </h3>
              <p className="ml-10 text-white/70">
                Start with our boilerplate template that includes SDK integration and best
                practices.
              </p>
              <button className="ml-10 mt-2 flex items-center gap-2 rounded-sm border border-casino-border bg-casino-bg px-4 py-2 text-white transition-colors hover:bg-white/5">
                <Download size={18} />
                <span>Download Template</span>
              </button>
            </div>

            <div>
              <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold text-white">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-purple text-sm">
                  2
                </span>
                Integrate SDK
              </h3>
              <p className="ml-10 text-white/70">
                Use the Atomiq SDK to request VRF, place bets, and settle outcomes. All
                randomness must come from the platform's VRF.
              </p>
              <pre className="ml-10 mt-2 overflow-x-auto rounded-sm bg-casino-bg p-4 text-sm">
                <code className="text-green-400">
{`import { AtomiqGameSDK } from '@atomiq/sdk';

const sdk = new AtomiqGameSDK();

// Request VRF for randomness
const vrf = await sdk.requestVRF({ 
  gameId: 'my-game', 
  betId: bet.id 
});

// Place a bet
const bet = await sdk.placeBet({ 
  amount: 0.1, 
  gameId: 'my-game' 
});

// Settle the bet
await sdk.settleBet({ 
  betId: bet.id, 
  outcome: 'win', 
  multiplier: 2.0 
});`}
                </code>
              </pre>
            </div>

            <div>
              <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold text-white">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-purple text-sm">
                  3
                </span>
                Test Locally
              </h3>
              <p className="ml-10 text-white/70">
                Test your game thoroughly before submission. Ensure it meets all security
                requirements and RTP specifications.
              </p>
            </div>

            <div>
              <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold text-white">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-purple text-sm">
                  4
                </span>
                Submit for Verification
              </h3>
              <p className="ml-10 text-white/70">
                Bundle your game as a ZIP file and submit it through our portal. The
                verification process typically takes 24-48 hours.
              </p>
              <Link
                href="/community/submit"
                className="ml-10 mt-2 inline-flex items-center gap-2 rounded-sm bg-primary-purple px-4 py-2 text-white transition-colors hover:bg-primary-purple-hover"
              >
                <span>Submit Game</span>
              </Link>
            </div>
          </div>
        </div>

        {/* VRF Integration Guide */}
        <div className="mb-8 rounded-lg border border-casino-border bg-casino-card p-8">
          <h2 className="mb-6 text-2xl font-bold text-white">VRF Integration</h2>
          <p className="mb-4 text-white/70">
            Atomiq uses Verifiable Random Functions (VRF) for provably fair randomness.
            This ensures all game outcomes are transparent and verifiable.
          </p>

          <div className="rounded-sm border border-casino-border bg-casino-bg p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">Key Points</h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li className="flex items-start gap-2">
                <span className="text-primary-purple">✓</span>
                <span>
                  Every bet must request a VRF value before determining the outcome
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-purple">✓</span>
                <span>VRF responses are cryptographically verifiable by players</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-purple">✓</span>
                <span>
                  VRF latency is 15-25ms — fast enough for real-time gameplay
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-purple">✓</span>
                <span>
                  Never use Math.random(), crypto.getRandomValues(), or any local RNG
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Security Requirements */}
        <div className="mb-8 rounded-lg border border-red-500/30 bg-red-500/5 p-8">
          <h2 className="mb-6 text-2xl font-bold text-red-400">
            Security Requirements (Must Comply)
          </h2>
          <ul className="space-y-3 text-sm text-white/70">
            {COMMUNITY_GAME_SECURITY.BANNED_PATTERNS.map((pattern, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-red-400">✗</span>
                <span>
                  <code className="rounded bg-black/40 px-1 py-0.5 text-red-300">
                    {pattern}
                  </code>{' '}
                  - Not allowed in submitted code
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* SDK Documentation */}
        <SDKDocumentation />

        {/* FAQ */}
        <div className="mt-8 rounded-lg border border-casino-border bg-casino-card p-8">
          <h2 className="mb-6 text-2xl font-bold text-white">FAQ</h2>
          <div className="space-y-6">
            <div>
              <h3 className="mb-2 text-lg font-semibold text-white">
                What revenue share do developers receive?
              </h3>
              <p className="text-white/70">
                Developers receive {COMMUNITY_GAME_SECURITY.REVENUE.DEFAULT_DEVELOPER_REVENUE_SHARE * 100}% of the house edge from their games. Earnings are held
                in escrow for {COMMUNITY_GAME_SECURITY.REVENUE.EARNINGS_ESCROW_DAYS} days before withdrawal.
              </p>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold text-white">
                How long does verification take?
              </h3>
              <p className="text-white/70">
                Most games are verified within 24-48 hours. The verification runs{' '}
                {COMMUNITY_GAME_SECURITY.MATH_VERIFICATION.MIN_SIMULATION_ROUNDS.toLocaleString()}{' '}
                simulation rounds to verify RTP accuracy.
              </p>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold text-white">
                Can I update my game after publishing?
              </h3>
              <p className="text-white/70">
                Yes, you can submit updated versions. Each update goes through
                verification again to ensure continued fairness and security.
              </p>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold text-white">
                What happens if my game fails verification?
              </h3>
              <p className="text-white/70">
                You'll receive a detailed report explaining what failed. Common issues
                include RTP deviation exceeding tolerance or security violations. You can
                fix the issues and resubmit.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
