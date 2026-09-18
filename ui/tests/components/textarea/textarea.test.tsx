import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Textarea } from "../../../src/components/textarea/index.js";
import { renderWithLocale } from "../../support/test-utils.js";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Textarea", () => {
  it("counts controlled and uncontrolled content", () => {
    const view = renderWithLocale(<Textarea defaultValue="abc" maxLength={10} showCount />);
    expect(screen.getByText("3 / 10")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "abcde" } });
    expect(screen.getByText("5 / 10")).toBeInTheDocument();
    view.rerender(<Textarea formatCount={(current) => `${current} chars`} showCount value="xy" />);
    expect(screen.getByText("2 chars")).toBeInTheDocument();
  });

  it("measures auto-resize and observes width changes", () => {
    const observe = vi.fn();
    const disconnect = vi.fn();
    vi.stubGlobal(
      "ResizeObserver",
      class {
        /**
         * Creates the observer stub.
         *
         * @param _callback - Ignored observer callback.
         */
        constructor(_callback: ResizeObserverCallback) {}
        /**
         * Observes a target.
         */
        observe = observe;
        /**
         * Stops observing targets.
         */
        disconnect = disconnect;
      },
    );
    renderWithLocale(<Textarea autoResize defaultValue="Line" maxRows={4} minRows={2} />);
    expect(observe).toHaveBeenCalledWith(screen.getByRole("textbox"));
    expect(screen.getByRole("textbox")).toHaveAttribute("data-resize", "none");
  });

  it("rejects invalid row bounds", () => {
    expect(() => renderWithLocale(<Textarea autoResize maxRows={2} minRows={3} />)).toThrow(
      expect.objectContaining({ code: "UI_TEXTAREA_ROWS_INVALID" }),
    );
  });
});
