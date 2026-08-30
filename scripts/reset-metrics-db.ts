#!/usr/bin/env ts-node
/**
 * Reset Metrics Database (Phase 2: CI Optimization)
 * 
 * Clear all test metrics and reset the database.
 * 
 * Usage:
 *   npm run ci:reset-db                        # Reset all metrics
 *   npm run ci:reset-db -- --older-than 7     # Delete records older than 7 days
 */

import { createMetricsDatabase } from '../framework/metrics/database.service';
import * as fs from 'fs';

async function main() {
  const args = process.argv.slice(2);
  const olderThanIndex = args.indexOf('--older-than');
  const olderThanDays = olderThanIndex !== -1 ? parseInt(args[olderThanIndex + 1], 10) : undefined;

  try {
    const db = await createMetricsDatabase();
    const dbPath = db.getDbPath();

    if (olderThanDays) {
      console.log(`\n🗑️ Deleting metrics older than ${olderThanDays} days...`);
      db.clearOldRecords(olderThanDays);
      console.log('✅ Done!\n');
    } else {
      console.log('\n⚠️ This will delete all test metrics!');
      console.log(`Database: ${dbPath}`);
      console.log('\nTo confirm, re-run with: npm run ci:reset-db -- --confirm\n');

      if (args.includes('--confirm')) {
        console.log('🗑️ Resetting database...');
        db.reset();
        console.log('✅ Database reset successfully!\n');
      }
    }

    db.close();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
