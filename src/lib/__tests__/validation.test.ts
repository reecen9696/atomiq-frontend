/**
 * Validation Tests
 * Tests for validation utilities in src/lib/validation.ts
 */

import { describe, it, expect } from 'vitest'
import {
  isValidEmail,
  isValidWalletAddress,
  isValidAmount,
  validateForm,
  sanitizeHtml,
  sanitizeInput,
  emailSchema,
  passwordSchema,
  walletAddressSchema,
  amountSchema,
} from '../validation'
import { z } from 'zod'

describe('validation', () => {
  describe('emailSchema', () => {
    it('accepts valid email addresses', () => {
      expect(emailSchema.safeParse('test@example.com').success).toBe(true)
      expect(emailSchema.safeParse('user.name+tag@domain.co.uk').success).toBe(true)
    })

    it('rejects invalid email addresses', () => {
      expect(emailSchema.safeParse('invalid').success).toBe(false)
      expect(emailSchema.safeParse('missing@domain').success).toBe(false)
      expect(emailSchema.safeParse('@nodomain.com').success).toBe(false)
    })
  })

  describe('passwordSchema', () => {
    it('accepts valid passwords', () => {
      expect(passwordSchema.safeParse('Password1').success).toBe(true)
      expect(passwordSchema.safeParse('StrongP@ssw0rd').success).toBe(true)
    })

    it('rejects passwords without uppercase', () => {
      expect(passwordSchema.safeParse('password1').success).toBe(false)
    })

    it('rejects passwords without lowercase', () => {
      expect(passwordSchema.safeParse('PASSWORD1').success).toBe(false)
    })

    it('rejects passwords without number', () => {
      expect(passwordSchema.safeParse('Password').success).toBe(false)
    })

    it('rejects passwords shorter than 8 characters', () => {
      expect(passwordSchema.safeParse('Pass1').success).toBe(false)
    })
  })

  describe('walletAddressSchema', () => {
    it('accepts valid Solana wallet addresses', () => {
      // Use a valid Base58 string with 32-44 chars (no 0, O, I, l)
      const validAddress = '11111111111111111111111111111111'
      expect(walletAddressSchema.safeParse(validAddress).success).toBe(true)
    })

    it('rejects invalid wallet addresses', () => {
      expect(walletAddressSchema.safeParse('invalid').success).toBe(false)
      expect(walletAddressSchema.safeParse('0x123').success).toBe(false)
      expect(walletAddressSchema.safeParse('').success).toBe(false)
    })
  })

  describe('amountSchema', () => {
    it('accepts positive finite numbers', () => {
      expect(amountSchema.safeParse(1).success).toBe(true)
      expect(amountSchema.safeParse(0.1).success).toBe(true)
      expect(amountSchema.safeParse(999.99).success).toBe(true)
    })

    it('rejects zero', () => {
      expect(amountSchema.safeParse(0).success).toBe(false)
    })

    it('rejects negative numbers', () => {
      expect(amountSchema.safeParse(-1).success).toBe(false)
      expect(amountSchema.safeParse(-0.1).success).toBe(false)
    })

    it('rejects NaN', () => {
      expect(amountSchema.safeParse(NaN).success).toBe(false)
    })

    it('rejects Infinity', () => {
      expect(amountSchema.safeParse(Infinity).success).toBe(false)
      expect(amountSchema.safeParse(-Infinity).success).toBe(false)
    })
  })

  describe('isValidEmail', () => {
    it('returns true for valid emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
    })

    it('returns false for invalid emails', () => {
      expect(isValidEmail('invalid')).toBe(false)
    })
  })

  describe('isValidWalletAddress', () => {
    it('returns true for valid wallet addresses', () => {
      expect(isValidWalletAddress('11111111111111111111111111111111')).toBe(true)
    })

    it('returns false for invalid wallet addresses', () => {
      expect(isValidWalletAddress('invalid')).toBe(false)
    })
  })

  describe('isValidAmount', () => {
    it('returns true for valid amounts', () => {
      expect(isValidAmount(1)).toBe(true)
      expect(isValidAmount(0.1)).toBe(true)
    })

    it('returns false for invalid amounts', () => {
      expect(isValidAmount(0)).toBe(false)
      expect(isValidAmount(-1)).toBe(false)
      expect(isValidAmount(NaN)).toBe(false)
      expect(isValidAmount(Infinity)).toBe(false)
    })
  })

  describe('validateForm', () => {
    const testSchema = z.object({
      name: z.string().min(3),
      age: z.number().positive(),
    })

    it('returns valid result for correct data', () => {
      const result = validateForm({ name: 'John', age: 25 }, testSchema)
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual({})
    })

    it('returns errors for invalid data', () => {
      const result = validateForm({ name: 'Jo', age: -5 }, testSchema)
      expect(result.isValid).toBe(false)
      expect(Object.keys(result.errors).length).toBeGreaterThan(0)
    })

    it('includes error messages for each field', () => {
      const result = validateForm({ name: '', age: 0 }, testSchema)
      expect(result.errors.name).toBeDefined()
      expect(result.errors.age).toBeDefined()
    })
  })

  describe('sanitizeHtml', () => {
    it('escapes HTML special characters', () => {
      expect(sanitizeHtml('<script>alert("xss")</script>'))
        .toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;')
    })

    it('escapes angle brackets', () => {
      expect(sanitizeHtml('<div>')).toBe('&lt;div&gt;')
    })

    it('escapes quotes', () => {
      expect(sanitizeHtml('"quoted"')).toBe('&quot;quoted&quot;')
      expect(sanitizeHtml("'quoted'")).toBe('&#x27;quoted&#x27;')
    })

    it('handles empty strings', () => {
      expect(sanitizeHtml('')).toBe('')
    })
  })

  describe('sanitizeInput', () => {
    it('trims whitespace', () => {
      expect(sanitizeInput('  test  ')).toBe('test')
    })

    it('collapses multiple spaces', () => {
      expect(sanitizeInput('test  multiple   spaces')).toBe('test multiple spaces')
    })

    it('handles empty strings', () => {
      expect(sanitizeInput('')).toBe('')
    })

    it('handles strings with only whitespace', () => {
      expect(sanitizeInput('   ')).toBe('')
    })
  })
})
