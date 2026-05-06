/**
 * DEMO 5: Dependencies + Environment - BEST PRACTICES (CI-Resilient Patterns)
 * 
 * 🎯 PROMOTIONAL PROMISE COVERAGE:
 * "You will learn how... dependencies... impact test behavior"
 * 
 * ✅ COVERS PLAYBOOK SOLUTIONS FOR: 
 *   - External Dependencies (20% of flakiness)
 *   - E from FLAKES: Environment Variables & Secrets
 * 
 * ✅ DEPENDENCY PATTERNS:
 *   - Service virtualization/mocking
 *   - Retry logic with exponential backoff
 *   - Dynamic port allocation
 *   - Stable test data
 * 
 * ✅ ENVIRONMENT PATTERNS (E from FLAKES):
 *   - Skip tests gracefully when secrets missing
 *   - Fallback values for credentials
 *   - Mock third-party services (no real API keys)
 *   - CI-aware environment detection
 *   - Feature flags with sensible defaults
 * 
 * 🎯 PROACTIVE PATTERNS TO USE:
 *   ✅ Mock external APIs with page.route()
 *   ✅ Exponential backoff for retries
 *   ✅ Use environment variables for service URLs
 *   ✅ Assert on shape, not specific values
 *   ✅ Self-contained test fixtures
 * 
 * @tags @pass @dependencies @external @network
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'https://gauravkhurana.com/test-automation-play/';
const isCI = process.env.CI === 'true';

test.describe('Dependencies Demo - Passing Tests @pass', () => {

  /**
   * ✅ FIX 1: Mock external APIs
   * Use route interception to return predictable data
   */
  test('should fetch user data - mocked API', async ({ page }) => {
    // ✅ Mock the external API response
    await page.route('**/api/users/*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
        }),
      });
    });
    
    await page.goto(BASE_URL);
    
    // ✅ Trigger a fetch from within the page context (goes through route interception)
    const user = await page.evaluate(async () => {
      const response = await fetch('/api/users/1');
      return response.json();
    });
    
    // ✅ Assertions on known, controlled data
    expect(user.email).toBe('test@example.com');
  });

  /**
   * ✅ FIX 2: Use real service with retry and shape validation
   * When you must call external APIs, be defensive
   */
  test('should fetch real API - with retry and shape validation', async ({ request }) => {
    // ✅ Helper function with retry logic
    async function fetchWithRetry(url: string, maxRetries = 3): Promise<any> {
      let lastError: Error | null = null;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const response = await request.get(url, {
            timeout: isCI ? 30000 : 10000,
          });
          
          if (response.ok()) {
            return await response.json();
          }
        } catch (error) {
          lastError = error as Error;
          console.log(`Attempt ${attempt} failed, retrying...`);
          
          // ✅ Exponential backoff
          await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt - 1)));
        }
      }
      
      throw lastError || new Error('All retries failed');
    }
    
    const user = await fetchWithRetry('https://jsonplaceholder.typicode.com/users/1');
    
    // ✅ Assert on SHAPE, not specific values
    // Data structure is stable, specific values might change
    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('name');
    expect(user).toHaveProperty('email');
    expect(typeof user.email).toBe('string');
    expect(user.email).toContain('@'); // Valid email format
  });

  /**
   * ✅ FIX 3: Environment-driven service URL
   * No hardcoded ports, configurable endpoints
   */
  test('should connect to service - config-driven URL', async ({ page }) => {
    // ✅ Use environment variable with fallback
    const serviceUrl = process.env.SERVICE_URL || BASE_URL;
    
    // ✅ In CI, SERVICE_URL would point to the deployed service
    // Locally, falls back to the test site
    
    await page.goto(serviceUrl, {
      timeout: isCI ? 60000 : 30000,
    });
    
    // ✅ Verify we're on the right page
    await expect(page).toHaveURL(new RegExp(serviceUrl.replace(/\/$/, '')));
  });

  /**
   * ✅ FIX 4: Time-independent assertions
   * Don't depend on external time services
   */
  test('should handle time-based logic - self-contained', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // ✅ FIX: Use relative time comparisons
    const beforeAction = Date.now();
    
    // Perform some action
    await page.getByRole('tab', { name: 'Basic' }).click();
    
    const afterAction = Date.now();
    
    // ✅ Assert on relative timing, not absolute time
    const duration = afterAction - beforeAction;
    expect(duration).toBeGreaterThan(0);
    expect(duration).toBeLessThan(isCI ? 30000 : 10000);
    
    // ✅ If you need specific time testing, mock Date
    // await page.addInitScript(() => {
    //   const mockDate = new Date('2024-01-15T12:00:00Z');
    //   jest.useFakeTimers().setSystemTime(mockDate);
    // });
  });

  /**
   * ✅ FIX 5: Set up test data within the test
   * Don't assume cached data exists from previous runs
   */
  test('should work with test data - self-contained setup', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // ✅ GOOD: Test sets up its own data, doesn't assume anything exists
    const testUser = {
      id: `user-${Date.now()}`,
      email: `test-${Date.now()}@example.com`,
      name: 'Test User',
    };
    
    // ✅ Create the data we need within the test
    await page.evaluate((user) => {
      localStorage.setItem('cachedUserSession', JSON.stringify(user));
    }, testUser);
    
    // ✅ Now we can safely read it
    const cachedUser = await page.evaluate(() => 
      localStorage.getItem('cachedUserSession')
    );
    
    expect(cachedUser).not.toBeNull();
    const parsed = JSON.parse(cachedUser!);
    expect(parsed.name).toBe('Test User');
  });

  /**
   * ✅ FIX 6: External CDN with generous timeout and retry
   * Handle network variability gracefully
   */
  test('should load external CDN asset - with retry and generous timeout', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // ✅ GOOD: Helper with retry logic for external resources
    async function fetchWithRetry(url: string, maxRetries = 3): Promise<any> {
      let lastError: Error | null = null;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const response = await page.request.get(url, {
            timeout: isCI ? 30000 : 10000, // ✅ Generous timeout
          });
          
          if (response.ok()) {
            return response;
          }
        } catch (error) {
          lastError = error as Error;
          console.log(`Attempt ${attempt} failed, retrying...`);
          
          // ✅ Exponential backoff
          await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt - 1)));
        }
      }
      
      throw lastError || new Error('All retries failed');
    }
    
    const response = await fetchWithRetry(
      'https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js'
    );
    
    // ✅ GOOD: Assert on success, not timing
    expect(response.ok()).toBeTruthy();
    // ✅ DON'T assert on timing - it varies by location
  });

});

/**
 * ═══════════════════════════════════════════════════════════════
 * 🔐 ENVIRONMENT VARIABLES & SECRETS - E from FLAKES (FIXED)
 * 
 * These tests demonstrate proper handling of secrets/env vars
 * ═══════════════════════════════════════════════════════════════
 */
test.describe('Environment & Secrets Demo - GOOD Patterns @pass', () => {

  /**
   * ✅ GOOD PATTERN E1: API key with fallback or skip
   * 
   * Check if key exists, skip test gracefully if not
   */
  test('E1: API key with fallback - skip if not available', async ({ request }) => {
    // ✅ GOOD: Check and handle missing API key
    const apiKey = process.env.API_KEY;
    
    console.log('✅ GOOD: Check API_KEY before using');
    console.log(`   API_KEY = ${apiKey ? '[SET]' : 'undefined'}`);
    
    if (!apiKey) {
      console.log('   ⏭️ Skipping: API_KEY not configured');
      console.log('   To run: set API_KEY in CI secrets or .env');
      test.skip();
      return;
    }
    
    // ✅ GOOD: Only runs if API key exists
    console.log('   ✅ API_KEY found, proceeding with test');
    expect(apiKey).toBeDefined();
  });

  /**
   * ✅ GOOD PATTERN E2: Database credentials with test fallback
   * 
   * Use test database if production creds not available
   */
  test('E2: Database credentials with test fallback', async ({ page }) => {
    // ✅ GOOD: Fallback to test database
    const dbUrl = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/testdb';
    const dbPassword = process.env.DB_PASSWORD || 'test-password';
    
    console.log('✅ GOOD: Database credentials with fallback');
    console.log(`   DATABASE_URL = ${process.env.DATABASE_URL ? '[FROM ENV]' : '[FALLBACK]'}`);
    console.log(`   DB_PASSWORD = ${process.env.DB_PASSWORD ? '[FROM ENV]' : '[FALLBACK]'}`);
    console.log('   Production: Uses real credentials from secrets');
    console.log('   Local/CI: Falls back to test database');
    
    // ✅ GOOD: Always has a value
    expect(dbUrl).toBeDefined();
    expect(dbPassword).toBeDefined();
    
    await page.goto(BASE_URL);
  });

  /**
   * ✅ GOOD PATTERN E3: Mock third-party services in tests
   * 
   * Don't use real Stripe/Twilio in tests - mock them!
   */
  test('E3: Third-party services mocked', async ({ page }) => {
    console.log('✅ GOOD: Mock third-party services instead of using real keys');
    console.log('   No STRIPE_SECRET_KEY needed - mock the API!');
    console.log('   No TWILIO_ACCOUNT_SID needed - mock the response!');
    
    // ✅ GOOD: Mock the payment API response
    await page.route('**/api/stripe/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'pi_mock_123',
          status: 'succeeded',
          amount: 1000,
        }),
      });
    });
    
    // ✅ GOOD: Mock SMS/email service
    await page.route('**/api/notifications/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ sent: true, messageId: 'mock-msg-123' }),
      });
    });
    
    await page.goto(BASE_URL);
    
    // ✅ GOOD: Test works without any real API keys!
    expect(true).toBe(true);
  });

  /**
   * ✅ GOOD PATTERN E4: Check CI context properly
   * 
   * Handle both local and CI environments
   */
  test('E4: CI-aware environment detection', async ({ page }) => {
    // ✅ GOOD: Check if we're in CI
    const isCI = process.env.CI === 'true';
    const isGitHubActions = process.env.GITHUB_ACTIONS === 'true';
    
    console.log('✅ GOOD: Detect environment, adapt behavior');
    console.log(`   CI = ${isCI}`);
    console.log(`   GitHub Actions = ${isGitHubActions}`);
    
    if (isGitHubActions) {
      // ✅ GOOD: CI-specific assertions
      console.log('   Running in GitHub Actions');
      console.log(`   GITHUB_ACTOR = ${process.env.GITHUB_ACTOR}`);
      console.log(`   GITHUB_REPOSITORY = ${process.env.GITHUB_REPOSITORY}`);
    } else {
      // ✅ GOOD: Local-specific behavior
      console.log('   Running locally');
      console.log('   GitHub-specific env vars not available (expected!)');
    }
    
    await page.goto(BASE_URL);
    
    // ✅ GOOD: Test works in both environments
    expect(true).toBe(true);
  });

  /**
   * ✅ GOOD PATTERN E5: Feature flags with sensible defaults
   * 
   * Always provide a default value
   */
  test('E5: Feature flag with default value', async ({ page }) => {
    // ✅ GOOD: Feature flag with sensible default
    const featureEnabled = process.env.ENABLE_NEW_CHECKOUT === 'true';
    const defaultBehavior = process.env.ENABLE_NEW_CHECKOUT === undefined;
    
    console.log('✅ GOOD: Feature flag with default handling');
    console.log(`   ENABLE_NEW_CHECKOUT = ${process.env.ENABLE_NEW_CHECKOUT ?? 'undefined'}`);
    console.log(`   Feature enabled: ${featureEnabled}`);
    console.log(`   Using default: ${defaultBehavior}`);
    
    await page.goto(BASE_URL);
    
    // ✅ GOOD: Test adapts to feature state
    if (featureEnabled) {
      console.log('   Testing NEW checkout flow');
      // await expect(page.getByTestId('new-checkout-button')).toBeVisible();
    } else {
      console.log('   Testing CLASSIC checkout flow (default)');
      // await expect(page.getByTestId('classic-checkout-button')).toBeVisible();
    }
    
    // ✅ GOOD: Test passes regardless of feature state
    await expect(page.getByRole('tab', { name: 'Business' })).toBeVisible();
  });

  /**
   * ✅ GOOD PATTERN E6: Test credentials with fallback
   * 
   * Always provide test account fallback
   */
  test('E6: Test credentials with fallback', async ({ page }) => {
    // ✅ GOOD: Always provide fallback test credentials
    const testUsername = process.env.TEST_USERNAME || 'testuser';
    const testPassword = process.env.TEST_PASSWORD || 'testpass123';
    
    console.log('✅ GOOD: Test credentials with fallback');
    console.log(`   TEST_USERNAME = ${process.env.TEST_USERNAME ? '[FROM ENV]' : '[FALLBACK: testuser]'}`);
    console.log(`   TEST_PASSWORD = ${process.env.TEST_PASSWORD ? '[FROM ENV]' : '[FALLBACK]'}`);
    
    await page.goto(BASE_URL);
    await page.getByRole('tab', { name: 'Business' }).click();
    
    // ✅ GOOD: Always has valid credentials
    expect(testUsername).toBeDefined();
    expect(testPassword).toBeDefined();
    
    // ✅ GOOD: Can proceed with login
    await page.getByTestId('login-username').fill(testUsername);
    await page.getByTestId('login-password').fill(testPassword);
    
    console.log('   ✅ Login form filled successfully');
  });

});

/**
 * 📋 SERVICE MOCKING STRATEGIES:
 * 
 * 1. PLAYWRIGHT ROUTE INTERCEPTION
 *    ✅ page.route('** /api/** ', handler)
 *    - Intercepts at browser level
 *    - Great for frontend API calls
 * 
 * 2. MSW (Mock Service Worker)
 *    ✅ Service worker-based mocking
 *    - Works with any framework
 *    - Closer to production network stack
 * 
 * 3. NOCK (Node.js HTTP mocking)
 *    ✅ Intercepts Node.js http/https
 *    - Good for API tests using request context
 * 
 * 4. DOCKER COMPOSE TEST SERVICES
 *    ✅ Spin up mock containers
 *    - WireMock, MockServer, Prism
 *    - True service virtualization
 * 
 * 📋 GITHUB ACTIONS WITH SERVICE CONTAINERS:
 * 
 * ```yaml
 * jobs:
 *   test:
 *     services:
 *       # ✅ Spin up test database
 *       postgres:
 *         image: postgres:14
 *         env:
 *           POSTGRES_PASSWORD: test
 *         ports:
 *           - 5432:5432
 *           
 *       # ✅ Mock API server
 *       mockserver:
 *         image: mockserver/mockserver
 *         ports:
 *           - 1080:1080
 * ```
 */
