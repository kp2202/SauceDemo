import { test, expect } from '../fixture/auth.fixture';

test('user can add an item to cart and complete checkout', async ({ loginPage, inventoryPage, cartPage, checkoutPage, logger }) => {
  logger.info('Starting cart checkout flow');

  await loginPage.open();
  await loginPage.login(process.env.STANDARD_USER ?? '', process.env.STANDARD_PASSWORD ?? '');
  await inventoryPage.expectLoaded();

  await inventoryPage.addItem('Sauce Labs Backpack');
  await expect(inventoryPage.cartBadge).toHaveText('1');

  await inventoryPage.openCart();
  await cartPage.expectLoaded();
  await cartPage.checkout();

  await checkoutPage.fillCustomerInfo({
    firstName: 'Ada',
    lastName: 'Lovelace',
    postalCode: '12345',
  });

  await checkoutPage.continue();
  await checkoutPage.finish();
  await expect(checkoutPage.confirmation).toHaveText('Thank you for your order!');

  logger.info('Checkout completed successfully');
});
