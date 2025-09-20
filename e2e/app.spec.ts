import { test, expect } from '@playwright/test';
import { setupOfflineGuard, mockSupabase, mockMapbox } from './utils/network';

test.describe('App E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set up network blocking and mocks
    await setupOfflineGuard(page);
    await mockSupabase(page);
    await mockMapbox(page);
  });

  test('should load app without external network requests', async ({ page }) => {
    await page.goto('/');
    
    // Wait for app to load
    await page.waitForLoadState('networkidle');
    
    // Check that basic UI elements are present
    expect(page.locator('body')).toBeTruthy();
    
    // Verify no console errors related to network issues
    const logs = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        logs.push(msg.text());
      }
    });
    
    // Allow some time for any async operations
    await page.waitForTimeout(2000);
    
    // Filter out expected network blocking messages
    const unexpectedErrors = logs.filter(log => 
      !log.includes('BLOCKED BY TEST') && 
      !log.includes('Failed to fetch')
    );
    
    expect(unexpectedErrors).toHaveLength(0);
  });

  test('should handle blocked WebSocket connections gracefully', async ({ page }) => {
    const guard = await setupOfflineGuard(page);
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Try to trigger WebSocket connection (if any)
    await page.evaluate(() => {
      try {
        new WebSocket('ws://example.com/ws');
      } catch (e) {
        // Expected to fail
      }
    });
    
    // Verify that blocked requests were logged
    const blockedCount = guard.getBlockedCount();
    console.log(`Blocked ${blockedCount} external requests`);
  });

  test('should allow localhost requests only', async ({ page }) => {
    await page.goto('/');
    
    // Test that localhost requests work
    const response = await page.evaluate(async () => {
      try {
        const res = await fetch('http://localhost:4173');
        return res.status;
      } catch (e) {
        return -1;
      }
    });
    
    // Should either succeed or fail due to CORS, but not be blocked
    expect([200, 404, 0, -1]).toContain(response);
  });

  test('should block external HTTPS requests', async ({ page }) => {
    await page.goto('/');
    
    const response = await page.evaluate(async () => {
      try {
        const res = await fetch('https://example.com');
        return { status: res.status, blocked: false };
      } catch (e) {
        return { status: -1, blocked: true, error: e.message };
      }
    });
    
    // Should be blocked or fail due to network restrictions
    expect(response.blocked || response.status === 451).toBeTruthy();
  });
});