/**
 * Game Card Component
 * Displays a community game in the store grid
 */

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Star, TrendingUp } from 'lucide-react';
import { VerificationBadge } from './verification-badge';
import type { CommunityGameConfig } from '@/types/community-games';

interface GameCardProps {
  game: CommunityGameConfig;
}

export function GameCard({ game }: GameCardProps) {
  const formatPlayCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <Link
      href={game.route}
      className="group relative flex flex-col overflow-hidden rounded-lg border border-casino-border bg-casino-card transition-all hover:border-primary-purple hover:shadow-lg hover:shadow-primary-purple/20"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden bg-casino-bg">
        <Image
          src={game.image}
          alt={game.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        
        {/* Overlay badges */}
        <div className="absolute top-2 right-2 flex flex-col gap-2">
          <VerificationBadge status={game.verificationStatus} size="sm" />
          {game.featured && (
            <div className="rounded-sm bg-primary-purple px-2 py-0.5 text-xs font-medium text-white">
              Featured
            </div>
          )}
        </div>

        {/* Category tag */}
        <div className="absolute bottom-2 left-2">
          <span className="rounded-sm bg-black/70 px-2 py-1 text-xs font-medium text-white/90 backdrop-blur-sm">
            {game.category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        {/* Title and Developer */}
        <div className="mb-2">
          <h3 className="mb-1 text-lg font-semibold text-white group-hover:text-primary-purple transition-colors">
            {game.title}
          </h3>
          <div className="flex items-center gap-2">
            <div className="relative h-5 w-5 overflow-hidden rounded-full">
              <Image
                src={game.developer.avatarUrl || '/brand/pfp.png'}
                alt={game.developer.displayName}
                fill
                className="object-cover"
              />
            </div>
            <span className="text-sm text-white/60">
              {game.developer.displayName}
            </span>
            {game.developer.verified && (
              <Star size={12} className="fill-yellow-400 text-yellow-400" />
            )}
          </div>
        </div>

        {/* Description */}
        <p className="mb-3 line-clamp-2 text-sm text-white/60">
          {game.description}
        </p>

        {/* Stats */}
        <div className="mt-auto grid grid-cols-2 gap-3 border-t border-casino-border pt-3">
          {/* Rating */}
          <div className="flex items-center gap-1.5">
            <Star size={14} className="fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium text-white">
              {game.playerRating.toFixed(1)}
            </span>
            <span className="text-xs text-white/40">
              ({game.ratingCount})
            </span>
          </div>

          {/* Play count */}
          <div className="flex items-center gap-1.5 justify-end">
            <TrendingUp size={14} className="text-primary-purple" />
            <span className="text-sm font-medium text-white">
              {formatPlayCount(game.totalBets)}
            </span>
            <span className="text-xs text-white/40">plays</span>
          </div>

          {/* RTP */}
          <div className="col-span-2 flex items-center justify-between">
            <span className="text-xs text-white/60">RTP:</span>
            <span className="text-sm font-semibold text-green-400">
              {(game.declaredRTP * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Play button overlay (appears on hover) */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
        <button className="rounded-sm bg-primary-purple px-6 py-3 font-semibold text-white transition-colors hover:bg-primary-purple-hover">
          Play Now
        </button>
      </div>
    </Link>
  );
}
