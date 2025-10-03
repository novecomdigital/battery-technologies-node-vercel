import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load and display the correct title', async ({ page }) => {
    await page.goto('/');

    // Check that the page loads successfully
    await expect(page).toHaveTitle(/node-vercel-template/);

    // Check that the main heading is visible
    await expect(
      page.getByRole('heading', { name: /Welcome to Next.js/ })
    ).toBeVisible();

    // Check that the hero section is present
    await expect(page.getByText('A modern, full-stack template')).toBeVisible();
  });

  test('should display all feature cards', async ({ page }) => {
    await page.goto('/');

    // Check that all three feature cards are visible using role selectors
    await expect(
      page.getByRole('heading', { name: 'TypeScript' })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Testing Ready' })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Modern UI' })
    ).toBeVisible();

    // Check that feature descriptions are present
    await expect(
      page.getByText('Strict TypeScript configuration')
    ).toBeVisible();
    await expect(page.getByText('Jest for unit tests')).toBeVisible();
    await expect(page.getByText('TailwindCSS for styling')).toBeVisible();
  });

  test('should have working CTA buttons', async ({ page }) => {
    await page.goto('/');

    // Check that CTA section is visible
    await expect(
      page.getByText('Ready to build something amazing?')
    ).toBeVisible();

    // Check that buttons are present and clickable
    await expect(
      page.getByRole('button', { name: 'Get Started' })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'View Documentation' })
    ).toBeVisible();

    // Test button interactions (they don't navigate anywhere yet, but should be clickable)
    await page.getByRole('button', { name: 'Get Started' }).click();
    await page.getByRole('button', { name: 'View Documentation' }).click();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Check that content is still visible on mobile
    await expect(
      page.getByRole('heading', { name: /Welcome to Next.js/ })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'TypeScript' })
    ).toBeVisible();
  });
});
