/**
 * Mock Wallet Helpers
 * Provides mock wallet context and utilities for testing Solana wallet integration
 */

import React from 'react'
import { vi } from 'vitest'
import type { WalletContextState } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'

export const MOCK_WALLET_ADDRESS = 'TestWa11etAddress1111111111111111111111111'
export const MOCK_VAULT_ADDRESS = 'TestVau1tAddress1111111111111111111111111'

/**
 * Create a mock PublicKey
 */
export function createMockPublicKey(address?: string): PublicKey {
  return new PublicKey(address || MOCK_WALLET_ADDRESS)
}

/**
 * Create a mock wallet context
 */
export function createMockWalletContext(
  overrides?: Partial<WalletContextState>
): WalletContextState {
  const mockContext: WalletContextState = {
    autoConnect: false,
    wallets: [],
    wallet: null,
    publicKey: null,
    connecting: false,
    connected: false,
    disconnecting: false,
    select: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    sendTransaction: vi.fn(),
    signTransaction: undefined,
    signAllTransactions: undefined,
    signMessage: undefined,
    signIn: undefined,
    ...overrides,
  }

  return mockContext
}

/**
 * Create a mock connected wallet context
 */
export function createConnectedWalletContext(
  address?: string,
  overrides?: Partial<WalletContextState>
): WalletContextState {
  return createMockWalletContext({
    publicKey: createMockPublicKey(address),
    connected: true,
    connecting: false,
    wallet: {
      adapter: {
        name: 'Phantom',
        icon: '',
        url: 'https://phantom.app',
        publicKey: createMockPublicKey(address),
        connecting: false,
        connected: true,
        readyState: 'Installed' as any,
        supportedTransactionVersions: new Set(['legacy', 0]),
      } as any,
      readyState: 'Installed' as any,
    },
    ...overrides,
  })
}

/**
 * Mock WalletProvider for testing
 */
export function MockWalletProvider({
  children,
  ...contextOverrides
}: {
  children: React.ReactNode
} & Partial<WalletContextState>) {
  const mockContext = createMockWalletContext(contextOverrides)
  
  return React.createElement(
    'div',
    { 'data-testid': 'mock-wallet-provider' },
    children
  )
}
