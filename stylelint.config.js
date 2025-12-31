/** @type {import("stylelint").Config} */
export default {
  reportInvalidScopeDisables: true,
  reportNeedlessDisables: true,
  reportUnscopedDisables: true,
  extends: [
    "stylelint-config-standard",
    "@maxmilton/stylelint-config",
    "@maxmilton/stylelint-config/xcss",
  ],
  ignoreFiles: ["dist/*", "node_modules/**"],
};
