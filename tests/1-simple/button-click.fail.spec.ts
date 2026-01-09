/**
 * DEMO 1: Simple - BAD PATTERNS (Likely to fail in CI)
 * 
 * FLAKES Categories: L (Latency) + A (Async)
 * 
 * ⚠️  WHY THESE PASS LOCALLY BUT FAIL IN CI:
 * 
 * Your local machine is FAST:
 *   - CPU: Likely 8+ cores, high clock speed
 *   - Memory: 16-32GB RAM
 *   - Network: Low latency to localhost
 *   - Browser: Warm cache, optimized rendering
 * 
 * CI runners are CONSTRAINED:
 *   - CPU: Shared, throttled, 2-4 cores typical
 *   - Memory: Limited, may swap
 *   - Network: Variable latency, cold starts
 *   - Browser: Fresh instance, no cache
 * 
 * 🔍 PROACTIVE IDENTIFICATION - Look for these RED FLAGS in code review:
 *   ❌ page.click() without preceding wait/expect
 *   ❌ expect() without await
 *   ❌ page.fill() / page.type() without await
 *   ❌ Assertions immediately after navigation
 *   ❌ No timeout configuration for slow operations
 * 
 * 💡 The goal is to CATCH these patterns BEFORE they hit CI!
 * 
 * @tags @fail @simple @latency @async
 */

import { test, expect } from '@playwright/test';
import * as os from 'os';

const BASE_URL = 'https://gauravkhurana.in/test-automation-play/';

// 🔍 Minimal logging - called once per suite
function logEnvironmentInfo() {
  console.log(`\n🖥️ ${process.platform} | CI: ${process.env.CI || 'local'} | Cores: ${os.cpus().length} | RAM: ${Math.round(os.freemem() / 1024 / 1024 / 1024)}GB free\n`);
}

test.describe('Simple Demo - Failing Tests @fail', () => {

  // Log environment once at start
  test.beforeAll(() => logEnvironmentInfo());

  test('should click button - timeout too short for CI', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // ❌ PROBLEM: 100ms timeout - works locally, fails in CI
    const basicTab = page.locator('button', { hasText: 'Basic' });
    await expect(basicTab).toBeVisible({ timeout: 100 });
    
    await basicTab.click();
    
    const enabledButton = page.getByRole('button', { name: 'Enabled Button' });
    await expect(enabledButton).toBeVisible({ timeout: 100 });
    await enabledButton.click();
  });

  test('should fill form - fixed sleep instead of proper wait', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('button:has-text("Basic")');
    
    await page.getByPlaceholder('Enter your first name').fill('Test');
    
    // ❌ PROBLEM: 10ms wait + 10ms assertion timeout
    await page.waitForTimeout(10);
    await expect(page.getByPlaceholder('Enter your first name')).toHaveValue('Test', { timeout: 10 });
  });

  test('should verify timing - performance assertion fails in CI', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto(BASE_URL);
    await page.click('button:has-text("Basic")');
    await page.getByPlaceholder('Enter your first name').fill('Performance Test');
    
    const elapsed = Date.now() - startTime;
    console.log(`⏱️ Elapsed: ${elapsed}ms (asserting < 800ms)`);
    
    // ❌ PROBLEM: CI takes 1500-4000ms, locally ~300-500ms
    expect(elapsed).toBeLessThan(800);
  });

  test('should select dropdown - network-sensitive assertion', async ({ page }) => {
    // ❌ PROBLEM: 3s page timeout + 50ms element timeouts
    await page.goto(BASE_URL, { timeout: 3000 });
    await page.click('button:has-text("Basic")');
    
    const dropdown = page.getByTestId('country-select');
    await expect(dropdown).toBeVisible({ timeout: 50 });
    await dropdown.click();
    await expect(page.getByRole('option', { name: 'Canada' })).toBeVisible({ timeout: 50 });
  });

  test('should interact with checkbox - test ends before assertion', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('button:has-text("Basic")');
    
    const checkbox = page.getByRole('checkbox').first();
    
    // ❌ PROBLEM: 30ms timeouts - not enough for CI
    await expect(checkbox).toBeVisible({ timeout: 30 });
    await checkbox.check();
    await expect(checkbox).toBeChecked({ timeout: 30 });
    await checkbox.uncheck();
    await expect(checkbox).not.toBeChecked({ timeout: 30 });
  });

});
