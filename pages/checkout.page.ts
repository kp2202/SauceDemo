import { Locator, Page } from '@playwright/test';
import { Logger } from '../logging/logger';
import { BasePage } from '../framework/core/base.page';

export class CheckoutPage extends BasePage {
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly postalCodeInput: Locator;
  readonly continueButton: Locator;
  readonly finishButton: Locator;
  readonly confirmation: Locator;

  constructor(page: Page, logger: Logger) {
    super(page, logger);
    this.firstNameInput = page.locator('[data-test="firstName"]');
    this.lastNameInput = page.locator('[data-test="lastName"]');
    this.postalCodeInput = page.locator('[data-test="postalCode"]');
    this.continueButton = page.locator('[data-test="continue"]');
    this.finishButton = page.locator('[data-test="finish"]');
    this.confirmation = page.locator('.complete-header');
  }

  async fillCustomerInfo(data: { firstName: string; lastName: string; postalCode: string }): Promise<void> {
    await this.fill(this.firstNameInput, data.firstName, 'first name');
    await this.fill(this.lastNameInput, data.lastName, 'last name');
    await this.fill(this.postalCodeInput, data.postalCode, 'postal code');
  }

  async continue(): Promise<void> {
    await this.click(this.continueButton, 'continue');
  }

  async finish(): Promise<void> {
    await this.click(this.finishButton, 'finish');
  }
}
