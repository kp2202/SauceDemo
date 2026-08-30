#!/usr/bin/env ts-node
/**
 * CLI Script to Generate Playwright Tests from Natural Language Intent
 * 
 * Usage:
 *   npm run ai:generate-tests -- --intent "user should be able to add items to cart and checkout"
 *   npm run ai:generate-tests -- --intent "verify login functionality" --page "LoginPage"
 */

import * as fs from 'fs';
import * as path from 'path';
import { createAITestGeneratorFromEnv } from '../framework/ai/ai-test-generator';

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const intentIndex = args.indexOf('--intent');
  const pageIndex = args.indexOf('--page');
  const outputIndex = args.indexOf('--output');

  if (intentIndex === -1) {
    console.error('❌ Missing required --intent argument');
    console.log('\nUsage:');
    console.log('  npm run ai:generate-tests -- --intent "your test intent here"');
    console.log('  npm run ai:generate-tests -- --intent "..." --page "PageName" --output "tests/generated.spec.ts"');
    process.exit(1);
  }

  const intent = args[intentIndex + 1];
  const pageName = pageIndex !== -1 ? args[pageIndex + 1] : 'SauceDemo';
  const outputFile = outputIndex !== -1 ? args[outputIndex + 1] : null;

  console.log('\n🚀 AI Test Generator');
  console.log('━'.repeat(50));
  console.log(`Intent: ${intent}`);
  console.log(`Page Context: ${pageName}`);
  if (outputFile) console.log(`Output: ${outputFile}`);
  console.log('━'.repeat(50) + '\n');

  try {
    // Initialize AI Test Generator
    const generator = await createAITestGeneratorFromEnv();
    const status = generator.getStatus();
    console.log(status.message + '\n');

    // Generate test scenarios
    console.log('⏳ Generating test scenarios...\n');
    const scenarios = await generator.generateTestScenarios(intent, pageName);

    if (scenarios.length === 0) {
      console.error('❌ No test scenarios generated');
      process.exit(1);
    }

    // Display generated scenarios
    console.log(`✅ Generated ${scenarios.length} test scenario(s)\n`);
    scenarios.forEach((scenario, index) => {
      console.log(`📋 Scenario ${index + 1}: ${scenario.testName}`);
      console.log(`   Description: ${scenario.description}`);
      console.log(`   Steps: ${scenario.steps.length}`);
      scenario.steps.forEach((step, stepIndex) => {
        console.log(`     ${stepIndex + 1}. ${step}`);
      });
      console.log(`   Assertions: ${scenario.assertions.length}`);
      scenario.assertions.forEach((assertion) => {
        console.log(`     • ${assertion}`);
      });
      console.log();
    });

    // Generate test file content
    const testFileContent = generateTestFile(scenarios, pageName);

    // Output to file or console
    if (outputFile) {
      const outputPath = path.resolve(process.cwd(), outputFile);
      const outputDir = path.dirname(outputPath);

      // Create directory if it doesn't exist
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      fs.writeFileSync(outputPath, testFileContent, 'utf-8');
      console.log(`📝 Test file written to: ${outputPath}`);
      console.log(`\n🎉 Next steps:`);
      console.log(`   1. Review the generated tests: ${outputFile}`);
      console.log(`   2. Install dependencies: npm install`);
      console.log(`   3. Run tests: npm test`);
    } else {
      console.log('📄 Generated Test Code:\n');
      console.log('━'.repeat(50));
      console.log(testFileContent);
      console.log('━'.repeat(50));
      console.log('\n💡 Tip: Use --output flag to save to a file');
      console.log('   npm run ai:generate-tests -- --intent "..." --output "tests/generated.spec.ts"');
    }
  } catch (error) {
    console.error('❌ Error generating tests:', error);
    process.exit(1);
  }
}

/**
 * Generate complete test file content
 */
function generateTestFile(scenarios: any[], pageName: string): string {
  const imports = `import { test, expect } from '../fixture/auth.fixture';
import { Logger } from '../logging/logger';

/**
 * Generated Tests - ${pageName}
 * 
 * AI-Generated Test Scenarios
 * Generated using AI Test Generator (Phase 1)
 * 
 * IMPORTANT: These are template tests that require review and completion.
 * Please review each test, add proper page object interactions, and update assertions.
 */
`;

  const testCases = scenarios
    .map((scenario, index) => {
      return `test('${scenario.testName}', async ({ page, loginPage, inventoryPage, cartPage, checkoutPage, logger }) => {
  logger.info('🧪 Test: ${scenario.testName}');
  logger.info('📝 Description: ${scenario.description}');

  // Steps:
${scenario.steps.map((step: string) => `  // - ${step}`).join('\n')}

  // TODO: Implement the following steps using page objects and Playwright actions
  // Example:
  // await loginPage.goto();
  // await loginPage.login('standard_user', 'secret_sauce');
  // await inventoryPage.isLoaded();
  
  // Assertions:
${scenario.assertions.map((assertion: string) => `  // - ${assertion}`).join('\n')}

  // TODO: Replace with actual expect() assertions
  // Example:
  // await expect(inventoryPage.page).toHaveTitle(/Inventory/);
});

`;
    })
    .join('\n');

  return `${imports}\n${testCases}`;
}

// Run the script
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
