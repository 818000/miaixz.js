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

import type { MiaixzLocaleDescriptor } from "@miaixz/sdk/i18n";
import type { HTMLAttributes } from "react";

/**
 * Configures the searchable global locale selector.
 *
 * @public
 */
export interface LocalePickerProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  /**
   * Supplies the ordered locale catalog descriptors.
   */
  readonly locales: readonly MiaixzLocaleDescriptor[];

  /**
   * Selects the active canonical locale identifier.
   */
  readonly locale: string;

  /**
   * Loads and activates a selected locale.
   */
  readonly onLocaleChange: (locale: string) => void | Promise<void>;

  /**
   * Disables every locale choice.
   *
   * @defaultValue `false`
   */
  readonly disabled?: boolean;
}
