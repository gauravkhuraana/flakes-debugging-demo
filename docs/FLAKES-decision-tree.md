# 🌳 FLAKES Decision Tree

> A systematic approach to debugging CI failures

---

## The Main Decision Tree

```
┌─────────────────────────────────────────────────────────────────┐
│                    TEST FAILS IN CI                              │
│                  (but passes locally)                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    STEP 1: Read the Error                        │
│                                                                  │
│  What does the error message say?                                │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
   │ File/Path    │   │ Element/     │   │ Value is     │
   │ not found    │   │ Timeout      │   │ undefined    │
   └──────────────┘   └──────────────┘   └──────────────┘
          │                   │                   │
          ▼                   ▼                   ▼
   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
   │   Check F    │   │  Check L+A   │   │  Check E+K   │
   │  Filesystem  │   │ Latency/Async│   │  Env/Config  │
   └──────────────┘   └──────────────┘   └──────────────┘
          │                   │                   │
          │                   │                   │
          └───────────────────┴───────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Still failing?   │
                    │  Is it random/    │
                    │  intermittent?    │
                    └──────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
             ┌───────────┐       ┌───────────┐
             │    Yes    │       │    No     │
             └───────────┘       └───────────┘
                    │                   │
                    ▼                   ▼
             ┌───────────┐       ┌───────────┐
             │  Check S  │       │  Re-check │
             │   State   │       │  L, A, E  │
             └───────────┘       └───────────┘
```

---

## Detailed Decision Branches

### Branch F: Filesystem & File I/O Issues

```
Error contains "file", "path", "ENOENT", "module not found"?
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        CHECK FOR:                                │
├─────────────────────────────────────────────────────────────────┤
│ 1. Hardcoded absolute paths                                      │
│    /Users/yourname/... or C:\Users\...                          │
│                                                                  │
│ 2. Windows vs Unix separators                                    │
│    \ vs /                                                        │
│                                                                  │
│ 3. Case sensitivity                                              │
│    Windows: MyFile.json = myfile.json                           │
│    Linux: MyFile.json ≠ myfile.json                             │
│                                                                  │
│ 4. Missing files in .gitignore                                   │
│    Local file exists but not committed                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                          FIX:                                    │
├─────────────────────────────────────────────────────────────────┤
│ • Use path.join(__dirname, 'relative/path')                      │
│ • Use import.meta.url for ESM                                    │
│ • Ensure file is committed to repo                               │
│ • Match exact case of filename                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

### Branch L+A: Latency, Load & Async Issues

```
Error contains "timeout", "element not found", "not visible"?
Or CI is significantly slower than local?
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  IS IT A TIMING ISSUE?                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Does it pass if you:                                           │
│  • Add a sleep/delay before the action?                         │
│  • Run in headed/debug mode?                                    │
│  • Run with --workers=1 (sequential)?                           │
│                                                                 │
│  If YES → Timing issue (L)                                      │
│  If NO  → Async issue (A) or Config issue (K)                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               |
              ▼                               ▼
       ┌─────────────┐               ┌─────────────┐
       │ Timing/   │                 │  Async (A)  │
       │ Load (L)  │                 └─────────────┘
       └─────────────┘                       │
              │                              ▼
              ▼                    ┌──────────────────────────┐
┌──────────────────────────┐    │ FIX:                     │
│ FIX:                     │    │ • Add await to actions   │
│ • Add explicit waits     │    │ • Use await expect()     │
│ • Use toBeVisible()      │    │ • Check Promise chains   │
│ • Use toBeEnabled()      │    │ • No fire-and-forget     │
│ • CI-aware timeouts      │    │                          │
│ • Check resource limits  │    └──────────────────────────┘
└──────────────────────────┘
```

---

### Branch E+K: External, Environment & Configuration Issues

```
Error contains "undefined", "null", "cannot read property"?
Or external API calls failing/timing out?
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│               WHERE IS THE UNDEFINED VALUE?                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  • process.env.SOMETHING      → Environment (E)                  │
│  • Config/settings value      → Konfiguration (K)                │
│  • API response data          → Check network/mocking            │
│  • DOM element property       → Check selectors/waits            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
       ┌─────────────┐                 ┌─────────────┐
       │ Env Var (E) │                 │ Config (K)  │
       └─────────────┘                 └─────────────┘
              │                               │
              ▼                               ▼
┌──────────────────────────┐    ┌──────────────────────────┐
│ FIX:                     │    │ FIX:                     │
│ • Add env var to CI      │    │ • Use config file        │
│ • Add fallback values    │    │ • Set explicit viewport  │
│ • Check secret names     │    │ • Define baseURL         │
│ • Retry external APIs    │    │ • Set browser options    │
│ • Mock external services │    │ • Use UTC for timezones  │
└──────────────────────────┘    └──────────────────────────┘
```

---

### Branch S: State & Shared Data Issues

```
Failure is intermittent/random?
(passes sometimes, fails sometimes)
Or tests depend on cached data?
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ISOLATION CHECKLIST                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  □ Do tests share data (same email, same user, same ID)?         │
│  □ Does test A need test B to run first?                         │
│  □ Do tests modify shared database/state?                        │
│  □ Does browser state (cookies/storage) persist?                 │
│  □ Do tests conflict when run in parallel?                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                           FIX:                                   │
├─────────────────────────────────────────────────────────────────┤
│ • Generate unique test data (Date.now(), UUID)                   │
│ • Clean up after each test (afterEach hook)                      │
│ • Use fresh browser context per test                             │
│ • Make tests self-contained (create → use → delete)              │
│ • Avoid test order dependencies                                  │
│ • Use database transactions/rollback                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Quick Reference Matrix

| Error Type | Keywords | Primary Check | Secondary Check |
|------------|----------|---------------|-----------------|
| Path errors | ENOENT, module not found | **F** Filesystem | - |
| Timeouts | timeout, timed out | **L** Latency | **A** Async |
| Not found | element not found, no such element | **L** Latency | **K** Config |
| Undefined | undefined, null, cannot read | **E** Environment | **K** Config |
| Random fails | flaky, intermittent, sometimes | **S** State | **L** Latency |
| Auth errors | 401, 403, unauthorized | **E** Environment | **K** Config |

---

## Debugging Commands Cheat Sheet

```bash
# Run single test in headed mode
npx playwright test tests/my.spec.ts --headed

# Run with debug mode (step through)
npx playwright test tests/my.spec.ts --debug

# Run sequentially (disable parallel)
npx playwright test --workers=1

# Run with trace on
npx playwright test --trace on

# Show last test report
npx playwright show-report

# Run specific test by name
npx playwright test -g "test name here"
```

---

## When All Else Fails

```
┌─────────────────────────────────────────────────────────────────┐
│                    NUCLEAR OPTIONS                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ 1. Enable verbose logging                                        │
│    DEBUG=pw:api npx playwright test                              │
│                                                                  │
│ 2. Record video of CI run                                        │
│    video: 'on' in playwright.config.ts                           │
│                                                                  │
│ 3. Compare CI vs local environment                               │
│    - Node version                                                │
│    - Browser version                                             │
│    - OS                                                          │
│    - Network speed                                               │
│                                                                  │
│ 4. Reproduce CI environment locally                              │
│    docker run -it mcr.microsoft.com/playwright:latest            │
│                                                                  │
│ 5. Add strategic console.log statements                          │
│    console.log('State at this point:', await page.content());    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

> 💡 **Pro Tip:** Most CI flakiness is caused by **S** (State) or **L** (Latency). Start there if you're not sure!
