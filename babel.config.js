const { createConfig } = require('@openedx/frontend-build');

// `babel-preserve-modules` has no TypeScript support by default, so it's extended here.
const config = createConfig('babel-preserve-modules');

config.presets.push('@babel/preset-typescript');

module.exports = config;
