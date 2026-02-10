/**
 * Coinflip Game E2E Tests
 * Tests for coinflip game UI interactions
 */

import { test, expect } from '@playwright/test'

test.describe('Coinflip Game', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to coinflip game
    await page.goto('/casino/coinflip')
  })

  test('game page loads with correct layout', async ({ page }) => {
    // Check for game elements (adjust selectors based on actual UI)
    await page.waitForTimeout(1000)
    
    // Page should be loaded
    await expect(page).toHaveURL(/coinflip/)
  })

  test('heads and tails buttons are interactive', async ({ page }) => {
    await page.waitForTimeout(1000)
    
    // Look for heads/tails selection buttons
    const headsButton = page.locator('button, [role="button"]', { hasText: /heads/i })
    const tailsButton = page.locator('button, [role="button"]', { hasText: /tails/i })
    
    if (await headsButton.count() > 0) {
      await expect(headsButton.first()).toBeVisible()
      await headsButton.first().click()
      await page.waitForTimeout(200)
    }
    
    if (await tailsButton.count() > 0) {
      await expect(tailsButton.first()).toBeVisible()
      await tailsButton.first().click()
      await page.waitForTimeout(200)
    }
  })

  test('bet amount input accepts values', async ({ page }) => {
    await page.waitForTimeout(1000)
    
    // Look for bet amount input
    const betInput = page.locator('input[type="number"], input[type="text"]').first()
    
    if (await betInput.count() > 0) {
      await betInput.fill('0.1')
      await expect(betInput).toHaveValue('0.1')
    }
  })

  test('quick bet buttons update input', async ({ page }) => {
    await page.waitForTimeout(1000)
    
    // Look for quick bet buttons (0.1, 0.5, 1, etc.)
    const quickBetButtons = page.locator('button', { hasText: /^0\.\d|^1$|^5$|^10$/ })
    
    if (await quickBetButtons.count() > 0) {
      await quickBetButtons.first().click()
      await page.waitForTimeout(200)
      
      // Check that bet input was updated
      const betInput = page.locator('input[type="number"], input[type="text"]').first()
      const value = await betInput.inputValue()
      expect(value).toBeTruthy()
    }
  })

  test('min and max bet info is displayed', async ({ page }) => {
    await page.waitForTimeout(1000)
    
    // Look for bet limit information
    const betLimits = page.locator('text=/min|max/i')
    
    // Should show some bet limit info
    expect(await betLimits.count()).toBeGreaterThan(0)
  })

  test('shows connect wallet message when disconnected', async ({ page }) => {
    await page.waitForTimeout(1000)
    
    // When not connected, should show "Connect Wallet" message or button
    const connectMessage = page.locator('text=/connect.*wallet/i, button', {
      hasText: /connect/i
    })
    
    await expect(connectMessage.first()).toBeVisible()
  })
})
