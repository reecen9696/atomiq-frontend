export interface UniversalPlayRequest {
  player_id: string;
  player_address: string;
  vault_address?: string;
  game_type: string;
  bet_amount: number;
  token: { symbol: string };
  allowance_nonce?: number;
  game_params: Record<string, any>;
}

export interface UniversalPlayResponse {
  game_id: string;
  game_type: string;
  status: string;
  outcome?: string;
  result: Record<string, any>;
  payment: {
    bet_amount: number;
    payout_amount: number;
    net_pnl: number;
    multiplier: number;
  };
  vrf_proof?: string;
  timestamp: number;
}
