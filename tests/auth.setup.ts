import { test as setup } from '@playwright/test';
import path from 'path';

const standardUserFile = path.join(__dirname, '../storage-state/standardUser.json');

/** Logs in once per test run; the resulting storage state is reused by all dependent projects. */
setup('authenticate as standard user', async ({ page }) => {
  await page.goto('/');
  await page.locator('#user-name').fill(process.env.STANDARD_USER ?? '');
  await page.locator('#password').fill(process.env.STANDARD_PASSWORD ?? '');
  await page.locator('#login-button').click();
  await page.locator('.inventory_list').waitFor();

  await page.context().storageState({ path: standardUserFile });
});
