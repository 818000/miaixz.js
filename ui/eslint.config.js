/**
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

import babelParser from "@babel/eslint-parser";
import eslint from "@eslint/js";
import prettier from "eslint-config-prettier";
import jsdoc from "eslint-plugin-jsdoc";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import strictComments from "../.github/scripts/quality/enforce-source-policy.mjs";

const javaScriptFiles = ["**/*.cjs", "**/*.js", "**/*.mjs"];
const typeScriptFiles = ["**/*.ts", "**/*.tsx"];
const functionJsdocContexts = [
  "FunctionDeclaration",
  "MethodDefinition",
  "Program > VariableDeclaration > VariableDeclarator > ArrowFunctionExpression",
  "Program > VariableDeclaration > VariableDeclarator > FunctionExpression",
  "ExportNamedDeclaration > VariableDeclaration > VariableDeclarator > ArrowFunctionExpression",
  "ExportNamedDeclaration > VariableDeclaration > VariableDeclarator > FunctionExpression",
  "Property[method=true]",
  "PropertyDefinition > ArrowFunctionExpression",
  "PropertyDefinition > FunctionExpression",
];

const jsdocSettings = {
  jsdoc: {
    mode: "typescript",
    tagNamePreference: {
      template: "typeParam",
    },
  },
};

const jsdocRules = {
  "jsdoc/check-param-names": ["error", { checkDestructured: false }],
  "jsdoc/check-tag-names": [
    "error",
    {
      definedTags: ["public", "defaultValue", "ts-expect-error", "vitest-environment"],
    },
  ],
  "jsdoc/require-description": "error",
  "jsdoc/require-param": ["error", { checkDestructured: false }],
  "jsdoc/require-param-description": "error",
  "jsdoc/require-returns": "error",
  "jsdoc/require-returns-description": "error",
  "jsdoc/multiline-blocks": [
    "error",
    { minimumLengthForMultiline: 0, noFinalLineText: false, noSingleLineBlocks: true },
  ],
  "jsdoc/require-jsdoc": [
    "error",
    {
      contexts: [
        "ExportNamedDeclaration:has(> VariableDeclaration)",
        "ExportNamedDeclaration > FunctionDeclaration",
        "ExportNamedDeclaration > ClassDeclaration",
        "MethodDefinition",
        "Program > VariableDeclaration > VariableDeclarator > ArrowFunctionExpression",
        "Program > VariableDeclaration > VariableDeclarator > FunctionExpression",
        "Property[kind=get]",
        "Property[kind=set]",
        "Property[method=true]",
        "PropertyDefinition > ArrowFunctionExpression",
        "PropertyDefinition > FunctionExpression",
      ],
      enableFixer: false,
      publicOnly: false,
      require: {
        ArrowFunctionExpression: false,
        ClassDeclaration: true,
        ClassExpression: false,
        FunctionDeclaration: true,
        FunctionExpression: false,
        MethodDefinition: true,
      },
    },
  ],
};

const functionJsdocRules = {
  "function-jsdoc/check-tag-names": [
    "error",
    {
      definedTags: ["public", "defaultValue", "ts-expect-error", "vitest-environment"],
    },
  ],
  "function-jsdoc/require-description": ["error", { contexts: functionJsdocContexts }],
  "function-jsdoc/require-param": [
    "error",
    { checkDestructured: false, contexts: functionJsdocContexts },
  ],
  "function-jsdoc/require-param-description": ["error", { contexts: functionJsdocContexts }],
  "function-jsdoc/require-returns": ["error", { contexts: functionJsdocContexts }],
  "function-jsdoc/require-returns-description": ["error", { contexts: functionJsdocContexts }],
  "function-jsdoc/multiline-blocks": [
    "error",
    { minimumLengthForMultiline: 0, noFinalLineText: false, noSingleLineBlocks: true },
  ],
  "function-jsdoc/require-jsdoc": [
    "error",
    {
      contexts: functionJsdocContexts,
      enableFixer: false,
      publicOnly: false,
      require: {
        ArrowFunctionExpression: false,
        ClassDeclaration: false,
        ClassExpression: false,
        FunctionDeclaration: false,
        FunctionExpression: false,
        MethodDefinition: false,
      },
    },
  ],
};

/**
 * Defines the standalone JavaScript and TypeScript lint configuration for @miaixz/ui.
 *
 * @public
 */
const configuration = [
  {
    ignores: ["dist/**", "tests/.artifacts/**"],
    linterOptions: {
      noInlineConfig: true,
    },
  },
  eslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2022,
        ...globals.node,
      },
    },
    plugins: {
      miaixz: strictComments,
    },
    rules: {
      "miaixz/require-jsdoc-comments": "error",
    },
  },
  {
    files: javaScriptFiles,
    plugins: {
      "function-jsdoc": jsdoc,
      jsdoc,
    },
    settings: jsdocSettings,
    rules: {
      ...jsdocRules,
      ...functionJsdocRules,
    },
  },
  {
    files: typeScriptFiles,
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          parserOpts: {
            plugins: ["typescript", "jsx"],
          },
        },
      },
      globals: {
        ...globals.browser,
        ...globals.es2022,
        ...globals.node,
      },
    },
    plugins: {
      "function-jsdoc": jsdoc,
      jsdoc,
      "react-hooks": reactHooks,
    },
    settings: jsdocSettings,
    rules: {
      ...reactHooks.configs.flat.recommended.rules,
      "no-undef": "off",
      "no-unused-vars": "off",
      ...jsdocRules,
      ...functionJsdocRules,
      "no-restricted-syntax": [
        "error",
        {
          selector: "TSAnyKeyword",
          message: "Use unknown and narrow the value at the runtime boundary instead of any.",
        },
      ],
    },
  },
  {
    files: ["src/components/**/*.{ts,tsx}", "src/shared/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["lucide-react", "lucide-react/**"],
              message: "Render icons through the provider-neutral Miaixz Icon name contract.",
            },
          ],
        },
      ],
    },
  },
  /**
   * Centralizes the audited render-time ref exceptions used by state mirrors and composed slots.
   */
  {
    files: [
      "src/components/breadcrumb/breadcrumb.tsx",
      "src/components/combobox/combobox.tsx",
      "src/components/confirm/confirm.tsx",
      "src/components/dropdown/dropdown.tsx",
      "src/components/navigation/navigation.tsx",
      "src/components/picker/picker.tsx",
      "src/components/toaster/toaster.tsx",
      "src/shared/upload/use-upload-queue.ts",
      "tests/shared/visualization-motion.test.tsx",
    ],
    rules: {
      "react-hooks/refs": "off",
    },
  },
  prettier,
];

export default configuration;
