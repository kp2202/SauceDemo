import { test as base } from '@playwright/test';
import { Logger } from '../logging/logger';

type BaseFixtures = {
  logger: Logger;
};

/** Extends Playwright's test with framework-wide fixtures. Import `test`/`expect` from here, not '@playwright/test'. */
export const test = base.extend<BaseFixtures>({
  logger: async ({}, use, testInfo) => {
    await use(new Logger(testInfo));
  },
});

export { expect } from '@playwright/test';
