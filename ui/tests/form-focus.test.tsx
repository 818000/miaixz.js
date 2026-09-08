import { createMiaixzI18n } from "@miaixz/sdk/i18n";
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it } from "vitest";

import {
  Input,
  Search,
  Textarea,
  Select,
  Combobox,
  EditorSummary,
  FormField,
  Picker,
  MiaixzLocaleProvider,
} from "../src/index.js";

type State = Pick<import("../src/index.js").InputProps, "disabled" | "readOnly" | "invalid">;
const options = [{ value: "string", label: "string" }];
const fields: Record<string, (state: State) => ReactNode> = {
  Input: (state) => <Input aria-label="文本" {...state} />,
  Search: (state) => <Search aria-label="搜索" {...state} />,
  Textarea: (state) => <Textarea aria-label="说明" {...state} />,
  Select: (state) => (
    <Select aria-label="选择" {...state}>
      <option>string</option>
    </Select>
  ),
  Combobox: (state) => <Combobox label="类型" options={options} {...state} />,
  Picker: (state) => <Picker label="多选" options={options} {...state} />,
};

afterEach(cleanup);

describe("shared field focus state ownership", () => {
  for (const [name, field] of Object.entries(fields)) {
    for (const state of ["normal", "disabled", "readonly", "invalid"] as const) {
      it(`${name} exposes ${state} on the shared focus shell`, () => {
        const props = {
          disabled: state === "disabled",
          readOnly: state === "readonly",
          invalid: state === "invalid",
        };
        const { container } = render(
          <MiaixzLocaleProvider i18n={createMiaixzI18n()}>{field(props)}</MiaixzLocaleProvider>,
        );
        const shell = container.querySelector<HTMLElement>(".miaixz-control")!;
        expect(shell).not.toBeNull();
        for (const key of ["disabled", "readonly", "invalid"]) {
          expect(shell.getAttribute(`data-${key}`)).toBe(state === key ? "true" : null);
        }
        const editor = shell.querySelector<HTMLElement>("input, textarea, button")!;
        expect(editor).not.toBeNull();
        if (state === "disabled") {
          expect(editor).toBeDisabled();
        } else {
          editor.focus();
          expect(document.activeElement).toBe(editor);
        }
        if (state === "readonly") {
          expect(
            editor.hasAttribute("readonly") || editor.getAttribute("aria-readonly") === "true",
          ).toBe(true);
        }
        if (state === "invalid") expect(editor).toHaveAttribute("aria-invalid", "true");
        else expect(editor).not.toHaveAttribute("aria-invalid");
      });
    }
  }

  it("keeps field labels, guidance, errors and editor summary values reachable", () => {
    render(
      <>
        <FormField errorText="名称不能为空" helperText="用于成员列表展示" label="显示名称" required>
          <Input />
        </FormField>
        <EditorSummary
          items={[
            { label: "状态", value: "待完善" },
            { label: "账号", value: "kimi.liu" },
          ]}
          subtitle="用户档案"
          title="Kimi Liu"
        />
      </>,
    );

    const input = screen.getByRole("textbox", { name: "显示名称" });
    expect(input).toBeRequired();
    expect(input).toBeInvalid();
    expect(input).toHaveAccessibleDescription("用于成员列表展示 名称不能为空");
    expect(screen.getByRole("alert")).toHaveTextContent("名称不能为空");
    expect(screen.getByRole("heading", { name: "Kimi Liu" })).toBeInTheDocument();
    expect(screen.getByText("账号").closest("dl")).toHaveTextContent("kimi.liu");
  });
});
