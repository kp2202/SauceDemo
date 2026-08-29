import { expect, test } from '@playwright/test';
import { getBuildType } from '../framework/core/config';

test('build type normalization accepts common aliases', async () => {
  const original = process.env.BUILD_TYPE;

  try {
    process.env.BUILD_TYPE = 'prod';
    expect(getBuildType()).toBe('production');

    process.env.BUILD_TYPE = 'stage';
    expect(getBuildType()).toBe('staging');

    process.env.BUILD_TYPE = 'dev';
    expect(getBuildType()).toBe('development');
  } finally {
    if (original === undefined) {
      delete process.env.BUILD_TYPE;
    } else {
      process.env.BUILD_TYPE = original;
    }
  }
});
