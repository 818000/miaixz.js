import babelParser from "@babel/eslint-parser";
import eslint from "@eslint/js";
import prettier from "eslint-config-prettier";
import jsdoc from "eslint-plugin-jsdoc";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

const typeScriptFiles = ["**/*.ts", "**/*.tsx"];

/**
 * Defines the standalone JavaScript and TypeScript lint configuration for @miaixz/ui.
 *
 * @public
 */
const configuration = [
  {
    ignores: ["dist/**", "tests/.artifacts/**"],
  },
  eslint.configs.recommended,
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
      jsdoc,
      "react-hooks": reactHooks,
    },
    settings: {
      jsdoc: {
        mode: "typescript",
        tagNamePreference: {
          template: "typeParam",
        },
      },
    },
    rules: {
      ...reactHooks.configs.flat.recommended.rules,
      "no-undef": "off",
      "no-unused-vars": "off",
      "jsdoc/check-param-names": "error",
      "jsdoc/check-tag-names": ["error", { definedTags: ["public", "defaultValue"] }],
      "jsdoc/require-description": "error",
      "jsdoc/require-param": "error",
      "jsdoc/require-param-description": "error",
      "jsdoc/require-returns": "error",
      "jsdoc/require-returns-description": "error",
      "jsdoc/multiline-blocks": [
        "error",
        { minimumLengthForMultiline: 0, noSingleLineBlocks: true },
      ],
      "jsdoc/require-jsdoc": [
        "error",
        {
          contexts: [
            "ExportNamedDeclaration > TSInterfaceDeclaration",
            "ExportNamedDeclaration > TSTypeAliasDeclaration",
            "ExportNamedDeclaration:has(> VariableDeclaration)",
            "ExportNamedDeclaration > FunctionDeclaration",
            "ExportNamedDeclaration > ClassDeclaration",
            "MethodDefinition",
            "TSMethodSignature",
            "TSPropertySignature",
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
      "no-restricted-syntax": [
        "error",
        {
          selector: "TSAnyKeyword",
          message: "Use unknown and narrow the value at the runtime boundary instead of any.",
        },
      ],
    },
  },
  prettier,
];

export default configuration;
