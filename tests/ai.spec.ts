import { expect, test } from '@playwright/test';
import {
  recommendLocator,
  summarizeFailure,
  generateScenarioFromIntent,
  buildEnvironmentAwareAssertion,
  detectFlakyTest,
  prioritizeTestsForCI,
} from '../framework/ai/test-assistant';

test('selector advisor prefers stable login selectors', async () => {
  const recommendation = recommendLocator({
    intent: 'login button',
    pageName: 'login',
    failedSelector: '#login-button',
    fallbackSelectors: ['button[type="submit"]', '[data-test="login-button"]'],
  });

  expect(recommendation.primary).toBe('[data-test="login-button"]');
  expect(recommendation.reason).toContain('stable');
  expect(recommendation.alternatives.length).toBeGreaterThan(0);
});

test('failure summarizer explains likely root cause', async () => {
  const summary = summarizeFailure({
    testName: 'user can login and view inventory',
    error: 'locator.click: Test timeout of 30000ms exceeded',
    pageName: 'login',
    buildType: 'production',
  });

  expect(summary.rootCause).toContain('selector');
  expect(summary.action).toContain('locator');
  expect(summary.buildAware).toContain('production');
});

test('scenario generator creates a login flow from natural language', async () => {
  const scenario = generateScenarioFromIntent('Login as a standard user and verify inventory page loads');

  expect(scenario.title).toContain('Login');
  expect(scenario.steps.length).toBeGreaterThanOrEqual(3);
  expect(scenario.assertions.some((assertion) => assertion.includes('inventory'))).toBeTruthy();
});

test('environment-aware assertion adapts to build type', async () => {
  const assertion = buildEnvironmentAwareAssertion('License Manager', 'production');

  expect(assertion.type).toBe('conditional');
  expect(assertion.when).toContain('production');
  expect(assertion.action).toContain('License Manager');
});

test('flaky test detection flags repeated timeout patterns', async () => {
  const result = detectFlakyTest({
    testName: 'login flow',
    failures: [
      { error: 'locator.click: Test timeout of 30000ms exceeded', count: 3 },
      { error: 'element not found', count: 1 },
    ],
  });

  expect(result.isFlaky).toBeTruthy();
  expect(result.risk).toBeGreaterThanOrEqual(0.5);
  expect(result.suggestion).toContain('selector');
});

test('CI prioritization ranks high-risk tests first', async () => {
  const prioritized = prioritizeTestsForCI([
    { name: 'checkout flow', risk: 0.3, ciCost: 1 },
    { name: 'login flow', risk: 0.9, ciCost: 2 },
    { name: 'smoke check', risk: 0.4, ciCost: 1 },
  ]);

  expect(prioritized[0].name).toBe('login flow');
  expect(prioritized.length).toBe(3);
});
