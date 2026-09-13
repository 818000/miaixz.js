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

/* eslint-disable jsdoc/require-jsdoc --
 * Test-only fixtures remain local.
 */
import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, renderHook, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Confirm } from "../../src/components/confirm/confirm.js";
import { Dialog } from "../../src/components/dialog/dialog.js";
import { Toaster, useToast } from "../../src/components/toaster/toaster.js";
import { renderWithLocale } from "../test-utils.js";

beforeEach(() => {
  HTMLDialogElement.prototype.showModal ??= function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close ??= function () {
    this.removeAttribute("open");
  };
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("modal feedback components", () => {
  it("renders Dialog slots and reports every native close path", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderWithLocale(
      <Dialog
        closeLabel="关闭窗口"
        description="说明"
        footer={<button type="button">保存</button>}
        headingLevel={3}
        open
        size="large"
        slotProps={{ paper: { className: "paper-slot" } }}
        title="编辑"
        onOpenChange={onOpenChange}
      >
        <input aria-label="名称" />
      </Dialog>,
    );
    const dialog = screen.getByRole("dialog", { name: "编辑" });
    expect(dialog).toHaveAttribute("data-size", "large");
    expect(dialog.querySelector(".paper-slot")).not.toBeNull();

    await user.click(screen.getByRole("button", { name: "关闭窗口" }));
    expect(onOpenChange).toHaveBeenLastCalledWith(false, "closeButton");
    fireEvent(dialog, new Event("cancel", { bubbles: true, cancelable: true }));
    expect(onOpenChange).toHaveBeenLastCalledWith(false, "escape");
    fireEvent.click(dialog, { clientX: 100, clientY: 100 });
    expect(onOpenChange).toHaveBeenLastCalledWith(false, "backdrop");
    fireEvent(dialog, new Event("close", { bubbles: true }));
    expect(onOpenChange).toHaveBeenLastCalledWith(false, "nativeClose");
  });

  it("enforces confirmation text and exposes asynchronous failures and success", async () => {
    const user = userEvent.setup();
    const failure = new Error("network");
    const onError = vi.fn();
    const onOpenChange = vi.fn();
    const onConfirm = vi.fn().mockRejectedValueOnce(failure).mockResolvedValueOnce(undefined);
    renderWithLocale(
      <Confirm
        confirmationText="DELETE"
        cancelLabel="取消"
        confirmLabel="删除"
        description="不可恢复"
        errorFormatter={(error) => (error === failure ? "网络失败" : "未知错误")}
        open
        title="删除资源"
        tone="danger"
        onConfirm={onConfirm}
        onError={onError}
        onOpenChange={onOpenChange}
      />,
    );

    const confirm = screen.getByRole("button", { name: "删除" });
    expect(confirm).toBeDisabled();
    await user.type(screen.getByRole("textbox", { name: "确认文本" }), "DELETE");
    expect(confirm).toBeEnabled();
    await user.click(confirm);
    expect(await screen.findByRole("alert")).toHaveTextContent("网络失败");
    expect(onError).toHaveBeenCalledWith(failure);

    await user.click(confirm);
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false, "confirm"));
    await user.click(screen.getByRole("button", { name: "取消" }));
    expect(onOpenChange).toHaveBeenCalledWith(false, "cancel");
  });

  it("owns one FIFO toast queue with update, action, dismiss, and timeout transitions", () => {
    vi.useFakeTimers();
    const onClose = vi.fn();

    function Controls() {
      const toast = useToast();
      return (
        <div>
          <button
            type="button"
            onClick={() =>
              toast.notify({
                id: "first",
                title: "第一条",
                message: "消息",
                duration: 50,
                action: { label: "撤销", onAction: () => undefined },
              })
            }
          >
            first
          </button>
          <button
            type="button"
            onClick={() =>
              toast.notify({ id: "second", title: "第二条", tone: "danger", duration: 0 })
            }
          >
            second
          </button>
          <button type="button" onClick={() => toast.notify({ id: "third", title: "第三条" })}>
            third
          </button>
          <button type="button" onClick={() => toast.dismiss("second")}>
            dismiss
          </button>
          <button type="button" onClick={() => toast.dismissAll()}>
            all
          </button>
        </div>
      );
    }

    renderWithLocale(
      <Toaster defaultDuration={100} maxVisible={2} onClose={onClose}>
        <Controls />
      </Toaster>,
    );
    fireEvent.click(screen.getByRole("button", { name: "first" }));
    fireEvent.click(screen.getByRole("button", { name: "second" }));
    fireEvent.click(screen.getByRole("button", { name: "third" }));
    expect(screen.getByText("第一条")).toBeInTheDocument();
    expect(screen.getByText("第二条")).toBeInTheDocument();
    expect(screen.queryByText("第三条")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "撤销" }));
    expect(onClose).toHaveBeenCalledWith("first", "action");
    expect(screen.getByText("第三条")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "dismiss" }));
    expect(onClose).toHaveBeenCalledWith("second", "programmatic");
    act(() => vi.advanceTimersByTime(100));
    expect(onClose).toHaveBeenCalledWith("third", "timeout");

    fireEvent.click(screen.getByRole("button", { name: "first" }));
    fireEvent.click(screen.getByRole("button", { name: "关闭通知" }));
    expect(onClose).toHaveBeenCalledWith("first", "dismiss");
    fireEvent.click(screen.getByRole("button", { name: "second" }));
    fireEvent.click(screen.getByRole("button", { name: "third" }));
    fireEvent.click(screen.getByRole("button", { name: "all" }));
    expect(screen.queryByText("第二条")).toBeNull();
    expect(screen.queryByText("第三条")).toBeNull();
  });

  it("rejects invalid toaster configuration and use outside its provider", () => {
    expect(() => renderWithLocale(<Toaster defaultDuration={Number.NaN}>x</Toaster>)).toThrowError(
      expect.objectContaining({ code: "UI_TOAST_DURATION_INVALID" }),
    );
    expect(() => renderWithLocale(<Toaster maxVisible={0}>x</Toaster>)).toThrowError(
      expect.objectContaining({ code: "UI_TOASTER_MAX_VISIBLE_INVALID" }),
    );
    expect(() => renderHook(() => useToast())).toThrowError(
      expect.objectContaining({ code: "UI_TOAST_PROVIDER_MISSING" }),
    );
  });
});
