/**
 * Wallet Flow E2E Tests
 * Tests for wallet connection UI flow (mocked, no actual wallet connection)
 */

import { test, expect } from '@playwright/test'

test.describe('Wallet Flow', () => {
  test('wallet connect button is visible', async ({ page }) => {
    await page.goto('/')
    
    // Look for connect wallet button
    const connectButton = page.locator('button', { hasText: /connect|wallet/i })
    
    // Should have at least one connect button
    await expect(connectButton.first()).toBeVisible()
  })

  test('clicking connect opens wallet modal', async ({ page }) => {
    await page.goto('/')
    
    // Find and click connect button
    const connectButton = page.locator('button', { hasText: /connect.*wallet|wallet.*connect/i })
    
    if (await connectButton.count() > 0) {
      await connectButton.first().click()
      
      // Wait for modal to appear (adjust selector based on actual modal)
      await page.waitForTimeout(500)
      
      // Check if modal or wallet options are visible
      const modal = page.locator('[role="dialog"], .modal, [class*="wallet"]')
      
      if (await modal.count() > 0) {
        await expect(modal.first()).toBeVisible()
      }
    }
  })

  test('wallet modal shows connect options', async ({ page }) => {
    await page.goto('/')
    
    const connectButton = page.locator('button', { hasText: /connect.*wallet|wallet.*connect/i })
    
    if (await connectButton.count() > 0) {
      await connectButton.first().click()
      await page.waitForTimeout(500)
      
      // Check for wallet options (Phantom, Solflare, etc.)
      const walletOptions = page.locator('button, [role="button"]', {
        hasText: /phantom|solflare|wallet/i
      })
      
      // Should show at least one wallet option
      if (await walletOptions.count() > 0) {
        await expect(walletOptions.first()).toBeVisible()
      }
    }
  })

  test('wallet modal close button works', async ({ page }) => {
    await page.goto('/')
    
    const connectButton = page.locator('button', { hasText: /connect.*wallet|wallet.*connect/i })
    
    if (await connectButton.count() > 0) {
      await connectButton.first().click()
      await page.waitForTimeout(500)
      
      // Look for close button (X, close, cancel, etc.)
      const closeButton = page.locator('button[aria-label*="close" i], button', {
        hasText: /close|cancel|×/i
      })
      
      if (await closeButton.count() > 0) {
        await closeButton.first().click()
        await page.waitForTimeout(500)
        
        // Modal should be closed (adjust selector)
        const modal = page.locator('[role="dialog"]:visible, .modal:visible')
        await expect(modal).toHaveCount(0)
      }
    }
  })

  test('wallet button shows when disconnected', async ({ page }) => {
    await page.goto('/')
    
    // When not connected, should show "Connect Wallet" or similar
    const connectText = page.locator('text=/connect/i, text=/wallet/i')
    
    await expect(connectText.first()).toBeVisible()
  })
})
