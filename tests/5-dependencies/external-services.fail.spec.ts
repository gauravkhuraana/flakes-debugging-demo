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
 * ⚠️  FLAKES Categories: E (Environment Variables) + Dependencies
 *   - Secrets not injected in CI
 *   - Missing env vars in CI
 *   - API keys undefined
 * 
 * ⚠️  WHY THESE PASS LOCALLY BUT FAIL IN CI:
 * 
 * Your local machine:
 *   - Stable network connection
 *   - APIs respond quickly
 *   - No rate limiting (low request volume)
 *   - Cached DNS resolution
 *   - .env file loaded with secrets
 *   - Environment variables set in shell
 * 
 * CI environment:
 *   - Variable network latency
 *   - APIs may rate limit CI IP ranges
 *   - Cold DNS lookups
 *   - Shared infrastructure = contention
 *   - Secrets must be explicitly injected
 *   - No .env file, no shell env vars!
 * 
 * 🔍 PROACTIVE IDENTIFICATION - Look for these RED FLAGS:
 *   ❌ Direct calls to third-party APIs in tests
 *   ❌ No mocking/stubbing of external services
 *   ❌ Hardcoded ports that might conflict
 *   ❌ Assertions on external data that can change
 *   ❌ No retry logic for network calls
 *   ❌ process.env.API_KEY without fallback
 *   ❌ Assuming secrets exist without checking
 * 
 * @tags @fail @dependencies @external @network @environment
 */

import { test, expect } from '@playwright/test';
import * as os from 'os';

const BASE_URL = 'https://gauravkhurana.com/test-automation-play/';

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

/**
 * ═══════════════════════════════════════════════════════════════
 * 🔐 ENVIRONMENT VARIABLES & SECRETS - E from FLAKES
 * 
 * These tests demonstrate missing secrets/env vars in CI
 * ═══════════════════════════════════════════════════════════════
 */
test.describe('Environment & Secrets Demo - BAD Patterns @fail', () => {

  /**
   * ❌ BAD PATTERN E1: API key without fallback
   * 
   * Local:  You have .env file with API_KEY set
   * CI:     No .env file, API_KEY is undefined!
   */
  test('E1: API key not injected in CI', async ({ request }) => {
    // ❌ BAD: Assuming API_KEY exists
    const apiKey = process.env.API_KEY;
    
    console.log('❌ BAD: Using API_KEY without checking');
    console.log(`   API_KEY = ${apiKey ?? 'undefined'}`);
    console.log('   Local: Set in .env or shell');
    console.log('   CI: Must be injected via secrets!');
    
    // ❌ BAD: This will fail in CI if API_KEY not in GitHub Secrets
    expect(apiKey).toBeDefined();
    expect(apiKey).not.toBe('');
    
    // Would fail: API call with undefined key
    // await request.get('https://api.example.com/data', {
    //   headers: { 'Authorization': `Bearer ${apiKey}` }
    // });
  });

  /**
   * ❌ BAD PATTERN E2: Database credentials not injected
   * 
   * Local:  DATABASE_URL in .env
   * CI:     Not configured in CI secrets
   */
  test('E2: Database secret missing in CI', async ({ page }) => {
    // ❌ BAD: Assuming database credentials exist
    const dbUrl = process.env.DATABASE_URL;
    const dbPassword = process.env.DB_PASSWORD;
    
    console.log('❌ BAD: Database credentials without fallback');
    console.log(`   DATABASE_URL = ${dbUrl ? '[SET]' : 'undefined'}`);
    console.log(`   DB_PASSWORD = ${dbPassword ? '[SET]' : 'undefined'}`);
    console.log('   Local: In .env file');
    console.log('   CI: Must add to GitHub Secrets!');
    
    // ❌ BAD: Will fail in CI
    expect(dbUrl).toBeDefined();
    
    await page.goto(BASE_URL);
  });

  /**
   * ❌ BAD PATTERN E3: Third-party service token
   * 
   * Local:  STRIPE_KEY, TWILIO_SID etc in environment
   * CI:     Forgot to add to CI secrets
   */
  test('E3: Third-party service token missing', async ({ request }) => {
    // ❌ BAD: Multiple secrets assumed to exist
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const sendgridKey = process.env.SENDGRID_API_KEY;
    
    console.log('❌ BAD: Third-party tokens without fallback');
    console.log(`   STRIPE_SECRET_KEY = ${stripeKey ? '[SET]' : 'undefined'}`);
    console.log(`   TWILIO_ACCOUNT_SID = ${twilioSid ? '[SET]' : 'undefined'}`);
    console.log(`   SENDGRID_API_KEY = ${sendgridKey ? '[SET]' : 'undefined'}`);
    
    // ❌ BAD: Assumes at least one exists
    const hasAnyKey = stripeKey || twilioSid || sendgridKey;
    expect(hasAnyKey).toBeTruthy();
  });

  /**
   * ❌ BAD PATTERN E4: CI-specific env var used locally
   * 
   * Local:  GITHUB_TOKEN doesn't exist
   * CI:     GITHUB_TOKEN is auto-injected
   */
  test('E4: CI-only env var assumed everywhere', async ({ page }) => {
    // ❌ BAD: This only exists in GitHub Actions
    const githubToken = process.env.GITHUB_TOKEN;
    const githubActor = process.env.GITHUB_ACTOR;
    const githubRepository = process.env.GITHUB_REPOSITORY;
    
    console.log('❌ BAD: CI-specific env vars assumed to exist');
    console.log(`   GITHUB_TOKEN = ${githubToken ? '[SET]' : 'undefined'}`);
    console.log(`   GITHUB_ACTOR = ${githubActor ?? 'undefined'}`);
    console.log(`   GITHUB_REPOSITORY = ${githubRepository ?? 'undefined'}`);
    console.log('   Local: These dont exist!');
    console.log('   CI: Auto-injected by GitHub Actions');
    
    await page.goto(BASE_URL);
    
    // ❌ BAD: This logic is inverted - fails LOCALLY, passes in CI
    // Demonstrating both directions of the problem
    expect(githubToken || githubActor).toBeDefined();
  });

  /**
   * ❌ BAD PATTERN E5: Feature flag env var
   * 
   * Local:  ENABLE_FEATURE_X=true in your shell
   * CI:     Not configured, feature disabled, test fails
   */
  test('E5: Feature flag not set in CI', async ({ page }) => {
    // ❌ BAD: Feature flag without default
    const featureEnabled = process.env.ENABLE_NEW_CHECKOUT === 'true';
    
    console.log('❌ BAD: Feature flag without default value');
    console.log(`   ENABLE_NEW_CHECKOUT = ${process.env.ENABLE_NEW_CHECKOUT ?? 'undefined'}`);
    console.log(`   Feature enabled: ${featureEnabled}`);
    console.log('   Local: You set it to "true"');
    console.log('   CI: undefined → false → test fails!');
    
    await page.goto(BASE_URL);
    
    // ❌ BAD: Test assumes feature is enabled
    expect(featureEnabled).toBe(true);
    
    // Would then test feature-specific UI that doesn't exist when disabled
    // await expect(page.getByTestId('new-checkout-button')).toBeVisible();
  });

  /**
   * ❌ BAD PATTERN E6: Test user credentials hardcoded vs env
   * 
   * Local:  Hardcoded works because you know the test account
   * CI:     Test account might be different or rotated
   */
  test('E6: Test credentials not externalized', async ({ page }) => {
    // ❌ BAD: Mix of hardcoded and env vars without fallback
    const testUsername = process.env.TEST_USERNAME; // undefined in CI!
    const testPassword = process.env.TEST_PASSWORD; // undefined in CI!
    
    console.log('❌ BAD: Test credentials from env without fallback');
    console.log(`   TEST_USERNAME = ${testUsername ?? 'undefined'}`);
    console.log(`   TEST_PASSWORD = ${testPassword ? '[SET]' : 'undefined'}`);
    
    await page.goto(BASE_URL);
    await page.getByRole('tab', { name: 'Business' }).click();
    
    // ❌ BAD: Will fail if env vars not set
    expect(testUsername).toBeDefined();
    expect(testPassword).toBeDefined();
    
    // Would fail: trying to login with undefined credentials
    // await page.getByTestId('login-username').fill(testUsername!);
    // await page.getByTestId('login-password').fill(testPassword!);
  });

});

/**
 * ═══════════════════════════════════════════════════════════════
 * SUMMARY: Why these fail
 * ═══════════════════════════════════════════════════════════════
 * 
 * Network Tests:
 *   - Test 1-6: Timeouts, external dependencies, network variability
 * 
 * Environment/Secrets Tests:
 *   - E1: API_KEY not in CI secrets
 *   - E2: DATABASE_URL/DB_PASSWORD missing
 *   - E3: Third-party tokens (Stripe, Twilio) not configured
 *   - E4: CI-only vars (GITHUB_TOKEN) don't exist locally
 *   - E5: Feature flags not set in CI
 *   - E6: Test credentials not externalized
 * 
 * ➡️ See external-services.pass.spec.ts for the FIXED versions!
 * ═══════════════════════════════════════════════════════════════
 */
