"use client";

import Image from "next/image";
import React from "react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export interface GameCardProps {
  id: string;
  title: string;
  image: string;
  slug?: string;
  className?: string;
}

export const GameCard = React.memo<GameCardProps>(
  ({ id, title, image, slug, className }) => {
    const router = useRouter();

    const handleClick = () => {
      // Use slug if provided, otherwise derive from title (backward compatible)
      const gameRoute = slug || title.toLowerCase().replace(/\s+/g, "-");
      router.push(`/casino/${gameRoute}`);
    };

    return (
      <div
        onClick={handleClick}
        className={cn(
          "relative h-56 w-40 shrink-0 overflow-hidden rounded-sm bg-casino-card border border-casino-border cursor-pointer transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-2xl",
          className,
        )}
      >
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover"
          draggable={false}
          priority
          quality={100}
          sizes="(max-width: 768px) 100vw, 160px"
        />
      </div>
    );
  },
);

GameCard.displayName = "GameCard";
