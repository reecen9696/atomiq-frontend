"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import { useRef, useState } from "react";
import { GameCard } from "@/components/ui/game-card";
import type { GameCardProps } from "@/components/ui/game-card";
import Image from "next/image";

// Import Swiper styles
import "swiper/css";

interface GamesCarouselProps {
  games: GameCardProps[];
}

export function GamesCarousel({ games }: GamesCarouselProps) {
  const swiperRef = useRef<SwiperType | null>(null);
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);

  const handlePrev = () => {
    // Jump to first slide
    swiperRef.current?.slideTo(0);
  };

  const handleNext = () => {
    // Scroll to show the last card(s) without going too far
    if (swiperRef.current) {
      const totalSlides = swiperRef.current.slides.length;
      const slidesPerView =
        typeof swiperRef.current.params.slidesPerView === "number"
          ? swiperRef.current.params.slidesPerView
          : 7;

      // Calculate the position where the last card is visible
      const targetIndex = Math.max(0, totalSlides - slidesPerView);
      swiperRef.current.slideTo(targetIndex);
    }
  };

  const handleSlideChange = (swiper: SwiperType) => {
    setIsBeginning(swiper.isBeginning);
    setIsEnd(swiper.isEnd);
  };

  return (
    <div className="relative">
      {/* Header with navigation */}
      <div className="flex justify-between items-center">
        <div className="flex flex-row gap-2 items-center">
          <Image src="/icons/game.svg" alt="Games" width={24} height={24} />
          <p className="text-white font-bold">Atomiq Games</p>
        </div>
        <div className="flex flex-row gap-2">
          <button
            onClick={handlePrev}
            disabled={isBeginning}
            className="rounded-full bg-[#211F28] w-10 h-10 flex items-center justify-center transition-opacity hover:opacity-80 disabled:opacity-40"
            aria-label="Go to first game"
          >
            <Image
              src="/icons/chevron-left-disabled.svg"
              alt="First"
              width={16}
              height={16}
            />
          </button>
          <button
            onClick={handleNext}
            disabled={isEnd}
            className="rounded-full bg-[#211F28] w-10 h-10 flex items-center justify-center transition-opacity hover:opacity-80 disabled:opacity-40"
            aria-label="Go to last game"
          >
            <Image
              src="/icons/chevron-right-enabled.svg"
              alt="Last"
              width={16}
              height={16}
            />
          </button>
        </div>
      </div>

      {/* Swiper Carousel */}
      <div className="pt-2 pb-12 overflow-x-hidden overflow-y-visible relative">
        <Swiper
          spaceBetween={16}
          slidesPerView="auto"
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
            setIsBeginning(swiper.isBeginning);
            setIsEnd(swiper.isEnd);
          }}
          onSlideChange={handleSlideChange}
          allowTouchMove={false}
          simulateTouch={false}
          className="w-full !overflow-visible"
          speed={500}
        >
          {games.map((game, index) => (
            <SwiperSlide
              key={game.id}
              className={index === games.length - 1 ? "!w-40 pr-4" : "!w-40"}
            >
              <GameCard {...game} />
            </SwiperSlide>
          ))}
        </Swiper>
        {/* Gradient fade overlay on right */}
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#0F0E11] to-transparent pointer-events-none z-10" />
      </div>
    </div>
  );
}
