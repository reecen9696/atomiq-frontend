"use client";

import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useState, useEffect, useMemo } from "react";
import React from "react";
import { GameCard } from "@/components/ui/game-card";
import type { GameCardProps } from "@/components/ui/game-card";
import Image from "next/image";

interface GamesCarouselProps {
  games: GameCardProps[];
}

// Embla options for the exact behavior described
const emblaOptions = {
  loop: false,
  draggable: false,
  align: "start" as const,
  containScroll: "trimSnaps" as const,
} as const;

export const GamesCarousel = React.memo<GamesCarouselProps>(({ games }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel(emblaOptions);
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);

  // Jump to start (left arrow)
  const jumpToStart = useCallback(() => {
    if (!emblaApi) return;
    emblaApi.scrollTo(0);
  }, [emblaApi]);

  // Jump to end (right arrow)
  const jumpToEnd = useCallback(() => {
    if (!emblaApi) return;
    const lastIndex = emblaApi.scrollSnapList().length - 1;
    emblaApi.scrollTo(lastIndex);
  }, [emblaApi]);

  // Update button states
  const updateButtonStates = useCallback(() => {
    if (!emblaApi) return;
    setIsBeginning(emblaApi.canScrollPrev() === false);
    setIsEnd(emblaApi.canScrollNext() === false);
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    updateButtonStates();
    emblaApi.on("select", updateButtonStates);
    emblaApi.on("reInit", updateButtonStates);

    return () => {
      emblaApi.off("select", updateButtonStates);
      emblaApi.off("reInit", updateButtonStates);
    };
  }, [emblaApi, updateButtonStates]);

  const memoizedGames = useMemo(
    () =>
      games.map((game, index) => (
        <div
          key={game.id}
          className={`flex-[0_0_auto] basis-40 ${
            index === games.length - 1 ? "pr-4" : ""
          }`}
        >
          <GameCard {...game} />
        </div>
      )),
    [games],
  );

  return (
    <div className="relative">
      {/* Header with navigation */}
      <div className="flex justify-between items-center">
        <div className="flex flex-row gap-2 items-center">
          <Image
            src="/icons/game.svg"
            alt="Games"
            width={24}
            height={24}
            style={{ width: "auto", height: "auto" }}
          />
          <p className="text-white font-bold">Atomiq Games</p>
        </div>
        <div className="flex flex-row gap-2">
          <button
            onClick={jumpToStart}
            disabled={isBeginning}
            className="rounded-full bg-[#211F28] w-10 h-10 flex items-center justify-center transition-opacity hover:opacity-80 disabled:opacity-40"
            aria-label="Jump to first game"
          >
            <Image
              src="/icons/chevron-left-disabled.svg"
              alt="First"
              width={16}
              height={16}
              style={{ width: "auto", height: "auto" }}
            />
          </button>
          <button
            onClick={jumpToEnd}
            disabled={isEnd}
            className="rounded-full bg-[#211F28] w-10 h-10 flex items-center justify-center transition-opacity hover:opacity-80 disabled:opacity-40"
            aria-label="Jump to last game"
          >
            <Image
              src="/icons/chevron-right-enabled.svg"
              alt="Last"
              width={16}
              height={16}
              style={{ width: "auto", height: "auto" }}
            />
          </button>
        </div>
      </div>

      {/* Embla Carousel */}
      <div className="pt-2 pb-12 overflow-x-hidden overflow-y-visible relative">
        <div ref={emblaRef}>
          <div className="flex gap-4">{memoizedGames}</div>
        </div>
        {/* Gradient fade overlay on right */}
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#0F0E11] to-transparent pointer-events-none z-10" />
      </div>
    </div>
  );
});

GamesCarousel.displayName = "GamesCarousel";
