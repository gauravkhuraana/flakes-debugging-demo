# Test Case Review ✅

## Summary

All test cases have been reviewed and updated to ensure they will:
- ✅ **Pass locally** (fast machine, stable network, known paths)
- ❌ **Fail in CI** (slower containers, variable network, Linux paths)

---

## Key Insight: Playwright Actionability

**CRITICAL**: Playwright has built-in actionability checks. This means:
- Missing `await` on `click()`, `fill()`, `type()` will **NOT** cause failures
- Playwright auto-waits for elements to be actionable before performing actions

### What Actually Causes CI Failures:

| Pattern | Example | Why It Fails |
|---------|---------|--------------|
| **Short timeouts** | `{ timeout: 30 }` | CI is 3-5x slower |
| **Timing assertions** | `expect(elapsed).toBeLessThan(800)` | CI takes longer |
| **Hardcoded paths** | `C:\Users\gaurav\...` | Doesn't exist on Linux CI |
| **Missing env vars** | `process.env.API_KEY` | Not configured in CI |
| **Platform code** | Backslash paths | Linux uses forward slashes |

---

## Test Case Status: All Fixed ✅

### Demo 1: Simple - Button Click (`button-click.fail.spec.ts`)

| # | Test Name | Pattern Used | Status |
|---|-----------|--------------|--------|
| 1 | timeout too short for CI | `{ timeout: 100 }` on page load | ✅ STRONG |
| 2 | fixed sleep | `{ timeout: 10 }` on element | ✅ FIXED |
| 3 | performance assertion | `expect(elapsed).toBeLessThan(800)` | ✅ STRONG |
| 4 | network-sensitive | 3000ms page + 50ms elements | ✅ FIXED |
| 5 | checkbox | 30ms timeouts throughout | ✅ FIXED |

### Demo 1: Simple - File Paths (`file-paths.fail.spec.ts`)

| # | Test Name | Pattern Used | Status |
|---|-----------|--------------|--------|
| 1 | absolute path | `C:\Users\gaurav\Desktop\...` | ✅ STRONG |
| 2 | relative path | `./test-data.json` from wrong cwd | ✅ STRONG |
| 3 | case sensitivity | `TestData.JSON` vs `testdata.json` | ✅ STRONG |
| 4 | backslashes | `tests\\data\\file.json` | ✅ STRONG |
| 5 | platform temp | `C:\Users\gaurav\AppData\...` | ✅ FIXED |

### Demo 2: Medium - Checkout Flow (`checkout-flow.fail.spec.ts`)

| # | Test Name | Pattern Used | Status |
|---|-----------|--------------|--------|
| 1 | hardcoded localhost | `http://localhost:3000` | ✅ STRONG |
| 2 | env var undefined | `process.env.API_BASE_URL` | ✅ STRONG |
| 3 | short timeouts | 50ms timeouts throughout | ✅ FIXED |
| 4 | timing assertions | `searchDuration < 150ms` | ✅ FIXED |
| 5 | env var no fallback | `CONTACT_EMAIL` + `CONTACT_NAME` | ✅ FIXED |

### Demo 3: Complex - Parallel State (`parallel-state.fail.spec.ts`)

| # | Test Name | Pattern Used | Status |
|---|-----------|--------------|--------|
| 1 | shared file | Workers overwrite same file | ✅ STRONG |
| 2 | global counter | Race condition on shared state | ✅ STRONG |
| 3 | auth state | Parallel login invalidation | ✅ STRONG |
| 4 | database conflicts | Simulated shared DB contention | ✅ STRONG |

### Demo 4: Infrastructure - Resource Constraints (`resource-constraints.fail.spec.ts`)

| # | Test Name | Pattern Used | Status |
|---|-----------|--------------|--------|
| 1 | memory sensitive | 10ms timeouts under load | ✅ STRONG |
| 2 | CPU intensive | 30ms timeout on calculation | ✅ STRONG |
| 3 | parallel browser | 10ms timeouts, multi-tab | ✅ STRONG |
| 4 | disk I/O | 50ms timeout on file ops | ✅ STRONG |
| 5 | network bandwidth | 1000ms for large download | ✅ STRONG |

### Demo 5: Dependencies - External Services (`external-services.fail.spec.ts`)

| # | Test Name | Pattern Used | Status |
|---|-----------|--------------|--------|
| 1 | API timeout | 100ms API timeout + timing | ✅ FIXED |
| 2 | hardcoded port | `localhost:3000` | ✅ STRONG |
| 3 | network timeout | 200ms timeout + timing | ✅ FIXED |
| 4 | time-sensitive | Timezone comparison | ✅ STRONG |
| 5 | database | Missing `DATABASE_URL` | ✅ STRONG |
| 6 | file download | 5000ms for 100MB file | ✅ STRONG |

### Demo 6: Debugging - Debugging Strategies (`debugging-strategies.fail.spec.ts`)

| # | Test Name | Purpose | Status |
|---|-----------|---------|--------|
| All | Various | Educational demonstration | ✅ EDUCATIONAL |

---

## Total: 28 Tests

- **25 tests** will genuinely fail in CI
- **3 tests** are educational/debugging demonstrations

---

## Changes Made

### Pattern Replacements

| Old Pattern (Won't Fail) | New Pattern (Will Fail) |
|--------------------------|-------------------------|
| `page.click()` (missing await) | `{ timeout: 30 }` |
| `fill()` (missing await) | `{ timeout: 50 }` |
| `expect().toBeVisible()` (missing await) | `expect().toBeVisible({ timeout: 30 })` |
| `/tmp/file.json` | `C:\Users\gaurav\AppData\...` |
| 5000ms API timeout | 100ms API timeout |

### Files Updated

1. `tests/1-simple/button-click.fail.spec.ts` - Tests 2, 4, 5
2. `tests/1-simple/file-paths.fail.spec.ts` - Test 5
3. `tests/2-medium/checkout-flow.fail.spec.ts` - Tests 3, 4, 5
4. `tests/5-dependencies/external-services.fail.spec.ts` - Tests 1, 3

---

## Audience Takeaways

After seeing these tests, attendees will learn:

1. **Timeout Management**: CI is 3-5x slower; use sensible defaults
2. **Path Handling**: Always use `path.join()` and `os.tmpdir()`
3. **Environment Variables**: Always provide fallbacks or fail fast
4. **Timing Assertions**: Never assert on elapsed time
5. **State Isolation**: Use unique IDs per worker/test
6. **Network Resilience**: Add retry logic and realistic timeouts
