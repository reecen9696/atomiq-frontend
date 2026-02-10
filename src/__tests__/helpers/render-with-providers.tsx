/**
 * Render with Providers
 * Utility for rendering components with all necessary providers for testing
 */

import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createConnectedWalletContext, createMockWalletContext } from './mock-wallet'

/**
 * Options for rendering with providers
 */
export interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  walletConnected?: boolean
  walletAddress?: string
  initialBalance?: number
  initialVaultBalance?: number
}

/**
 * Create a test query client
 */
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

/**
 * Render a component with all providers
 */
export function renderWithProviders(
  ui: React.ReactElement,
  options: RenderWithProvidersOptions = {}
) {
  const {
    walletConnected = false,
    walletAddress,
    initialBalance,
    initialVaultBalance,
    ...renderOptions
  } = options

  const queryClient = createTestQueryClient()

  // Create wallet context based on connection state
  const walletContext = walletConnected
    ? createConnectedWalletContext(walletAddress)
    : createMockWalletContext()

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <div data-testid="mock-wallet-provider">
          {children}
        </div>
      </QueryClientProvider>
    )
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  }
}

/**
 * Simple wrapper without providers for basic tests
 */
export function renderSimple(ui: React.ReactElement, options?: RenderOptions) {
  return render(ui, options)
}
