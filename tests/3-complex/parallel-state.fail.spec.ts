/**
 * DEMO 3: S (State & Shared Data) - BAD PATTERNS
 * 
 * FLAKES Category: S (State/Shared) ONLY
 * 
 * ═══════════════════════════════════════════════════════════════
 * 🎯 THIS FILE FOCUSES EXCLUSIVELY ON STATE ISOLATION ISSUES
 * ═══════════════════════════════════════════════════════════════
 * 
 * State issues cause flakiness when:
 *   1. Tests share mutable variables (module-level state)
 *   2. Tests write to shared files without isolation
 *   3. Tests depend on execution order
 *   4. Parallel workers corrupt shared resources
 * 
 * ⚠️  WHY THESE PASS LOCALLY BUT FAIL IN CI:
 * 
 * Local:  Tests run sequentially, state is predictable
 * CI:     Tests run in PARALLEL across workers = conflicts!
 * 
 * 💡 Compare with parallel-state.pass.spec.ts to see the FIXES!
 * 
 * @tags @fail @state @parallel @isolation
 */

import { test, expect } from '@playwright/test';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'https://gauravkhurana.in/test-automation-play/';

// ═══════════════════════════════════════════════════════════════
// ❌ BAD: Shared mutable state between tests
// These variables are the ROOT CAUSE of state-based flakiness!
// ═══════════════════════════════════════════════════════════════
let sharedCounter = 0;
let sharedTestData: string[] = [];

test.describe('State & Isolation Demo - BAD Patterns @fail', () => {

  test.beforeAll(() => {
    console.log('\n' + '═'.repeat(60));
    console.log('❌ STATE ISOLATION - BAD PATTERNS');
    console.log('═'.repeat(60));
    console.log('🎯 Focus: Shared state between tests');
    console.log('📍 Problem: Parallel workers = unpredictable state');
    console.log('═'.repeat(60) + '\n');
  });

  /**
   * ❌ BAD PATTERN 1: Shared mutable state between tests
   * 
   * Local:  Tests run sequentially, state is predictable
   * CI:     Tests run in parallel across workers, state conflicts!
   */
  test('Test 1: Shared state - increment counter', async ({ page }) => {
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

  test('Test 1a: Shared state - depends on counter value', async ({ page }) => {
    // ❌ BAD: This test depends on sharedCounter being 1
    sharedCounter++;
    
    console.log('❌ BAD: Test depends on another test\'s state');
    console.log(`   sharedCounter = ${sharedCounter}`);
    console.log('   Expected: 2 (if Test 1 ran first)');
    console.log('   CI: May get 1 or 2 depending on execution order!');
    
    await page.goto(BASE_URL);
    
    // ❌ BAD: Depends on Test 1 running first
    expect(sharedCounter).toBe(2);
  });

  /**
   * ❌ BAD PATTERN 2: File write without isolation
   * 
   * Local:  Single test runner, no conflicts
   * CI:     Parallel workers writing to same file = corruption!
   */
  test('Test 2: File write conflict in parallel', async ({ page }) => {
    const sharedFilePath = path.join(os.tmpdir(), 'shared-test-data.json');
    
    console.log('❌ BAD: Multiple tests writing to same file');
    console.log(`   File: ${sharedFilePath}`);
    console.log('   Local: Sequential, no conflicts');
    console.log('   CI: Parallel workers overwrite each other!');
    
    // ❌ BAD: Writing to shared file without locking
    const testData = { testId: 'test2', timestamp: Date.now() };
    fs.writeFileSync(sharedFilePath, JSON.stringify(testData));
    
    await page.goto(BASE_URL);
    
    // ❌ BAD: Another parallel worker may have overwritten the file!
    const readData = JSON.parse(fs.readFileSync(sharedFilePath, 'utf-8'));
    expect(readData.testId).toBe('test2');
  });

  test('Test 2a: File write conflict - competing write', async ({ page }) => {
    const sharedFilePath = path.join(os.tmpdir(), 'shared-test-data.json');
    
    // ❌ BAD: This test also writes to the same file!
    const testData = { testId: 'test2a', timestamp: Date.now() };
    fs.writeFileSync(sharedFilePath, JSON.stringify(testData));
    
    await page.goto(BASE_URL);
    
    // ❌ BAD: Test 2 or 2a - whoever runs last "wins"
    const readData = JSON.parse(fs.readFileSync(sharedFilePath, 'utf-8'));
    expect(readData.testId).toBe('test2a');
  });

  /**
   * ❌ BAD PATTERN 3: Test order dependency
   * 
   * Local:  Tests run in file order (1, 2, 3...)
   * CI:     Tests may run in any order across workers!
   */
  test('Test 3: Depends on previous test setting data', async ({ page }) => {
    // ❌ BAD: Assumes Test 3a ran and populated sharedTestData
    console.log('❌ BAD: Test depends on another test running first');
    console.log(`   sharedTestData: [${sharedTestData.join(', ')}]`);
    console.log('   Expects: ["setup-data"]');
    console.log('   CI: May run before Test 3a!');
    
    await page.goto(BASE_URL);
    
    // ❌ BAD: Fails if Test 6a hasn't run yet
    expect(sharedTestData).toContain('setup-data');
  });

  test('Test 3a: Setup test that must run first', async ({ page }) => {
    // ❌ BAD: Other tests depend on this running first
    sharedTestData.push('setup-data');
    
    console.log('❌ BAD: Other tests depend on this setup');
    console.log(`   Added "setup-data" to sharedTestData`);
    console.log('   CI: No guarantee this runs before Test 3!');
    
    await page.goto(BASE_URL);
    expect(sharedTestData).toContain('setup-data');
  });

});

/**
 * ═══════════════════════════════════════════════════════════════
 * SUMMARY: S (State & Shared Data) - Why these fail in CI
 * ═══════════════════════════════════════════════════════════════
 * 
 * Test 1/1a: Shared mutable state - parallel workers cause conflicts
 * Test 2/2a: Shared file writes - parallel workers overwrite each other
 * Test 3/3a: Test order dependency - CI runs in different order
 * 
 * 🔑 KEY INSIGHT: State issues appear when tests run in PARALLEL!
 *    - Local: Sequential execution hides the problem
 *    - CI: Parallel workers expose state conflicts
 * 
 * 💡 FIX: Each test must be ISOLATED - no shared state!
 * 
 * ➡️ See parallel-state.pass.spec.ts for the FIXED versions!
 * ═══════════════════════════════════════════════════════════════
 */
