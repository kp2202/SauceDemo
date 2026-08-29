export type BuildType = 'development' | 'staging' | 'production';

const buildTypeAliases: Record<string, BuildType> = {
  dev: 'development',
  development: 'development',
  stage: 'staging',
  staging: 'staging',
  prod: 'production',
  production: 'production',
};

export function getBuildType(): BuildType {
  const value = (process.env.BUILD_TYPE ?? 'development').trim().toLowerCase();

  return buildTypeAliases[value] ?? 'development';
}

export function isProductionBuild(): boolean {
  return getBuildType() === 'production';
}
 