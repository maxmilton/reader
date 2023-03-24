const OFF = 0;
const WARN = 1;
const ERROR = 2;

// TODO: Types
// /** @type {import('eslint/lib/shared/types').ConfigData & { parserOptions: import('@typescript-eslint/types').ParserOptions }} */
module.exports = {
  root: true,
  reportUnusedDisableDirectives: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['./test/tsconfig.json'],
    tsconfigRootDir: __dirname,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'airbnb-base',
    'airbnb-typescript/base',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:unicorn/recommended',
    'prettier',
  ],
  plugins: ['prettier'],
  rules: {
    '@typescript-eslint/explicit-module-boundary-types': WARN,
    '@typescript-eslint/no-use-before-define': WARN,
    '@typescript-eslint/restrict-template-expressions': WARN,
    'import/extensions': OFF,
    'import/prefer-default-export': OFF,
    'no-plusplus': OFF,
    'no-restricted-syntax': OFF,
    // stage1 uses underscores in synthetic event handler names
    'no-underscore-dangle': OFF,
    'no-void': OFF,
    'prettier/prettier': WARN,
    'unicorn/filename-case': OFF,
    'unicorn/no-abusive-eslint-disable': WARN,
    'unicorn/no-null': OFF,
    'unicorn/prefer-add-event-listener': OFF,
    'unicorn/prefer-dom-node-append': OFF,
    'unicorn/prefer-module': OFF,
    'unicorn/prefer-top-level-await': WARN,
    'unicorn/prefer-query-selector': OFF,
    // not faster
    'unicorn/prefer-set-has': OFF,
    'unicorn/prevent-abbreviations': OFF,
    // byte savings (esbuild minify doesn't currently automatically remove)
    'unicorn/switch-case-braces': [ERROR, 'avoid'],
  },
};
