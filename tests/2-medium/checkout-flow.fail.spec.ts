/**
 * DEMO 2: Medium - BAD PATTERNS (Pass locally, Fail in CI)
 * 
 * FLAKES Categories: E (Environment) + K (Konfiguration)
 * 
 * ⚠️  WHY THESE PASS LOCALLY (Windows) BUT FAIL IN CI (Linux):
 * 
 * Your local Windows environment has:
 *   - USERPROFILE and USERNAME env vars set
 *   - Fast machine with quick response times
 *   - Dev server may be running on localhost
 * 
 * CI environment (Linux) is DIFFERENT:
 *   - No Windows-specific env vars
 *   - Slower VM with shared resources
 *   - No localhost server running
 * 
 * 💡 Compare with checkout-flow.pass.spec.ts to see the FIXES!
 * 
 * @tags @fail @medium @environment @config
 */

import { test, expect } from '@playwright/test';
import * as os from 'os';

const BASE_URL = 'https://gauravkhurana.in/test-automation-play/';

// Print environment info once
let envPrinted = false;

test.describe('Environment & Config Demo - BAD Patterns @fail', () => {

  test.beforeAll(() => {
    if (envPrinted) return;
    envPrinted = true;
    
    console.log('\n' + '═'.repeat(60));
    console.log('❌ ENVIRONMENT INFO - BAD PATTERNS');
    console.log('═'.repeat(60));
    console.log(`💻 Platform:     ${process.platform}`);
    console.log(`🔢 CPU Cores:    ${os.cpus().length}`);
    console.log(`🧠 Free RAM:     ${(os.freemem() / (1024 ** 3)).toFixed(2)} GB`);
    console.log(`👤 USERNAME:     ${process.env.USERNAME ?? 'NOT SET (Linux!)'}`);
    console.log(`🏠 USERPROFILE:  ${process.env.USERPROFILE ?? 'NOT SET (Linux!)'}`);
    console.log(`🔧 CI:           ${process.env.CI || 'false'}`);
    console.log('═'.repeat(60) + '\n');
  });

  /**
   * ❌ BAD PATTERN 1: Windows-specific environment variable
   * 
   * Problem: USERPROFILE exists on Windows but NOT on Linux CI
   * Local:   USERPROFILE = "C:\Users\gakhuran" → truthy → works!
   * CI:      USERPROFILE = undefined → falsy → FAILS!
   */
  test('Test 1: Environment variable without fallback', async ({ page }) => {
    // ❌ BAD: Relying on Windows-specific env var
    const baseUrl = (process.env.MY_APP_URL || process.env.USERPROFILE) 
                      ? 'https://gauravkhurana.in' 
                      : undefined;
    
    console.log('❌ BAD: Relying on Windows-specific env var');
    console.log(`   USERPROFILE = ${process.env.USERPROFILE ?? 'undefined'}`);
    console.log(`   baseUrl = ${baseUrl ?? 'undefined'}`);
    
    // Fails in CI: baseUrl is undefined, goto fails!
    await page.goto(`${baseUrl}/test-automation-play/`);
    await expect(page.getByRole('tab', { name: 'Business' })).toBeVisible();
  });

  /**
   * ❌ BAD PATTERN 2: Short timeouts
   * 
   * Problem: 500ms timeout works on fast local machine, fails on slow CI VM
   * Local:   8+ cores, 16GB RAM, fast SSD → elements load in ~100-300ms
   * CI:      2 cores, 7GB RAM, shared resources → may take 500-1500ms
   */
  test('Test 2: Short timeouts fail in slow CI', async ({ page }) => {
    await page.goto(BASE_URL);
    
    const businessTab = page.getByRole('tab', { name: 'Business' });
    
    // ❌ BAD: 500ms timeout - too aggressive for CI
    console.log('❌ BAD: 500ms timeouts');
    console.log('   Local: Elements load in ~100-300ms ✅');
    console.log('   CI:    May take 500-1500ms ❌');
    
    await expect(businessTab).toBeVisible({ timeout: 500 });
    await businessTab.click({ timeout: 500 });
    
    await expect(page.getByTestId('login-username')).toBeVisible({ timeout: 500 });
    await page.getByTestId('login-username').fill('admin', { timeout: 500 });
    await page.getByTestId('login-password').fill('password', { timeout: 500 });
    await page.getByTestId('login-button').click({ timeout: 500 });
    await expect(page.getByTestId('add-to-cart-1')).toBeVisible({ timeout: 500 });
  });

  /**
   * ❌ BAD PATTERN 3: Timing-based assertions
   * 
   * Problem: Search takes ~200ms locally but ~800ms in CI
   * Never assert on timing - it varies by environment!
   */
  test('Test 3: Timing assertion fails in CI', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.getByRole('tab', { name: 'Business' }).click();
    
    const searchInput = page.getByRole('textbox', { name: /Search products/i });
    await expect(searchInput).toBeVisible();
    
    // ❌ BAD: Measuring and asserting on timing
    const startTime = Date.now();
    await searchInput.fill('Playwright');
    await expect(page.getByRole('heading', { name: 'Playwright Course' })).toBeVisible();
    const duration = Date.now() - startTime;
    
    console.log('❌ BAD: Timing assertion');
    console.log(`   Duration: ${duration}ms (threshold: 500ms)`);
    console.log('   Local: ~100-300ms ✅');
    console.log('   CI:    ~500-1500ms ❌');
    
    // This passes locally but fails in CI!
    expect(duration).toBeLessThan(500);
  });

  /**
   * ❌ BAD PATTERN 4: Windows-only USERNAME env var
   * 
   * Problem: USERNAME is a Windows env var, doesn't exist on Linux
   * Use cross-platform alternatives instead!
   */
  test('Test 4: Windows-only env vars', async ({ page }) => {
    // ❌ BAD: These only exist on Windows!
    const userName = process.env.USERNAME;      // Windows only
    const userEmail = process.env.USERPROFILE   // Windows only
                        ? 'test@example.com' 
                        : undefined;
    
    console.log('❌ BAD: Windows-only env vars');
    console.log(`   USERNAME = ${userName ?? 'NOT SET'}`);
    console.log(`   USERPROFILE = ${process.env.USERPROFILE ?? 'NOT SET'}`);
    
    await page.goto(BASE_URL);
    await page.getByRole('tab', { name: 'Business' }).click();
    
    // Fails in CI - these env vars don't exist on Linux!
    expect(userName).toBeDefined();
    expect(userEmail).toBeDefined();
    
    await page.getByTestId('contact-name').fill(userName!);
    await page.getByTestId('contact-email').fill(userEmail!);
  });

  /**
   * ❌ BAD PATTERN 5: Hardcoded localhost
   * 
   * Problem: Assumes dev server is running locally
   * CI doesn't have your local dev server!
   */
  test('Test 5: Hardcoded localhost fails in CI', async ({ page }) => {
    console.log('❌ BAD: Hardcoded localhost:3000');
    console.log('   Assumes dev server is running locally');
    console.log('   CI has no local server!');
    
    // ❌ BAD: Hardcoded localhost - no server in CI
    await page.goto('http://localhost:3000/', { timeout: 5000 });
    await expect(page.getByRole('tab', { name: 'Business' })).toBeVisible();
  });

});

/**
 * ═══════════════════════════════════════════════════════════════
 * 🖥️ VIEWPORT TESTS - K (Konfiguration Drift)
 * 
 * These tests demonstrate viewport-related flakiness
 * ═══════════════════════════════════════════════════════════════
 */
test.describe('Viewport Demo - BAD Patterns @fail', () => {

  /**
   * ❌ BAD PATTERN 6: No viewport set - relies on default
   * 
   * Problem: CI may use different default viewport than local
   * Local:   Your browser window size (e.g., 1920x1080)
   * CI:      Headless default (often 800x600 or 1280x720)
   * 
   * Elements may be hidden/visible depending on viewport!
   */
  test('Test 6: No viewport - element visibility varies', async ({ page }) => {
    // ❌ BAD: No viewport set - using whatever default
    const viewportSize = page.viewportSize();
    console.log('❌ BAD: No explicit viewport set');
    console.log(`   Current viewport: ${viewportSize?.width}x${viewportSize?.height}`);
    console.log('   Local might be 1920x1080, CI might be 800x600');
    console.log('   Responsive elements behave differently!');
    
    await page.goto(BASE_URL);
    await page.getByRole('tab', { name: 'Business' }).click();
    
    // This element might be in a hamburger menu on narrow viewports
    // or visible on wide viewports - unpredictable!
    const dashboardLink = page.getByRole('link', { name: 'Dashboard' });
    
    // ❌ BAD: No viewport control - may pass or fail based on default
    await expect(dashboardLink).toBeVisible({ timeout: 2000 });
  });

  /**
   * ❌ BAD PATTERN 7: Mobile viewport without adapting selectors
   * 
   * Problem: Test written for desktop, but viewport is mobile
   * Desktop elements hidden, mobile menu not handled
   */
  test('Test 7: Wrong viewport for test assumptions', async ({ page }) => {
    // ❌ BAD: Set mobile viewport but use desktop selectors
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    
    console.log('❌ BAD: Mobile viewport (375x667) with desktop selectors');
    console.log('   Desktop navigation hidden on mobile');
    console.log('   Need to click hamburger menu first!');
    
    await page.goto(BASE_URL);
    await page.getByRole('tab', { name: 'Business' }).click();
    
    // ❌ BAD: Desktop checkout button - hidden on mobile!
    const checkoutBtn = page.getByRole('button', { name: 'Checkout' });
    await expect(checkoutBtn).toBeVisible({ timeout: 2000 });
  });

  /**
   * ❌ BAD PATTERN 8: Viewport changes mid-test without re-checking
   * 
   * Problem: Elements found before resize may not be visible after
   */
  test('Test 8: Viewport resize without re-validation', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(BASE_URL);
    await page.getByRole('tab', { name: 'Business' }).click();
    
    // Find element on desktop viewport
    const sidebar = page.getByTestId('sidebar-nav');
    console.log('❌ BAD: Finding element, then resizing viewport');
    
    // ❌ BAD: Resize to mobile AFTER finding element
    await page.setViewportSize({ width: 375, height: 667 });
    
    console.log('   Sidebar was visible at 1280px, now hidden at 375px');
    
    // ❌ BAD: Sidebar hidden on mobile - this fails!
    await expect(sidebar).toBeVisible({ timeout: 2000 });
  });

});

/**
 * ═══════════════════════════════════════════════════════════════
 * SUMMARY: Why these fail in CI
 * ═══════════════════════════════════════════════════════════════
 * 
 * Test 1: USERPROFILE doesn't exist on Linux
 * Test 2: 500ms timeout too short for slow CI VMs
 * Test 3: Timing varies - never assert on duration
 * Test 4: USERNAME/USERPROFILE are Windows-only
 * Test 5: No localhost server running in CI
 * Test 6: No viewport set - CI uses different default
 * Test 7: Mobile viewport but desktop selectors
 * Test 8: Viewport resize breaks element visibility
 * 
 * ➡️ See checkout-flow.pass.spec.ts for the FIXED versions!
 * ═══════════════════════════════════════════════════════════════
 */
