/**
 * CI Test Prioritizer (Phase 2: CI Optimization)
 * 
 * Analyzes test execution metrics to intelligently prioritize tests for CI runs.
 * Ranks tests based on:
 * - Historical failure rate (higher failure = higher priority)
 * - Flakiness score (flakier tests run earlier to detect issues)
 * - Execution cost (duration) - expensive tests run in parallel
 * - Risk/Cost ratio - optimal execution order for fastest feedback
 */

import { MetricsDatabase, TestMetrics } from './database.service';

export interface PrioritizedTest {
  name: string;
  priority: number; // 0-1, higher = run first
  reason: string;
  metrics: TestMetrics;
  riskScore: number; // 0-1
  costScore: number; // 0-1
  riskCostRatio: number;
  suggestedParallelGroup?: number;
}

export class CITestPrioritizer {
  private db: MetricsDatabase;
  private minRiskThreshold: number;
  private maxCostThreshold: number; // milliseconds

  constructor(
    db: MetricsDatabase,
    config?: {
      minRiskThreshold?: number;
      maxCostThreshold?: number;
    }
  ) {
    this.db = db;
    this.minRiskThreshold = config?.minRiskThreshold || 0.1; // 10% failure rate threshold
    this.maxCostThreshold = config?.maxCostThreshold || 30000; // 30 seconds
  }

  /**
   * Prioritize all tests
   */
  prioritizeAllTests(): PrioritizedTest[] {
    const allMetrics = this.db.getAllTestMetrics();
    return this.prioritizeTests(allMetrics);
  }

  /**
   * Prioritize specific tests
   */
  prioritizeTests(metrics: TestMetrics[]): PrioritizedTest[] {
    const normalized = metrics.map((m) => this.calculateScores(m));

    // Sort by priority (descending)
    return normalized.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Calculate risk and cost scores for a test
   */
  private calculateScores(metrics: TestMetrics): PrioritizedTest {
    // Risk Score: combination of failure rate and flakiness
    // Higher failure rate = higher risk
    // Higher flakiness = higher risk (unpredictable)
    const failureRisk = metrics.failedRuns / Math.max(metrics.totalRuns, 1);
    const flakynessRisk = metrics.flakiness;
    const riskScore = Math.min(1, failureRisk * 0.7 + flakynessRisk * 0.3);

    // Cost Score: normalized execution duration
    // Expensive tests get lower cost score (slower = lower priority to run early)
    const normalizedDuration = Math.min(1, metrics.averageDuration / this.maxCostThreshold);
    const costScore = 1 - normalizedDuration; // Invert so fast tests score higher

    // Risk/Cost Ratio: balance between detecting issues and fast feedback
    // High risk, low cost = high priority (detect problems quickly)
    // High risk, high cost = medium priority (important but slow)
    // Low risk, low cost = medium priority (keep in suite but not critical)
    // Low risk, high cost = low priority (optional, too slow)
    const riskCostRatio = riskScore / Math.max(normalizedDuration, 0.1);

    // Priority: weighted combination
    // Primary factor: risk score (need to catch failing tests)
    // Secondary factor: risk/cost ratio (cost efficiency)
    const priority =
      riskScore * 0.6 + // 60% weight on actual risk
      (riskCostRatio / 10) * 0.2 + // 20% weight on efficiency
      (1 - normalizedDuration) * 0.2; // 20% weight on speed

    const reason = this.generateReason(metrics, riskScore, costScore);
    const suggestedParallelGroup = this.calculateParallelGroup(metrics.averageDuration);

    return {
      name: metrics.testName,
      priority: Math.min(1, Math.max(0, priority)),
      reason,
      metrics,
      riskScore: Math.min(1, Math.max(0, riskScore)),
      costScore: Math.min(1, Math.max(0, costScore)),
      riskCostRatio,
      suggestedParallelGroup,
    };
  }

  /**
   * Generate human-readable reason for prioritization
   */
  private generateReason(metrics: TestMetrics, riskScore: number, costScore: number): string {
    const reasons: string[] = [];

    if (metrics.failedRuns > 0) {
      reasons.push(`${metrics.failedRuns} failures (${(metrics.passRate * 100).toFixed(1)}% pass rate)`);
    }

    if (metrics.flakiness > 0.3) {
      reasons.push(`flaky (${(metrics.flakiness * 100).toFixed(1)}% flakiness)`);
    }

    if (metrics.trend === 'degrading') {
      reasons.push('degrading performance');
    } else if (metrics.trend === 'improving') {
      reasons.push('improving performance');
    }

    if (metrics.averageDuration > this.maxCostThreshold * 0.7) {
      reasons.push(`slow (${(metrics.averageDuration / 1000).toFixed(1)}s avg)`);
    }

    if (reasons.length === 0) {
      reasons.push(`stable performance (${metrics.totalRuns} runs)`);
    }

    return reasons.join('; ');
  }

  /**
   * Calculate which parallel group a test should run in
   * Helps optimize CI execution by grouping tests by duration
   */
  private calculateParallelGroup(duration: number): number {
    if (duration < 5000) return 1; // < 5s: group 1 (fast)
    if (duration < 15000) return 2; // 5-15s: group 2 (medium)
    if (duration < 30000) return 3; // 15-30s: group 3 (slow)
    return 4; // > 30s: group 4 (very slow)
  }

  /**
   * Get CI optimization recommendations
   */
  getCIRecommendations(): {
    testOrder: PrioritizedTest[];
    parallelGroups: Map<number, PrioritizedTest[]>;
    estimatedDuration: number;
    recommendations: string[];
  } {
    const testOrder = this.prioritizeAllTests();
    const parallelGroups = new Map<number, PrioritizedTest[]>();

    // Group tests by suggested parallel group
    for (const test of testOrder) {
      const group = test.suggestedParallelGroup || 1;
      if (!parallelGroups.has(group)) {
        parallelGroups.set(group, []);
      }
      parallelGroups.get(group)!.push(test);
    }

    // Calculate estimated duration
    let estimatedDuration = 0;
    for (const [, tests] of parallelGroups) {
      const maxDuration = Math.max(...tests.map((t) => t.metrics.averageDuration));
      estimatedDuration += maxDuration;
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(testOrder, estimatedDuration);

    return {
      testOrder,
      parallelGroups,
      estimatedDuration,
      recommendations,
    };
  }

  /**
   * Generate actionable CI recommendations
   */
  private generateRecommendations(tests: PrioritizedTest[], estimatedDuration: number): string[] {
    const recommendations: string[] = [];

    const highRiskTests = tests.filter((t) => t.riskScore > 0.5);
    if (highRiskTests.length > 0) {
      recommendations.push(
        `⚠️ ${highRiskTests.length} high-risk tests should run first to detect failures early`
      );
    }

    const flakyTests = tests.filter((t) => t.metrics.flakiness > 0.3);
    if (flakyTests.length > 0) {
      recommendations.push(
        `🔁 ${flakyTests.length} flaky tests detected - consider increasing retries or investigating root cause`
      );
    }

    const degradingTests = tests.filter((t) => t.metrics.trend === 'degrading');
    if (degradingTests.length > 0) {
      recommendations.push(
        `📈 ${degradingTests.length} tests show degrading performance - review recent changes`
      );
    }

    const slowTests = tests.filter((t) => t.metrics.averageDuration > 20000);
    if (slowTests.length > 0) {
      recommendations.push(
        `⏱️ ${slowTests.length} slow tests (>20s) - consider parallelizing or optimizing`
      );
    }

    const estimatedMinutes = (estimatedDuration / 1000 / 60).toFixed(1);
    recommendations.push(`⏱️ Estimated CI run time: ${estimatedMinutes} minutes (with parallel execution)`);

    return recommendations;
  }

  /**
   * Generate test execution plan for CI
   */
  generateExecutionPlan(options?: {
    maxParallelWorkers?: number;
    priorityThreshold?: number;
  }): {
    highPriority: PrioritizedTest[];
    mediumPriority: PrioritizedTest[];
    lowPriority: PrioritizedTest[];
    estimatedDuration: number;
    parallelStrategy: string;
  } {
    const threshold = options?.priorityThreshold || 0.6;
    const maxWorkers = options?.maxParallelWorkers || 4;

    const testOrder = this.prioritizeAllTests();

    const highPriority = testOrder.filter((t) => t.priority >= threshold);
    const mediumPriority = testOrder.filter((t) => t.priority >= threshold * 0.5 && t.priority < threshold);
    const lowPriority = testOrder.filter((t) => t.priority < threshold * 0.5);

    // Calculate estimated duration with parallel execution
    const estimatedDuration = this.estimateParallelDuration([...highPriority, ...mediumPriority, ...lowPriority], maxWorkers);

    return {
      highPriority,
      mediumPriority,
      lowPriority,
      estimatedDuration,
      parallelStrategy: `Execute ${highPriority.length} high-priority tests first, then ${mediumPriority.length} medium-priority tests, using up to ${maxWorkers} parallel workers`,
    };
  }

  /**
   * Estimate total duration with parallel execution
   */
  private estimateParallelDuration(tests: PrioritizedTest[], workers: number): number {
    if (tests.length === 0) return 0;

    // Simple greedy scheduling: assign tests to workers to minimize total time
    const workerTimes: number[] = new Array(workers).fill(0);

    for (const test of tests) {
      const minWorkerIdx = workerTimes.indexOf(Math.min(...workerTimes));
      workerTimes[minWorkerIdx] += test.metrics.averageDuration;
    }

    return Math.max(...workerTimes);
  }
}

/**
 * Factory function to create CI prioritizer
 */
export async function createCIPrioritizer(
  database?: { createMetricsDatabase: typeof import('./database.service').createMetricsDatabase }
): Promise<CITestPrioritizer> {
  const { createMetricsDatabase: createDb } = database || (await import('./database.service'));
  const db = await createDb();
  return new CITestPrioritizer(db);
}
