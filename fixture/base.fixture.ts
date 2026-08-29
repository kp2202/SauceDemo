import { test as base, TestInfo } from '@playwright/test';
import { Logger } from '../logging/logger';
import { recommendLocator, summarizeFailure } from '../framework/ai/test-assistant';

type BaseFixtures = {
  logger: Logger;
};

/** Extends Playwright's test with framework-wide fixtures. Import `test`/`expect` from here, not '@playwright/test'. */
export const test = base.extend<BaseFixtures>({
  logger: async ({}, use, testInfo) => {
    await use(new Logger(testInfo));
  },
});

test.afterEach(async ({ logger }, testInfo: TestInfo) => {
  if (testInfo.status !== 'failed') {
    return;
  }

  const errorMessage = testInfo.error?.message ?? 'Unknown failure';
  const summary = summarizeFailure({
    testName: testInfo.title,
    error: errorMessage,
    pageName: testInfo.project.name,
    buildType: process.env.BUILD_TYPE ?? 'development',
  });

  const recommendation = recommendLocator({
    intent: testInfo.title,
    pageName: testInfo.project.name,
    failedSelector: 'locator',
    fallbackSelectors: ['[data-test="login-button"]', '[data-test="checkout"]', '[data-test="continue"]'],
  });

  const body = [
    'AI Failure Summary',
    '==================',
    '',
    `Test: ${summary.rootCause}`,
    `Action: ${summary.action}`,
    `Build awareness: ${summary.buildAware}`,
    '',
    'Selector recommendation:',
    `Primary: ${recommendation.primary}`,
    `Reason: ${recommendation.reason}`,
    `Alternatives: ${recommendation.alternatives.join(', ')}`,
  ].join('\n');

  logger.warn(`AI summary attached: ${summary.rootCause}`);
  await testInfo.attach('ai-failure-summary', { body, contentType: 'text/plain' });
});

export { expect } from '@playwright/test';
