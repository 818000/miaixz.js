import {
  miaixzDefaultAppearance,
  type MiaixzAppearanceSettings,
  type MiaixzColorMode,
  type MiaixzDensity,
  type MiaixzResolvedColorMode,
  type MiaixzThemeOverrides,
} from "@miaixz/sdk/appearance";
import {
  Fragment,
  useCallback,
  useEffect,
  useId,
  useInsertionEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { applyTheme } from "./apply.js";
import { ThemeCache } from "./cache.js";
import { ThemeCatalog } from "./catalog.js";
import { ThemeContextProvider } from "./context.js";
import { MiaixzThemeError } from "./errors.js";
import { serializeThemeApplication } from "./serialize.js";
import type { ThemeContextValue, ThemeProps } from "./theme.types.js";

const globalOwnerKey = Symbol.for("@miaixz/ui/theme/global-owner");
const emptyThemes = Object.freeze([]) as NonNullable<ThemeProps["themes"]>;

/**
 * Tracks one in-flight theme request.
 */
interface ThemeRequest {
  /**
   * Requested theme identifier.
   */
  readonly name: string;
  /**
   * Controller used to cancel the request.
   */
  readonly controller: AbortController;
  /**
   * Public request completion promise.
   */
  readonly promise: Promise<void>;
}

/**
 * Tracks public transaction status independently from the SDK snapshot.
 */
interface ThemeRuntimeState {
  /**
   * Theme currently loading.
   */
  readonly pendingTheme?: string;
  /**
   * Current runtime transaction status.
   */
  readonly status: ThemeContextValue["status"];
  /**
   * Last public transaction failure.
   */
  readonly error?: MiaixzThemeError;
}

/**
 * Provides the unique SDK-connected global or local Miaixz theme runtime.
 *
 * @param props - Appearance manager, catalog additions, loader, scope, nonce, and subtree.
 * @returns Theme runtime style and themed subtree.
 * @public
 */
export function Theme(props: ThemeProps) {
  const { appearance, loader, fallback = "miaixz", nonce, children } = props;
  const themes = props.themes ?? emptyThemes;
  const scope = props.scope ?? "global";
  const generatedId = useId();
  const instanceId =
    scope === "global" ? "global" : `local-${generatedId.replaceAll(/[^a-zA-Z0-9_-]/g, "-")}`;
  const catalog = useMemo(() => new ThemeCatalog(themes), [themes]);
  if (!catalog.has(fallback)) {
    throw new MiaixzThemeError("UI_THEME_FALLBACK_INVALID", { theme: fallback });
  }
  const cacheRef = useRef(new ThemeCache());
  const styleRef = useRef<HTMLStyleElement>(null);
  const localTargetRef = useRef<HTMLDivElement>(null);
  const ownerRef = useRef(Symbol("miaixz-theme-owner"));
  const requestRef = useRef<ThemeRequest | undefined>(undefined);
  const failedTargetRef = useRef<string | undefined>(undefined);
  const appliedKeyRef = useRef<string | undefined>(undefined);
  const [catalogRevision, setCatalogRevision] = useState(0);
  const [revision, setRevision] = useState(0);
  const systemDark = useSyncExternalStore(
    subscribeSystemDarkPreference,
    readSystemDarkPreference,
    () => false,
  );
  const [runtime, setRuntime] = useState<ThemeRuntimeState>(() =>
    catalog.has(appearance.getSnapshot().theme)
      ? { status: "ready" }
      : loader === undefined
        ? {
            status: "error",
            error: new MiaixzThemeError("UI_THEME_NOT_FOUND", {
              theme: appearance.getSnapshot().theme,
            }),
          }
        : { status: "loading", pendingTheme: appearance.getSnapshot().theme },
  );
  const snapshot = useSyncExternalStore(
    (listener) => appearance.subscribe(listener),
    () => appearance.getSnapshot(),
    () => appearance.getSnapshot(),
  );
  const effectiveTheme = catalog.has(snapshot.theme) ? snapshot.theme : fallback;
  const resolvedColorMode = resolveColorMode(snapshot.colorMode, systemDark);
  const resolvedTheme = useMemo(() => {
    void catalogRevision;
    return catalog.get(effectiveTheme);
  }, [catalog, catalogRevision, effectiveTheme]);
  const descriptors = useMemo(() => {
    void catalogRevision;
    return catalog.descriptors();
  }, [catalog, catalogRevision]);
  const application = useMemo(
    () =>
      serializeThemeApplication(
        resolvedTheme,
        resolvedColorMode,
        snapshot.colorMode,
        snapshot.density,
        snapshot.overrides?.[resolvedColorMode],
        instanceId,
      ),
    [
      instanceId,
      resolvedColorMode,
      resolvedTheme,
      snapshot.colorMode,
      snapshot.density,
      snapshot.overrides,
    ],
  );
  const applicationKey = `${application.theme}:${application.colorMode}:${application.colorPreference}:${application.density}:${application.cssText}`;

  useInsertionEffect(() => {
    if (scope !== "global" || typeof document === "undefined") return undefined;
    const current = Reflect.get(document, globalOwnerKey) as symbol | undefined;
    if (current !== undefined && current !== ownerRef.current) {
      throw new MiaixzThemeError("UI_THEME_GLOBAL_DUPLICATE");
    }
    Object.defineProperty(document, globalOwnerKey, {
      value: ownerRef.current,
      configurable: true,
      enumerable: false,
    });
    return () => {
      if (Reflect.get(document, globalOwnerKey) === ownerRef.current) {
        Reflect.deleteProperty(document, globalOwnerKey);
      }
    };
  }, [scope]);

  useLayoutEffect(() => {
    const style = styleRef.current;
    const target =
      scope === "global"
        ? typeof document === "undefined"
          ? null
          : document.documentElement
        : localTargetRef.current;
    if (style === null || target === null) return undefined;
    return applyTheme(target, style, application);
  }, [application, scope]);

  useLayoutEffect(() => {
    if (appliedKeyRef.current === applicationKey) return;
    appliedKeyRef.current = applicationKey;
    setRevision((value) => value + 1);
  }, [applicationKey]);

  const targetElement = useCallback(
    () =>
      scope === "global"
        ? typeof document === "undefined"
          ? null
          : document.documentElement
        : localTargetRef.current,
    [scope],
  );

  const commit = useCallback(
    (next: MiaixzAppearanceSettings, persist: () => void): void => {
      const nextMode = resolveColorMode(next.colorMode, readSystemDarkPreference());
      const nextTheme = catalog.get(next.theme);
      const nextApplication = serializeThemeApplication(
        nextTheme,
        nextMode,
        next.colorMode,
        next.density,
        next.overrides?.[nextMode],
        instanceId,
      );
      const style = styleRef.current;
      const target = targetElement();
      const rollback =
        style === null || target === null ? undefined : applyTheme(target, style, nextApplication);
      try {
        persist();
      } catch (cause) {
        rollback?.();
        throw new MiaixzThemeError("UI_THEME_PERSIST_FAILED", {
          theme: next.theme,
          cause,
        });
      }
      appliedKeyRef.current = `${nextApplication.theme}:${nextApplication.colorMode}:${nextApplication.colorPreference}:${nextApplication.density}:${nextApplication.cssText}`;
      setRevision((value) => value + 1);
      setRuntime({ status: "ready" });
    },
    [catalog, instanceId, targetElement],
  );

  const setTheme = useCallback(
    (name: string): Promise<void> => {
      if (requestRef.current?.name === name) return requestRef.current.promise;
      requestRef.current?.controller.abort();
      const controller = new AbortController();
      const promise = (async () => {
        try {
          if (!catalog.has(name)) {
            if (loader === undefined)
              throw new MiaixzThemeError("UI_THEME_NOT_FOUND", { theme: name });
            setRuntime({ status: "loading", pendingTheme: name });
            const loaded = await cacheRef.current.load(name, loader, controller.signal);
            if (controller.signal.aborted) return;
            catalog.registerLoaded(loaded);
            setCatalogRevision((value) => value + 1);
          }
          const current = appearance.getSnapshot();
          const next = { ...current, theme: name };
          commit(next, () => appearance.setTheme(name));
          failedTargetRef.current = undefined;
        } catch (error) {
          if (error instanceof MiaixzThemeError && error.code === "UI_THEME_LOAD_ABORTED") {
            return;
          }
          const themeError =
            error instanceof MiaixzThemeError
              ? error
              : new MiaixzThemeError("UI_THEME_LOAD_FAILED", { theme: name, cause: error });
          failedTargetRef.current = name;
          setRuntime({ status: "error", error: themeError });
          throw themeError;
        } finally {
          if (requestRef.current?.controller === controller) requestRef.current = undefined;
        }
      })();
      requestRef.current = { name, controller, promise };
      return promise;
    },
    [appearance, catalog, commit, loader],
  );

  const setColorMode = useCallback(
    async (colorMode: MiaixzColorMode): Promise<void> => {
      const current = appearance.getSnapshot();
      const next = { ...current, colorMode };
      commit(next, () => appearance.setColorMode(colorMode));
    },
    [appearance, commit],
  );

  const setDensity = useCallback(
    async (density: MiaixzDensity): Promise<void> => {
      const current = appearance.getSnapshot();
      const next = { ...current, density };
      commit(next, () => appearance.setDensity(density));
    },
    [appearance, commit],
  );

  const setOverrides = useCallback(
    async (overrides: MiaixzThemeOverrides): Promise<void> => {
      const current = appearance.getSnapshot();
      const next = { ...current, overrides };
      commit(next, () => appearance.setOverrides(overrides));
    },
    [appearance, commit],
  );

  const retry = useCallback(async (): Promise<void> => {
    if (runtime.status !== "error" || failedTargetRef.current === undefined) return;
    await setTheme(failedTargetRef.current);
  }, [runtime.status, setTheme]);

  const reset = useCallback(async (): Promise<void> => {
    commit(miaixzDefaultAppearance, () => appearance.reset());
  }, [appearance, commit]);

  useEffect(() => {
    if (catalog.has(snapshot.theme)) return;
    if (loader === undefined) {
      failedTargetRef.current = snapshot.theme;
      try {
        appearance.setTheme(fallback);
      } catch {
        // The fallback remains visually applied even if persistence is unavailable.
      }
      return;
    }
    void setTheme(snapshot.theme).catch(() => undefined);
  }, [appearance, catalog, fallback, loader, setTheme, snapshot.theme]);

  useEffect(
    () => () => {
      requestRef.current?.controller.abort();
      cacheRef.current.clear();
    },
    [],
  );

  const context = useMemo<ThemeContextValue>(
    () => ({
      theme: effectiveTheme,
      ...(runtime.pendingTheme === undefined ? {} : { pendingTheme: runtime.pendingTheme }),
      themes: descriptors,
      colorMode: snapshot.colorMode,
      resolvedColorMode,
      density: snapshot.density,
      revision,
      status: runtime.status,
      ...(runtime.error === undefined ? {} : { error: runtime.error }),
      setTheme,
      setColorMode,
      setDensity,
      setOverrides,
      retry,
      reset,
    }),
    [
      descriptors,
      effectiveTheme,
      reset,
      resolvedColorMode,
      retry,
      revision,
      runtime,
      setColorMode,
      setDensity,
      setOverrides,
      setTheme,
      snapshot.colorMode,
      snapshot.density,
    ],
  );

  const style = (
    <style ref={styleRef} data-miaixz-theme-runtime="" nonce={nonce}>
      {application.cssText}
    </style>
  );
  const localClassName = props.scope === "local" ? props.className : undefined;
  return (
    <ThemeContextProvider value={context}>
      {scope === "global" ? (
        <Fragment>
          {style}
          {children}
        </Fragment>
      ) : (
        <Fragment>
          {style}
          <div
            ref={localTargetRef}
            data-miaixz-theme-scope=""
            {...(localClassName === undefined ? {} : { className: localClassName })}
          >
            {children}
          </div>
        </Fragment>
      )}
    </ThemeContextProvider>
  );
}

/**
 * Resolves a user color-mode preference to light or dark.
 *
 * @param colorMode - Light, dark, or system preference.
 * @param systemDark - Current system dark-mode result.
 * @returns Concrete light or dark mode.
 */
export function resolveMiaixzColorMode(
  colorMode: MiaixzColorMode,
  systemDark = readSystemDarkPreference(),
): MiaixzResolvedColorMode {
  return resolveColorMode(colorMode, systemDark);
}

/**
 * Resolves one color preference without reading global state.
 *
 * @param colorMode - Light, dark, or system preference.
 * @param systemDark - Current system dark-mode result.
 * @returns Concrete light or dark mode.
 */
function resolveColorMode(
  colorMode: MiaixzColorMode,
  systemDark: boolean,
): MiaixzResolvedColorMode {
  return colorMode === "system" ? (systemDark ? "dark" : "light") : colorMode;
}

/**
 * Reads the browser dark-mode preference with an SSR-safe light fallback.
 *
 * @returns Whether the browser currently prefers dark colors.
 */
function readSystemDarkPreference(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

/**
 * Subscribes to browser dark-mode preference changes.
 *
 * @param listener - External-store invalidation listener.
 * @returns Function that removes the media-query listener.
 */
function subscribeSystemDarkPreference(listener: () => void): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => undefined;
  }
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}
