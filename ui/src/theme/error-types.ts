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
 * Defines the supported theme runtime failures.
 */
export type MiaixzThemeErrorCode =
  | "UI_THEME_NOT_FOUND"
  | "UI_THEME_LOAD_FAILED"
  | "UI_THEME_LOAD_ABORTED"
  | "UI_THEME_INVALID"
  | "UI_THEME_TOKEN_UNKNOWN"
  | "UI_THEME_TOKEN_MISSING"
  | "UI_THEME_GEOMETRY_INVALID"
  | "UI_THEME_SURFACE_INVALID"
  | "UI_THEME_CONTRAST_INVALID"
  | "UI_THEME_INHERITANCE_INVALID"
  | "UI_THEME_SCHEMA_UNSUPPORTED"
  | "UI_THEME_DUPLICATE"
  | "UI_THEME_FALLBACK_INVALID"
  | "UI_THEME_GLOBAL_DUPLICATE"
  | "UI_THEME_APPLY_FAILED"
  | "UI_THEME_PERSIST_FAILED";
