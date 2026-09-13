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

const interactiveSelector = "[data-miaixz-ripple='true']";

const maximumConcurrentRipples = 3;

/**
 * Describes an optional client-coordinate origin for a press ripple.
 */
interface PressOrigin {
  /**
   * Horizontal viewport coordinate.
   */
  readonly clientX: number;
  /**
   * Vertical viewport coordinate.
   */
  readonly clientY: number;
  /**
   * Identifies the input source for diagnostics and visual tests.
   */
  readonly source: "pointer" | "keyboard";
}

/**
 * Installs delegated press feedback for explicitly framed buttons in one themed root.
 *
 * Ripple feedback is deliberately opt-in. Tabs, navigation links, selection rows,
 * cards and other semantic buttons must not inherit a command-button treatment.
 * Event delegation keeps the interaction cost constant while nested local themes
 * remain isolated from the global theme listener.
 *
 * @param root - Global or locally themed root receiving interaction events.
 * @returns Cleanup callback that removes the delegated listeners.
 * @internal
 */
export function bindPressInteractions(root: HTMLElement): () => void {
  const handlePointerDown = (event: PointerEvent): void => {
    if (event.button !== 0 || event.defaultPrevented) return;
    const action = resolveAction(root, event.target);
    if (action === null || isActionDisabled(action)) return;
    appendRipple(action, {
      clientX: event.clientX,
      clientY: event.clientY,
      source: "pointer",
    });
  };

  const handleKeyDown = (event: KeyboardEvent): void => {
    if (
      event.defaultPrevented ||
      event.repeat ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      (event.key !== "Enter" && event.key !== " " && event.key !== "Spacebar")
    )
      return;
    const action = resolveAction(root, event.target);
    if (action === null || isActionDisabled(action)) return;
    const rect = action.getBoundingClientRect();
    appendRipple(action, {
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2,
      source: "keyboard",
    });
  };

  root.addEventListener("pointerdown", handlePointerDown);
  root.addEventListener("keydown", handleKeyDown);
  return () => {
    root.removeEventListener("pointerdown", handlePointerDown);
    root.removeEventListener("keydown", handleKeyDown);
  };
}

/**
 * Resolves the nearest enabled action owned by the supplied theme root.
 *
 * @param root - Theme root that owns the interaction listener.
 * @param target - Original event target.
 * @returns Nearest action owned by the theme root, when present.
 */
function resolveAction(root: HTMLElement, target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Element)) return null;
  const action = target.closest<HTMLElement>(interactiveSelector);
  if (action === null || !root.contains(action)) return null;
  const localTheme = action.closest<HTMLElement>("[data-miaixz-theme-scope]");
  if (localTheme !== null && localTheme !== root) return null;
  return action;
}

/**
 * Returns whether an action is unavailable for pointer and keyboard input.
 *
 * @param action - Candidate semantic action.
 * @returns Whether the action must remain inert.
 */
function isActionDisabled(action: HTMLElement): boolean {
  return (
    action.matches(":disabled") ||
    action.getAttribute("aria-disabled") === "true" ||
    action.dataset.disabled === "true" ||
    action.dataset.loading === "true"
  );
}

/**
 * Adds one click-origin ripple without introducing component state or rerenders.
 *
 * @param action - Semantic action receiving the ripple.
 * @param origin - Pointer or keyboard press origin.
 */
function appendRipple(action: HTMLElement, origin: PressOrigin): void {
  const rect = action.getBoundingClientRect();
  const width = Math.max(rect.width || action.clientWidth, 1);
  const height = Math.max(rect.height || action.clientHeight, 1);
  const x = clamp(origin.clientX - rect.left, 0, width);
  const y = clamp(origin.clientY - rect.top, 0, height);
  const radius = Math.hypot(Math.max(x, width - x), Math.max(y, height - y));
  const diameter = Math.max(Math.ceil(radius * 2), 1);

  const layers = Array.from(action.children).filter((child) =>
    child.classList.contains("miaixz-interaction-ripple-layer"),
  );
  while (layers.length >= maximumConcurrentRipples) layers.shift()?.remove();

  const layer = document.createElement("span");
  layer.className = "miaixz-interaction-ripple-layer";
  layer.setAttribute("aria-hidden", "true");
  layer.dataset.origin = origin.source;

  const ripple = document.createElement("span");
  ripple.className = "miaixz-interaction-ripple";
  ripple.style.width = `${diameter}px`;
  ripple.style.height = `${diameter}px`;
  ripple.style.left = `${x - diameter / 2}px`;
  ripple.style.top = `${y - diameter / 2}px`;
  layer.append(ripple);
  action.append(layer);

  const remove = (): void => layer.remove();
  ripple.addEventListener("animationend", remove, { once: true });
  ripple.addEventListener("animationcancel", remove, { once: true });
}

/**
 * Constrains one coordinate to the visible action bounds.
 *
 * @param value - Coordinate to constrain.
 * @param minimum - Smallest permitted value.
 * @param maximum - Largest permitted value.
 * @returns Coordinate constrained to the supplied range.
 */
function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}
