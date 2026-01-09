/**
 * DEMO 6: The 4-Step Systematic Debugging Framework
 * 
 * 🎯 FROM THE FLAKINESS DEBUGGING PLAYBOOK:
 * This demonstrates the 4-step framework for debugging flaky tests
 * 
 * STEP 1: Reproduce Reliably
 *   - Run the test 100 times locally
 *   - Use repeat runners (--repeat-each in Playwright)
 *   - Vary conditions: browsers, network, CPU
 * 
 * STEP 2: Isolate the Variable
 *   - Binary search for the flaky step
 *   - Run each step alone to find the culprit
 * 
 * STEP 3: Instrument Aggressively
 *   - Add timestamps to every action
 *   - Log all waits and durations
 *   - Capture network traffic (HAR)
 *   - Screenshot before every assertion
 * 
 * STEP 4: Pattern Recognition
 *   - Does it fail at specific times?
 *   - Does it fail in CI but not locally?
 *   - Does it fail in parallel but not solo?
 *   - Does it fail after certain other tests?
 * 
 * @tags @debugging @methodology @framework
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'https://gauravkhurana.in/test-automation-play/';

/**
 * ═══════════════════════════════════════════════════════════════════
 * STEP 1: REPRODUCE RELIABLY
 * 
 * Commands to run:
 *   npx playwright test --repeat-each=100 systematic-debugging.spec.ts
 *   npx playwright test --repeat-each=50 --workers=1 systematic-debugging.spec.ts
 *   npx playwright test --repeat-each=20 --project=chromium --project=firefox
 * ═══════════════════════════════════════════════════════════════════
 */

test.describe('Step 1: Reproduce Reliably', () => {
  
  // This test is designed to be run multiple times to detect flakiness
  test('reproduce: run this test 100 times to detect flakiness', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Record the run number and result
    const runId = Date.now();
    console.log(`[RUN ${runId}] Starting test...`);
    
    const basicTab = page.getByRole('tab', { name: 'Basic' });
    await expect(basicTab).toBeVisible();
    await basicTab.click();
    
    console.log(`[RUN ${runId}] Test completed`);
  });

});

/**
 * ═══════════════════════════════════════════════════════════════════
 * STEP 2: ISOLATE THE VARIABLE
 * 
 * Binary search approach: Run each step individually to find the flaky one
 * ═══════════════════════════════════════════════════════════════════
 */

test.describe('Step 2: Isolate the Variable', () => {
  
  // Break down complex test into individual steps
  test('isolate: step 1 - navigation only', async ({ page }) => {
    await page.goto(BASE_URL);
    // If this fails, problem is with navigation/URL
  });

  test('isolate: step 2 - find tab only', async ({ page }) => {
    await page.goto(BASE_URL);
    const basicTab = page.getByRole('tab', { name: 'Basic' });
    await expect(basicTab).toBeVisible();
    // If this fails, problem is with tab rendering
  });

  test('isolate: step 3 - click tab only', async ({ page }) => {
    await page.goto(BASE_URL);
    const basicTab = page.getByRole('tab', { name: 'Basic' });
    await expect(basicTab).toBeVisible();
    await basicTab.click();
    // If this fails, problem is with click timing
  });

  test('isolate: step 4 - verify content after click', async ({ page }) => {
    await page.goto(BASE_URL);
    const basicTab = page.getByRole('tab', { name: 'Basic' });
    await expect(basicTab).toBeVisible();
    await basicTab.click();
    
    const enabledButton = page.getByRole('button', { name: 'Enabled Button' });
    await expect(enabledButton).toBeVisible();
    // If this fails, problem is with content loading after tab switch
  });

});

/**
 * ═══════════════════════════════════════════════════════════════════
 * STEP 3: INSTRUMENT AGGRESSIVELY
 * 
 * Add logging, timing, screenshots, and network capture
 * ═══════════════════════════════════════════════════════════════════
 */

test.describe('Step 3: Instrument Aggressively', () => {
  
  test('instrumented: full logging and screenshots', async ({ page }, testInfo) => {
    const timestamps: { action: string; time: number; duration?: number }[] = [];
    const startTime = Date.now();
    
    // Helper to log with timestamp
    const logAction = (action: string) => {
      const time = Date.now() - startTime;
      console.log(`[${time}ms] ${action}`);
      timestamps.push({ action, time });
    };
    
    // Helper to capture screenshot
    const captureScreenshot = async (name: string) => {
      const screenshotPath = testInfo.outputPath(`${name}.png`);
      await page.screenshot({ path: screenshotPath });
      logAction(`Screenshot: ${name}`);
    };
    
    // ═══ INSTRUMENTED TEST FLOW ═══
    
    logAction('Starting navigation');
    await page.goto(BASE_URL);
    logAction('Navigation complete');
    await captureScreenshot('01-after-navigation');
    
    logAction('Looking for Basic tab');
    const basicTab = page.getByRole('tab', { name: 'Basic' });
    
    logAction('Waiting for tab visibility');
    await expect(basicTab).toBeVisible();
    logAction('Tab is visible');
    await captureScreenshot('02-tab-visible');
    
    logAction('Clicking tab');
    await basicTab.click();
    logAction('Tab clicked');
    await captureScreenshot('03-after-click');
    
    logAction('Looking for Enabled Button');
    const enabledButton = page.getByRole('button', { name: 'Enabled Button' });
    
    logAction('Waiting for button visibility');
    await expect(enabledButton).toBeVisible({ timeout: 10000 });
    logAction('Button is visible');
    await captureScreenshot('04-button-visible');
    
    // ═══ OUTPUT TIMING SUMMARY ═══
    
    console.log('\n═══ TIMING SUMMARY ═══');
    let prevTime = 0;
    timestamps.forEach(({ action, time }) => {
      const duration = time - prevTime;
      console.log(`  ${action}: ${time}ms (+${duration}ms)`);
      prevTime = time;
    });
    console.log(`  TOTAL: ${Date.now() - startTime}ms`);
    console.log('═══════════════════════\n');
  });

  test('instrumented: with HAR recording', async ({ page, context }, testInfo) => {
    // Start recording network traffic
    const harPath = testInfo.outputPath('network.har');
    await context.tracing.start({ screenshots: true, snapshots: true });
    
    // Run the test
    await page.goto(BASE_URL);
    await page.getByRole('tab', { name: 'Basic' }).click();
    await expect(page.getByRole('button', { name: 'Enabled Button' })).toBeVisible();
    
    // Save the trace
    const tracePath = testInfo.outputPath('trace.zip');
    await context.tracing.stop({ path: tracePath });
    
    console.log(`\n📁 Trace saved to: ${tracePath}`);
    console.log('   View with: npx playwright show-trace ' + tracePath);
  });

});

/**
 * ═══════════════════════════════════════════════════════════════════
 * STEP 4: PATTERN RECOGNITION
 * 
 * Identify patterns in failures
 * ═══════════════════════════════════════════════════════════════════
 */

test.describe('Step 4: Pattern Recognition', () => {
  
  // Test to identify time-based patterns
  test('pattern: log time of day for analysis', async ({ page }) => {
    const now = new Date();
    const hour = now.getUTCHours();
    const dayOfWeek = now.getUTCDay();
    
    console.log(`\n═══ EXECUTION CONTEXT ═══`);
    console.log(`  UTC Time: ${now.toISOString()}`);
    console.log(`  Hour: ${hour} (0-23)`);
    console.log(`  Day: ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dayOfWeek]}`);
    console.log(`  CI: ${process.env.CI || 'false'}`);
    console.log(`  Worker: ${process.env.TEST_PARALLEL_INDEX || '0'}`);
    console.log(`═════════════════════════\n`);
    
    // Run test
    await page.goto(BASE_URL);
    await expect(page.getByRole('tab', { name: 'Basic' })).toBeVisible();
    
    // If this test fails more often at certain hours, 
    // it might indicate load-related issues
  });

  // Test to identify parallel execution issues
  test('pattern: detect parallel execution conflicts', async ({ page }, testInfo) => {
    const workerId = testInfo.parallelIndex;
    const projectName = testInfo.project.name;
    
    console.log(`\n═══ PARALLEL CONTEXT ═══`);
    console.log(`  Worker ID: ${workerId}`);
    console.log(`  Project: ${projectName}`);
    console.log(`  Test File: ${testInfo.file}`);
    console.log(`  Retry: ${testInfo.retry}`);
    console.log(`═════════════════════════\n`);
    
    // Use worker ID to create unique identifiers
    const uniqueTestId = `test-${workerId}-${Date.now()}`;
    
    await page.goto(BASE_URL);
    
    // Store test ID in localStorage to verify isolation
    await page.evaluate((id) => {
      localStorage.setItem('currentTest', id);
    }, uniqueTestId);
    
    // Verify our ID wasn't overwritten by another worker
    const storedId = await page.evaluate(() => localStorage.getItem('currentTest'));
    expect(storedId).toBe(uniqueTestId);
  });

  // Test to identify state pollution between tests
  test('pattern: first test sets state', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Set some state
    await page.evaluate(() => {
      localStorage.setItem('pollutedState', 'from-first-test');
      sessionStorage.setItem('pollutedSession', 'from-first-test');
    });
    
    console.log('Set polluted state - next test should NOT see this');
  });

  test('pattern: second test checks for pollution', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Check if state leaked from previous test
    const localStorageValue = await page.evaluate(() => 
      localStorage.getItem('pollutedState')
    );
    const sessionStorageValue = await page.evaluate(() => 
      sessionStorage.getItem('pollutedSession')
    );
    
    console.log(`\n═══ STATE POLLUTION CHECK ═══`);
    console.log(`  localStorage.pollutedState: ${localStorageValue || 'CLEAN'}`);
    console.log(`  sessionStorage.pollutedSession: ${sessionStorageValue || 'CLEAN'}`);
    console.log(`═════════════════════════════\n`);
    
    // If we see state from previous test, we have isolation issues
    // Note: Playwright provides fresh context by default, so this should be CLEAN
    expect(localStorageValue).toBeNull();
    expect(sessionStorageValue).toBeNull();
  });

});

/**
 * 📋 DEBUGGING COMMANDS REFERENCE:
 * 
 * REPRODUCE RELIABLY:
 *   npx playwright test --repeat-each=100 <test-file>
 *   npx playwright test --repeat-each=50 --workers=1 <test-file>
 * 
 * RUN WITH DEBUG:
 *   PWDEBUG=1 npx playwright test <test-file>
 *   npx playwright test --debug <test-file>
 * 
 * RUN WITH TRACE:
 *   npx playwright test --trace on <test-file>
 *   npx playwright show-trace test-results/<test>/trace.zip
 * 
 * RUN HEADED (see browser):
 *   npx playwright test --headed <test-file>
 *   npx playwright test --headed --slowmo=500 <test-file>
 * 
 * RUN IN UI MODE:
 *   npx playwright test --ui
 * 
 * ANALYZE RESULTS:
 *   npx playwright show-report
 */
