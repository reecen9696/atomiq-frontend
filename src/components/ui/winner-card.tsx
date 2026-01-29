import Image from "next/image";

export interface WinnerCardProps {
  gameName: string;
  gameImage: string;
  amount: string;
}

export function WinnerCard({ gameName, gameImage, amount }: WinnerCardProps) {
  return (
    <div className="relative h-20 w-40 shrink-0">
      {/* Back card */}
      <div className="absolute bottom-0 h-14 w-full rounded-sm bg-[#131216]"></div>

      {/* Floating game image */}
      <div className="absolute bottom-1 left-2 -translate-y-1">
        <Image
          src={gameImage}
          alt={gameName}
          width={43}
          height={58}
          className="rounded-sm object-cover shadow-xl"
          draggable={false}
        />
      </div>

      {/* Floating content */}
      <div className="absolute bottom-2 left-16 flex flex-col gap-2">
        <div className="text-sm font-bold text-white">{gameName}</div>

        <div className="flex items-center gap-2 text-xs font-bold text-white/90">
          <div className="h-4 w-4 rounded-full bg-gradient-to-br from-cyan-400 to-purple-600" />
          <span>{amount}</span>
        </div>
      </div>
    </div>
  );
}
