/**
 * DEMO 3: Complex - GOOD PATTERNS (Pass both locally AND in CI)
 * 
 * FLAKES Categories: S (State/Shared) + A (Async) + K (Konfiguration)
 * 
 * ✅ WHY THESE PASS EVERYWHERE:
 * 
 * These patterns work on any machine because:
 *   - Always await async operations
 *   - Generous timeouts for slow CI
 *   - Isolated state per test (no shared mutable data)
 *   - No test order dependencies
 *   - Unique files per test (no write conflicts)
 *   - No timing assertions (test behavior, not speed)
 * 
 * 💡 Compare with parallel-state.fail.spec.ts to see the problems!
 * 
 * @tags @pass @complex @state @parallel
 */

import { test, expect } from '@playwright/test';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'https://gauravkhurana.in/test-automation-play/';

// Print environment info once
let envPrinted = false;

test.describe('Parallel & State Demo - GOOD Patterns @pass', () => {

  test.beforeAll(() => {
    if (envPrinted) return;
    envPrinted = true;
    
    console.log('\n' + '═'.repeat(60));
    console.log('✅ ENVIRONMENT INFO - GOOD PATTERNS');
    console.log('═'.repeat(60));
    console.log(`💻 Platform:     ${process.platform}`);
    console.log(`🔢 CPU Cores:    ${os.cpus().length}`);
    console.log(`🧠 Free RAM:     ${(os.freemem() / (1024 ** 3)).toFixed(2)} GB`);
    console.log(`🔧 CI:           ${process.env.CI || 'false'}`);
    console.log('═'.repeat(60) + '\n');
  });

  /**
   * ✅ GOOD PATTERN 1: Always await async operations
   * 
   * Fix: Every Playwright action is async - always await!
   */
  test('Test 1: Proper await prevents race conditions', async ({ page }) => {
    await page.goto(BASE_URL);
    
    const businessTab = page.getByRole('tab', { name: 'Business' });
    await expect(businessTab).toBeVisible();
    await businessTab.click();
    
    const input = page.getByTestId('login-username');
    await expect(input).toBeVisible();
    
    console.log('✅ GOOD: Always await async operations');
    console.log('   await input.fill() - waits for completion');
    console.log('   await expect() - waits for condition');
    
    // ✅ GOOD: Proper await ensures fill completes
    await input.fill('testuser');
    
    // ✅ GOOD: Await on assertion waits for value
    await expect(input).toHaveValue('testuser');
  });

  /**
   * ✅ GOOD PATTERN 2: Generous timeout for CI network
   * 
   * Fix: Use timeouts that work on slow CI (10-30 seconds)
   */
  test('Test 2: Generous timeout for slow CI', async ({ page }) => {
    console.log('✅ GOOD: Generous timeouts (30s page, 10s element)');
    console.log('   Works on fast local AND slow CI');
    
    // ✅ GOOD: 30 second timeout handles slow CI network
    await page.goto(BASE_URL, { timeout: 30000 });
    
    const tab = page.getByRole('tab', { name: 'Business' });
    // ✅ GOOD: 10 second timeout for element visibility
    await expect(tab).toBeVisible({ timeout: 10000 });
  });

  /**
   * ✅ GOOD PATTERN 3: Isolated state per test
   * 
   * Fix: Each test creates its own state - no sharing!
   */
  test('Test 3: Isolated state - own counter', async ({ page }) => {
    // ✅ GOOD: Local variable, not shared
    let localCounter = 0;
    localCounter++;
    
    console.log('✅ GOOD: Isolated state per test');
    console.log(`   localCounter = ${localCounter} (local to this test)`);
    console.log('   Each test has its own counter');
    
    await page.goto(BASE_URL);
    
    // ✅ GOOD: Always 1, regardless of other tests
    expect(localCounter).toBe(1);
  });

  test('Test 3a: Isolated state - independent counter', async ({ page }) => {
    // ✅ GOOD: Its own local counter
    let localCounter = 0;
    localCounter++;
    
    console.log('✅ GOOD: Independent of other tests');
    console.log(`   localCounter = ${localCounter}`);
    console.log('   Works regardless of test order');
    
    await page.goto(BASE_URL);
    
    // ✅ GOOD: Always 1, no matter what other tests do
    expect(localCounter).toBe(1);
  });

  /**
   * ✅ GOOD PATTERN 4: Test behavior, not timing
   * 
   * Fix: Assert that something happened correctly, not how fast
   */
  test('Test 4: Assert behavior, not timing', async ({ page }) => {
    await page.goto(BASE_URL);
    
    await page.getByRole('tab', { name: 'Business' }).click();
    const username = page.getByTestId('login-username');
    
    console.log('✅ GOOD: Assert behavior, not timing');
    console.log('   Test WHAT happened, not HOW FAST');
    console.log('   Works on fast and slow machines');
    
    // ✅ GOOD: Assert visibility with generous timeout
    await expect(username).toBeVisible({ timeout: 10000 });
    
    // ✅ GOOD: Assert that interaction works
    await username.fill('admin');
    await expect(username).toHaveValue('admin');
  });

  /**
   * ✅ GOOD PATTERN 5: Unique file per test
   * 
   * Fix: Use unique filename with timestamp/random to avoid conflicts
   */
  test('Test 5: Unique file prevents write conflict', async ({ page }, testInfo) => {
    // ✅ GOOD: Unique file name using testInfo
    const uniqueFilePath = testInfo.outputPath('test-data.json');
    
    console.log('✅ GOOD: Unique file per test');
    console.log(`   File: ${uniqueFilePath}`);
    console.log('   testInfo.outputPath() creates unique path per test');
    
    // ✅ GOOD: Each test has its own file, no conflicts
    const testData = { testId: 'test5', timestamp: Date.now() };
    fs.writeFileSync(uniqueFilePath, JSON.stringify(testData));
    
    await page.goto(BASE_URL);
    
    // ✅ GOOD: Reading our own unique file
    const readData = JSON.parse(fs.readFileSync(uniqueFilePath, 'utf-8'));
    expect(readData.testId).toBe('test5');
  });

  test('Test 5a: Unique file - no conflict with Test 5', async ({ page }, testInfo) => {
    // ✅ GOOD: Different unique file for this test
    const uniqueFilePath = testInfo.outputPath('test-data.json');
    
    console.log('✅ GOOD: Each test has its own unique file');
    console.log(`   File: ${uniqueFilePath}`);
    
    const testData = { testId: 'test5a', timestamp: Date.now() };
    fs.writeFileSync(uniqueFilePath, JSON.stringify(testData));
    
    await page.goto(BASE_URL);
    
    // ✅ GOOD: Our own file, not affected by Test 5
    const readData = JSON.parse(fs.readFileSync(uniqueFilePath, 'utf-8'));
    expect(readData.testId).toBe('test5a');
  });

  /**
   * ✅ GOOD PATTERN 6: No test order dependency
   * 
   * Fix: Each test sets up its own data in beforeEach or within test
   */
  test('Test 6: Self-contained test with own setup', async ({ page }) => {
    // ✅ GOOD: Test sets up its own data
    const localTestData = ['setup-data'];
    
    console.log('✅ GOOD: Self-contained test');
    console.log(`   localTestData: [${localTestData.join(', ')}]`);
    console.log('   Each test creates its own data');
    
    await page.goto(BASE_URL);
    
    // ✅ GOOD: Always passes - data is local
    expect(localTestData).toContain('setup-data');
  });

  test('Test 6a: Also self-contained, no dependency', async ({ page }) => {
    // ✅ GOOD: Own setup, no dependency on Test 6
    const localTestData = ['other-data'];
    
    console.log('✅ GOOD: Independent of other tests');
    console.log(`   localTestData: [${localTestData.join(', ')}]`);
    console.log('   Works in any order');
    
    await page.goto(BASE_URL);
    
    // ✅ GOOD: Always passes
    expect(localTestData).toContain('other-data');
  });

});

/**
 * ═══════════════════════════════════════════════════════════════
 * SUMMARY: How these are fixed
 * ═══════════════════════════════════════════════════════════════
 * 
 * Test 1: ✅ Always await async operations
 * Test 2: ✅ Generous timeouts (30s page, 10s element)
 * Test 3/3a: ✅ Isolated state per test (local variables)
 * Test 4: ✅ Assert behavior, not timing
 * Test 5/5a: ✅ Unique file per test (testInfo.outputPath)
 * Test 6/6a: ✅ Self-contained tests with own setup
 * 
 * 📋 CODE REVIEW CHECKLIST:
 *   □ All async operations awaited?
 *   □ Generous timeouts (10s+ for elements)?
 *   □ No shared mutable state between tests?
 *   □ No timing assertions?
 *   □ Unique file paths per test?
 *   □ Each test self-contained (no order dependency)?
 * ═══════════════════════════════════════════════════════════════
 */
