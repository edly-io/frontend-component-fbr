const { createConfig } = require('@openedx/frontend-build');

module.exports = createConfig('jest', {
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
