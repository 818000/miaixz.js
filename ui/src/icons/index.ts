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

export { ICON_NAMES, iconCatalog, isIconName, parseIconName } from "./icon-names.js";
export type { IconCatalogEntry, IconName, ParseIconNameOptions } from "./icon-names.js";
export type {
  IconDefinition,
  IconDefinitionModule,
  IconFontDefinition,
  IconPaint,
  IconSvgAttributes,
  IconSvgDefinition,
  IconSvgNode,
} from "./icon-definition.js";
export { IconRegistryProvider, useIconRegistry } from "./icon-context.js";
export type { IconRegistryProviderProps } from "./icon-context.js";
export { createIconRegistry } from "./icon-registry.js";
export type { IconRegistry } from "./icon-registry.js";
export type {
  IconLoader,
  IconProviderModule,
  IconRegistryOptions,
  LazyIconProvider,
  LazyIconSource,
} from "./icon-provider.js";
export { composeIconProviders } from "./icon-compose.js";
export { createCustomIconProvider, defineLazyIconSource } from "./providers/custom-provider.js";
export type {
  CustomIconProviderOptions,
  LazyIconSourceOptions,
} from "./providers/custom-provider.js";
export { fontAwesomeProvider } from "./providers/fontawesome-provider.js";
export { createIconfontProvider } from "./providers/iconfont-provider.js";
export type { IconfontManifest, IconfontProviderOptions } from "./providers/iconfont-provider.js";
export { lucideProvider } from "./providers/lucide-provider.js";
export { Icon } from "../components/icon/index.js";
export type { IconProps, IconSize, IconStroke } from "../components/icon/index.js";
