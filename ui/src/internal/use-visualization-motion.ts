import { useCallback, useEffect, useRef, useState } from "react";
import type { ForwardedRef, PointerEventHandler, RefCallback } from "react";

import { useMergedRef } from "./use-merged-ref.js";

type VisualizationElement = HTMLElement | SVGSVGElement;
type VisualizationMotionState = "complete" | "enter" | "pending";

interface VisualizationMotionOptions<T extends VisualizationElement> {
  /**
   * Receives the visualization root element.
   */
  readonly forwardedRef: ForwardedRef<T>;
  /**
   * Preserves a consumer pointer-enter callback.
   */
  readonly onPointerEnter?: PointerEventHandler<T> | undefined;
  /**
   * Keeps the replay marker alive long enough for the longest owned animation.
   */
  readonly replayDuration?: number;
}

/**
 * Configures delegated entry and replay motion for a group of business visualizations.
 *
 * @public
 */
export interface VisualizationGroupMotionOptions<T extends HTMLElement> {
  /**
   * Optionally receives the group root element.
   */
  readonly forwardedRef?: ForwardedRef<T> | undefined;
  /**
   * Selects visualization roots below the group root.
   */
  readonly selector: string;
  /**
   * Keeps each replay marker alive long enough for the longest owned animation.
   *
   * @defaultValue `2400`
   */
  readonly replayDuration?: number;
}

/**
 * Reports whether the active environment requests reduced motion.
 *
 * @returns `true` when motion should be suppressed.
 */
function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Keeps one visualization's entry and replay motion alive after a quick pointer pass.
 *
 * @typeParam T - Visualization root element type.
 * @param options - Ref, pointer callback, and replay lifetime.
 * @param options.forwardedRef - Consumer ref receiving the visualization root.
 * @param options.onPointerEnter - Consumer pointer-enter callback.
 * @param options.replayDuration - Replay marker lifetime in milliseconds.
 * @returns Ref and motion bindings for the visualization root.
 */
export function useVisualizationMotion<T extends VisualizationElement>({
  forwardedRef,
  onPointerEnter,
  replayDuration = 2400,
}: VisualizationMotionOptions<T>): {
  /**
   * Handles pointer entry and starts a persistent replay.
   */
  readonly handlePointerEnter: PointerEventHandler<T>;
  /**
   * Reports the current entry lifecycle state.
   */
  readonly motionState: VisualizationMotionState;
  /**
   * Connects the visualization root.
   */
  readonly ref: RefCallback<T>;
  /**
   * Restarts replay programmatically.
   */
  readonly replay: () => void;
} {
  const localRef = useRef<T>(null);
  const completionTimerRef = useRef<number | undefined>(undefined);
  const replayTimerRef = useRef<number | undefined>(undefined);
  const [motionState, setMotionState] = useState<VisualizationMotionState>("pending");
  const ref = useMergedRef(forwardedRef, localRef);

  useEffect(() => {
    const element = localRef.current;
    if (!element) return undefined;

    const clearCompletionTimer = () => {
      if (completionTimerRef.current === undefined) return;
      window.clearTimeout(completionTimerRef.current);
      completionTimerRef.current = undefined;
    };
    const complete = () => {
      setMotionState("complete");
      completionTimerRef.current = undefined;
    };
    const enter = () => {
      clearCompletionTimer();
      setMotionState("enter");
      completionTimerRef.current = window.setTimeout(complete, replayDuration);
    };

    if (prefersReducedMotion()) {
      completionTimerRef.current = window.setTimeout(complete, 0);
      return clearCompletionTimer;
    }

    let observer: IntersectionObserver | undefined;
    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return;
          observer?.disconnect();
          enter();
        },
        { rootMargin: "0px 0px -6%", threshold: 0.12 },
      );
      observer.observe(element);
    }

    const visibilityFrame = window.requestAnimationFrame(() => {
      if (observer !== undefined) {
        const bounds = element.getBoundingClientRect();
        if (bounds.bottom <= 0 || bounds.top >= window.innerHeight * 0.94) return;
        observer.disconnect();
      }
      enter();
    });

    return () => {
      observer?.disconnect();
      window.cancelAnimationFrame(visibilityFrame);
      clearCompletionTimer();
    };
  }, [replayDuration]);

  useEffect(
    () => () => {
      if (replayTimerRef.current !== undefined) window.clearTimeout(replayTimerRef.current);
    },
    [],
  );

  const replay = useCallback(() => {
    const element = localRef.current;
    if (!element || prefersReducedMotion()) return;

    if (replayTimerRef.current !== undefined) window.clearTimeout(replayTimerRef.current);
    element.removeAttribute("data-motion-replay");
    void element.getBoundingClientRect().width;
    element.setAttribute("data-motion-replay", "true");
    replayTimerRef.current = window.setTimeout(() => {
      element.removeAttribute("data-motion-replay");
      replayTimerRef.current = undefined;
    }, replayDuration);
  }, [replayDuration]);

  const handlePointerEnter = useCallback<PointerEventHandler<T>>(
    (event) => {
      onPointerEnter?.(event);
      replay();
    },
    [onPointerEnter, replay],
  );

  return { handlePointerEnter, motionState, ref, replay };
}

/**
 * Applies the shared entry and replay lifecycle to matching visualization roots.
 *
 * The replay marker survives pointer exit, so a quick pass still completes the
 * entire animation. Consumers own only the selector and visualization styles.
 *
 * @typeParam T - Group root element type.
 * @param options - Group selector, optional ref, and replay lifetime.
 * @param options.forwardedRef - Consumer ref receiving the group root.
 * @param options.selector - Selector for visualization roots below the group.
 * @param options.replayDuration - Replay marker lifetime in milliseconds.
 * @returns A ref callback for the group root.
 * @public
 */
export function useVisualizationGroupMotion<T extends HTMLElement>({
  forwardedRef,
  selector,
  replayDuration = 2400,
}: VisualizationGroupMotionOptions<T>): RefCallback<T> {
  const rootRef = useRef<T>(null);
  const ref = useMergedRef(forwardedRef ?? null, rootRef);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const visualizations = Array.from(root.querySelectorAll<HTMLElement>(selector));
    const reduced = prefersReducedMotion();
    const completionTimers = new Map<HTMLElement, number>();
    const replayTimers = new Map<HTMLElement, number>();
    const replayListeners = new Map<HTMLElement, EventListener>();

    const complete = (visualization: HTMLElement) => {
      visualization.dataset.motionState = "complete";
      completionTimers.delete(visualization);
    };
    const enter = (visualization: HTMLElement) => {
      if (visualization.dataset.motionState !== "pending") return;
      visualization.dataset.motionState = "enter";
      completionTimers.set(
        visualization,
        window.setTimeout(() => complete(visualization), replayDuration),
      );
    };
    const replay = (visualization: HTMLElement) => {
      if (reduced) return;
      if (visualization.dataset.motionState === "pending") enter(visualization);
      const previousTimer = replayTimers.get(visualization);
      if (previousTimer !== undefined) window.clearTimeout(previousTimer);
      visualization.removeAttribute("data-motion-replay");
      void visualization.getBoundingClientRect().width;
      visualization.dataset.motionReplay = "true";
      replayTimers.set(
        visualization,
        window.setTimeout(() => {
          visualization.removeAttribute("data-motion-replay");
          replayTimers.delete(visualization);
        }, replayDuration),
      );
    };

    visualizations.forEach((visualization) => {
      visualization.dataset.motionState = reduced ? "complete" : "pending";
      if (reduced) return;
      const listener: EventListener = () => replay(visualization);
      visualization.addEventListener("pointerenter", listener);
      replayListeners.set(visualization, listener);
    });

    let observer: IntersectionObserver | undefined;
    if (!reduced && "IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const visualization = entry.target as HTMLElement;
            enter(visualization);
            observer?.unobserve(visualization);
          });
        },
        { rootMargin: "0px 0px -6%", threshold: 0.12 },
      );
      visualizations.forEach((visualization) => observer?.observe(visualization));
    }

    const activateVisibleVisualizations = () => {
      visualizations.forEach((visualization) => {
        if (visualization.dataset.motionState !== "pending") return;
        const bounds = visualization.getBoundingClientRect();
        if (bounds.bottom <= 0 || bounds.top >= window.innerHeight * 0.94) return;
        enter(visualization);
        observer?.unobserve(visualization);
      });
    };
    const visibilityFrame = window.requestAnimationFrame(activateVisibleVisualizations);
    window.addEventListener("resize", activateVisibleVisualizations);
    window.addEventListener("scroll", activateVisibleVisualizations, true);

    return () => {
      observer?.disconnect();
      window.cancelAnimationFrame(visibilityFrame);
      window.removeEventListener("resize", activateVisibleVisualizations);
      window.removeEventListener("scroll", activateVisibleVisualizations, true);
      completionTimers.forEach((timer) => window.clearTimeout(timer));
      replayListeners.forEach((listener, visualization) =>
        visualization.removeEventListener("pointerenter", listener),
      );
      replayTimers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [replayDuration, selector]);

  return ref;
}
