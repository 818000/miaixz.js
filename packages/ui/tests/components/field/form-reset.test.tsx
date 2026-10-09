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

/**
 * Verifies post-reset timing, cancellation and cleanup for native form owners.
 */

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useFormReset } from "../../../src/shared/use-form-reset.js";

/**
 * Connects a native input to the reset observer under test.
 *
 * @param props - Callback and optional reset cancellation.
 * @param props.onReset - Observer invoked after an uncanceled reset.
 * @param props.cancel - Whether the form cancels the native reset.
 * @returns A native form whose input starts with a deterministic value.
 */
function ResetFixture({ onReset, cancel = false }: { onReset: () => void; cancel?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  useFormReset(ref, onReset);
  return (
    <form data-testid="reset-form" onReset={cancel ? (event) => event.preventDefault() : undefined}>
      <input aria-label="Reset value" defaultValue="Initial" ref={ref} />
    </form>
  );
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("native reset observation", () => {
  it("reads committed native values in the next task", () => {
    vi.useFakeTimers();
    const values: string[] = [];
    render(
      <ResetFixture
        onReset={() =>
          values.push((screen.getByLabelText("Reset value") as HTMLInputElement).value)
        }
      />,
    );
    fireEvent.change(screen.getByLabelText("Reset value"), { target: { value: "Changed" } });
    (screen.getByTestId("reset-form") as HTMLFormElement).reset();
    expect(values).toEqual([]);
    vi.runAllTimers();
    expect(values).toEqual(["Initial"]);
  });

  it("does not reset component state after a canceled native reset", () => {
    vi.useFakeTimers();
    const onReset = vi.fn();
    render(<ResetFixture cancel onReset={onReset} />);
    fireEvent.change(screen.getByLabelText("Reset value"), { target: { value: "Changed" } });
    (screen.getByTestId("reset-form") as HTMLFormElement).reset();
    vi.runAllTimers();
    expect(onReset).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Reset value")).toHaveValue("Changed");
  });

  it("clears pending callbacks on unmount", () => {
    vi.useFakeTimers();
    const onReset = vi.fn();
    const { unmount } = render(<ResetFixture onReset={onReset} />);
    (screen.getByTestId("reset-form") as HTMLFormElement).reset();
    unmount();
    vi.runAllTimers();
    expect(onReset).not.toHaveBeenCalled();
  });
});
