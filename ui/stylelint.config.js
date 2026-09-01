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
  overrides: [
    {
      files: ["src/styles/themes/*.tokens.css"],
      rules: {
        "color-hex-length": "long",
        "custom-property-empty-line-before": null,
        "value-keyword-case": null,
      },
    },
    {
      files: ["src/styles/foundation/responsive.css"],
      rules: {
        "declaration-block-no-redundant-longhand-properties": null,
      },
    },
  ],
};

export default configuration;
