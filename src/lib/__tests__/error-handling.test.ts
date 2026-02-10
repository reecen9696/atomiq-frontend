/**
 * Error Handling Tests
 * Tests for error handling utilities in src/lib/error-handling.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  AppError,
  ErrorCode,
  ErrorSeverity,
  ErrorFactory,
  ErrorHandler,
  errorHandler,
  handleQueryError,
  retryWithBackoff,
} from '../error-handling'

describe('error-handling', () => {
  describe('AppError', () => {
    it('creates error with default values', () => {
      const error = new AppError('Test error')
      expect(error.message).toBe('Test error')
      expect(error.code).toBe(ErrorCode.UNKNOWN_ERROR)
      expect(error.severity).toBe(ErrorSeverity.MEDIUM)
      expect(error.timestamp).toBeInstanceOf(Date)
    })

    it('creates error with custom values', () => {
      const context = { userId: '123' }
      const error = new AppError(
        'Network failed',
        ErrorCode.NETWORK_ERROR,
        ErrorSeverity.HIGH,
        context,
        'Please check your connection'
      )
      expect(error.code).toBe(ErrorCode.NETWORK_ERROR)
      expect(error.severity).toBe(ErrorSeverity.HIGH)
      expect(error.context).toEqual(context)
      expect(error.userMessage).toBe('Please check your connection')
    })

    it('serializes to JSON correctly', () => {
      const error = new AppError('Test error')
      const json = error.toJSON()
      expect(json.name).toBe('AppError')
      expect(json.message).toBe('Test error')
      expect(json.code).toBe(ErrorCode.UNKNOWN_ERROR)
      expect(json.severity).toBe(ErrorSeverity.MEDIUM)
      expect(json.timestamp).toBeDefined()
    })

    it('is instance of AppError', () => {
      const error = new AppError('Test error')
      expect(error instanceof AppError).toBe(true)
      expect(error instanceof Error).toBe(true)
    })
  })

  describe('ErrorFactory', () => {
    it('creates network error', () => {
      const error = ErrorFactory.network('Connection failed')
      expect(error.code).toBe(ErrorCode.NETWORK_ERROR)
      expect(error.severity).toBe(ErrorSeverity.HIGH)
      expect(error.userMessage).toContain('Network connection failed')
    })

    it('creates validation error', () => {
      const error = ErrorFactory.validation('Invalid input')
      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR)
      expect(error.severity).toBe(ErrorSeverity.LOW)
      expect(error.userMessage).toContain('check your input')
    })

    it('creates auth error', () => {
      const error = ErrorFactory.auth('Unauthorized')
      expect(error.code).toBe(ErrorCode.AUTH_ERROR)
      expect(error.severity).toBe(ErrorSeverity.HIGH)
      expect(error.userMessage).toContain('Authentication failed')
    })

    it('creates not found error', () => {
      const error = ErrorFactory.notFound('User')
      expect(error.code).toBe(ErrorCode.NOT_FOUND)
      expect(error.message).toContain('User not found')
    })

    it('creates server error', () => {
      const error = ErrorFactory.server('Internal error')
      expect(error.code).toBe(ErrorCode.SERVER_ERROR)
      expect(error.severity).toBe(ErrorSeverity.HIGH)
    })

    it('creates timeout error', () => {
      const error = ErrorFactory.timeout('Request timeout')
      expect(error.code).toBe(ErrorCode.TIMEOUT_ERROR)
      expect(error.severity).toBe(ErrorSeverity.MEDIUM)
    })

    it('creates websocket error', () => {
      const error = ErrorFactory.websocket('Connection lost')
      expect(error.code).toBe(ErrorCode.WEBSOCKET_ERROR)
      expect(error.userMessage).toContain('reconnect')
    })
  })

  describe('ErrorHandler', () => {
    let handler: ErrorHandler

    beforeEach(() => {
      handler = ErrorHandler.getInstance()
    })

    it('is a singleton', () => {
      const handler1 = ErrorHandler.getInstance()
      const handler2 = ErrorHandler.getInstance()
      expect(handler1).toBe(handler2)
    })

    it('handles AppError', () => {
      const originalError = new AppError('Test', ErrorCode.NETWORK_ERROR)
      const handled = handler.handle(originalError)
      expect(handled).toBe(originalError)
    })

    it('converts Error to AppError', () => {
      const originalError = new Error('Standard error')
      const handled = handler.handle(originalError)
      expect(handled).toBeInstanceOf(AppError)
      expect(handled.message).toBe('Standard error')
      expect(handled.code).toBe(ErrorCode.UNKNOWN_ERROR)
    })

    it('converts unknown to AppError', () => {
      const handled = handler.handle('string error')
      expect(handled).toBeInstanceOf(AppError)
      expect(handled.message).toBe('string error')
    })

    it('includes context in handled error', () => {
      const context = { operation: 'test' }
      const handled = handler.handle(new Error('Test'), context)
      expect(handled.context).toMatchObject(context)
    })

    it('safely handles async operations - success', async () => {
      const promise = Promise.resolve('success')
      const [result, error] = await handler.safely(promise)
      expect(result).toBe('success')
      expect(error).toBeNull()
    })

    it('safely handles async operations - failure', async () => {
      const promise = Promise.reject(new Error('Failed'))
      const [result, error] = await handler.safely(promise)
      expect(result).toBeNull()
      expect(error).toBeInstanceOf(AppError)
    })

    it('safely handles sync operations - success', () => {
      const fn = () => 'success'
      const [result, error] = handler.safeSync(fn)
      expect(result).toBe('success')
      expect(error).toBeNull()
    })

    it('safely handles sync operations - failure', () => {
      const fn = () => {
        throw new Error('Failed')
      }
      const [result, error] = handler.safeSync(fn)
      expect(result).toBeNull()
      expect(error).toBeInstanceOf(AppError)
    })

    it('calls error reporter for high severity errors', () => {
      const reporter = vi.fn()
      handler.setErrorReporter(reporter)
      
      const error = new AppError('Test', ErrorCode.SERVER_ERROR, ErrorSeverity.HIGH)
      handler.handle(error)
      
      expect(reporter).toHaveBeenCalledWith(error)
    })

    it('does not call reporter for low severity errors', () => {
      const reporter = vi.fn()
      handler.setErrorReporter(reporter)
      
      const error = new AppError('Test', ErrorCode.VALIDATION_ERROR, ErrorSeverity.LOW)
      handler.handle(error)
      
      expect(reporter).not.toHaveBeenCalled()
    })
  })

  describe('handleQueryError', () => {
    it('handles Response errors', () => {
      const response = new Response(null, {
        status: 404,
        statusText: 'Not Found',
      })
      const error = handleQueryError(response)
      expect(error.code).toBe(ErrorCode.NETWORK_ERROR)
      expect(error.message).toContain('404')
    })

    it('handles unknown errors', () => {
      const error = handleQueryError('Unknown error')
      expect(error).toBeInstanceOf(AppError)
    })
  })

  describe('retryWithBackoff', () => {
    it('succeeds on first attempt', async () => {
      const fn = vi.fn().mockResolvedValue('success')
      const result = await retryWithBackoff(fn, 3, 100)
      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('retries on failure and eventually succeeds', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValue('success')
      
      const result = await retryWithBackoff(fn, 3, 10)
      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(3)
    })

    it('throws after max attempts', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Always fails'))
      
      await expect(retryWithBackoff(fn, 3, 10)).rejects.toThrow()
      expect(fn).toHaveBeenCalledTimes(3)
    })

    it('uses exponential backoff', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('Fail'))
        .mockResolvedValue('success')
      
      const start = Date.now()
      await retryWithBackoff(fn, 3, 50)
      const duration = Date.now() - start
      
      // Should wait at least the base delay
      expect(duration).toBeGreaterThanOrEqual(50)
    })
  })
})
