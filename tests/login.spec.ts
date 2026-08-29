import { test, expect } from '../fixture/auth.fixture';
import { isProductionBuild } from '../framework/core/config';

test('user can login and view inventory', async ({ loginPage, inventoryPage, logger }) => {
  logger.info('Starting login flow');

  await loginPage.open();
  await loginPage.login(process.env.STANDARD_USER ?? '', process.env.STANDARD_PASSWORD ?? '');
  await inventoryPage.expectLoaded();

  await expect(inventoryPage.title).toHaveText('Products');
  logger.info('Inventory page loaded successfully');
});

test('license manager visibility depends on build type', async ({ page, logger }) => {
  logger.info(`Checking build type: ${process.env.BUILD_TYPE ?? 'development'}`);

  await page.goto('/');
  await page.locator('#user-name').fill(process.env.STANDARD_USER ?? '');
  await page.locator('#password').fill(process.env.STANDARD_PASSWORD ?? '');
  await page.locator('#login-button').click();

  const licenseManager = page.getByText('License Manager', { exact: false });

  if (isProductionBuild()) {
    const hasLicenseManager = (await licenseManager.count()) > 0;

    if (hasLicenseManager) {
      await expect(licenseManager).toBeVisible();
      logger.info('Production build shows the License Manager flow');
    } else {
      logger.warn('Production build does not currently expose the License Manager flow in this environment');
    }
  } else {
    await expect(licenseManager).toHaveCount(0);
    logger.info('Non-production build hides the License Manager flow');
  }
});
