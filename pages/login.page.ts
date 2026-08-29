import { Locator, Page } from '@playwright/test';
import { Logger } from '../logging/logger';
import { BasePage } from '../framework/core/base.page';

export class LoginPage extends BasePage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page, logger: Logger) {
    super(page, logger);
    this.usernameInput = page.locator('#user-name');
    this.passwordInput = page.locator('#password');
    this.loginButton = page.locator('#login-button');
    this.errorMessage = page.locator('[data-test="error"]');
  }

  async open(): Promise<void> {
    await this.goto('/');
  }

  async login(username: string, password: string): Promise<void> {
    await this.fill(this.usernameInput, username, 'username');
    await this.fill(this.passwordInput, password, 'password');
    await this.click(this.loginButton, 'login button');
  }
}
