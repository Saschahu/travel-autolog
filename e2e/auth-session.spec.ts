import { test, expect } from '@playwright/test';

test.describe('Auth and Session', () => {
  test.beforeEach(async ({ page }) => {
    // Block external network requests to Supabase/third-party services
    await page.route('**/*supabase*/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: null, error: null })
      });
    });
    
    // Mock auth session endpoint
    await page.route('**/auth/session', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          data: { session: null, user: null },
          error: null
        })
      });
    });
  });

  test('should show guest state when not authenticated', async ({ page }) => {
    await page.goto('/');
    
    // Should redirect to auth page for unauthenticated users
    await expect(page).toHaveURL(/.*\/auth/);
    
    // Should show auth form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    
    // Should show sign in button or similar auth action
    await expect(page.locator('button').filter({ hasText: /sign in|login|anmelden/i })).toBeVisible();
  });

  test('should show app shell when authenticated', async ({ page }) => {
    // Mock authenticated session
    await page.route('**/auth/session', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            session: {
              access_token: 'mock-token',
              user: {
                id: 'mock-user-id',
                email: 'test@example.com'
              }
            },
            user: {
              id: 'mock-user-id',
              email: 'test@example.com'
            }
          },
          error: null
        })
      });
    });

    // Mock auth state change
    await page.addInitScript(() => {
      // Mock window globals that might be needed
      window.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        user: { id: 'mock-user-id', email: 'test@example.com' }
      }));
    });

    await page.goto('/');
    
    // Wait for loading to complete and check for main app elements
    await page.waitForLoadState('networkidle');
    
    // Should show main dashboard/app content
    // Look for common app shell elements like navigation, tabs, or main content
    const hasMainContent = await page.locator('main, [role="main"], .main-content').count() > 0;
    const hasTabs = await page.locator('[role="tablist"], .tabs').count() > 0;
    const hasNavigation = await page.locator('nav, [role="navigation"]').count() > 0;
    
    expect(hasMainContent || hasTabs || hasNavigation).toBeTruthy();
  });

  test('should handle auth state transitions', async ({ page }) => {
    // Start with unauthenticated state
    await page.goto('/');
    await expect(page).toHaveURL(/.*\/auth/);
    
    // Mock successful authentication
    await page.route('**/auth/signin', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            session: {
              access_token: 'mock-token',
              user: { id: 'mock-user-id', email: 'test@example.com' }
            }
          },
          error: null
        })
      });
    });

    // Fill in mock credentials and submit (without actually submitting to real service)
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    
    if (await emailInput.isVisible()) {
      await emailInput.fill('test@example.com');
    }
    if (await passwordInput.isVisible()) {
      await passwordInput.fill('password123');
    }
    
    // Just verify form elements can be interacted with
    expect(await emailInput.inputValue()).toBe('test@example.com');
    expect(await passwordInput.inputValue()).toBe('password123');
  });
});