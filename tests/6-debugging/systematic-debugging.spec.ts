/**
 * DEMO 6: The FLIP Systematic Debugging Framework
 * 
 * 🎯 PRACTICAL DEBUGGING TECHNIQUES FOR LIVE DEMO
 * 
 * This file shows REAL debugging techniques you can use TODAY:
 * 
 * F - Find:       Reproduce consistently (5-10x, not 100x!)
 * L - Localize:   Binary search to find the flaky step
 * I - Instrument: Add logging to see what's actually happening
 * P - Pattern:    Look for CI vs local, parallel vs serial
 * 
 * 💡 FLAKES prevents CI failures. FLIP fixes them.
 * 
 * 🎬 DEMO COMMANDS (copy-paste ready):
 * 
 *   # Quick flake detection (5 runs)
 *   npx playwright test systematic-debugging --grep "flaky" --repeat-each=5
 * 
 *   # Equivalent in other frameworks:
 *   # pytest:  pytest --count=5 test_file.py        (requires pytest-repeat plugin)
 *   # JUnit:   @RepeatedTest(5) annotation on test method
 *   # TestNG:  @Test(invocationCount = 5) annotation on test method
 * 
 *   # Run with visible browser
 *   npx playwright test systematic-debugging --headed --grep "instrument"
 * 
 *   # Debug mode (step through)
 *   npx playwright test systematic-debugging --debug --grep "isolate"
 * 
 * @tags @debugging @methodology @framework @demo
 */

import { test, expect } from '@playwright/test';
import * as os from 'os';

const BASE_URL = 'https://gauravkhurana.com/test-automation-play/';

/**
 * ═══════════════════════════════════════════════════════════════════
 * F - FIND: Reproduce the Flake (5-10 runs, not 100!)
 * ═══════════════════════════════════════════════════════════════════
 * 
 * 🎬 DEMO: npx playwright test --grep "flaky" --repeat-each=5
 */

test.describe('F - Find: Reproduce the Flake', () => {
  
  /**
   * 🎬 DEMO: This test is INTENTIONALLY FLAKY (~50% fail rate)
   * Run it 5 times - some pass, some fail!
   * 
   * Command: npx playwright test --grep "flaky-timing" --repeat-each=5
   * 
   * WHY IT'S FLAKY: We inject variable delay into the page itself,
   * simulating real-world variance (network, server, rendering).
   * Then we use a fixed timeout that's sometimes too short.
   * 
   * This is the CLASSIC flakiness pattern: fixed wait vs variable conditions.
   */
  test('flaky-timing: race condition you can actually see', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Real browser interaction - click the tab
    await page.getByRole('tab', { name: 'Business' }).click();
    
    // ════════════════════════════════════════════════════════════════
    // 🎭 INJECT VARIABLE DELAY (simulates network/server variance)
    // In production, this variance comes naturally from infrastructure.
    // For demo, we inject it so we can guarantee flakiness happens.
    // ════════════════════════════════════════════════════════════════
    const simulatedDelay = Math.floor(Math.random() * 200); // 0-200ms
    
    // Hide the element, then show it after random delay (simulates slow render)
    await page.evaluate((delay) => {
      const el = document.querySelector('[data-testid="login-username"]');
      if (el) {
        (el as HTMLElement).style.display = 'none';
        setTimeout(() => {
          (el as HTMLElement).style.display = '';
        }, delay);
      }
    }, simulatedDelay);
    
    // ════════════════════════════════════════════════════════════════
    // ❌ THE FLAKY PATTERN: Fixed timeout that's sometimes too short
    // ════════════════════════════════════════════════════════════════
    const HARDCODED_TIMEOUT = 100; // Developer assumed 100ms is enough
    
    console.log(`   🎲 Simulated render delay: ${simulatedDelay}ms`);
    console.log(`   ⏱️  Our hardcoded timeout: ${HARDCODED_TIMEOUT}ms`);
    console.log(`   📊 Will ${simulatedDelay <= HARDCODED_TIMEOUT ? 'PASS ✅' : 'FAIL ❌'} (delay ${simulatedDelay <= HARDCODED_TIMEOUT ? '<=' : '>'} timeout)`);
    
    try {
      // Real Playwright assertion - will it find the element in time?
      await expect(page.getByTestId('login-username')).toBeVisible({ 
        timeout: HARDCODED_TIMEOUT 
      });
      
      console.log(`   ✅ PASSED: Element appeared within ${HARDCODED_TIMEOUT}ms`);
      
    } catch (error) {
      console.log(`   ❌ FLAKY FAILURE!`);
      console.log(`   💡 Element took ${simulatedDelay}ms but we only waited ${HARDCODED_TIMEOUT}ms`);
      console.log(`   🔧 FIX: Use auto-waiting or increase timeout`);
      throw error;
    }
  });

  /**
   * 🎬 DEMO: This shows how retry helps
   * Same test but with proper timeout - always passes
   */
  test('stable-timing: same test with proper wait', async ({ page }) => {
    await page.goto(BASE_URL);
    
    await page.getByRole('tab', { name: 'Business' }).click();
    
    // ✅ STABLE: Default timeout (5s) handles variation
    const input = page.getByTestId('login-username');
    await expect(input).toBeVisible(); // Uses default 5000ms
  });

});

/**
 * ═══════════════════════════════════════════════════════════════════
 * L - LOCALIZE: Binary Search for the Problem
 * ═══════════════════════════════════════════════════════════════════
 * 
 * 🎬 DEMO: Run each step alone to find which one fails
 * 
 * Command: npx playwright test --grep "isolate" --headed
 */

test.describe('L - Localize: Isolate the Problem', () => {
  
  test('isolate-1: just navigation', async ({ page }) => {
    console.log('🔍 Testing: Can we load the page?');
    await page.goto(BASE_URL);
    console.log('✅ Navigation works');
  });

  test('isolate-2: find the tab', async ({ page }) => {
    await page.goto(BASE_URL);
    console.log('🔍 Testing: Can we find the tab?');
    
    const tab = page.getByRole('tab', { name: 'Business' });
    await expect(tab).toBeVisible();
    console.log('✅ Tab is visible');
  });

  test('isolate-3: click the tab', async ({ page }) => {
    await page.goto(BASE_URL);
    const tab = page.getByRole('tab', { name: 'Business' });
    await expect(tab).toBeVisible();
    
    console.log('🔍 Testing: Can we click the tab?');
    await tab.click();
    console.log('✅ Tab clicked');
  });

  test('isolate-4: content after click (THE FLAKY ONE!)', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.getByRole('tab', { name: 'Business' }).click();
    
    console.log('🔍 Testing: Does content appear after click?');
    console.log('   This is usually where flakes happen!');
    
    // This step is often flaky - content loading after tab switch
    const input = page.getByTestId('login-username');
    await expect(input).toBeVisible();
    console.log('✅ Content loaded');
  });

});

/**
 * ═══════════════════════════════════════════════════════════════════
 * I - INSTRUMENT: Add Logging to See What's Happening
 * ═══════════════════════════════════════════════════════════════════
 * 
 * 💡 KEY INSIGHT: "You can't fix what you can't see!"
 * 
 * Instrumentation adds VISIBILITY to your tests:
 *   • Timing logs  → How long did each step take?
 *   • Screenshots  → What did the page look like at each step?
 *   • Console logs → What errors/warnings occurred?
 * 
 * 🎬 DEMO: Watch the timing in real-time
 * 
 * Command: npx playwright test --grep "instrument" --headed
 */

test.describe('I - Instrument: Add Logging', () => {
  
  /**
   * 🎬 DEMO: Run this headed to see timing in console
   */
  test('instrument: timing log shows where time goes', async ({ page }) => {
    const start = Date.now();
    const log = (msg: string) => console.log(`[${Date.now() - start}ms] ${msg}`);
    
    log('▶️  Starting test');
    
    log('📡 Navigating to page...');
    await page.goto(BASE_URL);
    log('✅ Page loaded');
    
    log('🔍 Finding Business tab...');
    const tab = page.getByRole('tab', { name: 'Business' });
    await expect(tab).toBeVisible();
    log('✅ Tab found');
    
    log('👆 Clicking tab...');
    await tab.click();
    log('✅ Tab clicked');
    
    log('⏳ Waiting for form to appear...');
    const input = page.getByTestId('login-username');
    await expect(input).toBeVisible();
    log('✅ Form visible');
    
    log('🏁 Test complete!');
    
    console.log('\n📊 TIMING ANALYSIS:');
    console.log('   If any step took >500ms, investigate why!');
    console.log('   In CI, these times can be 2-5x longer.\n');
  });

  /**
   * 🎬 DEMO: Screenshot at each step for debugging
   */
  test('instrument: screenshots for debugging', async ({ page }, testInfo) => {
    const screenshot = async (name: string) => {
      await page.screenshot({ 
        path: testInfo.outputPath(`${name}.png`),
        fullPage: true 
      });
      console.log(`📸 Screenshot: ${name}`);
    };
    
    await page.goto(BASE_URL);
    await screenshot('1-page-loaded');
    
    await page.getByRole('tab', { name: 'Business' }).click();
    await screenshot('2-after-tab-click');
    
    await expect(page.getByTestId('login-username')).toBeVisible();
    await screenshot('3-form-visible');
    
    console.log('\n💡 TIP: Check test-results folder for screenshots!');
    console.log(`   Path: ${testInfo.outputDir}\n`);
  });

});

/**
 * ═══════════════════════════════════════════════════════════════════
 * P - PATTERN: Recognition - CI vs Local, Parallel vs Serial
 * ═══════════════════════════════════════════════════════════════════
 * 
 * 💡 KEY INSIGHT: "Same test, different results? Find the PATTERN!"
 * 
 * Ask these questions to identify the root cause:
 *   • CI vs Local?      → Environment/resource differences
 *   • Parallel vs Serial? → Shared state or race conditions  
 *   • Test order matters?  → Hidden dependency between tests
 *   • Specific browser?    → Browser-specific behavior
 * 
 * 🔍 HOW TO PERFORM THIS STEP:
 *   1. Run locally:     npx playwright test <test>
 *   2. Run serial:      npx playwright test <test> --workers=1
 *   3. Run test alone:  npx playwright test <test> --grep "specific-test"
 *   4. Compare CI logs: Check if same test passes locally but fails in CI
 * 
 * 🎬 DEMO: See what's different between environments
 */

test.describe('P - Pattern: Recognition', () => {
  
  /**
   * 🎬 DEMO: Print environment info
   * Compare this output locally vs in CI!
   */
  test('pattern: environment comparison', async ({ page }, testInfo) => {
    console.log('\n' + '═'.repeat(50));
    console.log('📊 ENVIRONMENT FINGERPRINT');
    console.log('═'.repeat(50));
    console.log(`  🖥️  Platform:    ${process.platform}`);
    console.log(`  🔢 CPU Cores:   ${os.cpus().length}`);
    console.log(`  🧠 Free RAM:    ${(os.freemem() / 1024 / 1024 / 1024).toFixed(1)} GB`);
    console.log(`  🏃 CI:          ${process.env.CI || 'false'}`);
    console.log(`  👷 Worker:      ${testInfo.parallelIndex}`);
    console.log(`  🌐 Browser:     ${testInfo.project.name}`);
    console.log('═'.repeat(50));
    
    console.log('\n💡 PATTERN HINTS:');
    console.log('   - CI has 2 cores (you have ' + os.cpus().length + ')');
    console.log('   - CI has ~7GB RAM (you have ' + (os.totalmem() / 1024 / 1024 / 1024).toFixed(0) + 'GB)');
    console.log('   - If test fails in CI, resource constraints might be why!\n');
    
    await page.goto(BASE_URL);
    await expect(page.getByRole('tab', { name: 'Basic' })).toBeVisible();
  });

  /**
   * 🎬 DEMO: Worker isolation check
   * Run with: npx playwright test --grep "isolation" --workers=3
   */
  test('pattern: worker isolation check', async ({ page }, testInfo) => {
    const workerId = testInfo.parallelIndex;
    const uniqueId = `worker-${workerId}-${Date.now()}`;
    
    console.log(`\n👷 Worker ${workerId} running test`);
    console.log(`   Unique ID: ${uniqueId}`);
    
    await page.goto(BASE_URL);
    
    // Each worker gets fresh browser context
    await page.evaluate((id) => {
      localStorage.setItem('testId', id);
    }, uniqueId);
    
    const stored = await page.evaluate(() => localStorage.getItem('testId'));
    
    // If this fails, workers are sharing state (bad!)
    expect(stored).toBe(uniqueId);
    console.log(`   ✅ State isolated correctly\n`);
  });

  /**
   * 🎬 DEMO: State pollution detection
   */
  test('pattern: state-setter (run first)', async ({ page }) => {
    await page.goto(BASE_URL);
    
    await page.evaluate(() => {
      localStorage.setItem('POLLUTION_TEST', 'I-was-here');
    });
    
    console.log('🔴 Set localStorage.POLLUTION_TEST = "I-was-here"');
    console.log('   Next test should NOT see this value!');
  });

  test('pattern: state-checker (run second)', async ({ page }) => {
    await page.goto(BASE_URL);
    
    const value = await page.evaluate(() => localStorage.getItem('POLLUTION_TEST'));
    
    console.log(`\n🔍 Checking for state pollution...`);
    console.log(`   localStorage.POLLUTION_TEST = ${value || 'null (CLEAN!)'}`);
    
    if (value === null) {
      console.log('   ✅ Browser context is properly isolated');
    } else {
      console.log('   ❌ STATE LEAKED! Tests share browser context');
    }
    
    expect(value).toBeNull(); // Playwright isolates by default
  });

});

/**
 * ═══════════════════════════════════════════════════════════════════
 * 🎬 QUICK DEMO COMMANDS (copy-paste into terminal)
 * ═══════════════════════════════════════════════════════════════════
 * 
 * # See the flaky test fail (run 5x)
 * npx playwright test --grep "flaky-timing" --repeat-each=5
 * 
 * # Watch isolation tests with visible browser
 * npx playwright test --grep "isolate" --headed --slowmo=300
 * 
 * # See instrumentation in action
 * npx playwright test --grep "instrument" --headed
 * 
 * # Compare environment info
 * npx playwright test --grep "environment"
 * 
 * # Debug mode - step through test
 * npx playwright test --grep "isolate-4" --debug
 * 
 * # UI mode - best for exploration
 * npx playwright test --ui --grep "systematic"
 */
