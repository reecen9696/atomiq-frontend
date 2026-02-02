"use client";

export { useBetting } from "./useBetting";
export { useWebSocket } from "./useWebSocket";
export { useAllowance, useAllowanceForCasino } from "./useAllowance";

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
export type {
  UseAllowanceState,
  UseAllowanceActions,
  UseAllowanceResult,
} from "./useAllowance";
