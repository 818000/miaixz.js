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

export {
  MiaixzLocaleCatalog,
  defineLocale,
  getMiaixzBrowserLocale,
  miaixzBuiltInLocales,
} from "./locale-catalog.js";
export type {
  MiaixzLocale,
  MiaixzLocaleDefinition,
  MiaixzLocaleDescriptor,
  MiaixzLocaleDirection,
} from "./locale-catalog.js";
export { createMiaixzMessageLoader, MiaixzI18nLoadError } from "./message-loader.js";
export type {
  MiaixzMessageLoader,
  MiaixzMessageLoaderMap,
  MiaixzMessageLoaderResult,
} from "./message-loader.js";
export { miaixzSdkMessages } from "./messages.js";
export type {
  MiaixzMessageCatalog,
  MiaixzMessageModule,
  MiaixzMessageParams,
  MiaixzMessages,
  MiaixzMessageSource,
} from "./messages.js";
export { createMiaixzI18n, MiaixzI18n } from "./i18n-runtime.js";
export type { MiaixzI18nOptions, MiaixzI18nSnapshot, MiaixzTranslator } from "./i18n-runtime.js";
