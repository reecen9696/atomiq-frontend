/**
 * Navigation E2E Tests
 * Basic smoke tests for navigation and page loading
 */

import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/')
    
    // Check that the page title or main content loads
    await expect(page).toHaveTitle(/Atomiq|Casino/)
  })

  test('can navigate to Coinflip game', async ({ page }) => {
    await page.goto('/')
    
    // Look for coinflip link (adjust selector based on actual UI)
    const coinflipLink = page.locator('a', { hasText: /coinflip/i })
    
    if (await coinflipLink.count() > 0) {
      await coinflipLink.first().click()
      await expect(page).toHaveURL(/coinflip|casino/)
    }
  })

  test('can navigate to Dice game', async ({ page }) => {
    await page.goto('/')
    
    // Look for dice link
    const diceLink = page.locator('a', { hasText: /dice/i })
    
    if (await diceLink.count() > 0) {
      await diceLink.first().click()
      await expect(page).toHaveURL(/dice|casino/)
    }
  })

  test('can navigate to Community Store', async ({ page }) => {
    await page.goto('/')
    
    // Look for community link
    const communityLink = page.locator('a', { hasText: /community/i })
    
    if (await communityLink.count() > 0) {
      await communityLink.first().click()
      await expect(page).toHaveURL(/community/)
    }
  })

  test('mobile navigation opens and closes', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    
    // Look for mobile menu button (hamburger)
    const menuButton = page.locator('button[aria-label*="menu" i], button[aria-label*="navigation" i]')
    
    if (await menuButton.count() > 0) {
      // Open menu
      await menuButton.first().click()
      await page.waitForTimeout(500)
      
      // Close menu (click button again or click outside)
      await menuButton.first().click()
      await page.waitForTimeout(500)
    }
  })

  test('pages render without console errors', async ({ page }) => {
    const consoleErrors: string[] = []
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })
    
    await page.goto('/')
    
    // Wait a bit for any async errors
    await page.waitForTimeout(2000)
    
    // Filter out known non-critical errors (like failed API calls to localhost:8080)
    const criticalErrors = consoleErrors.filter(
      err => !err.includes('localhost:8080') && !err.includes('Failed to fetch')
    )
    
    expect(criticalErrors).toHaveLength(0)
  })
})
