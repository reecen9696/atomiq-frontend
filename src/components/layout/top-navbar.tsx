import Image from "next/image";
import Link from "next/link";

export function TopNavbar() {
  return (
    <header className="sticky top-0 z-50 flex h-18 w-full items-center justify-between border-b border-[#1E2938] bg-[#0F0E11] px-4 sm:px-6 lg:px-10 2xl:px-12">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-white/90 hover:opacity-80 transition-opacity"
          aria-label="Go to dashboard"
        >
          <Image
            src="/brand/logo.svg"
            alt="Atomik"
            width={112}
            height={32}
            className="block"
            priority
            style={{ width: "auto", height: "auto" }}
          />
        </Link>
      </div>

      {/* Center Section - Currency Selector and Wallet */}
      <div className="flex items-center gap-3">
        {/* Currency Selector */}
        <div className="flex items-center justify-between w-[172px] h-[48px] px-3 border border-[#1E2938] hover:border-[#5C41E1] hover:bg-white/10 rounded-sm transition-all duration-200 cursor-pointer">
          <div className="flex items-center gap-2">
            <Image
              src="/icons/sol.svg"
              alt="SOL"
              width={14}
              height={14}
              style={{ width: "auto", height: "auto" }}
            />
            <span className="text-[14px] font-normal text-white font-['DM_Sans']">
              0.000000006
            </span>
          </div>
          <Image
            src="/icons/downArrow.svg"
            alt="Dropdown"
            width={16}
            height={16}
            style={{ width: "auto", height: "auto" }}
          />
        </div>

        {/* Wallet Button */}
        <button className="flex items-center gap-1 bg-[#674AE5] hover:bg-[#8B75F6] px-4 py-3 rounded-sm transition-colors duration-200">
          <Image src="/icons/wallet.svg" alt="Wallet" width={18} height={18} />
          <span className="text-[14px] font-medium text-white">Wallet</span>
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div
          className="hidden h-10 w-10 items-center justify-center rounded-full bg-[#211F28] sm:flex"
          aria-hidden
        >
          <Image
            src="/brand/crown.svg"
            alt=""
            width={20}
            height={20}
            className="opacity-95"
            style={{ width: "auto", height: "auto" }}
          />
        </div>

        <div className="relative h-10 w-10 overflow-hidden rounded-full">
          <Image
            src="/brand/pfp.png"
            alt="Profile"
            fill
            sizes="40px"
            className="object-cover"
            priority
          />
        </div>
      </div>
    </header>
  );
}
