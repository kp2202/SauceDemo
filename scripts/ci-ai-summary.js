const fs = require('fs');
const path = require('path');

const reportDir = path.join(__dirname, '..', 'playwright-report');
const summaryPath = path.join(reportDir, 'ai-summary.md');

const buildType = process.env.BUILD_TYPE || 'development';
const project = process.env.PLAYWRIGHT_PROJECT || 'chromium';
const branch = process.env.GITHUB_REF_NAME || 'local';
const runId = process.env.GITHUB_RUN_ID || 'local-run';

const lines = [
  '# AI Test Assistant Summary',
  '',
  `- Build type: ${buildType}`,
  `- Project: ${project}`,
  `- Branch: ${branch}`,
  `- Run ID: ${runId}`,
  '',
  'The Playwright HTML report includes AI-generated failure attachmenets for failed tests.',
  'Open the failed test entry and inspect the "ai-failure-summary" attachment for:',
  '- likely root cause',
  '- recommended next action',
  '- selector guidance that prefers stable attributes like data-test',
  '',
  'This summary is generated from the CI environment so it is visible alongside the test artifacts.',
];

fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(summaryPath, `${lines.join('\n')}\n`, 'utf8');
console.log(`AI summary written to ${summaryPath}`);
