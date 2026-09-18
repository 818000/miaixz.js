/*
 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
 ~                                                                           ~
 ~ Copyright (c) 2015-2026 miaixz.org and other contributors.                ~
 ~                                                                           ~
 ~ Licensed under the Apache License, Version 2.0 (the "License");           ~
 ~ you may not use this file except in compliance with the License.          ~
 ~ You may obtain a copy of the License at                                   ~
 ~                                                                           ~
 ~      https://www.apache.org/licenses/LICENSE-2.0                          ~
 ~                                                                           ~
 ~ Unless required by applicable law or agreed to in writing, software       ~
 ~ distributed under the License is distributed on an "AS IS" BASIS,         ~
 ~ WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  ~
 ~ See the License for the specific language governing permissions and       ~
 ~ limitations under the License.                                            ~
 ~                                                                           ~
 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
*/

import stylelint from "stylelint";

const strictCommentRuleName = "miaixz/comments-must-use-jsdoc";
const strictCommentMessages = stylelint.utils.ruleMessages(strictCommentRuleName, {
  nonJsdoc: "Every block comment must use the /** ... */ JSDoc form.",
  singleLine: "Every comment must use a multiline JSDoc block.",
});
const strictCommentPlugin = stylelint.createPlugin(
  strictCommentRuleName,
  (primaryOption) => (root, result) => {
    if (!primaryOption) return;

    root.walkComments((comment) => {
      const raw = comment.toString();
      const isRepositoryHeader =
        comment.source?.start?.line === 1 && raw.startsWith("/*\n") && raw.includes("miaixz.org");

      if (!raw.startsWith("/**") && !isRepositoryHeader) {
        stylelint.utils.report({
          message: strictCommentMessages.nonJsdoc,
          node: comment,
          result,
          ruleName: strictCommentRuleName,
        });
      }

      if (comment.source?.start?.line !== comment.source?.end?.line) return;

      stylelint.utils.report({
        message: strictCommentMessages.singleLine,
        node: comment,
        result,
        ruleName: strictCommentRuleName,
      });
    });
  },
);

/**
 * Defines the standalone CSS lint configuration for @miaixz/ui.
 *
 * @public
 */
const configuration = {
  extends: ["stylelint-config-standard", "stylelint-config-recess-order"],
  plugins: [strictCommentPlugin],
  rules: {
    [strictCommentRuleName]: true,
    "custom-property-pattern": "^miaixz-[a-z0-9-]+$",
    "declaration-property-value-disallowed-list": {
      transition: ["/\\ball\\b/"],
    },
    /**
     * Component state and surface selectors intentionally compose across source order.
     */
    "no-descending-specificity": null,
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
      files: ["src/theme/{default,theme}.css", "src/theme/**/styles.css"],
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
