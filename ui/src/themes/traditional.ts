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

import {
  imperialGoldTheme,
  mineralBlueTheme,
  mineralGreenTheme,
  vermilionTheme,
} from "./traditional-imperial.js";
import {
  clearSkyTheme,
  lotusRootTheme,
  mountainDaiTheme,
  rougeTheme,
} from "./traditional-elegance.js";
import {
  autumnIncenseTheme,
  pinePollenTheme,
  ruCeladonTheme,
  xuanInkTheme,
} from "./traditional-nature.js";

/**
 * Chinese traditional palettes in their user-facing catalog order.
 */
export const traditionalThemes = Object.freeze([
  vermilionTheme,
  imperialGoldTheme,
  mineralBlueTheme,
  mineralGreenTheme,
  clearSkyTheme,
  mountainDaiTheme,
  rougeTheme,
  lotusRootTheme,
  ruCeladonTheme,
  pinePollenTheme,
  autumnIncenseTheme,
  xuanInkTheme,
]);

export {
  imperialGoldTheme,
  mineralBlueTheme,
  mineralGreenTheme,
  vermilionTheme,
} from "./traditional-imperial.js";
export {
  clearSkyTheme,
  lotusRootTheme,
  mountainDaiTheme,
  rougeTheme,
} from "./traditional-elegance.js";
export {
  autumnIncenseTheme,
  pinePollenTheme,
  ruCeladonTheme,
  xuanInkTheme,
} from "./traditional-nature.js";
