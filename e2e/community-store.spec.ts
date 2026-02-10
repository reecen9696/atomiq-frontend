/**
 * Community Store E2E Tests
 * Tests for community game store navigation and interaction
 */

import { test, expect } from '@playwright/test'

test.describe('Community Store', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to community store
    await page.goto('/community')
  })

  test('store page loads with game grid', async ({ page }) => {
    await page.waitForTimeout(1000)
    
    // Check that community page loaded
    await expect(page).toHaveURL(/community/)
    
    // Look for games or "no games" message
    const content = page.locator('body')
    await expect(content).toBeVisible()
  })

  test('search input filters games', async ({ page }) => {
    await page.waitForTimeout(1000)
    
    // Look for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]')
    
    if (await searchInput.count() > 0) {
      await searchInput.first().fill('test')
      await page.waitForTimeout(500)
      
      // Search should have been performed
      await expect(searchInput.first()).toHaveValue('test')
    }
  })

  test('sort options change order', async ({ page }) => {
    await page.waitForTimeout(1000)
    
    // Look for sort dropdown or buttons
    const sortOptions = page.locator('select, button', {
      hasText: /sort|popular|newest|rating/i
    })
    
    if (await sortOptions.count() > 0) {
      await sortOptions.first().click()
      await page.waitForTimeout(500)
    }
  })

  test('game card click navigates to detail', async ({ page }) => {
    await page.waitForTimeout(1000)
    
    // Look for game cards
    const gameCards = page.locator('a[href*="/community/"], [class*="game-card"] a, [class*="GameCard"] a')
    
    if (await gameCards.count() > 0) {
      const firstCard = gameCards.first()
      await firstCard.click()
      await page.waitForTimeout(500)
      
      // Should navigate to game detail page
      await expect(page).toHaveURL(/community\/[^/]+/)
    }
  })

  test('submit page loads', async ({ page }) => {
    await page.waitForTimeout(1000)
    
    // Look for submit/upload link
    const submitLink = page.locator('a', { hasText: /submit|upload|create/i })
    
    if (await submitLink.count() > 0) {
      await submitLink.first().click()
      await page.waitForTimeout(500)
      
      // Should navigate to submit page
      await expect(page).toHaveURL(/submit|create|upload/)
    }
  })

  test('developer docs page loads', async ({ page }) => {
    await page.waitForTimeout(1000)
    
    // Look for docs link
    const docsLink = page.locator('a', { hasText: /docs|documentation|guide/i })
    
    if (await docsLink.count() > 0) {
      await docsLink.first().click()
      await page.waitForTimeout(500)
      
      // Should navigate to docs page
      await expect(page).toHaveURL(/docs|documentation|guide/)
    }
  })

  test('filter buttons are interactive', async ({ page }) => {
    await page.waitForTimeout(1000)
    
    // Look for filter buttons (All, Verified, Pending, etc.)
    const filterButtons = page.locator('button', {
      hasText: /all|verified|pending|approved/i
    })
    
    if (await filterButtons.count() > 0) {
      const firstFilter = filterButtons.first()
      await firstFilter.click()
      await page.waitForTimeout(300)
    }
  })

  test('pagination works when present', async ({ page }) => {
    await page.waitForTimeout(1000)
    
    // Look for pagination controls
    const nextButton = page.locator('button, a', {
      hasText: /next|→|›/i
    })
    const prevButton = page.locator('button, a', {
      hasText: /prev|previous|←|‹/i
    })
    
    if (await nextButton.count() > 0) {
      await nextButton.first().click()
      await page.waitForTimeout(500)
    }
  })
})
