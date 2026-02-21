# Changelog

All notable changes to the Atomiq project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Tags are applied across all three repositories simultaneously:
- **atomiq** — Blockchain backend (Rust, game processing, APIs)
- **atomiq-bet-settlement** — Smart contracts & settlement service (Anchor/Solana)
- **atomiq-frontend** — Next.js frontend (React, wallet integration, games UI)

---

## [v0.30] - 2026-02-21

### Frontend (`atomiq-frontend`)
#### Added
- Play session creation via on-chain allowance (3-hour sessions, 10 SOL)
- Auto-initialize user vault before creating allowances
- `useBetCooldown` hook — 500ms minimum interval between bets across all games
- Transaction simulation error extraction with program logs
- User-friendly error messages for Solana program failures

#### Fixed
- `createAllowanceService` re-created on every render causing hook invalidation (memoized)
- Broken unsigned transaction simulation crashing silently (removed pre-flight sim)
- `signTransaction` path swallowing real errors then falling through to opaque `sendTransaction` error
- Error mapping incorrectly labeling Anchor error codes as "insufficient funds"
- Allowance duration exceeding on-chain max (deployed program enforces 3h, not 30 days)

### Backend (`atomiq`)
- Dice, Coinflip, Plinko, Slots game processing
- VRF-based provably fair outcomes
- Settlement API endpoints
- WebSocket block streaming
- Casino stats API

### Settlement (`atomiq-bet-settlement`)
- Anchor smart contracts (vault, allowance, settlement)
- `approve_allowance_v2` with nonce-based deterministic PDAs
- Rate limiter and `spend_from_allowance`
- Batch spend and payout instructions
- Casino vault management
- Test UI for contract interaction

---

## [v0.20] - 2026-02-01

_Initial integrated version — games playable end-to-end with wallet connection._

### Frontend
- Wallet connection via Phantom (Solana wallet adapter)
- Dice, Coinflip, Plinko, Slots game UIs
- Real-time WebSocket updates for blocks and wins
- Auth store with vault-based user management

### Backend
- Blockchain game processor with VRF
- REST API for game submission and results
- Block finalization engine

### Settlement
- Vault program (initialize, deposit, withdraw)
- Allowance system v1
- Basic casino vault operations
