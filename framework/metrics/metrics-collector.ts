/**
 * Metrics Collector (Phase 2: CI Optimization)
 * 
 * Collects test execution metrics and stores them in the metrics database.
 * Integrates with Playwright test fixtures to automatically record test results.
 */

import { MetricsDatabase, TestRun } from './database.service';

export interface MetricsCollectorConfig {
  database: MetricsDatabase;
  buildType?: string;
  enabled?: boolean;
}

export class MetricsCollector {
  private db: MetricsDatabase;
  private buildType: string;
  private enabled: boolean;

  constructor(config: MetricsCollectorConfig) {
    this.db = config.database;
    this.buildType = config.buildType || process.env.BUILD_TYPE || 'development';
    this.enabled = config.enabled !== false;
  }

  /**
   * Record a test execution
   */
  recordTestExecution(
    testName: string,
    passed: boolean,
    duration: number,
    error?: string,
    options?: {
      retries?: number;
      browserType?: string;
    }
  ): void {
    if (!this.enabled) return;

    const run: TestRun = {
      testName,
      status: passed ? 'passed' : 'failed',
      duration,
      buildType: this.buildType,
      timestamp: new Date().toISOString(),
      error,
      retries: options?.retries || 0,
      browserType: options?.browserType || 'chromium',
    };

    this.db.recordTestRun(run);
  }

  /**
   * Record a skipped test
   */
  recordTestSkipped(testName: string, reason?: string, browserType?: string): void {
    if (!this.enabled) return;

    const run: TestRun = {
      testName,
      status: 'skipped',
      duration: 0,
      buildType: this.buildType,
      timestamp: new Date().toISOString(),
      error: reason,
      retries: 0,
      browserType: browserType || 'chromium',
    };

    this.db.recordTestRun(run);
  }

  /**
   * Get metrics for a test
   */
  getTestMetrics(testName: string) {
    return this.db.getTestMetrics(testName);
  }

  /**
   * Get all metrics
   */
  getAllTestMetrics() {
    return this.db.getAllTestMetrics();
  }

  /**
   * Get recent test runs
   */
  getRecentRuns(testName?: string, limit: number = 20) {
    return this.db.getTestRuns(testName, { limit });
  }

  /**
   * Enable/disable collection
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Check if enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}

/**
 * Factory function to create metrics collector
 */
export async function createMetricsCollector(config?: {
  database?: MetricsDatabase;
  buildType?: string;
  enabled?: boolean;
}): Promise<MetricsCollector> {
  const { createMetricsDatabase } = await import('./database.service');

  const database = config?.database || (await createMetricsDatabase());

  return new MetricsCollector({
    database,
    buildType: config?.buildType,
    enabled: config?.enabled,
  });
}
