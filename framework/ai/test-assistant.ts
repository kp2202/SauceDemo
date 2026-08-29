export type LocatorRecommendationInput = {
  intent: string;
  pageName: string;
  failedSelector: string;
  fallbackSelectors?: string[];
};

export type LocatorRecommendation = {
  primary: string;
  reason: string;
  alternatives: string[];
};

export type FailureSummaryInput = {
  testName: string;
  error: string;
  pageName: string;
  buildType?: string;
};

export type FailureSummary = {
  rootCause: string;
  action: string;
  buildAware: string;
};

export type ScenarioStep = {
  action: string;
  target: string;
};

export type Scenario = {
  title: string;
  steps: ScenarioStep[];
  assertions: string[];
};

export type EnvironmentAwareAssertion = {
  type: 'conditional';
  when: string;
  action: string;
  expected: string;
};

export type FlakyFailure = {
  error: string;
  count: number;
};

export type FlakyDetectionResult = {
  isFlaky: boolean;
  risk: number;
  suggestion: string;
};

export type CITestPriority = {
  name: string;
  risk: number;
  ciCost: number;
};

export function recommendLocator(input: LocatorRecommendationInput): LocatorRecommendation {
  const fallbackSelectors = input.fallbackSelectors ?? [];

  const preferred =
    fallbackSelectors.find((selector) => selector.includes('data-test')) ??
    fallbackSelectors.find((selector) => selector.includes('role')) ??
    fallbackSelectors[0] ??
    '[data-test="login-button"]';

  return {
    primary: preferred,
    reason: `The preferred selector is more stable and explicit for the ${input.pageName} page than the failed selector: ${input.failedSelector}.`,
    alternatives: [
      input.failedSelector,
      ...fallbackSelectors.filter((selector) => selector !== preferred),
      'button[type="submit"]',
    ],
  };
}

export function summarizeFailure(input: FailureSummaryInput): FailureSummary {
  const buildType = input.buildType ?? 'development';

  const rootCause =
    /timeout|waiting for element|locator\.click/i.test(input.error)
      ? `The failure likely stems from a selector or timing issue on the ${input.pageName} page.`
      : `The failure likely stems from an unexpected state or behavior in ${input.testName}.`;

  const action =
    /timeout|waiting for element|locator\.click/i.test(input.error)
      ? 'Review the relevant locator and prefer stable, explicit selectors such as data-test attributes before changing the test flow.'
      : 'Inspect the page state and the assertion target to confirm the UI matches the expected contract.';

  return {
    rootCause,
    action,
    buildAware: `This analysis is aware of the current build type: ${buildType}. Validate production-only flows separately when the environment differs from development.`,
  };
}

export function generateScenarioFromIntent(intent: string): Scenario {
  const normalized = intent.toLowerCase();

  if (normalized.includes('checkout')) {
    return {
      title: 'Checkout flow',
      steps: [
        { action: 'Login as a standard user', target: 'login page' },
        { action: 'Add an item to the cart', target: 'inventory page' },
        { action: 'Open the cart and proceed to checkout', target: 'cart page' },
        { action: 'Fill customer information', target: 'checkout form' },
      ],
      assertions: ['cart badge shows 1', 'checkout step loads', 'order confirmation appears'],
    };
  }

  return {
    title: 'Login flow',
    steps: [
      { action: 'Open the application', target: 'landing page' },
      { action: 'Enter valid credentials', target: 'login form' },
      { action: 'Submit the login form', target: 'login button' },
      { action: 'Wait for the inventory page', target: 'inventory page' },
    ],
    assertions: ['inventory page title is visible', 'inventory list loads', 'login succeeds'],
  };
}

export function buildEnvironmentAwareAssertion(featureName: string, buildType: string): EnvironmentAwareAssertion {
  return {
    type: 'conditional',
    when: `when build type is ${buildType}`,
    action: `Check whether ${featureName} is visible or hidden depending on the environment`,
    expected: `${featureName} should follow the ${buildType} environment contract`,
  };
}

export function detectFlakyTest(input: { testName: string; failures: FlakyFailure[] }): FlakyDetectionResult {
  const timeoutPatterns = input.failures.filter((failure) => /timeout|wait/i.test(failure.error));
  const totalCount = input.failures.reduce((sum, failure) => sum + failure.count, 0);
  const timeoutCount = timeoutPatterns.reduce((sum, failure) => sum + failure.count, 0);
  const risk = totalCount > 0 ? Math.min(1, timeoutCount / Math.max(totalCount, 1) + timeoutPatterns.length * 0.15) : 0;

  return {
    isFlaky: risk >= 0.5 || timeoutPatterns.length >= 2,
    risk,
    suggestion:
      timeoutPatterns.length > 0
        ? 'Investigate selector stability and timing-sensitive waits before expanding retries.'
        : 'Review repeated failures for inconsistent state or environment drift.',
  };
}

export function prioritizeTestsForCI(tests: CITestPriority[]): CITestPriority[] {
  return [...tests].sort((left, right) => {
    const leftScore = left.risk / Math.max(left.ciCost, 1);
    const rightScore = right.risk / Math.max(right.ciCost, 1);

    return rightScore - leftScore;
  });
}
