import Image from "next/image";
import { cn } from "@/lib/utils";

export interface GameCardProps {
  id: string;
  title: string;
  image: string;
  className?: string;
}

export function GameCard({ title, image, className }: GameCardProps) {
  return (
    <div
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
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
    </div>
  );
}
