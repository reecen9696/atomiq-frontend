/**
 * Mock API Helpers
 * Utilities for mocking API responses in tests
 */

import { vi } from 'vitest'

/**
 * Mock a successful API response
 */
export function mockApiSuccess(endpoint: string, data: any) {
  global.fetch = vi.fn().mockImplementation((url: string) => {
    if (url.includes(endpoint)) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data }),
        text: async () => JSON.stringify({ success: true, data }),
      } as Response)
    }
    return Promise.reject(new Error('Not mocked'))
  })
}

/**
 * Mock an API error response
 */
export function mockApiError(endpoint: string, status: number, message?: string) {
  global.fetch = vi.fn().mockImplementation((url: string) => {
    if (url.includes(endpoint)) {
      return Promise.resolve({
        ok: false,
        status,
        json: async () => ({ 
          success: false, 
          error: message || `Error ${status}` 
        }),
        text: async () => JSON.stringify({ 
          success: false, 
          error: message || `Error ${status}` 
        }),
        statusText: message || 'Error',
      } as Response)
    }
    return Promise.reject(new Error('Not mocked'))
  })
}

/**
 * Mock a network error
 */
export function mockNetworkError(endpoint: string) {
  global.fetch = vi.fn().mockImplementation((url: string) => {
    if (url.includes(endpoint)) {
      return Promise.reject(new Error('Network error'))
    }
    return Promise.reject(new Error('Not mocked'))
  })
}

/**
 * Mock a timeout error
 */
export function mockTimeoutError(endpoint: string, delay: number = 5000) {
  global.fetch = vi.fn().mockImplementation((url: string) => {
    if (url.includes(endpoint)) {
      return new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), delay)
      })
    }
    return Promise.reject(new Error('Not mocked'))
  })
}

/**
 * Reset all fetch mocks
 */
export function resetFetchMocks() {
  vi.restoreAllMocks()
}
