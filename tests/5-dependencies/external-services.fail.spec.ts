/**
 * DEMO 5: Dependencies - BAD PATTERNS (Likely to fail in CI)
 * 
 * 🎯 PROMOTIONAL PROMISE COVERAGE:
 * "You will learn how... dependencies... impact test behavior"
 * 
 * ⚠️  COVERS PLAYBOOK CATEGORY: External Dependencies (20% of flakiness)
 *   - Third-party APIs with variable responses
 *   - Environment-specific configurations
 *   - Network instability
 *   - Resource contention (ports, files)
 * 
 * ⚠️  WHY THESE PASS LOCALLY BUT FAIL IN CI:
 * 
 * Your local machine:
 *   - Stable network connection
 *   - APIs respond quickly
 *   - No rate limiting (low request volume)
 *   - Cached DNS resolution
 * 
 * CI environment:
 *   - Variable network latency
 *   - APIs may rate limit CI IP ranges
 *   - Cold DNS lookups
 *   - Shared infrastructure = contention
 * 
 * 🔍 PROACTIVE IDENTIFICATION - Look for these RED FLAGS:
 *   ❌ Direct calls to third-party APIs in tests
 *   ❌ No mocking/stubbing of external services
 *   ❌ Hardcoded ports that might conflict
 *   ❌ Assertions on external data that can change
 *   ❌ No retry logic for network calls
 * 
 * @tags @fail @dependencies @external @network
 */

import { test, expect } from '@playwright/test';
import * as os from 'os';

const BASE_URL = 'https://gauravkhurana.in/test-automation-play/';

// Minimal logging
function logEnv() {
  console.log(`\n🌐 ${os.hostname()} | CI: ${process.env.CI || 'local'}\n`);
}

test.describe('Dependencies Demo - Failing Tests @fail', () => {

  test.beforeAll(() => logEnv());

  test('should fetch user data - timeout too short for CI', async ({ request }) => {
    // ❌ PROBLEM 1: 100ms API timeout - too short for CI
    const startTime = Date.now();
    
    const response = await request.get('https://jsonplaceholder.typicode.com/users/1', {
      timeout: 100, // ❌ Too short for CI network latency
    });
    
    const elapsed = Date.now() - startTime;
    console.log(`⏱️ API response: ${elapsed}ms (threshold: 150ms)`);
    
    const user = await response.json();
    expect(elapsed).toBeLessThan(150); // Fails in CI
    expect(user.email).toBe('Sincere@april.biz');
  });

  test('should connect to local service - hardcoded port', async ({ page }) => {
    // ❌ PROBLEM 2: localhost:3000 doesn't exist in CI
    const localServiceUrl = 'http://localhost:3000';
    console.log(`🔗 Connecting to: ${localServiceUrl}`);
    
    try {
      await page.goto(localServiceUrl, { timeout: 5000 });
    } catch (e) {
      throw new Error(`Cannot connect to ${localServiceUrl} - is the service running?`);
    }
  });

  test('should load external resource - short timeout no retry', async ({ page }) => {
    // ❌ PROBLEM 3: 200ms timeout - too short for variable CI network
    await page.goto(BASE_URL);
    
    const startTime = Date.now();
    const response = await page.request.get('https://api.github.com/zen', {
      timeout: 200,
    });
    
    const elapsed = Date.now() - startTime;
    console.log(`⏱️ GitHub API: ${elapsed}ms (threshold: 250ms)`);
    
    expect(response.ok()).toBeTruthy();
    expect(elapsed).toBeLessThan(250);
  });

  /**
   * ❌ PROBLEM 4: Time-sensitive external data
   * Depends on external service returning specific time-based data
   */
  test('should get current date from API - time sensitive', async ({ request }) => {
    // ❌ PROBLEM: Depends on external time API
    // - API might be slow
    // - Time might differ by seconds
    // - Timezone issues
    const response = await request.get('https://worldtimeapi.org/api/ip');
    const data = await response.json();
    
    // ❌ PROBLEM: Comparing with local time
    // CI server might have different timezone or clock skew
    const localDate = new Date().toISOString().split('T')[0];
    expect(data.datetime).toContain(localDate);
  });

  /**
   * ❌ PROBLEM 5: Cached data assumption
   * Assumes data persists between test runs
   */
  test('should query cached data - assumes persistence', async ({ page }) => {
    await page.goto(BASE_URL);
    
    console.log('❌ PROBLEM: Assuming localStorage persists from previous test runs');
    console.log('   Local: Browser cache may persist, data might exist');
    console.log('   CI: Fresh browser every run, no cached data!');
    
    // ❌ PROBLEM: This simulates a common pattern where tests
    // assume previous data exists from earlier runs or setup
    
    // ❌ Local: You might have run tests before, cache exists
    // ❌ CI: Every run starts fresh, no cached data!
    
    const cachedUser = await page.evaluate(() => {
      // Pretend we're checking for cached user data from a previous session
      return localStorage.getItem('cachedUserSession');
    });
    
    // This fails in CI because localStorage is empty on fresh browser
    expect(cachedUser).not.toBeNull();
  });

  /**
   * ❌ PROBLEM 6: Flaky external CDN dependency
   * Downloads asset with aggressive timeout and no retry
   */
  test('should load external CDN asset - aggressive timeout', async ({ page }) => {
    await page.goto(BASE_URL);
    
    console.log('❌ PROBLEM: Loading external CDN with 500ms timeout');
    console.log('   Local: CDN edge server nearby, loads in ~50ms');
    console.log('   CI: Data center location varies, CDN may be slow');
    
    const startTime = Date.now();
    
    // ❌ PROBLEM: External CDN with aggressive timeout
    // - CDN might be slow from CI data center location
    // - No retry logic
    // - Timing assertion compounds the problem
    try {
      const response = await page.request.get(
        'https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js',
        { timeout: 500 } // ❌ Too aggressive for CI
      );
      
      const elapsed = Date.now() - startTime;
      console.log(`   CDN response: ${elapsed}ms`);
      
      expect(response.ok()).toBeTruthy();
      expect(elapsed).toBeLessThan(300); // ❌ Timing assertion
    } catch (e) {
      throw new Error('CDN request failed - timeout too aggressive for CI');
    }
  });

});

/**
 * 📝 EXTERNAL DEPENDENCY ANTIPATTERNS:
 * 
 * 1. DIRECT API CALLS
 *    ❌ fetch('https://api.stripe.com/...')
 *    ❌ axios.get('https://api.twilio.com/...')
 *    
 * 2. LIVE INTEGRATIONS
 *    ❌ Testing with real payment gateway
 *    ❌ Sending real emails/SMS
 *    ❌ Using production OAuth
 *    
 * 3. EXTERNAL DATA ASSERTIONS
 *    ❌ expect(apiResponse.count).toBe(42) // Count changes!
 *    ❌ expect(user.email).toBe('live@data.com') // Data changes!
 *    
 * 4. NETWORK-DEPENDENT TIMING
 *    ❌ setTimeout(5000) and hope API responds
 *    ❌ No retry logic
 */
