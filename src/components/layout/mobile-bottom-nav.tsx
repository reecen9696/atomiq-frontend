"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const ITEMS = [
  { key: "home", label: "Home", href: "/" },
  { key: "casino", label: "Casino", href: "/casino" },
  { key: "community", label: "Community", href: "/community" },
  { key: "chat", label: "Chat", href: "#" },
  { key: "rewards", label: "Rewards", href: "#" },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#1E2938] bg-casino-bg sm:hidden">
      <div className="mx-auto max-w-7xl px-3 pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-5 py-2">
          {ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.key}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2 text-center transition-colors",
                  isActive ? "text-white" : "text-white/70 hover:text-white/90",
                )}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
              >
                <div
                  className={cn(
                    "h-10 w-10 rounded-full border transition-colors",
                    isActive
                      ? "bg-primary-purple/20 border-primary-purple"
                      : "bg-casino-card border-casino-border",
                  )}
                />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
