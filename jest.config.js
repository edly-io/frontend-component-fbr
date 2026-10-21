const { createConfig } = require('@openedx/frontend-build');

const config = createConfig('jest', {
  setupFilesAfterEnv: [
    'jest-expect-message',
    '<rootDir>/src/setupTest.js',
  ],
  coveragePathIgnorePatterns: [
    'src/setupTest.js',
  ],
  moduleNameMapper: {
    '^@src/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/dist/',
  ],
});

// Assigned outright, not passed above: webpack-merge concatenates arrays, so the
// default pattern would still exclude the ESM-only @edx/@openedx packages.
config.transformIgnorePatterns = ['/node_modules/(?!(@openedx|@edx))'];

module.exports = config;
