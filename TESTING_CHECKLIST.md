# Atomiq Casino — Testing Checklist

## How to Run Tests

| Command | What it does |
|---------|--------------|
| `npm test` | Run all unit tests once |
| `npm run test:watch` | Watch mode (re-runs on file changes) |
| `npm run test:coverage` | Generate coverage report |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run test:all` | Run everything (unit + E2E) |

## Pre-Merge Checklist (use for every PR)

### ✅ Automated Tests
- [ ] `npm test` passes (all unit tests)
- [ ] `npm run test:e2e` passes (all E2E tests)
- [ ] `npm run build` succeeds
- [ ] `npm run typecheck` passes
- [ ] No new TypeScript errors

### ✅ Manual Frontend Walkthrough
(expandable per priority)

#### Core Flow (always test)
1. [ ] Page loads at localhost:3000
2. [ ] Click "Connect Wallet" → modal opens
3. [ ] Connect Phantom wallet → wallet address shown
4. [ ] Vault balance displays in navbar
5. [ ] Navigate to Coinflip → game loads
6. [ ] Select Heads → button highlights
7. [ ] Enter 0.1 SOL → amount shows
8. [ ] Click Bet → bet processes via API
9. [ ] Result shows (Win/Loss + amount)
10. [ ] Vault balance updates after settlement

#### Security Checks (Priority 1)
11. [ ] Enter negative bet → rejected with error
12. [ ] Enter 999 SOL bet → rejected (max limit)
13. [ ] Rapid-click bet button → rate limited after 1st
14. [ ] Disconnect wallet → redirected/modal shows

#### Community Store (PR #5)
15. [ ] Navigate to /community → store loads
16. [ ] Search for a game → results filter
17. [ ] Click game card → detail page loads
18. [ ] Verification badges display correctly

### ✅ Blockchain Integration Check
(when backend at :8080 is running)
- [ ] POST /api/coinflip/play returns result
- [ ] Settlement completes within 30s
- [ ] Vault balance matches on-chain state
- [ ] VRF proof is present in response

## Test Coverage Goals

Current thresholds (increase over time):
- **Statements**: 30%
- **Branches**: 25%
- **Functions**: 25%
- **Lines**: 30%

## Test File Structure

```
src/
├── __tests__/
│   ├── setup.ts                      ✅ Global test setup
│   └── helpers/
│       ├── mock-wallet.ts            ✅ Wallet mocking utilities
│       ├── mock-sdk.ts               ✅ SDK mocking utilities
│       ├── mock-api.ts               ✅ API mocking utilities
│       └── render-with-providers.tsx ✅ React test utilities
├── lib/__tests__/
│   ├── validation.test.ts            ✅ 31 tests
│   └── error-handling.test.ts        ✅ 28 tests
├── stores/__tests__/
│   ├── auth-store.test.ts            ✅ 14 tests
│   └── community-store.test.ts       ✅ 16 tests
└── lib/sdk/__tests__/
    └── betting-service.test.ts       ✅ 15 tests

e2e/
├── navigation.spec.ts                ✅ Navigation smoke tests
├── wallet-flow.spec.ts               ✅ Wallet UI flow tests
├── coinflip-flow.spec.ts             ✅ Coinflip game tests
└── community-store.spec.ts           ✅ Community store tests
```

## Current Status

**Unit Tests**: 104 tests passing ✅
**E2E Tests**: Created (not yet run in CI)
**Coverage**: Generated via `npm run test:coverage`

## Known Limitations

1. **Backend Dependency**: Some tests require the backend API at `localhost:8080` to be running. These tests use mocks when the backend is unavailable.

2. **Wallet Integration**: E2E tests cannot test actual wallet connections (Phantom, Solflare) as these require browser extensions and user interaction.

3. **Missing Security Modules**: The problem statement mentions `rate-limiter.ts`, `transaction-guard.ts`, and `session-guard.ts` modules from PR #6, but these don't exist in the current codebase. Tests were created for the modules that do exist (`validation.ts`, `error-handling.ts`).

4. **Component Tests Skipped**: Complex React component tests (e.g., `coinflip-game.test.tsx`, `game-card.test.tsx`) were skipped due to the extensive Solana wallet adapter and React Query setup required.

## Adding Tests for New Features

When adding new features, follow this pattern:

### 1. Unit Tests
```typescript
// src/your-module/__tests__/your-module.test.ts
import { describe, it, expect } from 'vitest'
import { yourFunction } from '../your-module'

describe('yourFunction', () => {
  it('does what it should', () => {
    expect(yourFunction()).toBe(expected)
  })
})
```

### 2. Store Tests
```typescript
// src/stores/__tests__/your-store.test.ts
import { useYourStore } from '../your-store'

beforeEach(() => {
  useYourStore.getState().reset()
})
```

### 3. E2E Tests
```typescript
// e2e/your-feature.spec.ts
import { test, expect } from '@playwright/test'

test('feature works', async ({ page }) => {
  await page.goto('/your-page')
  await expect(page).toHaveURL(/your-page/)
})
```

## Troubleshooting

### Tests Failing Locally
1. Run `npm install --legacy-peer-deps` to ensure dependencies are installed
2. Run `npm run typecheck` to check for TypeScript errors
3. Check that no environment variables are required

### E2E Tests Failing
1. Ensure the dev server is running (`npm run dev`)
2. Check Playwright browser installation (`npx playwright install`)
3. Run with UI mode for debugging (`npm run test:e2e:ui`)

### Coverage Not Generated
1. Install coverage provider: `npm install --save-dev @vitest/coverage-v8`
2. Run: `npm run test:coverage`
3. View report: `open coverage/index.html`

## Next Steps

For future PRs (Priorities 2-5), extend this checklist with:

- [ ] Tests for new game implementations
- [ ] Tests for vault and allowance operations  
- [ ] Tests for leaderboard and stats features
- [ ] Tests for social features (if added)
- [ ] Performance tests for high-volume operations
