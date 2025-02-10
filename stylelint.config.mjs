/** @type {import('stylelint').Config} */
export default {
  reportInvalidScopeDisables: true,
  reportNeedlessDisables: true,
  extends: ['stylelint-config-standard', '@maxmilton/stylelint-config'],
  ignoreFiles: ['*.bak/**', 'dist/**', 'node_modules/**'],
  rules: {
    'declaration-property-value-no-unknown': null, // TODO: Enable this rule + implement in postcss-ekscss
    'import-notation': null,
  },
};
