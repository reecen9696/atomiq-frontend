const ITEMS = [
  { key: "menu", label: "Menu" },
  { key: "search", label: "Search" },
  { key: "chat", label: "Chat" },
  { key: "rewards", label: "Rewards" },
  { key: "vrf", label: "VRF" },
] as const;

export function MobileBottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#1E2938] bg-casino-bg sm:hidden">
      <div className="mx-auto max-w-7xl px-3 pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-5 py-2">
          {ITEMS.map((item) => (
            <button
              key={item.key}
              type="button"
              className="flex flex-col items-center justify-center gap-1 py-2 text-center"
              aria-label={item.label}
            >
              <div className="h-10 w-10 rounded-full bg-casino-card border border-casino-border" />
              <span className="text-xs font-medium text-white/70">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
