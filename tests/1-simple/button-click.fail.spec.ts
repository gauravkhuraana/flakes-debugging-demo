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
    expect(elapsed).toBeLessThan(1000);
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

  // ═══════════════════════════════════════════════════════════════════════════
  // 🅰️ ASYNC + LATENCY DEMOS - "A" + "L" from FLAKES Combined
  // 
  // KEY INSIGHT: Missing await alone often doesn't cause failures because
  // Playwright's auto-retry (5s default) saves you. But combine missing await
  // with SHORT TIMEOUTS, and you get flaky tests!
  // ═══════════════════════════════════════════════════════════════════════════

  test('A1: missing await + short timeout - fill not complete in time', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('button:has-text("Basic")');
    
    const input = page.getByPlaceholder('Enter your first name');
    
    // ❌ PROBLEM: Missing await + short timeout = race condition exposed
    input.fill('Async Test');  // <-- NO AWAIT! Fill starts but doesn't wait
    
    // Short timeout doesn't give fill() time to complete in slow CI
    await expect(input).toHaveValue('Async Test', { timeout: 20 });  // Only 50ms!
  });

  test('A2: missing await + short timeout - click not complete in time', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // ❌ PROBLEM: Missing await + short timeout
    page.click('button:has-text("Basic")');  // <-- NO AWAIT!
    
    // Only 100ms to find element that appears after click completes
    const input = page.getByPlaceholder('Enter your first name');
    await expect(input).toBeVisible({ timeout: 100 });  // Not enough time in CI!
  });

  test('A3: missing await + immediate non-retrying check', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // ❌ PROBLEM: Missing await + isVisible() doesn't retry
    page.click('button:has-text("Basic")');  // <-- NO AWAIT!
    
    // isVisible() checks ONCE, RIGHT NOW - no retry!
    const input = page.getByPlaceholder('Enter your first name');
    const isVisible = await input.isVisible();  // Single check at ~5ms
    
    // Locally: click finished fast, isVisible = true
    // CI: click still running, isVisible = false
    expect(isVisible).toBe(true);
  });

  test('A4: multiple missing awaits + short timeout - chaos', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // ❌ PROBLEM: Chain of unawaited Promises + short timeout
    page.click('button:has-text("Basic")');                           // <-- NO AWAIT!
    page.getByPlaceholder('Enter your first name').fill('Race');      // <-- NO AWAIT!
    page.getByPlaceholder('Enter your last name').fill('Condition');  // <-- NO AWAIT!
    
    // All three actions start simultaneously, order is unpredictable
    // Short timeout exposes the race condition in CI
    await expect(page.getByPlaceholder('Enter your first name')).toHaveValue('Race', { timeout: 100 });
  });

  test('A5: missing await + value capture timing', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('button:has-text("Basic")');
    
    const input = page.getByPlaceholder('Enter your first name');
    //WebElement element = driver.findElement(By.name("Enter your first name"));  // 🔍 Searches NOW

    
    // ❌ PROBLEM: Capturing value while fill is still running
    input.fill('Promise Value');  // <-- NO AWAIT! Fill starts...
    
    // inputValue() gets current value RIGHT NOW
    const currentValue = await input.inputValue();  // Captured before fill completes!
    
    console.log(`Value captured: "${currentValue}"`);  // Empty or partial in CI!
    
    // This fails because we captured the value too early
    expect(currentValue).toBe('Promise Value');
  });

  test('A6: timing visualization - see the race condition', async ({ page }) => {
    await page.goto(BASE_URL);
    
    const start = Date.now();
    
    // ❌ PROBLEM: Missing await exposes timing dependency
    page.click('button:has-text("Basic")');  // <-- NO AWAIT!
    
    // Check immediately - isVisible() doesn't retry!
    const input = page.getByPlaceholder('Enter your first name');
    const isVisible = await input.isVisible();
    
    const elapsed = Date.now() - start;
    console.log(`⏱️ Checked after ${elapsed}ms: visible=${isVisible}`);
    // Locally:  "Checked after 5ms: visible=true"  (fast machine)
    // CI:       "Checked after 5ms: visible=false" (slow runner)
    
    expect(isVisible).toBe(true);
  });

});
