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
  Building2,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
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
  type LucideIcon,
} from "lucide-react";

import type { MiaixzIconName } from "./icon-names.js";

/**
 * Maps the frozen Miaixz icon names to statically imported Lucide components.
 *
 * The frozen object prevents project code from mutating the shared registry. Project-specific
 * icons must be passed to `Icon` instead of extending this map at runtime.
 *
 * @internal
 */
export const miaixzIconRegistry = Object.freeze({
  Building2,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
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
} satisfies Readonly<Record<MiaixzIconName, LucideIcon>>);
