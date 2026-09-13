/**
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

import { createContext, useContext } from "react";
import type { PanelDensity } from "./panel.types.js";

const PanelContext = createContext<PanelDensity | undefined>(undefined);

/**
 * Provides inherited panel density to nested panel primitives.
 */
export const PanelDensityProvider = PanelContext.Provider;

/**
 * Resolves explicit panel density before inherited and default density values.
 *
 * @param explicit - Density supplied directly by the panel owner.
 * @returns Effective panel density.
 */
export function usePanelDensity(explicit: PanelDensity | undefined): PanelDensity {
  const contextual = useContext(PanelContext);
  return explicit ?? contextual ?? "standard";
}
