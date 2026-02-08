# Adding New Games

This guide shows how to add a new game to the casino using the game registry system.

## Step 1: Add Game Configuration

Edit `/src/config/games.ts` and add your game to the `GAMES` object:

```typescript
export const GAMES: Record<string, GameConfig> = {
  // ... existing games
  
  yourGame: {
    id: "your-game",
    slug: "your-game",
    title: "Your Game",
    description: "Description of your game",
    image: "/games/your-game.png",
    category: "classic", // or "slots", "table", "arcade"
    minBet: 0.01,
    maxBet: 100,
    enabled: true,      // Set to false while developing
    featured: false,    // Set to true for homepage carousel
    route: "/casino/your-game",
  },
};
```

## Step 2: Create Game Component

Create your game component at `/src/components/games/your-game.tsx`:

```typescript
"use client";

export function YourGame() {
  return (
    <div className="flex h-full items-center justify-center">
      <h1 className="text-white text-2xl">Your Game Implementation</h1>
    </div>
  );
}
```

## Step 3: Register in Game Loader

Edit `/src/components/games/game-loader.tsx` and add your game to the imports:

```typescript
const GAME_COMPONENTS: Record<string, ComponentType<any>> = {
  // ... existing games
  
  "your-game": dynamic(() => 
    import("@/components/games/your-game").then(mod => ({ 
      default: mod.YourGame 
    })), {
      loading: () => <GameLoadingState />,
      ssr: false,
    }
  ),
};
```

## Step 4: Add Game Image

Place your game thumbnail at `/public/games/your-game.png` (recommended size: 160x224px)

## Step 5: Test

1. Navigate to `http://localhost:3000/casino/your-game`
2. Verify the game loads correctly
3. Check the homepage carousel if `featured: true`

## Step 6: Enable

Once tested, set `enabled: true` in the game configuration to make it available to users.

## Features You Get Automatically

✅ **Routing** - Game accessible at `/casino/your-game`  
✅ **404 Handling** - Invalid game URLs show a proper error page  
✅ **Code Splitting** - Game component loads only when needed  
✅ **Loading States** - Shows loading spinner while component loads  
✅ **Type Safety** - Full TypeScript support  
✅ **Metadata** - Min/max bets, categories, descriptions  
✅ **Discovery** - Game appears in carousels and listings automatically  

## Game Categories

- `classic` - Traditional casino games (dice, coinflip)
- `slots` - Slot machine games
- `table` - Table games (blackjack, roulette)
- `arcade` - Arcade-style games (plinko, crash)

## Helper Functions Available

```typescript
import { 
  getGameBySlug,
  getAvailableGames,
  getFeaturedGames,
  isGameAvailable,
  formatGameTitle 
} from "@/config/games";

import { 
  slugify,
  getGameRoute,
  formatSOL,
  validateBetAmount 
} from "@/lib/game-utils";
```

## Example: Full Game Implementation

See `/src/components/games/coinflip-game.tsx` for a complete working example.
