import Image from "next/image";

export interface WinnerCardProps {
  gameName: string;
  gameImage: string;
  amount: string;
}

export function WinnerCard({ gameName, gameImage, amount }: WinnerCardProps) {
  return (
    <div className="relative h-20 w-40 shrink-0 cursor-pointer transition-all duration-300 ease-out hover:-translate-y-2">
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
          style={{ width: "43px", height: "58px" }}
        />
      </div>

      {/* Floating content */}
      <div className="absolute bottom-2 left-16 flex flex-col gap-2">
        <div className="text-sm font-bold text-white">{gameName}</div>

        <div className="flex items-center gap-1 text-xs font-bold text-white/90">
          <Image
            src="/icons/sol.svg"
            alt="SOL"
            width={14}
            height={14}
            className="shrink-0"
            style={{ width: "auto", height: "auto" }}
          />
          <span>{amount}</span>
        </div>
      </div>
    </div>
  );
}
