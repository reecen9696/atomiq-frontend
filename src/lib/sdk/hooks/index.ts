"use client";

export { useBetting } from "./useBetting";
export { useWebSocket } from "./useWebSocket";

export type {
  UseBettingState,
  UseBettingActions,
  UseBettingResult,
} from "./useBetting";
export type {
  UseWebSocketState,
  UseWebSocketActions,
  UseWebSocketResult,
  CasinoStats,
  RecentWin,
  BlockUpdate,
} from "./useWebSocket";
