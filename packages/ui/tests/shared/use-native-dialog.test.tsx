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
 * Verifies controlled synchronization with the native dialog state.
 */

import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useNativeDialog } from "../../src/shared/use-native-dialog.js";

afterEach(cleanup);

describe("useNativeDialog", () => {
  it("does nothing while the ref is empty", () => {
    expect(() => renderHook(() => useNativeDialog({ current: null }, true))).not.toThrow();
  });

  it("opens and closes only when native state differs", () => {
    const dialog = document.createElement("dialog");
    const showModal = vi.fn(() => dialog.setAttribute("open", ""));
    const close = vi.fn(() => dialog.removeAttribute("open"));
    dialog.showModal = showModal;
    dialog.close = close;
    const ref = { current: dialog };
    const { rerender } = renderHook(({ open }) => useNativeDialog(ref, open), {
      initialProps: { open: true },
    });
    expect(showModal).toHaveBeenCalledTimes(1);
    expect(close).not.toHaveBeenCalled();

    rerender({ open: false });
    expect(close).toHaveBeenCalledTimes(1);
    rerender({ open: true });
    expect(showModal).toHaveBeenCalledTimes(2);
  });

  it("preserves an already matching open or closed state", () => {
    const openDialog = document.createElement("dialog");
    openDialog.setAttribute("open", "");
    openDialog.showModal = vi.fn();
    openDialog.close = vi.fn();
    const closedDialog = document.createElement("dialog");
    closedDialog.showModal = vi.fn();
    closedDialog.close = vi.fn();

    renderHook(() => useNativeDialog({ current: openDialog }, true));
    renderHook(() => useNativeDialog({ current: closedDialog }, false));
    expect(openDialog.showModal).not.toHaveBeenCalled();
    expect(openDialog.close).not.toHaveBeenCalled();
    expect(closedDialog.showModal).not.toHaveBeenCalled();
    expect(closedDialog.close).not.toHaveBeenCalled();
  });
});
