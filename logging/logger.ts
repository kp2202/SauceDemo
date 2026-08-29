import { TestInfo } from '@playwright/test';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

/** Writes to the console and attaches a text log to the Playwright HTML report. */
export class Logger {
  constructor(private readonly testInfo: TestInfo) {}

  info(message: string): void {
    this.write('info', message);
  }

  warn(message: string): void {
    this.write('warn', message);
  }

  error(message: string): void {
    this.write('error', message);
  }

  debug(message: string): void {
    this.write('debug', message);
  }

  private write(level: LogLevel, message: string): void {
    const line = `[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}`;
    // eslint-disable-next-line no-console
    console[level === 'debug' ? 'log' : level](line);
    // fire-and-forget attachment so a slow attach never blocks the test
    void this.testInfo.attach(`log-${level}`, { body: line, contentType: 'text/plain' });
  }
}
