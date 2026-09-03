import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { Drawer } from "../src/components/drawer/index.js";
import { createMiaixzI18n } from "@miaixz/sdk/i18n";
import { MiaixzLocaleProvider, miaixzUiMessages } from "../src/i18n/index.js";

function Example() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button">之前的鼠标目标</button>
      <button type="button" onClick={() => setOpen(true)}>
        键盘入口
      </button>
      <Drawer open={open} onOpenChange={setOpen} title="详情" closeLabel="关闭">
        <p>内容</p>
      </Drawer>
    </>
  );
}

describe("native modal focus restoration", () => {
  it("does not restore a stale pointer target after keyboard activation", async () => {
    HTMLDialogElement.prototype.showModal ??= function () {
      this.setAttribute("open", "");
    };
    HTMLDialogElement.prototype.close ??= function () {
      this.removeAttribute("open");
    };
    render(
      <MiaixzLocaleProvider
        i18n={createMiaixzI18n({ locale: "zh-CN", messages: miaixzUiMessages })}
      >
        <Example />
      </MiaixzLocaleProvider>,
    );
    fireEvent.pointerDown(screen.getByRole("button", { name: "之前的鼠标目标" }));
    const trigger = screen.getByRole("button", { name: "键盘入口" });
    trigger.focus();
    fireEvent.keyDown(trigger, { key: "Enter" });
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("button", { name: "关闭" }));
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });
});
