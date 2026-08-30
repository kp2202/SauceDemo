/**
 * Metrics Database Service (Phase 2: CI Optimization)
 * 
 * Pure JavaScript SQLite database for storing and querying test execution metrics.
 * Uses sql.js for database operations (no native dependencies).
 * 
 * Schema:
 * - tests: test names, descriptions, tags
 * - test_runs: individual test execution records
 * - test_metrics: aggregated metrics per test (duration, failure rate, etc.)
 */

import * as fs from 'fs';
import * as path from 'path';
import initSqlJs, { Database } from 'sql.js';

export interface TestRun {
  id?: number;
  testName: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number; // milliseconds
  buildType: string;
  timestamp: string;
  error?: string;
  retries: number;
  browserType: string; // chromium, firefox, webkit
}

export interface TestMetrics {
  testName: string;
  totalRuns: number;
  passedRuns: number;
  failedRuns: number;
  skippedRuns: number;
  passRate: number; // 0-1
  averageDuration: number; // milliseconds
  minDuration: number;
  maxDuration: number;
  flakiness: number; // 0-1 (higher = flakier)
  lastRun: string;
  trend: 'improving' | 'stable' | 'degrading';
}

export class MetricsDatabase {
  private db: Database | null = null;
  private initialized: boolean = false;
  private dbPath: string;

  constructor(dbPath: string = 'test-metrics.db') {
    this.dbPath = path.resolve(process.cwd(), dbPath);
  }

  /**
   * Initialize the database connection
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    const SQL = await initSqlJs();

    // Load existing database or create new one
    let data: Uint8Array | undefined;
    if (fs.existsSync(this.dbPath)) {
      data = fs.readFileSync(this.dbPath);
    }

    this.db = new SQL.Database(data);
    this.createTables();
    this.initialized = true;
  }

  /**
   * Create database schema if not exists
   */
  private createTables(): void {
    if (!this.db) return;

    this.db.run(`
      CREATE TABLE IF NOT EXISTS test_runs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        testName TEXT NOT NULL,
        status TEXT NOT NULL,
        duration INTEGER NOT NULL,
        buildType TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        error TEXT,
        retries INTEGER DEFAULT 0,
        browserType TEXT NOT NULL
      );
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS tests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        testName TEXT UNIQUE NOT NULL,
        description TEXT,
        tags TEXT,
        createdAt TEXT NOT NULL,
        lastUpdated TEXT NOT NULL
      );
    `);

    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_test_name ON test_runs(testName);
      CREATE INDEX IF NOT EXISTS idx_timestamp ON test_runs(timestamp);
      CREATE INDEX IF NOT EXISTS idx_status ON test_runs(status);
    `);
  }

  /**
   * Record a test execution
   */
  recordTestRun(run: TestRun): void {
    if (!this.db) throw new Error('Database not initialized');

    this.db.run(
      `INSERT INTO test_runs (testName, status, duration, buildType, timestamp, error, retries, browserType)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        run.testName,
        run.status,
        run.duration,
        run.buildType,
        run.timestamp,
        run.error || null,
        run.retries,
        run.browserType,
      ]
    );

    // Ensure test exists in tests table
    this.db.run(
      `INSERT OR IGNORE INTO tests (testName, createdAt, lastUpdated)
       VALUES (?, ?, ?)`,
      [run.testName, run.timestamp, run.timestamp]
    );

    this.save();
  }

  /**
   * Get metrics for a single test
   */
  getTestMetrics(testName: string): TestMetrics | null {
    if (!this.db) throw new Error('Database not initialized');

    const result = this.db.exec(
      `SELECT
        testName,
        COUNT(*) as totalRuns,
        SUM(CASE WHEN status = 'passed' THEN 1 ELSE 0 END) as passedRuns,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failedRuns,
        SUM(CASE WHEN status = 'skipped' THEN 1 ELSE 0 END) as skippedRuns,
        AVG(CASE WHEN status = 'passed' THEN 1.0 ELSE 0.0 END) as passRate,
        AVG(duration) as averageDuration,
        MIN(duration) as minDuration,
        MAX(duration) as maxDuration,
        MAX(timestamp) as lastRun
      FROM test_runs
      WHERE testName = ?
      GROUP BY testName`,
      [testName]
    );

    if (!result || result.length === 0 || result[0].values.length === 0) {
      return null;
    }

    const row = result[0].values[0];
    const [
      ,
      totalRuns,
      passedRuns,
      failedRuns,
      skippedRuns,
      passRate,
      averageDuration,
      minDuration,
      maxDuration,
      lastRun,
    ] = row;

    // Calculate flakiness (how often does it fail intermittently?)
    const flakiness = failedRuns > 0 ? failedRuns / (totalRuns as number) : 0;

    return {
      testName,
      totalRuns: totalRuns as number,
      passedRuns: passedRuns as number,
      failedRuns: failedRuns as number,
      skippedRuns: skippedRuns as number,
      passRate: passRate as number,
      averageDuration: averageDuration as number,
      minDuration: minDuration as number,
      maxDuration: maxDuration as number,
      flakiness,
      lastRun: lastRun as string,
      trend: this.calculateTrend(testName),
    };
  }

  /**
   * Get all tests with metrics
   */
  getAllTestMetrics(): TestMetrics[] {
    if (!this.db) throw new Error('Database not initialized');

    const result = this.db.exec(
      `SELECT DISTINCT testName FROM test_runs ORDER BY testName`
    );

    if (!result || result.length === 0 || result[0].values.length === 0) {
      return [];
    }

    return result[0].values
      .map((row) => {
        const metrics = this.getTestMetrics(row[0] as string);
        return metrics;
      })
      .filter((m): m is TestMetrics => m !== null);
  }

  /**
   * Calculate trend for a test
   */
  private calculateTrend(testName: string): 'improving' | 'stable' | 'degrading' {
    if (!this.db) return 'stable';

    const result = this.db.exec(
      `SELECT
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failCount
      FROM test_runs
      WHERE testName = ?
      ORDER BY timestamp DESC
      LIMIT 10`,
      [testName]
    );

    if (!result || result.length === 0) return 'stable';

    const recentFailures = result[0].values;
    if (recentFailures.length < 5) return 'stable';

    const recent = recentFailures.slice(0, 5);
    const older = recentFailures.slice(5, 10);

    const recentFailRate = recent.reduce((sum, row) => sum + (row[0] as number), 0) / 5;
    const olderFailRate = older.reduce((sum, row) => sum + (row[0] as number), 0) / 5;

    if (recentFailRate < olderFailRate * 0.8) return 'improving';
    if (recentFailRate > olderFailRate * 1.2) return 'degrading';
    return 'stable';
  }

  /**
   * Get test runs for a time period
   */
  getTestRuns(
    testName?: string,
    options?: {
      startDate?: string;
      endDate?: string;
      status?: 'passed' | 'failed' | 'skipped';
      limit?: number;
    }
  ): TestRun[] {
    if (!this.db) throw new Error('Database not initialized');

    let query = 'SELECT * FROM test_runs WHERE 1=1';
    const params: any[] = [];

    if (testName) {
      query += ' AND testName = ?';
      params.push(testName);
    }

    if (options?.startDate) {
      query += ' AND timestamp >= ?';
      params.push(options.startDate);
    }

    if (options?.endDate) {
      query += ' AND timestamp <= ?';
      params.push(options.endDate);
    }

    if (options?.status) {
      query += ' AND status = ?';
      params.push(options.status);
    }

    query += ' ORDER BY timestamp DESC';

    if (options?.limit) {
      query += ` LIMIT ${options.limit}`;
    }

    const result = this.db.exec(query, params);

    if (!result || result.length === 0 || result[0].values.length === 0) {
      return [];
    }

    const columns = result[0].columns;
    return result[0].values.map((row) => {
      const run: TestRun = {
        id: row[0] as number,
        testName: row[1] as string,
        status: row[2] as 'passed' | 'failed' | 'skipped',
        duration: row[3] as number,
        buildType: row[4] as string,
        timestamp: row[5] as string,
        error: row[6] as string | undefined,
        retries: row[7] as number,
        browserType: row[8] as string,
      };
      return run;
    });
  }

  /**
   * Clear old records (older than specified days)
   */
  clearOldRecords(daysOld: number = 30): void {
    if (!this.db) throw new Error('Database not initialized');

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    this.db.run('DELETE FROM test_runs WHERE timestamp < ?', [cutoffDate.toISOString()]);
    this.save();
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    if (!this.db) throw new Error('Database not initialized');

    this.db.run('DELETE FROM test_runs');
    this.db.run('DELETE FROM tests');
    this.save();
  }

  /**
   * Save database to disk
   */
  private save(): void {
    if (!this.db) throw new Error('Database not initialized');

    const data = this.db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(this.dbPath, buffer);
  }

  /**
   * Get database file path
   */
  getDbPath(): string {
    return this.dbPath;
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.save();
      this.db.close();
      this.db = null;
      this.initialized = false;
    }
  }
}

/**
 * Factory function to create and initialize database from environment
 */
export async function createMetricsDatabase(
  dbPath?: string
): Promise<MetricsDatabase> {
  const database = new MetricsDatabase(dbPath);
  await database.initialize();
  return database;
}
