import { Locator, Page } from '@playwright/test';
import { Logger } from '../logging/logger';
import { BasePage } from '../framework/core/base.page';

export class InventoryPage extends BasePage {
  readonly inventoryList: Locator;
  readonly title: Locator;
  readonly cartBadge: Locator;
  readonly cartButton: Locator;

  constructor(page: Page, logger: Logger) {
    super(page, logger);
    this.inventoryList = page.locator('.inventory_list');
    this.title = page.locator('.title');
    this.cartBadge = page.locator('.shopping_cart_badge');
    this.cartButton = page.locator('.shopping_cart_link');
  }

  async expectLoaded(): Promise<void> {
    await this.inventoryList.waitFor();
    await this.title.waitFor();
  }

  async addItem(name: string): Promise<void> {
    const selectorName = name.toLowerCase().replace(/\s+/g, '-');
    const addToCartButton = this.page.locator(`[data-test="add-to-cart-${selectorName}"]`);

    if (!(await addToCartButton.isVisible().catch(() => false))) {
      const fallbackName = selectorName.replace(/-labs-/g, '-');
      const fallbackButton = this.page.locator(`[data-test="add-to-cart-${fallbackName}"]`);
      await this.click(fallbackButton, `add ${name} to cart`);
      return;
    }

    await this.click(addToCartButton, `add ${name} to cart`);
  }

  async openCart(): Promise<void> {
    await this.click(this.cartButton, 'shopping cart');
  }
}
