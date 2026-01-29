"use client";

import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useStats } from "@/hooks";

export function StatsCarousel() {
  const { data: stats, isLoading, error } = useStats();

  if (error) {
    return (
      <div className="w-full">
        <p className="text-sm text-red-500">Failed to load stats</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="flex gap-4 overflow-x-auto">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-85 rounded-xlg shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats || stats.length === 0) {
    return null;
  }

  return (
    <div className="relative">
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
              <Card className="relative h-40 w-84 shrink-0 overflow-hidden p-0">
                <Image
                  src="/brand/statcard.png"
                  alt="Stat card"
                  fill
                  className="object-cover"
                  priority
                  quality={100}
                  sizes="(max-width: 768px) 100vw, 340px"
                />
                <div className="relative z-10 flex flex-col left-12 h-full justify-center">
                  <div className="flex items-center gap-3">
                    <Image
                      src={card.icon}
                      alt={card.title}
                      width={27}
                      height={27}
                      style={{ width: "27px", height: "27px" }}
                    />
                    <span className="text-[26px] font-medium text-[#9DA3AF]">
                      {card.title}
                    </span>
                  </div>
                  <div className="font-planar text-[46px] text-white leading-tight">
                    {card.value}
                  </div>
                </div>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      {/* Gradient fade overlay on right */}
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#0F0E11] to-transparent pointer-events-none" />
    </div>
  );
}
