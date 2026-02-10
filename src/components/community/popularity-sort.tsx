/**
 * Popularity Sort Component
 * Dropdown for sorting community games
 */

'use client';

import { ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { GameSortOption } from '@/types/community-games';

interface PopularitySortProps {
  value: GameSortOption;
  onChange: (value: GameSortOption) => void;
}

const SORT_OPTIONS: { value: GameSortOption; label: string }[] = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'newest', label: 'Newest First' },
  { value: 'top-rated', label: 'Top Rated' },
  { value: 'most-played', label: 'Most Played' },
  { value: 'highest-rtp', label: 'Highest RTP' },
];

export function PopularitySort({ value, onChange }: PopularitySortProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = SORT_OPTIONS.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-sm border border-casino-border bg-casino-card px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/5"
      >
        <span>Sort: {selectedOption?.label}</span>
        <ChevronDown
          size={16}
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-sm border border-casino-border bg-casino-card shadow-lg">
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-3 text-left text-sm transition-colors hover:bg-white/5 ${
                value === option.value
                  ? 'bg-primary-purple/20 text-primary-purple font-medium'
                  : 'text-white/80'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
