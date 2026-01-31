# SDK Integration Guide - Atomik Frontend

**Last Updated**: January 31, 2026  
**Status**: Implementation in Progress

## Overview

This guide documents the complete integration of the Solana blockchain SDK from `test-ui` into the main Atomik frontend. The integration enables real wallet connection, vault management, betting with blockchain settlement, and live WebSocket data.

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Backend Services](#backend-services)
3. [Settlement Flow](#settlement-flow)
4. [Balance Management Strategy](#balance-management-strategy)
5. [Implementation Steps](#implementation-steps)
6. [API Reference](#api-reference)
7. [Environment Configuration](#environment-configuration)
8. [Testing Checklist](#testing-checklist)
9. [Troubleshooting](#troubleshooting)

---

## System Architecture

### Components

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js)                  │
│  - Wallet Adapters (Phantom, Solflare, Torus)         │
│  - SDK Integration (copied from test-ui)               │
│  - Balance Management (fetch only on specific events)  │
│  - WebSocket Client (real-time data)                   │
└─────────────────────────────────────────────────────────┘
                          ↓ ↑
┌─────────────────────────────────────────────────────────┐
│            BLOCKCHAIN SERVICE (Port 8080)               │
│  - VRF Game Engine (10-20ms finalization)              │
│  - POST /api/coinflip/play → instant results           │
│  - GET /api/settlement/pending → pending games         │
│  - WebSocket Server (casino events, stats, blocks)     │
│  - RocksDB Storage                                      │
└─────────────────────────────────────────────────────────┘
                          ↓ ↑
┌─────────────────────────────────────────────────────────┐
│          PROCESSOR SERVICE (Background)                 │
│  - Polls every 10 seconds for pending games            │
│  - Builds Solana transactions                          │
│  - Settles wins/losses on-chain                        │
│  - Updates settlement status                           │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                  SOLANA BLOCKCHAIN                      │
│  - User Vault PDAs (balance tracking)                  │
│  - Casino Vault PDA (house bankroll)                   │
│  - Allowance PDAs (session keys)                       │
│  - Settlement Transactions (2-5s confirmation)          │
└─────────────────────────────────────────────────────────┘
```

---

## Backend Services

### Starting the Backend

```bash
# Terminal 1: Blockchain Service (VRF Game Engine)
cd backend/blockchain
RUST_LOG=info cargo run --release
# Runs on: http://localhost:8080

# Terminal 2: Processor Service (Settlement Worker)
cd backend/transaction-processor
./start.sh
# Runs on: http://localhost:3001 (API - unused)
# Processor polls blockchain:8080 in background

# Terminal 3: Frontend (Development)
cd frontend
pnpm dev
# Runs on: http://localhost:3000
```

### Service Ports

| Service        | Port | Purpose                                          |
| -------------- | ---- | ------------------------------------------------ |
| Blockchain API | 8080 | Game operations, settlement endpoints, WebSocket |
| Processor API  | 3001 | Legacy (unused in current architecture)          |
| Frontend       | 3000 | Next.js application                              |

---

## Settlement Flow

### Timeline

```
T+0ms     User places bet → POST /api/coinflip/play
T+15ms    Game finalized with VRF proof
T+20ms    Result returned to user ✅ SHOW RESULT
T+25ms    Status: PendingSettlement (stored in RocksDB)

─── User sees outcome here, balance NOT updated ───

T+10s     Processor polls /api/settlement/pending
T+10.1s   Status → SubmittedToSolana
T+10.2s   Solana transaction submitted
T+13s     Solana transaction confirmed
T+13.1s   Status → SettlementComplete
T+13.2s   NOW fetch balance from chain ✅ UPDATE BALANCE

Total user-facing latency: ~15-25ms
Total settlement latency: ~13 seconds
```

### Key Rules

1. **Instant Results**: Game outcome determined in 15-25ms with VRF
2. **Delayed Settlement**: On-chain settlement takes ~13 seconds
3. **No Optimistic Updates**: Don't update balance immediately after bet
4. **Poll for Completion**: Check `settlement_status === 'SettlementComplete'`
5. **Fetch After Settlement**: Only fetch vault balance from Solana after settlement completes

---

## Balance Management Strategy

### When to Fetch Balance

✅ **DO Fetch**:

1. On page load/mount (once)
2. After deposit completes
3. After withdraw completes
4. After settlement completes (`settlement_status === 'SettlementComplete'`)
5. Manual refresh button click

❌ **DON'T Fetch**:

1. Immediately after placing bet
2. Continuously polling every second
3. On every component render
4. During settlement window (10-15s)

### Implementation Pattern

```typescript
// ❌ WRONG: Optimistic update
async function placeBet(amount: number) {
  const result = await api.placeCoinflip({ bet_amount: amount });
  setBalance((prev) => prev - amount); // NO! Settlement hasn't completed
  return result;
}

// ✅ CORRECT: Wait for settlement
async function placeBet(amount: number) {
  const result = await api.placeCoinflip({ bet_amount: amount });

  // Show result immediately
  toast.success(`${result.outcome}! Settling on Solana...`);
  setLastBet(result);

  // Poll for settlement completion
  const pollInterval = setInterval(async () => {
    const game = await api.getGameResult(result.game_id);
    if (game.settlement_status === "SettlementComplete") {
      clearInterval(pollInterval);
      await fetchVaultBalanceFromChain(); // NOW update balance
      toast.success("Settlement complete!");
    }
  }, 3000);

  return result;
}
```

---

## Implementation Steps

### Step 1: Install Dependencies & Copy SDK

**Duration**: 30 minutes

```bash
# Install Solana packages
pnpm add @solana/web3.js@^1.98.4 \
  @solana/wallet-adapter-base@^0.9.27 \
  @solana/wallet-adapter-react@^0.15.35 \
  @solana/wallet-adapter-react-ui@^0.9.35 \
  @solana/wallet-adapter-wallets@^0.19.32 \
  bs58@^6.0.0 \
  sonner@^1.7.1
```

**Tasks**:

- [ ] Install dependencies
- [ ] Copy `test-ui/src/sdk/` to `frontend/src/lib/sdk/`
- [ ] Create environment adapter for Next.js
- [ ] Update all `import.meta.env.VITE_*` → `process.env.NEXT_PUBLIC_*`
- [ ] Create `.env.local` with required variables

**Files to Create**:

- `src/lib/sdk/` (entire folder from test-ui)
- `src/lib/sdk-config.ts` (Next.js environment adapter)

---

### Step 2: Setup Shadcn Sonner Toast

**Duration**: 15 minutes

```bash
# Install Sonner toast
npx shadcn@latest add sonner
```

**Tasks**:

- [ ] Create `app/providers/toaster.tsx`
- [ ] Configure position="bottom-left"
- [ ] Add to `app/providers.tsx`
- [ ] Create toast helper utilities

**Files to Create/Modify**:

- `src/app/providers/toaster.tsx` (new)
- `src/app/providers.tsx` (add Toaster)
- `src/lib/toast-helpers.ts` (new)

**Configuration**:

```typescript
// toaster.tsx
<Toaster position="bottom-left" richColors expand={true} />
```

---

### Step 3: Implement Wallet Connection

**Duration**: 1 hour

**Tasks**:

- [ ] Create `app/providers/wallet-provider.tsx` with SSR disabled
- [ ] Add Phantom, Solflare, Torus adapters
- [ ] Replace mock `auth-store.ts` connect() with real wallet adapter
- [ ] Update `wallet-modal.tsx` connect page to trigger real wallet connection
- [ ] Test connection flow with Phantom wallet

**Files to Create/Modify**:

- `src/app/providers/wallet-provider.tsx` (new, dynamic import with ssr: false)
- `src/stores/auth-store.ts` (replace mock with real wallet integration)
- `src/components/wallet/wallet-modal.tsx` (wire connect buttons)

**Key Pattern**:

```typescript
// wallet-provider.tsx (must be dynamically imported)
'use client'
import { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';

export function WalletProviderComponent({ children }) {
  const wallets = useMemo(() => [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
  ], []);

  return (
    <ConnectionProvider endpoint={process.env.NEXT_PUBLIC_SOLANA_RPC_URL}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

// app/providers.tsx
const WalletProvider = dynamic(
  () => import('./wallet-provider').then(mod => ({ default: mod.WalletProviderComponent })),
  { ssr: false }
);
```

---

### Step 4: Integrate Vault Management

**Duration**: 2 hours

**Tasks**:

- [ ] Copy `useVault` hook from test-ui
- [ ] Create `stores/vault-store.ts` wrapping vault hook
- [ ] Wire Smart Vault page to call `vault.initialize()`
- [ ] Update navbar balance to fetch from `vault.getBalance()`
- [ ] Implement Add Funds page deposit via `vault.depositSol()`
- [ ] Update `wallet-manage-modal.tsx` deposit/withdraw
- [ ] **Always fetch balance after successful deposit/withdraw**

**Files to Create/Modify**:

- `src/lib/sdk/hooks/useVault.ts` (copy from test-ui)
- `src/stores/vault-store.ts` (new Zustand store)
- `src/components/wallet/wallet-modal.tsx` (Smart Vault & Add Funds pages)
- `src/components/wallet/wallet-manage-modal.tsx` (deposit/withdraw)
- `src/components/layout/top-navbar.tsx` (balance display)

**Balance Fetch Pattern**:

```typescript
async function deposit(amount: number) {
  const signature = await vault.depositSol({
    userPublicKey: publicKey.toBase58(),
    amount,
    sendTransaction,
    signTransaction,
  });

  // Wait for confirmation
  await connection.confirmTransaction(signature);

  // Now fetch updated balance
  const newBalance = await vault.getBalance(publicKey.toBase58());
  setBalance(newBalance);

  toast.success(`Deposited ${amount} SOL`);
}
```

---

### Step 5: Setup Allowance/Session Keys

**Duration**: 1 hour

**Tasks**:

- [ ] Copy `useAllowance` hook from test-ui
- [ ] Integrate into Create Play Session page
- [ ] Store allowancePda in auth-store
- [ ] Wire "Renew Session" in `play-timer-modal.tsx`
- [ ] Test full onboarding flow

**Files to Create/Modify**:

- `src/lib/sdk/hooks/useAllowance.ts` (copy from test-ui)
- `src/stores/auth-store.ts` (add allowancePda field)
- `src/components/wallet/wallet-modal.tsx` (Create Play Session page)
- `src/components/wallet/play-timer-modal.tsx` (extend allowance)

**Allowance Structure**:

```typescript
interface AllowanceAccount {
  userVault: PublicKey;
  sessionKey: PublicKey;
  initialLamports: u64;
  remainingLamports: u64;
  revoked: boolean;
  expiresAt: i64;
}
```

---

### Step 6: Build Coinflip Test Page

**Duration**: 2 hours

**Tasks**:

- [ ] Create `/casino/coinflip-test/page.tsx`
- [ ] Copy UI from `test-ui/src/components/BettingInterface.tsx`
- [ ] Call `POST /api/coinflip/play` (blockchain:8080)
- [ ] Display instant result with VRF proof
- [ ] **Do NOT update balance immediately**
- [ ] Poll `GET /api/game/{id}` for settlement status
- [ ] Show "Settling..." with countdown
- [ ] **Fetch balance only after `settlement_status === 'SettlementComplete'`**
- [ ] Display Solana TX link

**Files to Create**:

- `src/app/casino/coinflip-test/page.tsx` (new)

**Settlement Poll Pattern**:

```typescript
async function placeBet(choice: "heads" | "tails", amount: number) {
  setPlacingBet(true);

  // Place bet - instant result
  const result = await fetch("http://localhost:8080/api/coinflip/play", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      player_id: publicKey.toBase58(),
      choice,
      token: { symbol: "SOL", mint_address: null },
      bet_amount: amount,
    }),
  }).then((r) => r.json());

  setPlacingBet(false);

  // Show result immediately
  setLastBet(result);
  toast.success(`${result.outcome}! ${result.result.coin_result}`);

  // Poll for settlement (every 3s)
  const startTime = Date.now();
  const pollInterval = setInterval(async () => {
    const game = await fetch(
      `http://localhost:8080/api/game/${result.game_id}`,
    ).then((r) => r.json());

    // Update settlement status UI
    setSettlementStatus(game.settlement_status);

    if (game.settlement_status === "SettlementComplete") {
      clearInterval(pollInterval);

      // NOW fetch balance from chain
      await fetchVaultBalance();

      toast.success("Settlement complete on Solana!", {
        description: `TX: ${game.solana_tx_id?.slice(0, 8)}...`,
      });
    }

    // Timeout after 30s
    if (Date.now() - startTime > 30000) {
      clearInterval(pollInterval);
      toast.error("Settlement timeout - check later");
    }
  }, 3000);
}
```

---

### Step 7: Integrate WebSocket Live Data

**Duration**: 1.5 hours

**Tasks**:

- [ ] Copy `WebSocketManager` and `useWebSocket` from test-ui
- [ ] Create `providers/websocket-provider.tsx`
- [ ] Connect to `ws://localhost:8080/ws?casino=true&blocks=true`
- [ ] Wire `casino-stats` to `stats-carousel.tsx`
- [ ] Wire `recent-win` to `recent-wins.tsx` and `bets-table.tsx`
- [ ] Wire `block-updates` to `recent-blocks.tsx`
- [ ] Test real-time updates

**Files to Create/Modify**:

- `src/lib/sdk/websocket/manager.ts` (copy from test-ui)
- `src/lib/sdk/hooks/useWebSocket.ts` (copy from test-ui)
- `src/app/providers/websocket-provider.tsx` (new)
- `src/components/home/stats-carousel.tsx` (replace mock with real data)
- `src/components/home/recent-wins.tsx` (replace mock with real data)
- `src/components/ui/bets-table.tsx` (replace mock with real data)
- `src/components/home/recent-blocks.tsx` (replace mock with real data)

**WebSocket Event Types**:

```typescript
// Casino win event
{
  type: "casino_win",
  game_type: "coinflip",
  wallet: "8JQC...uDm",
  amount_won: 2.0,
  currency: "SOL",
  timestamp: 1738272847,
  tx_id: "12345"
}

// Casino stats event (every 5s)
{
  type: "casino_stats",
  total_wagered: 1500.5,
  gross_rtp: 97.8,
  bet_count: 1234,
  bankroll: 5000.0,
  wins_24h: 89,
  wagered_24h: 450.2,
  timestamp: 1738272847
}

// Block update event
{
  type: "new_block",
  height: 150000,
  hash: "a1b2c3...",
  tx_count: 15,
  timestamp: 1738272847,
  transactions: ["tx1", "tx2", ...]
}
```

---

### Step 8: Implement Smart Balance Management

**Duration**: 1 hour

**Tasks**:

- [ ] Create `lib/balance-manager.ts` utility
- [ ] Implement fetch-only-when-needed strategy
- [ ] Update Zustand store with balance management logic
- [ ] Add settlement status UI components
- [ ] Handle settlement failure with retry UI

**Files to Create/Modify**:

- `src/lib/balance-manager.ts` (new)
- `src/stores/vault-store.ts` (add balance management)

**Balance Manager Pattern**:

```typescript
class BalanceManager {
  private lastFetchTime: number = 0;
  private balance: number = 0;

  shouldFetch(
    reason: "mount" | "deposit" | "withdraw" | "settlement" | "manual",
  ): boolean {
    // Always fetch for these reasons
    if (["deposit", "withdraw", "settlement", "manual"].includes(reason)) {
      return true;
    }

    // For mount, only if not fetched in last 5s
    const now = Date.now();
    if (now - this.lastFetchTime > 5000) {
      return true;
    }

    return false;
  }

  async fetchBalance(connection: Connection, vaultPda: PublicKey) {
    const accountInfo = await connection.getAccountInfo(vaultPda);
    if (!accountInfo) return 0;

    const vault = deserializeUserVault(accountInfo.data);
    this.balance = vault.sol_balance / 1_000_000_000; // lamports to SOL
    this.lastFetchTime = Date.now();

    return this.balance;
  }
}
```

---

## API Reference

### Blockchain Service (Port 8080)

#### POST /api/coinflip/play

Place a coinflip bet.

**Request**:

```json
{
  "player_id": "8JQC...uDm",
  "choice": "heads",
  "token": { "symbol": "SOL", "mint_address": null },
  "bet_amount": 0.1
}
```

**Response** (15-25ms):

```json
{
  "game_id": "12345",
  "status": "complete",
  "outcome": "Win",
  "result": {
    "coin_result": "Heads",
    "outcome": "win",
    "vrf": {
      "vrf_output": "a1b2c3...",
      "vrf_proof": "d4e5f6...",
      "vrf_input_message": "block:150000,tx:12345,..."
    }
  },
  "payout": 2000000000,
  "player_balance": 3500000000,
  "timestamp": 1738272847
}
```

#### GET /api/game/{game_id}

Get game result and settlement status.

**Response**:

```json
{
  "game_id": "12345",
  "status": "complete",
  "settlement_status": "SettlementComplete",
  "solana_tx_id": "5X7Y...",
  "outcome": "win",
  "payout": 2000000000,
  "timestamp": 1738272847
}
```

**Settlement Status Values**:

- `PendingSettlement` - Waiting for processor
- `SubmittedToSolana` - Transaction submitted
- `SettlementComplete` - Confirmed on-chain
- `SettlementFailed` - Settlement failed (will retry)

#### WebSocket /ws

Real-time events.

**Connection**:

```javascript
const ws = new WebSocket("ws://localhost:8080/ws?casino=true&blocks=true");
```

**Events**: See WebSocket Event Types section above.

---

## Environment Configuration

### Frontend (.env.local)

```bash
# Blockchain API (VRF Game Engine)
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080

# Solana Configuration
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_VAULT_PROGRAM_ID=BtZT2B1NkEGZwNT5CS326HbdbXzggiTYSUiYmSDyhTDJ

# Optional: Settlement API Key
# NEXT_PUBLIC_SETTLEMENT_API_KEY=settlement-api-key-2026
```

### Backend Services

**Blockchain** (`backend/blockchain/atomiq.toml`):

```toml
[api]
port = 8080
enable_games = true

[settlement]
enable = true
```

**Processor** (`backend/transaction-processor/.env`):

```bash
BLOCKCHAIN_API_URL=http://localhost:8080
BLOCKCHAIN_POLL_INTERVAL_SECONDS=10
SETTLEMENT_WORKER_COUNT=6

SOLANA_RPC_URL=https://api.devnet.solana.com
VAULT_PROGRAM_ID=BtZT2B1NkEGZwNT5CS326HbdbXzggiTYSUiYmSDyhTDJ
```

---

## Testing Checklist

### Step 1: Dependencies

- [ ] All packages installed successfully
- [ ] SDK folder copied to `src/lib/sdk/`
- [ ] TypeScript compiles without errors

### Step 2: Toast System

- [ ] Sonner toast appears bottom-left
- [ ] Success/error/loading toasts work
- [ ] Toast auto-dismisses after 5s

### Step 3: Wallet Connection

- [ ] Phantom wallet connects successfully
- [ ] Public key displayed in UI
- [ ] Disconnect works
- [ ] Auto-connect on page reload

### Step 4: Vault Management

- [ ] Vault PDA derived correctly
- [ ] Initialize vault transaction succeeds
- [ ] Deposit SOL works
- [ ] Withdraw SOL works
- [ ] Balance updates after deposit/withdraw
- [ ] Balance displayed in navbar

### Step 5: Allowance/Session Keys

- [ ] Session key created successfully
- [ ] Allowance amount set correctly
- [ ] Extend allowance works
- [ ] Allowance PDA stored in auth store

### Step 6: Coinflip Betting

- [ ] Bet placed successfully
- [ ] Result shown in <25ms
- [ ] VRF proof displayed
- [ ] Settlement status shows "Settling..."
- [ ] Balance NOT updated immediately
- [ ] Poll detects settlement completion
- [ ] Balance fetched after settlement
- [ ] Solana TX link displayed

### Step 7: WebSocket

- [ ] WebSocket connects successfully
- [ ] Casino stats update every 5s
- [ ] Recent wins appear in real-time
- [ ] Block updates appear
- [ ] No memory leaks (check DevTools)

### Step 8: Balance Management

- [ ] Balance fetches on mount (once)
- [ ] Balance doesn't poll continuously
- [ ] Balance updates after deposit
- [ ] Balance updates after withdraw
- [ ] Balance updates after settlement
- [ ] Manual refresh button works

---

## Troubleshooting

### Issue: WebSocket Connection Fails

**Symptoms**: Console shows `WebSocket connection failed`

**Solutions**:

1. Check blockchain service is running on port 8080
2. Verify WebSocket URL: `ws://localhost:8080/ws`
3. Check browser console for CORS errors
4. Try clearing browser cache

### Issue: Balance Not Updating

**Symptoms**: Balance shows 0 or stale value

**Solutions**:

1. Check vault PDA derivation is correct
2. Verify Solana RPC URL is accessible
3. Check vault account exists on-chain
4. Manually fetch balance with:
   ```typescript
   const accountInfo = await connection.getAccountInfo(vaultPda);
   console.log("Vault account:", accountInfo);
   ```

### Issue: Settlement Takes Too Long

**Symptoms**: Settlement status stuck at "PendingSettlement"

**Solutions**:

1. Check processor service is running
2. Verify processor is polling blockchain:8080
3. Check processor logs: `cd backend/transaction-processor && cat logs/processor.log`
4. Restart processor: `./restart-processor.sh`

### Issue: Wallet Connection Fails

**Symptoms**: "Wallet not detected" or connection modal doesn't open

**Solutions**:

1. Ensure wallet is installed (Phantom, Solflare)
2. Check WalletProvider is wrapped with `ssr: false`
3. Verify wallet adapter versions match
4. Clear browser extension cache

### Issue: Transaction Fails

**Symptoms**: Transaction rejected or times out

**Solutions**:

1. Check user has sufficient SOL for transaction
2. Verify vault is initialized
3. Check allowance is not revoked
4. Increase slippage/priority fee
5. Check Solana RPC is not rate-limited

---

## Best Practices

### 1. Error Handling

Always wrap async operations in try-catch:

```typescript
async function deposit(amount: number) {
  try {
    const signature = await vault.depositSol({...});
    toast.success('Deposit successful!');
  } catch (error) {
    console.error('Deposit failed:', error);
    toast.error(`Deposit failed: ${error.message}`);
  }
}
```

### 2. Loading States

Show loading indicators during async operations:

```typescript
const [isDepositing, setIsDepositing] = useState(false);

async function deposit(amount: number) {
  setIsDepositing(true);
  try {
    await vault.depositSol({...});
  } finally {
    setIsDepositing(false);
  }
}
```

### 3. Transaction Confirmations

Always wait for transaction confirmation:

```typescript
const signature = await sendTransaction(transaction, connection);
await connection.confirmTransaction(signature, "confirmed");
```

### 4. Balance Caching

Cache balance to avoid unnecessary fetches:

```typescript
const [balance, setBalance] = useState<number | null>(null);
const [lastFetch, setLastFetch] = useState(0);

async function fetchBalance() {
  // Only fetch if > 5s since last fetch
  if (Date.now() - lastFetch < 5000) return balance;

  const newBalance = await vault.getBalance(...);
  setBalance(newBalance);
  setLastFetch(Date.now());
  return newBalance;
}
```

---

## Next Steps After Integration

1. **Performance Optimization**
   - Implement proper memoization
   - Add virtualization for large lists
   - Optimize WebSocket message handling

2. **Enhanced UX**
   - Add settlement countdown timer
   - Show settlement progress bar
   - Add transaction history page

3. **Error Recovery**
   - Implement automatic retry for failed settlements
   - Add manual retry buttons
   - Show customer support contact

4. **Testing**
   - Add E2E tests with Playwright
   - Add unit tests for SDK functions
   - Add integration tests for API calls

5. **Monitoring**
   - Add Sentry for error tracking
   - Add analytics for user actions
   - Monitor settlement success rate

---

## References

- **Test UI Source**: `backend/transaction-processor/test-ui/`
- **Solana Wallet Adapter**: https://github.com/solana-labs/wallet-adapter
- **Solana Web3.js**: https://solana-labs.github.io/solana-web3.js/
- **Sonner Toast**: https://sonner.emilkowal.ski/
- **Next.js Dynamic Imports**: https://nextjs.org/docs/advanced-features/dynamic-import

---

**Last Updated**: January 31, 2026  
**Integration Status**: Ready to implement  
**Estimated Total Time**: 8-10 hours
