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

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Combobox } from "../src/components/combobox/index.js";
import { Field } from "../src/components/field/index.js";
import { Input } from "../src/components/input/index.js";
import { Picker } from "../src/components/picker/index.js";
import { Select } from "../src/components/select/index.js";
import { renderWithLocale } from "./test-utils.js";

afterEach(cleanup);

const removedHiddenClassName = ["miaixz", "visually", "hidden"].join("-");

const options = [
  { value: "alpha", label: "Alpha", textValue: "Alpha" },
  { value: "beta", label: "Beta", textValue: "Beta" },
] as const;
const selectItems = options.map((option) => ({
  ...option,
  id: option.value,
  kind: "option" as const,
}));

describe("field and collection controls", () => {
  it("connects a native Input to one Field label, description and error", () => {
    renderWithLocale(
      <Field errorText="必填" helperText="输入名称" invalid label="名称" required>
        <Input />
      </Field>,
    );
    const input = screen.getByRole("textbox", { name: /名称/u });
    expect(input).toBeRequired();
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input.getAttribute("aria-describedby")).toBeTruthy();
    expect(screen.getByRole("alert")).toHaveTextContent("必填");
  });

  it("connects Select to Field and selects through one explicit item collection", () => {
    renderWithLocale(
      <Field helperText="选择环境" label="环境" required>
        <Select items={selectItems} />
      </Field>,
    );
    const trigger = screen.getByRole("combobox", { name: /环境/u });
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("option", { name: "Beta" }));
    expect(trigger).toHaveTextContent("Beta");
  });

  it("uses the canonical hidden class for Select validation feedback", () => {
    renderWithLocale(
      <form aria-label="环境表单">
        <Field label="环境" required>
          <Select items={selectItems} />
        </Field>
        <button type="submit">提交</button>
      </form>,
    );

    fireEvent.submit(screen.getByRole("form", { name: "环境表单" }));

    const feedback = screen.getByText("请选择一个选项");
    expect(feedback).toHaveClass("miaixz-hidden");
    expect(feedback).not.toHaveClass(removedHiddenClassName);
    expect(screen.getByRole("combobox", { name: /环境/u })).toHaveAttribute(
      "aria-describedby",
      feedback.id,
    );
  });

  it("keeps Combobox readonly state on its single control owner", () => {
    renderWithLocale(<Combobox label="项目" options={options} readOnly value={options[0]} />);
    const input = screen.getByRole("combobox", { name: "项目" });
    expect(input).toHaveAttribute("aria-readonly", "true");
    expect(input.closest(".miaixz-combobox")).toHaveAttribute("data-readonly", "true");
  });

  it("renders Picker values from its controlled option collection", () => {
    renderWithLocale(<Picker label="成员" options={options} value={[options[0]!]} />);
    expect(screen.getByRole("combobox", { name: "成员" })).toBeVisible();
    expect(screen.getByText("Alpha")).toBeVisible();
  });
});
