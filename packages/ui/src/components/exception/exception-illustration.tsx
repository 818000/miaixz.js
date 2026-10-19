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
 * Selects bundled inline artwork without fetching an asset or tenant configuration.
 */

import type { ExceptionStatus } from "./exception.types.js";
import { NotFoundIllustration } from "./illustrations/not-found.js";
import { ForbiddenIllustration } from "./illustrations/forbidden.js";
import { ServerErrorIllustration } from "./illustrations/server-error.js";
import { UnavailableIllustration } from "./illustrations/unavailable.js";

/**
 * Returns the decorative story associated with one failure preset.
 *
 * @param props - Decorative scene properties.
 * @returns Local inline artwork.
 */
export function ExceptionIllustration(props: { readonly status: ExceptionStatus }) {
  const { status } = props;
  switch (status) {
    case "404":
      return <NotFoundIllustration />;
    case "403":
      return <ForbiddenIllustration />;
    case "500":
      return <ServerErrorIllustration />;
    case "unavailable":
      return <UnavailableIllustration />;
  }
}
