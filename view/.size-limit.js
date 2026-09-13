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

/**
 * Preserves ESM semantics while Size Limit bundles an entry for measurement.
 *
 * @param configuration - Generated esbuild configuration.
 * @returns ESM-compatible esbuild configuration.
 */
function useEsmFormat(configuration) {
  return { ...configuration, format: "esm" };
}

export default [
  {
    name: "Image preview entry",
    path: "dist/image/index.js",
    limit: "8 kB",
    modifyEsbuildConfig: useEsmFormat,
  },
  {
    name: "Office preview entry",
    path: "dist/office/index.js",
    limit: "10 kB",
    modifyEsbuildConfig: useEsmFormat,
  },
  {
    name: "PDF preview entry",
    path: "dist/pdf/index.js",
    limit: "110 kB",
    modifyEsbuildConfig: useEsmFormat,
  },
];
