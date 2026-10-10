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

/**
 * Defines the single repository formatting contract and generated-icon overrides.
 */

import { relative, sep } from "node:path";

import {
  loadWorkspaceRepository,
  requireWorkspace,
  repositoryRoot,
} from "./.github/scripts/miaixz.mjs";

const repository = loadWorkspaceRepository(repositoryRoot);
const iconDirectory = relative(
  repositoryRoot,
  requireWorkspace("@miaixz/icons", repository).rootPath,
).replaceAll(sep, "/");

const configuration = {
  printWidth: 100,
  semi: true,
  singleQuote: false,
  trailingComma: "all",
  overrides: [
    {
      files: `${iconDirectory}/src/values/icons.ts`,
      options: {
        quoteProps: "preserve",
      },
    },
    {
      files: `${iconDirectory}/src/assets/**/*.json`,
      options: {
        parser: "json-stringify",
      },
    },
  ],
};

export default configuration;
