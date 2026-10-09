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
 * Verifies form focus behavior in the UI package.
 */

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, screen } from "@testing-library/react";
import type { FormEvent } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Combobox } from "../../../src/components/combobox/index.js";
import { Field } from "../../../src/components/field/index.js";
import { Input } from "../../../src/components/input/index.js";
import { Picker } from "../../../src/components/picker/index.js";
import { RadioGroup } from "../../../src/components/radio/index.js";
import { Rating } from "../../../src/components/rating/index.js";
import { Select } from "../../../src/components/select/index.js";
import { renderWithLocale } from "../../test-utils.helper.js";

afterEach(cleanup);

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

  it("renders Select validation feedback through its Field", () => {
    renderWithLocale(
      <form aria-label="环境表单">
        <Field label="环境" required>
          <Select items={selectItems} />
        </Field>
        <button type="submit">提交</button>
      </form>,
    );

    fireEvent.submit(screen.getByRole("form", { name: "环境表单" }));

    const feedback = screen.getByRole("alert");
    expect(feedback).toHaveTextContent("请选择一个选项");
    expect(feedback).toHaveClass("miaixz-field-error");
    expect(screen.getByRole("combobox", { name: /环境/u })).toHaveAttribute(
      "aria-describedby",
      feedback.id,
    );
  });

  it("replaces native validation bubbles with localized Field feedback", () => {
    const onSubmit = vi.fn((event: FormEvent) => event.preventDefault());
    renderWithLocale(
      <form aria-label="名称表单" onSubmit={onSubmit}>
        <Field label="名称" required>
          <Input name="name" />
        </Field>
        <button type="submit">提交</button>
      </form>,
    );
    const form = screen.getByRole("form", { name: "名称表单" });
    const input = screen.getByRole("textbox", { name: /名称/u });
    expect(form).toHaveAttribute("novalidate");

    fireEvent.submit(form);

    expect(onSubmit).not.toHaveBeenCalled();
    expect(input).toHaveFocus();
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("请填写此字段");

    fireEvent.change(input, { target: { value: "高级工程师" } });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    fireEvent.submit(form);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("validates Combobox and Picker through the same Field protocol", () => {
    const onSubmit = vi.fn((event: FormEvent) => event.preventDefault());
    renderWithLocale(
      <form aria-label="集合表单" onSubmit={onSubmit}>
        <Field label="项目" required>
          <Combobox label="项目" options={options} />
        </Field>
        <Field label="成员" required>
          <Picker label="成员" options={options} />
        </Field>
        <button type="submit">提交</button>
      </form>,
    );
    const form = screen.getByRole("form", { name: "集合表单" });
    const project = screen.getByRole("combobox", { name: "项目" });
    const member = screen.getByRole("combobox", { name: "成员" });

    fireEvent.submit(form);

    expect(onSubmit).not.toHaveBeenCalled();
    expect(project).toHaveFocus();
    expect(screen.getAllByRole("alert")).toHaveLength(2);
    expect(project).toHaveAttribute("aria-invalid", "true");
    expect(member).toHaveAttribute("aria-invalid", "true");

    fireEvent.keyDown(project, { key: "ArrowDown" });
    fireEvent.click(screen.getByRole("option", { name: "Alpha" }));
    fireEvent.keyDown(member, { key: "ArrowDown" });
    fireEvent.click(screen.getByRole("option", { name: "Beta" }));

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    fireEvent.submit(form);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("validates RadioGroup as one component-owned form control", () => {
    const onSubmit = vi.fn((event: FormEvent) => event.preventDefault());
    renderWithLocale(
      <form aria-label="级别表单" onSubmit={onSubmit}>
        <RadioGroup
          items={[
            { id: "junior", label: "初级", value: "junior" },
            { id: "senior", label: "高级", value: "senior" },
          ]}
          label="职级"
          name="level"
          required
        />
        <button type="submit">提交</button>
      </form>,
    );
    const form = screen.getByRole("form", { name: "级别表单" });
    const junior = screen.getByRole("radio", { name: "初级" });

    fireEvent.submit(form);

    expect(onSubmit).not.toHaveBeenCalled();
    expect(junior).toHaveFocus();
    expect(junior).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("请填写此字段");

    fireEvent.click(screen.getByRole("radio", { name: "高级" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    fireEvent.submit(form);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("validates a required Rating without a browser-owned bubble", () => {
    const onSubmit = vi.fn((event: FormEvent) => event.preventDefault());
    renderWithLocale(
      <form aria-label="评分表单" onSubmit={onSubmit}>
        <Rating aria-label="服务评分" name="rating" required />
        <button type="submit">提交</button>
      </form>,
    );
    const form = screen.getByRole("form", { name: "评分表单" });
    const firstRating = screen.getAllByRole("radio")[0]!;

    fireEvent.submit(form);

    expect(onSubmit).not.toHaveBeenCalled();
    expect(firstRating).toHaveFocus();
    expect(firstRating).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("请填写此字段");

    fireEvent.click(firstRating);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    fireEvent.submit(form);
    expect(onSubmit).toHaveBeenCalledTimes(1);
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
