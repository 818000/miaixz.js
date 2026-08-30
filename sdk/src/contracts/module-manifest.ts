import { MiaixzSdkError } from "../api/errors.js";
import { translateMiaixzDefaultMessage } from "../i18n/default-translator.js";
import type { MiaixzEnvironment } from "../types/index.js";
import { compareMiaixzModuleNavigation, type MiaixzModuleNavigationItem } from "./navigation.js";
import {
  isMiaixzModuleIdentifier,
  isMiaixzModulePath,
  isMiaixzModulePermissionList,
  type MiaixzModuleRoute,
} from "./route.js";

/**
 * Version of the Miaixz micro-frontend manifest and lifecycle protocol.
 *
 * @public
 */
export const MIAIXZ_MODULE_PROTOCOL_VERSION = "1.0.0" as const;

/**
 * Identifies how a module is loaded and isolated by its host.
 *
 * @public
 */
export type MiaixzModuleKind = "integrated" | "iframe";

/**
 * Identifies one host capability that a module may require.
 *
 * @public
 */
export type MiaixzHostCapability = "context" | "events" | "i18n" | "navigation" | "permissions";

/**
 * Describes a pure-data manifest for one independently deployed frontend module.
 *
 * @public
 */
export interface MiaixzModuleManifest {
  /**
   * Protocol version understood by the module.
   */
  readonly protocolVersion: "1.0.0";

  /**
   * Globally stable kebab-case module identifier.
   */
  readonly id: string;

  /**
   * Complete semantic version of the module release.
   */
  readonly version: string;

  /**
   * Caret range describing the minimum compatible host release.
   */
  readonly hostVersion: string;

  /**
   * Loading and isolation strategy used by the module.
   */
  readonly kind: MiaixzModuleKind;

  /**
   * Static host path reserved for the module.
   */
  readonly basePath: string;

  /**
   * Integrated module identifier or iframe deployment URL.
   */
  readonly entry: string;

  /**
   * Routes contributed by the module.
   */
  readonly routes: readonly MiaixzModuleRoute[];

  /**
   * Navigation items contributed by the module.
   */
  readonly navigation: readonly MiaixzModuleNavigationItem[];

  /**
   * Permissions required before the module may load.
   */
  readonly requiredPermissions: readonly string[];

  /**
   * Host capabilities required by the module.
   */
  readonly requiredCapabilities: readonly MiaixzHostCapability[];
}

/**
 * Configures environment-specific and host-version manifest validation.
 *
 * @public
 */
export interface MiaixzModuleManifestParseOptions {
  /**
   * Runtime environment used to validate iframe URLs.
   *
   * @defaultValue `"production"`
   */
  readonly environment?: MiaixzEnvironment;

  /**
   * Optional concrete host version checked against the manifest range.
   */
  readonly hostVersion?: string;
}

interface MiaixzParsedSemanticVersion {
  /**
   * Major semantic-version number.
   */
  readonly major: number;

  /**
   * Minor semantic-version number.
   */
  readonly minor: number;

  /**
   * Patch semantic-version number.
   */
  readonly patch: number;

  /**
   * Optional prerelease identifiers.
   */
  readonly prerelease: readonly string[];
}

const manifestKeys = new Set([
  "protocolVersion",
  "id",
  "version",
  "hostVersion",
  "kind",
  "basePath",
  "entry",
  "routes",
  "navigation",
  "requiredPermissions",
  "requiredCapabilities",
]);
const routeKeys = new Set(["id", "path", "titleKey", "requiredPermissions"]);
const navigationKeys = new Set(["id", "routeId", "labelKey", "icon", "order"]);
const environments = new Set<MiaixzEnvironment>(["development", "test", "staging", "production"]);
const capabilities = new Set<MiaixzHostCapability>([
  "context",
  "events",
  "i18n",
  "navigation",
  "permissions",
]);
const semanticVersionPattern =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*))?$/;
const hostVersionPattern = /^\^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

/**
 * Creates the frozen manifest-validation error without including untrusted values.
 *
 * @returns Manifest-validation error using the registered public error code.
 */
function invalidManifest(): MiaixzSdkError {
  return new MiaixzSdkError(translateMiaixzDefaultMessage("sdk.error.module.manifestInvalid"), {
    code: "MODULE_MANIFEST_INVALID",
  });
}

/**
 * Creates the frozen host-version compatibility error without including version values.
 *
 * @returns Host-compatibility error using the registered public error code.
 */
function incompatibleHost(): MiaixzSdkError {
  return new MiaixzSdkError(translateMiaixzDefaultMessage("sdk.error.module.hostIncompatible"), {
    code: "MODULE_HOST_INCOMPATIBLE",
  });
}

/**
 * Determines whether a value is a plain JSON-style record.
 *
 * @param value - Value to inspect.
 * @returns Whether the value is a plain record without a custom prototype.
 */
function isPlainRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

/**
 * Determines whether a record contains exactly the allowed field names.
 *
 * @param value - Record whose keys should be checked.
 * @param allowed - Complete allowed key set.
 * @returns Whether every own enumerable key is allowed.
 */
function hasOnlyKeys(
  value: Readonly<Record<string, unknown>>,
  allowed: ReadonlySet<string>,
): boolean {
  return Object.keys(value).every((key) => allowed.has(key));
}

/**
 * Parses a complete semantic version without build metadata.
 *
 * @param value - Version candidate to parse.
 * @returns Parsed semantic version, or undefined for invalid syntax.
 */
function parseSemanticVersion(value: string): MiaixzParsedSemanticVersion | undefined {
  const match = semanticVersionPattern.exec(value);
  if (!match) return undefined;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: Object.freeze(match[4]?.split(".") ?? []),
  };
}

/**
 * Parses the only host-version range syntax accepted by module manifests.
 *
 * @param value - Host range candidate to parse.
 * @returns Parsed range floor, or undefined for invalid syntax.
 */
function parseHostVersion(value: string): MiaixzParsedSemanticVersion | undefined {
  const match = hostVersionPattern.exec(value);
  if (!match) return undefined;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: Object.freeze([]),
  };
}

/**
 * Compares two parsed semantic versions using standard prerelease precedence.
 *
 * @param first - First semantic version.
 * @param second - Second semantic version.
 * @returns Negative, zero, or positive precedence result.
 */
function compareSemanticVersions(
  first: MiaixzParsedSemanticVersion,
  second: MiaixzParsedSemanticVersion,
): number {
  const core =
    first.major - second.major || first.minor - second.minor || first.patch - second.patch;
  if (core !== 0) return core;
  if (first.prerelease.length === 0) return second.prerelease.length === 0 ? 0 : 1;
  if (second.prerelease.length === 0) return -1;
  const length = Math.max(first.prerelease.length, second.prerelease.length);
  for (let index = 0; index < length; index += 1) {
    const left = first.prerelease[index];
    const right = second.prerelease[index];
    if (left === undefined) return -1;
    if (right === undefined) return 1;
    if (left === right) continue;
    const leftNumeric = /^\d+$/.test(left);
    const rightNumeric = /^\d+$/.test(right);
    if (leftNumeric && rightNumeric) return Number(left) - Number(right);
    if (leftNumeric) return -1;
    if (rightNumeric) return 1;
    return left.localeCompare(right);
  }
  return 0;
}

/**
 * Determines whether a concrete host satisfies the frozen caret-range compatibility rule.
 *
 * @param hostVersion - Concrete complete semantic version of the host.
 * @param requiredHostVersion - Required caret range in `^MAJOR.MINOR.PATCH` form.
 * @returns Whether majors match and the host is at least the required range floor.
 * @public
 */
export function isMiaixzHostVersionCompatible(
  hostVersion: string,
  requiredHostVersion: string,
): boolean {
  const host = parseSemanticVersion(hostVersion);
  const required = parseHostVersion(requiredHostVersion);
  return (
    host !== undefined &&
    required !== undefined &&
    host.major === required.major &&
    compareSemanticVersions(host, required) >= 0
  );
}

/**
 * Parses one route and creates its immutable manifest-owned copy.
 *
 * @param value - Route candidate to parse.
 * @param basePath - Validated module base path.
 * @returns Frozen route copy, or undefined for invalid data.
 */
function parseRoute(value: unknown, basePath: string): Readonly<MiaixzModuleRoute> | undefined {
  if (!isPlainRecord(value) || !hasOnlyKeys(value, routeKeys)) return undefined;
  if (!isMiaixzModuleIdentifier(value.id) || !isMiaixzModulePath(value.path)) return undefined;
  if (typeof value.titleKey !== "string" || value.titleKey.trim().length === 0) return undefined;
  if (basePath !== "/" && (value.path === basePath || value.path.startsWith(`${basePath}/`))) {
    return undefined;
  }
  if (
    value.requiredPermissions !== undefined &&
    !isMiaixzModulePermissionList(value.requiredPermissions)
  ) {
    return undefined;
  }
  return Object.freeze({
    id: value.id,
    path: value.path,
    titleKey: value.titleKey,
    ...(value.requiredPermissions === undefined
      ? {}
      : { requiredPermissions: Object.freeze([...value.requiredPermissions]) }),
  });
}

/**
 * Parses one navigation item and creates its immutable manifest-owned copy.
 *
 * @param value - Navigation candidate to parse.
 * @returns Frozen navigation item, or undefined for invalid data.
 */
function parseNavigation(value: unknown): Readonly<MiaixzModuleNavigationItem> | undefined {
  if (!isPlainRecord(value) || !hasOnlyKeys(value, navigationKeys)) return undefined;
  if (!isMiaixzModuleIdentifier(value.id) || !isMiaixzModuleIdentifier(value.routeId)) {
    return undefined;
  }
  if (typeof value.labelKey !== "string" || value.labelKey.trim().length === 0) return undefined;
  if (value.icon !== undefined && typeof value.icon !== "string") return undefined;
  if (typeof value.order !== "number" || !Number.isFinite(value.order)) return undefined;
  return Object.freeze({
    id: value.id,
    routeId: value.routeId,
    labelKey: value.labelKey,
    ...(value.icon === undefined ? {} : { icon: value.icon }),
    order: value.order,
  });
}

/**
 * Determines whether a module entry is valid for its loading strategy and environment.
 *
 * @param kind - Module loading strategy.
 * @param entry - Entry candidate to validate.
 * @param environment - Runtime environment controlling localhost iframe support.
 * @returns Whether the entry satisfies the selected strategy.
 */
function isValidEntry(
  kind: MiaixzModuleKind,
  entry: unknown,
  environment: MiaixzEnvironment,
): entry is string {
  if (typeof entry !== "string" || entry.trim().length === 0 || entry !== entry.trim())
    return false;
  if (kind === "integrated") return true;
  try {
    const url = new URL(entry);
    return (
      url.protocol === "https:" ||
      (environment === "test" && url.protocol === "http:" && url.hostname === "localhost")
    );
  } catch {
    return false;
  }
}

/**
 * Parses, validates, sorts, and deeply freezes a remote module manifest.
 *
 * @param value - Untrusted manifest candidate.
 * @param options - Optional runtime environment and concrete host version.
 * @returns A deeply immutable manifest copy owned by the SDK.
 * @throws MiaixzSdkError With `MODULE_MANIFEST_INVALID` for malformed manifest data.
 * @throws MiaixzSdkError With `MODULE_HOST_INCOMPATIBLE` for an incompatible concrete host.
 * @public
 */
export function parseMiaixzModuleManifest(
  value: unknown,
  options: Readonly<MiaixzModuleManifestParseOptions> = {},
): Readonly<MiaixzModuleManifest> {
  if (!isPlainRecord(value) || !hasOnlyKeys(value, manifestKeys)) throw invalidManifest();
  const environment = options.environment ?? "production";
  if (!environments.has(environment)) throw invalidManifest();
  if (value.protocolVersion !== MIAIXZ_MODULE_PROTOCOL_VERSION) throw invalidManifest();
  if (!isMiaixzModuleIdentifier(value.id)) throw invalidManifest();
  if (typeof value.version !== "string" || !parseSemanticVersion(value.version)) {
    throw invalidManifest();
  }
  if (typeof value.hostVersion !== "string" || !parseHostVersion(value.hostVersion)) {
    throw invalidManifest();
  }
  if (value.kind !== "integrated" && value.kind !== "iframe") throw invalidManifest();
  if (!isMiaixzModulePath(value.basePath)) throw invalidManifest();
  const basePath = value.basePath;
  if (!isValidEntry(value.kind, value.entry, environment)) throw invalidManifest();
  if (!Array.isArray(value.routes) || !Array.isArray(value.navigation)) throw invalidManifest();
  if (!isMiaixzModulePermissionList(value.requiredPermissions)) throw invalidManifest();
  if (
    !Array.isArray(value.requiredCapabilities) ||
    !value.requiredCapabilities.every(
      (capability): capability is MiaixzHostCapability =>
        typeof capability === "string" && capabilities.has(capability as MiaixzHostCapability),
    )
  ) {
    throw invalidManifest();
  }

  const routes = value.routes.map((route) => parseRoute(route, basePath));
  if (routes.some((route) => route === undefined)) throw invalidManifest();
  const navigation = value.navigation.map(parseNavigation);
  if (navigation.some((item) => item === undefined)) throw invalidManifest();
  const parsedRoutes = routes as readonly Readonly<MiaixzModuleRoute>[];
  const parsedNavigation = navigation as readonly Readonly<MiaixzModuleNavigationItem>[];
  const routeIds = new Set(parsedRoutes.map((route) => route.id));
  const navigationIds = new Set(parsedNavigation.map((item) => item.id));
  if (routeIds.size !== parsedRoutes.length || navigationIds.size !== parsedNavigation.length) {
    throw invalidManifest();
  }
  if (parsedNavigation.some((item) => !routeIds.has(item.routeId))) throw invalidManifest();
  if (
    options.hostVersion !== undefined &&
    !isMiaixzHostVersionCompatible(options.hostVersion, value.hostVersion)
  ) {
    throw incompatibleHost();
  }

  return Object.freeze({
    protocolVersion: MIAIXZ_MODULE_PROTOCOL_VERSION,
    id: value.id,
    version: value.version,
    hostVersion: value.hostVersion,
    kind: value.kind,
    basePath,
    entry: value.entry,
    routes: Object.freeze([...parsedRoutes]),
    navigation: Object.freeze([...parsedNavigation].sort(compareMiaixzModuleNavigation)),
    requiredPermissions: Object.freeze([...value.requiredPermissions]),
    requiredCapabilities: Object.freeze([...value.requiredCapabilities]),
  });
}
