/**
 * Defines the standalone CSS lint configuration for @miaixz/ui.
 *
 * @public
 */
const configuration = {
  extends: ["stylelint-config-standard", "stylelint-config-recess-order"],
  plugins: ["stylelint-order"],
  rules: {
    "custom-property-pattern": "^miaixz-[a-z0-9-]+$",
    "declaration-property-value-disallowed-list": {
      transition: ["/\\ball\\b/"],
    },
    "property-disallowed-list": [
      "left",
      "margin-left",
      "margin-right",
      "padding-left",
      "padding-right",
      "right",
    ],
    "selector-class-pattern": "^miaixz-[a-z0-9-]+$",
  },
};

export default configuration;
