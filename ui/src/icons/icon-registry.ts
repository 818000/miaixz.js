import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  File,
  Folder,
  FolderOpen,
  Info,
  LoaderCircle,
  Minus,
  Palette,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  TriangleAlert,
  Upload,
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
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  File,
  Folder,
  FolderOpen,
  Info,
  LoaderCircle,
  Minus,
  Palette,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  TriangleAlert,
  Upload,
  X,
} satisfies Readonly<Record<MiaixzIconName, LucideIcon>>);
