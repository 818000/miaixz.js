import "@testing-library/jest-dom/vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useMedia } from "../../../src/shared/responsive/use-media.js";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

/**
 * Exposes one hook snapshot for assertions.
 *
 * @param root0 - Probe properties.
 * @returns Current match state output.
 */
function Probe({ query = "(min-width: 640px)" }: { readonly query?: string }) {
  return <output>{String(useMedia(query))}</output>;
}

describe("useMedia", () => {
  it("uses the deterministic server snapshot", () => {
    expect(renderToString(<Probe />)).toContain("false");
  });

  it("deduplicates listeners, updates subscribers, and cleans up", () => {
    let matches = false;
    const listeners = new Set<() => void>();
    const addEventListener = vi.fn((_type: string, listener: () => void) =>
      listeners.add(listener),
    );
    const removeEventListener = vi.fn((_type: string, listener: () => void) =>
      listeners.delete(listener),
    );
    const matchMedia = vi.fn(() => ({
      /**
       * Exposes the mutable browser match.
       *
       * @returns Current browser match.
       */
      get matches() {
        return matches;
      },
      media: "(min-width: 640px)",
      onchange: null,
      addEventListener,
      removeEventListener,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    vi.stubGlobal("matchMedia", matchMedia);
    const view = render(
      <>
        <Probe />
        <Probe />
      </>,
    );
    expect(matchMedia).toHaveBeenCalledTimes(1);
    expect(addEventListener).toHaveBeenCalledTimes(1);
    matches = true;
    act(() => listeners.forEach((listener) => listener()));
    expect(screen.getAllByText("true")).toHaveLength(2);
    view.unmount();
    expect(removeEventListener).toHaveBeenCalledTimes(1);
  });

  it("falls back when matchMedia is unavailable", () => {
    vi.stubGlobal("matchMedia", undefined);
    render(<Probe />);
    expect(screen.getByText("false")).toBeInTheDocument();
  });
});
