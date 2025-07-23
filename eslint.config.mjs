import js from "@eslint/js";
import mm from "@maxmilton/eslint-config";
import unicorn from "eslint-plugin-unicorn";
import ts from "typescript-eslint";

const OFF = 0;
const ERROR = 2;

export default ts.config(
  js.configs.recommended,
  ts.configs.strictTypeChecked,
  ts.configs.stylisticTypeChecked,
  unicorn.configs.recommended,
  mm.configs.recommended,
  {
    linterOptions: {
      reportUnusedDisableDirectives: ERROR,
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Bad browser support
      "unicorn/prefer-at": OFF,
      // Prefer to clearly separate Bun and DOM
      "unicorn/prefer-global-this": OFF,

      /* Performance and byte savings */
      // byte savings
      "no-plusplus": OFF,
      // byte savings (minification doesn't automatically remove)
      "unicorn/switch-case-braces": [ERROR, "avoid"],

      /* stage1 */
      // underscores in synthetic event handler names
      "no-underscore-dangle": OFF,
      "unicorn/prefer-add-event-listener": OFF,
      "unicorn/prefer-dom-node-append": OFF,
      "unicorn/prefer-query-selector": OFF,

      /* Migrate to dprint (formatter) */
      quotes: [ERROR, "double", { avoidEscape: true }],
    },
  },
  { ignores: ["**/*.bak", "coverage", "dist"] },
);
