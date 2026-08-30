# Phase 2: CI Optimization

## Overview

Phase 2 adds intelligent **test prioritization** and **execution metrics** to your Playwright framework. By analyzing historical test execution data, Phase 2 enables:

1. **Smart Test Prioritization** - Run high-risk, flaky tests first for faster feedback
2. **CI Optimization** - Intelligent parallel execution strategy based on test duration
3. **Performance Tracking** - Historical metrics and trend analysis
4. **Risk-Based Ranking** - Tests ranked by failure rate, flakiness, and execution cost

---

## Architecture

### Components

```
framework/metrics/
├── database.service.ts       # Pure JavaScript SQLite with sql.js
├── metrics-collector.ts      # Collects test execution data
└── ci-prioritizer.ts         # Analyzes metrics and prioritizes tests

scripts/
├── prioritize-tests.ts       # CLI for viewing prioritization
├── test-metrics.ts           # CLI for viewing detailed metrics
└── reset-metrics-db.ts       # CLI for database management
```

### Data Flow

```
Test Execution
    ↓
Playwright Fixture Hook
    ↓
MetricsCollector (Records test result)
    ↓
MetricsDatabase (Stores in sql.js SQLite)
    ↓
CITestPrioritizer (Analyzes & ranks tests)
    ↓
CLI Tools (Display metrics & recommendations)
```

---

## Getting Started

### 1. Database Automatically Initializes

The metrics database is automatically created on first use. No setup required!

```bash
npm test
# Database created at: ./test-metrics.db
```

### 2. View Test Metrics

After running tests, view metrics:

```bash
# View all test metrics
npm run ci:metrics

# View specific test
npm run ci:metrics -- --test "login-user-can-login-and-view-inventory"

# View only flaky tests
npm run ci:metrics -- --flaky

# View degrading tests
npm run ci:metrics -- --degrading

# Export as CSV
npm run ci:metrics -- --export csv > metrics.csv
```

### 3. Get CI Prioritization Recommendations

```bash
# View full prioritization report
npm run ci:prioritize

# Show top 10 priority tests
npm run ci:prioritize -- --top 10

# Get parallel execution plan (4 workers)
npm run ci:prioritize -- --parallel 4

# Export as JSON
npm run ci:prioritize -- --export json > priorities.json
```

### 4. Manage Metrics Database

```bash
# Delete records older than 30 days
npm run ci:reset-db -- --older-than 30

# Reset entire database (requires --confirm flag)
npm run ci:reset-db -- --confirm
```

---

## Key Concepts

### Risk Score (0-1)

Combines failure rate and flakiness:
- Higher failure rate = higher risk
- Higher flakiness = higher risk
- Formula: `failureRate * 0.7 + flakiness * 0.3`

Example:
- Stable test (100% pass rate): risk = 0.0
- Test with 50% failures: risk ≈ 0.35
- Flaky test (fails intermittently): risk increases with flakiness

### Cost Score (0-1)

Normalized execution duration:
- Fast tests: high cost score (run first)
- Slow tests: low cost score (run later)
- Threshold: 30 seconds default

### Priority (0-1)

Weighted calculation for test execution order:

```
Priority = 
  (Risk Score * 0.6) +           // 60% - catch failures early
  (Risk/Cost Ratio * 0.2) +      // 20% - efficiency
  (1 - Duration * 0.2)            // 20% - speed
```

Result: High-risk, fast tests run first → fast feedback

---

## Usage Examples

### Example 1: View All Metrics

```bash
npm run ci:metrics
```

**Output:**
```
📊 Test Metrics Dashboard
════════════════════════════════════════════════════════════════════════════════

All Tests (6):

Test Name                                Pass Rate    Runs     Avg Dur.  Flaky    Trend
────────────────────────────────────────────────────────────────────────────────
login-user-can-login-and-view-inventory  100.0%       12       2.45s     0%       ➡️  Stable
cart-checkout-user-can-add-items         95.0%        20       5.67s     5%       📈  Improving
config-getBuildType-normalizes-input     100.0%       15       0.34s     0%       ➡️  Stable

Summary:
  Total runs: 47
  Total failures: 1
  Overall pass rate: 97.9%
  Average test duration: 3.12s
  Flaky tests (>30%): 0
  Degrading tests: 0
  Improving tests: 1
```

### Example 2: View Prioritization

```bash
npm run ci:prioritize
```

**Output:**
```
📊 Test Prioritization Results

Summary:
  Total tests: 6
  High priority: 2
  Medium priority: 3
  Low priority: 1
  Estimated CI time: 2.1 minutes

🔴 Top 10 Priority Tests:
  1. [████████████████████] cart-checkout-user-can-add-items
     Priority: 85.2% | Risk: 5.0%
     Duration: 5.67s | Pass Rate: 95.0%
     Reason: 5% failures; slow (5.67s avg)

  2. [████████░░░░░░░░░░░░] login-user-can-login-and-view-inventory
     Priority: 42.1% | Risk: 0.0%
     Duration: 2.45s | Pass Rate: 100.0%
     Reason: stable performance (12 runs)
```

### Example 3: Parallel Execution Plan

```bash
npm run ci:prioritize -- --parallel 4
```

**Output:**
```
⚙️ CI Execution Plan (4 parallel workers)

Strategy:
  Execute 2 high-priority tests first, then 3 medium-priority tests, using up to 4 parallel workers

Estimated Duration: 1.8 minutes

🔴 High Priority (2 tests):
  • cart-checkout-user-can-add-items (85% priority, 5.67s)
  • login-user-can-login-and-view-inventory (42% priority, 2.45s)

🟡 Medium Priority (3 tests):
  • config-getBuildType-normalizes-input (38% priority, 0.34s)
  ...
```

### Example 4: Find Flaky Tests

```bash
npm run ci:metrics -- --flaky
```

Shows only tests with >30% flakiness rate, helping identify tests that need investigation or increased retry logic.

---

## Integration with CI/CD

### GitHub Actions Example

```yaml
# .github/workflows/test.yml
name: Tests with CI Optimization

on: [push, pull_request]

jobs:
  prioritize:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm install
      
      # Get prioritization
      - run: npm run ci:prioritize > prioritization.txt
      - uses: actions/upload-artifact@v3
        with:
          name: prioritization
          path: prioritization.txt
      
      # Run tests with CI optimization
      - run: npm test
      
      # Show metrics
      - run: npm run ci:metrics
```

### Using Prioritization in Test Runs

```bash
# Get list of high-priority tests for early execution
npm run ci:prioritize -- --top 5 > high_priority_tests.json

# Or run tests in prioritized order (requires test runner integration)
npm run ci:prioritize -- --export json | \
  jq '.[] | .name' | \
  xargs -I {} npm test -- --testNamePattern="{}"
```

---

## Database Schema

The metrics database uses three tables:

### test_runs
```sql
CREATE TABLE test_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  testName TEXT NOT NULL,
  status TEXT NOT NULL,        -- 'passed', 'failed', 'skipped'
  duration INTEGER NOT NULL,   -- milliseconds
  buildType TEXT NOT NULL,     -- 'development', 'staging', 'production'
  timestamp TEXT NOT NULL,     -- ISO 8601 datetime
  error TEXT,                  -- error message if failed
  retries INTEGER DEFAULT 0,   -- number of retries
  browserType TEXT NOT NULL    -- 'chromium', 'firefox', 'webkit'
);
```

### tests
```sql
CREATE TABLE tests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  testName TEXT UNIQUE NOT NULL,
  description TEXT,
  tags TEXT,
  createdAt TEXT NOT NULL,
  lastUpdated TEXT NOT NULL
);
```

---

## API Reference

### MetricsCollector

```typescript
import { createMetricsCollector } from './framework/metrics/metrics-collector';

const collector = await createMetricsCollector();

// Record a test execution
collector.recordTestExecution(
  'test_name',
  true,                    // passed?
  1234,                    // duration (ms)
  undefined,               // error message
  { retries: 0, browserType: 'chromium' }
);

// Record a skipped test
collector.recordTestSkipped('test_name', 'skipped reason', 'chromium');

// Get metrics
const metrics = collector.getTestMetrics('test_name');
const allMetrics = collector.getAllTestMetrics();
```

### CITestPrioritizer

```typescript
import { createCIPrioritizer } from './framework/metrics/ci-prioritizer';

const prioritizer = await createCIPrioritizer();

// Get prioritized tests
const prioritized = prioritizer.prioritizeAllTests();

// Get CI recommendations
const recommendations = prioritizer.getCIRecommendations();

// Get execution plan
const plan = prioritizer.generateExecutionPlan({
  maxParallelWorkers: 4,
  priorityThreshold: 0.6
});
```

---

## Best Practices

### ✅ Do

- **Run tests regularly** - Metrics are more valuable with historical data
- **Review flaky tests** - Use `npm run ci:metrics -- --flaky` to find problematic tests
- **Archive metrics** - Export and store metrics periodically for trend analysis
- **Use in CI** - Integrate prioritization into your CI pipeline
- **Monitor trends** - Watch for degrading tests and investigate
- **Keep database clean** - Use `--older-than 30` to archive old data

### ❌ Don't

- **Ignore flaky tests** - Address the root cause, don't just increase retries
- **Reset database lightly** - Preserve historical data for better prioritization
- **Rely solely on metrics** - Use metrics as guidance, not law
- **Skip slow tests** - Slow tests can catch important issues; optimize instead of skipping

---

## Troubleshooting

### Issue: "No test metrics found"

**Cause:** Haven't run tests yet  
**Solution:** `npm test` to generate metrics

### Issue: Database file too large

**Cause:** Accumulated old metrics  
**Solution:** `npm run ci:reset-db -- --older-than 30` to clean up

### Issue: Prioritization seems wrong

**Cause:** Insufficient historical data  
**Solution:** Run tests multiple times to build reliable metrics

---

## Performance Notes

- **Database**: Pure JavaScript (sql.js) - no native dependencies
- **Storage**: ~1KB per test run in database file
- **Query time**: < 100ms for typical metrics queries
- **Scalability**: Tested with 1000+ test runs

---

## Future Enhancements (Phase 3+)

- [ ] Integration with CI/CD platforms (GitHub, GitLab, Jenkins)
- [ ] Web dashboard for real-time metrics
- [ ] Trend analysis and predictions
- [ ] Automated flaky test quarantine
- [ ] Cost analysis and optimization recommendations
- [ ] Integration with test coverage metrics
- [ ] Historical comparison and regression detection

---

## References

- [sql.js Documentation](https://github.com/sql-js/sql.js)
- [Playwright Documentation](https://playwright.dev)
- [Phase 1 - AI Test Generation](PHASE_1_AI_TEST_GENERATION.md)
