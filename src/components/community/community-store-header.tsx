/**
 * Community Store Header Component
 * Hero section for the community store
 */

'use client';

import { Sparkles, Code } from 'lucide-react';
import Link from 'next/link';

export function CommunityStoreHeader() {
  return (
    <div className="relative overflow-hidden rounded-lg border border-casino-border bg-gradient-to-br from-primary-purple/20 to-casino-card p-8 lg:p-12">
      {/* Background decoration */}
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary-purple/10 blur-3xl" />
      <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-primary-purple/10 blur-3xl" />

      <div className="relative">
        <div className="mb-4 inline-flex items-center gap-2 rounded-sm bg-primary-purple/20 px-3 py-1 text-sm font-medium text-primary-purple">
          <Sparkles size={16} />
          <span>Community-Powered</span>
        </div>

        <h1 className="mb-4 text-4xl font-bold text-white lg:text-5xl">
          Community Game Store
        </h1>

        <p className="mb-8 max-w-2xl text-lg text-white/70">
          Discover games built by developers from around the world. All games are
          verified for mathematical fairness and run in a secure sandboxed environment.
          Anyone can build and publish — wallet-only, no KYC required.
        </p>

        <div className="flex flex-wrap gap-4">
          <Link
            href="/community/developers"
            className="inline-flex items-center gap-2 rounded-sm bg-primary-purple px-6 py-3 font-semibold text-white transition-colors hover:bg-primary-purple-hover"
          >
            <Code size={18} />
            <span>Build a Game</span>
          </Link>
          <Link
            href="#games"
            className="inline-flex items-center gap-2 rounded-sm border border-casino-border bg-casino-card px-6 py-3 font-semibold text-white transition-colors hover:bg-white/5"
          >
            <span>Browse Games</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
