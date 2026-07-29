// eslint-disable-next-line import/no-extraneous-dependencies
const { createConfig } = require('@openedx/frontend-build');

module.exports = {
  ...createConfig('eslint'),
  // Never lint generated output — these directories aren't part of the
  // `tsconfig.json` program, so type-aware rules can't parse files in them
  // anyway, and there's nothing actionable in generated code regardless.
  ignorePatterns: ['dist/', 'coverage/', 'node_modules/'],
};
