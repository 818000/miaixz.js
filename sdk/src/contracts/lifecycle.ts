import type { MiaixzHostBridge } from "./host-context.js";
import type { MiaixzModuleManifest } from "./module-manifest.js";

/**
 * Provides the host-owned resources required to mount an integrated module.
 *
 * @public
 */
export interface MiaixzModuleMountContext {
  /**
   * DOM container owned by the host application.
   */
  readonly container: HTMLElement;

  /**
   * Capability-limited bridge supplied by the host.
   */
  readonly bridge: MiaixzHostBridge;

  /**
   * Validated immutable manifest associated with the module.
   */
  readonly manifest: Readonly<MiaixzModuleManifest>;
}

/**
 * Represents the resources returned by a mounted integrated module.
 *
 * @public
 */
export interface MiaixzModuleHandle {
  /**
   * Releases every resource created by the mounted module.
   *
   * @returns Nothing, or a promise resolved after asynchronous cleanup.
   */
  unmount(): void | Promise<void>;
}

/**
 * Defines the only lifecycle entry exposed by an integrated module.
 *
 * @public
 */
export interface MiaixzIntegratedModule {
  /**
   * Mounts the module into its host-owned container.
   *
   * @param context - Validated host resources supplied to the module.
   * @returns Handle used by the host to unmount the module.
   */
  mount(context: MiaixzModuleMountContext): MiaixzModuleHandle | Promise<MiaixzModuleHandle>;
}
