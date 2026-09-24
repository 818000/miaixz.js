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

import { createContext, type PropsWithChildren, useContext } from "react";

import { createIconRegistry, type IconRegistry } from "./icon-registry.js";

const defaultIconRegistry = createIconRegistry();
const IconRegistryContext = createContext<IconRegistry>(defaultIconRegistry);

/**
 * Configures one immutable icon registry for a React subtree.
 */
export interface IconRegistryProviderProps extends PropsWithChildren {
  readonly registry: IconRegistry;
}

/**
 * Provides an icon registry without mutating module-global state.
 *
 * @param properties - Registry and child tree to provide.
 * @returns The scoped registry context provider.
 */
export function IconRegistryProvider(properties: IconRegistryProviderProps) {
  const { registry, children } = properties;
  return <IconRegistryContext.Provider value={registry}>{children}</IconRegistryContext.Provider>;
}

/**
 * Returns the icon registry selected for the current React subtree.
 *
 * @returns The nearest immutable icon registry.
 */
export const useIconRegistry = (): IconRegistry => useContext(IconRegistryContext);
