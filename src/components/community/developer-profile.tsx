/**
 * Developer Profile Component
 * Displays developer information and stats
 */

'use client';

import Image from 'next/image';
import { Star, TrendingUp, Calendar } from 'lucide-react';
import type { GameDeveloper } from '@/types/community-games';
import { formatAddress } from '@/lib/utils';

interface DeveloperProfileProps {
  developer: GameDeveloper;
  compact?: boolean;
}

export function DeveloperProfile({ developer, compact = false }: DeveloperProfileProps) {
  const formatPlayCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-casino-border bg-casino-card p-4">
        <div className="relative h-12 w-12 overflow-hidden rounded-full">
          <Image
            src={developer.avatarUrl || '/brand/pfp.png'}
            alt={developer.displayName}
            fill
            className="object-cover"
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white">{developer.displayName}</h3>
            {developer.verified && (
              <Star size={14} className="fill-yellow-400 text-yellow-400" />
            )}
          </div>
          <p className="text-sm text-white/60">
            {formatAddress(developer.walletAddress, 4, 4)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-casino-border bg-casino-card p-6">
      <div className="mb-6 flex items-center gap-4">
        <div className="relative h-20 w-20 overflow-hidden rounded-full">
          <Image
            src={developer.avatarUrl || '/brand/pfp.png'}
            alt={developer.displayName}
            fill
            className="object-cover"
          />
        </div>
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2">
            <h2 className="text-xl font-bold text-white">{developer.displayName}</h2>
            {developer.verified && (
              <div className="flex items-center gap-1 rounded-sm bg-yellow-500/20 px-2 py-0.5">
                <Star size={12} className="fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-medium text-yellow-400">Verified</span>
              </div>
            )}
          </div>
          <p className="text-sm text-white/60">
            {formatAddress(developer.walletAddress, 6, 6)}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-sm border border-casino-border bg-casino-bg p-4">
            <div className="mb-1 flex items-center gap-2 text-white/60">
              <TrendingUp size={16} />
              <span className="text-xs">Games Published</span>
            </div>
            <p className="text-2xl font-bold text-white">{developer.gamesPublished}</p>
          </div>
          <div className="rounded-sm border border-casino-border bg-casino-bg p-4">
            <div className="mb-1 flex items-center gap-2 text-white/60">
              <TrendingUp size={16} />
              <span className="text-xs">Total Plays</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {formatPlayCount(developer.totalPlays)}
            </p>
          </div>
        </div>

        <div className="rounded-sm border border-casino-border bg-casino-bg p-4">
          <div className="mb-1 flex items-center gap-2 text-white/60">
            <Calendar size={16} />
            <span className="text-xs">Joined</span>
          </div>
          <p className="text-sm font-medium text-white">
            {new Date(developer.joinedAt).toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
