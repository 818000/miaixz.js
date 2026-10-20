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
 * Illustrates colleagues locating a misplaced page in an ordinary office.
 */

import {
  FilingCabinet,
  OfficeShelf,
  ReachingColleague,
  Scene,
  SearchingColleague,
} from "./shared.js";

/**
 * Returns the politically neutral document-search scene.
 *
 * @returns Local inline artwork.
 */
export function NotFoundIllustration() {
  return (
    <Scene name="document-search">
      <path className="miaixz-exception-ground" d="M58 312h490" />
      <path className="miaixz-exception-trail" d="M174 142c65-49 138-13 171-39s72-25 108-17" />
      <FilingCabinet />
      <OfficeShelf />
      <SearchingColleague />
      <ReachingColleague />
    </Scene>
  );
}
