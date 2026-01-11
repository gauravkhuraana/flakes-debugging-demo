/**
 * DEMO 2: Medium - GOOD PATTERNS (Pass both locally AND in CI)
 * 
 * FLAKES Categories: E (Environment) + K (Konfiguration)
 * 
 * ✅ WHY THESE PASS EVERYWHERE:
 * 
 * These patterns work on Windows, macOS, Linux, and CI because:
 *   - Environment variables have fallback values
 *   - Timeouts are generous for slow CI VMs
 *   - No timing assertions - test behavior, not speed
 *   - Cross-platform env vars (or fallbacks)
 *   - Config-driven URLs, not hardcoded localhost
 * 
 * 💡 Compare with checkout-flow.fail.spec.ts to see the problems!
 * 
 * @tags @pass @medium @environment @config
 */

import { test, expect } from '@playwright/test';
import * as os from 'os';

// ✅ GOOD: Config-driven URL with fallback
const BASE_URL = process.env.BASE_URL || 'https://gauravkhurana.in/test-automation-play/';

// Minimal logging - once per suite
function logEnv() {
  console.log(`\n✅ ${process.platform} | CI: ${process.env.CI || 'local'} | user: ${os.userInfo().username}\n`);
}

test.describe('Environment & Config Demo - GOOD Patterns @pass', () => {

  test.beforeAll(() => logEnv());

  /**
   * ✅ GOOD PATTERN 1: Environment variable WITH fallback
   * 
   * Fix: Always provide a fallback value!
   * If MY_APP_URL not set, use the fallback URL
   */
  test('Test 1: Environment variable WITH fallback', async ({ page }) => {
    // ✅ GOOD: Fallback value ensures it always works
    const baseUrl = process.env.MY_APP_URL || 'https://gauravkhurana.in';
    
    console.log('✅ GOOD: Environment variable with fallback');
    console.log(`   Code: process.env.MY_APP_URL || 'https://gauravkhurana.in'`);
    console.log(`   MY_APP_URL = ${process.env.MY_APP_URL ?? 'not set'}`);
    console.log(`   baseUrl = ${baseUrl} (fallback used if not set)`);
    
    // Works everywhere - fallback ensures valid URL
    await page.goto(`${baseUrl}/test-automation-play/`);
    await expect(page.getByRole('tab', { name: 'Business' })).toBeVisible();
  });

  /**
   * ✅ GOOD PATTERN 2: Generous timeouts
   * 
   * Fix: Use 5000-10000ms timeouts to handle slow CI VMs
   * Playwright's default is 5000ms for a reason!
   */
  test('Test 2: Generous timeouts for CI', async ({ page }) => {
    await page.goto(BASE_URL);
    
    const businessTab = page.getByRole('tab', { name: 'Business' });
    
    // ✅ GOOD: 10000ms timeout works on both fast and slow machines
    console.log('✅ GOOD: Generous timeouts (10000ms)');
    console.log('   Works on fast local machine AND slow CI VM');
    
    await expect(businessTab).toBeVisible({ timeout: 10000 });
    await businessTab.click();
    
    await expect(page.getByTestId('login-username')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('login-username').fill('admin');
    await page.getByTestId('login-password').fill('password');
    await page.getByTestId('login-button').click();
    await expect(page.getByTestId('add-to-cart-1')).toBeVisible({ timeout: 10000 });
  });

  /**
   * ✅ GOOD PATTERN 3: Test behavior, not timing
   * 
   * Fix: Don't assert on how long something takes
   * Assert that it happened correctly!
   */
  test('Test 3: Assert behavior, not timing', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.getByRole('tab', { name: 'Business' }).click();
    
    const searchInput = page.getByRole('textbox', { name: /Search products/i });
    await expect(searchInput).toBeVisible();
    
    // ✅ GOOD: Just test the behavior, not the speed
    console.log('✅ GOOD: Test behavior, not timing');
    console.log('   Assert that search WORKS, not how FAST it works');
    
    await searchInput.fill('Playwright');
    
    // ✅ Assert the result is correct, with generous timeout
    await expect(page.getByRole('heading', { name: 'Playwright Course' })).toBeVisible({ timeout: 10000 });
    
    // ✅ Optionally LOG timing (don't ASSERT on it)
    // Useful for monitoring, but not for pass/fail
  });

  /**
   * ✅ GOOD PATTERN 4: Cross-platform alternatives
   * 
   * Fix: Use Node.js os module instead of Windows env vars
   * os.userInfo().username works on ALL platforms!
   */
  test('Test 4: Cross-platform env vars and APIs', async ({ page }) => {
    // ✅ GOOD: Use Node.js os module - works everywhere!
    const userName = os.userInfo().username;  // Cross-platform!
    const userEmail = process.env.TEST_EMAIL || 'test@example.com';  // Fallback!
    
    console.log('✅ GOOD: Cross-platform APIs');
    console.log(`   os.userInfo().username = ${userName}`);
    console.log(`   TEST_EMAIL || fallback = ${userEmail}`);
    console.log('   Works on Windows, macOS, Linux, and CI!');
    
    await page.goto(BASE_URL);
    await page.getByRole('tab', { name: 'Business' }).click();
    
    // These always work!
    expect(userName).toBeDefined();
    expect(userEmail).toBeDefined();
    
    await page.getByTestId('contact-name').fill(userName);
    await page.getByTestId('contact-email').fill(userEmail);
  });

  /**
   * ✅ GOOD PATTERN 5: Config-driven URL
   * 
   * Fix: Use baseURL from config or environment variable
   * Never hardcode localhost!
   */
  test('Test 5: Config-driven URL with fallback', async ({ page }) => {
    // ✅ GOOD: URL from config/env with fallback
    const url = process.env.BASE_URL || 'https://gauravkhurana.in/test-automation-play/';
    
    console.log('✅ GOOD: Config-driven URL');
    console.log(`   Code: process.env.BASE_URL || 'https://...'`);
    console.log(`   URL = ${url}`);
    console.log('   Works in dev (override BASE_URL) and CI (fallback)');
    
    await page.goto(url);
    await expect(page.getByRole('tab', { name: 'Business' })).toBeVisible();
  });

});

/**
 * ═══════════════════════════════════════════════════════════════
 * 🖥️ VIEWPORT TESTS - K (Konfiguration Drift) - FIXED
 * 
 * These tests demonstrate proper viewport handling
 * ═══════════════════════════════════════════════════════════════
 */
test.describe('Viewport Demo - GOOD Patterns @pass', () => {

  /**
   * ✅ GOOD PATTERN 6: Explicit viewport in test
   * 
   * Fix: Always set viewport explicitly - don't rely on defaults
   */
  test('Test 6: Explicit viewport - consistent behavior', async ({ page }) => {
    // ✅ GOOD: Set explicit viewport at start
    await page.setViewportSize({ width: 1280, height: 720 });
    
    const viewportSize = page.viewportSize();
    console.log('✅ GOOD: Explicit viewport set');
    console.log(`   Viewport: ${viewportSize?.width}x${viewportSize?.height}`);
    console.log('   Same viewport locally and in CI!');
    
    await page.goto(BASE_URL);
    await page.getByRole('tab', { name: 'Business' }).click();
    
    // Element visibility is now predictable
    const loginForm = page.getByTestId('login-username');
    
    // ✅ GOOD: Consistent viewport = consistent visibility
    await expect(loginForm).toBeVisible();
  });

  /**
   * ✅ GOOD PATTERN 7: Mobile viewport WITH mobile-specific selectors
   * 
   * Fix: When testing mobile, use mobile navigation patterns
   */
  test('Test 7: Mobile viewport with adapted selectors', async ({ page }) => {
    // ✅ GOOD: Mobile viewport with mobile-aware test
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    
    console.log('✅ GOOD: Mobile viewport (375x667) with mobile selectors');
    console.log('   Adapting test for mobile layout');
    
    await page.goto(BASE_URL);
    
    // ✅ GOOD: Check for mobile-specific elements OR adapt assertions
    const isMobile = (page.viewportSize()?.width ?? 0) < 768;
    console.log(`   Is mobile: ${isMobile}`);
    
    // ✅ GOOD: Tabs should still work on mobile
    await page.getByRole('tab', { name: 'Business' }).click();
    
    // ✅ GOOD: Assert on elements that exist in current viewport
    await expect(page.getByRole('tab', { name: 'Business' })).toBeVisible();
  });

  /**
   * ✅ GOOD PATTERN 8: Re-validate after viewport resize
   * 
   * Fix: After viewport change, re-check element visibility
   */
  test('Test 8: Viewport resize with re-validation', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(BASE_URL);
    await page.getByRole('tab', { name: 'Business' }).click();
    
    console.log('✅ GOOD: Resize viewport and adapt assertions');
    
    // Find element on desktop viewport
    const loginForm = page.getByTestId('login-username');
    await expect(loginForm).toBeVisible();
    console.log('   Login form visible at 1280px ✓');
    
    // ✅ GOOD: Resize AND adapt assertions
    await page.setViewportSize({ width: 375, height: 667 });
    console.log('   Resized to 375px (mobile)');
    
    // ✅ GOOD: Re-check visibility after resize
    // On this site, login form should still be visible on mobile
    await expect(loginForm).toBeVisible();
    console.log('   Login form still visible on mobile ✓');
  });

});

/**
 * ═══════════════════════════════════════════════════════════════
 * SUMMARY: How these are fixed
 * ═══════════════════════════════════════════════════════════════
 * 
 * Test 1: ✅ process.env.X || 'fallback' pattern
 * Test 2: ✅ Generous timeouts (10000ms) for slow CI
 * Test 3: ✅ Assert behavior, not timing
 * Test 4: ✅ os.userInfo().username (cross-platform)
 * Test 5: ✅ Config-driven URL with fallback
 * Test 6: ✅ Explicit viewport - don't rely on defaults
 * Test 7: ✅ Mobile viewport with mobile-aware selectors
 * Test 8: ✅ Re-validate after viewport resize
 * 
 * 📋 CODE REVIEW CHECKLIST:
 *   □ All env vars have fallbacks?
 *   □ Timeouts >= 5000ms for CI?
 *   □ No timing assertions?
 *   □ Using cross-platform APIs (os module)?
 *   □ No hardcoded localhost?
 *   □ Viewport explicitly set?
 *   □ Mobile/responsive tests adapted?
 * ═══════════════════════════════════════════════════════════════
 */
