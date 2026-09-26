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
 * Exports the complete public @miaixz/icons API.
 */

export {
  CANONICAL_ICON_NAMES,
  ICON_CATALOG,
  ICON_CATALOG as iconCatalog,
  ICON_IDENTIFIERS,
  ICON_NAME_LIST,
  ICON_NAMES,
} from "./autogen/catalog.js";
export type { IconName } from "./autogen/catalog.js";
export { Icon } from "./react/index.js";
export type { IconMotion, IconProps, IconSize } from "./react/index.js";
export {
  isIconName,
  loadMiaixzIconSubset,
  parseIconName,
  preloadMiaixzIconFont,
  resolveMiaixzIcon,
} from "./runtime/index.js";
export type { IconDirection, IconSubset, IconVariant, MiaixzIconRecord } from "./runtime/index.js";
