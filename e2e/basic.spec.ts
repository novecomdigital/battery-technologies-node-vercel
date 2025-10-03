import { test, expect } from '@playwright/test'

test.describe('Basic Functionality', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/')
    
    // Check if the page loads without errors
    await expect(page).toHaveTitle(/Battery Technologies/)
  })

  test('health endpoint responds', async ({ page }) => {
    const response = await page.request.get('/api/health')
    expect(response.status()).toBe(200)
    
    const data = await response.json()
    expect(data).toHaveProperty('status', 'ok')
  })

  test('sign-in page loads', async ({ page }) => {
    await page.goto('/sign-in')
    
    // Should redirect to Clerk sign-in or show sign-in form
    await expect(page).toHaveURL(/sign-in/)
  })
})
