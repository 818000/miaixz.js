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

const multilineCommentRuleName = "miaixz/comments-must-be-multiline";
const multilineCommentMessages = stylelint.utils.ruleMessages(multilineCommentRuleName, {
  rejected: "Comments must use a multiline block format.",
});
const multilineCommentPlugin = stylelint.createPlugin(
  multilineCommentRuleName,
  (primaryOption) => (root, result) => {
    if (!primaryOption) return;

    root.walkComments((comment) => {
      if (comment.source?.start?.line !== comment.source?.end?.line) return;

      stylelint.utils.report({
        message: multilineCommentMessages.rejected,
        node: comment,
        result,
        ruleName: multilineCommentRuleName,
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
  plugins: ["stylelint-order", multilineCommentPlugin],
  rules: {
    [multilineCommentRuleName]: true,
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
      files: ["src/theme/{miaixz,neutral,contrast,theme}.css"],
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
