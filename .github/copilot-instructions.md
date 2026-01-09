# FLAKES Debugging Demo - AI Coding Instructions

## Project Purpose

This is a **TestGuild 2026 companion repo** teaching how to write CI-resilient tests. The goal is **proactive identification** of patterns that cause "works on my machine" failures.

### Two Types of Tests (Always Paired)
| File Pattern | Purpose | Expected Behavior |
|--------------|---------|-------------------|
| `*.fail.spec.ts` | **Anti-patterns to avoid** | Pass locally, FAIL in CI |
| `*.pass.spec.ts` | **Best practices to follow** | Pass EVERYWHERE |

**Target Site:** https://gauravkhurana.in/test-automation-play/

### Key Concept: Environmentally Sensitive → Flaky
Tests that "always fail in CI" today become **truly flaky** as CI resources vary. The FLAKES framework catches both by targeting the root cause patterns.

---

## FLAKES Framework (Code Review Checklist)

Use this when writing or reviewing tests to prevent CI failures:

| Letter | Category | What It Covers | ❌ Red Flag | ✅ Fix |
|--------|----------|----------------|-------------|--------|
| **F** | **Filesystem & File I/O** | Paths, case sensitivity, file writes, temp dirs | `/Users/gaurav/...` hardcoded | `path.join(__dirname, ...)` |
| **L** | **Latency & Load** | Timeouts, resource limits, CPU/memory | `{ timeout: 500 }` on slow ops | CI-aware timeouts (10-30s) |
| **A** | **Async & Awaits** | Missing awaits, race conditions, promises | `expect()` without `await` | Always `await expect()` |
| **K** | **Konfiguration & Constants** | Hardcoded URLs, viewport, ports, timezones | `localhost:3000` hardcoded | Use `baseURL` from config/env |
| **E** | **External & Environment** | Env vars, external APIs, CDNs, network deps | No retry on external calls | Retry + generous timeout |
| **S** | **State & Shared Data** | Shared state, test order, isolation, caching | `let sharedCounter = 0` | Isolated state per test |

---

## Critical Anti-Patterns (from fail.spec.ts files)

### Missing Await = Race Condition
```typescript
// ❌ BAD - Passes on fast local, fails on slow CI
input.fill('testuser');
expect(input).toHaveValue('testuser');

// ✅ GOOD
await input.fill('testuser');
await expect(input).toHaveValue('testuser');
```

### Short Timeouts = CI Failure
```typescript
// ❌ BAD - Local: 8 cores, CI: 2 cores (5-10x slower)
await page.goto(BASE_URL, { timeout: 500 });

// ✅ GOOD - Generous for slow CI
await page.goto(BASE_URL, { timeout: 30000 });
```

### Shared State = Parallel Conflicts
```typescript
// ❌ BAD - Multiple workers corrupt this
let sharedCounter = 0;

// ✅ GOOD - Isolated per test
test('my test', async ({ page }) => {
  let localCounter = 0;
});
```

### Shared Files = Write Conflicts
```typescript
// ❌ BAD - Parallel tests overwrite
fs.writeFileSync(path.join(os.tmpdir(), 'shared.json'), data);

// ✅ GOOD - Unique per test
fs.writeFileSync(testInfo.outputPath('data.json'), data);
```

### Timing Assertions = Always Flaky
```typescript
// ❌ BAD - CI machines vary 2-10x in speed
expect(duration).toBeLessThan(300);

// ✅ GOOD - Assert behavior, not timing
await expect(element).toBeVisible();
```

---

## 4-Step Debugging Playbook (When Flaky Tests Occur)

If a test is flaky despite following FLAKES, use this systematic approach:

### Step 1: Reproduce Reliably
```bash
npx playwright test --repeat-each=100 tests/path/to/test.spec.ts
```

### Step 2: Isolate the Variable
Binary search—run each step alone to find the flaky one.

### Step 3: Instrument Aggressively
```typescript
console.log(`[${Date.now()}] Before click`);
await page.screenshot({ path: testInfo.outputPath('before-click.png') });
```

### Step 4: Pattern Recognition
- Fails at specific times? → Load-related
- Fails in CI only? → Resource/environment
- Fails in parallel only? → State isolation
- Fails after certain tests? → Test order dependency

---

## Test Organization

```
tests/
├── 1-simple/          # L+A (Latency, Async) - Beginner
├── 2-medium/          # E+K (Environment, Config) - Intermediate  
├── 3-complex/         # S+F (State, Filesystem) - Advanced
├── 4-infrastructure/  # CI resource constraints
├── 5-dependencies/    # External service mocking
├── 6-debugging/       # 4-Step methodology demos
└── fixtures/          # test-utils.ts, users.json
```

## Commands

```bash
npm run test:pass     # Run @pass tests (should all succeed)
npm run test:fail     # Run @fail tests (expect failures - demo purposes)
npm run test:ui       # Interactive UI mode for debugging
npm run report        # View HTML report
npm run report:pass   # View passing tests report
npm run report:fail   # View failing tests report
npx playwright test --repeat-each=100  # Flakiness detection
npx playwright test --trace on         # Capture trace for debugging
```

### Allure Reporting
```bash
# Generate and view Allure report (requires allure-commandline)
npx allure generate allure-results --clean -o allure-report
npx allure open allure-report
```

---

## CI/CD Setup

Two GitHub Actions workflows demonstrate the dual-badge pattern:
- `failing-tests.yml` — Runs `@fail` tests → Expected ❌ badge
- `passing-tests.yml` — Runs `@pass` tests → Expected ✅ badge

This proves the anti-patterns genuinely fail in CI while best practices succeed.

---

## Flakiness Root Causes (What Demo Tests Cover)

| Root Cause | % of Cases | Demo Coverage | FLAKES Category |
|------------|------------|---------------|-----------------|
| **Timing Issues** | 40% | `1-simple/` | L (Latency), A (Async) |
| **Test Order/State** | 25% | `3-complex/` | S (State) |
| **External Dependencies** | 20% | `5-dependencies/` | E (Environment) |
| **Infrastructure** | 10% | `4-infrastructure/` | K (Konfiguration) |
| **App Bugs** | 5% | N/A | (Legitimate failures) |

---

## When Creating New Tests

1. **Always create pairs:** `scenario.fail.spec.ts` + `scenario.pass.spec.ts`
2. **Add JSDoc tags:** `@pass`/`@fail` + complexity + FLAKES categories
3. **Document patterns:** Use `// ❌ BAD:` and `// ✅ GOOD:` comments
4. **Log environment:** Show CI vs local differences in `test.beforeAll()`
5. **Never assert timing:** CI speed varies unpredictably
6. **Use `testInfo.outputPath()`:** For any file I/O to avoid conflicts
