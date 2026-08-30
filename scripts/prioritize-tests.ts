#!/usr/bin/env ts-node
/**
 * CI Test Prioritizer CLI (Phase 2: CI Optimization)
 * 
 * Analyzes test metrics and provides prioritization recommendations for CI execution.
 * 
 * Usage:
 *   npm run ci:prioritize                      # Show full prioritization report
 *   npm run ci:prioritize -- --top 10          # Show top 10 priority tests
 *   npm run ci:prioritize -- --parallel 4      # Show parallel execution plan
 *   npm run ci:prioritize -- --export json     # Export as JSON
 */

import { createMetricsDatabase } from '../framework/metrics/database.service';
import { CITestPrioritizer } from '../framework/metrics/ci-prioritizer';
import * as fs from 'fs';

async function main() {
  const args = process.argv.slice(2);
  const topIndex = args.indexOf('--top');
  const parallelIndex = args.indexOf('--parallel');
  const exportIndex = args.indexOf('--export');

  const top = topIndex !== -1 ? parseInt(args[topIndex + 1], 10) : undefined;
  const parallel = parallelIndex !== -1 ? parseInt(args[parallelIndex + 1], 10) : undefined;
  const exportFormat = exportIndex !== -1 ? args[exportIndex + 1] : undefined;

  console.log('\n🚀 CI Test Prioritizer');
  console.log('━'.repeat(80));

  try {
    // Initialize database
    const db = await createMetricsDatabase();
    const prioritizer = new CITestPrioritizer(db);

    // Get prioritized tests
    const prioritized = prioritizer.prioritizeAllTests();

    if (prioritized.length === 0) {
      console.log('📊 No test metrics found. Run tests first to generate metrics.');
      console.log('   npm test');
      process.exit(0);
    }

    // Apply filters
    let filtered = [...prioritized];
    if (top) {
      filtered = filtered.slice(0, top);
    }

    // Display results
    if (exportFormat === 'json') {
      console.log('\n📄 JSON Export:');
      console.log(JSON.stringify(filtered, null, 2));
    } else if (parallel) {
      displayParallelPlan(prioritizer, parallel);
    } else {
      displayPrioritizationReport(filtered, prioritizer.getCIRecommendations());
    }

    db.close();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

function displayPrioritizationReport(
  tests: any[],
  recommendations: any
): void {
  console.log('\n📊 Test Prioritization Results\n');

  // Summary
  console.log('Summary:');
  console.log(`  Total tests: ${tests.length}`);
  console.log(`  High priority: ${tests.filter((t) => t.priority >= 0.7).length}`);
  console.log(`  Medium priority: ${tests.filter((t) => t.priority >= 0.4 && t.priority < 0.7).length}`);
  console.log(`  Low priority: ${tests.filter((t) => t.priority < 0.4).length}`);
  console.log(`  Estimated CI time: ${(recommendations.estimatedDuration / 1000 / 60).toFixed(1)} minutes\n`);

  // Top priority tests
  console.log('🔴 Top 10 Priority Tests:');
  tests.slice(0, 10).forEach((test, idx) => {
    const prioBar = '█'.repeat(Math.round(test.priority * 20)).padEnd(20, '░');
    console.log(`  ${String(idx + 1).padStart(2)}. [${prioBar}] ${test.name}`);
    console.log(`      Priority: ${(test.priority * 100).toFixed(1)}% | Risk: ${(test.riskScore * 100).toFixed(1)}%`);
    console.log(`      Duration: ${(test.metrics.averageDuration / 1000).toFixed(2)}s | Pass Rate: ${(test.metrics.passRate * 100).toFixed(1)}%`);
    console.log(`      Reason: ${test.reason}\n`);
  });

  // Recommendations
  if (recommendations.recommendations.length > 0) {
    console.log('\n💡 Recommendations:');
    recommendations.recommendations.forEach((rec: string) => {
      console.log(`  ${rec}`);
    });
  }

  // Parallel execution groups
  console.log('\n⚙️ Parallel Execution Groups:');
  recommendations.parallelGroups.forEach((tests: any[], groupNum: number) => {
    const groupName =
      groupNum === 1 ? 'Fast (< 5s)' :
      groupNum === 2 ? 'Medium (5-15s)' :
      groupNum === 3 ? 'Slow (15-30s)' :
      'Very Slow (> 30s)';
    console.log(`  Group ${groupNum} - ${groupName}: ${tests.length} tests`);
  });

  console.log('\n━'.repeat(80));
}

function displayParallelPlan(prioritizer: CITestPrioritizer, workers: number): void {
  const plan = prioritizer.generateExecutionPlan({ maxParallelWorkers: workers });

  console.log(`\n⚙️ CI Execution Plan (${workers} parallel workers)\n`);

  console.log('Strategy:');
  console.log(`  ${plan.parallelStrategy}`);
  console.log(`\nEstimated Duration: ${(plan.estimatedDuration / 1000 / 60).toFixed(1)} minutes\n`);

  if (plan.highPriority.length > 0) {
    console.log(`🔴 High Priority (${plan.highPriority.length} tests):`);
    plan.highPriority.slice(0, 5).forEach((test) => {
      console.log(
        `  • ${test.name} (${(test.priority * 100).toFixed(0)}% priority, ${(test.metrics.averageDuration / 1000).toFixed(2)}s)`
      );
    });
    if (plan.highPriority.length > 5) {
      console.log(`  ... and ${plan.highPriority.length - 5} more`);
    }
  }

  if (plan.mediumPriority.length > 0) {
    console.log(`\n🟡 Medium Priority (${plan.mediumPriority.length} tests):`);
    plan.mediumPriority.slice(0, 5).forEach((test) => {
      console.log(
        `  • ${test.name} (${(test.priority * 100).toFixed(0)}% priority, ${(test.metrics.averageDuration / 1000).toFixed(2)}s)`
      );
    });
    if (plan.mediumPriority.length > 5) {
      console.log(`  ... and ${plan.mediumPriority.length - 5} more`);
    }
  }

  if (plan.lowPriority.length > 0) {
    console.log(`\n🟢 Low Priority (${plan.lowPriority.length} tests):`);
    plan.lowPriority.slice(0, 5).forEach((test) => {
      console.log(
        `  • ${test.name} (${(test.priority * 100).toFixed(0)}% priority, ${(test.metrics.averageDuration / 1000).toFixed(2)}s)`
      );
    });
    if (plan.lowPriority.length > 5) {
      console.log(`  ... and ${plan.lowPriority.length - 5} more`);
    }
  }

  console.log('\n━'.repeat(80));
}

// Run the script
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
