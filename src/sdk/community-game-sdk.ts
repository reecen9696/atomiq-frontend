/**
 * Atomiq Community Game SDK
 * Type definitions and interfaces for community game developers
 */

/**
 * VRF (Verifiable Random Function) Result
 */
export interface VRFResult {
  /** Hex random value */
  output: string;
  
  /** Verification proof */
  proof: string;
  
  /** Input for reproducibility */
  inputMessage: string;
  
  /** Normalized random number (0-1) */
  randomNumber: number;
}

/**
 * Bet Result
 */
export interface BetResult {
  betId: string;
  gameId: string;
  amount: number;
  status: 'placed' | 'error';
  timestamp: number;
}

/**
 * Settlement Result
 */
export interface SettlementResult {
  betId: string;
  outcome: 'win' | 'loss';
  payout: number;
  solanaSignature?: string;
  settlementStatus: 'pending' | 'submitted' | 'complete' | 'failed';
}

/**
 * VRF Proof for Provably Fair Gaming
 */
export interface VRFProof {
  betId: string;
  output: string;
  proof: string;
  input: string;
  verified: boolean;
  timestamp: string;
}

/**
 * Atomiq Game SDK Interface
 * This is the contract that community games will use to interact with the platform
 */
export interface AtomiqGameSDK {
  /**
   * Request VRF (Verifiable Random Function)
   * This is the ONLY source of randomness allowed in community games
   */
  requestVRF(params: { gameId: string; betId: string }): Promise<VRFResult>;

  /**
   * Place a bet
   */
  placeBet(params: {
    amount: number;
    gameId: string;
    metadata?: Record<string, any>;
  }): Promise<BetResult>;

  /**
   * Settle a bet
   */
  settleBet(params: {
    betId: string;
    outcome: 'win' | 'loss';
    multiplier: number;
  }): Promise<SettlementResult>;

  /**
   * Get player's current balance
   */
  getPlayerBalance(): Promise<number>;

  /**
   * Get player's wallet address
   */
  getPlayerWallet(): string;

  /**
   * Register callback for settlement completion
   */
  onSettlementComplete(callback: (result: SettlementResult) => void): void;

  /**
   * Get VRF proof for a specific bet (for provably fair verification)
   */
  getVRFProof(betId: string): Promise<VRFProof>;
}

/**
 * SDK Endpoint Information
 * Used for documentation purposes
 */
export interface SDKEndpoint {
  name: string;
  method: string;
  description: string;
  parameters: {
    name: string;
    type: string;
    required: boolean;
    description: string;
  }[];
  returns: string;
  example: string;
}

/**
 * Available SDK Endpoints
 */
export const SDK_ENDPOINTS: SDKEndpoint[] = [
  {
    name: 'requestVRF',
    method: 'POST',
    description: 'Request a verifiable random value from the platform VRF',
    parameters: [
      {
        name: 'gameId',
        type: 'string',
        required: true,
        description: 'Unique identifier for your game',
      },
      {
        name: 'betId',
        type: 'string',
        required: true,
        description: 'Unique identifier for the current bet',
      },
    ],
    returns: 'VRFResult',
    example: `
const vrf = await sdk.requestVRF({ 
  gameId: 'my-game-123', 
  betId: bet.id 
});
const randomValue = vrf.randomNumber; // 0-1
    `,
  },
  {
    name: 'placeBet',
    method: 'POST',
    description: 'Place a new bet for the player',
    parameters: [
      {
        name: 'amount',
        type: 'number',
        required: true,
        description: 'Bet amount in SOL',
      },
      {
        name: 'gameId',
        type: 'string',
        required: true,
        description: 'Unique identifier for your game',
      },
      {
        name: 'metadata',
        type: 'Record<string, any>',
        required: false,
        description: 'Optional metadata for the bet',
      },
    ],
    returns: 'BetResult',
    example: `
const bet = await sdk.placeBet({
  amount: 0.1,
  gameId: 'my-game-123',
  metadata: { difficulty: 'hard' }
});
    `,
  },
  {
    name: 'settleBet',
    method: 'POST',
    description: 'Settle a bet with win/loss outcome',
    parameters: [
      {
        name: 'betId',
        type: 'string',
        required: true,
        description: 'ID of the bet to settle',
      },
      {
        name: 'outcome',
        type: "'win' | 'loss'",
        required: true,
        description: 'Outcome of the bet',
      },
      {
        name: 'multiplier',
        type: 'number',
        required: true,
        description: 'Payout multiplier (e.g., 2.0 for 2x)',
      },
    ],
    returns: 'SettlementResult',
    example: `
const result = await sdk.settleBet({
  betId: bet.id,
  outcome: 'win',
  multiplier: 2.5
});
    `,
  },
  {
    name: 'getPlayerBalance',
    method: 'GET',
    description: 'Get the current player balance',
    parameters: [],
    returns: 'Promise<number>',
    example: `
const balance = await sdk.getPlayerBalance();
console.log(\`Player has \${balance} SOL\`);
    `,
  },
  {
    name: 'getPlayerWallet',
    method: 'GET',
    description: 'Get the player wallet address',
    parameters: [],
    returns: 'string',
    example: `
const wallet = sdk.getPlayerWallet();
console.log(\`Player wallet: \${wallet}\`);
    `,
  },
  {
    name: 'getVRFProof',
    method: 'GET',
    description: 'Get VRF proof for provably fair verification',
    parameters: [
      {
        name: 'betId',
        type: 'string',
        required: true,
        description: 'ID of the bet to get proof for',
      },
    ],
    returns: 'VRFProof',
    example: `
const proof = await sdk.getVRFProof(betId);
console.log('Verified:', proof.verified);
    `,
  },
];
