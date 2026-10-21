// A jsdom test environment that runs one test file in another timezone.
//
// `npm test` pins TZ=UTC, and assigning process.env.TZ inside a test file does
// not reach Node (Jest gives each file a copy of process.env). The environment
// is constructed in the worker's own context, so setting TZ here does. TZ is
// process-wide, so teardown restores it before the worker runs the next file.
//
// Usage, in the test file's first docblock:
//   @jest-environment ./jest.timezoneEnvironment.js
//   @jest-environment-options {"timezone": "Asia/Karachi"}

// Required by a non-literal name on purpose: this file is in the tsconfig
// program (root *.js), and a literal require would make tsc load the module's
// types, which drag in an @types/node too new for TypeScript 4.9.
const JSDOM_ENVIRONMENT = 'jest-environment-jsdom';
// eslint-disable-next-line import/no-dynamic-require
const { TestEnvironment } = require(JSDOM_ENVIRONMENT);

class TimezoneEnvironment extends TestEnvironment {
  constructor(config, context) {
    super(config, context);
    this.previousTimezone = process.env.TZ;
    process.env.TZ = config.projectConfig.testEnvironmentOptions.timezone;
  }

  async teardown() {
    process.env.TZ = this.previousTimezone;
    await super.teardown();
  }
}

module.exports = TimezoneEnvironment;
