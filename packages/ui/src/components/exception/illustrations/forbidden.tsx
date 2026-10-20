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
 * Illustrates an access-controlled archive without political or tenant symbols.
 */

import { Scene, SearchingColleague } from "./shared.js";

/**
 * Returns the locked-document scene.
 *
 * @returns Local inline artwork.
 */
export function ForbiddenIllustration() {
  return (
    <Scene name="restricted-archive">
      <path className="miaixz-exception-ground" d="M58 312h490" />
      <SearchingColleague />
      <rect className="miaixz-exception-paper" x="272" y="80" width="167" height="225" rx="3" />
      <path d="M282 93h147v202H282Zm74 0v202" />
      <path className="miaixz-exception-soft" d="M294 117h41v49h-41Zm80 0h40v49h-40Z" />
      <path d="M294 184h41m39 0h40m-120 14h32m48 0h31m-65 7v30m11-30v30" />
      <rect className="miaixz-exception-clothing" x="331" y="211" width="51" height="42" rx="5" />
      <path d="M341 211v-12a15 15 0 0 1 30 0v12" />
      <path className="miaixz-exception-paper" d="M352 231a5 5 0 1 1 9 0v10h-9Z" />
      <path className="miaixz-exception-trail" d="M173 225h64m-14-7 14 7-14 7" />
      <path className="miaixz-exception-paper" d="m475 277 4 28h24l5-28Z" />
      <path d="M491 277v-45m0 26q-24-2-24-24 23 0 24 24Zm0-9q21-1 24-23-22 0-24 23Z" />
    </Scene>
  );
}
