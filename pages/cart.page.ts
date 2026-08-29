import { Locator, Page } from '@playwright/test';
import { Logger } from '../logging/logger';
import { BasePage } from '../framework/core/base.page';

export class CartPage extends BasePage {
  readonly title: Locator;
  readonly checkoutButton: Locator;

  constructor(page: Page, logger: Logger) {
    super(page, logger);
    this.title = page.locator('.title');
    this.checkoutButton = page.locator('[data-test="checkout"]');
  }

  async expectLoaded(): Promise<void> {
    await this.title.waitFor();
  }

  async checkout(): Promise<void> {
    await this.click(this.checkoutButton, 'checkout button');
  }
}
