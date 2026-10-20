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
 * Illustrates colleagues checking a paused service without implying real repair activity.
 */

import { ReachingColleague, Scene, SearchingColleague, ServiceConsole } from "./shared.js";

/**
 * Returns the service-restoration scene.
 *
 * @returns Local inline artwork.
 */
export function UnavailableIllustration() {
  return (
    <Scene name="service-restoration">
      <path className="miaixz-exception-ground" d="M58 312h490" />
      <ServiceConsole />
      <SearchingColleague />
      <g transform="translate(20 0)">
        <ReachingColleague />
      </g>
      <path className="miaixz-exception-paper" d="M371 76h111v54H371Z" />
      <path className="miaixz-exception-soft" d="M381 87h91v32h-91Z" />
      <path d="M401 102h15m20 0h15m-35 0 8 9 12-19" />
      <path className="miaixz-exception-trail" d="M371 104h-21q-28 0-28 30" />
      <path className="miaixz-exception-paper" d="M467 275h47v29h-47Z" />
      <path d="M478 275v-8h25v8m-36 13h47m-27-4h8v8h-8" />
    </Scene>
  );
}
