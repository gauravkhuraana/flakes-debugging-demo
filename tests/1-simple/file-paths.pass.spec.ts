/**
 * DEMO 1B: Simple - BEST PRACTICES (Filesystem/File Paths)
 * 
 * FLAKES Categories: F (Filesystem)
 * 
 * ✅ THESE PATTERNS WORK RELIABLY IN BOTH LOCAL AND CI:
 * 
 * Why these are CI-resilient:
 *   - Uses path.join() for cross-platform compatibility
 *   - Uses __dirname or import.meta.url for relative paths
 *   - Uses environment variables for temp directories
 *   - Keeps all test files inside the repository
 * 
 * 🎯 PROACTIVE PATTERNS TO USE:
 *   ✅ path.join(__dirname, 'relative/path')
 *   ✅ path.resolve() for absolute paths from relative
 *   ✅ process.env.RUNNER_TEMP or os.tmpdir() for temp files
 *   ✅ Keep fixtures in repo under tests/fixtures/
 *   ✅ Use consistent lowercase filenames
 * 
 * 📋 CODE REVIEW CHECKLIST:
 *   □ No absolute paths with usernames?
 *   □ Using path.join() for all paths?
 *   □ All test data files committed to repo?
 *   □ Filenames use consistent casing?
 *   □ Temp files use os.tmpdir() or CI-provided paths?
 * 
 * @tags @pass @simple @filesystem @paths
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const BASE_URL = 'https://gauravkhurana.com/test-automation-play/';

// 🔍 Minimal logging - once per suite
function logEnv() {
  console.log(`\n✅ cwd: ${process.cwd()} | platform: ${process.platform} | CI: ${process.env.CI || 'local'}\n`);
}

test.describe('Filesystem Demo - Passing Tests @pass', () => {

  test.beforeAll(() => logEnv());

  test('should load test data - relative path with path.join', async ({ page }) => {
    
    // ✅ FIX 1: Use path.join() with __dirname for relative paths
    // This works on Windows, macOS, AND Linux
    
    const fixturesPath = path.join(__dirname, '..', 'fixtures', 'users.json');
    
    console.log('✅ GOOD PATTERN: path.join() with __dirname');
    console.log(`   Code: path.join(__dirname, '..', 'fixtures', 'users.json')`);
    console.log('');
    console.log(`   📍 __dirname:     ${__dirname}`);
    console.log(`   📁 Resolved path: ${fixturesPath}`);
    console.log(`   📝 Path separator used: '${path.sep}'`);
    console.log('');
    console.log('   🔍 path.join() automatically:');
    console.log(`      - Uses correct separator for OS ('${path.sep}')`);
    console.log('      - Normalizes the path (removes ..)');
    console.log('      - Works relative to current file location');
    console.log('');
    
    // path.join() automatically:
    // - Uses correct separator for OS (/ on Unix, \ on Windows)
    // - Normalizes the path (removes .., resolves symlinks)
    // - Creates a path relative to current file location
    
    const fileExists = fs.existsSync(fixturesPath);
    console.log(`   File exists: ${fileExists} ✅`);
    
    expect(fileExists).toBeTruthy();
    
    // ✅ Can safely read the file
    if (fileExists) {
      const userData = JSON.parse(fs.readFileSync(fixturesPath, 'utf-8'));
      console.log(`   File contents loaded successfully!`);
      expect(userData).toHaveProperty('testUsers');
    }
  });

  test('should read config file - cross-platform path', async ({ page }) => {
    
    // ✅ FIX 2: Never hardcode slashes - use path.join()
    
    console.log('✅ GOOD PATTERN: Cross-platform path construction');
    console.log('');
    console.log('   ❌ Bad patterns:');
    console.log('      "tests\\\\fixtures\\\\users.json"  (Windows only)');
    console.log('      "tests/fixtures/users.json"     (Unix only)');
    console.log('');
    console.log('   ✅ Good pattern:');
    console.log("      path.join('tests', 'fixtures', 'users.json')");
    console.log('');
    
    // ❌ Bad: 'tests\\fixtures\\users.json' or 'tests/fixtures/users.json'
    // ✅ Good: path.join('tests', 'fixtures', 'users.json')
    
    const configPath = path.join(__dirname, '..', 'fixtures', 'users.json');
    
    console.log(`   Constructed path: ${configPath}`);
    console.log(`   On this OS (${process.platform}), path.sep = '${path.sep}'`);
    console.log('');
    
    const fileExists = fs.existsSync(configPath);
    console.log(`   File exists: ${fileExists} ✅`);
    
    expect(fileExists).toBeTruthy();
  });

  test('should handle screenshots - consistent lowercase naming', async ({ page }) => {
    
    // ✅ FIX 3: Use consistent lowercase for all filenames
    // This avoids case-sensitivity issues on Linux CI
    
    console.log('✅ GOOD PATTERN: Consistent lowercase filenames');
    console.log('');
    console.log('   Problem: Case sensitivity varies by OS');
    console.log('      macOS: Case-insensitive by default');
    console.log('      Windows: Case-insensitive');
    console.log('      Linux: CASE-SENSITIVE! ⚠️');
    console.log('');
    console.log('   Solution: Always normalize to lowercase when creating AND comparing');
    console.log('');
    
    await page.goto(BASE_URL);
    
    // ✅ Normalize filename to lowercase when creating
    const screenshotName = 'test-screenshot.png'.toLowerCase();
    const screenshotPath = path.join('test-results', screenshotName);
    
    console.log(`   Screenshot name (normalized): ${screenshotName}`);
    console.log(`   Full path: ${screenshotPath}`);
    console.log('');
    
    // Ensure directory exists
    const screenshotDir = path.dirname(screenshotPath);
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
    
    await page.screenshot({ path: screenshotPath });
    
    // ✅ When comparing filenames, normalize BOTH to lowercase
    const userInput = 'Test-Screenshot.PNG';  // Simulated user input with wrong case
    const normalizedInput = userInput.toLowerCase();
    const normalizedActual = screenshotName.toLowerCase();
    
    console.log('   When comparing filenames:');
    console.log(`      User input:     "${userInput}"`);
    console.log(`      Normalized:     "${normalizedInput}"`);
    console.log(`      Actual file:    "${normalizedActual}"`);
    console.log(`      Match:          ${normalizedInput === normalizedActual} ✅`);
    console.log('');
    
    // ✅ Compare by normalizing both sides
    expect(normalizedInput).toBe(normalizedActual);
    
    const exists = fs.existsSync(screenshotPath);
    console.log(`   File created and found: ${exists} ✅`);
    
    expect(exists).toBeTruthy();
    
    // Cleanup
    fs.unlinkSync(screenshotPath);
  });

  test('should load fixture - file inside repo', async ({ page }) => {
    
    // ✅ FIX 4: Keep all test data inside the repository
    
    console.log('✅ GOOD PATTERN: Keep test fixtures inside the repo');
    console.log('');
    console.log('   ❌ Bad: "../../../shared-test-data/config.json"');
    console.log('      → References file outside repo');
    console.log('      → Won\'t exist in CI environment');
    console.log('');
    console.log('   ✅ Good: path.join(__dirname, "../fixtures/users.json")');
    console.log('      → File committed to repo');
    console.log('      → Exists everywhere the code runs');
    console.log('');
    
    const fixturesDir = path.join(__dirname, '..', 'fixtures');
    const fixturePath = path.join(fixturesDir, 'users.json');
    
    console.log(`   Fixtures directory: ${fixturesDir}`);
    console.log(`   Fixture path: ${fixturePath}`);
    console.log('');
    
    // This file is committed to the repo, so it exists in CI
    const exists = fs.existsSync(fixturePath);
    console.log(`   File exists: ${exists} ✅`);
    console.log('   File is committed to repo, so it exists in CI too!');
    
    expect(exists).toBeTruthy();
  });

  test('should use temp directory - OS-agnostic temp path', async ({ page }) => {
    
    // ✅ FIX 5: Use os.tmpdir() or CI-provided temp directories
    
    console.log('✅ GOOD PATTERN: OS-agnostic temp directories');
    console.log('');
    console.log('   ❌ Bad: "/tmp/test-output.json" (hardcoded Linux path)');
    console.log('      → Windows doesn\'t have /tmp');
    console.log('      → CI may have different temp locations');
    console.log('');
    console.log('   ✅ Good: Use os.tmpdir() or process.env.RUNNER_TEMP');
    console.log('');
    
    console.log('   Environment temp paths:');
    console.log(`      os.tmpdir():          ${os.tmpdir()}`);
    console.log(`      RUNNER_TEMP:          ${process.env.RUNNER_TEMP || 'not set'}`);
    console.log(`      TEMP (Windows):       ${process.env.TEMP || 'not set'}`);
    console.log(`      TMPDIR (Unix):        ${process.env.TMPDIR || 'not set'}`);
    console.log('');
    
    // ❌ Bad: '/tmp/test-output.json' (hardcoded)
    // ✅ Good: Use os.tmpdir() or process.env.RUNNER_TEMP
    
    const tempDir = process.env.RUNNER_TEMP || os.tmpdir();
    const tempFilePath = path.join(tempDir, `test-output-${Date.now()}.json`);
    
    console.log(`   Chosen temp dir: ${tempDir}`);
    console.log(`   Temp file path:  ${tempFilePath}`);
    console.log('');
    
    // ✅ This works on any OS and any CI platform
    fs.writeFileSync(tempFilePath, JSON.stringify({ test: true }));
    
    const exists = fs.existsSync(tempFilePath);
    console.log(`   File created: ${exists} ✅`);
    console.log('   Works on Windows, macOS, Linux, and CI!');
    
    expect(exists).toBeTruthy();
    
    // ✅ Cleanup after test
    fs.unlinkSync(tempFilePath);
  });

  test('should resolve absolute path - from relative', async ({ page }) => {
    
    // ✅ BONUS: Use path.resolve() when you need absolute paths
    
    console.log('✅ GOOD PATTERN: Dynamic absolute paths with path.resolve()');
    console.log('');
    console.log('   ❌ Bad: Hardcoded absolute paths');
    console.log('      "/Users/gaurav/project/fixtures/users.json"');
    console.log('');
    console.log('   ✅ Good: Computed absolute paths');
    console.log("      path.resolve(__dirname, '..', 'fixtures', 'users.json')");
    console.log('');
    
    // path.resolve() creates an absolute path from relative segments
    const absolutePath = path.resolve(__dirname, '..', 'fixtures', 'users.json');
    
    console.log('   path.resolve() constructs full absolute path dynamically:');
    console.log(`      __dirname:     ${__dirname}`);
    console.log(`      Resolved path: ${absolutePath}`);
    console.log('');
    console.log(`   Is absolute: ${path.isAbsolute(absolutePath)}`);
    console.log('');
    
    // This is a full absolute path, but computed dynamically
    // So it works regardless of where the repo is cloned
    const exists = fs.existsSync(absolutePath);
    console.log(`   File exists: ${exists} ✅`);
    console.log('   Works regardless of where repo is cloned!');
    
    expect(path.isAbsolute(absolutePath)).toBeTruthy();
    expect(exists).toBeTruthy();
  });

  test('should use test info for output paths', async ({ page }, testInfo) => {
    
    // ✅ BEST PRACTICE: Use Playwright's testInfo for output paths
    
    console.log('✅ BEST PATTERN: Use Playwright\'s testInfo.outputPath()');
    console.log('');
    console.log('   Playwright\'s testInfo.outputPath() automatically handles:');
    console.log('   ✅ Creating directories');
    console.log('   ✅ Unique paths per test');
    console.log('   ✅ Cross-platform compatibility');
    console.log('   ✅ Proper cleanup');
    console.log('');
    
    await page.goto(BASE_URL);
    
    // Playwright provides outputPath() which automatically handles:
    // - Creating directories
    // - Unique paths per test
    // - Proper cleanup
    const screenshotPath = testInfo.outputPath('screenshot.png');
    
    console.log(`   Test title: ${testInfo.title}`);
    console.log(`   testInfo.outputDir:  ${testInfo.outputDir}`);
    console.log(`   testInfo.outputPath: ${screenshotPath}`);
    console.log('');
    console.log('   This is THE recommended way to handle test artifacts!');
    console.log('   Playwright manages the paths for you.');
    console.log('');
    
    await page.screenshot({ path: screenshotPath });
    
    const exists = fs.existsSync(screenshotPath);
    console.log(`   Screenshot saved: ${exists} ✅`);
    
    expect(exists).toBeTruthy();
    // Note: Playwright handles cleanup of outputPath files automatically
  });

});

/**
 * 📋 QUICK REFERENCE: PATH PATTERNS
 * 
 * ❌ AVOID:
 *   '/Users/name/project/file.json'     → Hardcoded absolute
 *   'folder\\file.json'                  → Windows backslashes
 *   '../../../outside/repo.json'         → Outside repository
 *   '/tmp/output.json'                   → Hardcoded temp path
 *   'MyFile.JSON'                        → Inconsistent case
 * 
 * ✅ USE:
 *   path.join(__dirname, 'folder', 'file.json')
 *   path.resolve(__dirname, '..', 'fixtures')
 *   testInfo.outputPath('screenshot.png')
 *   os.tmpdir()
 *   process.env.RUNNER_TEMP || os.tmpdir()
 * 
 * 📋 CI TEMP DIRECTORY ENVIRONMENT VARIABLES:
 *   GitHub Actions: RUNNER_TEMP
 *   GitLab CI: CI_PROJECT_DIR
 *   CircleCI: CIRCLE_WORKING_DIRECTORY
 *   Azure DevOps: AGENT_TEMPDIRECTORY
 */
