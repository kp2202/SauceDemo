import { Locator, Page, test } from '@playwright/test';
import { Logger } from '../../logging/logger';

/** Shared page behaviour for all page objects; relies on Playwright's own auto-waiting locators. */
export abstract class BasePage {
  constructor(
    protected readonly page: Page,
    protected readonly logger: Logger
  ) {}

  async goto(path = '/'): Promise<void> {
    await test.step(`Navigate to ${path}`, async () => {
      this.logger.info(`Navigating to ${path}`);
      await this.page.goto(path);
    });
  }

  async click(locator: Locator, name: string): Promise<void> {
    await test.step(`Click "${name}"`, async () => {
      await locator.click();
    });
  }

  async fill(locator: Locator, value: string, name: string): Promise<void> {
    await test.step(`Fill "${name}"`, async () => {
      await locator.fill(value);
    });
  }

  async textOf(locator: Locator): Promise<string> {
    return (await locator.textContent())?.trim() ?? '';
  }
}
