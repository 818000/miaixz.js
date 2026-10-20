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
 * Verifies the Exception public API and theme slots at compile time.
 */

import { Exception } from "../../../src/index.js";
import type { ExceptionProps } from "../../../src/components/exception/index.js";
import type { ThemeComponents } from "../../../src/theme/registry.js";

const valid: ExceptionProps = {
  status: "404",
  background: "subtle",
  illustration: false,
  headingLevel: 2,
};
const themed: ThemeComponents = {
  Exception: {
    defaultProps: { showCode: false },
    variants: [{ props: { status: "500" }, slotClassNames: { illustration: "custom-art" } }],
    slotClassNames: { background: "backdrop", title: "heading" },
  },
};
/**
 * @ts-expect-error State presets are deliberately closed; the component does not classify arbitrary errors. */
const invalid: ExceptionProps = { status: "401" };
/**
 * @ts-expect-error Explicit heading content is used instead of unstructured children. */
const children = <Exception status="404">hidden content</Exception>;
void [valid, themed, invalid, children];
