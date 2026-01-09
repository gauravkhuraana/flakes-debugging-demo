/**
 * DEMO 1: Filesystem - BAD PATTERNS (Likely to fail in CI)
 * 
 * FLAKES Categories: F (Filesystem/File Paths)
 * 
 * ⚠️  WHY THESE PASS LOCALLY BUT FAIL IN CI:
 * - Hardcoded paths with your username
 * - Windows backslashes on Linux CI
 * - Case-insensitive local vs case-sensitive CI
 * - Paths outside the repo checkout
 * 
 * @tags @fail @simple @filesystem @paths
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const BASE_URL = 'https://gauravkhurana.in/test-automation-play/';

// Minimal logging - once per suite
function logEnv() {
  console.log(`\n📁 cwd: ${process.cwd()} | platform: ${process.platform} | CI: ${process.env.CI || 'local'}\n`);
}

test.describe('Filesystem Demo - Failing Tests @fail', () => {

  test.beforeAll(() => logEnv());

  test('should load test data - absolute path', async ({ page }) => {

    const hardcodedPath = 'E:\\Automation\\testAutomationguild\\flakes-debugging-demo\\testdata\\users.json';
    
    let fileExists = false;
    try {
      fileExists = fs.existsSync(hardcodedPath);
    } catch (e) { /* ignore */ }
    
    console.log(`📂 Path: ${hardcodedPath} | exists: ${fileExists}`);
    
    // Fails in CI - different user, different OS
    expect(fileExists).toBeTruthy();
  });

  test('should read config file - relative path', async ({ page }) => {

    const windowsPath = 'flakes-debugging-demo\\testdata\\users.json';
    
    console.log(`📂 Path: "${windowsPath}" | OS: ${process.platform}`);
    
    let fileExists = false;
    try {
      fileExists = fs.existsSync(windowsPath);
    } catch (e) { /* ignore */ }
    
    // Fails on Linux - backslashes aren't path separators
    expect(fileExists).toBeTruthy();
  });

  test('should find screenshot - case sensitivity issue', async ({ page }) => {
    // ❌ PROBLEM 3: Case mismatch - Linux is case-sensitive
    await page.goto(BASE_URL);
    
    const screenshotPath = 'flakes-debugging-demo\\testdata\\Screenshot.png'; // Uppercase S
    const wrongCasePath = 'flakes-debugging-demo\\testdata\\screenshot.png';  // lowercase s
    
    if (!fs.existsSync('test-results')) {
      fs.mkdirSync('test-results', { recursive: true });
    }
    
    await page.screenshot({ path: screenshotPath });
    console.log(`📸 Saved: ${screenshotPath} | Looking for: ${wrongCasePath}`);
    
    // Fails on Linux - case matters!
    const existsWithWrongCase = fs.existsSync(wrongCasePath);
    expect(existsWithWrongCase).toBeTruthy();
  });

  test('should load fixture - path outside repo', async ({ page }) => {
    // ❌ PROBLEM 4: Path outside repo - CI only has repo contents
    const outsideRepoPath = 'ask.md';
    
    console.log(`📁 Looking for: ${path.resolve(process.cwd(), outsideRepoPath)}`);
    
    let fileExists = false;
    try {
      fileExists = fs.existsSync(outsideRepoPath);
    } catch (e) { /* ignore */ }
    
    // Fails in CI - only repo is checked out
    expect(fileExists).toBeTruthy();
  });

  test('should use temp directory - platform-specific temp path', async ({ page }) => {
    // ❌ PROBLEM 5: Windows temp path doesn't exist on Linux
    const windowsTempPath = 'C:\\Users\\gakhuran\\AppData\\Local\\Temp\\test-output.json';
    
    console.log(`📁 Trying to write: ${windowsTempPath}`);
    console.log(`📁 OS temp dir: ${os.tmpdir()}`);
    
    let writeSucceeded = false;
    try {
      fs.writeFileSync(windowsTempPath, JSON.stringify({ test: true }));
      writeSucceeded = true;
    } catch (e) {
      console.log(`❌ Write failed: ${(e as Error).message}`);
    }
    
    // Fails on Linux - C:\ doesn't exist
    expect(writeSucceeded).toBe(true);
  });

});

/**
 * 📝 COMMON FILESYSTEM ERRORS IN CI:
 * - ENOENT: Hardcoded path doesn't exist
 * - EACCES: Permission denied
 * - Case sensitivity: MyFile.json ≠ myfile.json on Linux
 */
