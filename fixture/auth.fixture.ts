import { Page } from '@playwright/test';
import { test as base } from './base.fixture';
import { Logger } from '../logging/logger';
import { LoginPage } from '../pages/login.page';
import { InventoryPage } from '../pages/inventory.page';
import { CartPage } from '../pages/cart.page';
import { CheckoutPage } from '../pages/checkout.page';

type AuthFixtures = {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
  logger: Logger;
};

export const test = base.extend<AuthFixtures>({
  loginPage: async ({ page, logger }: { page: Page; logger: Logger }, use: (value: LoginPage) => Promise<void>) => {
    await use(new LoginPage(page, logger));
  },
  inventoryPage: async ({ page, logger }: { page: Page; logger: Logger }, use: (value: InventoryPage) => Promise<void>) => {
    await use(new InventoryPage(page, logger));
  },
  cartPage: async ({ page, logger }: { page: Page; logger: Logger }, use: (value: CartPage) => Promise<void>) => {
    await use(new CartPage(page, logger));
  },
  checkoutPage: async ({ page, logger }: { page: Page; logger: Logger }, use: (value: CheckoutPage) => Promise<void>) => {
    await use(new CheckoutPage(page, logger));
  },
});

export { expect } from './base.fixture';
