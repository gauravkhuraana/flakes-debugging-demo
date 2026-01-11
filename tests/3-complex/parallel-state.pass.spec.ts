/**
 * DEMO 3: S (State & Shared Data) - GOOD PATTERNS
 * 
 * FLAKES Category: S (State/Shared) ONLY
 * 
 * ═══════════════════════════════════════════════════════════════
 * 🎯 THIS FILE FOCUSES EXCLUSIVELY ON STATE ISOLATION FIXES
 * ═══════════════════════════════════════════════════════════════
 * 
 * ✅ WHY THESE PASS EVERYWHERE:
 * 
 * These patterns work because each test is ISOLATED:
 *   - Local variables instead of shared mutable state
 *   - Unique files per test (no write conflicts)
 *   - Self-contained setup (no test order dependencies)
 * 
 * 💡 Compare with parallel-state.fail.spec.ts to see the problems!
 * 
 * @tags @pass @state @parallel @isolation
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';

const BASE_URL = 'https://gauravkhurana.in/test-automation-play/';

test.describe('State & Isolation Demo - GOOD Patterns @pass', () => {

  test.beforeAll(() => {
    console.log(`\n✅ STATE ISOLATION - GOOD: Local variables, unique files, self-contained\n`);
  });

  /**
   * ✅ GOOD PATTERN 1: Isolated state per test
   * 
   * Fix: Each test creates its own state - no sharing!
   */
  test('Test 1: Isolated state - own counter', async ({ page }) => {
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

  test('Test 1a: Isolated state - independent counter', async ({ page }) => {
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
   * ✅ GOOD PATTERN 2: Unique file per test
   * 
   * Fix: Use unique filename with testInfo to avoid conflicts
   */
  test('Test 2: Unique file prevents write conflict', async ({ page }, testInfo) => {
    // ✅ GOOD: Unique file name using testInfo
    const uniqueFilePath = testInfo.outputPath('test-data.json');
    
    console.log('✅ GOOD: Unique file per test');
    console.log(`   File: ${uniqueFilePath}`);
    console.log('   testInfo.outputPath() creates unique path per test');
    
    // ✅ GOOD: Each test has its own file, no conflicts
    const testData = { testId: 'test2', timestamp: Date.now() };
    fs.writeFileSync(uniqueFilePath, JSON.stringify(testData));
    
    await page.goto(BASE_URL);
    
    // ✅ GOOD: Reading our own unique file
    const readData = JSON.parse(fs.readFileSync(uniqueFilePath, 'utf-8'));
    expect(readData.testId).toBe('test2');
  });

  test('Test 2a: Unique file - no conflict with Test 2', async ({ page }, testInfo) => {
    // ✅ GOOD: Different unique file for this test
    const uniqueFilePath = testInfo.outputPath('test-data.json');
    
    console.log('✅ GOOD: Each test has its own unique file');
    console.log(`   File: ${uniqueFilePath}`);
    
    const testData = { testId: 'test2a', timestamp: Date.now() };
    fs.writeFileSync(uniqueFilePath, JSON.stringify(testData));
    
    await page.goto(BASE_URL);
    
    // ✅ GOOD: Our own file, not affected by Test 2
    const readData = JSON.parse(fs.readFileSync(uniqueFilePath, 'utf-8'));
    expect(readData.testId).toBe('test2a');
  });

  /**
   * ✅ GOOD PATTERN 3: No test order dependency
   * 
   * Fix: Each test sets up its own data in beforeEach or within test
   */
  test('Test 3: Self-contained test with own setup', async ({ page }) => {
    // ✅ GOOD: Test sets up its own data
    const localTestData = ['setup-data'];
    
    console.log('✅ GOOD: Self-contained test');
    console.log(`   localTestData: [${localTestData.join(', ')}]`);
    console.log('   Each test creates its own data');
    
    await page.goto(BASE_URL);
    
    // ✅ GOOD: Always passes - data is local
    expect(localTestData).toContain('setup-data');
  });

  test('Test 3a: Also self-contained, no dependency', async ({ page }) => {
    // ✅ GOOD: Own setup, no dependency on Test 3
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
 * SUMMARY: S (State & Shared Data) - How these are fixed
 * ═══════════════════════════════════════════════════════════════
 * 
 * Test 1/1a: ✅ Isolated state per test (local variables)
 * Test 2/2a: ✅ Unique file per test (testInfo.outputPath)
 * Test 3/3a: ✅ Self-contained tests with own setup
 * 
 * 🔑 KEY INSIGHT: Each test must be ISOLATED!
 *    - No shared mutable variables
 *    - No shared files
 *    - No test order dependencies
 * 
 * 📋 STATE ISOLATION CHECKLIST:
 *   □ No module-level mutable variables?
 *   □ Using local variables instead of shared state?
 *   □ Unique file paths per test (testInfo.outputPath)?
 *   □ Each test self-contained (no order dependency)?
 *   □ Using beforeEach for shared setup instead of beforeAll?
 * ═══════════════════════════════════════════════════════════════
 */
