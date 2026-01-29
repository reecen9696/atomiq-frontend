export interface Block {
  id: string;
  blockNumber: number;
  hash: string;
  transactionCount: number;
  timestamp: string;
}

/**
 * Mock data for recent blocks
 * TODO: Replace with actual API data
 */
export const mockBlocks: Block[] = Array.from({ length: 5 }, (_, i) => ({
  id: `block-${i + 1}`,
  blockNumber: 323211 - i * 100,
  hash: "43wD...IJ32q",
  transactionCount: i + 1,
  timestamp: `${i * 3 + 3} secs ago`,
}));
