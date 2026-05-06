# 🔍 FLAKES Debugging Demo

> Companion repo for AI Test Fest 2026: **"From Flaky to Bulletproof: Teaching AI to Smell Bad Test Patterns"** & TestGuild 2026: **"When Tests Fail in CI But Pass Locally: A Deep Dive"**

| Failing Tests (Demo) | Fixed Tests |
|---------------------|-------------|
| ![Failing](https://github.com/gauravkhuraana/flakes-debugging-demo/actions/workflows/failing-tests.yml/badge.svg) | ![Passing](https://github.com/gauravkhuraana/flakes-debugging-demo/actions/workflows/passing-tests.yml/badge.svg) |
| [📊 Failing Report](https://gauravkhurana.com/flakes-debugging-demo/failing-report/) | [📊 Passing Report](https://gauravkhurana.com/flakes-debugging-demo/passing-report/) |

---

## 🎯 What's Inside

This repository helps you **proactively identify** code patterns that will cause CI failures — before they waste your time debugging in production pipelines.

### The Problem
Tests pass on your fast local machine but fail in constrained CI environments. This isn't just annoying — it erodes trust in your test suite and slows down your entire team.

### Environment-Sensitive vs Flaky Tests

| Term | Behavior | The Connection |
|------|----------|----------------|
| **Environment-Sensitive** | Always passes locally, always fails in CI | First symptom of underlying issues |
| **Flaky Tests** | Random pass/fail in same environment | Same root causes, worse stage |

> "Tests that pass locally but fail in CI are the **first symptom** of a flaky test. Today they fail consistently in CI, but as CI resources vary, they become truly flaky — sometimes passing, sometimes failing, eroding trust in your pipeline."

### The Approach
Each test scenario has two versions:
- `*.fail.spec.ts` — **Bad patterns** to spot during code review (high risk of CI failure)
- `*.pass.spec.ts` — **Best practices** that work reliably everywhere

### Test Scenarios

| Demo | Complexity | FLAKES Categories | What You'll Learn |
|------|------------|-------------------|-------------------|
| **1-simple** | Beginner | L, A | Latency & Async timing issues |
| **2-medium** | Intermediate | E, K | Environment variables & Config drift |
| **3-complex** | Advanced | S, F | State isolation & Filesystem paths |
| **4-infrastructure** | Advanced | Resources | Container, CPU, memory constraints |
| **5-dependencies** | Advanced | External | API mocking, service virtualization |
| **6-debugging** | Reference | FLIP | FLIP systematic debugging framework |

**Target Site:** [gauravkhurana.com/test-automation-play/](https://gauravkhurana.com/test-automation-play/)

---

## 🔧 FLAKES Framework

A **proactive** approach to writing CI-resilient tests. Use this as a code review checklist!

| Letter | Category | What It Covers | 🔴 Red Flags | 🟢 Best Practices |
|--------|----------|----------------|--------------|-------------------|
| **F** | **Filesystem & File I/O** | Paths, case sensitivity, temp files | `/Users/name/...` hardcoded | `path.join(__dirname, ...)` |
| **L** | **Latency & Load** | Timeouts, resource limits, CPU/memory | `{ timeout: 500 }` too short | CI-aware timeouts (10-30s) |
| **A** | **Async & Awaits** | Missing awaits, race conditions | `expect()` without `await` | `await expect()` always |
| **K** | **Konfiguration & Constants** | URLs, viewport, ports, timezones | `localhost:3000` hardcoded | `baseURL` from config/env |
| **E** | **External & Environment** | Env vars, APIs, CDNs, network | No retry on external calls | Retry + fallbacks |
| **S** | **State & Shared Data** | Shared state, test order, caching | `const EMAIL = 'same@test.com'` | `createTestUser()` unique |

## 🔄 FLIP Debugging Framework

When flaky tests slip through, use **FLIP** to fix them:

| Letter | Step | Action |
|--------|------|--------|
| **F** | **Find** | Reproduce consistently (run 5-10x with `--repeat-each`) |
| **L** | **Localize** | Isolate with binary search (which step fails?) |
| **I** | **Instrument** | Add logs, screenshots, timing evidence |
| **P** | **Pattern** | Compare CI vs local, parallel vs serial |

> 💡 **FLAKES** prevents CI failures. **FLIP** fixes them.

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/gauravkhuraana/flakes-debugging-demo.git
cd flakes-debugging-demo

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

### Running Tests

```bash
# Run all tests (both failing and passing)
npx playwright test

# Run only the "fixed" tests
npx playwright test --grep @pass

# Run only the "failing" tests (expect failures!)
npx playwright test --grep @fail

# Run specific demo
npx playwright test tests/1-simple/
npx playwright test tests/2-medium/
npx playwright test tests/3-complex/

# Run with UI mode (great for debugging)
npx playwright test --ui

# Run with trace viewer
npx playwright test --trace on
```

### Viewing Reports

```bash
# View the default HTML report (after running tests)
npm run report

# Generate and view passing tests report
npm run generate:pass
npm run report:pass

# Generate and view failing tests report
npm run generate:fail
npm run report:fail

# Generate both reports
npm run generate:reports
```

<!-- Uncomment when repo is public:
**Live Reports (GitHub Pages):**
- 📗 [Passing Tests Report](https://gauravkhuraana.github.io/flakes-debugging-demo/passing-report/)
- 📕 [Failing Tests Report](https://gauravkhuraana.github.io/flakes-debugging-demo/failing-report/)
-->

---

## 📁 Project Structure

```
flakes-debugging-demo/
├── README.md                          # You are here
├── package.json                       # Dependencies
├── playwright.config.ts               # Playwright configuration
├── tests/
│   ├── fixtures/
│   │   └── users.json                 # Test data
│   ├── 1-simple/                      # ⏱️ Latency + Async
│   │   ├── button-click.fail.spec.ts  # ❌ Timing issues
│   │   └── button-click.pass.spec.ts  # ✅ Fixed with waits
│   ├── 2-medium/                      # 🔧 Environment + Config
│   │   ├── checkout-flow.fail.spec.ts # ❌ Config/env issues
│   │   └── checkout-flow.pass.spec.ts # ✅ Fixed with config
│   ├── 3-complex/                     # 🔀 State + Filesystem
│   │   ├── parallel-state.fail.spec.ts # ❌ State pollution
│   │   └── parallel-state.pass.spec.ts # ✅ Fixed with isolation
│   ├── 4-infrastructure/              # 🏭 Container + Resources
│   │   ├── resource-constraints.fail.spec.ts # ❌ CI resource issues
│   │   └── resource-constraints.pass.spec.ts # ✅ CI-aware patterns
│   ├── 5-dependencies/                # 🔌 External Services
│   │   ├── external-services.fail.spec.ts # ❌ External API issues
│   │   └── external-services.pass.spec.ts # ✅ Mocked services
│   └── 6-debugging/                   # 🔍 FLIP Methodology
│       └── systematic-debugging.spec.ts # FLIP framework demo
├── .github/workflows/
│   ├── failing-tests.yml              # Demonstrates failures
│   └── passing-tests.yml              # Demonstrates fixes
└── docs/
    ├── FLAKES-checklist.md            # Quick reference + FLIP framework
    └── FLAKES-decision-tree.md        # Debugging flowchart
```

---

## 🎓 Learning Path

### Goal: Spot Problems BEFORE CI Fails

Train yourself to identify risky patterns during code review, not after a pipeline breaks.

### 1. Start with Simple (L + A)

Open `tests/1-simple/button-click.fail.spec.ts` and spot the red flags.

**🔴 Red Flags to Spot:**
- `page.click()` without checking if element is ready
- `expect()` missing `await`
- No explicit waits for dynamic content

**Ask yourself:** *"What if this runs on a machine 5x slower than mine?"*

### 2. Move to Medium (E + K)

Open `tests/2-medium/checkout-flow.fail.spec.ts` to understand environment drift.

**🔴 Red Flags to Spot:**
- Hardcoded `localhost` URLs
- Missing viewport configuration
- `process.env.X` without fallbacks

**Ask yourself:** *"What if this runs on a fresh Linux VM with nothing configured?"*

### 3. Tackle Complex (S + F)

Open `tests/3-complex/parallel-state.fail.spec.ts` for real-world flakiness.

**🔴 Red Flags to Spot:**
- Shared test data (`const EMAIL = 'fixed@test.com'`)
- Tests that depend on other tests running first
- Absolute file paths
- No cleanup after test

**Ask yourself:** *"What if 10 copies of this test run simultaneously?"*

### 4. Master Infrastructure (Container + Resources) 🆕

Open `tests/4-infrastructure/resource-constraints.fail.spec.ts` for CI-specific issues.

**🔴 Red Flags to Spot:**
- High worker counts (16+ workers)
- Short timeouts assuming fast execution
- No resource cleanup
- Memory-intensive operations

**Ask yourself:** *"What if this runs in a 2-core, 4GB container?"*

### 5. Handle Dependencies (External Services) 🆕

Open `tests/5-dependencies/external-services.fail.spec.ts` for external API issues.

**🔴 Red Flags to Spot:**
- Direct calls to third-party APIs
- No mocking/stubbing
- Assertions on live data that can change
- No retry logic

**Ask yourself:** *"What if the external API is slow, rate-limited, or down?"*

### 6. Learn the FLIP Debugging Framework 🆕

Open `tests/6-debugging/systematic-debugging.spec.ts` for the methodology.

> **FLAKES** prevents CI failures. **FLIP** fixes them.

| Letter | Step | Action |
|--------|------|--------|
| **F** | **Find** | Reproduce consistently (run 5-10x with `--repeat-each=5`) |
| **L** | **Localize** | Binary search for the flaky step |
| **I** | **Instrument** | Add timestamps, screenshots, traces |
| **P** | **Pattern** | Identify when/where failures occur |

---

## � FLIP Debugging Framework - Decision Tree

> **F**ind → **L**ocalize → **I**nstrument → **P**attern

When a test is flaky, use this decision tree to find the root cause:

```
                        🔴 Test is FLAKY
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │  F - FIND: REPRODUCE                     │
        │  Run 5-10x: --repeat-each=5              │
        │  Confirm it's actually flaky             │
        └─────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
         10/10 PASS      MIXED RESULTS    10/10 FAIL
              │               │               │
              ▼               ▼               ▼
         NOT FLAKY      ✅ CONFIRMED      JUST BROKEN
        (one-off)         FLAKY!         (fix the bug)
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │  L - LOCALIZE: ISOLATE                   │
        │  Break test into steps, find which fails │
        └─────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │  I - INSTRUMENT: ADD EVIDENCE            │
        │  Add timing logs, screenshots            │
        │  "You can't fix what you can't see!"    │
        └─────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │  P - PATTERN: RECOGNITION                │
        │  Find the "why" - see tree below         │
        └─────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│           Does it PASS with --workers=1?                     │
└─────────────────────────────────────────────────────────────┘
                    │                       │
                   YES                      NO
                    │                       │
                    ▼                       ▼
          🔴 PARALLEL ISSUE          Keep looking...
          • Shared state                    │
          • Race condition                  ▼
          • File conflicts      ┌───────────────────────────┐
                                │ Does it PASS when run     │
          FIX: Isolate state,   │ ALONE (not in suite)?    │
          unique test data      └───────────────────────────┘
                                          │           │
                                         YES          NO
                                          │           │
                                          ▼           ▼
                                  🔴 TEST ORDER    Keep looking...
                                  DEPENDENCY             │
                                  • Needs setup          ▼
                                    from other     ┌─────────────────────┐
                                    test           │ PASSES locally,     │
                                                   │ FAILS in CI?        │
                                  FIX: Make test   └─────────────────────┘
                                  self-contained            │           │
                                                           YES          NO
                                                            │           │
                                                            ▼           ▼
                                                    🔴 ENVIRONMENT   🔴 TIMING
                                                    ISSUE            ISSUE
                                                    • Slower CPU     • Race condition
                                                    • Less RAM       • Missing await
                                                    • Network        • Short timeout
                                                    
                                                    FIX: Increase    FIX: Use proper
                                                    timeouts, use    waits, await all
                                                    waitFor()        async operations
```

### Quick Pattern Detection Commands

```bash
# Check PARALLEL issue
npx playwright test my-test --workers=1
# ✅ Passes? → Tests are interfering with each other

# Check TEST DEPENDENCY issue  
npx playwright test --grep "my-specific-test"
# ✅ Passes alone? → Some other test is affecting this one

# Check CI ENVIRONMENT issue
npx playwright test my-test --workers=2  # CI usually has fewer cores
# Compare timing with CI logs

# Check BROWSER-specific issue
npx playwright test my-test --project=chromium
npx playwright test my-test --project=firefox
npx playwright test my-test --project=webkit
```

---

## 🛠️ Demo Site

All tests run against: **https://gauravkhurana.com/test-automation-play/**

This practice site includes:
- Basic Elements (delayed buttons)
- Business Flows (checkout process)
- Buggy Page (intentional race conditions)

---

## 📚 Resources

- [FLAKES Checklist](docs/FLAKES-checklist.md) — One-page quick reference
- [FLAKES Decision Tree](docs/FLAKES-decision-tree.md) — Debugging flowchart
- [Playwright Documentation](https://playwright.dev/)
- [AI Test Fest 2026 Session Recording](#) — Coming soon!
- [TestGuild 2026 Session Recording](#) — Coming soon!

---

## 🤝 Contributing

Found a new flakiness pattern? Open a PR!

1. Add a `*.fail.spec.ts` demonstrating the issue
2. Add a `*.pass.spec.ts` with the fix
3. Document which FLAKES category it falls under

---

## 📄 License

MIT License - Feel free to use this for learning and training!

---

## 👨‍💻 Author

**Gaurav Khurana**  
Senior Test Engineer

- Website: [gauravkhurana.com](https://gauravkhurana.com)
- GitHub: [@gauravkhuraana](https://github.com/gauravkhuraana)

---

> 💡 **Remember:** Catch FLAKES during code review, not after CI fails!
