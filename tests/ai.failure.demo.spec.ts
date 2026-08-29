import { test, expect } from '../fixture/auth.fixture';

const shouldRunFailureDemo = process.env.RUN_AI_DEMO === 'true';
test.skip(!shouldRunFailureDemo, 'AI demo is disabled; set RUN_AI_DEMO=true to intentionally trigger the AI failure summary');

test('AI failure demo intentionally fails to surface selector guidance', async ({ loginPage, logger }) => {
  logger.info('Creating an intentional failure to validate the AI summary flow');

  await loginPage.open();
  await loginPage.login(process.env.STANDARD_USER ?? '', process.env.STANDARD_PASSWORD ?? '');

  await expect(loginPage.loginButton).toHaveText('This will fail on purpose');
});
