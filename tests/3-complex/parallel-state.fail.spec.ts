/**
 * DEMO 3: Complex - BAD PATTERNS (Pass locally, Fail in CI)
 * 
 * FLAKES Categories: S (State/Shared) + A (Async) + K (Konfiguration)
 * 
 * ⚠️  WHY THESE PASS LOCALLY BUT FAIL IN CI:
 * 
 * Local machine:
 *   - Fast CPU hides race conditions
 *   - Tests often run sequentially (you run one at a time)
 *   - Plenty of RAM/CPU resources
 *   - Network is fast and stable
 * 
 * CI environment:
 *   - Slower VM exposes timing issues
 *   - Tests run in parallel (multiple workers)
 *   - Limited resources (2 cores, 7GB RAM)
 *   - Network latency varies
 * 
 * 💡 Compare with parallel-state.pass.spec.ts to see the FIXES!
 * 
 * @tags @fail @complex @state @parallel
 */

import { test, expect } from '@playwright/test';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'https://gauravkhurana.in/test-automation-play/';

// ❌ BAD: Shared mutable state between tests
let sharedCounter = 0;
let sharedTestData: string[] = [];

// Print environment info once
let envPrinted = false;

test.describe('Parallel & State Demo - BAD Patterns @fail', () => {

  test.beforeAll(() => {
    if (envPrinted) return;
    envPrinted = true;
    
    console.log('\n' + '═'.repeat(60));
    console.log('❌ ENVIRONMENT INFO - BAD PATTERNS');
    console.log('═'.repeat(60));
    console.log(`💻 Platform:     ${process.platform}`);
    console.log(`🔢 CPU Cores:    ${os.cpus().length}`);
    console.log(`🧠 Free RAM:     ${(os.freemem() / (1024 ** 3)).toFixed(2)} GB`);
    console.log(`🔧 CI:           ${process.env.CI || 'false'}`);
    console.log('═'.repeat(60) + '\n');
  });

  /**
   * ❌ BAD PATTERN 1: Missing await - race condition
   * 
   * Local:  Fast machine, operation completes before assertion
   * CI:     Slow VM, assertion runs before operation finishes
   */
  test('Test 1: Missing await causes race condition', async ({ page }) => {
    await page.goto(BASE_URL);
    
    const businessTab = page.getByRole('tab', { name: 'Business' });
    await expect(businessTab).toBeVisible();
    await businessTab.click();
    
    const input = page.getByTestId('login-username');
    await expect(input).toBeVisible();
    
    console.log('❌ BAD: Missing await on fill()');
    console.log('   Local: Fast, fill completes in time');
    console.log('   CI: Slow, assertion runs before fill completes');
    
    // ❌ BAD: Missing await - fill hasn't completed!
    input.fill('testuser');
    
    // ❌ BAD: This assertion may run before fill completes in CI
    expect(input).toHaveValue('testuser');
  });

  /**
   * ❌ BAD PATTERN 2: Short timeout for network request
   * 
   * Local:  Fast network, response in ~100ms
   * CI:     Shared network, response may take 500-2000ms
   */
  test('Test 2: Short timeout for slow CI network', async ({ page }) => {
    console.log('❌ BAD: 500ms timeout for page load');
    console.log('   Local: Fast network loads in ~200ms');
    console.log('   CI: Shared network may take 1000-3000ms');
    
    // ❌ BAD: 500ms might work locally but fail in CI
    await page.goto(BASE_URL, { timeout: 500 });
    
    const tab = page.getByRole('tab', { name: 'Business' });
    await expect(tab).toBeVisible({ timeout: 500 });
  });

  /**
   * ❌ BAD PATTERN 3: Shared mutable state between tests
   * 
   * Local:  Tests run sequentially, state is predictable
   * CI:     Tests run in parallel across workers, state conflicts!
   */
  test('Test 3: Shared state - increment counter', async ({ page }) => {
    // ❌ BAD: Using shared module-level variable
    sharedCounter++;
    
    console.log('❌ BAD: Shared mutable state between tests');
    console.log(`   sharedCounter = ${sharedCounter}`);
    console.log('   Local: Sequential execution, counter is 1');
    console.log('   CI: Parallel workers, counter is unpredictable!');
    
    await page.goto(BASE_URL);
    
    // ❌ BAD: Assertion depends on shared state
    // Locally runs after Test 3a, so counter is 1
    // In CI, might run in different order or parallel!
    expect(sharedCounter).toBe(1);
  });

  test('Test 3a: Shared state - depends on counter value', async ({ page }) => {
    // ❌ BAD: This test depends on sharedCounter being 1
    sharedCounter++;
    
    console.log('❌ BAD: Test depends on another test\'s state');
    console.log(`   sharedCounter = ${sharedCounter}`);
    console.log('   Expected: 2 (if Test 3 ran first)');
    console.log('   CI: May get 1 or 2 depending on execution order!');
    
    await page.goto(BASE_URL);
    
    // ❌ BAD: Depends on Test 3 running first
    expect(sharedCounter).toBe(2);
  });

  /**
   * ❌ BAD PATTERN 4: Timing-based assertion
   * 
   * Local:  8+ cores, operations complete in 100ms
   * CI:     2 cores, shared resources, may take 500-1500ms
   */
  test('Test 4: Timing assertion fails in slow CI', async ({ page }) => {
    await page.goto(BASE_URL);
    
    const startTime = Date.now();
    
    await page.getByRole('tab', { name: 'Business' }).click();
    await expect(page.getByTestId('login-username')).toBeVisible();
    
    const duration = Date.now() - startTime;
    
    console.log('❌ BAD: Asserting on timing');
    console.log(`   Duration: ${duration}ms (threshold: 300ms)`);
    console.log('   Local: 8 cores, finishes in ~100-200ms');
    console.log('   CI: 2 cores, may take 300-800ms');
    
    // ❌ BAD: Timing varies by machine - never assert on duration!
    expect(duration).toBeLessThan(300);
  });

  /**
   * ❌ BAD PATTERN 5: File write without isolation
   * 
   * Local:  Single test runner, no conflicts
   * CI:     Parallel workers writing to same file = corruption!
   */
  test('Test 5: File write conflict in parallel', async ({ page }) => {
    const sharedFilePath = path.join(os.tmpdir(), 'shared-test-data.json');
    
    console.log('❌ BAD: Multiple tests writing to same file');
    console.log(`   File: ${sharedFilePath}`);
    console.log('   Local: Sequential, no conflicts');
    console.log('   CI: Parallel workers overwrite each other!');
    
    // ❌ BAD: Writing to shared file without locking
    const testData = { testId: 'test5', timestamp: Date.now() };
    fs.writeFileSync(sharedFilePath, JSON.stringify(testData));
    
    await page.goto(BASE_URL);
    
    // ❌ BAD: Another parallel worker may have overwritten the file!
    const readData = JSON.parse(fs.readFileSync(sharedFilePath, 'utf-8'));
    expect(readData.testId).toBe('test5');
  });

  test('Test 5a: File write conflict - competing write', async ({ page }) => {
    const sharedFilePath = path.join(os.tmpdir(), 'shared-test-data.json');
    
    // ❌ BAD: This test also writes to the same file!
    const testData = { testId: 'test5a', timestamp: Date.now() };
    fs.writeFileSync(sharedFilePath, JSON.stringify(testData));
    
    await page.goto(BASE_URL);
    
    // ❌ BAD: Test 5 or 5a - whoever runs last "wins"
    const readData = JSON.parse(fs.readFileSync(sharedFilePath, 'utf-8'));
    expect(readData.testId).toBe('test5a');
  });

  /**
   * ❌ BAD PATTERN 6: Test order dependency
   * 
   * Local:  Tests run in file order (1, 2, 3...)
   * CI:     Tests may run in any order across workers!
   */
  test('Test 6: Depends on previous test setting data', async ({ page }) => {
    // ❌ BAD: Assumes Test 6a ran and populated sharedTestData
    console.log('❌ BAD: Test depends on another test running first');
    console.log(`   sharedTestData: [${sharedTestData.join(', ')}]`);
    console.log('   Expects: ["setup-data"]');
    console.log('   CI: May run before Test 6a!');
    
    await page.goto(BASE_URL);
    
    // ❌ BAD: Fails if Test 6a hasn't run yet
    expect(sharedTestData).toContain('setup-data');
  });

  test('Test 6a: Setup test that must run first', async ({ page }) => {
    // ❌ BAD: Other tests depend on this running first
    sharedTestData.push('setup-data');
    
    console.log('❌ BAD: Other tests depend on this setup');
    console.log(`   Added "setup-data" to sharedTestData`);
    console.log('   CI: No guarantee this runs before Test 6!');
    
    await page.goto(BASE_URL);
    expect(sharedTestData).toContain('setup-data');
  });

});

/**
 * ═══════════════════════════════════════════════════════════════
 * SUMMARY: Why these fail in CI
 * ═══════════════════════════════════════════════════════════════
 * 
 * Test 1: Missing await - slow CI exposes race condition
 * Test 2: Short timeout - CI network is slower
 * Test 3/3a: Shared state - parallel workers cause conflicts
 * Test 4: Timing assertion - CI is slower
 * Test 5/5a: Shared file - parallel writes corrupt data
 * Test 6/6a: Test order dependency - CI runs in different order
 * 
 * ➡️ See parallel-state.pass.spec.ts for the FIXED versions!
 * ═══════════════════════════════════════════════════════════════
 */
