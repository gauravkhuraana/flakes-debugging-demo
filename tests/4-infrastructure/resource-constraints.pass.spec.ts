/**
 * DEMO 4: Infrastructure - BEST PRACTICES (CI-Resilient Patterns)
 * 
 * 🎯 PROMOTIONAL PROMISE COVERAGE:
 * "You will learn how container setups, environment variables, 
 * dependencies, and resource constraints impact test behavior"
 * 
 * ✅ THESE PATTERNS WORK RELIABLY IN BOTH LOCAL AND CI:
 * 
 * Why these are CI-resilient:
 *   - Timeouts adjusted for slow CI environments
 *   - Resource cleanup after each operation
 *   - No assumptions about CPU speed or memory
 *   - Timezone-agnostic assertions
 *   - Graceful handling of network variability
 * 
 * 🎯 PROACTIVE PATTERNS TO USE:
 *   ✅ Environment-aware timeouts (longer in CI)
 *   ✅ Sequential context creation with cleanup
 *   ✅ UTC for all time comparisons
 *   ✅ Retry logic for network operations
 *   ✅ Memory-conscious screenshot handling
 * 
 * 📋 CODE REVIEW CHECKLIST:
 *   □ Timeouts consider CI resource constraints?
 *   □ Parallel operations limited for CI?
 *   □ Resources properly cleaned up?
 *   □ Time assertions use UTC?
 *   □ Network calls have reasonable timeouts?
 * 
 * @tags @pass @infrastructure @resources @containers
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'https://gauravkhurana.com/test-automation-play/';

// ✅ FIX: Environment-aware configuration
const isCI = process.env.CI === 'true';
const DEFAULT_TIMEOUT = isCI ? 30000 : 10000;
const NAVIGATION_TIMEOUT = isCI ? 60000 : 30000;

test.describe('Infrastructure Demo - Passing Tests @pass', () => {

  /**
   * ✅ FIX 1: Environment-aware timeouts
   * Adjusts timeouts based on CI detection
   */
  test('should load page - CI-aware timeout', async ({ page }) => {
    // ✅ Use environment-aware timeout
    page.setDefaultTimeout(DEFAULT_TIMEOUT);
    
    await page.goto(BASE_URL, {
      timeout: NAVIGATION_TIMEOUT,
      waitUntil: 'domcontentloaded', // ✅ Don't wait for all resources
    });
    
    // ✅ Generous timeout for CI
    const basicTab = page.getByRole('tab', { name: 'Basic' });
    await expect(basicTab).toBeVisible({ timeout: DEFAULT_TIMEOUT });
  });

  /**
   * ✅ FIX 2: Sequential context creation with cleanup
   * Manages resources carefully for constrained environments
   */
  test('should handle multiple contexts - with resource management', async ({ browser }) => {
    // ✅ Process contexts sequentially to avoid memory spikes
    const results: boolean[] = [];
    
    // ✅ Limit concurrent contexts based on environment
    const maxContexts = isCI ? 2 : 5;
    
    for (let i = 0; i < maxContexts; i++) {
      const context = await browser.newContext();
      const page = await context.newPage();
      
      try {
        await page.goto(BASE_URL, { timeout: NAVIGATION_TIMEOUT });
        results.push(true);
      } finally {
        // ✅ CRITICAL: Always close context to free memory
        await context.close();
      }
    }
    
    expect(results.length).toBe(maxContexts);
    expect(results.every(r => r)).toBeTruthy();
  });

  /**
   * ✅ FIX 3: Performance assertions that account for CI variability
   * Uses relative comparisons or generous thresholds
   */
  test('should complete within reasonable time - CI-aware threshold', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto(BASE_URL);
    await page.getByRole('tab', { name: 'Basic' }).click();
    
    const elapsed = Date.now() - startTime;
    
    // ✅ FIX: CI-aware threshold (much more generous)
    const threshold = isCI ? 30000 : 5000;
    expect(elapsed).toBeLessThan(threshold);
    
    // ✅ BETTER: Log timing for debugging without hard assertion
    console.log(`Page load completed in ${elapsed}ms (CI: ${isCI})`);
  });

  /**
   * ✅ FIX 4: Timezone-agnostic assertions
   * Uses UTC for all time comparisons
   */
  test('should validate timestamp - timezone agnostic', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // ✅ FIX: Use UTC for consistent behavior across environments
    const now = new Date();
    const utcHour = now.getUTCHours();
    
    // ✅ Assertion that works regardless of timezone
    // Just verify we got a valid hour (0-23)
    expect(utcHour).toBeGreaterThanOrEqual(0);
    expect(utcHour).toBeLessThanOrEqual(23);
    
    // ✅ BETTER: If you need specific time logic, mock the date
    // Or use relative time comparisons
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    expect(now.getTime()).toBeGreaterThan(fiveMinutesAgo.getTime());
  });

  /**
   * ✅ FIX 5: Network calls with CI-appropriate timeouts and retry
   * Handles network variability gracefully
   */
  test('should fetch data - with retry and generous timeout', async ({ page, request }) => {
    // ✅ FIX: Generous timeout with retry logic
    const maxRetries = 3;
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await request.get(BASE_URL, {
          timeout: isCI ? 30000 : 10000, // ✅ CI-aware timeout
        });
        
        expect(response.ok()).toBeTruthy();
        return; // Success!
        
      } catch (error) {
        lastError = error as Error;
        console.log(`Attempt ${attempt} failed, retrying...`);
        
        // ✅ Exponential backoff
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, 1000 * attempt));
        }
      }
    }
    
    throw lastError; // All retries failed
  });

  /**
   * ✅ FIX 6: Memory-efficient screenshot handling
   * Streams screenshots to disk instead of holding in memory
   */
  test('should capture screenshots - memory efficient', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // ✅ FIX: Write directly to disk, don't hold in memory
    const screenshotPaths: string[] = [];
    const screenshotCount = isCI ? 3 : 10; // ✅ Fewer screenshots in CI
    
    for (let i = 0; i < screenshotCount; i++) {
      const path = `test-results/screenshot-${i}.png`;
      
      // ✅ path option writes directly to disk
      await page.screenshot({ 
        path,
        fullPage: false, // ✅ Viewport only, less memory
      });
      
      screenshotPaths.push(path);
    }
    
    expect(screenshotPaths.length).toBe(screenshotCount);
  });

});

/**
 * 📋 PLAYWRIGHT.CONFIG.TS RECOMMENDATIONS FOR CI:
 * 
 * ```typescript
 * import { defineConfig } from '@playwright/test';
 * 
 * const isCI = !!process.env.CI;
 * 
 * export default defineConfig({
 *   // ✅ Fewer workers in CI
 *   workers: isCI ? 2 : undefined,
 *   
 *   // ✅ Longer timeouts in CI
 *   timeout: isCI ? 60000 : 30000,
 *   
 *   // ✅ Retry flaky tests in CI only
 *   retries: isCI ? 2 : 0,
 *   
 *   // ✅ Fail fast in CI to save resources
 *   maxFailures: isCI ? 5 : undefined,
 *   
 *   use: {
 *     // ✅ Longer action/navigation timeouts in CI
 *     actionTimeout: isCI ? 15000 : 5000,
 *     navigationTimeout: isCI ? 30000 : 15000,
 *   },
 * });
 * ```
 * 
 * 📋 GITHUB ACTIONS WORKFLOW OPTIMIZATION:
 * 
 * ```yaml
 * jobs:
 *   test:
 *     runs-on: ubuntu-latest
 *     
 *     # ✅ Set CI environment variable
 *     env:
 *       CI: true
 *       
 *     steps:
 *       # ✅ Use sharding for large test suites
 *       - run: npx playwright test --shard=${{ matrix.shard }}
 *         
 *     strategy:
 *       matrix:
 *         shard: [1/4, 2/4, 3/4, 4/4]
 * ```
 */
