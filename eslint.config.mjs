import js from "@eslint/js";
import mm from "@maxmilton/eslint-config";
import unicorn from "eslint-plugin-unicorn";
import { defineConfig } from "eslint/config";
import ts from "typescript-eslint";

export default defineConfig(
  js.configs.recommended,
  ts.configs.strictTypeChecked,
  ts.configs.stylisticTypeChecked,
  // @ts-expect-error - broken upstream types
  unicorn.configs.recommended,
  mm.configs.recommended,
  {
    linterOptions: {
      reportUnusedDisableDirectives: "error",
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "no-plusplus": "off", // byte savings
      "unicorn/prefer-add-event-listener": "off", // stage1
      "unicorn/prefer-at": "off", // bad browser support
      "unicorn/prefer-dom-node-append": "off", // stage1
      "unicorn/prefer-global-this": "off", // clearly separate Bun and DOM
      "unicorn/prefer-query-selector": "off", // stage1
      "unicorn/switch-case-braces": ["error", "avoid"], // byte savings (minification doesn't automatically remove)
    },
  },
  { ignores: ["**/*.bak", "coverage", "dist"] },
);
