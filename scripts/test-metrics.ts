#!/usr/bin/env ts-node
/**
 * Test Metrics Viewer CLI (Phase 2: CI Optimization)
 * 
 * Display detailed test execution metrics and trends.
 * 
 * Usage:
 *   npm run ci:metrics                         # Show all metrics
 *   npm run ci:metrics -- --test "test_name"   # Show metrics for specific test
 *   npm run ci:metrics -- --flaky              # Show only flaky tests
 *   npm run ci:metrics -- --degrading          # Show degrading tests
 *   npm run ci:metrics -- --export csv         # Export as CSV
 */

import { createMetricsDatabase } from '../framework/metrics/database.service';
import * as fs from 'fs';

async function main() {
  const args = process.argv.slice(2);
  const testIndex = args.indexOf('--test');
  const exportIndex = args.indexOf('--export');
  const flakyFlag = args.includes('--flaky');
  const degradingFlag = args.includes('--degrading');

  const testName = testIndex !== -1 ? args[testIndex + 1] : undefined;
  const exportFormat = exportIndex !== -1 ? args[exportIndex + 1] : undefined;

  console.log('\n📊 Test Metrics Dashboard');
  console.log('━'.repeat(100));

  try {
    // Initialize database
    const db = await createMetricsDatabase();

    let metrics = testName ? [db.getTestMetrics(testName)].filter((m) => m !== null) : db.getAllTestMetrics();

    if (metrics.length === 0) {
      console.log('📊 No test metrics found. Run tests first to generate metrics.');
      console.log('   npm test');
      process.exit(0);
    }

    // Apply filters
    if (flakyFlag) {
      metrics = metrics.filter((m) => m.flakiness > 0.3);
      console.log(`\n🔁 Flaky Tests (${metrics.length}):\n`);
    } else if (degradingFlag) {
      metrics = metrics.filter((m) => m.trend === 'degrading');
      console.log(`\n📈 Degrading Tests (${metrics.length}):\n`);
    } else if (testName) {
      console.log(`\n📈 Metrics for: ${testName}\n`);
    } else {
      console.log(`\n📊 All Tests (${metrics.length}):\n`);
    }

    // Display results
    if (exportFormat === 'csv') {
      displayAsCSV(metrics);
    } else {
      displayAsTable(metrics);
    }

    db.close();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

function displayAsTable(metrics: any[]): void {
  // Sort by test name
  const sorted = [...metrics].sort((a, b) => a.testName.localeCompare(b.testName));

  console.log('Test Name'.padEnd(40) + 
    'Pass Rate'.padEnd(12) +
    'Runs'.padEnd(8) +
    'Avg Dur.'.padEnd(10) +
    'Flaky'.padEnd(8) +
    'Trend'.padEnd(12));
  
  console.log('─'.repeat(100));

  sorted.forEach((metric) => {
    const testName = metric.testName.substring(0, 39).padEnd(40);
    const passRate = `${(metric.passRate * 100).toFixed(0)}%`.padEnd(12);
    const runs = String(metric.totalRuns).padEnd(8);
    const avgDur = `${(metric.averageDuration / 1000).toFixed(2)}s`.padEnd(10);
    const flaky = `${(metric.flakiness * 100).toFixed(0)}%`.padEnd(8);
    const trend = getTrendIcon(metric.trend).padEnd(12);

    console.log(testName + passRate + runs + avgDur + flaky + trend);

    // Show failures if any
    if (metric.failedRuns > 0) {
      console.log(
        `  └─ ${metric.failedRuns} failures, ${metric.skippedRuns} skipped, last run: ${formatDate(metric.lastRun)}`
      );
    }
  });

  // Summary statistics
  console.log('\n' + '─'.repeat(100));
  const totalRuns = metrics.reduce((sum, m) => sum + m.totalRuns, 0);
  const totalFailures = metrics.reduce((sum, m) => sum + m.failedRuns, 0);
  const avgPassRate = metrics.reduce((sum, m) => sum + m.passRate, 0) / metrics.length;
  const avgDuration = metrics.reduce((sum, m) => sum + m.averageDuration, 0) / metrics.length;

  console.log(`\nSummary:`);
  console.log(`  Total runs: ${totalRuns}`);
  console.log(`  Total failures: ${totalFailures}`);
  console.log(`  Overall pass rate: ${(avgPassRate * 100).toFixed(1)}%`);
  console.log(`  Average test duration: ${(avgDuration / 1000).toFixed(2)}s`);
  console.log(`  Flaky tests (>30%): ${metrics.filter((m) => m.flakiness > 0.3).length}`);
  console.log(`  Degrading tests: ${metrics.filter((m) => m.trend === 'degrading').length}`);
  console.log(`  Improving tests: ${metrics.filter((m) => m.trend === 'improving').length}`);

  console.log('\n━'.repeat(100));
}

function displayAsCSV(metrics: any[]): void {
  // CSV header
  const headers = [
    'Test Name',
    'Total Runs',
    'Passed',
    'Failed',
    'Skipped',
    'Pass Rate (%)',
    'Avg Duration (ms)',
    'Min Duration (ms)',
    'Max Duration (ms)',
    'Flakiness (%)',
    'Last Run',
    'Trend',
  ];

  console.log(headers.join(','));

  // CSV rows
  metrics.forEach((metric) => {
    const row = [
      `"${metric.testName}"`,
      metric.totalRuns,
      metric.passedRuns,
      metric.failedRuns,
      metric.skippedRuns,
      (metric.passRate * 100).toFixed(1),
      metric.averageDuration.toFixed(0),
      metric.minDuration.toFixed(0),
      metric.maxDuration.toFixed(0),
      (metric.flakiness * 100).toFixed(1),
      `"${metric.lastRun}"`,
      metric.trend,
    ];

    console.log(row.join(','));
  });
}

function getTrendIcon(trend: string): string {
  switch (trend) {
    case 'improving':
      return '📈 Improving';
    case 'degrading':
      return '📉 Degrading';
    default:
      return '➡️ Stable';
  }
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  } catch {
    return dateStr;
  }
}

// Run the script
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
