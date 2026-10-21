// eslint-disable-next-line import/no-extraneous-dependencies
const { createConfig } = require('@openedx/frontend-build');

const config = createConfig('eslint');

module.exports = {
  ...config,
  overrides: [
    ...(config.overrides || []),
    {
      // Test-only helpers: never shipped (excluded from the build), so they may
      // import devDependencies such as @testing-library/react.
      files: ['src/testUtils.tsx'],
      rules: { 'import/no-extraneous-dependencies': ['error', { devDependencies: true }] },
    },
  ],
  // Never lint generated output — these directories aren't part of the
  // `tsconfig.json` program, so type-aware rules can't parse files in them
  // anyway, and there's nothing actionable in generated code regardless.
  ignorePatterns: ['dist/', 'coverage/', 'node_modules/'],
};
