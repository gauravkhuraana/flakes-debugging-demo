/**
 * DEMO 5: Dependencies - BEST PRACTICES (CI-Resilient Patterns)
 * 
 * 🎯 PROMOTIONAL PROMISE COVERAGE:
 * "You will learn how... dependencies... impact test behavior"
 * 
 * ✅ COVERS PLAYBOOK SOLUTIONS FOR: External Dependencies (20% of flakiness)
 *   - Service virtualization/mocking
 *   - Retry logic with exponential backoff
 *   - Dynamic port allocation
 *   - Stable test data
 * 
 * ✅ THESE PATTERNS WORK RELIABLY IN BOTH LOCAL AND CI:
 * 
 * Why these are CI-resilient:
 *   - Mock external services for predictable responses
 *   - Retry logic handles transient failures
 *   - Dynamic ports avoid conflicts
 *   - No assertions on volatile external data
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

const BASE_URL = 'https://gauravkhurana.in/test-automation-play/';
const isCI = process.env.CI === 'true';

test.describe('Dependencies Demo - Passing Tests @pass', () => {

  /**
   * ✅ FIX 1: Mock external APIs
   * Use route interception to return predictable data
   */
  test('should fetch user data - mocked API', async ({ page }) => {
    // ✅ Mock the external API response
    await page.route('**/api.example.com/users/*', async route => {
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
    
    // ✅ Now we can make requests and get predictable responses
    const response = await page.request.get('https://api.example.com/users/1');
    const user = await response.json();
    
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
