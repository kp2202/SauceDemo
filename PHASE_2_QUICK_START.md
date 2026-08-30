# Phase 2: CI Optimization - Quick Start Guide

## 🚀 30-Second Setup

Phase 2 metrics automatically initialize when you run tests!

```bash
# 1. Run tests (metrics auto-recorded)
npm test

# 2. View test metrics
npm run ci:metrics

# 3. Get prioritization recommendations
npm run ci:prioritize
```

Done! You now have test metrics and prioritization.

---

## 📊 Quick Commands

```bash
# View all test metrics
npm run ci:metrics

# View specific test metrics
npm run ci:metrics -- --test "test_name"

# Show only flaky tests
npm run ci:metrics -- --flaky

# Get prioritization report
npm run ci:prioritize

# Get parallel execution plan
npm run ci:prioritize -- --parallel 4

# View top 10 priority tests
npm run ci:prioritize -- --top 10

# Export metrics as JSON
npm run ci:metrics -- --export csv

# Export prioritization as JSON
npm run ci:prioritize -- --export json

# Clean up old metrics (older than 30 days)
npm run ci:reset-db -- --older-than 30

# Reset entire database
npm run ci:reset-db -- --confirm
```

---

## 📈 What Gets Measured

For each test execution, Phase 2 records:

- ✅ **Test Name** - Unique test identifier
- ✅ **Status** - Passed, failed, or skipped
- ✅ **Duration** - How long the test took (milliseconds)
- ✅ **Build Type** - development, staging, or production
- ✅ **Browser Type** - chromium, firefox, or webkit
- ✅ **Timestamp** - When the test ran
- ✅ **Error Message** - If test failed, what was the error
- ✅ **Retries** - How many times it was retried

---

## 📊 Metrics Explained

### Pass Rate
Percentage of test runs that passed.
- 100% = rock solid ✅
- 90-99% = reliable
- < 90% = investigate

### Average Duration
How long the test typically takes.
- < 5s = fast ⚡
- 5-15s = normal
- > 15s = slow (consider optimization)

### Flakiness
How often a test fails intermittently (not consistently).
- 0% = stable ✅
- 1-30% = watch it
- > 30% = flaky (needs investigation)

### Trend
Whether test health is improving, stable, or degrading.
- 📈 Improving = getting better
- ➡️ Stable = consistent
- 📉 Degrading = getting worse (investigate!)

---

## 🎯 Test Prioritization

Tests are ranked for CI execution based on:

1. **Risk** (60% weight)
   - Failure rate - how often does it fail?
   - Flakiness - does it fail intermittently?
   
2. **Efficiency** (20% weight)
   - Risk/Cost ratio - important + fast = high priority
   
3. **Speed** (20% weight)
   - Execution time - prefer fast tests for quick feedback

**Result:** High-risk, fast tests run first → find bugs quickly!

---

## 🔴 Example: Understanding Prioritization

### Test 1: "Login Test"
- Pass Rate: 100%
- Duration: 2.5s
- Risk Score: 0%
- **Priority: 42%** (stable but important)
- Reason: "stable performance (12 runs)"

### Test 2: "Checkout Flow"
- Pass Rate: 95%
- Duration: 6.0s
- Risk Score: 5%
- **Priority: 85%** ← Higher! Run first
- Reason: "5% failures; slow (6.0s avg)"

**Why?** Checkout is both riskier and slower, so finding bugs there early is more valuable.

---

## 💾 Database

- **Location**: `./test-metrics.db` (SQLite via sql.js)
- **Size**: ~1KB per test run
- **Storage**: Pure JavaScript (no native dependencies)
- **Persistence**: Auto-saved after each test run

---

## 🔗 Integration with Phase 1

Phase 2 **works alongside Phase 1** (AI Test Generation):

```
Phase 1: Generate Tests
    ↓
Phase 2: Run Tests & Collect Metrics
    ↓
    Analyze Metrics & Prioritize
    ↓
Next CI Run: Run High-Priority Tests First
```

---

## 📋 Example Output

### `npm run ci:metrics`

```
📊 Test Metrics Dashboard
════════════════════════════════════════════════════════════════════════════════

All Tests (3):

Test Name                                Pass Rate    Runs     Avg Dur.  Flaky    Trend
────────────────────────────────────────────────────────────────────────────────
login-user-can-login-and-view-inventory  100.0%       12       2.45s     0%       ➡️  Stable
cart-checkout-user-can-add-items         95.0%        20       5.67s     5%       📈  Improving
config-getBuildType-normalizes-input     100.0%       15       0.34s     0%       ➡️  Stable

Summary:
  Total runs: 47
  Total failures: 1
  Overall pass rate: 97.9%
```

### `npm run ci:prioritize`

```
🔴 Top 10 Priority Tests:
  1. [████████████████████] cart-checkout-user-can-add-items
     Priority: 85.2% | Risk: 5.0%
     Duration: 5.67s | Pass Rate: 95.0%

  2. [████████░░░░░░░░░░░░] login-user-can-login-and-view-inventory
     Priority: 42.1% | Risk: 0.0%
     Duration: 2.45s | Pass Rate: 100.0%

💡 Recommendations:
  ⚠️ 1 high-risk tests should run first to detect failures early
  ⏱️ Estimated CI run time: 2.1 minutes (with parallel execution)
```

---

## 🧪 Try It Now

After running tests:

```bash
# See all metrics
npm run ci:metrics

# See prioritization
npm run ci:prioritize

# See parallel plan
npm run ci:prioritize -- --parallel 4
```

---

## ⚙️ How It Works Behind the Scenes

1. **Test Runs** - `npm test` executes your tests
2. **Metrics Recording** - Results automatically saved to database
3. **Analysis** - Metrics analyzed for patterns
4. **Prioritization** - Tests ranked by risk and cost
5. **Recommendations** - CI suggestions generated

All automatic - no configuration needed!

---

## 🔧 Configuration

Override defaults (optional):

```typescript
// In your code:
const prioritizer = new CITestPrioritizer(db, {
  minRiskThreshold: 0.15,      // 15% failure rate threshold
  maxCostThreshold: 30000      // 30 second threshold
});
```

---

## 📚 Want More Details?

See [PHASE_2_CI_OPTIMIZATION.md](PHASE_2_CI_OPTIMIZATION.md) for:
- Full API reference
- Database schema
- Integration examples
- Troubleshooting guide
- Best practices

---

## ✅ Phase 2 Status

✅ **Ready to use immediately**

- All files compiled successfully
- Database auto-initializes
- CLI tools ready
- Metrics auto-collected
- No configuration needed

Just run your tests and view metrics!

```bash
npm test
npm run ci:metrics
npm run ci:prioritize
```

🎉 **You're now optimizing your CI pipeline!**
