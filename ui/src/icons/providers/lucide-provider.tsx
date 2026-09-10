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

import { lazy, Suspense, type LazyExoticComponent, type ReactElement } from "react";
import {
  BadgeCheck,
  Blocks,
  Building2,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  CircleHelp,
  Diamond,
  File,
  Folder,
  FolderOpen,
  Info,
  LayoutDashboard,
  LayoutGrid,
  LoaderCircle,
  Menu,
  Minus,
  Palette,
  Plus,
  RotateCcw,
  Search,
  ScrollText,
  Server,
  ServerCog,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  TriangleAlert,
  Upload,
  Workflow,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import dynamicIconImports from "lucide-react/dynamicIconImports.mjs";

import { miaixzIconNameOverrides } from "../icon-name-overrides.generated.js";
import type { MiaixzIconName } from "../icon-name.generated.js";
import type {
  IconProviderProps,
  IconProviderRenderer,
  IconProviderSource,
} from "../icon-provider.js";

type LucideDynamicIconName = keyof typeof dynamicIconImports;

const dynamicIconCache = new Map<LucideDynamicIconName, LazyExoticComponent<IconProviderSource>>();
const warnedIcons = new Set<string>();
const lucideCoreIconRegistry: Readonly<
  Partial<Record<MiaixzIconName, IconProviderSource>>
> = Object.freeze({
  BadgeCheck,
  Blocks,
  Building2,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  CircleHelp,
  Diamond,
  File,
  Folder,
  FolderOpen,
  Info,
  LayoutDashboard,
  LayoutGrid,
  LoaderCircle,
  Menu,
  Minus,
  Palette,
  Plus,
  RotateCcw,
  Search,
  ScrollText,
  Server,
  ServerCog,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  TriangleAlert,
  Upload,
  Workflow,
  X,
  ZoomIn,
  ZoomOut,
});
const FallbackIcon = CircleHelp;

/**
 * Converts a public PascalCase icon name to Lucide's kebab-case module name.
 *
 * @param value - Stable Miaixz icon name.
 * @returns Lucide module name candidate.
 */
const toKebabCase = (value: string) =>
  value
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Za-z])([0-9])/g, "$1-$2")
    .replace(/([0-9])([A-Za-z])/g, "$1-$2")
    .toLowerCase();

/**
 * Reports each provider resolution failure once without interrupting rendering.
 *
 * @param name - Name used to deduplicate reports.
 * @param message - Diagnostic message.
 */
const warnOnce = (name: string, message: string) => {
  if (warnedIcons.has(name)) return;
  warnedIcons.add(name);
  console.error(message);
};

/**
 * Resolves one stable Miaixz name to a Lucide dynamic module name.
 *
 * @param name - Stable Miaixz icon name.
 * @returns Matching Lucide name, when available.
 */
const resolveLucideName = (name: MiaixzIconName): LucideDynamicIconName | undefined => {
  const override = miaixzIconNameOverrides[name];
  const candidate = override ?? toKebabCase(name);
  return candidate in dynamicIconImports ? (candidate as LucideDynamicIconName) : undefined;
};

/**
 * Returns a cached lazy component for a Lucide module.
 *
 * @param name - Resolved Lucide dynamic module name.
 * @returns Lazy icon component.
 */
const getDynamicIcon = (name: LucideDynamicIconName): LazyExoticComponent<IconProviderSource> => {
  const cached = dynamicIconCache.get(name);
  if (cached) return cached;
  const load = dynamicIconImports[name];
  const source = lazy(async () => {
    try {
      const module = await load();
      return { default: module.default as IconProviderSource };
    } catch (error) {
      warnOnce(name, `[miaixz] Unable to load icon "${name}": ${String(error)}`);
      return { default: FallbackIcon };
    }
  });
  dynamicIconCache.set(name, source);
  return source;
};

/**
 * Renders a Miaixz icon through the Lucide provider.
 *
 * Core icons render synchronously. The remaining catalog is split into on-demand chunks while
 * retaining the same provider-neutral `Icon` contract.
 *
 * @param name - Stable Miaixz icon name.
 * @param props - Normalized provider-neutral SVG properties.
 * @param ref - Forwarded SVG element reference.
 * @returns The resolved icon or a stable loading placeholder.
 * @internal
 */
export const renderLucideIcon: IconProviderRenderer = (name, props, ref): ReactElement => {
  const CoreIcon = lucideCoreIconRegistry[name];
  if (CoreIcon) return <CoreIcon {...props} ref={ref} />;

  const lucideName = resolveLucideName(name);
  if (!lucideName) {
    warnOnce(String(name), `[miaixz] Unknown icon name "${String(name)}".`);
    return <FallbackIcon {...props} ref={ref} />;
  }

  const DynamicIcon = getDynamicIcon(lucideName);
  return (
    <Suspense
      fallback={<svg viewBox="0 0 24 24" {...props} ref={ref} data-miaixz-icon-loading="true" />}
    >
      <DynamicIcon {...props} ref={ref} />
    </Suspense>
  );
};
