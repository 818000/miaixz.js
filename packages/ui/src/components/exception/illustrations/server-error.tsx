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
 * Illustrates a colleague restoring a disconnected service cable.
 */

import { ReachingColleague, Scene, ServiceConsole } from "./shared.js";

/**
 * Returns the collaborative connection-repair scene.
 *
 * @returns Local inline artwork.
 */
export function ServerErrorIllustration() {
  return (
    <Scene name="connection-repair">
      <path className="miaixz-exception-ground" d="M60 312h480" />
      <ServiceConsole />
      <g transform="translate(-155 0)">
        <ReachingColleague />
      </g>
      <path
        className="miaixz-exception-trail"
        d="M322 242c30 0 26 50 60 50h15m18 0h35q30 0 30-33v-24"
      />
      <rect className="miaixz-exception-clothing" x="389" y="284" width="16" height="16" rx="2" />
      <path d="M405 289h6m-6 6h6" />
      <path className="miaixz-exception-paper" d="M419 283h16v18h-16Z" />
      <path d="m404 268 5 6m12-10-2 9m17 1-7 5" />
      <rect className="miaixz-exception-paper" x="413" y="114" width="106" height="81" rx="4" />
      <path className="miaixz-exception-soft" d="M422 125h88v58h-88Z" />
      <path d="m436 155 16 0 9-13 12 26 8-13h15m-40 40v18m-18 0h37" />
      <path d="M397 215h137m-126 0v90m115-90v90" />
      <path className="miaixz-exception-paper" d="m86 102 38-8 20 20-30 27-30-17Z" />
      <path d="m99 110 12 5 14-10" />
    </Scene>
  );
}
