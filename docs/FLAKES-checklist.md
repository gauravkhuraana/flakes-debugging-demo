# 🔍 FLAKES Debugging Checklist

> Quick reference for debugging tests that fail in CI but pass locally

---

## The FLAKES Framework

When your CI fails but local passes, systematically check each category:

| Letter | Category | What It Covers |
|--------|----------|----------------|
| **F** | Filesystem & File I/O | Paths, case sensitivity, file writes, temp directories |
| **L** | Latency & Load | Timeouts, resource constraints, CPU/memory limits |
| **A** | Async & Awaits | Missing awaits, race conditions, promises |
| **K** | Konfiguration & Constants | Hardcoded URLs, viewport, ports, timezones |
| **E** | External & Environment | Env vars, external APIs, CDNs, network dependencies |
| **S** | State & Shared Data | Shared state, test order, isolation, caching |

---

### F — Filesystem & File I/O

**Covers:** Paths, case sensitivity, file writes, temp directories

**Symptoms:**
- `ENOENT: no such file or directory`
- `Cannot find module '/Users/...'`
- Path-related errors with backslashes vs forward slashes
- File write conflicts in parallel tests

**Quick Checks:**
- [ ] Are any paths hardcoded with absolute paths?
- [ ] Using `path.join()` for cross-platform compatibility?
- [ ] Using `__dirname` or `import.meta.url` for relative paths?
- [ ] Windows vs Unix path separators handled?

**Fixes:**
```javascript
// ❌ Bad
const data = require('/Users/gaurav/project/data.json');

// ✅ Good
const data = require(path.join(__dirname, '../data.json'));
```

---

### L — Latency & Load

**Covers:** Timeouts, resource constraints, CPU/memory limits

**Symptoms:**
- `Timeout waiting for element`
- `Element not found`
- Tests pass when you add `sleep()`
- Flaky tests that pass 7/10 times
- CI slower than local (2 cores vs 8+)

**Quick Checks:**
- [ ] Explicit waits before interactions?
- [ ] Using `toBeVisible()` / `toBeEnabled()` before click?
- [ ] Timeout values sufficient for slow CI?
- [ ] Waiting for animations to complete?

**Fixes:**
```javascript
// ❌ Bad
await page.click('#submit-btn');

// ✅ Good
await expect(page.locator('#submit-btn')).toBeEnabled();
await page.click('#submit-btn');
```

---

### A — Async Operations

**Symptoms:**
- Assertions fail even though UI looks correct
- `expect(received).toBe(expected)` with undefined/null
- Tests pass in debug mode but fail normally

**Quick Checks:**
- [ ] All Playwright actions have `await`?
- [ ] Assertions use `await expect()`?
- [ ] Promises properly chained?
- [ ] No fire-and-forget async calls?

**Fixes:**
```javascript
// ❌ Bad
page.fill('#email', 'test@test.com');
expect(page.locator('#email')).toHaveValue('test@test.com');

// ✅ Good
await page.fill('#email', 'test@test.com');
await expect(page.locator('#email')).toHaveValue('test@test.com');
```

---

### K — Konfiguration & Constants

**Covers:** Hardcoded URLs, viewport, ports, timezones

**Symptoms:**
- Works on localhost, fails on deployed URL
- Element visible locally but "hidden" in CI
- Different behavior on different browsers
- Timezone-dependent assertions fail in CI

**Quick Checks:**
- [ ] Base URL from config/environment, not hardcoded?
- [ ] Viewport explicitly set in config?
- [ ] Browser launch options consistent?
- [ ] Locale/timezone configured?

**Fixes:**
```typescript
// playwright.config.ts
export default defineConfig({
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    viewport: { width: 1280, height: 720 },
    locale: 'en-US',
    timezoneId: 'America/New_York',
  },
});
```

---

### E — External & Environment

**Covers:** Env vars, external APIs, CDNs, network dependencies

**Symptoms:**
- `undefined` or `null` values in CI
- API calls fail with auth errors
- "Secret" values missing
- External API timeouts or rate limits
- CDN/network latency from CI data center

**Quick Checks:**
- [ ] All required env vars listed in CI workflow?
- [ ] Secrets properly configured in GitHub/CI settings?
- [ ] Fallback values for optional vars?
- [ ] `.env` file not committed but documented?

**Fixes:**
```yaml
# GitHub Actions
- name: Run tests
  run: npm test
  env:
    BASE_URL: ${{ secrets.BASE_URL }}
    API_KEY: ${{ secrets.API_KEY }}
```

---

### S — State & Shared Data

**Covers:** Shared state, test order, isolation, caching

**Symptoms:**
- Intermittent failures (pass sometimes, fail sometimes)
- Tests pass individually but fail together
- Different results in parallel vs sequential
- Tests depend on cached data from previous runs

**Quick Checks:**
- [ ] Each test creates its own unique data?
- [ ] Cleanup after each test?
- [ ] Using fresh browser context when needed?
- [ ] No shared mutable state between tests?

**Fixes:**
```javascript
// ❌ Bad
const TEST_USER = 'shared@test.com';

// ✅ Good
const createTestUser = () => ({
  email: `test-${Date.now()}@test.com`,
});
```

---

## Quick Decision Flow

```
CI Failure
    │
    ├─ "file not found" → Check F
    │
    ├─ "element not found / timeout" → Check L + A
    │
    ├─ "undefined / null" → Check E + K
    │
    └─ "intermittent / random" → Check S
```

---

## Emergency Quick Fixes

| Problem | Quick Fix |
|---------|-----------|
| Button not clickable | Add `await expect(btn).toBeEnabled()` |
| Element not found | Increase timeout, add `waitForSelector` |
| Env var undefined | Add fallback: `process.env.X \|\| 'default'` |
| Path not found | Use `path.join(__dirname, ...)` |
| Parallel test fails | Make test data unique with `Date.now()` |

---

## 🔧 The 4-Step Debugging Framework

When FLAKES doesn't immediately solve it, use this systematic approach:

### Step 1: Reproduce Reliably
```bash
# Run the test 100 times to confirm flakiness
npx playwright test --repeat-each=100 failing-test.spec.ts

# Vary conditions
npx playwright test --repeat-each=50 --workers=1   # Sequential
npx playwright test --repeat-each=20 --project=chromium --project=firefox
```

### Step 2: Isolate the Variable
```javascript
// Binary search - run each step alone
test('step 1 - navigation', async ({ page }) => {
  await page.goto(url);  // Fails here?
});

test('step 2 - find element', async ({ page }) => {
  await page.goto(url);
  await expect(page.locator('#btn')).toBeVisible();  // Or here?
});

test('step 3 - click', async ({ page }) => {
  await page.goto(url);
  await expect(page.locator('#btn')).toBeVisible();
  await page.click('#btn');  // Or here?
});
```

### Step 3: Instrument Aggressively
```javascript
const startTime = Date.now();
const log = (msg) => console.log(`[${Date.now() - startTime}ms] ${msg}`);

log('Starting navigation');
await page.goto(url);
log('Navigation complete');

await page.screenshot({ path: 'debug-01.png' });
log('Screenshot captured');

// Enable tracing
await context.tracing.start({ screenshots: true, snapshots: true });
// ... run test ...
await context.tracing.stop({ path: 'trace.zip' });
```

### Step 4: Pattern Recognition

Ask these questions:
- [ ] Does it fail at specific times? (load-related)
- [ ] Does it fail in CI but not locally? (environment)
- [ ] Does it fail in parallel but not solo? (state isolation)
- [ ] Does it fail after certain other tests? (test order dependency)

---

## 🏭 Infrastructure & Container Issues

**Symptoms:**
- Tests pass locally, consistently fail in CI
- Timeout errors even with long waits
- "Out of memory" or resource errors

**Quick Checks:**
- [ ] Worker count appropriate for CI cores?
- [ ] Timeouts increased for CI environment?
- [ ] Resource cleanup after intensive operations?
- [ ] Using `process.env.CI` to detect CI?

**Fixes:**
```typescript
// playwright.config.ts
const isCI = !!process.env.CI;

export default defineConfig({
  workers: isCI ? 2 : undefined,        // Limit workers in CI
  timeout: isCI ? 60000 : 30000,        // Longer timeout in CI
  retries: isCI ? 2 : 0,                // Retry in CI only
});
```

---

## 🔌 External Dependencies

**Symptoms:**
- Intermittent network errors
- API rate limiting
- "Connection refused" errors

**Quick Checks:**
- [ ] External APIs mocked for tests?
- [ ] Retry logic for network calls?
- [ ] Assertions on shape, not specific values?
- [ ] Service containers in CI workflow?

**Fixes:**
```javascript
// Mock external APIs
await page.route('**/api.external.com/**', async route => {
  await route.fulfill({
    status: 200,
    body: JSON.stringify({ success: true }),
  });
});
```

---

## Resources

- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Test Isolation Guide](https://playwright.dev/docs/browser-contexts)

---

> 💡 **Remember:** When in doubt, add logging and check the CI artifacts!
