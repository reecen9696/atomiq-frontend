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
