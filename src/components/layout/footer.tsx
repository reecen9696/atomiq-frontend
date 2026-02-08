import Image from "next/image";

/**
 * Footer Component
 * Shared footer across all pages with navigation links and branding
 */
export function Footer() {
  return (
    <footer className="w-full bg-[#131216] mt-26">
      <div className="flex justify-between items-start px-4 sm:px-6 lg:px-10 2xl:px-12 py-6 h-24">
        <div className="flex gap-8">
          <span className="text-[14px] font-bold text-white/40 cursor-pointer hover:text-white/60 transition-colors">
            How It Works
          </span>
          <span className="text-[14px] font-bold text-white/40 cursor-pointer hover:text-white/60 transition-colors">
            FAQ
          </span>
          <span className="text-[14px] font-bold text-white/40 cursor-pointer hover:text-white/60 transition-colors">
            Support
          </span>
          <span className="text-[14px] font-bold text-white/40 cursor-pointer hover:text-white/60 transition-colors">
            X
          </span>
        </div>
        <div className="opacity-20">
          <Image
            src="/brand/logo.svg"
            alt="Atomik"
            width={70}
            height={20}
            style={{ width: "auto", height: "auto" }}
          />
        </div>
      </div>
    </footer>
  );
}
