"use client";

import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import type { StatCard } from "@/types/stat-card";

interface StatsCarouselProps {
  stats: StatCard[];
}

export function StatsCarousel({ stats }: StatsCarouselProps) {
  return (
    <Carousel
      opts={{
        align: "start",
        loop: false,
      }}
      className="w-full"
    >
      <CarouselContent className="gap-4">
        {stats.map((card) => (
          <CarouselItem key={card.id} className="basis-85">
            <div className="relative h-40 w-85 shrink-0 overflow-hidden rounded-lg border border-[#1E2938]">
              <Image
                src="/brand/statcard.png"
                alt="Stat card"
                fill
                className="object-cover"
              />
              <div className="relative z-10 flex flex-col left-12 h-full justify-center">
                <div className="flex items-center gap-3">
                  <Image
                    src={card.icon}
                    alt={card.title}
                    width={27}
                    height={27}
                  />
                  <span className="text-[26px] font-medium text-[#9DA3AF]">
                    {card.title}
                  </span>
                </div>
                <div className="text-[46px] font-bold text-white leading-tight">
                  {card.value}
                </div>
              </div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
}
