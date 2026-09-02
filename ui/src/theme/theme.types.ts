import type {
  MiaixzAppearanceManager,
  MiaixzColorMode,
  MiaixzDensity,
  MiaixzResolvedColorMode,
  MiaixzThemeColorOverrides,
  MiaixzThemeOverrides,
} from "@miaixz/sdk/appearance";
import type { ReactNode } from "react";
import type { MiaixzThemeError } from "./errors.js";
import type { MiaixzThemeColorToken, MiaixzThemeColors } from "../tokens/colors.js";
import type { MiaixzThemeComposition } from "../tokens/composition.js";
import type { MiaixzThemeGeometry } from "../tokens/geometry.js";
import type { MiaixzThemeRadius } from "../tokens/radius.js";
import type { MiaixzThemeShadow } from "../tokens/shadow.js";
import type { MiaixzThemeSurfaces } from "../tokens/surfaces.js";
import type { MiaixzThemeTypography } from "../tokens/typography.js";

/**
 * Defines the supported theme runtime failures.
 *
 * @public
 */
export type MiaixzThemeErrorCode =
  | "UI_THEME_NOT_FOUND"
  | "UI_THEME_LOAD_FAILED"
  | "UI_THEME_LOAD_ABORTED"
  | "UI_THEME_INVALID"
  | "UI_THEME_TOKEN_UNKNOWN"
  | "UI_THEME_TOKEN_MISSING"
  | "UI_THEME_GEOMETRY_INVALID"
  | "UI_THEME_SURFACE_INVALID"
  | "UI_THEME_CONTRAST_INVALID"
  | "UI_THEME_INHERITANCE_INVALID"
  | "UI_THEME_SCHEMA_UNSUPPORTED"
  | "UI_THEME_DUPLICATE"
  | "UI_THEME_FALLBACK_INVALID"
  | "UI_THEME_GLOBAL_DUPLICATE"
  | "UI_THEME_APPLY_FAILED"
  | "UI_THEME_PERSIST_FAILED";

/**
 * Describes a typed theme failure before the concrete error class is instantiated.
 *
 * @public
 */
/**
 * Defines theme-controlled non-color tokens.
 *
 * @public
 */
export interface MiaixzThemeTokens {
  /**
   * Registered component composition variants.
   */
  readonly composition?: MiaixzThemeComposition;
  /**
   * Theme font families.
   */
  readonly typography?: MiaixzThemeTypography;
  /**
   * Theme corner radii.
   */
  readonly radius?: MiaixzThemeRadius;
  /**
   * Theme shadow geometry.
   */
  readonly shadow?: MiaixzThemeShadow;
  /**
   * Theme density and layout geometry.
   */
  readonly geometry?: MiaixzThemeGeometry;
  /**
   * Theme semantic surface mapping.
   */
  readonly surfaces?: MiaixzThemeSurfaces;
}

/**
 * Defines one light or dark theme mode.
 *
 * @public
 */
export interface MiaixzThemeMode {
  /**
   * Color values supplied by this theme layer.
   */
  readonly colors?: MiaixzThemeColorOverrides;
}

/**
 * Defines a root or inherited Miaixz theme.
 *
 * @public
 */
export interface MiaixzThemeDefinition {
  /**
   * Theme definition schema version.
   */
  readonly schemaVersion: 1;
  /**
   * Stable theme identifier.
   */
  readonly name: string;
  /**
   * Human-readable theme label.
   */
  readonly label: string;
  /**
   * Semantic version of the theme data.
   */
  readonly version: string;
  /**
   * Parent theme identifier for a custom theme.
   */
  readonly extends?: string;
  /**
   * Optional non-color token layer.
   */
  readonly tokens?: MiaixzThemeTokens;
  /**
   * Light and dark color layers.
   */
  readonly modes: {
    /**
     * Light color layer.
     */
    readonly light: MiaixzThemeMode;
    /**
     * Dark color layer.
     */
    readonly dark: MiaixzThemeMode;
  };
}

/**
 * Defines a complete resolved theme mode.
 *
 * @public
 */
export interface MiaixzResolvedThemeMode {
  /**
   * Contains all forty-two normalized theme colors.
   */
  readonly colors: MiaixzThemeColors;
}

/**
 * Defines a complete resolved theme ready for serialization and application.
 *
 * @public
 */
export interface MiaixzResolvedThemeDefinition {
  /**
   * Theme definition schema version.
   */
  readonly schemaVersion: 1;
  /**
   * Stable theme identifier.
   */
  readonly name: string;
  /**
   * Human-readable theme label.
   */
  readonly label: string;
  /**
   * Semantic theme-data version.
   */
  readonly version: string;
  /**
   * Complete typography, radius, shadow, geometry, and surface values.
   */
  readonly tokens: MiaixzResolvedThemeTokens;
  /**
   * Complete light and dark modes.
   */
  readonly modes: Readonly<Record<"light" | "dark", MiaixzResolvedThemeMode>>;
}

/**
 * Defines one complete resolved structured shadow level.
 *
 * @public
 */
export interface MiaixzResolvedThemeShadowLevel {
  /**
   * Vertical offset in pixels.
   */
  readonly y: number;
  /**
   * Blur radius in pixels.
   */
  readonly blur: number;
  /**
   * Spread radius in pixels.
   */
  readonly spread: number;
}

/**
 * Defines complete resolved density and layout geometry.
 *
 * @public
 */
export interface MiaixzResolvedThemeGeometry extends Readonly<
  Record<MiaixzDensity, Required<import("../tokens/geometry.js").MiaixzThemeDensityGeometry>>
> {
  /**
   * Complete layout geometry.
   */
  readonly layout: Required<import("../tokens/geometry.js").MiaixzThemeLayoutGeometry>;
}

/**
 * Defines a complete resolved non-color token set.
 *
 * @public
 */
export interface MiaixzResolvedThemeTokens {
  /**
   * Complete registered component composition variants.
   */
  readonly composition: Required<MiaixzThemeComposition>;
  /**
   * Complete typography values.
   */
  readonly typography: Required<MiaixzThemeTypography>;
  /**
   * Complete radius values.
   */
  readonly radius: Required<MiaixzThemeRadius>;
  /**
   * Complete shadow levels.
   */
  readonly shadow: Readonly<
    Record<"low" | "medium" | "high" | "overlay", MiaixzResolvedThemeShadowLevel>
  >;
  /**
   * Complete density and layout geometry.
   */
  readonly geometry: MiaixzResolvedThemeGeometry;
  /**
   * Complete semantic surface roles.
   */
  readonly surfaces: Readonly<
    Record<
      "page" | "header" | "sidebar" | "panel" | "control" | "overlay" | "selected",
      Readonly<Record<"background" | "foreground" | "border", MiaixzThemeColorToken>>
    >
  >;
}

/**
 * Supplies cancellation to an asynchronous theme loader.
 *
 * @public
 */
export interface MiaixzThemeLoadContext {
  /**
   * Signal aborted when a newer theme request supersedes this load.
   */
  readonly signal: AbortSignal;
}

/**
 * Loads untrusted theme data by identifier.
 *
 * @public
 */
export type MiaixzThemeLoader = (name: string, context: MiaixzThemeLoadContext) => Promise<unknown>;

/**
 * Defines properties shared by global and local Theme instances.
 *
 * @public
 */
export interface ThemeBaseProps {
  /**
   * SDK appearance manager used for persistence and subscriptions.
   */
  readonly appearance: MiaixzAppearanceManager;
  /**
   * Additional trusted custom themes.
   */
  readonly themes?: readonly MiaixzThemeDefinition[];
  /**
   * Optional asynchronous untrusted-theme loader.
   */
  readonly loader?: MiaixzThemeLoader;
  /**
   * Theme used when a requested theme cannot be applied.
   */
  readonly fallback?: string;
  /**
   * CSP nonce forwarded to the managed runtime style element.
   */
  readonly nonce?: string;
  /**
   * Rendered application subtree.
   */
  readonly children: ReactNode;
}

/**
 * Defines global and local Theme component modes.
 *
 * @public
 */
export type ThemeProps = ThemeBaseProps &
  (
    | {
        /**
         * Applies theme attributes to the document root.
         */
        readonly scope?: "global";
      }
    | {
        /**
         * Applies theme attributes to an isolated wrapper.
         */
        readonly scope: "local";
        /**
         * Optional class forwarded to the local wrapper.
         */
        readonly className?: string;
      }
  );

/**
 * Defines the resolved color subset used to preview one theme mode.
 *
 * @public
 */
export interface MiaixzThemePreviewColors {
  /**
   * Resolved brand color.
   */
  readonly brand: string;
  /**
   * Resolved surface color.
   */
  readonly surface: string;
  /**
   * Resolved primary text color.
   */
  readonly textPrimary: string;
}

/**
 * Describes one theme available in the active catalog.
 *
 * @public
 */
export interface MiaixzThemeDescriptor {
  /**
   * Stable theme identifier.
   */
  readonly name: string;
  /**
   * Human-readable theme label.
   */
  readonly label: string;
  /**
   * Semantic theme-data version.
   */
  readonly version: string;
  /**
   * Catalog source category.
   */
  readonly source: "builtin" | "registered" | "loaded";
  /**
   * Resolved light and dark preview colors.
   */
  readonly preview: Readonly<Record<"light" | "dark", Readonly<MiaixzThemePreviewColors>>>;
}

/**
 * Defines the public Theme hook state and transactional operations.
 *
 * @public
 */
export interface ThemeContextValue {
  /**
   * Theme that has been successfully applied.
   */
  readonly theme: string;
  /**
   * Target theme currently loading.
   */
  readonly pendingTheme?: string;
  /**
   * Ordered immutable catalog descriptors.
   */
  readonly themes: readonly MiaixzThemeDescriptor[];
  /**
   * Persisted light, dark, or system preference.
   */
  readonly colorMode: MiaixzColorMode;
  /**
   * Concrete light or dark mode currently applied.
   */
  readonly resolvedColorMode: MiaixzResolvedColorMode;
  /**
   * Persisted interface density.
   */
  readonly density: MiaixzDensity;
  /**
   * Monotonically increasing successfully applied snapshot revision.
   */
  readonly revision: number;
  /**
   * Current runtime transaction status.
   */
  readonly status: "idle" | "loading" | "ready" | "error";
  /**
   * Last public runtime failure.
   */
  readonly error?: MiaixzThemeError;
  /**
   * Applies and persists a theme transaction.
   */
  setTheme(name: string): Promise<void>;
  /**
   * Applies and persists a color-mode transaction.
   */
  setColorMode(mode: MiaixzColorMode): Promise<void>;
  /**
   * Applies and persists a density transaction.
   */
  setDensity(density: MiaixzDensity): Promise<void>;
  /**
   * Applies and persists mode-specific color overrides.
   */
  setOverrides(overrides: MiaixzThemeOverrides): Promise<void>;
  /**
   * Retries the last failed target when the runtime is in error.
   */
  retry(): Promise<void>;
  /**
   * Restores the default appearance transactionally.
   */
  reset(): Promise<void>;
}

/**
 * Configures the synchronous first-paint theme script.
 *
 * @public
 */
export interface MiaixzThemeScriptOptions {
  /**
   * Exact SDK appearance storage key.
   */
  readonly storageKey: string;
  /**
   * Fallback theme identifier.
   */
  readonly fallback?: string;
  /**
   * Theme identifiers allowed during first paint.
   */
  readonly themes?: readonly string[];
}
