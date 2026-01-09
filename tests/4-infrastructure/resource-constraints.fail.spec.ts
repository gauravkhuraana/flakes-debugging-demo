/**
 * DEMO 4: Infrastructure - BAD PATTERNS (Likely to fail in CI)
 * 
 * 🎯 PROMOTIONAL PROMISE COVERAGE:
 * "You will learn how container setups, environment variables, 
 * dependencies, and resource constraints impact test behavior"
 * 
 * ⚠️  WHY THESE PASS LOCALLY BUT FAIL IN CI:
 * 
 * Your local machine has:
 *   - 8-16+ CPU cores
 *   - 16-32GB RAM
 *   - Fast SSD storage
 *   - No resource limits
 * 
 * CI containers have:
 *   - 2-4 CPU cores (shared!)
 *   - 4-8GB RAM (capped)
 *   - Slower network storage
 *   - Strict resource quotas
 * 
 * 🔍 PROACTIVE IDENTIFICATION - Look for these RED FLAGS:
 *   ❌ High parallel worker counts (workers: 16)
 *   ❌ Short timeouts assuming fast execution
 *   ❌ Memory-intensive operations without cleanup
 *   ❌ No consideration for CI resource limits
 *   ❌ Assuming consistent timing across environments
 * 
 * @tags @fail @infrastructure @resources @containers
 */

import { test, expect } from '@playwright/test';
import * as os from 'os';

const BASE_URL = 'https://gauravkhurana.in/test-automation-play/';

// 🔍 DEMO LOGGING: Show resource differences between local and CI
function logResourceInfo(testName: string) {
  console.log('\n' + '═'.repeat(70));
  console.log(`❌ RESOURCE-INTENSIVE TEST: ${testName}`);
  console.log('═'.repeat(70));
  console.log(`💻 OS Platform:       ${process.platform}`);
  console.log(`🔧 CI Environment:    ${process.env.CI || 'false (local)'}`);
  console.log(`🔧 GitHub Actions:    ${process.env.GITHUB_ACTIONS || 'false'}`);
  console.log('');
  console.log('⚡ RESOURCE COMPARISON:');
  console.log(`   CPU Cores:         ${os.cpus().length} cores`);
  console.log(`   CPU Model:         ${os.cpus()[0]?.model || 'unknown'}`);
  console.log(`   Total Memory:      ${Math.round(os.totalmem() / 1024 / 1024 / 1024)} GB`);
  console.log(`   Free Memory:       ${Math.round(os.freemem() / 1024 / 1024 / 1024)} GB`);
  console.log(`   Memory Used:       ${Math.round((os.totalmem() - os.freemem()) / 1024 / 1024 / 1024)} GB`);
  console.log(`   Load Average:      ${os.loadavg().map(n => n.toFixed(2)).join(', ')}`);
  console.log('');
  console.log('📊 CI vs Local (typical):');
  console.log('   Local:   8-16 cores, 16-32GB RAM, no limits');
  console.log('   CI:      2-4 cores, 4-8GB RAM, strict quotas');
  console.log('═'.repeat(70) + '\n');
}

/**
 * ❌ PROBLEM: Aggressive parallelization
 * 
 * This test.describe.configure sets fullyParallel which combined with
 * high worker count in config will overwhelm CI resources
 */
test.describe.configure({ mode: 'parallel' });

test.describe('Infrastructure Demo - Failing Tests @fail', () => {

  /**
   * ❌ PROBLEM 1: Short timeout assumes fast CI
   * Local: Completes in 500ms
   * CI: May take 2-3 seconds due to resource contention
   */
  test('should load page - timeout too short for CI', async ({ page }) => {
    logResourceInfo('Timeout Too Short Test');
    
    console.log('❌ PROBLEM: Very short timeout - works locally, fails in slow CI');
    console.log('   Code: page.setDefaultTimeout(1000);');
    console.log('   Code: await expect(element).toBeVisible({ timeout: 500 });');
    console.log('');
    console.log('   Local: Page loads in ~300ms');
    console.log('   CI: Page may take 2-5 seconds due to:');
    console.log('       - Shared CPU (resource contention)');
    console.log('       - Cold browser start');
    console.log('       - Network variability');
    console.log('');
    
    // ❌ Very short timeout - works locally, fails in slow CI
    page.setDefaultTimeout(1000);
    
    await page.goto(BASE_URL);
    
    // ❌ Short timeout for element that may load slowly in CI
    const basicTab = page.getByRole('tab', { name: 'Basic' });
    await expect(basicTab).toBeVisible({ timeout: 500 });
  });

  /**
   * ❌ PROBLEM 2: Resource-intensive parallel operations
   * These tests spawn multiple browser contexts simultaneously
   */
  test('should handle multiple contexts - no resource consideration', async ({ browser }) => {
    logResourceInfo('Multiple Contexts Test');
    
    console.log('❌ PROBLEM: Opening 5 contexts simultaneously');
    console.log(`   On this machine (${os.cpus().length} cores), this MIGHT work`);
    console.log('   On CI (2 cores), this = disaster');
    console.log('');
    console.log('   Each context uses ~100-200MB RAM + CPU');
    console.log('   5 contexts = 500MB-1GB RAM spike!');
    console.log('');
    
    // ❌ Opening 5 contexts simultaneously on a 2-core CI machine = disaster
    const contexts = await Promise.all([
      browser.newContext(),
      browser.newContext(),
      browser.newContext(),
      browser.newContext(),
      browser.newContext(),
    ]);
    
    console.log(`   Created ${contexts.length} contexts`);
    console.log(`   Current free memory: ${Math.round(os.freemem() / 1024 / 1024)} MB`);
    console.log('');

    // ❌ All contexts navigate simultaneously - memory spike!
    await Promise.all(
      contexts.map(ctx => ctx.newPage().then(p => p.goto(BASE_URL)))
    );
    
    console.log('❌ PROBLEM: No cleanup - contexts leak memory!');
    console.log('   Forgot to close contexts!');
    console.log('');

    // ❌ No cleanup - contexts leak memory
    // Forgot to close contexts!
  });

  /**
   * ❌ PROBLEM 3: Timing-sensitive assertion without CI consideration
   * Measures performance assuming consistent CPU
   */
  test('should complete within time limit - assumes fast CPU', async ({ page }) => {
    logResourceInfo('Assumes Fast CPU Test');
    
    console.log('❌ PROBLEM: Performance assertion assumes consistent CPU speed');
    console.log('   Code: expect(elapsed).toBeLessThan(1000);');
    console.log('');
    
    const startTime = Date.now();
    
    await page.goto(BASE_URL);
    await page.getByRole('tab', { name: 'Basic' }).click();
    
    const elapsed = Date.now() - startTime;
    
    console.log(`   Actual elapsed time: ${elapsed}ms`);
    console.log(`   Expected: < 1000ms`);
    console.log('');
    console.log('   Local:   ~300ms (fast CPU, no contention)');
    console.log('   CI:      2000-5000ms (shared CPU, cold start)');
    console.log('');
    
    // ❌ PROBLEM: Assumes operation completes in <1 second
    // Local: 300ms typical
    // CI: 2000-5000ms due to resource constraints
    expect(elapsed).toBeLessThan(1000);
  });

  /**
   * ❌ PROBLEM 4: Clock/timezone dependency
   * Test assumes local timezone or consistent clock
   */
  test('should validate timestamp - timezone dependent', async ({ page }) => {
    logResourceInfo('Timezone Dependent Test');
    
    await page.goto(BASE_URL);
    
    // ❌ PROBLEM: Uses local timezone
    // Local: EST/PST - your local timezone
    // CI: UTC typically, or different timezone entirely
    const now = new Date();
    const localHour = now.getHours();
    
    console.log('❌ PROBLEM: Test depends on timezone');
    console.log(`   Current timezone offset: ${now.getTimezoneOffset()} minutes`);
    console.log(`   Current local hour: ${localHour}`);
    console.log(`   UTC hour: ${now.getUTCHours()}`);
    console.log('');
    console.log('   Asserting: 9 <= hour <= 17 (business hours)');
    console.log('');
    console.log('   Local: Your timezone, assertion might pass');
    console.log('   CI: Runs in UTC, different hour entirely!');
    console.log('');
    
    // ❌ This assertion is timezone-dependent!
    // If you wrote this at 2pm local time, CI running in UTC will have different hour
    expect(localHour).toBeGreaterThanOrEqual(9);
    expect(localHour).toBeLessThanOrEqual(17);
  });

  /**
   * ❌ PROBLEM 5: Network timeout too aggressive
   * Assumes fast, stable network connection
   */
  test('should fetch data - network timeout too short', async ({ page, request }) => {
    logResourceInfo('Network Timeout Test');
    
    console.log('❌ PROBLEM: 1 second timeout for API call');
    console.log('   Code: request.get(url, { timeout: 1000 });');
    console.log('');
    console.log('   Local: Fast connection, usually <100ms');
    console.log('   CI: Cold start + DNS resolution = 2-5 seconds');
    console.log('');
    
    // ❌ PROBLEM: 1 second timeout for API call
    // Local: Fast connection, usually <100ms
    // CI: Cold start, DNS resolution, can take 2-5 seconds
    const response = await request.get(BASE_URL, {
      timeout: 1000, // ❌ Too aggressive for CI
    });
    
    expect(response.ok()).toBeTruthy();
  });

  /**
   * ❌ PROBLEM 6: Memory-intensive screenshot comparison
   * Takes full-page screenshots without memory consideration
   */
  test('should capture screenshots - memory intensive', async ({ page }) => {
    await page.goto(BASE_URL);
    
    console.log('❌ PROBLEM: Taking 50 full-page screenshots held in memory');
    console.log('   Local: 16-32GB RAM handles this easily');
    console.log('   CI: 4-8GB RAM shared with browser = OOM risk');
    console.log('');
    
    // ❌ Full page screenshots consume significant memory
    // On memory-constrained CI, this can cause OOM
    const screenshots: Buffer[] = [];
    
    for (let i = 0; i < 50; i++) {
      // ❌ Storing all screenshots in memory - each is 1-5MB
      // 50 screenshots * ~3MB = 150MB+ memory spike!
      screenshots.push(await page.screenshot({ fullPage: true }));
      
      if (i % 10 === 0) {
        console.log(`   Captured ${i + 1}/50 screenshots...`);
      }
    }
    
    // ❌ No cleanup, memory not released until test ends
    expect(screenshots.length).toBe(50);
  });

});

/**
 * 📝 COMMON CI RESOURCE CONSTRAINTS:
 * 
 * GitHub Actions (free tier):
 *   - 2 cores
 *   - 7 GB RAM
 *   - 14 GB SSD
 * 
 * GitLab CI (shared runners):
 *   - 1-2 cores
 *   - 4 GB RAM
 *   - Limited disk
 * 
 * CircleCI (small):
 *   - 2 cores
 *   - 4 GB RAM
 * 
 * Docker containers:
 *   - Often even more constrained
 *   - May have memory limits (--memory flag)
 *   - CPU shares instead of dedicated cores
 */
