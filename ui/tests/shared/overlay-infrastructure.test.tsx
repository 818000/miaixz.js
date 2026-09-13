import { fireEvent, render, screen } from "@testing-library/react";
import { useRef } from "react";
import { describe, expect, it, vi } from "vitest";

import { activateMiaixzFocusScope } from "../../src/accessibility/focus-scope.js";
import { lockMiaixzDocumentScroll } from "../../src/shared/overlay/document-scroll-lock.js";
import { useMiaixzDismissibleLayer } from "../../src/shared/overlay/dismissible-layer.js";
import type { MiaixzDismissReason } from "../../src/shared/overlay/types.js";

interface LayerFixtureProps {
  /**
   * Supplies a unique accessible label.
   */
  readonly label: string;
  /**
   * Receives shared layer dismissal reasons.
   */
  readonly onDismiss: (reason: MiaixzDismissReason) => void;
  /**
   * Cancels Escape before it reaches the document layer manager.
   */
  readonly cancelEscape?: boolean;
}

/* eslint-disable jsdoc/check-param-names, jsdoc/require-param -- Props are documented by LayerFixtureProps.
 */
/**
 * Renders a mounted trigger and content pair for dismiss-layer tests.
 *
 * @param props - Fixture label, dismissal callback, and cancellation behavior.
 * @returns An active layer fixture.
 */
function LayerFixture({ label, onDismiss, cancelEscape = false }: LayerFixtureProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  useMiaixzDismissibleLayer({
    active: true,
    triggerRef,
    contentRef,
    portalTarget: document.body,
    onDismiss,
  });
  return (
    <section>
      <button ref={triggerRef}>{`${label} trigger`}</button>
      <div
        ref={contentRef}
        tabIndex={-1}
        onKeyDown={(event) => {
          if (cancelEscape && event.key === "Escape") event.preventDefault();
        }}
      >
        {`${label} content`}
      </div>
    </section>
  );
}
/* eslint-enable jsdoc/check-param-names, jsdoc/require-param
 */

describe("shared overlay infrastructure", () => {
  it("dismisses only layers above the pointer-owned nested branch", () => {
    const parentDismiss = vi.fn();
    const childDismiss = vi.fn();
    render(
      <>
        <LayerFixture label="parent" onDismiss={parentDismiss} />
        <LayerFixture label="child" onDismiss={childDismiss} />
      </>,
    );
    fireEvent.pointerDown(screen.getByText("parent content"));
    expect(childDismiss).toHaveBeenCalledWith("outsidePress");
    expect(parentDismiss).not.toHaveBeenCalled();
  });

  it("honors preventDefault before Escape reaches the layer manager", () => {
    const onDismiss = vi.fn();
    render(<LayerFixture cancelEscape label="only" onDismiss={onDismiss} />);
    fireEvent.keyDown(screen.getByText("only content"), { key: "Escape" });
    expect(onDismiss).not.toHaveBeenCalled();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onDismiss).toHaveBeenCalledWith("escape");
  });

  it("reference-counts scroll locking and restores exact inline values", () => {
    const root = document.documentElement;
    root.style.overflow = "clip";
    const firstUnlock = lockMiaixzDocumentScroll(document);
    const secondUnlock = lockMiaixzDocumentScroll(document);
    expect(root.style.overflow).toBe("hidden");
    firstUnlock();
    expect(root.style.overflow).toBe("hidden");
    secondUnlock();
    expect(root.style.overflow).toBe("clip");
    root.style.overflow = "";
  });

  it("restores focus only to a still-connected valid target", () => {
    const trigger = document.createElement("button");
    const scope = document.createElement("div");
    const inside = document.createElement("button");
    scope.append(inside);
    document.body.append(trigger, scope);
    trigger.focus();
    const deactivate = activateMiaixzFocusScope(scope, inside);
    expect(document.activeElement).toBe(inside);
    deactivate();
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
    scope.remove();
  });
});
